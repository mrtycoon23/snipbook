export const config = { maxDuration: 30 };

const YCLOUD_KEY   = process.env.YCLOUD_API_KEY;
const BOT_NUMBER   = process.env.WHATSAPP_PHONE_NUMBER;
const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_ANON_KEY;

// ── Approved Utility Templates ─────────────────────────────────────────────
const TEMPLATES = {
  thankyou: {
    name: "template_utility_20260704234404", // Active ✅ (2 vars: name, salon)
    label: "💬 Thank You",
    vars: (n, s, svc, amt) => [n, s]
  },
  visit_summary: {
    name: "template_utility_20260709181203", // Active ✅ (3 vars: name, salon, service) + "Send My Photos" quick-reply button
    label: "📋 Visit Summary",
    vars: (n, s, svc, amt) => [n, s, svc]
  },
  bill_summary: {
    name: "template_utility_20260708103129", // Active ✅ (4 vars: name, salon, service, amount)
    label: "💰 Bill + Summary",
    vars: (n, s, svc, amt) => [n, s, svc, String(amt || 0)]
  }
};

function normalizePhone(phone) {
  const digits = (phone || "").replace(/\D/g, "");
  if (digits.startsWith("91") && digits.length === 12) return digits;
  if (digits.length === 10) return `91${digits}`;
  return digits;
}

async function sendTemplate(to, templateKey, customerName, salonName, service, amount) {
  const tpl = TEMPLATES[templateKey] || TEMPLATES.thankyou;
  const variables = tpl.vars(
    customerName || "Customer",
    salonName || "Salon",
    service || "Service",
    amount || 0
  ).map(String);

  // Templates were created in YCloud as "English" — the exact language code Meta
  // registered them under may be en, en_US, or en_GB. A mismatch = permanent
  // "translation does not exist" rejection, so try each until one succeeds.
  const LANG_CODES = ["en", "en_US", "en_GB"];
  let lastError = null;

  for (const lang of LANG_CODES) {
    const body = {
      from: BOT_NUMBER,
      to,
      type: "template",
      template: {
        name: tpl.name,
        language: { code: lang },
        components: [
          {
            type: "body",
            parameters: variables.map(text => ({ type: "text", text }))
          }
        ]
      }
    };

    const res = await fetch("https://api.ycloud.com/v2/whatsapp/messages", {
      method: "POST",
      headers: { "X-API-Key": YCLOUD_KEY, "Content-Type": "application/json" },
      body: JSON.stringify(body)
    });
    const data = await res.json().catch(() => ({}));
    console.log(`[send-summary] template=${tpl.name} lang=${lang} status=${res.status} resp=${JSON.stringify(data).slice(0, 300)}`);

    if (res.ok) return { ok: true, error: null, lang };

    lastError = data?.error?.message || data?.message || JSON.stringify(data).slice(0, 200);
    // Only retry with next language if the error looks like a language/translation mismatch
    const errStr = String(lastError).toLowerCase();
    const isLangIssue = errStr.includes("translation") || errStr.includes("language") || errStr.includes("does not exist") || errStr.includes("not found");
    if (!isLangIssue) break; // different error (auth, number, etc.) — retrying won't help
  }

  return { ok: false, error: lastError };
}

async function sendPhoto(to, photoUrl) {
  const res = await fetch("https://api.ycloud.com/v2/whatsapp/messages", {
    method: "POST",
    headers: { "X-API-Key": YCLOUD_KEY, "Content-Type": "application/json" },
    body: JSON.stringify({ from: BOT_NUMBER, to, type: "image", image: { link: photoUrl } })
  });
  return res.ok;
}

async function logToMessageLogs(salonId, phone, message) {
  if (!salonId) return;
  try {
    await fetch(`${SUPABASE_URL}/rest/v1/message_logs`, {
      method: "POST",
      headers: {
        apikey: SUPABASE_KEY,
        Authorization: `Bearer ${SUPABASE_KEY}`,
        "Content-Type": "application/json",
        Prefer: "return=minimal"
      },
      body: JSON.stringify({ salon_id: salonId, phone, direction: "outbound", message, msg_type: "template" })
    });
  } catch(e) { console.error("[send-summary] log error:", e.message); }
}

export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).end();

  const { customerPhone, customerName, salonName, salonId, templateType, visit } = req.body || {};
  if (!customerPhone) return res.status(400).json({ error: "customerPhone required" });

  const to = normalizePhone(customerPhone);
  const tKey = templateType || "thankyou";
  const service = (visit?.services || [])[0] || "";
  const amount = visit?.amount || 0;

  try {
    const result = await sendTemplate(to, tKey, customerName, salonName, service, amount);

    if (result.ok) {
      const logMsg = `Visit summary sent to ${customerName} (${TEMPLATES[tKey]?.label || tKey})`;
      await logToMessageLogs(salonId, to, logMsg);

      const photos = (visit?.photos || []).filter(p => p?.url);
      if (photos.length > 0) {
        // Store as pending — webhook delivers them the moment the customer replies
        // or taps the "Send My Photos" quick-reply button (either opens the 24h window).
        // Key is digits-only (no +) — webhook strips + from inbound `from` to match.
        await fetch(`${SUPABASE_URL}/rest/v1/bot_sessions`, {
          method: "POST",
          headers: { apikey: SUPABASE_KEY, Authorization: `Bearer ${SUPABASE_KEY}`, "Content-Type": "application/json", Prefer: "resolution=merge-duplicates" },
          body: JSON.stringify({ phone: `photos_${to}`, step: "pending_photos", data: { photos, salonId, customerName }, updated_at: new Date().toISOString() })
        }).catch(e => console.error("[send-summary] photo store error:", e.message));

        // Best-effort immediate send — works if a 24h window is already open
        for (const photo of photos) {
          await new Promise(r => setTimeout(r, 700));
          await sendPhoto(to, photo.url);
        }
      }

      return res.status(200).json({ sent: true, method: "template", template: tKey });
    }

    return res.status(502).json({ sent: false, error: result.error || "Template send failed" });
  } catch(e) {
    console.error("[send-summary] error:", e.message);
    return res.status(500).json({ error: e.message });
  }
} 