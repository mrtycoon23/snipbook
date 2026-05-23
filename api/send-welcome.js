const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_ANON_KEY;
const YCLOUD_KEY = process.env.YCLOUD_API_KEY;
const BOT_NUMBER = process.env.WHATSAPP_PHONE_NUMBER;

async function logMessage(salonId, phone, direction, message, msgType = "text", customerName = "") {
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
      body: JSON.stringify({
        salon_id: salonId,
        phone,
        customer_name: customerName || "",
        direction,
        message,
        msg_type: msgType
      })
    });
  } catch(e) { console.error("logMessage error:", e.message); }
}

export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  const { customerPhone, customerName, salonId, salonName } = req.body;
  if (!customerPhone || !salonId) return res.status(400).json({ error: "Missing fields" });

  try {
    const cleanPhone = customerPhone.replace(/[^0-9]/g, "");
    const phoneWithCode = cleanPhone.startsWith("91") ? cleanPhone : `91${cleanPhone}`;

    console.log("send-welcome called:", { phoneWithCode, salonId, salonName });

    // ✅ Pehle purani entry delete karo (both formats)
    await fetch(`${SUPABASE_URL}/rest/v1/bot_sessions?phone=eq.curr_%2B${phoneWithCode}`, {
      method: "DELETE",
      headers: { apikey: SUPABASE_KEY, Authorization: `Bearer ${SUPABASE_KEY}` },
    });
    await fetch(`${SUPABASE_URL}/rest/v1/bot_sessions?phone=eq.curr_${phoneWithCode}`, {
      method: "DELETE",
      headers: { apikey: SUPABASE_KEY, Authorization: `Bearer ${SUPABASE_KEY}` },
    });

    // ✅ Fresh insert
    const sessionRes = await fetch(`${SUPABASE_URL}/rest/v1/bot_sessions`, {
      method: "POST",
      headers: {
        apikey: SUPABASE_KEY,
        Authorization: `Bearer ${SUPABASE_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        phone: `curr_+${phoneWithCode}`,
        step: "active",
        data: { salonId },
        updated_at: new Date().toISOString(),
      }),
    });
    const sessionText = await sessionRes.text();
    console.log("Supabase session result:", sessionRes.status, sessionText);

    // ✅ Welcome message bhejo
    const welcomeText = `Namaste ${customerName || ""}! 🙏\n\n*${salonName}* mein aapka swagat hai! ✨\n\nApni next appointment book karne ke liye bas *"Hi"* type karein 👇\n\n_Powered by SnipBook_ 💈`;

    const msgRes = await fetch("https://api.ycloud.com/v2/whatsapp/messages", {
      method: "POST",
      headers: { "X-API-Key": YCLOUD_KEY, "Content-Type": "application/json" },
      body: JSON.stringify({
        from: BOT_NUMBER,
        to: `+${phoneWithCode}`,
        type: "text",
        text: { body: welcomeText },
      }),
    });
    const msgText = await msgRes.text();
    console.log("YCloud result:", msgRes.status, msgText);

    if (!msgRes.ok) {
      return res.status(500).json({ error: "YCloud send failed", detail: msgText });
    }

    // ✅ Log welcome message
    await logMessage(salonId, `+${phoneWithCode}`, "outbound", welcomeText, "text", customerName || "");

    return res.status(200).json({ success: true });
  } catch (err) {
    console.error("send-welcome error:", err.message);
    return res.status(500).json({ error: err.message });
  }
}