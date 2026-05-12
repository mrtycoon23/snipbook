export const config = { maxDuration: 30 };

const YCLOUD_KEY = process.env.YCLOUD_API_KEY;
const BOT_NUMBER = process.env.WHATSAPP_PHONE_NUMBER;

async function sendText(to, body) {
  try {
    const res = await fetch("https://api.ycloud.com/v2/whatsapp/messages", {
      method: "POST",
      headers: { "X-API-Key": YCLOUD_KEY, "Content-Type": "application/json" },
      body: JSON.stringify({ from: BOT_NUMBER, to, type: "text", text: { body } }),
    });
    const data = await res.json();
    console.log("Sent to", to, "status:", data?.status || res.status);
    return { success: res.ok, data };
  } catch(e) {
    console.error("sendText error:", e.message);
    return { success: false, error: e.message };
  }
}

export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(200).json({ status: "ok" });

  try {
    const { messages } = req.body;
    // messages = [{ phone, name, message }, ...]

    if (!messages || !Array.isArray(messages) || messages.length === 0) {
      return res.status(400).json({ error: "messages array required" });
    }

    const results = [];
    for (const m of messages) {
      const cleanPhone = (m.phone || "").replace(/[^0-9]/g, "");
      if (!cleanPhone || cleanPhone.length < 10) {
        results.push({ name: m.name, success: false, error: "Invalid phone" });
        continue;
      }
      const toPhone = cleanPhone.startsWith("91") ? cleanPhone : `91${cleanPhone}`;
      const msg = (m.message || "").replace(/{name}/g, m.name || "Customer");
      const result = await sendText(toPhone, msg);
      results.push({ name: m.name, phone: toPhone, ...result });
      // Small delay to avoid rate limiting
      if (messages.length > 1) await new Promise(r => setTimeout(r, 300));
    }

    const successCount = results.filter(r => r.success).length;
    return res.status(200).json({ 
      status: "done",
      sent: successCount,
      failed: results.length - successCount,
      results 
    });

  } catch (err) {
    console.error("send-engagement error:", err.message);
    return res.status(500).json({ error: err.message });
  }
}
