export const config = { maxDuration: 30 };

const SALON_ID     = "ba0e6447-c162-4bc7-b049-fe825121e092";
const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_ANON_KEY;
const YCLOUD_KEY   = process.env.YCLOUD_API_KEY;
const BOT_NUMBER   = process.env.WHATSAPP_PHONE_NUMBER;

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
    const r = await fetch(`${SUPABASE_URL}/rest/v1/bot_sessions?phone=eq.${encodeURIComponent(phone)}&limit=1`, {
      headers: { apikey: SUPABASE_KEY, Authorization: `Bearer ${SUPABASE_KEY}` }
    });
    const d = await r.json();
    return d?.[0] || null;
  } catch(e) { return null; }
}

async function setSession(phone, step, data = {}) {
  try {
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
    console.log("Session set:", step);
  } catch(e) { console.error("setSession error:", e.message); }
}

async function clearSession(phone) {
  try {
    await fetch(`${SUPABASE_URL}/rest/v1/bot_sessions?phone=eq.${encodeURIComponent(phone)}`, {
      method: "DELETE",
      headers: { apikey: SUPABASE_KEY, Authorization: `Bearer ${SUPABASE_KEY}` }
    });
  } catch(e) {}
}

async function getBookedSlots(date) {
  try {
    const r = await fetch(
      `${SUPABASE_URL}/rest/v1/appointments?salon_id=eq.${SALON_ID}&date=eq.${date}&status=eq.confirmed`,
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
    console.log("sendList: accepted");
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
    // ✅ Duplicate message check
    if (msgId) {
      const processed = await getSession(`dup_${msgId}`);
      if (processed) {
        console.log("Duplicate message ignored:", msgId);
        res.status(200).json({ status: "ok" });
        return;
      }
      await setSession(`dup_${msgId}`, "done", { ts: Date.now() });
    }

    const [salon, session] = await Promise.all([getSalon(), getSession(from)]);

    const salonName = salon?.salon_name   || "SnipBook Salon";
    const services  = (salon?.services    || []).filter(s => s.active !== false);
    const openTime  = parseInt(salon?.open_time)  || 9;
    const closeTime = parseInt(salon?.close_time) || 21;
    const workDays  = salon?.working_days || ["Mon","Tue","Wed","Thu","Fri","Sat"];
    const address   = salon?.address      || "";
    const mapsLink  = salon?.maps_link    || "";
    const phone     = salon?.phone        || "";

    const step = session?.step || "menu";
    const data = session?.data || {};

    console.log("Step:", step, "Data:", JSON.stringify(data));

    // ✅ Hi/Hello — fresh start (naam persistent session delete NAHI hoga)
    const resetWords = ["hi","hello","hii","hey","namaste","menu","start","wapas","back","helo","namaskar"];
    if (text && resetWords.includes(text.toLowerCase())) {
      await clearSession(from);
      await sendMainMenu(from, salonName);
      res.status(200).json({ status: "ok" });
      return;
    }

    // ─── BOOKING FLOW ──────────────────────────────────────────────────────────

    // ask_name
    if (step === "ask_name" && text && !interactiveId) {
      // ✅ Naam persistent key mein save karo
      await setSession(`name_${from}`, "saved", { name: text });

      // Agar browse flow se pending service thi toh seedha date pe jao
      if (data.pendingService) {
        await setSession(from, "ask_date", { name: text, service: data.pendingService, price: data.pendingPrice || 0 });
        await sendDateList(from, { name: text, service: data.pendingService, price: data.pendingPrice || 0 }, workDays);
      } else {
        await setSession(from, "ask_gender", { name: text });
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

    // ask_gender
    if (step === "ask_gender" && (interactiveId === "gender_male" || interactiveId === "gender_female")) {
      const gender = interactiveId === "gender_male" ? "male" : "female";
      await setSession(from, "ask_service", { ...data, gender });

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

    // ask_service — custom
    if (step === "ask_service" && interactiveId === "svc_custom") {
      await setSession(from, "ask_service_custom", { ...data });
      await sendText(from, `✏️ *Apni service likhein:*\n\nJo service chahiye woh type karein\n(e.g. Keratin, Smoothening, Bridal Package)\n\n_Wapas menu ke liye "Hi" type karein_`);
      res.status(200).json({ status: "ok" });
      return;
    }

    // ask_service_custom
    if (step === "ask_service_custom" && text && !interactiveId) {
      await setSession(from, "ask_date", { ...data, service: text, price: 0 });
      await sendDateList(from, data, workDays);
      res.status(200).json({ status: "ok" });
      return;
    }

    // ask_service — select kiya
    if (step === "ask_service" && interactiveId?.startsWith("svc_")) {
      const svcId = interactiveId.replace("svc_", "");
      const selected = services.find(s => String(s.id) === svcId);
      const serviceName  = selected?.name  || svcId;
      const servicePrice = selected?.price || 0;
      await setSession(from, "ask_date", { ...data, service: serviceName, price: servicePrice });
      await sendDateList(from, { ...data, service: serviceName, price: servicePrice }, workDays);
      res.status(200).json({ status: "ok" });
      return;
    }

    // ask_date — custom date option
    if (step === "ask_date" && interactiveId === "date_custom") {
      await setSession(from, "ask_date_custom", { ...data });
      await sendText(from, `📅 *Apni marzi ki date likhein*\n\nKoi bhi aane wali date type karein 👇\n_(Jaise: 25 May, 3 June, 15 Jul)_\n\n_Wapas menu ke liye "Hi" type karein_`);
      res.status(200).json({ status: "ok" });
      return;
    }

    // ask_date_custom — user ne type kiya
    if (step === "ask_date_custom" && text && !interactiveId) {
      const parsedDate = parseCustomDate(text);
      if (!parsedDate) {
        await sendText(from, `⚠️ Date samajh nahi aai!\n\nKripya is format mein likhein:\n*25 May* ya *2 June*`);
        res.status(200).json({ status: "ok" });
        return;
      }
      await setSession(from, "ask_time_part", { ...data, date: parsedDate });
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

    // ask_date — date select ki
    if (step === "ask_date" && interactiveId?.startsWith("date_")) {
      const dateKey = interactiveId.replace("date_", "");
      await setSession(from, "ask_time_part", { ...data, date: dateKey });
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

    // ask_time_part
    if (step === "ask_time_part" && (interactiveId === "time_morning" || interactiveId === "time_evening")) {
      const isMorning = interactiveId === "time_morning";
      const startH = isMorning ? openTime : 14;
      const endH   = isMorning ? 14 : closeTime;

      const booked = await getBookedSlots(data.date);
      const allSlots = getTimeSlots(startH, endH);
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

      await setSession(from, "ask_time", { ...data });
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

    // ask_time
    if (step === "ask_time" && interactiveId?.startsWith("time_")) {
      const timeKey = interactiveId.replace("time_", "");
      await setSession(from, "confirm", { ...data, time: timeKey });

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
      // ✅ FIX 1: customer_name bhi save karo
      await fetch(`${SUPABASE_URL}/rest/v1/appointments`, {
        method: "POST",
        headers: {
          apikey: SUPABASE_KEY,
          Authorization: `Bearer ${SUPABASE_KEY}`,
          "Content-Type": "application/json",
          Prefer: "return=minimal",
        },
        body: JSON.stringify({
          salon_id:      SALON_ID,
          customer_name: data.name || "WhatsApp Customer",
          customer_phone: from,
          service:       data.service,
          amount:        data.price || 0,
          date:          data.date,
          time_slot:     data.time,
          status:        "confirmed",
        }),
      });
      await clearSession(from);

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

      // ✅ FIX 2: Owner ko WhatsApp notification bhejo
      const ownerPhone = (salon?.whatsapp_number || "").replace(/[^0-9]/g, "");
      const notifTarget = ownerPhone || BOT_NUMBER; // fallback bot number pe
      const ownerNotif =
        `🔔 *Naya Appointment!*\n\n` +
        `👤 *Customer:* ${data.name}\n` +
        `📱 *Phone:* +${from}\n` +
        `✂️ *Service:* ${data.service}\n` +
        `📅 *Date:* ${formatDate(data.date)}\n` +
        `🕐 *Time:* ${formatTime12(data.time)}\n` +
        `💰 *Amount:* ${priceText}\n\n` +
        `_SnipBook se auto-booked_ 💈`;
      await sendText(notifTarget, ownerNotif);

      res.status(200).json({ status: "ok" });
      return;
    }

    // confirm — no
    if (step === "confirm" && interactiveId === "confirm_no") {
      await clearSession(from);
      await sendText(from, "Koi baat nahi! 😊\nKabhi bhi book karne ke liye \"Hi\" type karein.");
      await sendMainMenu(from, salonName);
      res.status(200).json({ status: "ok" });
      return;
    }

    if (interactiveId === "main_menu") {
      await clearSession(from);
      await sendMainMenu(from, salonName);
      res.status(200).json({ status: "ok" });
      return;
    }

    // ─── MAIN MENU OPTIONS ─────────────────────────────────────────────────────

    if (interactiveId === "appointment") {
      // ✅ FIX 2: Pehle persistent naam session check karo
      const nameSession = await getSession(`name_${from}`);
      const savedName = nameSession?.data?.name || data.name;

      if (savedName) {
        await setSession(from, "ask_gender", { ...data, name: savedName });
        await sendButtons(from,
          `Welcome back, *${savedName}!* 🙌\n\nAap kaunsi services chahte hain?`,
          [
            { id: "gender_male",   title: "👨 Male Services" },
            { id: "gender_female", title: "👩 Female Services" },
          ]
        );
      } else {
        await setSession(from, "ask_name", {});
        await sendText(from, `📅 *Appointment Book Karein*\n\nGreat! Let's book your appointment. 😊\n\n*Aapka naam kya hai?*`);
      }
      res.status(200).json({ status: "ok" });
      return;
    }

    if (interactiveId === "services") {
      // ✅ Services Dekho → pehle gender chunein
      await setSession(from, "browse_services_gender", { ...data });
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

    // browse_services_gender — Male ya Female select kiya
    if (step === "browse_services_gender" && (interactiveId === "browse_male" || interactiveId === "browse_female")) {
      const gender = interactiveId === "browse_male" ? "male" : "female";
      await setSession(from, "browse_services_list", { ...data, gender });

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

    // browse_services_list — service select ki → book karne ka option do
    if (step === "browse_services_list" && interactiveId?.startsWith("browse_svc_")) {
      const svcId = interactiveId.replace("browse_svc_", "");

      if (svcId === "custom") {
        await setSession(from, "browse_services_custom", { ...data });
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

      await setSession(from, "browse_services_list", { ...data });
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

    // browse_services_custom — custom service type ki
    if (step === "browse_services_custom" && text && !interactiveId) {
      await sendButtons(from,
        `✂️ *${text}*\n\nIs service ko book karna chahte hain?`,
        [
          { id: `book_custom_${encodeURIComponent(text).slice(0,20)}`, title: "📅 Appointment Book Karo" },
          { id: "browse_back", title: "⬅️ Wapas Services" },
        ]
      );
      await setSession(from, "browse_services_list", { ...data, pendingCustomService: text });
      res.status(200).json({ status: "ok" });
      return;
    }

    // browse_back — wapas services list
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

    // book_svc_* → appointment flow mein le jao (naam check karke)
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

      const nameSession = await getSession(`name_${from}`);
      const savedName   = nameSession?.data?.name || data.name;

      if (savedName) {
        await setSession(from, "ask_date", { name: savedName, service: serviceName, price: servicePrice });
        await sendDateList(from, { name: savedName, service: serviceName, price: servicePrice }, workDays);
      } else {
        await setSession(from, "ask_name", { pendingService: serviceName, pendingPrice: servicePrice });
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

    // Default
    await clearSession(from);
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
function getNextDays(workDays, count) {
  const DN = ["Sun","Mon","Tue","Wed","Thu","Fri","Sat"];
  const MN = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
  const result = [];
  const today = new Date();
  for (let i = 1; result.length < count && i <= 60; i++) {
    const d = new Date(today);
    d.setDate(today.getDate() + i);
    const dayName = DN[d.getDay()];
    if (!workDays || workDays.includes(dayName)) {
      const key = `${d.getFullYear()}-${pad(d.getMonth()+1)}-${pad(d.getDate())}`;
      const label = i === 1
        ? `Tomorrow (${d.getDate()} ${MN[d.getMonth()]})`
        : `${dayName}, ${d.getDate()} ${MN[d.getMonth()]}`;
      result.push({ key, label, dayName });
    }
  }
  return result;
}

function getTimeSlots(open, close) {
  const slots = [];
  for (let h = open; h < close; h++) {
    slots.push({ key: `${pad(h)}:00`, label: formatTime12(`${pad(h)}:00`) });
    slots.push({ key: `${pad(h)}:30`, label: formatTime12(`${pad(h)}:30`) });
  }
  return slots;
}

function parseCustomDate(text) {
  const MN = {
    jan:1, feb:2, mar:3, apr:4, may:5, jun:6, jul:7, aug:8, sep:9, oct:10, nov:11, dec:12,
    january:1, february:2, march:3, april:4, june:6, july:7, august:8,
    september:9, october:10, november:11, december:12
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