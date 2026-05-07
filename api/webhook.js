// ─── Supabase fetch helper ────────────────────────────────────────────────────
async function getSalonData(salonPhone) {
  const supabaseUrl = process.env.VITE_SUPABASE_URL;
  const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

  // Webhook ka phone number se salon dhundo
  const res = await fetch(
    `${supabaseUrl}/rest/v1/salons?whatsapp_number=eq.${encodeURIComponent(salonPhone)}&limit=1`,
    {
      headers: {
        apikey: supabaseKey,
        Authorization: `Bearer ${supabaseKey}`,
        "Content-Type": "application/json",
      },
    }
  );
  const data = await res.json();
  return data?.[0] || null;
}

// ─── Main handler ─────────────────────────────────────────────────────────────
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

  // Salon ka data Supabase se fetch karo
  const botNumber = process.env.WHATSAPP_PHONE_NUMBER;
  const salon = await getSalonData(`+${botNumber}`).catch(() => null);

  // Agar salon data nahi mila toh fallback use karo
  const salonName = salon?.salon_name || "SnipBook Salon";
  const address = salon?.address || "";
  const mapsLink = salon?.maps_link || "";
  const services = salon?.services || [];
  const openTime = salon?.open_time || 9;
  const closeTime = salon?.close_time || 21;
  const workDays = salon?.working_days || ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
  const phone = salon?.phone || botNumber;

  // User ne list se option chuna
  if (interactiveReply) {
    const reply = handleListReply(interactiveReply, { salonName, address, mapsLink, services, openTime, closeTime, workDays, phone });
    if (reply) await sendTextMessage(from, reply);
    return;
  }

  if (!text) return;

  // Menu trigger words
  const menuTriggers = ["hi", "hello", "hii", "hey", "namaste", "start", "help", "menu", "0", "back", "wapas", "helo"];
  if (menuTriggers.some(word => text === word || text.includes(word))) {
    await sendListMessage(from, salonName);
    return;
  }

  // Kuch aur likha — menu dikhao
  await sendTextMessage(from, "Namaste! 🙏 Neeche se apna option chunein 👇");
  await sendListMessage(from, salonName);
}

// ─── List message ─────────────────────────────────────────────────────────────
async function sendListMessage(to, salonName) {
  const apiKey = process.env.YCLOUD_API_KEY;

  const payload = {
    from: process.env.WHATSAPP_PHONE_NUMBER,
    to,
    type: "interactive",
    interactive: {
      type: "list",
      header: { type: "text", text: `🙏 ${salonName}` },
      body: { text: "Namaste! Aap kya karna chahte hain?\nNeeche se apna option chunein 👇" },
      footer: { text: "Powered by SnipBook" },
      action: {
        button: "Menu Dekho",
        sections: [
          {
            title: "Hamari Services",
            rows: [
              { id: "appointment", title: "📅 Appointment Book Karo", description: "Apna slot abhi book karein" },
              { id: "services",    title: "✂️ Services Dekho",        description: "Hamare sab services aur prices" },
              { id: "timing",      title: "🕐 Salon Timing",          description: "Kab khula rehta hai salon" },
              { id: "contact",     title: "📞 Contact Karo",          description: "Humse seedha baat karein" },
            ],
          },
        ],
      },
    },
  };

  try {
    const response = await fetch("https://api.ycloud.com/v2/whatsapp/messages", {
      method: "POST",
      headers: { "X-API-Key": apiKey, "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    const data = await response.json();
    console.log("List message response:", JSON.stringify(data));
  } catch (err) {
    console.error("List message error:", err);
  }
}

// ─── List reply handler ───────────────────────────────────────────────────────
function handleListReply(optionId, salon) {
  const { salonName, address, mapsLink, services, openTime, closeTime, workDays, phone } = salon;

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

    case "services": {
      if (services && services.length > 0) {
        const activeServices = services.filter(s => s.active !== false);
        const list = activeServices.map(s => `${s.emoji || "✂️"} ${s.name} — ₹${s.price}`).join("\n");
        return `✂️ *Hamare Services*\n\n${list}\n\n_Appointment ke liye menu se option chunein_`;
      }
      // Fallback agar services empty hain
      return `✂️ *Hamare Services*

💈 *Hair*
• Haircut — ₹200 se
• Haircut + Beard — ₹350 se
• Hair Color — ₹800 se

💆 *Skin & Face*
• Facial — ₹400 se
• Cleanup — ₹250 se

💅 *Other*
• Manicure — ₹300 se
• Pedicure — ₹350 se

_Appointment ke liye menu se option chunein_`;
    }

    case "timing": {
      const days = workDays?.join(", ") || "Mon - Sat";
      const open = formatTime(openTime);
      const close = formatTime(closeTime);
      return `🕐 *Salon Timings*

📅 ${days}
⏰ ${open} – ${close}

_Wapas menu ke liye "Hi" type karein_`;
    }

    case "contact": {
      let msg = `📞 *Humse Sampark Karein*\n\n📱 Phone: +91 ${phone}`;
      if (address) msg += `\n📍 Address: ${address}`;
      if (mapsLink) msg += `\n🗺️ Location: ${mapsLink}`;
      msg += `\n\n💬 Is WhatsApp pe directly message kar sakte hain!\n\n_Wapas menu ke liye "Hi" type karein_`;
      return msg;
    }

    default:
      return null;
  }
}

// ─── Helpers ──────────────────────────────────────────────────────────────────
function formatTime(hour) {
  const h = parseInt(hour);
  if (h === 0) return "12:00 AM";
  if (h < 12) return `${h}:00 AM`;
  if (h === 12) return "12:00 PM";
  return `${h - 12}:00 PM`;
}

async function sendTextMessage(to, message) {
  const apiKey = process.env.YCLOUD_API_KEY;
  try {
    const response = await fetch("https://api.ycloud.com/v2/whatsapp/messages", {
      method: "POST",
      headers: { "X-API-Key": apiKey, "Content-Type": "application/json" },
      body: JSON.stringify({
        from: process.env.WHATSAPP_PHONE_NUMBER,
        to,
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