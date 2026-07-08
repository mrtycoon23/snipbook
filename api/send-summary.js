export const config = { maxDuration: 30 };

const YCLOUD_KEY  = process.env.YCLOUD_API_KEY;
const BOT_NUMBER  = process.env.WHATSAPP_PHONE_NUMBER; // 918307340281
const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_ANON_KEY;

// Template name from YCloud (the approved utility template)
const THANKYOU_TEMPLATE = "template_utility_20260704234404";

async function logToMessageLogs(salonId, phone, message) {
  try {
    await fetch(`${SUPABASE_URL}/rest/v1/message_logs`, {
      method: "POST",
      headers: {
        apikey: SUPABASE_KEY,
        Authorization: `Bearer ${SUPABASE_KEY}`,
        "Content-Type": "application/json",
        Prefer: "return=minimal"
      },
      body: JSON.stringify({
        salon_id: salonId,
        phone,
        direction: "outbound",
        message,
        msg_type: "template"
      })
    });
  } catch(e) { console.error("[send-summary] log error:", e.message); }
}

async function getSalonId(phone10) {
  try {
    for (const field of ["notification_number", "phone"]) {
      const r = await fetch(
        `${SUPABASE_URL}/rest/v1/salons?${field}=eq.${phone10}&select=id,salon_name&limit=1`,
        { headers: { apikey: SUPABASE_KEY, Authorization: `Bearer ${SUPABASE_KEY}` } }
      );
      const d = await r.json();
      if (d?.[0]?.id) return d[0];
    }
    return null;
  } catch(e) { return null; }
}

function normalizePhone(phone) {
  const digits = (phone || "").replace(/\D/g, "");
  if (digits.startsWith("91") && digits.length === 12) return digits;
  if (digits.length === 10) return `91${digits}`;
  return digits;
}

async function sendTemplate(to, customerName, salonName) {
  const body = {
    from: BOT_NUMBER,
    to,
    type: "whatsapp_template",
    whatsappTemplate: {
      name: THANKYOU_TEMPLATE,
      language: "en",
      components: [
        {
          type: "body",
          parameters: [
            { type: "text", text: customerName || "Customer" },
            { type: "text", text: salonName || "Our Salon" }
          ]
        }
      ]
    }
  };
  const res = await fetch("https://api.ycloud.com/v2/whatsapp/messages", {
    method: "POST",
    headers: { "X-API-Key": YCLOUD_KEY, "Content-Type": "application/json" },
    body: JSON.stringify(body)
  });
  const data = await res.json();
  console.log("[send-summary] template response:", JSON.stringify(data));
  return res.ok;
}

async function sendFreeText(to, customerName, salonName, visit) {
  // Fallback: free-form text (only works within 24h session window)
  const lines = [
    `🙏 *Namaste ${customerName}!*`,
    ``,
    `✂️ *Visit Summary — ${visit.date}*`,
    ``,
    `Service: ${(visit.services || []).join(", ")}`,
    `💰 ₹${visit.amount}`,
    visit.notes ? `📝 ${visit.notes}` : null,
    ``,
    `Thank you for visiting ${salonName}! 💈`
  ].filter(l => l !== null).join("\n");

  const res = await fetch("https://api.ycloud.com/v2/whatsapp/messages", {
    method: "POST",
    headers: { "X-API-Key": YCLOUD_KEY, "Content-Type": "application/json" },
    body: JSON.stringify({ from: BOT_NUMBER, to, type: "text", text: { body: lines } })
  });
  return res.ok;
}

async function sendPhoto(to, photoUrl) {
  const res = await fetch("https://api.ycloud.com/v2/whatsapp/messages", {
    method: "POST",
    headers: { "X-API-Key": YCLOUD_KEY, "Content-Type": "application/json" },
    body: JSON.stringify({
      from: BOT_NUMBER, to,
      type: "image",
      image: { link: photoUrl }
    })
  });
  return res.ok;
}

export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).end();

  const { customerPhone, customerName, salonName, salonId, visit } = req.body || {};
  if (!customerPhone) return res.status(400).json({ error: "customerPhone required" });

  const to = normalizePhone(customerPhone);
  let sent = false;
  let method = "none";
  const resolvedSalonName = salonName || "Salon";

  try {
    const templateSent = await sendTemplate(to, customerName, resolvedSalonName);
    if (templateSent) {
      sent = true;
      method = "template";
      if (salonId) await logToMessageLogs(salonId, to, `Visit summary sent to ${customerName}`);

      const photos = (visit?.photos || []).filter(p => p?.url);
      if (photos.length > 0) {
        for (const photo of photos) {
          await new Promise(r => setTimeout(r, 600));
          await sendPhoto(to, photo.url);
        }
      }
    } else {
      const textSent = await sendFreeText(to, customerName, resolvedSalonName, visit || {});
      if (textSent) {
        sent = true;
        method = "text";
        if (salonId) await logToMessageLogs(salonId, to, `Visit summary sent to ${customerName}`);
      }
    }
  } catch (e) {
    console.error("[send-summary] error:", e.message);
    return res.status(500).json({ error: e.message });
  }

  return res.status(sent ? 200 : 502).json({ sent, method });
}
 