export default async function handler(req, res) {
  if (req.method === "POST") {
    const body = req.body;
    
    // YCloud webhook format
    const event = body.event;
    const message = body.message;
    
    if (event === "whatsapp.inbound_message.received") {
      const from = message?.from?.phone;
      const text = message?.content?.text?.toLowerCase();
      
      console.log("Message from:", from, "Text:", text);
      
      // Auto reply
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