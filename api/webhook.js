export const config = { maxDuration: 30 };

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_ANON_KEY;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const YCLOUD_KEY   = process.env.YCLOUD_API_KEY;
const BOT_NUMBER   = process.env.WHATSAPP_PHONE_NUMBER;
const RESEND_KEY   = process.env.RESEND_API_KEY;
const OWNER_EMAIL  = process.env.OWNER_EMAIL;

function pad(n) { return String(n).padStart(2, "0"); }

function getISTNow() {
  return new Date(new Date().getTime() + 5.5 * 60 * 60 * 1000);
}

function getTodayKeyIST() {
  const ist = getISTNow();
  return `${ist.getUTCFullYear()}-${pad(ist.getUTCMonth()+1)}-${pad(ist.getUTCDate())}`;
}

function getNextDays(workDays, count) {
  const DN = ["Sun","Mon","Tue","Wed","Thu","Fri","Sat"];
  const MN = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
  const result = [];
  const istNow = getISTNow();
  const today = new Date(istNow.getUTCFullYear(), istNow.getUTCMonth(), istNow.getUTCDate());
  for (let i = 0; result.length < count && i <= 60; i++) {
    const d = new Date(today);
    d.setDate(today.getDate() + i);
    const dayName = DN[d.getDay()];
    if (!workDays || workDays.includes(dayName)) {
      const key = `${d.getFullYear()}-${pad(d.getMonth()+1)}-${pad(d.getDate())}`;
      const label = i === 0 ? `Aaj (${d.getDate()} ${MN[d.getMonth()]})`
        : i === 1 ? `Kal (${d.getDate()} ${MN[d.getMonth()]})`
        : `${dayName}, ${d.getDate()} ${MN[d.getMonth()]}`;
      result.push({ key, label, dayName });
    }
  }
  return result;
}

function getTimeSlots(open, close, selectedDate = null) {
  const slots = [];
  const istNow = getISTNow();
  const isToday = selectedDate === getTodayKeyIST();
  const currentMinutes = istNow.getUTCHours() * 60 + istNow.getUTCMinutes();
  for (let h = open; h < close; h++) {
    if (!isToday || h * 60 > currentMinutes + 30)
      slots.push({ key: `${pad(h)}:00`, label: formatTime12(`${pad(h)}:00`) });
    if (!isToday || h * 60 + 30 > currentMinutes + 30)
      slots.push({ key: `${pad(h)}:30`, label: formatTime12(`${pad(h)}:30`) });
  }
  return slots;
}

function parseCustomDate(text) {
  const MN = { jan:1,feb:2,mar:3,apr:4,may:5,jun:6,jul:7,aug:8,sep:9,oct:10,nov:11,dec:12,
    january:1,february:2,march:3,april:4,june:6,july:7,august:8,september:9,october:10,november:11,december:12 };
  const t = text.toLowerCase().trim();
  const m = t.match(/(\d{1,2})\s+([a-z]+)(?:\s+(\d{4}))?/);
  if (!m) return null;
  const day = parseInt(m[1]), month = MN[m[2]];
  if (!month || day < 1 || day > 31) return null;
  return `${m[3] || new Date().getFullYear()}-${pad(month)}-${pad(day)}`;
}

function formatDate(dateStr) {
  if (!dateStr) return "";
  const MN = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
  const [y, m, d] = dateStr.split("-");
  return `${parseInt(d)} ${MN[parseInt(m)-1]} ${y}`;
}

function formatTime(hour) {
  const h = parseInt(hour);
  if (h === 0) return "12:00 AM";
  if (h < 12) return `${h}:00 AM`;
  if (h === 12) return "12:00 PM";
  return `${h-12}:00 PM`;
}

function formatTime12(timeStr) {
  if (!timeStr) return "";
  const [h, m] = timeStr.split(":").map(Number);
  const h12 = h === 0 ? 12 : h > 12 ? h-12 : h;
  return `${h12}:${pad(m)} ${h < 12 ? "AM" : "PM"}`;
}

function sessionKey(phone, salonId) { return `${salonId}_${phone}`; }

async function logMessage(salonId, phone, direction, message, msgType = "text", customerName = "") {
  if (!salonId) return;
  try {
    await fetch(`${SUPABASE_URL}/rest/v1/message_logs`, {
      method: "POST",
      headers: { apikey: SUPABASE_KEY, Authorization: `Bearer ${SUPABASE_KEY}`, "Content-Type": "application/json", Prefer: "return=minimal" },
      body: JSON.stringify({ salon_id: salonId, phone, customer_name: customerName || "", direction, message, msg_type: msgType })
    });
  } catch(e) { console.error("logMessage error:", e.message); }
}

async function getSession(key) {
  try {
    const r = await fetch(`${SUPABASE_URL}/rest/v1/bot_sessions?phone=eq.${encodeURIComponent(key)}&limit=1`, { headers: { apikey: SUPABASE_KEY, Authorization: `Bearer ${SUPABASE_KEY}` } });
    const d = await r.json();
    return d?.[0] || null;
  } catch(e) { return null; }
}

async function setSession(key, step, data = {}) {
  try {
    await fetch(`${SUPABASE_URL}/rest/v1/bot_sessions`, {
      method: "POST",
      headers: { apikey: SUPABASE_KEY, Authorization: `Bearer ${SUPABASE_KEY}`, "Content-Type": "application/json", Prefer: "resolution=merge-duplicates" },
      body: JSON.stringify({ phone: key, step, data, updated_at: new Date().toISOString() }),
    });
  } catch(e) { console.error("setSession error:", e.message); }
}

async function clearSession(key) {
  try {
    await fetch(`${SUPABASE_URL}/rest/v1/bot_sessions?phone=eq.${encodeURIComponent(key)}`, { method: "DELETE", headers: { apikey: SUPABASE_KEY, Authorization: `Bearer ${SUPABASE_KEY}` } });
  } catch(e) {}
}

async function getSalonByKeyword(keyword) {
  if (!keyword) return null;
  try {
    const r = await fetch(`${SUPABASE_URL}/rest/v1/salons?select=*`, { headers: { apikey: SUPABASE_KEY, Authorization: `Bearer ${SUPABASE_KEY}` } });
    const allSalons = await r.json();
    const textLower = keyword.toLowerCase().trim();
    return (allSalons || []).find(s => s.bot_keyword && textLower.includes(s.bot_keyword.toLowerCase())) || null;
  } catch(e) { return null; }
}

async function getSalonById(id) {
  try {
    const r = await fetch(`${SUPABASE_URL}/rest/v1/salons?id=eq.${id}&limit=1`, { headers: { apikey: SUPABASE_KEY, Authorization: `Bearer ${SUPABASE_KEY}` } });
    const d = await r.json();
    return d?.[0] || null;
  } catch(e) { return null; }
}

async function getSalonByName(text) {
  if (!text) return null;
  try {
    const r = await fetch(`${SUPABASE_URL}/rest/v1/salons?select=*`, { headers: { apikey: SUPABASE_KEY, Authorization: `Bearer ${SUPABASE_KEY}` } });
    const allSalons = await r.json();
    const textLower = text.toLowerCase();
    return allSalons?.find(s => s.salon_name && textLower.includes(s.salon_name.toLowerCase())) || null;
  } catch(e) { return null; }
}

async function getBookedSlots(salonId, date) {
  try {
    const r = await fetch(`${SUPABASE_URL}/rest/v1/appointments?salon_id=eq.${salonId}&date=eq.${date}&status=eq.confirmed`, { headers: { apikey: SUPABASE_KEY, Authorization: `Bearer ${SUPABASE_KEY}` } });
    const d = await r.json();
    return (d || []).map(a => a.time_slot);
  } catch(e) { return []; }
}

// ─── GET UPCOMING BOOKING ─────────────────────────────────────────────────────
async function getUpcomingBooking(salonId, phone) {
  try {
    const today = getTodayKeyIST();
    const fromWithPlus = phone.startsWith("+") ? phone : `+${phone}`;
    const fromClean = phone.replace(/^\+/, "");
    for (const ph of [fromWithPlus, fromClean]) {
      const r = await fetch(
        `${SUPABASE_URL}/rest/v1/appointments?salon_id=eq.${salonId}&customer_phone=eq.${encodeURIComponent(ph)}&status=eq.confirmed&date=gte.${today}&order=date.asc,time_slot.asc&limit=1`,
        { headers: { apikey: SUPABASE_KEY, Authorization: `Bearer ${SUPABASE_KEY}` } }
      );
      const d = await r.json();
      if (d?.[0]) return d[0];
    }
    return null;
  } catch(e) { return null; }
}
// ─────────────────────────────────────────────────────────────────────────────

async function sendText(to, body, salonId = null, customerName = "") {
  try {
    await fetch("https://api.ycloud.com/v2/whatsapp/messages", { method: "POST", headers: { "X-API-Key": YCLOUD_KEY, "Content-Type": "application/json" }, body: JSON.stringify({ from: BOT_NUMBER, to, type: "text", text: { body } }) });
    if (salonId) await logMessage(salonId, to, "outbound", body, "text", customerName);
  } catch(e) { console.error("sendText error:", e.message); }
}

async function sendButtons(to, bodyText, buttons, salonId = null, customerName = "") {
  try {
    const btns = buttons.slice(0, 3).map(b => ({ type: "reply", reply: { id: b.id, title: b.title.slice(0, 20) } }));
    await fetch("https://api.ycloud.com/v2/whatsapp/messages", { method: "POST", headers: { "X-API-Key": YCLOUD_KEY, "Content-Type": "application/json" }, body: JSON.stringify({ from: BOT_NUMBER, to, type: "interactive", interactive: { type: "button", body: { text: bodyText }, action: { buttons: btns } } }) });
    if (salonId) await logMessage(salonId, to, "outbound", bodyText, "interactive", customerName);
  } catch(e) { console.error("sendButtons error:", e.message); }
}

async function sendList(to, headerText, bodyText, buttonLabel, rows, footerText = "Powered by SnipBook", salonId = null, customerName = "") {
  try {
    await fetch("https://api.ycloud.com/v2/whatsapp/messages", { method: "POST", headers: { "X-API-Key": YCLOUD_KEY, "Content-Type": "application/json" }, body: JSON.stringify({ from: BOT_NUMBER, to, type: "interactive", interactive: { type: "list", header: { type: "text", text: headerText }, body: { text: bodyText }, footer: { text: footerText }, action: { button: buttonLabel, sections: [{ title: "Options", rows: rows.slice(0, 10) }] } } }) });
    if (salonId) await logMessage(salonId, to, "outbound", `[List] ${headerText}: ${bodyText}`, "interactive", customerName);
  } catch(e) { console.error("sendList error:", e.message); }
}

async function sendMainMenu(to, salonName, salonId = null) {
  await sendList(to, `🙏 ${salonName}`,
    `Namaste! Aap kya karna chahte hain?\nNeeche se option chunein 👇`, "Menu Dekho",
    [
      { id: "appointment", title: "📅 Appointment Book Karo", description: "Apna slot abhi book karein" },
      { id: "my_booking",  title: "📋 Meri Booking",          description: "Cancel ya reschedule karein" },
      { id: "services",    title: "✂️ Services Dekho",         description: "Hamare sab services aur prices" },
      { id: "timing",      title: "🕐 Salon Timing",           description: "Kab khula rehta hai salon" },
      { id: "contact",     title: "📞 Contact Karo",           description: "Humse seedha baat karein" },
    ],
    "Powered by SnipBook", salonId
  );
}

async function sendDateList(to, data, workDays, salonId = null) {
  const days = getNextDays(workDays, 9);
  const rows = days.map(d => ({ id: `date_${d.key}`, title: d.label, description: d.dayName }));
  rows.push({ id: "date_custom", title: "📅 Koi Aur Date", description: "Khud date likhein" });
  const priceText = data.price > 0 ? ` — ₹${data.price}` : "";
  await sendList(to, "📅 Date Chunein", `*${data.service}*${priceText}\n\nKaunsa din aapke liye theek hai?`, "Din Dekho", rows, "Powered by SnipBook", salonId, data.name);
}

async function sendStepHint(to, step, salonId = null) {
  const hints = { ask_name:`Aapka naam type karein 👇`, ask_gender:`Upar se Male ya Female chunein 👆`, ask_service:`Service list mein se chunein 👆`, ask_date:`Date list mein se chunein 👆`, ask_date_custom:`Date likhein jaise: *25 May* ya *3 June* 📅`, ask_time_part:`Morning ya Evening chunein 👆`, ask_time:`Time slot chunein 👆`, confirm:`Confirm karne ke liye button dabayein 👆`, browse_services_gender:`Male ya Female chunein 👆`, browse_services_list:`Service chunein 👆` };
  const hint = hints[step];
  if (hint) await sendText(to, `_${hint}_\n\n_Wapas menu ke liye "Hi" type karein_`, salonId);
}

async function sendNoLinkMessage(to) {
  await sendText(to, `Namaste! 🙏\n\nAppoint book karne ke liye apne salon ka *booking link* use karein.\n\n_Salon owner se WhatsApp booking link maangein aur us link se message karein_ 😊`);
}

async function sendBookingEmail({ ownerEmail, customerEmail, salonName, customerName, service, date, time, price, customerPhone }) {
  if (!RESEND_KEY) return;
  const priceText = price > 0 ? `₹${price}` : "Price on visit";
  const ownerHtml = `<div style="font-family:sans-serif;max-width:500px;margin:auto;border:1px solid #eee;border-radius:12px;overflow:hidden"><div style="background:#1a1a2e;padding:20px;text-align:center"><h2 style="color:#fff;margin:0">✂️ SnipBook</h2><p style="color:#aaa;margin:4px 0">${salonName}</p></div><div style="padding:24px"><h3 style="color:#1a1a2e">🔔 Naya Appointment!</h3><table style="width:100%;border-collapse:collapse"><tr><td style="padding:8px 0;color:#666;width:40%">👤 Customer</td><td style="padding:8px 0;font-weight:bold">${customerName}</td></tr><tr><td style="padding:8px 0;color:#666">📱 Phone</td><td style="padding:8px 0">${customerPhone}</td></tr><tr><td style="padding:8px 0;color:#666">✂️ Service</td><td style="padding:8px 0;font-weight:bold">${service}</td></tr><tr><td style="padding:8px 0;color:#666">📅 Date</td><td style="padding:8px 0">${formatDate(date)}</td></tr><tr><td style="padding:8px 0;color:#666">🕐 Time</td><td style="padding:8px 0">${formatTime12(time)}</td></tr><tr><td style="padding:8px 0;color:#666">💰 Amount</td><td style="padding:8px 0;color:#27ae60;font-weight:bold">${priceText}</td></tr></table><p style="color:#888;font-size:12px;margin-top:20px">SnipBook se auto-booked 💈</p></div></div>`;
  const customerHtml = `<div style="font-family:sans-serif;max-width:500px;margin:auto;border:1px solid #eee;border-radius:12px;overflow:hidden"><div style="background:#1a1a2e;padding:20px;text-align:center"><h2 style="color:#fff;margin:0">✂️ SnipBook</h2><p style="color:#aaa;margin:4px 0">${salonName}</p></div><div style="padding:24px"><h3 style="color:#1a1a2e">🎉 Booking Confirmed, ${customerName}!</h3><table style="width:100%;border-collapse:collapse"><tr><td style="padding:8px 0;color:#666;width:40%">✂️ Service</td><td style="padding:8px 0;font-weight:bold">${service}</td></tr><tr><td style="padding:8px 0;color:#666">📅 Date</td><td style="padding:8px 0">${formatDate(date)}</td></tr><tr><td style="padding:8px 0;color:#666">🕐 Time</td><td style="padding:8px 0">${formatTime12(time)}</td></tr><tr><td style="padding:8px 0;color:#666">💰 Amount</td><td style="padding:8px 0;color:#27ae60;font-weight:bold">${priceText}</td></tr></table><p style="margin-top:20px">Aapko 1 ghante pehle WhatsApp reminder bhi milega! 📲</p><p style="color:#888;font-size:12px">See you soon! 💈</p></div></div>`;
  const emails = [];
  if (ownerEmail) emails.push({ to: ownerEmail, subject: `🔔 Naya Appointment — ${customerName} (${salonName})`, html: ownerHtml });
  if (customerEmail) emails.push({ to: customerEmail, subject: `✅ Booking Confirmed — ${salonName}`, html: customerHtml });
  for (const e of emails) {
    try { await fetch("https://api.resend.com/emails", { method: "POST", headers: { Authorization: `Bearer ${RESEND_KEY}`, "Content-Type": "application/json" }, body: JSON.stringify({ from: "SnipBook <noreply@snipbook.in>", ...e }) }); }
    catch(err) { console.error("Email send error:", err.message); }
  }
}

export default async function handler(req, res) {
  if (req.method === "GET") {
    const { "hub.mode": mode, "hub.verify_token": token, "hub.challenge": challenge } = req.query;
    if (mode === "subscribe" && token === process.env.VERIFY_TOKEN) { res.status(200).send(challenge); } else { res.status(403).send("Forbidden"); }
    return;
  }

  if (req.method !== "POST") { res.status(200).json({ status: "ok" }); return; }

  const body = req.body;
  if (body.type !== "whatsapp.inbound_message.received") { res.status(200).json({ status: "ok" }); return; }

  const msg = body.whatsappInboundMessage;
  const from = msg?.from;
  const msgId = msg?.id || "";
  const text = msg?.text?.body?.trim();
  const interactiveId = msg?.interactive?.listReply?.id || msg?.interactive?.list_reply?.id || msg?.interactive?.buttonReply?.id || msg?.interactive?.button_reply?.id;

  if (!from) { res.status(200).json({ status: "ok" }); return; }

  try {
    if (msgId) {
      const processed = await getSession(`dup_${msgId}`);
      if (processed) { res.status(200).json({ status: "ok" }); return; }
      await setSession(`dup_${msgId}`, "done", { ts: Date.now() });
    }

    let salon = null, sKey = null, session = null;

    const resetWords = ["hi","hello","hii","hey","namaste","menu","start","wapas","back","helo","namaskar"];
    const isResetWord = text && resetWords.includes(text.toLowerCase());
    const isKeyword = text && !isResetWord ? await getSalonByKeyword(text) : null;
    const isSalonName = (!isKeyword && text && !isResetWord) ? await getSalonByName(text) : null;
    const effectiveMatch = isKeyword || isSalonName;

    if (effectiveMatch) {
      salon = effectiveMatch;
      await setSession(`curr_${from}`, "active", { salonId: salon.id });
      sKey = sessionKey(from, salon.id);
      session = await getSession(sKey);
    }

    if (!salon) {
      const currSession = await getSession(`curr_${from}`);
      if (currSession?.data?.salonId) {
        salon = await getSalonById(currSession.data.salonId);
        if (salon) { sKey = sessionKey(from, salon.id); session = await getSession(sKey); }
      }
    }

    if (!salon) { await sendNoLinkMessage(from); res.status(200).json({ status: "ok" }); return; }

    const SALON_ID = salon.id;
    if (!session) session = await getSession(sKey);

    const salonName = salon?.salon_name || "SnipBook Salon";
    const services = (salon?.services || []).filter(s => s.active !== false);
    const openTime = parseInt(salon?.open_time) || 9;
    const closeTime = parseInt(salon?.close_time) || 21;
    const workDays = salon?.working_days || ["Mon","Tue","Wed","Thu","Fri","Sat"];
    const address = salon?.address || "";
    const mapsLink = salon?.maps_link || "";
    const phone = salon?.phone || "";

    const step = session?.step || "menu";
    const data = { ...(session?.data || {}), salonId: SALON_ID };
    const customerName = data.name || "";

    console.log("Salon:", salonName, "SALON_ID:", SALON_ID, "Step:", step);

    const inboundMsg = text || (interactiveId ? `[Button: ${interactiveId}]` : "[Unknown]");
    await logMessage(SALON_ID, from, "inbound", inboundMsg, text ? "text" : "interactive", customerName);

    if (isResetWord) { await clearSession(sKey); await sendMainMenu(from, salonName, SALON_ID); res.status(200).json({ status: "ok" }); return; }
    if (effectiveMatch) { await clearSession(sKey); await sendMainMenu(from, salonName, SALON_ID); res.status(200).json({ status: "ok" }); return; }

    // ─── MY BOOKING ───────────────────────────────────────────────────────────
    if (interactiveId === "my_booking") {
      const booking = await getUpcomingBooking(SALON_ID, from);
      if (!booking) {
        await sendButtons(from,
          `📋 *Aapki Koi Upcoming Booking Nahi Hai*\n\nAbhi tak koi appointment book nahi ki.\n\nNaya appointment book karein? 👇`,
          [{ id: "appointment", title: "📅 Book Karo" }, { id: "main_menu", title: "🏠 Main Menu" }],
          SALON_ID, customerName
        );
      } else {
        const priceText = booking.amount > 0 ? `₹${booking.amount}` : "Price on visit";
        await setSession(sKey, "my_booking_action", { ...data, bookingId: booking.id, bookingDate: booking.date, bookingTime: booking.time_slot, bookingService: booking.service });
        await sendButtons(from,
          `📋 *Aapki Upcoming Booking:*\n\n✂️ *Service:* ${booking.service}\n📅 *Date:* ${formatDate(booking.date)}\n🕐 *Time:* ${formatTime12(booking.time_slot)}\n💰 *Amount:* ${priceText}\n\nKya karna chahte hain?`,
          [{ id: "cancel_booking", title: "❌ Cancel Karein" }, { id: "reschedule_booking", title: "🔄 Reschedule" }, { id: "main_menu", title: "🏠 Main Menu" }],
          SALON_ID, customerName
        );
      }
      res.status(200).json({ status: "ok" }); return;
    }

    // ─── CANCEL ───────────────────────────────────────────────────────────────
    if (step === "my_booking_action" && interactiveId === "cancel_booking") {
      await setSession(sKey, "confirm_cancel", { ...data });
      await sendButtons(from,
        `⚠️ *Booking Cancel Karna Chahte Hain?*\n\n✂️ ${data.bookingService}\n📅 ${formatDate(data.bookingDate)} at ${formatTime12(data.bookingTime)}\n\nYeh action undo nahi hoga!`,
        [{ id: "confirm_cancel_yes", title: "✅ Haan, Cancel Karo" }, { id: "main_menu", title: "❌ Nahi Rakhein" }],
        SALON_ID, customerName
      );
      res.status(200).json({ status: "ok" }); return;
    }

    if (step === "confirm_cancel" && interactiveId === "confirm_cancel_yes") {
      try {
        await fetch(`${SUPABASE_URL}/rest/v1/appointments?id=eq.${data.bookingId}`, { method: "PATCH", headers: { apikey: SUPABASE_KEY, Authorization: `Bearer ${SUPABASE_KEY}`, "Content-Type": "application/json", Prefer: "return=minimal" }, body: JSON.stringify({ status: "cancelled" }) });
      } catch(e) { console.error("Cancel error:", e.message); }
      await clearSession(sKey);
      const rawNotif = (salon?.notification_number || "").replace(/[^0-9]/g, "");
      const notifTarget = rawNotif ? (rawNotif.startsWith("91") ? rawNotif : `91${rawNotif}`) : "";
      if (notifTarget) await sendText(notifTarget, `❌ *Appointment Cancel!*\n\n🏪 *Salon:* ${salonName}\n📱 *Customer:* +${from.replace(/^\+/,"")}\n✂️ *Service:* ${data.bookingService}\n📅 *Date:* ${formatDate(data.bookingDate)}\n🕐 *Time:* ${formatTime12(data.bookingTime)}\n\n_SnipBook_ 💈`);
      await sendButtons(from,
        `✅ *Booking Cancel Ho Gayi!*\n\n✂️ ${data.bookingService}\n📅 ${formatDate(data.bookingDate)} at ${formatTime12(data.bookingTime)}\n\nKabhi bhi naya appointment book kar sakte hain! 😊`,
        [{ id: "appointment", title: "📅 New Booking" }, { id: "main_menu", title: "🏠 Main Menu" }],
        SALON_ID, customerName
      );
      res.status(200).json({ status: "ok" }); return;
    }

    // ─── RESCHEDULE ───────────────────────────────────────────────────────────
    if (step === "my_booking_action" && interactiveId === "reschedule_booking") {
      await setSession(sKey, "reschedule_date", { ...data });
      await sendDateList(from, { name: customerName, service: data.bookingService, price: 0 }, workDays, SALON_ID);
      res.status(200).json({ status: "ok" }); return;
    }

    if (step === "reschedule_date" && interactiveId === "date_custom") {
      await setSession(sKey, "reschedule_date_custom", { ...data });
      await sendText(from, `📅 *Apni marzi ki date likhein*\n\n_(Jaise: 25 May, 3 June)_\n\n_Wapas menu ke liye "Hi" type karein_`, SALON_ID, customerName);
      res.status(200).json({ status: "ok" }); return;
    }

    if (step === "reschedule_date_custom" && text && !interactiveId) {
      const parsedDate = parseCustomDate(text);
      if (!parsedDate) { await sendText(from, `⚠️ Date samajh nahi aai!\n\n*25 May* ya *2 June* format mein likhein`, SALON_ID, customerName); res.status(200).json({ status: "ok" }); return; }
      if (parsedDate < getTodayKeyIST()) { await sendText(from, `⚠️ *Yeh date nikal chuki hai!*\n\nAaj ya aane wali date likhein 📅`, SALON_ID, customerName); res.status(200).json({ status: "ok" }); return; }
      await setSession(sKey, "reschedule_time_part", { ...data, newDate: parsedDate });
      await sendButtons(from, `📅 *${formatDate(parsedDate)}*\n\nKaunsa time prefer karenge?`, [{ id: "rtime_morning", title: "🌅 Morning (9AM-2PM)" }, { id: "rtime_evening", title: "🌆 Evening (2PM-9PM)" }], SALON_ID, customerName);
      res.status(200).json({ status: "ok" }); return;
    }

    if (step === "reschedule_date" && interactiveId?.startsWith("date_")) {
      const dateKey = interactiveId.replace("date_", "");
      await setSession(sKey, "reschedule_time_part", { ...data, newDate: dateKey });
      await sendButtons(from, `📅 *${formatDate(dateKey)}*\n\nKaunsa time prefer karenge?`, [{ id: "rtime_morning", title: "🌅 Morning (9AM-2PM)" }, { id: "rtime_evening", title: "🌆 Evening (2PM-9PM)" }], SALON_ID, customerName);
      res.status(200).json({ status: "ok" }); return;
    }

    if (step === "reschedule_time_part" && (interactiveId === "rtime_morning" || interactiveId === "rtime_evening")) {
      const isMorning = interactiveId === "rtime_morning";
      const booked = await getBookedSlots(SALON_ID, data.newDate);
      const available = getTimeSlots(isMorning ? openTime : 14, isMorning ? 14 : closeTime, data.newDate).filter(s => !booked.includes(s.key));
      if (available.length === 0) { await sendButtons(from, `😔 Koi slot available nahi!\n\nDusra time chunein:`, [{ id: "rtime_morning", title: "🌅 Morning (9AM-2PM)" }, { id: "rtime_evening", title: "🌆 Evening (2PM-9PM)" }], SALON_ID, customerName); res.status(200).json({ status: "ok" }); return; }
      await setSession(sKey, "reschedule_time", { ...data });
      await sendList(from, `🕐 ${isMorning ? "🌅 Morning" : "🌆 Evening"} Slots`, `📅 *${formatDate(data.newDate)}*\n\nKaunsa time slot chahiye?`, "Slot Chunein", available.map(s => ({ id: `rtime_${s.key}`, title: `🟢 ${s.label}`, description: "Available" })), "Powered by SnipBook", SALON_ID, customerName);
      res.status(200).json({ status: "ok" }); return;
    }

    if (step === "reschedule_time" && interactiveId?.startsWith("rtime_")) {
      const timeKey = interactiveId.replace("rtime_", "");
      await setSession(sKey, "confirm_reschedule", { ...data, newTime: timeKey });
      await sendButtons(from,
        `🔄 *Reschedule Confirm Karein?*\n\n*Purani Booking:*\n📅 ${formatDate(data.bookingDate)} at ${formatTime12(data.bookingTime)}\n\n*Nayi Booking:*\n📅 ${formatDate(data.newDate)} at ${formatTime12(timeKey)}\n✂️ ${data.bookingService}`,
        [{ id: "confirm_reschedule_yes", title: "✅ Confirm!" }, { id: "main_menu", title: "❌ Cancel" }],
        SALON_ID, customerName
      );
      res.status(200).json({ status: "ok" }); return;
    }

    if (step === "confirm_reschedule" && interactiveId === "confirm_reschedule_yes") {
      try {
        await fetch(`${SUPABASE_URL}/rest/v1/appointments?id=eq.${data.bookingId}`, { method: "PATCH", headers: { apikey: SUPABASE_KEY, Authorization: `Bearer ${SUPABASE_KEY}`, "Content-Type": "application/json", Prefer: "return=minimal" }, body: JSON.stringify({ date: data.newDate, time_slot: data.newTime, status: "confirmed" }) });
      } catch(e) { console.error("Reschedule error:", e.message); }
      await clearSession(sKey);
      const rawNotif = (salon?.notification_number || "").replace(/[^0-9]/g, "");
      const notifTarget = rawNotif ? (rawNotif.startsWith("91") ? rawNotif : `91${rawNotif}`) : "";
      if (notifTarget) await sendText(notifTarget, `🔄 *Appointment Reschedule!*\n\n🏪 *Salon:* ${salonName}\n📱 *Customer:* +${from.replace(/^\+/,"")}\n✂️ *Service:* ${data.bookingService}\n📅 *Nayi Date:* ${formatDate(data.newDate)}\n🕐 *Naya Time:* ${formatTime12(data.newTime)}\n\n_SnipBook_ 💈`);
      await sendButtons(from,
        `✅ *Booking Reschedule Ho Gayi!*\n\n✂️ ${data.bookingService}\n📅 *${formatDate(data.newDate)}* at *${formatTime12(data.newTime)}*\n\n📲 Aapko 1 ghante pehle reminder milega.\n\nSee you soon! 💈`,
        [{ id: "main_menu", title: "🏠 Main Menu" }],
        SALON_ID, customerName
      );
      res.status(200).json({ status: "ok" }); return;
    }
    // ─────────────────────────────────────────────────────────────────────────

    if (step === "ask_name" && text && !interactiveId) {
      await setSession(`name_${from}`, "saved", { name: text });
      if (data.pendingService) {
        await setSession(sKey, "ask_date", { ...data, name: text, service: data.pendingService, price: data.pendingPrice || 0 });
        await sendDateList(from, { name: text, service: data.pendingService, price: data.pendingPrice || 0 }, workDays, SALON_ID);
      } else {
        await setSession(sKey, "ask_gender", { ...data, name: text });
        await sendButtons(from, `Nice to meet you, *${text}!* 🙌\n\nAap kaunsi services chahte hain?`, [{ id: "gender_male", title: "👨 Male Services" }, { id: "gender_female", title: "👩 Female Services" }], SALON_ID, text);
      }
      res.status(200).json({ status: "ok" }); return;
    }

    if (step === "ask_gender" && (interactiveId === "gender_male" || interactiveId === "gender_female")) {
      const gender = interactiveId === "gender_male" ? "male" : "female";
      await setSession(sKey, "ask_service", { ...data, gender });
      const filtered = services.filter(s => !s.gender || s.gender === "both" || s.gender === gender);
      if (filtered.length === 0) { await sendText(from, `😔 Is category mein abhi koi service available nahi.\n\nDusri category try karein ya "Hi" type karein.`, SALON_ID, customerName); res.status(200).json({ status: "ok" }); return; }
      const rows = filtered.slice(0, 9).map(s => ({ id: `svc_${s.id}`, title: `${s.emoji || "✂️"} ${s.name}`.slice(0, 24), description: `₹${s.price} · ${s.duration} min` }));
      rows.push({ id: "svc_custom", title: "✏️ Koi Aur Service", description: "Apni service khud likhein" });
      await sendList(from, `✂️ ${gender === "male" ? "👨 Male" : "👩 Female"} Services`, `*${data.name}*, konsi service chahiye?`, "Service Chunein", rows, "Powered by SnipBook", SALON_ID, customerName);
      res.status(200).json({ status: "ok" }); return;
    }

    if (step === "ask_service" && interactiveId === "svc_custom") { await setSession(sKey, "ask_service_custom", { ...data }); await sendText(from, `✏️ *Apni service likhein:*\n\n_Wapas menu ke liye "Hi" type karein_`, SALON_ID, customerName); res.status(200).json({ status: "ok" }); return; }
    if (step === "ask_service_custom" && text && !interactiveId) { await setSession(sKey, "ask_date", { ...data, service: text, price: 0 }); await sendDateList(from, { ...data, service: text, price: 0 }, workDays, SALON_ID); res.status(200).json({ status: "ok" }); return; }

    if (step === "ask_service" && interactiveId?.startsWith("svc_")) {
      const svcId = interactiveId.replace("svc_", "");
      const selected = services.find(s => String(s.id) === svcId);
      await setSession(sKey, "ask_date", { ...data, service: selected?.name || svcId, price: selected?.price || 0 });
      await sendDateList(from, { ...data, service: selected?.name || svcId, price: selected?.price || 0 }, workDays, SALON_ID);
      res.status(200).json({ status: "ok" }); return;
    }

    if (step === "ask_date" && interactiveId === "date_custom") { await setSession(sKey, "ask_date_custom", { ...data }); await sendText(from, `📅 *Apni marzi ki date likhein*\n\n_(Jaise: 25 May, 3 June)_\n\n_Wapas menu ke liye "Hi" type karein_`, SALON_ID, customerName); res.status(200).json({ status: "ok" }); return; }

    if (step === "ask_date_custom" && text && !interactiveId) {
      const parsedDate = parseCustomDate(text);
      if (!parsedDate) { await sendText(from, `⚠️ Date samajh nahi aai!\n\n*25 May* ya *2 June* format mein likhein`, SALON_ID, customerName); res.status(200).json({ status: "ok" }); return; }
      if (parsedDate < getTodayKeyIST()) { await sendText(from, `⚠️ *Yeh date nikal chuki hai!*\n\nAaj ya aane wali date likhein 📅`, SALON_ID, customerName); res.status(200).json({ status: "ok" }); return; }
      await setSession(sKey, "ask_time_part", { ...data, date: parsedDate });
      await sendButtons(from, `📅 *${formatDate(parsedDate)}*\n\nKaunsa time prefer karenge?`, [{ id: "time_morning", title: "🌅 Morning (9AM-2PM)" }, { id: "time_evening", title: "🌆 Evening (2PM-9PM)" }], SALON_ID, customerName);
      res.status(200).json({ status: "ok" }); return;
    }

    if (step === "ask_date" && interactiveId?.startsWith("date_")) {
      const dateKey = interactiveId.replace("date_", "");
      await setSession(sKey, "ask_time_part", { ...data, date: dateKey });
      await sendButtons(from, `📅 *${formatDate(dateKey)}*\n\nKaunsa time prefer karenge?`, [{ id: "time_morning", title: "🌅 Morning (9AM-2PM)" }, { id: "time_evening", title: "🌆 Evening (2PM-9PM)" }], SALON_ID, customerName);
      res.status(200).json({ status: "ok" }); return;
    }

    if (step === "ask_time_part" && (interactiveId === "time_morning" || interactiveId === "time_evening")) {
      const isMorning = interactiveId === "time_morning";
      const booked = await getBookedSlots(SALON_ID, data.date);
      const available = getTimeSlots(isMorning ? openTime : 14, isMorning ? 14 : closeTime, data.date).filter(s => !booked.includes(s.key));
      if (available.length === 0) { await sendButtons(from, `😔 Koi slot available nahi!\n\nDusra time chunein:`, [{ id: "time_morning", title: "🌅 Morning (9AM-2PM)" }, { id: "time_evening", title: "🌆 Evening (2PM-9PM)" }], SALON_ID, customerName); res.status(200).json({ status: "ok" }); return; }
      await setSession(sKey, "ask_time", { ...data });
      await sendList(from, `🕐 ${isMorning ? "🌅 Morning" : "🌆 Evening"} Slots`, `📅 *${formatDate(data.date)}*\n\nKaunsa time slot chahiye?`, "Slot Chunein", available.map(s => ({ id: `time_${s.key}`, title: `🟢 ${s.label}`, description: "Available" })), "Powered by SnipBook", SALON_ID, customerName);
      res.status(200).json({ status: "ok" }); return;
    }

    if (step === "ask_time" && interactiveId?.startsWith("time_")) {
      const timeKey = interactiveId.replace("time_", "");
      await setSession(sKey, "confirm", { ...data, time: timeKey });
      const priceText = data.price > 0 ? `₹${data.price}` : "Price on visit";
      await sendButtons(from, `📋 *Booking Details:*\n\n👤 *Naam:* ${data.name}\n✂️ *Service:* ${data.service}\n📅 *Date:* ${formatDate(data.date)}\n🕐 *Time:* ${formatTime12(timeKey)}\n💰 *Price:* ${priceText}\n\nKya confirm karein? ✅`, [{ id: "confirm_yes", title: "✅ Haan, Confirm!" }, { id: "confirm_no", title: "❌ Cancel" }], SALON_ID, customerName);
      res.status(200).json({ status: "ok" }); return;
    }

    if (step === "confirm" && interactiveId === "confirm_yes") {
      try {
        const dupR = await fetch(`${SUPABASE_URL}/rest/v1/appointments?salon_id=eq.${SALON_ID}&date=eq.${data.date}&status=eq.confirmed`, { headers: { apikey: SUPABASE_KEY, Authorization: `Bearer ${SUPABASE_KEY}` } });
        const dupAll = await dupR.json();
        const fromClean = from.replace(/^\+/, "");
        const dupFound = (dupAll || []).find(a => (a.customer_phone || "").replace(/^\+/, "") === fromClean);
        if (dupFound) {
          await clearSession(sKey);
          await sendButtons(from, `⚠️ *Aapki is din pehle se appointment hai!*\n\n📅 ${formatDate(data.date)} ko *${formatTime12(dupFound.time_slot)}* baje\n✂️ ${dupFound.service}\n\nEk din mein ek hi appointment ho sakti hai.`, [{ id: "main_menu", title: "🏠 Main Menu" }], SALON_ID, customerName);
          res.status(200).json({ status: "ok" }); return;
        }
      } catch(e) { console.error("Dup check error:", e.message); }

      try { await fetch(`${SUPABASE_URL}/rest/v1/customers`, { method: "POST", headers: { apikey: SUPABASE_SERVICE_KEY, Authorization: `Bearer ${SUPABASE_SERVICE_KEY}`, "Content-Type": "application/json", Prefer: "resolution=ignore-duplicates,return=minimal" }, body: JSON.stringify({ salon_id: SALON_ID, name: data.name || "WhatsApp Customer", phone: from, source: "wa", tag: "New" }) }); } catch(e) { console.error("Customer save error:", e.message); }

      await fetch(`${SUPABASE_URL}/rest/v1/appointments`, { method: "POST", headers: { apikey: SUPABASE_KEY, Authorization: `Bearer ${SUPABASE_KEY}`, "Content-Type": "application/json", Prefer: "return=minimal" }, body: JSON.stringify({ salon_id: SALON_ID, customer_name: data.name || "WhatsApp Customer", customer_phone: from, service: data.service, amount: data.price || 0, date: data.date, time_slot: data.time, status: "confirmed" }) });

      await clearSession(sKey);
      const priceText = data.price > 0 ? `₹${data.price}` : "Price on visit";
      await sendButtons(from, `🎉 *Booking Confirmed!*\n\n✅ Aapka appointment set ho gaya!\n\n👤 ${data.name}\n✂️ ${data.service}\n📅 ${formatDate(data.date)} at ${formatTime12(data.time)}\n💰 ${priceText}\n\n📲 Aapko 1 ghante pehle reminder milega.\n\nSee you soon! 💈`, [{ id: "main_menu", title: "🏠 Main Menu" }], SALON_ID, data.name);

      const rawNotif = (salon?.notification_number || "").replace(/[^0-9]/g, "");
      const notifTarget = rawNotif ? (rawNotif.startsWith("91") ? rawNotif : `91${rawNotif}`) : "";
      if (notifTarget) await sendText(notifTarget, `🔔 *Naya Appointment!*\n\n🏪 *Salon:* ${salonName}\n👤 *Customer:* ${data.name}\n📱 *Phone:* +${from.replace(/^\+/,"")}\n✂️ *Service:* ${data.service}\n📅 *Date:* ${formatDate(data.date)}\n🕐 *Time:* ${formatTime12(data.time)}\n💰 *Amount:* ${priceText}\n\n_SnipBook se auto-booked_ 💈`);

      try {
        const fromWithPlus = from.startsWith("+") ? from : `+${from}`;
        const custEmailR = await fetch(`${SUPABASE_URL}/rest/v1/customers?salon_id=eq.${SALON_ID}&phone=eq.${encodeURIComponent(fromWithPlus)}&select=email&order=email.desc.nullslast&limit=1`, { headers: { apikey: SUPABASE_SERVICE_KEY, Authorization: `Bearer ${SUPABASE_SERVICE_KEY}` } });
        const custEmailData = await custEmailR.json();
        await sendBookingEmail({ ownerEmail: salon?.notification_email || OWNER_EMAIL || "", customerEmail: custEmailData?.[0]?.email || "", salonName, customerName: data.name, service: data.service, date: data.date, time: data.time, price: data.price || 0, customerPhone: from });
      } catch(e) { console.error("Email trigger error:", e.message); }

      res.status(200).json({ status: "ok" }); return;
    }

    if (step === "confirm" && interactiveId === "confirm_no") { await clearSession(sKey); await sendText(from, `Koi baat nahi! 😊\nKabhi bhi book karne ke liye salon ka link use karein.`, SALON_ID, customerName); res.status(200).json({ status: "ok" }); return; }
    if (interactiveId === "main_menu") { await clearSession(sKey); await sendMainMenu(from, salonName, SALON_ID); res.status(200).json({ status: "ok" }); return; }

    if (interactiveId === "appointment") {
      const nameSession = await getSession(`name_${from}`);
      const savedName = nameSession?.data?.name || data.name;
      if (savedName) { await setSession(sKey, "ask_gender", { ...data, name: savedName }); await sendButtons(from, `Welcome back, *${savedName}!* 🙌\n\nAap kaunsi services chahte hain?`, [{ id: "gender_male", title: "👨 Male Services" }, { id: "gender_female", title: "👩 Female Services" }], SALON_ID, savedName); }
      else { await setSession(sKey, "ask_name", { ...data }); await sendText(from, `📅 *Appointment Book Karein*\n\n*Aapka naam kya hai?*`, SALON_ID); }
      res.status(200).json({ status: "ok" }); return;
    }

    if (interactiveId === "services") { await setSession(sKey, "browse_services_gender", { ...data }); await sendButtons(from, `✂️ *Hamare Services*\n\nKaunsi services dekhna chahte hain?`, [{ id: "browse_male", title: "👨 Male Services" }, { id: "browse_female", title: "👩 Female Services" }], SALON_ID, customerName); res.status(200).json({ status: "ok" }); return; }

    if (step === "browse_services_gender" && (interactiveId === "browse_male" || interactiveId === "browse_female")) {
      const gender = interactiveId === "browse_male" ? "male" : "female";
      await setSession(sKey, "browse_services_list", { ...data, gender });
      const filtered = services.filter(s => !s.gender || s.gender === "both" || s.gender === gender);
      if (filtered.length === 0) { await sendText(from, `😔 Is category mein abhi koi service available nahi.\n\nDusri category try karein ya "Hi" type karein.`, SALON_ID, customerName); res.status(200).json({ status: "ok" }); return; }
      const rows = filtered.slice(0, 9).map(s => ({ id: `browse_svc_${s.id}`, title: `${s.emoji || "✂️"} ${s.name}`.slice(0, 24), description: `₹${s.price} · ${s.duration} min` }));
      rows.push({ id: "browse_svc_custom", title: "✏️ Koi Aur Service", description: "Apni service khud likhein" });
      await sendList(from, `✂️ ${gender === "male" ? "👨 Male" : "👩 Female"} Services`, `Koi bhi service select karein 👇`, "Services Dekho", rows, "Powered by SnipBook", SALON_ID, customerName);
      res.status(200).json({ status: "ok" }); return;
    }

    if (step === "browse_services_list" && interactiveId?.startsWith("browse_svc_")) {
      const svcId = interactiveId.replace("browse_svc_", "");
      if (svcId === "custom") { await setSession(sKey, "browse_services_custom", { ...data }); await sendText(from, `✏️ *Apni service likhein:*\n\n_Wapas menu ke liye "Hi" type karein_`, SALON_ID, customerName); res.status(200).json({ status: "ok" }); return; }
      const selected = services.find(s => String(s.id) === svcId);
      const priceText = (selected?.price || 0) > 0 ? `₹${selected.price}` : "Price on visit";
      const durText = selected?.duration ? ` · ${selected.duration} min` : "";
      await setSession(sKey, "browse_services_list", { ...data });
      await sendButtons(from, `✂️ *${selected?.name || svcId}*\n💰 ${priceText}${durText}\n\nIs service ko book karna chahte hain?`, [{ id: `book_svc_${svcId}`, title: "📅 Appointment Book Karo" }, { id: "browse_back", title: "⬅️ Wapas Services" }], SALON_ID, customerName);
      res.status(200).json({ status: "ok" }); return;
    }

    if (step === "browse_services_custom" && text && !interactiveId) {
      await sendButtons(from, `✂️ *${text}*\n\nIs service ko book karna chahte hain?`, [{ id: `book_custom_${encodeURIComponent(text).slice(0,20)}`, title: "📅 Appointment Book Karo" }, { id: "browse_back", title: "⬅️ Wapas Services" }], SALON_ID, customerName);
      await setSession(sKey, "browse_services_list", { ...data, pendingCustomService: text });
      res.status(200).json({ status: "ok" }); return;
    }

    if (interactiveId === "browse_back") {
      const gender = data.gender || "male";
      const filtered = services.filter(s => !s.gender || s.gender === "both" || s.gender === gender);
      const rows = filtered.slice(0, 9).map(s => ({ id: `browse_svc_${s.id}`, title: `${s.emoji || "✂️"} ${s.name}`.slice(0, 24), description: `₹${s.price} · ${s.duration} min` }));
      rows.push({ id: "browse_svc_custom", title: "✏️ Koi Aur Service", description: "Apni service khud likhein" });
      await sendList(from, `✂️ ${gender === "male" ? "👨 Male" : "👩 Female"} Services`, `Koi bhi service select karein 👇`, "Services Dekho", rows, "Powered by SnipBook", SALON_ID, customerName);
      res.status(200).json({ status: "ok" }); return;
    }

    if (interactiveId?.startsWith("book_svc_") || interactiveId?.startsWith("book_custom_")) {
      let serviceName, servicePrice;
      if (interactiveId.startsWith("book_custom_")) { serviceName = data.pendingCustomService || "Custom Service"; servicePrice = 0; }
      else { const svcId = interactiveId.replace("book_svc_", ""); const sel = services.find(s => String(s.id) === svcId); serviceName = sel?.name || svcId; servicePrice = sel?.price || 0; }
      const nameSession = await getSession(`name_${from}`);
      const savedName = nameSession?.data?.name || data.name;
      if (savedName) { await setSession(sKey, "ask_date", { ...data, name: savedName, service: serviceName, price: servicePrice }); await sendDateList(from, { name: savedName, service: serviceName, price: servicePrice }, workDays, SALON_ID); }
      else { await setSession(sKey, "ask_name", { ...data, pendingService: serviceName, pendingPrice: servicePrice }); await sendText(from, `📅 *Appointment Book Karein*\n\n*Aapka naam kya hai?*`, SALON_ID); }
      res.status(200).json({ status: "ok" }); return;
    }

    if (interactiveId === "timing") { await sendText(from, `🕐 *Salon Timings*\n\n📅 ${(workDays || []).join(", ")}\n⏰ ${formatTime(openTime)} – ${formatTime(closeTime)}\n\n_Wapas menu ke liye "Hi" type karein_`, SALON_ID, customerName); res.status(200).json({ status: "ok" }); return; }

    if (interactiveId === "contact") {
      let m = `📞 *Humse Sampark Karein*\n\n📱 Phone: +91 ${phone}`;
      if (address) m += `\n📍 Address: ${address}`;
      if (mapsLink) m += `\n🗺️ Location: ${mapsLink}`;
      m += `\n\n_Wapas menu ke liye "Hi" type karein_`;
      await sendText(from, m, SALON_ID, customerName);
      res.status(200).json({ status: "ok" }); return;
    }

    if (step && step !== "menu") { await sendStepHint(from, step, SALON_ID); }
    else { await clearSession(sKey); await sendMainMenu(from, salonName, SALON_ID); }
    res.status(200).json({ status: "ok" });

  } catch (err) {
    console.error("Handler error:", err.message);
    res.status(200).json({ status: "ok" });
  }
}