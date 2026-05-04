export default async function handler(req, res) {
  if (req.method === "GET") {
    const mode = req.query["hub.mode"];
    const token = req.query["hub.verify_token"];
    const challenge = req.query["hub.challenge"];

    if (mode === "subscribe" && token === process.env.VERIFY_TOKEN) {
      return res.status(200).send(challenge);
    }
    return res.status(403).send("Forbidden");
  }

  if (req.method === "POST") {
    const body = req.body;

    if (body.object === "whatsapp_business_account") {
      body.entry?.forEach((entry) => {
        entry.changes?.forEach((change) => {
          const messages = change.value?.messages;
          if (messages) {
            messages.forEach(async (msg) => {
              const from = msg.from;
              const text = msg.text?.body?.toLowerCase();
              console.log("Message from:", from, "Text:", text);

              // Auto reply
              await sendWhatsAppMessage(from, "Namaste! 🙏 SnipBook mein aapka swagat hai. Appointment book karne ke liye '1' type karein.");
            });
          }
        });
      });
    }
    return res.status(200).json({ status: "ok" });
  }
}

async function sendWhatsAppMessage(to, message) {
  const token = process.env.WHATSAPP_TOKEN;
  const phoneId = process.env.WHATSAPP_PHONE_NUMBER_ID;

  await fetch(`https://graph.facebook.com/v18.0/${phoneId}/messages`, {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      messaging_product: "whatsapp",
      to: to,
      type: "text",
      text: { body: message },
    }),
  });
}