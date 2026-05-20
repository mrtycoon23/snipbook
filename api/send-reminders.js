import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_ANON_KEY
);

export default async function handler(req, res) {
  try {
    const now = new Date();

    // 1 hour window: 55 min se 65 min ke beech
    const from = new Date(now.getTime() + 55 * 60 * 1000);
    const to = new Date(now.getTime() + 65 * 60 * 1000);

    // IST = UTC + 5:30 (330 minutes)
    const fromIST = new Date(from.getTime() + 330 * 60 * 1000);
    const toIST = new Date(to.getTime() + 330 * 60 * 1000);

    const pad = (n) => String(n).padStart(2, '0');
    const fromTime = `${pad(fromIST.getHours())}:${pad(fromIST.getMinutes())}`;
    const toTime = `${pad(toIST.getHours())}:${pad(toIST.getMinutes())}`;

    // IST date
    const nowIST = new Date(now.getTime() + 330 * 60 * 1000);
    const todayDate = nowIST.toISOString().split('T')[0];

    const { data: appointments, error } = await supabase
      .from('appointments')
      .select('*, salons(salon_name)')
      .eq('date', todayDate)
      .eq('status', 'confirmed')
      .eq('reminder_sent', false)          // ✅ ADDED — already sent wale skip
      .gte('time_slot', fromTime)
      .lte('time_slot', toTime);

    if (error) throw error;

    if (!appointments || appointments.length === 0) {
      return res.status(200).json({ message: 'No reminders to send', count: 0 });
    }

    let sent = 0;
    let failed = 0;

    for (const apt of appointments) {
      if (!apt.customer_phone) continue;

      let phone = apt.customer_phone.replace(/\D/g, '');
      if (phone.length === 10) phone = '91' + phone;

      const salonName = apt.salons?.salon_name || 'Salon';
      const message = `🔔 *Reminder!*\n\nAapka appointment *${salonName}* mein aaj *${apt.time_slot}* baje hai.\n\nService: ${apt.service}\n\nTime pe aa jaana! 😊`;

      try {
        const response = await fetch('https://api.ycloud.com/v2/whatsapp/messages', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'X-API-Key': process.env.YCLOUD_API_KEY,
          },
          body: JSON.stringify({
            from: process.env.WHATSAPP_PHONE_NUMBER,
            to: phone,
            type: 'text',
            text: { body: message },
          }),
        });

        if (response.ok) {
          sent++;
          // ✅ ADDED — flag set karo taaki dobara na jaaye
          await supabase
            .from('appointments')
            .update({ reminder_sent: true })
            .eq('id', apt.id);
        } else {
          failed++;
        }
      } catch (e) {
        failed++;
      }

      await new Promise(r => setTimeout(r, 300));
    }

    return res.status(200).json({
      message: 'Reminders processed',
      sent,
      failed,
      total: appointments.length
    });

  } catch (err) {
    console.error('Reminder error:', err);
    return res.status(500).json({ error: err.message });
  }
}