export default async function handler(req, res) {
  if (req.method === "POST") {
    const body = req.body;

    if (body.type === "whatsapp.inbound_message.received") {
      const msg = body.whatsappInboundMessage;
      const from = msg?.from;
      const text = msg?.text?.body?.toLowerCase();

      console.log("Message from:", from, "Text:", text);

      if (from) {
        await sendWhatsAppMessage(from, "Namaste! 🙏 SnipBook mein aapka swagat hai. Appointment book karne ke liye '1' type karein.");
      }
    }

    return res.status(200).json({ status: "ok" });
  }
  return res.status(200).json({ status: "ok" });
}

async function sendWhatsAppMessage(to, message) {
  const apiKey = process.env.YCLOUD_API_KEY;

  await fetch("https://api.ycloud.com/v2/whatsapp/messages", {
    method: "POST",
    headers: {
      "X-API-Key": apiKey,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from: process.env.WHATSAPP_PHONE_NUMBER,
      to: to,
      type: "text",
      text: { body: message },
    }),
  });
}