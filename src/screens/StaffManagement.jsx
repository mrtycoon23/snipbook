import { useState, useEffect } from "react";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  import.meta.env.VITE_SUPABASE_URL,
  import.meta.env.VITE_SUPABASE_ANON_KEY
);

// ─── Theme ────────────────────────────────────────────────────────────────────
const C = {
  purple:      "#1e1b4b",
  purpleMid:   "#7c3aed",
  purpleLight: "#ede9fe",
  purpleBorder:"#ddd6fe",
  bg:          "#f5f3ff",
  white:       "#ffffff",
  text:        "#1e1b4b",
  textMuted:   "#6b7280",
  textLight:   "#9ca3af",
  border:      "#e5e7eb",
  green:       "#16a34a",
  greenBg:     "#f0fdf4",
  orange:      "#f59e0b",
  red:         "#ef4444",
  redBg:       "#fff5f5",
  blue:        "#2563eb",
};

const fmt = (n) =>
  new Intl.NumberFormat("en-IN", { maximumFractionDigits: 0 }).format(n || 0);

const getInitials = (name = "") =>
  name.split(" ").slice(0, 2).map((w) => w[0]).join("").toUpperCase();

const AVATAR_COLORS = [
  "#7c3aed","#2563eb","#059669","#dc2626","#d97706","#0891b2","#be185d","#0f766e",
];
const avatarColor = (name = "") =>
  AVATAR_COLORS[(name?.charCodeAt(0) || 0) % AVATAR_COLORS.length];

// ─── Avatar ───────────────────────────────────────────────────────────────────
const Avatar = ({ name, photo, size = 44, status }) => {
  const statusColor =
    status === "available" || status === "active" ? C.green
    : status === "on_leave" || status === "away"  ? C.orange
    : status === "offline"                         ? C.red : null;
  return (
    <div style={{ position: "relative", flexShrink: 0 }}>
      {photo ? (
        <img src={photo} alt={name} style={{ width: size, height: size, borderRadius: "50%", objectFit: "cover" }} />
      ) : (
        <div style={{ width: size, height: size, borderRadius: "50%", background: avatarColor(name), display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", fontWeight: 700, fontSize: size * 0.36 }}>
          {getInitials(name)}
        </div>
      )}
      {statusColor && (
        <span style={{ position: "absolute", bottom: 2, right: 2, width: size * 0.25, height: size * 0.25, borderRadius: "50%", background: statusColor, border: "2px solid #fff" }} />
      )}
    </div>
  );
};

const StatusLabel = ({ status }) => {
  const map = {
    available: { label: "Available", color: C.green },
    active:    { label: "Available", color: C.green },
    on_leave:  { label: "On Leave",  color: C.orange },
    away:      { label: "Away",      color: C.orange },
    offline:   { label: "Absent",    color: C.red },
  };
  const s = map[status] || { label: status, color: C.textMuted };
  return (
    <span style={{ fontSize: 11, color: s.color, fontWeight: 500 }}>
      <span style={{ display: "inline-block", width: 7, height: 7, borderRadius: "50%", background: s.color, marginRight: 4 }} />
      {s.label}
    </span>
  );
};

// ══════════════════════════════════════════════════════════════════════════════
// PAGE 1 — Staff List
// ══════════════════════════════════════════════════════════════════════════════
const StaffListScreen = ({ staff, onBack, onAddStaff, onViewAnalytics, onSelectStaff }) => {
  const [period, setPeriod] = useState("Today");
  const periods = ["Today", "Week", "Month", "Custom"];

  const totalRevenue = staff.reduce((s, m) => s + (m.revenue_today || 0), 0);
  const totalServices = staff.reduce((s, m) => s + (m.services_today || 0), 0);

  return (
    <div style={{ background: C.bg, minHeight: "100vh", paddingBottom: 80 }}>
      <div style={{ padding: "14px 16px 0" }}>

        {/* Back button */}
        <button onClick={onBack} style={{ display: "flex", alignItems: "center", gap: 8, background: "none", border: "none", cursor: "pointer", marginBottom: 12, padding: 0 }}>
          <div style={{ width: 34, height: 34, borderRadius: 10, background: C.white, border: `1px solid ${C.border}`, display: "flex", alignItems: "center", justifyContent: "center" }}>
            <i className="ti ti-arrow-left" style={{ fontSize: 16, color: C.text }} />
          </div>
          <span style={{ fontSize: 13, color: C.textMuted, fontWeight: 500 }}>Back</span>
        </button>

        {/* Title + Action buttons */}
        <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 12 }}>
          <div>
            <div style={{ fontSize: 20, fontWeight: 700, color: C.text }}>Staff Management</div>
            <div style={{ fontSize: 11, color: C.textMuted, marginTop: 2 }}>Manage your team performance</div>
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            <button onClick={onAddStaff} style={{ background: C.purpleMid, color: C.white, border: "none", borderRadius: 10, padding: "8px 14px", fontSize: 12, fontWeight: 600, cursor: "pointer" }}>
              + Add Staff
            </button>
            <button onClick={onViewAnalytics} style={{ background: C.white, color: C.purpleMid, border: `1px solid ${C.purpleBorder}`, borderRadius: 10, padding: "8px 14px", fontSize: 12, fontWeight: 500, cursor: "pointer" }}>
              <i className="ti ti-chart-line" style={{ fontSize: 12, marginRight: 4 }} />
              Analytics
            </button>
          </div>
        </div>

        {/* Period tabs */}
        <div style={{ display: "flex", gap: 4, marginBottom: 12 }}>
          {periods.map((p) => (
            <button key={p} onClick={() => setPeriod(p)} style={{ flex: 1, padding: "8px 0", borderRadius: 10, border: "none", background: period === p ? C.purpleMid : C.white, color: period === p ? C.white : C.textMuted, fontWeight: period === p ? 600 : 400, fontSize: 12, cursor: "pointer" }}>
              {p}
            </button>
          ))}
        </div>

        {/* 3 Stat Cards */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 8, marginBottom: 14 }}>
          {[
            { icon: "ti-users",          value: staff.length,        label: "Active Staff",   change: "2 vs yest." },
            { icon: "ti-currency-rupee", value: `₹${fmt(totalRevenue)}`, label: "Revenue",    change: "18% vs yest." },
            { icon: "ti-cut",            value: totalServices,       label: "Services",       change: "12% vs yest." },
          ].map((c) => (
            <div key={c.label} style={{ background: C.white, borderRadius: 12, border: `1px solid ${C.border}`, padding: "12px 8px", display: "flex", flexDirection: "column", alignItems: "center", textAlign: "center" }}>
              <div style={{ width: 30, height: 30, borderRadius: "50%", background: C.purpleLight, display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 7 }}>
                <i className={`ti ${c.icon}`} style={{ fontSize: 14, color: C.purpleMid }} />
              </div>
              <div style={{ fontSize: 18, fontWeight: 700, color: C.text }}>{c.value}</div>
              <div style={{ fontSize: 10, color: C.textMuted, marginTop: 2 }}>{c.label}</div>
              <div style={{ fontSize: 9, color: C.green, marginTop: 4 }}>↑ {c.change}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Staff Cards */}
      <div style={{ padding: "0 16px", display: "flex", flexDirection: "column", gap: 8 }}>
        {staff.map((s) => (
          <div key={s.id} onClick={() => onSelectStaff(s)} style={{ background: C.white, borderRadius: 12, padding: 12, border: `1px solid ${C.border}`, display: "flex", alignItems: "center", gap: 10, cursor: "pointer" }}>
            <Avatar name={s.name} photo={s.photo} size={44} status={s.status} />
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontWeight: 600, fontSize: 13, color: C.text, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{s.name}</div>
              <div style={{ fontSize: 11, color: C.textMuted, margin: "2px 0 3px" }}>{s.role || "Staff"}</div>
              <StatusLabel status={s.status} />
            </div>
            <div style={{ background: C.purpleLight, borderRadius: 8, padding: "7px 10px", textAlign: "center", flexShrink: 0 }}>
              <div style={{ fontWeight: 700, fontSize: 12, color: C.purpleMid }}>₹{fmt(s.revenue_today)}</div>
              <div style={{ fontSize: 9, color: C.textMuted, marginTop: 1 }}>Revenue</div>
            </div>
            <div style={{ textAlign: "right", flexShrink: 0 }}>
              <div style={{ fontWeight: 600, fontSize: 13, color: C.text }}>{s.services_today || 0}</div>
              <div style={{ fontSize: 9, color: C.textMuted }}>Services</div>
              <div style={{ fontWeight: 600, fontSize: 11, color: C.green, marginTop: 3 }}>{s.attendance_pct || 0}%</div>
              <div style={{ fontSize: 9, color: C.textMuted }}>Att.</div>
            </div>
            <i className="ti ti-chevron-right" style={{ fontSize: 16, color: C.textLight, flexShrink: 0 }} />
          </div>
        ))}
      </div>
    </div>
  );
};

// ══════════════════════════════════════════════════════════════════════════════
// PAGE 2 — Staff Profile
// ══════════════════════════════════════════════════════════════════════════════
const StaffProfileScreen = ({ member, salonId, onBack, onEdit }) => {
  const [period, setPeriod] = useState("Mahine");
  const [fromDate, setFromDate] = useState(() => {
    const d = new Date(); d.setDate(1);
    return d.toISOString().split("T")[0];
  });
  const [toDate, setToDate] = useState(() => new Date().toISOString().split("T")[0]);
  const [workLogs, setWorkLogs] = useState([]);
  const [attendance, setAttendance] = useState([]);
  const [showAddEntry, setShowAddEntry] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => { loadData(); }, [period, fromDate, toDate]);

  const getDateRange = () => {
    const today = new Date();
    const toStr = today.toISOString().split("T")[0];
    if (period === "Aaj") {
      return { from: toStr, to: toStr };
    } else if (period === "Hafte") {
      const from = new Date(today); from.setDate(today.getDate() - 6);
      return { from: from.toISOString().split("T")[0], to: toStr };
    } else if (period === "Mahine") {
      const from = new Date(today.getFullYear(), today.getMonth(), 1);
      return { from: from.toISOString().split("T")[0], to: toStr };
    } else {
      return { from: fromDate, to: toDate };
    }
  };

  const loadData = async () => {
    setLoading(true);
    const { from, to } = getDateRange();
    const [logsRes, attRes] = await Promise.all([
      supabase.from("work_logs").select("*").eq("staff_id", member.id).gte("date", from).lte("date", to).order("date", { ascending: false }),
      supabase.from("attendance").select("*").eq("staff_id", member.id).gte("date", from).lte("date", to),
    ]);
    if (logsRes.data) setWorkLogs(logsRes.data);
    if (attRes.data) setAttendance(attRes.data);
    setLoading(false);
  };

  const totalClients = workLogs.reduce((s, l) => s + (l.clients || 0), 0);
  const totalRevenue = workLogs.reduce((s, l) => s + (l.revenue || 0), 0);
  const presentDays = attendance.filter((a) => a.status === "present").length;
  const totalDays = attendance.length;
  const attendancePct = totalDays ? Math.round((presentDays / totalDays) * 100) : 0;
  const absentDays = totalDays - presentDays;
  const attBarWidth = totalDays ? `${(presentDays / totalDays) * 100}%` : "0%";

  const handleMessage = () => {
    if (member.phone) window.open(`https://wa.me/91${member.phone.replace(/\D/g, "")}`, "_blank");
  };

  const handleSchedule = () => {
    alert(`Schedule feature coming soon for ${member.name}`);
  };

  return (
    <div style={{ background: C.bg, minHeight: "100vh", paddingBottom: 80 }}>

      {/* Dark purple header */}
      <div style={{ background: C.purple, padding: "14px 16px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <button onClick={onBack} style={{ background: "rgba(255,255,255,0.12)", border: "none", borderRadius: 10, padding: "7px 14px", display: "flex", alignItems: "center", gap: 6, cursor: "pointer" }}>
          <i className="ti ti-arrow-left" style={{ fontSize: 15, color: C.white }} />
          <span style={{ fontSize: 13, color: C.white, fontWeight: 500 }}>Back</span>
        </button>
        <span style={{ fontSize: 16, fontWeight: 700, color: C.white }}>Staff Profile</span>
        <button onClick={() => onEdit(member)} style={{ background: "rgba(255,255,255,0.12)", border: "none", borderRadius: 10, padding: "7px 14px", display: "flex", alignItems: "center", gap: 6, cursor: "pointer" }}>
          <i className="ti ti-pencil" style={{ fontSize: 15, color: C.white }} />
          <span style={{ fontSize: 13, color: C.white, fontWeight: 500 }}>Edit</span>
        </button>
      </div>

      <div style={{ padding: "14px 16px", display: "flex", flexDirection: "column", gap: 12 }}>

        {/* Profile card */}
        <div style={{ background: C.white, borderRadius: 16, padding: 16, border: `1px solid ${C.border}`, display: "flex", alignItems: "center", gap: 14 }}>
          <Avatar name={member.name} photo={member.photo} size={62} status={member.status} />
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontWeight: 700, fontSize: 18, color: C.text }}>{member.name}</div>
            <div style={{ fontSize: 12, color: C.textMuted, marginTop: 1 }}>{member.role || "Staff"}</div>
            {member.phone && (
              <div style={{ display: "flex", alignItems: "center", gap: 5, marginTop: 5 }}>
                <i className="ti ti-phone" style={{ fontSize: 13, color: C.textMuted }} />
                <span style={{ fontSize: 12, color: C.textMuted }}>{member.phone}</span>
              </div>
            )}
            {member.salary && (
              <div style={{ fontSize: 13, fontWeight: 700, color: C.green, marginTop: 5 }}>₹{fmt(member.salary)} / month</div>
            )}
          </div>
          <button
            onClick={() => alert("Salary slip feature coming soon!")}
            style={{ background: C.white, border: `1px solid ${C.border}`, borderRadius: 12, padding: "12px 10px", textAlign: "center", flexShrink: 0, cursor: "pointer", minWidth: 68 }}
          >
            <i className="ti ti-file-invoice" style={{ fontSize: 22, color: C.purpleMid, display: "block", marginBottom: 4 }} />
            <div style={{ fontSize: 10, color: C.purpleMid, fontWeight: 600, lineHeight: 1.3 }}>Salary<br />Slip</div>
            <i className="ti ti-chevron-right" style={{ fontSize: 11, color: C.textLight, marginTop: 2, display: "block" }} />
          </button>
        </div>

        {/* Period pills */}
        <div style={{ display: "flex", gap: 8 }}>
          {["Aaj", "Hafte", "Mahine"].map((p) => (
            <button key={p} onClick={() => setPeriod(p)} style={{ background: period === p ? C.purpleMid : C.white, border: period === p ? "none" : `1px solid ${C.border}`, borderRadius: 20, padding: "7px 18px", fontSize: 13, color: period === p ? C.white : C.text, fontWeight: period === p ? 600 : 500, cursor: "pointer" }}>
              {p}
            </button>
          ))}
        </div>

        {/* Custom date range */}
        <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
          <div style={{ flex: 1, background: C.white, border: `1px solid ${C.border}`, borderRadius: 10, padding: "9px 12px", display: "flex", alignItems: "center", gap: 8 }}>
            <i className="ti ti-calendar" style={{ fontSize: 15, color: C.purpleMid }} />
            <input type="date" value={fromDate} onChange={(e) => { setFromDate(e.target.value); setPeriod("Custom"); }} style={{ border: "none", outline: "none", flex: 1, fontSize: 12, color: C.text, background: "transparent" }} />
          </div>
          <span style={{ color: C.textMuted, fontSize: 14, fontWeight: 500 }}>→</span>
          <div style={{ flex: 1, background: C.white, border: `1px solid ${C.border}`, borderRadius: 10, padding: "9px 12px", display: "flex", alignItems: "center", gap: 8 }}>
            <i className="ti ti-calendar" style={{ fontSize: 15, color: C.purpleMid }} />
            <input type="date" value={toDate} onChange={(e) => { setToDate(e.target.value); setPeriod("Custom"); }} style={{ border: "none", outline: "none", flex: 1, fontSize: 12, color: C.text, background: "transparent" }} />
          </div>
        </div>

        {/* 3 Stat boxes */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 8 }}>
          <div style={{ background: C.greenBg, borderRadius: 14, padding: "14px 8px", textAlign: "center" }}>
            <i className="ti ti-users" style={{ fontSize: 22, color: C.green, display: "block", marginBottom: 6 }} />
            <div style={{ fontSize: 22, fontWeight: 700, color: C.green }}>{totalClients}</div>
            <div style={{ fontSize: 11, color: C.green, marginTop: 4, fontWeight: 500 }}>Clients</div>
            <div style={{ fontSize: 9, color: C.green, marginTop: 4 }}>↑ 0% vs last month</div>
          </div>
          <div style={{ background: "#faf5ff", borderRadius: 14, padding: "14px 8px", textAlign: "center", border: `1px solid ${C.purpleBorder}` }}>
            <i className="ti ti-currency-rupee" style={{ fontSize: 22, color: C.purpleMid, display: "block", marginBottom: 6 }} />
            <div style={{ fontSize: 22, fontWeight: 700, color: C.text }}>₹{fmt(totalRevenue)}</div>
            <div style={{ fontSize: 11, color: C.textMuted, marginTop: 4, fontWeight: 500 }}>Revenue</div>
            <div style={{ fontSize: 9, color: C.green, marginTop: 4 }}>↑ 0% vs last month</div>
          </div>
          <div style={{ background: C.redBg, borderRadius: 14, padding: "14px 8px", textAlign: "center" }}>
            <i className="ti ti-cut" style={{ fontSize: 22, color: C.red, display: "block", marginBottom: 6 }} />
            <div style={{ fontSize: 22, fontWeight: 700, color: C.red }}>{attendancePct}%</div>
            <div style={{ fontSize: 11, color: C.red, marginTop: 4, fontWeight: 500 }}>Attendance</div>
            <div style={{ fontSize: 9, color: C.red, marginTop: 4 }}>↓ 0% vs last month</div>
          </div>
        </div>

        {/* Attendance bar */}
        <div style={{ background: C.white, borderRadius: 12, padding: "12px 14px", border: `1px solid ${C.border}` }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
            <span style={{ fontSize: 12, color: C.green, fontWeight: 600, display: "flex", alignItems: "center", gap: 5 }}>
              <span style={{ width: 9, height: 9, borderRadius: "50%", background: C.green, display: "inline-block" }} />
              {presentDays} din present
            </span>
            <span style={{ fontSize: 12, color: C.red, fontWeight: 600, display: "flex", alignItems: "center", gap: 5 }}>
              {absentDays} din absent
              <span style={{ width: 9, height: 9, borderRadius: "50%", background: C.red, display: "inline-block" }} />
            </span>
          </div>
          <div style={{ height: 7, background: "#fee2e2", borderRadius: 4, overflow: "hidden" }}>
            <div style={{ width: attBarWidth, height: "100%", background: C.green, borderRadius: 4 }} />
          </div>
        </div>

        {/* Action buttons */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 8 }}>
          <button onClick={handleMessage} style={{ background: C.white, border: `1px solid ${C.border}`, borderRadius: 12, padding: "12px 8px", display: "flex", flexDirection: "column", alignItems: "center", gap: 5, cursor: "pointer" }}>
            <i className="ti ti-brand-whatsapp" style={{ fontSize: 20, color: C.purpleMid }} />
            <span style={{ fontSize: 12, color: C.purpleMid, fontWeight: 500 }}>Message</span>
          </button>
          <button onClick={handleSchedule} style={{ background: C.white, border: `1px solid ${C.border}`, borderRadius: 12, padding: "12px 8px", display: "flex", flexDirection: "column", alignItems: "center", gap: 5, cursor: "pointer" }}>
            <i className="ti ti-calendar-event" style={{ fontSize: 20, color: C.purpleMid }} />
            <span style={{ fontSize: 12, color: C.purpleMid, fontWeight: 500 }}>Schedule</span>
          </button>
          <button onClick={() => alert("More options coming soon!")} style={{ background: C.white, border: `1px solid ${C.border}`, borderRadius: 12, padding: "12px 8px", display: "flex", flexDirection: "column", alignItems: "center", gap: 5, cursor: "pointer" }}>
            <i className="ti ti-dots" style={{ fontSize: 20, color: C.purpleMid }} />
            <span style={{ fontSize: 12, color: C.purpleMid, fontWeight: 500 }}>More</span>
          </button>
        </div>

        {/* Kaam ki Entries */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div style={{ fontSize: 16, fontWeight: 700, color: C.text }}>Kaam ki Entries</div>
          <button onClick={() => setShowAddEntry(true)} style={{ background: C.purpleMid, color: C.white, border: "none", borderRadius: 10, padding: "8px 16px", fontSize: 12, fontWeight: 600, cursor: "pointer", display: "flex", alignItems: "center", gap: 5 }}>
            <i className="ti ti-plus" style={{ fontSize: 13, color: C.white }} />
            Add Entry
          </button>
        </div>

        {/* Work log entries or empty state */}
        {loading ? (
          <div style={{ textAlign: "center", padding: 24, color: C.textMuted, fontSize: 13 }}>Loading...</div>
        ) : workLogs.length === 0 ? (
          <div style={{ background: C.white, borderRadius: 14, padding: 32, border: `1px solid ${C.border}`, textAlign: "center" }}>
            <div style={{ width: 56, height: 56, borderRadius: "50%", background: C.purpleLight, display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 12px" }}>
              <i className="ti ti-clipboard-list" style={{ fontSize: 26, color: C.purpleMid }} />
            </div>
            <div style={{ fontSize: 14, fontWeight: 600, color: C.text, marginBottom: 4 }}>Koi entry nahi abhi</div>
            <div style={{ fontSize: 12, color: C.textLight }}>Jab bhi kaam assign hoga, yahan dikhega.</div>
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {workLogs.map((log) => (
              <div key={log.id} style={{ background: C.white, borderRadius: 12, padding: "12px 14px", border: `1px solid ${C.border}` }}>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
                  <span style={{ fontSize: 13, fontWeight: 600, color: C.text }}>{log.service_name || "Service"}</span>
                  <span style={{ fontSize: 13, fontWeight: 700, color: C.purpleMid }}>₹{fmt(log.revenue)}</span>
                </div>
                <div style={{ display: "flex", gap: 12 }}>
                  <span style={{ fontSize: 11, color: C.textMuted }}>{log.date}</span>
                  <span style={{ fontSize: 11, color: C.textMuted }}>{log.clients} client{log.clients !== 1 ? "s" : ""}</span>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Add Entry Modal */}
        {showAddEntry && (
          <AddEntryModal
            staffId={member.id}
            salonId={salonId}
            onClose={() => setShowAddEntry(false)}
            onSaved={() => { setShowAddEntry(false); loadData(); }}
          />
        )}
      </div>
    </div>
  );
};

// ─── Add Entry Modal ──────────────────────────────────────────────────────────
const AddEntryModal = ({ staffId, salonId, onClose, onSaved }) => {
  const [form, setForm] = useState({ service_name: "", revenue: "", clients: 1, date: new Date().toISOString().split("T")[0], notes: "" });
  const [saving, setSaving] = useState(false);

  const save = async () => {
    if (!form.service_name || !form.revenue) return alert("Service naam aur revenue zaroori hai");
    setSaving(true);
    const { error } = await supabase.from("work_logs").insert({
      staff_id: staffId,
      salon_id: salonId,
      service_name: form.service_name,
      revenue: parseFloat(form.revenue),
      clients: parseInt(form.clients),
      date: form.date,
      notes: form.notes,
    });
    setSaving(false);
    if (error) { alert("Error: " + error.message); return; }
    onSaved();
  };

  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)", display: "flex", alignItems: "flex-end", justifyContent: "center", zIndex: 1000 }}>
      <div style={{ background: C.white, borderRadius: "20px 20px 0 0", padding: "20px 16px 40px", width: "100%", maxWidth: 480 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
          <span style={{ fontSize: 16, fontWeight: 700, color: C.text }}>Nayi Entry</span>
          <button onClick={onClose} style={{ background: "none", border: "none", cursor: "pointer", fontSize: 20, color: C.textMuted }}>✕</button>
        </div>
        {[
          { label: "Service Name", key: "service_name", placeholder: "e.g. Haircut, Shave" },
          { label: "Revenue (₹)", key: "revenue", placeholder: "0", type: "number" },
          { label: "Clients", key: "clients", placeholder: "1", type: "number" },
          { label: "Date", key: "date", type: "date" },
          { label: "Notes (optional)", key: "notes", placeholder: "Koi note..." },
        ].map((f) => (
          <div key={f.key} style={{ marginBottom: 14 }}>
            <label style={{ fontSize: 12, fontWeight: 500, color: C.text, display: "block", marginBottom: 5 }}>{f.label}</label>
            <input
              type={f.type || "text"}
              value={form[f.key]}
              onChange={(e) => setForm({ ...form, [f.key]: e.target.value })}
              placeholder={f.placeholder}
              style={{ width: "100%", padding: "10px 12px", border: `1px solid ${C.border}`, borderRadius: 10, fontSize: 14, color: C.text, outline: "none", boxSizing: "border-box" }}
            />
          </div>
        ))}
        <button onClick={save} disabled={saving} style={{ width: "100%", padding: "14px 0", background: saving ? C.textLight : C.purpleMid, color: C.white, border: "none", borderRadius: 12, fontSize: 15, fontWeight: 600, cursor: saving ? "not-allowed" : "pointer", marginTop: 4 }}>
          {saving ? "Saving..." : "Save Entry"}
        </button>
      </div>
    </div>
  );
};

// ══════════════════════════════════════════════════════════════════════════════
// ADD STAFF SCREEN
// ══════════════════════════════════════════════════════════════════════════════
const AddStaffScreen = ({ salonId, onBack, onSaved }) => {
  const [form, setForm] = useState({ name: "", role: "", phone: "", email: "", pin: "0000", salary: "", status: "active" });
  const [saving, setSaving] = useState(false);
  const roles = ["Hair Stylist", "Senior Stylist", "Beauty Specialist", "Barber", "Makeup Artist", "Nail Artist", "Manager"];

  const save = async () => {
    if (!form.name || !form.role || !form.phone) return alert("Naam, role aur phone zaroori hai");
    setSaving(true);
    const { error } = await supabase.from("staff").insert({ salon_id: salonId, name: form.name, role: form.role, phone: form.phone, email: form.email, pin: form.pin || "0000", salary: parseFloat(form.salary) || 0, status: form.status });
    setSaving(false);
    if (error) { alert("Error: " + error.message); return; }
    onSaved();
  };

  return (
    <div style={{ background: C.bg, minHeight: "100vh", paddingBottom: 40 }}>
      <div style={{ background: C.purple, padding: "14px 16px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <button onClick={onBack} style={{ background: "rgba(255,255,255,0.12)", border: "none", borderRadius: 10, padding: "7px 14px", display: "flex", alignItems: "center", gap: 6, cursor: "pointer" }}>
          <i className="ti ti-arrow-left" style={{ fontSize: 15, color: C.white }} />
          <span style={{ fontSize: 13, color: C.white, fontWeight: 500 }}>Back</span>
        </button>
        <span style={{ fontSize: 16, fontWeight: 700, color: C.white }}>Add Staff</span>
        <div style={{ width: 80 }} />
      </div>

      <div style={{ padding: 16, display: "flex", flexDirection: "column", gap: 14 }}>
        {[
          { label: "Full Name *", key: "name", placeholder: "Enter full name" },
          { label: "Phone *", key: "phone", placeholder: "10-digit number", type: "tel" },
          { label: "Email", key: "email", placeholder: "optional", type: "email" },
          { label: "Salary (₹/month)", key: "salary", placeholder: "e.g. 15000", type: "number" },
          { label: "PIN (4 digits)", key: "pin", placeholder: "0000", type: "number" },
        ].map((f) => (
          <div key={f.key}>
            <label style={{ fontSize: 12, fontWeight: 500, color: C.text, display: "block", marginBottom: 5 }}>{f.label}</label>
            <input type={f.type || "text"} value={form[f.key]} onChange={(e) => setForm({ ...form, [f.key]: e.target.value })} placeholder={f.placeholder}
              style={{ width: "100%", padding: "11px 14px", border: `1px solid ${C.border}`, borderRadius: 10, fontSize: 14, color: C.text, outline: "none", boxSizing: "border-box", background: C.white }} />
          </div>
        ))}

        <div>
          <label style={{ fontSize: 12, fontWeight: 500, color: C.text, display: "block", marginBottom: 5 }}>Role *</label>
          <select value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value })}
            style={{ width: "100%", padding: "11px 14px", border: `1px solid ${C.border}`, borderRadius: 10, fontSize: 14, color: C.text, outline: "none", background: C.white }}>
            <option value="">Select role</option>
            {roles.map((r) => <option key={r} value={r}>{r}</option>)}
          </select>
        </div>

        <div>
          <label style={{ fontSize: 12, fontWeight: 500, color: C.text, display: "block", marginBottom: 5 }}>Status</label>
          <div style={{ display: "flex", gap: 10 }}>
            {["active", "on_leave"].map((s) => (
              <button key={s} onClick={() => setForm({ ...form, status: s })}
                style={{ flex: 1, padding: "10px 0", borderRadius: 10, border: "none", background: form.status === s ? C.purpleMid : C.border, color: form.status === s ? C.white : C.textMuted, fontWeight: 500, fontSize: 13, cursor: "pointer" }}>
                {s === "active" ? "Active" : "On Leave"}
              </button>
            ))}
          </div>
        </div>

        <button onClick={save} disabled={saving}
          style={{ width: "100%", padding: "15px 0", background: saving ? C.textLight : C.purpleMid, color: C.white, border: "none", borderRadius: 14, fontSize: 15, fontWeight: 600, cursor: saving ? "not-allowed" : "pointer", marginTop: 8 }}>
          {saving ? "Adding..." : "Add Staff"}
        </button>
      </div>
    </div>
  );
};

// ══════════════════════════════════════════════════════════════════════════════
// EDIT STAFF SCREEN
// ══════════════════════════════════════════════════════════════════════════════
const EditStaffScreen = ({ member, onBack, onSaved }) => {
  const [form, setForm] = useState({ name: member.name || "", role: member.role || "", phone: member.phone || "", email: member.email || "", pin: member.pin || "0000", salary: member.salary || "", status: member.status || "active" });
  const [saving, setSaving] = useState(false);
  const roles = ["Hair Stylist", "Senior Stylist", "Beauty Specialist", "Barber", "Makeup Artist", "Nail Artist", "Manager"];

  const save = async () => {
    setSaving(true);
    const { error } = await supabase.from("staff").update({ name: form.name, role: form.role, phone: form.phone, email: form.email, pin: form.pin, salary: parseFloat(form.salary) || 0, status: form.status }).eq("id", member.id);
    setSaving(false);
    if (error) { alert("Error: " + error.message); return; }
    onSaved();
  };

  const deleteStaff = async () => {
    if (!confirm(`${member.name} ko delete karna chahte hain?`)) return;
    await supabase.from("staff").delete().eq("id", member.id);
    onSaved();
  };

  return (
    <div style={{ background: C.bg, minHeight: "100vh", paddingBottom: 40 }}>
      <div style={{ background: C.purple, padding: "14px 16px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <button onClick={onBack} style={{ background: "rgba(255,255,255,0.12)", border: "none", borderRadius: 10, padding: "7px 14px", display: "flex", alignItems: "center", gap: 6, cursor: "pointer" }}>
          <i className="ti ti-arrow-left" style={{ fontSize: 15, color: C.white }} />
          <span style={{ fontSize: 13, color: C.white, fontWeight: 500 }}>Back</span>
        </button>
        <span style={{ fontSize: 16, fontWeight: 700, color: C.white }}>Edit Staff</span>
        <button onClick={deleteStaff} style={{ background: "rgba(239,68,68,0.2)", border: "none", borderRadius: 10, padding: "7px 14px", cursor: "pointer" }}>
          <i className="ti ti-trash" style={{ fontSize: 15, color: "#fca5a5" }} />
        </button>
      </div>

      <div style={{ padding: 16, display: "flex", flexDirection: "column", gap: 14 }}>
        {[
          { label: "Full Name", key: "name", placeholder: "Enter full name" },
          { label: "Phone", key: "phone", placeholder: "10-digit number", type: "tel" },
          { label: "Email", key: "email", placeholder: "optional", type: "email" },
          { label: "Salary (₹/month)", key: "salary", placeholder: "e.g. 15000", type: "number" },
          { label: "PIN (4 digits)", key: "pin", placeholder: "0000" },
        ].map((f) => (
          <div key={f.key}>
            <label style={{ fontSize: 12, fontWeight: 500, color: C.text, display: "block", marginBottom: 5 }}>{f.label}</label>
            <input type={f.type || "text"} value={form[f.key]} onChange={(e) => setForm({ ...form, [f.key]: e.target.value })} placeholder={f.placeholder}
              style={{ width: "100%", padding: "11px 14px", border: `1px solid ${C.border}`, borderRadius: 10, fontSize: 14, color: C.text, outline: "none", boxSizing: "border-box", background: C.white }} />
          </div>
        ))}

        <div>
          <label style={{ fontSize: 12, fontWeight: 500, color: C.text, display: "block", marginBottom: 5 }}>Role</label>
          <select value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value })}
            style={{ width: "100%", padding: "11px 14px", border: `1px solid ${C.border}`, borderRadius: 10, fontSize: 14, color: C.text, outline: "none", background: C.white }}>
            <option value="">Select role</option>
            {roles.map((r) => <option key={r} value={r}>{r}</option>)}
          </select>
        </div>

        <div>
          <label style={{ fontSize: 12, fontWeight: 500, color: C.text, display: "block", marginBottom: 5 }}>Status</label>
          <div style={{ display: "flex", gap: 10 }}>
            {["active", "on_leave", "offline"].map((s) => (
              <button key={s} onClick={() => setForm({ ...form, status: s })}
                style={{ flex: 1, padding: "10px 0", borderRadius: 10, border: "none", background: form.status === s ? C.purpleMid : C.border, color: form.status === s ? C.white : C.textMuted, fontWeight: 500, fontSize: 12, cursor: "pointer" }}>
                {s === "active" ? "Active" : s === "on_leave" ? "Leave" : "Absent"}
              </button>
            ))}
          </div>
        </div>

        <button onClick={save} disabled={saving}
          style={{ width: "100%", padding: "15px 0", background: saving ? C.textLight : C.purpleMid, color: C.white, border: "none", borderRadius: 14, fontSize: 15, fontWeight: 600, cursor: saving ? "not-allowed" : "pointer", marginTop: 8 }}>
          {saving ? "Saving..." : "Save Changes"}
        </button>
      </div>
    </div>
  );
};

// ══════════════════════════════════════════════════════════════════════════════
// MAIN COMPONENT
// ══════════════════════════════════════════════════════════════════════════════
export default function StaffManagement({ salonId, onBack }) {
  const SALON_ID = salonId || "ba0e6447-c162-4bc7-b049-fe825121e092";
  const [screen, setScreen] = useState("list");
  const [staff, setStaff] = useState([]);
  const [selected, setSelected] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => { loadStaff(); }, []);

  const loadStaff = async () => {
    setLoading(true);
    const { data } = await supabase.from("staff").select("*").eq("salon_id", SALON_ID).order("name");
    if (data) setStaff(data.map((s) => ({ ...s, status: s.status || "available", revenue_today: s.revenue_today || 0, services_today: s.services_today || 0, attendance_pct: s.attendance_pct || 0 })));
    setLoading(false);
  };

  if (loading) {
    return (
      <div style={{ display: "flex", alignItems: "center", justifyContent: "center", minHeight: "100vh", background: C.bg }}>
        <div style={{ textAlign: "center" }}>
          <i className="ti ti-cut" style={{ fontSize: 32, color: C.purpleMid, display: "block", marginBottom: 12 }} />
          <div style={{ color: C.textMuted, fontSize: 14 }}>Loading staff...</div>
        </div>
      </div>
    );
  }

  if (screen === "add") return <AddStaffScreen salonId={SALON_ID} onBack={() => setScreen("list")} onSaved={() => { loadStaff(); setScreen("list"); }} />;
  if (screen === "edit" && selected) return <EditStaffScreen member={selected} onBack={() => setScreen("profile")} onSaved={() => { loadStaff(); setScreen("list"); }} />;
  if (screen === "profile" && selected) return (
    <StaffProfileScreen
      member={selected}
      salonId={SALON_ID}
      onBack={() => setScreen("list")}
      onEdit={(m) => { setSelected(m); setScreen("edit"); }}
    />
  );

  return (
    <StaffListScreen
      staff={staff}
      onBack={onBack}
      onAddStaff={() => setScreen("add")}
      onViewAnalytics={() => alert("Analytics coming soon!")}
      onSelectStaff={(s) => { setSelected(s); setScreen("profile"); }}
    />
  );
}
