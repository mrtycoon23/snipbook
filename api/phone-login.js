export const config = { maxDuration: 10 };

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_ANON_KEY;
const SERVICE_KEY  = process.env.SUPABASE_SERVICE_ROLE_KEY;

export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).end();

  const { phone } = req.body || {};
  const phone10 = (phone || "").replace(/\D/g, "").slice(0, 10);
  if (phone10.length !== 10) return res.status(400).json({ error: "Invalid phone number" });

  try {
    let salonId = null;
    for (const field of ["notification_number", "phone"]) {
      const r = await fetch(
        `${SUPABASE_URL}/rest/v1/salons?${field}=eq.${phone10}&select=id&limit=1`,
        { headers: { apikey: SUPABASE_KEY, Authorization: `Bearer ${SUPABASE_KEY}` } }
      );
      const d = await r.json();
      if (d?.[0]?.id) { salonId = d[0].id; break; }
    }
    if (!salonId) return res.status(404).json({ error: "No account found with this phone number" });

    const r2 = await fetch(`${SUPABASE_URL}/auth/v1/admin/users/${salonId}`, {
      headers: { apikey: SERVICE_KEY, Authorization: `Bearer ${SERVICE_KEY}` }
    });
    const userData = await r2.json();
    const email = userData?.email;
    if (!email) return res.status(404).json({ error: "Email not found. Please login with email." });

    return res.status(200).json({ email });
  } catch (e) {
    return res.status(500).json({ error: e.message });
  }
}
