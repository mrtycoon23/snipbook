export const config = { maxDuration: 30 };

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_ANON_KEY;
const YCLOUD_KEY   = process.env.YCLOUD_API_KEY;
const BOT_NUMBER   = process.env.WHATSAPP_PHONE_NUMBER;

// ─── Supabase helpers ─────────────────────────────────────────────────────────

async function getSalonByKeyword(keyword) {
  if (!keyword) return null;
  try {
    const r = await fetch(
      `${SUPABASE_URL}/rest/v1/salons?bot_keyword=eq.${encodeURIComponent(keyword.toLowerCase().trim())}&limit=1`,
      { headers: { apikey: SUPABASE_KEY, Authorization: `Bearer ${SUPABASE_KEY}` } }
    );
    const d = await r.json();
    return d?.[0] || null;
  } catch(e) { return null; }
}

async function getSalonByPhone(phone) {
  const clean = phone.replace(/[^0-9]/g, "");
  const variants = [
    clean,
    clean.startsWith("91") ? clean.slice(2) : `91${clean}`,
  ];
  try {
    for (const v of variants) {
      const r = await fetch(
        `${SUPABASE_URL}/rest/v1/salons?whatsapp_number=eq.${v}&limit=1`,
        { headers: { apikey: SUPABASE_KEY, Authorization: `Bearer ${SUPABASE_KEY}` } }
      );
      const d = await r.json();
      if (d?.[0]) return d[0];
    }
    return null;
  } catch(e) { return null; }
}

async function getSalonById(id) {
  try {
    const r = await fetch(
      `${SUPABASE_URL}/rest/v1/salons?id=eq.${id}&limit=1`,
      { headers: { apikey: SUPABASE_KEY, Authorization: `Bearer ${SUPABASE_KEY}` } }
    );
    const d = await r.json();
    return d?.[0] || null;
  } catch(e) { return null; }
}

function sessionKey(phone, salonId) {
  return `${salonId}_${phone}`;
}

async function getSession(key) {
  try {
    const r = await fetch(
      `${SUPABASE_URL}/rest/v1/bot_sessions?phone=eq.${encodeURIComponent(key)}&limit=1`,
      { headers: { apikey: SUPABASE_KEY, Authorization: `Bearer ${SUPABASE_KEY}` } }
    );
    const d = await r.json();
    return d?.[0] || null;
  } catch(e) { return null; }
}

async function setSession(key, step, data = {}) {
  try {
    await fetch(`${SUPABASE_URL}/rest/v1/bot_sessions`, {
      method: "POST",
      headers: {
        apikey: SUPABASE_KEY,
        Authorization: `Bearer ${SUPABASE_KEY}`,
        "Content-Type": "application/json",
        Prefer: "resolution=merge-duplicates",
      },
      body: JSON.stringify({ phone: key, step, data, updated_at: new Date().toISOString() }),
    });
  } catch(e) { console.error("setSession error:", e.message); }
}

async function clearSession(key) {
  try {
    await fetch(`${SUPABASE_URL}/rest/v1/bot_sessions?phone=eq.${encodeURIComponent(key)}`, {
      method: "DELETE",
      headers: { apikey: SUPABASE_KEY, Authorization: `Bearer ${SUPABASE_KEY}` }
    });
  } catch(e) {}
}

async function getBookedSlots(salonId, date) {
  try {
    const r = await fetch(
      `${SUPABASE_URL}/rest/v1/appointments?salon_id=eq.${salonId}&date=eq.${date}&status=eq.confirmed`,
      { headers: { apikey: SUPABASE_KEY, Authorization: `Bearer ${SUPABASE_KEY}` } }
    );
    const d = await r.json();
    return (d || []).map(a => a.time_slot);
  } catch(e) { return []; }
}

// ─── YCloud helpers ───────────────────────────────────────────────────────────
async function sendText(to, body) {
  try {
    await fetch("https://api.ycloud.com/v2/whatsapp/messages", {
      method: "POST",
      headers: { "X-API-Key": YCLOUD_KEY, "Content-Type": "application/json" },
      body: JSON.stringify({ from: BOT_NUMBER, to, type: "text", text: { body } }),
    });
  } catch(e) { console.error("sendText error:", e.message); }
}

async function sendButtons(to, bodyText, buttons) {
  try {
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
        interactive: { type: "button", body: { text: bodyText }, action: { buttons: btns } }
      }),
    });
  } catch(e) { console.error("sendButtons error:", e.message); }
}

async function sendList(to, headerText, bodyText, buttonLabel, rows, footerText = "Powered by SnipBook") {
  try {
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
          footer: { text: footerText },
          action: { button: buttonLabel, sections: [{ title: "Options", rows: rows.slice(0, 10) }] }
        }
      }),
    });
  } catch(e) { console.error("sendList error:", e.message); }
}

async function sendMainMenu(to, salonName) {
  await sendList(
    to, `🙏 ${salonName}`,
    `Namaste! Aap kya karna chahte hain?\nNeeche se option chunein 👇`,
    "Menu Dekho",
    [
      { id: "appointment", title: "📅 Appointment Book Karo", description: "Apna slot abhi book karein" },
      { id: "services",    title: "✂️ Services Dekho",        description: "Hamare sab services aur prices" },
      { id: "timing",      title: "🕐 Salon Timing",          description: "Kab khula rehta hai salon" },
      { id: "contact",     title: "📞 Contact Karo",          description: "Humse seedha baat karein" },
    ]
  );
}

// ─── IST helper ───────────────────────────────────────────────────────────────
function getISTNow() {
  const now = new Date();
  return new Date(now.getTime() + 5.5 * 60 * 60 * 1000);
}

function getTodayKeyIST() {
  const ist = getISTNow();
  return `${ist.getUTCFullYear()}-${pad(ist.getUTCMonth()+1)}-${pad(ist.getUTCDate())}`;
}

// ─── Main Handler ─────────────────────────────────────────────────────────────
export default async function handler(req, res) {
  if (req.method === "GET") {
    const { "hub.mode": mode, "hub.verify_token": token, "hub.challenge": challenge } = req.query;
    if (mode === "subscribe" && token === process.env.VERIFY_TOKEN) {
      res.status(200).send(challenge);
    } else {
      res.status(403).send("Forbidden");
    }
    return;
  }

  if (req.method !== "POST") { res.status(200).json({ status: "ok" }); return; }

  const body = req.body;
  if (body.type !== "whatsapp.inbound_message.received") { res.status(200).json({ status: "ok" }); return; }

  const msg  = body.whatsappInboundMessage;
  const from = msg?.from;
  const msgId = msg?.id || "";
  const text = msg?.text?.body?.trim();
  const interactiveId =
    msg?.interactive?.listReply?.id ||
    msg?.interactive?.list_reply?.id ||
    msg?.interactive?.buttonReply?.id ||
    msg?.interactive?.button_reply?.id;

  console.log("From:", from, "Text:", text, "Interactive:", interactiveId, "MsgId:", msgId);
  if (!from) { res.status(200).json({ status: "ok" }); return; }

  try {
    // ✅ Duplicate check
    if (msgId) {
      const processed = await getSession(`dup_${msgId}`);
      if (processed) { res.status(200).json({ status: "ok" }); return; }
      await setSession(`dup_${msgId}`, "done", { ts: Date.now() });
    }

    // ✅ SALON IDENTIFY — 3 step priority
    let salon = null;
    let sKey = from;

    // Step 1: Existing session mein salonId
    const rawSession = await getSession(from);
    if (rawSession?.data?.salonId) {
      salon = await getSalonById(rawSession.data.salonId);
      if (salon) sKey = sessionKey(from, salon.id);
    }

    // Step 2: Keyword se
    if (!salon && text) {
      const byKeyword = await getSalonByKeyword(text);
      if (byKeyword) {
        salon = byKeyword;
        sKey = sessionKey(from, salon.id);
      }
    }

    // Step 3: Fallback — BOT_NUMBER linked salon
    if (!salon) {
      salon = await getSalonByPhone(BOT_NUMBER);
      if (salon) sKey = sessionKey(from, salon.id);
    }

    if (!salon) {
      await sendText(from, "Salon nahi mila. Salon owner se correct link maangein. 🙏");
      res.status(200).json({ status: "ok" });
      return;
    }

    const SALON_ID = salon.id;
    const session = await getSession(sKey);

    const salonName = salon?.salon_name   || "SnipBook Salon";
    const services  = (salon?.services    || []).filter(s => s.active !== false);
    const openTime  = parseInt(salon?.open_time)  || 9;
    const closeTime = parseInt(salon?.close_time) || 21;
    const workDays  = salon?.working_days || ["Mon","Tue","Wed","Thu","Fri","Sat"];
    const address   = salon?.address      || "";
    const mapsLink  = salon?.maps_link    || "";
    const phone     = salon?.phone        || "";

    const step = session?.step || "menu";
    const data = { ...(session?.data || {}), salonId: SALON_ID };

    console.log("Salon:", salonName, "SALON_ID:", SALON_ID, "sKey:", sKey, "Step:", step);

    // ✅ Reset words
    const resetWords = ["hi","hello","hii","hey","namaste","menu","start","wapas","back","helo","namaskar"];
    if (text && resetWords.includes(text.toLowerCase())) {
      await clearSession(sKey);
      await sendMainMenu(from, salonName);
      res.status(200).json({ status: "ok" });
      return;
    }

    // ✅ Keyword aaya → fresh start
    if (text && (await getSalonByKeyword(text))) {
      await clearSession(sKey);
      await sendMainMenu(from, salonName);
      res.status(200).json({ status: "ok" });
      return;
    }

    // ─── BOOKING FLOW ──────────────────────────────────────────────────────────

    if (step === "ask_name" && text && !interactiveId) {
      await setSession(`name_${from}_${SALON_ID}`, "saved", { name: text });

      if (data.pendingService) {
        await setSession(sKey, "ask_date", { ...data, name: text, service: data.pendingService, price: data.pendingPrice || 0 });
        await sendDateList(from, { name: text, service: data.pendingService, price: data.pendingPrice || 0 }, workDays);
      } else {
        await setSession(sKey, "ask_gender", { ...data, name: text });
        await sendButtons(from,
          `Nice to meet you, *${text}!* 🙌\n\nAap kaunsi services chahte hain?`,
          [
            { id: "gender_male",   title: "👨 Male Services" },
            { id: "gender_female", title: "👩 Female Services" },
          ]
        );
      }
      res.status(200).json({ status: "ok" });
      return;
    }

    if (step === "ask_gender" && (interactiveId === "gender_male" || interactiveId === "gender_female")) {
      const gender = interactiveId === "gender_male" ? "male" : "female";
      await setSession(sKey, "ask_service", { ...data, gender });

      const filtered = services.filter(s => {
        if (!s.gender || s.gender === "both") return true;
        return s.gender === gender;
      });

      const rows = filtered.slice(0, 9).map(s => ({
        id: `svc_${s.id}`,
        title: `${s.emoji || "✂️"} ${s.name}`.slice(0, 24),
        description: `₹${s.price} · ${s.duration} min`
      }));
      rows.push({ id: "svc_custom", title: "✏️ Koi Aur Service", description: "Apni service khud likhein" });

      const genderLabel = gender === "male" ? "👨 Male" : "👩 Female";
      await sendList(from, `✂️ ${genderLabel} Services`, `*${data.name}*, konsi service chahiye?`, "Service Chunein", rows);
      res.status(200).json({ status: "ok" });
      return;
    }

    if (step === "ask_service" && interactiveId === "svc_custom") {
      await setSession(sKey, "ask_service_custom", { ...data });
      await sendText(from, `✏️ *Apni service likhein:*\n\nJo service chahiye woh type karein\n(e.g. Keratin, Smoothening, Bridal Package)\n\n_Wapas menu ke liye "Hi" type karein_`);
      res.status(200).json({ status: "ok" });
      return;
    }

    if (step === "ask_service_custom" && text && !interactiveId) {
      await setSession(sKey, "ask_date", { ...data, service: text, price: 0 });
      await sendDateList(from, { ...data, service: text, price: 0 }, workDays);
      res.status(200).json({ status: "ok" });
      return;
    }

    if (step === "ask_service" && interactiveId?.startsWith("svc_")) {
      const svcId = interactiveId.replace("svc_", "");
      const selected = services.find(s => String(s.id) === svcId);
      const serviceName  = selected?.name  || svcId;
      const servicePrice = selected?.price || 0;
      await setSession(sKey, "ask_date", { ...data, service: serviceName, price: servicePrice });
      await sendDateList(from, { ...data, service: serviceName, price: servicePrice }, workDays);
      res.status(200).json({ status: "ok" });
      return;
    }

    if (step === "ask_date" && interactiveId === "date_custom") {
      await setSession(sKey, "ask_date_custom", { ...data });
      await sendText(from, `📅 *Apni marzi ki date likhein*\n\nKoi bhi aane wali date type karein 👇\n_(Jaise: 25 May, 3 June, 15 Jul)_\n\n_Wapas menu ke liye "Hi" type karein_`);
      res.status(200).json({ status: "ok" });
      return;
    }

    // ✅ Past date validation added
    if (step === "ask_date_custom" && text && !interactiveId) {
      const parsedDate = parseCustomDate(text);
      if (!parsedDate) {
        await sendText(from, `⚠️ Date samajh nahi aai!\n\nKripya is format mein likhein:\n*25 May* ya *2 June*`);
        res.status(200).json({ status: "ok" });
        return;
      }

      const todayKey = getTodayKeyIST();
      if (parsedDate < todayKey) {
        await sendText(from, `⚠️ *Yeh date nikal chuki hai!*\n\nKripya aaj ya aane wali date likhein 📅\n_(Jaise: ${formatDate(todayKey)} ya uske baad)_`);
        res.status(200).json({ status: "ok" });
        return;
      }

      await setSession(sKey, "ask_time_part", { ...data, date: parsedDate });
      await sendButtons(from,
        `📅 *${formatDate(parsedDate)}*\n\nKaunsa time prefer karenge?`,
        [
          { id: "time_morning", title: "🌅 Morning (9AM-2PM)" },
          { id: "time_evening", title: "🌆 Evening (2PM-9PM)" },
        ]
      );
      res.status(200).json({ status: "ok" });
      return;
    }

    if (step === "ask_date" && interactiveId?.startsWith("date_")) {
      const dateKey = interactiveId.replace("date_", "");
      await setSession(sKey, "ask_time_part", { ...data, date: dateKey });
      await sendButtons(from,
        `📅 *${formatDate(dateKey)}*\n\nKaunsa time prefer karenge?`,
        [
          { id: "time_morning", title: "🌅 Morning (9AM-2PM)" },
          { id: "time_evening", title: "🌆 Evening (2PM-9PM)" },
        ]
      );
      res.status(200).json({ status: "ok" });
      return;
    }

    if (step === "ask_time_part" && (interactiveId === "time_morning" || interactiveId === "time_evening")) {
      const isMorning = interactiveId === "time_morning";
      const startH = isMorning ? openTime : 14;
      const endH   = isMorning ? 14 : closeTime;

      const booked = await getBookedSlots(SALON_ID, data.date);
      const allSlots = getTimeSlots(startH, endH, data.date);
      const available = allSlots.filter(s => !booked.includes(s.key));

      if (available.length === 0) {
        await sendButtons(from,
          `😔 Is time mein koi slot available nahi *${formatDate(data.date)}* ko!\n\nDusra time chunein:`,
          [
            { id: "time_morning", title: "🌅 Morning (9AM-2PM)" },
            { id: "time_evening", title: "🌆 Evening (2PM-9PM)" },
          ]
        );
        res.status(200).json({ status: "ok" });
        return;
      }

      await setSession(sKey, "ask_time", { ...data });
      const rows = available.map(s => ({
        id: `time_${s.key}`,
        title: `🟢 ${s.label}`,
        description: "Available"
      }));

      const partLabel = isMorning ? "🌅 Morning" : "🌆 Evening";
      await sendList(from, `🕐 ${partLabel} Slots`, `📅 *${formatDate(data.date)}*\n\nKaunsa time slot chahiye?`, "Slot Chunein", rows);
      res.status(200).json({ status: "ok" });
      return;
    }

    if (step === "ask_time" && interactiveId?.startsWith("time_")) {
      const timeKey = interactiveId.replace("time_", "");
      await setSession(sKey, "confirm", { ...data, time: timeKey });

      const priceText = data.price > 0 ? `₹${data.price}` : "Price on visit";
      const confirmMsg =
        `📋 *Booking Details:*\n\n` +
        `👤 *Naam:* ${data.name}\n` +
        `✂️ *Service:* ${data.service}\n` +
        `📅 *Date:* ${formatDate(data.date)}\n` +
        `🕐 *Time:* ${formatTime12(timeKey)}\n` +
        `💰 *Price:* ${priceText}\n\n` +
        `Kya confirm karein? ✅`;

      await sendButtons(from, confirmMsg, [
        { id: "confirm_yes", title: "✅ Haan, Confirm!" },
        { id: "confirm_no",  title: "❌ Cancel" },
      ]);
      res.status(200).json({ status: "ok" });
      return;
    }

    // confirm — yes
    if (step === "confirm" && interactiveId === "confirm_yes") {
      try {
        const custCheck = await fetch(
          `${SUPABASE_URL}/rest/v1/customers?salon_id=eq.${SALON_ID}&phone=eq.${from}&limit=1`,
          { headers: { apikey: SUPABASE_KEY, Authorization: `Bearer ${SUPABASE_KEY}` } }
        );
        const custData = await custCheck.json();
        if (!custData || custData.length === 0) {
          await fetch(`${SUPABASE_URL}/rest/v1/customers`, {
            method: "POST",
            headers: {
              apikey: SUPABASE_KEY,
              Authorization: `Bearer ${SUPABASE_KEY}`,
              "Content-Type": "application/json",
              Prefer: "return=minimal",
            },
            body: JSON.stringify({
              salon_id: SALON_ID,
              name: data.name || "WhatsApp Customer",
              phone: from,
              source: "wa",
              tag: "New",
            }),
          });
        }
      } catch(e) { console.error("Customer save error:", e.message); }

      await fetch(`${SUPABASE_URL}/rest/v1/appointments`, {
        method: "POST",
        headers: {
          apikey: SUPABASE_KEY,
          Authorization: `Bearer ${SUPABASE_KEY}`,
          "Content-Type": "application/json",
          Prefer: "return=minimal",
        },
        body: JSON.stringify({
          salon_id:       SALON_ID,
          customer_name:  data.name || "WhatsApp Customer",
          customer_phone: from,
          service:        data.service,
          amount:         data.price || 0,
          date:           data.date,
          time_slot:      data.time,
          status:         "confirmed",
        }),
      });

      await clearSession(sKey);

      const priceText = data.price > 0 ? `₹${data.price}` : "Price on visit";
      const successMsg =
        `🎉 *Booking Confirmed!*\n\n` +
        `✅ Aapka appointment set ho gaya!\n\n` +
        `👤 ${data.name}\n` +
        `✂️ ${data.service}\n` +
        `📅 ${formatDate(data.date)} at ${formatTime12(data.time)}\n` +
        `💰 ${priceText}\n\n` +
        `📲 Aapko 1 ghante pehle reminder milega.\n\nSee you soon! 💈`;

      await sendButtons(from, successMsg, [{ id: "main_menu", title: "🏠 Main Menu" }]);

      const rawNotif = (salon?.notification_number || "").replace(/[^0-9]/g, "");
      const notifTarget = rawNotif ? (rawNotif.startsWith("91") ? rawNotif : `91${rawNotif}`) : "";
      const ownerNotif =
        `🔔 *Naya Appointment!*\n\n` +
        `🏪 *Salon:* ${salonName}\n` +
        `👤 *Customer:* ${data.name}\n` +
        `📱 *Phone:* +${from.replace(/^\+/,"")}\n` +
        `✂️ *Service:* ${data.service}\n` +
        `📅 *Date:* ${formatDate(data.date)}\n` +
        `🕐 *Time:* ${formatTime12(data.time)}\n` +
        `💰 *Amount:* ${priceText}\n\n` +
        `_SnipBook se auto-booked_ 💈`;
      if (notifTarget) await sendText(notifTarget, ownerNotif);

      res.status(200).json({ status: "ok" });
      return;
    }

    // confirm — no
    if (step === "confirm" && interactiveId === "confirm_no") {
      await clearSession(sKey);
      await sendText(from, "Koi baat nahi! 😊\nKabhi bhi book karne ke liye \"Hi\" type karein.");
      await sendMainMenu(from, salonName);
      res.status(200).json({ status: "ok" });
      return;
    }

    if (interactiveId === "main_menu") {
      await clearSession(sKey);
      await sendMainMenu(from, salonName);
      res.status(200).json({ status: "ok" });
      return;
    }

    // ─── MAIN MENU OPTIONS ─────────────────────────────────────────────────────

    if (interactiveId === "appointment") {
      const nameSession = await getSession(`name_${from}_${SALON_ID}`);
      const savedName = nameSession?.data?.name || data.name;

      if (savedName) {
        await setSession(sKey, "ask_gender", { ...data, name: savedName });
        await sendButtons(from,
          `Welcome back, *${savedName}!* 🙌\n\nAap kaunsi services chahte hain?`,
          [
            { id: "gender_male",   title: "👨 Male Services" },
            { id: "gender_female", title: "👩 Female Services" },
          ]
        );
      } else {
        await setSession(sKey, "ask_name", { ...data });
        await sendText(from, `📅 *Appointment Book Karein*\n\nGreat! Let's book your appointment. 😊\n\n*Aapka naam kya hai?*`);
      }
      res.status(200).json({ status: "ok" });
      return;
    }

    if (interactiveId === "services") {
      await setSession(sKey, "browse_services_gender", { ...data });
      await sendButtons(from,
        `✂️ *Hamare Services*\n\nKaunsi services dekhna chahte hain?`,
        [
          { id: "browse_male",   title: "👨 Male Services" },
          { id: "browse_female", title: "👩 Female Services" },
        ]
      );
      res.status(200).json({ status: "ok" });
      return;
    }

    if (step === "browse_services_gender" && (interactiveId === "browse_male" || interactiveId === "browse_female")) {
      const gender = interactiveId === "browse_male" ? "male" : "female";
      await setSession(sKey, "browse_services_list", { ...data, gender });

      const filtered = services.filter(s => {
        if (!s.gender || s.gender === "both") return true;
        return s.gender === gender;
      });

      const rows = filtered.slice(0, 9).map(s => ({
        id: `browse_svc_${s.id}`,
        title: `${s.emoji || "✂️"} ${s.name}`.slice(0, 24),
        description: `₹${s.price} · ${s.duration} min`
      }));
      rows.push({ id: "browse_svc_custom", title: "✏️ Koi Aur Service", description: "Apni service khud likhein" });

      const genderLabel = gender === "male" ? "👨 Male" : "👩 Female";
      await sendList(from, `✂️ ${genderLabel} Services`, `Koi bhi service select karein ya book karein 👇`, "Services Dekho", rows);
      res.status(200).json({ status: "ok" });
      return;
    }

    if (step === "browse_services_list" && interactiveId?.startsWith("browse_svc_")) {
      const svcId = interactiveId.replace("browse_svc_", "");

      if (svcId === "custom") {
        await setSession(sKey, "browse_services_custom", { ...data });
        await sendText(from, `✏️ *Apni service likhein:*\n\nJo service chahiye woh type karein\n(e.g. Keratin, Smoothening, Bridal Package)\n\n_Wapas menu ke liye "Hi" type karein_`);
        res.status(200).json({ status: "ok" });
        return;
      }

      const selected = services.find(s => String(s.id) === svcId);
      const serviceName  = selected?.name  || svcId;
      const servicePrice = selected?.price || 0;
      const serviceDur   = selected?.duration || "";

      const priceText = servicePrice > 0 ? `₹${servicePrice}` : "Price on visit";
      const durText   = serviceDur ? ` · ${serviceDur} min` : "";

      await setSession(sKey, "browse_services_list", { ...data });
      await sendButtons(from,
        `✂️ *${serviceName}*\n💰 ${priceText}${durText}\n\nIs service ko book karna chahte hain?`,
        [
          { id: `book_svc_${svcId}`, title: "📅 Appointment Book Karo" },
          { id: "browse_back",        title: "⬅️ Wapas Services" },
        ]
      );
      res.status(200).json({ status: "ok" });
      return;
    }

    if (step === "browse_services_custom" && text && !interactiveId) {
      await sendButtons(from,
        `✂️ *${text}*\n\nIs service ko book karna chahte hain?`,
        [
          { id: `book_custom_${encodeURIComponent(text).slice(0,20)}`, title: "📅 Appointment Book Karo" },
          { id: "browse_back", title: "⬅️ Wapas Services" },
        ]
      );
      await setSession(sKey, "browse_services_list", { ...data, pendingCustomService: text });
      res.status(200).json({ status: "ok" });
      return;
    }

    if (interactiveId === "browse_back") {
      const gender = data.gender || "male";
      const filtered = services.filter(s => {
        if (!s.gender || s.gender === "both") return true;
        return s.gender === gender;
      });
      const rows = filtered.slice(0, 9).map(s => ({
        id: `browse_svc_${s.id}`,
        title: `${s.emoji || "✂️"} ${s.name}`.slice(0, 24),
        description: `₹${s.price} · ${s.duration} min`
      }));
      rows.push({ id: "browse_svc_custom", title: "✏️ Koi Aur Service", description: "Apni service khud likhein" });
      const genderLabel = gender === "male" ? "👨 Male" : "👩 Female";
      await sendList(from, `✂️ ${genderLabel} Services`, `Koi bhi service select karein ya book karein 👇`, "Services Dekho", rows);
      res.status(200).json({ status: "ok" });
      return;
    }

    if (interactiveId?.startsWith("book_svc_") || interactiveId?.startsWith("book_custom_")) {
      let serviceName, servicePrice;

      if (interactiveId.startsWith("book_custom_")) {
        serviceName  = data.pendingCustomService || "Custom Service";
        servicePrice = 0;
      } else {
        const svcId  = interactiveId.replace("book_svc_", "");
        const sel    = services.find(s => String(s.id) === svcId);
        serviceName  = sel?.name  || svcId;
        servicePrice = sel?.price || 0;
      }

      const nameSession = await getSession(`name_${from}_${SALON_ID}`);
      const savedName   = nameSession?.data?.name || data.name;

      if (savedName) {
        await setSession(sKey, "ask_date", { ...data, name: savedName, service: serviceName, price: servicePrice });
        await sendDateList(from, { name: savedName, service: serviceName, price: servicePrice }, workDays);
      } else {
        await setSession(sKey, "ask_name", { ...data, pendingService: serviceName, pendingPrice: servicePrice });
        await sendText(from, `📅 *Appointment Book Karein*\n\nGreat! Let's book your appointment. 😊\n\n*Aapka naam kya hai?*`);
      }
      res.status(200).json({ status: "ok" });
      return;
    }

    if (interactiveId === "timing") {
      const days = (workDays || []).join(", ");
      await sendText(from, `🕐 *Salon Timings*\n\n📅 ${days}\n⏰ ${formatTime(openTime)} – ${formatTime(closeTime)}\n\n_Wapas menu ke liye "Hi" type karein_`);
      res.status(200).json({ status: "ok" });
      return;
    }

    if (interactiveId === "contact") {
      let m = `📞 *Humse Sampark Karein*\n\n📱 Phone: +91 ${phone}`;
      if (address)  m += `\n📍 Address: ${address}`;
      if (mapsLink) m += `\n🗺️ Location: ${mapsLink}`;
      m += `\n\n_Wapas menu ke liye "Hi" type karein_`;
      await sendText(from, m);
      res.status(200).json({ status: "ok" });
      return;
    }

    // Default — main menu
    await clearSession(sKey);
    await sendMainMenu(from, salonName);
    res.status(200).json({ status: "ok" });

  } catch (err) {
    console.error("Handler error:", err.message);
    res.status(200).json({ status: "ok" });
  }
}

// ─── Send date list helper ────────────────────────────────────────────────────
async function sendDateList(to, data, workDays) {
  const days = getNextDays(workDays, 9);
  const rows = days.map(d => ({ id: `date_${d.key}`, title: d.label, description: d.dayName }));
  rows.push({ id: "date_custom", title: "📅 Koi Aur Date", description: "Khud date likhein" });
  const priceText = data.price > 0 ? ` — ₹${data.price}` : "";
  await sendList(to, "📅 Date Chunein", `*${data.service}*${priceText}\n\nKaunsa din aapke liye theek hai?`, "Din Dekho", rows);
}

// ─── Helpers ──────────────────────────────────────────────────────────────────
function getISTNow() {
  const now = new Date();
  return new Date(now.getTime() + 5.5 * 60 * 60 * 1000);
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
      const label = i === 0
        ? `Aaj (${d.getDate()} ${MN[d.getMonth()]})`
        : i === 1
        ? `Kal (${d.getDate()} ${MN[d.getMonth()]})`
        : `${dayName}, ${d.getDate()} ${MN[d.getMonth()]}`;
      result.push({ key, label, dayName });
    }
  }
  return result;
}

function getTimeSlots(open, close, selectedDate = null) {
  const slots = [];
  const istNow = getISTNow();
  const todayKey = `${istNow.getUTCFullYear()}-${pad(istNow.getUTCMonth()+1)}-${pad(istNow.getUTCDate())}`;
  const isToday = selectedDate === todayKey;
  const currentMinutes = istNow.getUTCHours() * 60 + istNow.getUTCMinutes();

  for (let h = open; h < close; h++) {
    const slot00 = h * 60;
    const slot30 = h * 60 + 30;

    if (!isToday || slot00 > currentMinutes + 30) {
      slots.push({ key: `${pad(h)}:00`, label: formatTime12(`${pad(h)}:00`) });
    }
    if (!isToday || slot30 > currentMinutes + 30) {
      slots.push({ key: `${pad(h)}:30`, label: formatTime12(`${pad(h)}:30`) });
    }
  }
  return slots;
}

function parseCustomDate(text) {
  const MN = {
    jan:1,feb:2,mar:3,apr:4,may:5,jun:6,jul:7,aug:8,sep:9,oct:10,nov:11,dec:12,
    january:1,february:2,march:3,april:4,june:6,july:7,august:8,
    september:9,october:10,november:11,december:12
  };
  const t = text.toLowerCase().trim();
  const m = t.match(/(\d{1,2})\s+([a-z]+)(?:\s+(\d{4}))?/);
  if (!m) return null;
  const day = parseInt(m[1]);
  const month = MN[m[2]];
  if (!month || day < 1 || day > 31) return null;
  const year = m[3] ? parseInt(m[3]) : new Date().getFullYear();
  return `${year}-${pad(month)}-${pad(day)}`;
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
  if (h < 12)  return `${h}:00 AM`;
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