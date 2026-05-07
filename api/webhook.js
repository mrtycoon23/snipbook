export default async function handler(req, res) {
  // Cold start fix — pehle 200 bhejo
  res.status(200).json({ status: "ok" });

  if (req.method !== "POST") return;

  const body = req.body;
  if (body.type !== "whatsapp.inbound_message.received") return;

  const msg = body.whatsappInboundMessage;
  const from = msg?.from;
  const text = msg?.text?.body?.trim().toLowerCase();
  const interactiveReply = msg?.interactive?.listReply?.id;

  if (!from) return;

  console.log("From:", from, "Text:", text, "Interactive:", interactiveReply);

  // User ne list se option chuna
  if (interactiveReply) {
    const reply = handleListReply(interactiveReply);
    if (reply) await sendTextMessage(from, reply);
    return;
  }

  if (!text) return;

  // Menu trigger words
  const menuTriggers = ["hi", "hello", "hii", "hey", "namaste", "start", "help", "menu", "0", "back", "wapas", "helo"];
  if (menuTriggers.some(word => text === word || text.includes(word))) {
    await sendListMessage(from);
    return;
  }

  // Kuch aur likha — menu dikhao
  await sendTextMessage(from, "Namaste! 🙏 Neeche se apna option chunein 👇");
  await sendListMessage(from);
}

// List message — dropdown style
async function sendListMessage(to) {
  const apiKey = process.env.YCLOUD_API_KEY;

  const payload = {
    from: process.env.WHATSAPP_PHONE_NUMBER,
    to: to,
    type: "interactive",
    interactive: {
      type: "list",
      header: {
        type: "text",
        text: "🙏 SnipBook Salon"
      },
      body: {
        text: "Namaste! Aap kya karna chahte hain?\nNeeche se apna option chunein 👇"
      },
      footer: {
        text: "Powered by SnipBook"
      },
      action: {
        button: "Menu Dekho",
        sections: [
          {
            title: "Hamari Services",
            rows: [
              {
                id: "appointment",
                title: "📅 Appointment Book Karo",
                description: "Apna slot abhi book karein"
              },
              {
                id: "services",
                title: "✂️ Services Dekho",
                description: "Hamare sab services aur prices"
              },
              {
                id: "timing",
                title: "🕐 Salon Timing",
                description: "Kab khula rehta hai salon"
              },
              {
                id: "contact",
                title: "📞 Contact Karo",
                description: "Humse seedha baat karein"
              }
            ]
          }
        ]
      }
    }
  };

  try {
    const response = await fetch("https://api.ycloud.com/v2/whatsapp/messages", {
      method: "POST",
      headers: {
        "X-API-Key": apiKey,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });
    const data = await response.json();
    console.log("List message response:", JSON.stringify(data));
  } catch (err) {
    console.error("List message error:", err);
  }
}

// User ne list se jo chuna uska reply
function handleListReply(optionId) {
  switch (optionId) {
    case "appointment":
      return `📅 *Appointment Book Karein*

Kripya yeh details yahan bhejein:

👤 Aapka naam
📞 Phone number
✂️ Service (e.g. Haircut, Facial)
📆 Date aur Time

Hamare staff jaldi confirm karenge! ✅

_Wapas menu ke liye "Hi" type karein_`;

    case "services":
      return `✂️ *Hamare Services*

💈 *Hair*
• Haircut — ₹150 se
• Hair Color — ₹500 se
• Smoothening — ₹2000 se

💆 *Skin & Face*
• Facial — ₹400 se
• Cleanup — ₹250 se
• Bleach — ₹200 se

💅 *Other*
• Manicure — ₹300 se
• Pedicure — ₹350 se
• Waxing — ₹150 se

_Appointment ke liye menu se option chunein_`;

    case "timing":
      return `🕐 *Salon Timings*

📅 Monday – Saturday
⏰ 10:00 AM – 8:00 PM

📅 Sunday
⏰ 11:00 AM – 6:00 PM

_Wapas menu ke liye "Hi" type karein_`;

    case "contact":
      return `📞 *Humse Sampark Karein*

📱 Phone: +91 83073 40281
📍 Location: https://maps.google.com/?q=Connaught+Place,+New+Delhi

💬 Is WhatsApp pe directly message kar sakte hain!

_Wapas menu ke liye "Hi" type karein_`;

    default:
      return null;
  }
}

// Simple text message
async function sendTextMessage(to, message) {
  const apiKey = process.env.YCLOUD_API_KEY;
  try {
    const response = await fetch("https://api.ycloud.com/v2/whatsapp/messages", {
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
    const data = await response.json();
    console.log("Text message response:", JSON.stringify(data));
  } catch (err) {
    console.error("Text message error:", err);
  }
}
