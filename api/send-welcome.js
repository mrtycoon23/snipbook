const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_ANON_KEY;
const YCLOUD_KEY = process.env.YCLOUD_API_KEY;
const BOT_NUMBER = process.env.WHATSAPP_PHONE_NUMBER;

export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  const { customerPhone, customerName, salonId, salonName } = req.body;
  if (!customerPhone || !salonId) return res.status(400).json({ error: "Missing fields" });

  try {
    const cleanPhone = customerPhone.replace(/[^0-9]/g, "");
    const phoneWithCode = cleanPhone.startsWith("91") ? cleanPhone : `91${cleanPhone}`;

    // ✅ curr_ session set karo
    await fetch(`${SUPABASE_URL}/rest/v1/bot_sessions`, {
      method: "POST",
      headers: {
        apikey: SUPABASE_KEY,
        Authorization: `Bearer ${SUPABASE_KEY}`,
        "Content-Type": "application/json",
        Prefer: "resolution=merge-duplicates",
      },
      body: JSON.stringify({
        phone: `curr_+${phoneWithCode}`,
        step: "active",
        data: { salonId },
        updated_at: new Date().toISOString(),
      }),
    });

    // ✅ Welcome message bhejo
    await fetch("https://api.ycloud.com/v2/whatsapp/messages", {
      method: "POST",
      headers: { "X-API-Key": YCLOUD_KEY, "Content-Type": "application/json" },
      body: JSON.stringify({
        from: BOT_NUMBER,
        to: `+${phoneWithCode}`,
        type: "text",
        text: { body: `Namaste ${customerName || ""}! 🙏\n\n*${salonName}* mein aapka swagat hai! ✨\n\nApni next appointment book karne ke liye bas *"Hi"* type karein 👇\n\n_Powered by SnipBook_ 💈` },
      }),
    });

    return res.status(200).json({ success: true });
  } catch (err) {
    console.error("send-welcome error:", err.message);
    return res.status(500).json({ error: err.message });
  }
}