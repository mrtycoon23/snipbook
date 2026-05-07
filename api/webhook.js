const SALON_ID = "ba0e6447-c162-4bc7-b049-fe825121e092";
const SUPABASE_URL = process.env.VITE_SUPABASE_URL;
const SUPABASE_KEY = process.env.VITE_SUPABASE_ANON_KEY;
const YCLOUD_KEY  = process.env.YCLOUD_API_KEY;
const BOT_NUMBER  = process.env.WHATSAPP_PHONE_NUMBER;

// ─── Supabase helpers ─────────────────────────────────────────────────────────
async function getSalon() {
  const r = await fetch(`${SUPABASE_URL}/rest/v1/salons?id=eq.${SALON_ID}&limit=1`, {
    headers: { apikey: SUPABASE_KEY, Authorization: `Bearer ${SUPABASE_KEY}` }
  });
  const d = await r.json();
  return d?.[0] || null;
}

async function getSession(phone) {
  try {
    const r = await fetch(`${SUPABASE_URL}/rest/v1/bot_sessions?phone=eq.${phone}&limit=1`, {
      headers: { apikey: SUPABASE_KEY, Authorization: `Bearer ${SUPABASE_KEY}` }
    });
    const d = await r.json();
    return d?.[0] || null;
  } catch { return null; }
}

async function setSession(phone, step, data = {}) {
  await fetch(`${SUPABASE_URL}/rest/v1/bot_sessions`, {
    method: "POST",
    headers: {
      apikey: SUPABASE_KEY,
      Authorization: `Bearer ${SUPABASE_KEY}`,
      "Content-Type": "application/json",
      Prefer: "resolution=merge-duplicates",
    },
    body: JSON.stringify({ phone, step, data, updated_at: new Date().toISOString() }),
  });
}

async function clearSession(phone) {
  await fetch(`${SUPABASE_URL}/rest/v1/bot_sessions?phone=eq.${phone}`, {
    method: "DELETE",
    headers: { apikey: SUPABASE_KEY, Authorization: `Bearer ${SUPABASE_KEY}` }
  });
}

// ─── YCloud helpers ───────────────────────────────────────────────────────────
async function sendText(to, body) {
  await fetch("https://api.ycloud.com/v2/whatsapp/messages", {
    method: "POST",
    headers: { "X-API-Key": YCLOUD_KEY, "Content-Type": "application/json" },
    body: JSON.stringify({ from: BOT_NUMBER, to, type: "text", text: { body } }),
  });
}

async function sendButtons(to, bodyText, buttons) {
  // Max 3 buttons
  const btns = buttons.slice(0, 3).map(b => ({
    type: "reply",
    reply: { id: b.id, title: b.title.slice(0, 20) }
  }));
  await fetch("https://api.ycloud.com/v2/whatsapp/messages", {
    method: "POST",
    headers: { "X-API-Key": YCLOUD_KEY, "Content-Type": "application/json" },
    body: JSON.stringify({
      from: BOT_NUMBER, to,
      type: "interactive",
      interactive: {
        type: "button",
        body: { text: bodyText },
        action: { buttons: btns }
      }
    }),
  });
}

async function sendList(to, headerText, bodyText, buttonLabel, rows) {
  await fetch("https://api.ycloud.com/v2/whatsapp/messages", {
    method: "POST",
    headers: { "X-API-Key": YCLOUD_KEY, "Content-Type": "application/json" },
    body: JSON.stringify({
      from: BOT_NUMBER, to,
      type: "interactive",
      interactive: {
        type: "list",
        header: { type: "text", text: headerText },
        body: { text: bodyText },
        footer: { text: "Powered by SnipBook" },
        action: {
          button: buttonLabel,
          sections: [{ title: "Options", rows: rows.slice(0, 10) }]
        }
      }
    }),
  });
}

// ─── Main menu ────────────────────────────────────────────────────────────────
async function sendMainMenu(to, salonName) {
  await sendList(to, `🙏 ${salonName}`, "Namaste! Aap kya karna chahte hain?\nNeeche se option chunein 👇", "Menu Dekho", [
    { id: "appointment", title: "📅 Appointment Book Karo", description: "Apna slot abhi book karein" },
    { id: "services",    title: "✂️ Services Dekho",        description: "Hamare sab services aur prices" },
    { id: "timing",      title: "🕐 Salon Timing",          description: "Kab khula rehta hai salon" },
    { id: "contact",     title: "📞 Contact Karo",          description: "Humse seedha baat karein" },
  ]);
}

// ─── Main handler ─────────────────────────────────────────────────────────────
export default async function handler(req, res) {
  if (req.method === "GET") {
    const { "hub.mode": mode, "hub.verify_token": token, "hub.challenge": challenge } = req.query;
    if (mode === "subscribe" && token === process.env.VERIFY_TOKEN) return res.status(200).send(challenge);
    return res.status(403).send("Forbidden");
  }
  if (req.method !== "POST") return res.status(200).json({ status: "ok" });

  const body = req.body;
  if (body.type !== "whatsapp.inbound_message.received") return res.status(200).json({ status: "ok" });

  const msg  = body.whatsappInboundMessage;
  const from = msg?.from;
  const text = msg?.text?.body?.trim();

  // Interactive reply — list or button
  const interactiveId =
    msg?.interactive?.listReply?.id ||
    msg?.interactive?.list_reply?.id ||
    msg?.interactive?.buttonReply?.id ||
    msg?.interactive?.button_reply?.id;

  console.log("From:", from, "Text:", text, "Interactive:", interactiveId);

  if (!from) return res.status(200).json({ status: "ok" });

  // Send 200 first
  res.status(200).json({ status: "ok" });

  try {
    const salon   = await getSalon();
    const session = await getSession(from);

    const salonName = salon?.salon_name   || "SnipBook Salon";
    const services  = (salon?.services    || []).filter(s => s.active !== false);
    const openTime  = salon?.open_time    || 9;
    const closeTime = salon?.close_time   || 21;
    const workDays  = salon?.working_days || ["Mon","Tue","Wed","Thu","Fri","Sat"];
    const address   = salon?.address      || "";
    const mapsLink  = salon?.maps_link    || "";
    const phone     = salon?.phone        || "";

    const step = session?.step || "menu";
    const data = session?.data || {};

    // ── RESET triggers ────────────────────────────────────────────────────────
    const resetTriggers = ["hi","hello","hii","hey","namaste","menu","start","0","wapas","back","helo"];
    if (text && resetTriggers.some(w => text.toLowerCase() === w || text.toLowerCase().includes(w))) {
      await clearSession(from);
      await sendMainMenu(from, salonName);
      return;
    }

    // ── MAIN MENU selection ───────────────────────────────────────────────────
    if (interactiveId === "appointment" || interactiveId === "book") {
      await setSession(from, "ask_name", {});
      await sendText(from, `📅 *Appointment Book Karein*\n\nGreat! Let's book your appointment. 😊\n\n*Aapka naam kya hai?*`);
      return;
    }

    if (interactiveId === "services") {
      const list = services.length > 0
        ? services.map(s => `${s.emoji || "✂️"} *${s.name}* — ₹${s.price}`).join("\n")
        : "✂️ Haircut — ₹250\n✂️ Haircut + Beard — ₹450\n🎨 Hair Colour — ₹1200";
      await sendText(from, `✂️ *Hamare Services*\n\n${list}\n\n_Appointment ke liye menu se "Appointment Book Karo" chunein_`);
      return;
    }

    if (interactiveId === "timing") {
      const days = (workDays || []).join(", ");
      await sendText(from, `🕐 *Salon Timings*\n\n📅 ${days}\n⏰ ${formatTime(openTime)} – ${formatTime(closeTime)}\n\n_Wapas menu ke liye "Hi" type karein_`);
      return;
    }

    if (interactiveId === "contact") {
      let m = `📞 *Humse Sampark Karein*\n\n📱 Phone: +91 ${phone}`;
      if (address)  m += `\n📍 Address: ${address}`;
      if (mapsLink) m += `\n🗺️ Location: ${mapsLink}`;
      m += `\n\n_Wapas menu ke liye "Hi" type karein_`;
      await sendText(from, m);
      return;
    }

    if (interactiveId === "main_menu") {
      await clearSession(from);
      await sendMainMenu(from, salonName);
      return;
    }

    // ── BOOKING FLOW ──────────────────────────────────────────────────────────

    // Step 1: Name collect karo
    if (step === "ask_name") {
      if (!text) {
        await sendText(from, "Kripya apna naam likhein 👇");
        return;
      }
      const name = text;
      await setSession(from, "ask_service", { name });

      // Services as list
      const rows = services.slice(0, 10).map(s => ({
        id: `svc_${s.id}`,
        title: `${s.emoji || "✂️"} ${s.name}`.slice(0, 24),
        description: `₹${s.price} · ${s.duration} min`
      }));

      if (rows.length > 0) {
        await sendList(from, "💇 Service Chunein", `Nice to meet you, *${name}!* 🙌\n\nKonsi service chahiye?`, "Service Dekho", rows);
      } else {
        await sendButtons(from, `Nice to meet you, *${name}!* 🙌\n\nKonsi service chahiye?`, [
          { id: "svc_haircut",  title: "✂️ Haircut ₹250" },
          { id: "svc_beard",    title: "✂️ Haircut+Beard ₹450" },
          { id: "svc_colour",   title: "🎨 Hair Colour ₹1200" },
        ]);
      }
      return;
    }

    // Step 2: Service select hua
    if (step === "ask_service" && interactiveId?.startsWith("svc_")) {
      const svcId = interactiveId.replace("svc_", "");
      const selected = services.find(s => String(s.id) === svcId);
      const serviceName  = selected?.name  || svcId;
      const servicePrice = selected?.price || 0;

      await setSession(from, "ask_date", { ...data, service: serviceName, price: servicePrice });

      // Date options — aaj se agli 5 din
      const days = getNextDays(workDays, 5);
      const rows = days.map(d => ({ id: `date_${d.key}`, title: d.label, description: d.dayName }));

      await sendList(from, "📅 Date Chunein", `*${serviceName}* — ₹${servicePrice}\n\nKaunsa din aapke liye theek hai?`, "Din Dekho", rows);
      return;
    }

    // Step 3: Date select hua
    if (step === "ask_date" && interactiveId?.startsWith("date_")) {
      const dateKey = interactiveId.replace("date_", "");
      await setSession(from, "ask_time", { ...data, date: dateKey });

      // Time slots
      const slots = getTimeSlots(openTime, closeTime);
      const rows  = slots.map(s => ({ id: `time_${s.key}`, title: `🟢 ${s.label}`, description: "Available" }));

      await sendList(from, "🕐 Time Chunein", `📅 *${formatDate(dateKey)}*\n\nKaunsa time slot chahiye?`, "Slot Dekho", rows);
      return;
    }

    // Step 4: Time select hua → Confirm karo
    if (step === "ask_time" && interactiveId?.startsWith("time_")) {
      const timeKey = interactiveId.replace("time_", "");
      await setSession(from, "confirm", { ...data, time: timeKey });

      const confirmMsg =
        `*Aapki booking details:*\n\n` +
        `👤 *Naam:* ${data.name}\n` +
        `✂️ *Service:* ${data.service}\n` +
        `📅 *Date:* ${formatDate(data.date)}\n` +
        `🕐 *Time:* ${formatTime12(timeKey)}\n` +
        `💰 *Price:* ₹${data.price}\n\n` +
        `*Kya confirm karein?*`;

      await sendButtons(from, confirmMsg, [
        { id: "confirm_yes", title: "✅ Haan, Confirm!" },
        { id: "confirm_no",  title: "❌ Cancel" },
      ]);
      return;
    }

    // Step 5: Confirmation
    if (step === "confirm" && interactiveId === "confirm_yes") {
      // Supabase mein appointment save karo
      await fetch(`${SUPABASE_URL}/rest/v1/appointments`, {
        method: "POST",
        headers: {
          apikey: SUPABASE_KEY,
          Authorization: `Bearer ${SUPABASE_KEY}`,
          "Content-Type": "application/json",
          Prefer: "return=minimal",
        },
        body: JSON.stringify({
          salon_id:  SALON_ID,
          service:   data.service,
          amount:    data.price,
          date:      data.date,
          time_slot: data.time,
          status:    "confirmed",
        }),
      });

      await clearSession(from);

      const successMsg =
        `🎉 *Booking Confirmed!*\n\n` +
        `✅ Aapka appointment set ho gaya!\n\n` +
        `👤 ${data.name}\n` +
        `✂️ ${data.service}\n` +
        `📅 ${formatDate(data.date)} at ${formatTime12(data.time)}\n` +
        `💰 ₹${data.price}\n\n` +
        `📲 1 ghante pehle reminder milega.\n\n` +
        `See you soon! 💈`;

      await sendButtons(from, successMsg, [
        { id: "main_menu", title: "🏠 Main Menu" },
      ]);
      return;
    }

    if (step === "confirm" && interactiveId === "confirm_no") {
      await clearSession(from);
      await sendText(from, "Koi baat nahi! 😊\nKabhi bhi appointment book karne ke liye \"Hi\" type karein.");
      await sendMainMenu(from, salonName);
      return;
    }

    // ── DEFAULT — kuch samajh nahi aaya ──────────────────────────────────────
    await clearSession(from);
    await sendMainMenu(from, salonName);

  } catch (err) {
    console.error("Error:", err.message);
  }
}

// ─── Date helpers ─────────────────────────────────────────────────────────────
function getNextDays(workDays, count) {
  const DAY_NAMES = ["Sun","Mon","Tue","Wed","Thu","Fri","Sat"];
  const MONTH_NAMES = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
  const result = [];
  const today = new Date();

  for (let i = 1; result.length < count && i <= 30; i++) {
    const d = new Date(today);
    d.setDate(today.getDate() + i);
    const dayName = DAY_NAMES[d.getDay()];
    if (!workDays || workDays.includes(dayName)) {
      const key   = `${d.getFullYear()}-${pad(d.getMonth()+1)}-${pad(d.getDate())}`;
      const label = i === 1 ? `Tomorrow (${d.getDate()} ${MONTH_NAMES[d.getMonth()]})` : `${dayName}, ${d.getDate()} ${MONTH_NAMES[d.getMonth()]}`;
      result.push({ key, label, dayName });
    }
  }
  return result;
}

function getTimeSlots(open, close) {
  const slots = [];
  for (let h = parseInt(open); h < parseInt(close); h++) {
    slots.push({ key: `${pad(h)}:00`, label: formatTime12(`${pad(h)}:00`) });
    if (h + 0.5 < parseInt(close)) {
      slots.push({ key: `${pad(h)}:30`, label: formatTime12(`${pad(h)}:30`) });
    }
  }
  return slots;
}

function formatDate(dateStr) {
  if (!dateStr) return "";
  const MONTH_NAMES = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
  const [y, m, d] = dateStr.split("-");
  return `${parseInt(d)} ${MONTH_NAMES[parseInt(m)-1]} ${y}`;
}

function formatTime(hour) {
  const h = parseInt(hour);
  if (h === 0)  return "12:00 AM";
  if (h < 12)   return `${h}:00 AM`;
  if (h === 12) return "12:00 PM";
  return `${h - 12}:00 PM`;
}

function formatTime12(timeStr) {
  if (!timeStr) return "";
  const [h, m] = timeStr.split(":").map(Number);
  const h12 = h === 0 ? 12 : h > 12 ? h - 12 : h;
  return `${h12}:${pad(m)} ${h < 12 ? "AM" : "PM"}`;
}

function pad(n) { return String(n).padStart(2, "0"); }