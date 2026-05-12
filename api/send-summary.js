export const config = { maxDuration: 30 };

const YCLOUD_KEY = process.env.YCLOUD_API_KEY;
const BOT_NUMBER = process.env.WHATSAPP_PHONE_NUMBER;

async function sendText(to, body) {
  try {
    const res = await fetch("https://api.ycloud.com/v2/whatsapp/messages", {
      method: "POST",
      headers: { "X-API-Key": YCLOUD_KEY, "Content-Type": "application/json" },
      body: JSON.stringify({ from: BOT_NUMBER, to, type: "text", text: { body } }),
    });
    const data = await res.json();
    return data;
  } catch(e) {
    console.error("sendText error:", e.message);
    return null;
  }
}

async function sendImage(to, imageUrl, caption) {
  try {
    const res = await fetch("https://api.ycloud.com/v2/whatsapp/messages", {
      method: "POST",
      headers: { "X-API-Key": YCLOUD_KEY, "Content-Type": "application/json" },
      body: JSON.stringify({
        from: BOT_NUMBER,
        to,
        type: "image",
        image: { link: imageUrl, caption: caption || "" },
      }),
    });
    const data = await res.json();
    return data;
  } catch(e) {
    console.error("sendImage error:", e.message);
    return null;
  }
}

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(200).json({ status: "ok" });
  }

  try {
    const { customerPhone, customerName, salonName, visit } = req.body;

    if (!customerPhone || !visit) {
      return res.status(400).json({ error: "customerPhone aur visit required hai" });
    }

    // Phone number clean karo — 91XXXXXXXXXX format
    const cleanPhone = customerPhone.replace(/[^0-9]/g, "");
    const toPhone = cleanPhone.startsWith("91") ? cleanPhone : `91${cleanPhone}`;

    const services = (visit.services || []).join(", ");
    const amount = visit.amount || 0;
    const date = visit.date || "";
    const notes = visit.notes || "";
    const photos = visit.photos || [];
    const stylist = visit.stylist || "";

    // ✅ Main summary message
    const msg =
      `🙏 *Namaste ${customerName}!*\n\n` +
      `✂️ *Visit Summary*\n` +
      `💈 ${salonName || "Our Salon"}\n\n` +
      `📅 *Date:* ${date}\n` +
      `✂️ *Services:* ${services}\n` +
      (stylist ? `👨‍💼 *Stylist:* ${stylist}\n` : "") +
      `💰 *Amount:* ₹${amount}\n` +
      (notes ? `\n📝 *Notes:* ${notes}\n` : "") +
      (photos.length > 0 ? `\n📸 *${photos.length} photo${photos.length > 1 ? "s" : ""} neeche hain*\n` : "") +
      `\n_Thank you for visiting! See you again soon 💈_\n` +
      `_Powered by SnipBook_`;

    // Send text message
    await sendText(toPhone, msg);

    // Send photos one by one
    if (photos.length > 0) {
      for (let i = 0; i < photos.length; i++) {
        const photo = photos[i];
        const photoUrl = photo.url || photo;
        if (photoUrl && photoUrl.startsWith("http")) {
          await sendImage(toPhone, photoUrl, i === 0 ? `📸 Visit photo ${i + 1}/${photos.length}` : `📸 ${i + 1}/${photos.length}`);
          // Small delay between photos
          await new Promise(r => setTimeout(r, 500));
        }
      }
    }

    return res.status(200).json({ 
      status: "sent", 
      message: `Summary sent to ${toPhone}`,
      photosCount: photos.length 
    });

  } catch (err) {
    console.error("send-summary error:", err.message);
    return res.status(500).json({ error: err.message });
  }
}
