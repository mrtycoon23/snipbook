const SALON_ID = "ba0e6447-c162-4bc7-b049-fe825121e092";

async function getSalonData() {
  const supabaseUrl = process.env.VITE_SUPABASE_URL;
  const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;
  try {
    const res = await fetch(
      `${supabaseUrl}/rest/v1/salons?id=eq.${SALON_ID}&limit=1`,
      {
        headers: {
          apikey: supabaseKey,
          Authorization: `Bearer ${supabaseKey}`,
          "Content-Type": "application/json",
        },
      }
    );
    const data = await res.json();
    console.log("Salon fetched:", JSON.stringify(data?.[0]));
    return data?.[0] || null;
  } catch (e) {
    console.error("Supabase error:", e);
    return null;
  }
}

export default async function handler(req, res) {
  // GET request — webhook verify
  if (req.method === "GET") {
    const mode = req.query["hub.mode"];
    const token = req.query["hub.verify_token"];
    const challenge = req.query["hub.challenge"];
    if (mode === "subscribe" && token === process.env.VERIFY_TOKEN) {
      return res.status(200).send(challenge);
    }
    return res.status(403).send("Forbidden");
  }

  // POST request — message aaya
  if (req.method !== "POST") {
    return res.status(200).json({ status: "ok" });
  }

  const body = req.body;

  if (body.type !== "whatsapp.inbound_message.received") {
    return res.status(200).json({ status: "ok" });
  }

  const msg = body.whatsappInboundMessage;
  const from = msg?.from;
  const text = msg?.text?.body?.trim().toLowerCase();
  const interactiveReply = msg?.interactive?.listReply?.id;

  console.log("From:", from, "Text:", text, "Interactive:", interactiveReply);

  if (!from) {
    return res.status(200).json({ status: "ok" });
  }

  // Pehle 200 bhejo YCloud ko — timeout avoid karne ke liye
  res.status(200).json({ status: "ok" });

  // Ab baaki kaam karo
  try {
    const salon = await getSalonData();

    const salonName = salon?.salon_name   || "SnipBook Salon";
    const address   = salon?.address      || "";
    const mapsLink  = salon?.maps_link    || "";
    const services  = salon?.services     || [];
    const openTime  = salon?.open_time    || 9;
    const closeTime = salon?.close_time   || 21;
    const workDays  = salon?.working_days || ["Mon","Tue","Wed","Thu","Fri","Sat"];
    const phone     = salon?.phone        || "";

    if (interactiveReply) {
      const reply = handleListReply(interactiveReply, { salonName, address, mapsLink, services, openTime, closeTime, workDays, phone });
      if (reply) await sendTextMessage(from, reply);
      return;
    }

    if (!text) return;

    const menuTriggers = ["hi","hello","hii","hey","namaste","start","help","menu","0","back","wapas","helo"];
    if (menuTriggers.some(w => text === w || text.includes(w))) {
      await sendListMessage(from, salonName);
      return;
    }

    // Default — kuch bhi likha
    await sendTextMessage(from, "Namaste! 🙏 Neeche se apna option chunein 👇");
    await sendListMessage(from, salonName);

  } catch (err) {
    console.error("Handler error:", err);
  }
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
      body:   { text: "Namaste! Aap kya karna chahte hain?\nNeeche se apna option chunein 👇" },
      footer: { text: "Powered by SnipBook" },
      action: {
        button: "Menu Dekho",
        sections: [{
          title: "Hamari Services",
          rows: [
            { id: "appointment", title: "📅 Appointment Book Karo", description: "Apna slot abhi book karein" },
            { id: "services",    title: "✂️ Services Dekho",        description: "Hamare sab services aur prices" },
            { id: "timing",      title: "🕐 Salon Timing",          description: "Kab khula rehta hai salon" },
            { id: "contact",     title: "📞 Contact Karo",          description: "Humse seedha baat karein" },
          ],
        }],
      },
    },
  };
  try {
    const r = await fetch("https://api.ycloud.com/v2/whatsapp/messages", {
      method: "POST",
      headers: { "X-API-Key": apiKey, "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    const d = await r.json();
    console.log("List msg:", JSON.stringify(d));
  } catch (e) {
    console.error("List msg error:", e);
  }
}

// ─── List reply ───────────────────────────────────────────────────────────────
function handleListReply(optionId, salon) {
  const { address, mapsLink, services, openTime, closeTime, workDays, phone } = salon;

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
      const active = (services || []).filter(s => s.active !== false);
      if (active.length > 0) {
        const list = active.map(s => `${s.emoji || "✂️"} ${s.name} — ₹${s.price}`).join("\n");
        return `✂️ *Hamare Services*\n\n${list}\n\n_Appointment ke liye menu se option chunein_`;
      }
      return `✂️ *Hamare Services*

💈 Haircut — ₹200 se
💈 Haircut + Beard — ₹350 se
🎨 Hair Color — ₹800 se
💆 Facial — ₹400 se
💅 Manicure — ₹300 se

_Appointment ke liye menu se option chunein_`;
    }

    case "timing": {
      const days  = (workDays || []).join(", ") || "Mon - Sat";
      const open  = formatTime(openTime);
      const close = formatTime(closeTime);
      return `🕐 *Salon Timings*

📅 ${days}
⏰ ${open} – ${close}

_Wapas menu ke liye "Hi" type karein_`;
    }

    case "contact": {
      let m = `📞 *Humse Sampark Karein*\n\n📱 Phone: +91 ${phone}`;
      if (address)  m += `\n📍 Address: ${address}`;
      if (mapsLink) m += `\n🗺️ Location: ${mapsLink}`;
      m += `\n\n💬 Is WhatsApp pe directly message kar sakte hain!\n\n_Wapas menu ke liye "Hi" type karein_`;
      return m;
    }

    default: return null;
  }
}

function formatTime(hour) {
  const h = parseInt(hour);
  if (h === 0)  return "12:00 AM";
  if (h < 12)   return `${h}:00 AM`;
  if (h === 12) return "12:00 PM";
  return `${h - 12}:00 PM`;
}

async function sendTextMessage(to, message) {
  const apiKey = process.env.YCLOUD_API_KEY;
  try {
    const r = await fetch("https://api.ycloud.com/v2/whatsapp/messages", {
      method: "POST",
      headers: { "X-API-Key": apiKey, "Content-Type": "application/json" },
      body: JSON.stringify({
        from: process.env.WHATSAPP_PHONE_NUMBER,
        to,
        type: "text",
        text: { body: message },
      }),
    });
    const d = await r.json();
    console.log("Text msg:", JSON.stringify(d));
  } catch (e) {
    console.error("Text msg error:", e);
  }
}