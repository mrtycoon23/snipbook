import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const { to, subject, html, type } = req.body;

  try {
    const data = await resend.emails.send({
      from: 'SnipBook <onboarding@resend.dev>',
      to,
      subject,
      html,
    });
    res.status(200).json({ success: true, data });
  } catch (error) {
    console.error('Email error:', error);
    res.status(500).json({ error: error.message });
  }
}
