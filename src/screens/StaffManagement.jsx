import { useState, useEffect } from "react";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  import.meta.env.VITE_SUPABASE_URL,
  import.meta.env.VITE_SUPABASE_ANON_KEY
);

// ─── Theme ────────────────────────────────────────────────────────────────────
const C = {
  purple: "#5b21b6",
  purpleMid: "#7c3aed",
  purpleLight: "#ede9fe",
  purpleBorder: "#ddd6fe",
  bg: "#f5f3ff",
  white: "#ffffff",
  text: "#1e1b4b",
  textMuted: "#6b7280",
  textLight: "#9ca3af",
  border: "#e5e7eb",
  green: "#16a34a",
  orange: "#f59e0b",
  red: "#ef4444",
  greenBg: "#dcfce7",
  orangeBg: "#fef3c7",
  redBg: "#fee2e2",
};

// ─── Helpers ──────────────────────────────────────────────────────────────────
const fmt = (n) =>
  new Intl.NumberFormat("en-IN", { maximumFractionDigits: 0 }).format(n || 0);

const getInitials = (name = "") =>
  name
    .split(" ")
    .slice(0, 2)
    .map((w) => w[0])
    .join("")
    .toUpperCase();

const AVATAR_COLORS = [
  "#7c3aed", "#2563eb", "#059669", "#dc2626",
  "#d97706", "#0891b2", "#7c3aed", "#be185d",
];
const avatarColor = (name = "") =>
  AVATAR_COLORS[name.charCodeAt(0) % AVATAR_COLORS.length];

const StatusDot = ({ status }) => {
  const map = {
    available: C.green,
    away: C.orange,
    offline: C.red,
    active: C.green,
    on_leave: C.orange,
  };
  return (
    <span
      style={{
        display: "inline-block",
        width: 8,
        height: 8,
        borderRadius: "50%",
        background: map[status] || C.textMuted,
        marginRight: 4,
      }}
    />
  );
};

const StatusLabel = ({ status }) => {
  const labels = {
    available: "Available",
    away: "Away",
    offline: "Offline",
    active: "Active",
    on_leave: "On Leave",
  };
  const colors = {
    available: C.green,
    away: C.orange,
    offline: C.red,
    active: C.green,
    on_leave: C.orange,
  };
  return (
    <span style={{ color: colors[status] || C.textMuted, fontSize: 13, fontWeight: 500 }}>
      <StatusDot status={status} />
      {labels[status] || status}
    </span>
  );
};

const Avatar = ({ name, photo, size = 48, showOnline = false, status }) => {
  const onlineColor =
    status === "available" || status === "active"
      ? C.green
      : status === "away" || status === "on_leave"
      ? C.orange
      : C.red;
  return (
    <div style={{ position: "relative", flexShrink: 0 }}>
      {photo ? (
        <img
          src={photo}
          alt={name}
          style={{ width: size, height: size, borderRadius: "50%", objectFit: "cover" }}
        />
      ) : (
        <div
          style={{
            width: size,
            height: size,
            borderRadius: "50%",
            background: avatarColor(name),
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            color: C.white,
            fontWeight: 600,
            fontSize: size * 0.35,
          }}
        >
          {getInitials(name)}
        </div>
      )}
      {showOnline && (
        <span
          style={{
            position: "absolute",
            bottom: 2,
            right: 2,
            width: size * 0.24,
            height: size * 0.24,
            borderRadius: "50%",
            background: onlineColor,
            border: "2px solid white",
          }}
        />
      )}
    </div>
  );
};

// ─── StatCard ──────────────────────────────────────────────────────────────────
const StatCard = ({ icon, value, label, change, changePositive = true }) => (
  <div
    style={{
      background: C.white,
      borderRadius: 12,
      padding: "10px 8px",
      flex: 1,
      minWidth: 0,
      border: `1px solid ${C.border}`,
    }}
  >
    <div
      style={{
        width: 28,
        height: 28,
        borderRadius: "50%",
        background: C.purpleLight,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        marginBottom: 6,
        color: C.purpleMid,
        fontSize: 13,
      }}
    >
      {icon}
    </div>
    <div style={{ fontSize: 15, fontWeight: 700, color: C.text, marginBottom: 1 }}>
      {value}
    </div>
    <div style={{ fontSize: 10, color: C.textMuted, marginBottom: 4, lineHeight: 1.2 }}>{label}</div>
    <div style={{ fontSize: 9, color: changePositive ? C.green : C.red, fontWeight: 500 }}>
      ↑ {change}
    </div>
  </div>
);

// ─── Pill Filter ──────────────────────────────────────────────────────────────
const PillFilter = ({ options, selected, onChange }) => (
  <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
    {options.map((o) => (
      <button
        key={o.value}
        onClick={() => onChange(o.value)}
        style={{
          padding: "6px 14px",
          borderRadius: 20,
          border: selected === o.value ? "none" : `1px solid ${C.border}`,
          background: selected === o.value ? C.purpleMid : C.white,
          color: selected === o.value ? C.white : C.textMuted,
          fontSize: 13,
          fontWeight: selected === o.value ? 600 : 400,
          cursor: "pointer",
          whiteSpace: "nowrap",
        }}
      >
        {o.label}
      </button>
    ))}
  </div>
);

// ─── Tab Bar ─────────────────────────────────────────────────────────────────
const TabBar = ({ tabs, active, onChange }) => (
  <div style={{ display: "flex", gap: 4, background: C.purpleLight, padding: 4, borderRadius: 12 }}>
    {tabs.map((t) => (
      <button
        key={t}
        onClick={() => onChange(t)}
        style={{
          flex: 1,
          padding: "8px 0",
          borderRadius: 10,
          border: "none",
          background: active === t ? C.white : "transparent",
          color: active === t ? C.purpleMid : C.textMuted,
          fontWeight: active === t ? 600 : 400,
          fontSize: 13,
          cursor: "pointer",
          boxShadow: active === t ? "0 1px 4px rgba(0,0,0,0.08)" : "none",
        }}
      >
        {t}
      </button>
    ))}
  </div>
);

// ─── Back Header ──────────────────────────────────────────────────────────────
const BackHeader = ({ title, onBack, right }) => (
  <div
    style={{
      display: "flex",
      alignItems: "center",
      justifyContent: "space-between",
      padding: "16px 20px",
      background: C.white,
      borderBottom: `1px solid ${C.border}`,
    }}
  >
    <button
      onClick={onBack}
      style={{ background: "none", border: "none", cursor: "pointer", padding: 4, fontSize: 20 }}
    >
      ←
    </button>
    <span style={{ fontWeight: 600, fontSize: 17, color: C.text }}>{title}</span>
    <div>{right || <div style={{ width: 28 }} />}</div>
  </div>
);

// ══════════════════════════════════════════════════════════════════════════════
// SCREEN 1 — Staff Management Main List
// ══════════════════════════════════════════════════════════════════════════════
const StaffListScreen = ({ staff, onAddStaff, onViewSummary, onSelectStaff, onBack }) => {
  const [period, setPeriod] = useState("Today");
  const periods = ["Today", "Week", "Month", "Custom"];

  const totalRevenue = staff.reduce((sum, s) => sum + (s.revenue_today || 0), 0);
  const totalServices = staff.reduce((sum, s) => sum + (s.services_today || 0), 0);

  return (
    <div style={{ background: C.bg, minHeight: "100vh", paddingBottom: 80 }}>
      <div style={{ padding: "14px 16px 0", background: C.bg }}>

        {/* Back button row */}
        <button
          onClick={onBack}
          style={{ background: "none", border: "none", cursor: "pointer", color: C.purpleMid, fontSize: 14, fontWeight: 500, padding: "0 0 10px 0", display: "flex", alignItems: "center", gap: 4 }}
        >
          ← Back
        </button>

        {/* Title + Action buttons */}
        <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 12 }}>
          <div>
            <h1 style={{ fontSize: 22, fontWeight: 700, color: C.text, margin: 0 }}>Staff Management</h1>
            <p style={{ fontSize: 12, color: C.textMuted, margin: "2px 0 0" }}>Manage your team performance</p>
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            <button
              onClick={onAddStaff}
              style={{ background: C.purpleMid, color: C.white, border: "none", borderRadius: 10, padding: "8px 14px", fontSize: 13, fontWeight: 600, cursor: "pointer" }}
            >
              + Add Staff
            </button>
            <button
              onClick={onViewSummary}
              style={{ background: C.white, color: C.purpleMid, border: `1px solid ${C.purpleBorder}`, borderRadius: 10, padding: "8px 14px", fontSize: 13, fontWeight: 500, cursor: "pointer" }}
            >
              📈 View Analytics
            </button>
          </div>
        </div>

        {/* Period Tabs */}
        <div style={{ display: "flex", gap: 4, marginBottom: 12 }}>
          {periods.map((p) => (
            <button
              key={p}
              onClick={() => setPeriod(p)}
              style={{ flex: 1, padding: "8px 0", borderRadius: 10, border: "none", background: period === p ? C.purpleMid : C.white, color: period === p ? C.white : C.textMuted, fontWeight: period === p ? 600 : 400, fontSize: 12, cursor: "pointer" }}
            >
              {p}
            </button>
          ))}
        </div>

        {/* 3 Stat Cards */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 8, marginBottom: 14 }}>
          <StatCard icon="👥" value={staff.length} label="Active Staff" change="2 vs yest." />
          <StatCard icon="₹" value={`₹${fmt(totalRevenue)}`} label="Revenue Today" change="18% vs yest." />
          <StatCard icon="✂️" value={totalServices} label="Total Services" change="12% vs yest." />
        </div>

      </div>

      {/* Staff List */}
      <div style={{ padding: "0 16px", display: "flex", flexDirection: "column", gap: 10 }}>
        {staff.map((s) => (
          <div
            key={s.id}
            onClick={() => onSelectStaff(s)}
            style={{
              background: C.white,
              borderRadius: 14,
              padding: "12px 14px",
              border: `1px solid ${C.border}`,
              display: "flex",
              alignItems: "center",
              gap: 10,
              cursor: "pointer",
            }}
          >
            <Avatar name={s.name} photo={s.photo} size={44} showOnline status={s.status} />
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 4, marginBottom: 1 }}>
                <span style={{ fontWeight: 600, fontSize: 14, color: C.text, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{s.name}</span>
                {s.is_top && <span style={{ fontSize: 12 }}>⭐</span>}
              </div>
              <div style={{ fontSize: 11, color: C.textMuted, marginBottom: 3 }}>{s.role || "Staff"}</div>
              <StatusLabel status={s.status} />
            </div>
            <div
              style={{
                background: C.purpleLight,
                borderRadius: 8,
                padding: "6px 10px",
                textAlign: "center",
                flexShrink: 0,
              }}
            >
              <div style={{ fontWeight: 700, fontSize: 13, color: C.purpleMid, whiteSpace: "nowrap" }}>₹{fmt(s.revenue_today)}</div>
              <div style={{ fontSize: 9, color: C.textMuted, marginTop: 1 }}>Revenue Today</div>
            </div>
            <div style={{ textAlign: "right", flexShrink: 0 }}>
              <div style={{ fontWeight: 600, fontSize: 14, color: C.text }}>{s.services_today || 0}</div>
              <div style={{ fontSize: 9, color: C.textMuted, marginBottom: 3 }}>Services</div>
              <div style={{ fontWeight: 600, fontSize: 12, color: C.green }}>{s.attendance_pct || 0}%</div>
              <div style={{ fontSize: 9, color: C.textMuted }}>Attendance</div>
            </div>
            <span style={{ color: C.textMuted, fontSize: 16, flexShrink: 0 }}>›</span>
          </div>
        ))}
      </div>
    </div>
  );
};

// ══════════════════════════════════════════════════════════════════════════════
// SCREEN 2 — Staff Summary / Analytics
// ══════════════════════════════════════════════════════════════════════════════
const StaffSummaryScreen = ({ staff, onBack }) => {
  const [period, setPeriod] = useState("Today");
  const periods = ["Today", "Week", "Month", "Custom"];
  const totalRevenue = staff.reduce((sum, s) => sum + (s.revenue_today || 0), 0);
  const totalServices = staff.reduce((sum, s) => sum + (s.services_today || 0), 0);
  const avgAtt = staff.length
    ? Math.round(staff.reduce((s, m) => s + (m.attendance_pct || 95), 0) / staff.length)
    : 0;

  return (
    <div style={{ background: C.bg, minHeight: "100vh", paddingBottom: 80 }}>
      <BackHeader title="Staff Summary" onBack={onBack} />

      <div style={{ padding: "16px" }}>
        {/* Period Tabs */}
        <TabBar tabs={periods} active={period} onChange={setPeriod} />

        {/* Big Stats */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginTop: 16, marginBottom: 16 }}>
          <StatCard icon="👥" value={staff.length} label="Active Staff" change="2 vs yesterday" />
          <StatCard icon="₹" value={`₹${fmt(totalRevenue)}`} label="Today's Revenue" change="18% vs yesterday" />
          <StatCard icon="✂️" value={totalServices} label="Total Services" change="12% vs yesterday" />
          <StatCard icon="○" value={`${avgAtt}%`} label="Attendance" change="5% vs yesterday" />
        </div>

        {/* Revenue Trend Card */}
        <div
          style={{
            background: C.white,
            borderRadius: 16,
            padding: 16,
            border: `1px solid ${C.border}`,
            marginBottom: 16,
          }}
        >
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
            <span style={{ fontWeight: 600, fontSize: 15, color: C.text }}>Revenue Trend</span>
            <select
              style={{
                fontSize: 12,
                border: `1px solid ${C.border}`,
                borderRadius: 8,
                padding: "4px 8px",
                color: C.textMuted,
                background: C.white,
              }}
            >
              <option>Today</option>
              <option>Week</option>
            </select>
          </div>
          <div style={{ fontSize: 28, fontWeight: 700, color: C.text, marginBottom: 4 }}>
            ₹{fmt(totalRevenue)}
          </div>
          <div style={{ fontSize: 12, color: C.green, marginBottom: 12 }}>↑ 18% vs yesterday</div>
          {/* Mini sparkline */}
          <svg viewBox="0 0 300 60" style={{ width: "100%", height: 60 }}>
            <defs>
              <linearGradient id="sparkGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={C.purpleMid} stopOpacity="0.2" />
                <stop offset="100%" stopColor={C.purpleMid} stopOpacity="0" />
              </linearGradient>
            </defs>
            <path
              d="M0,45 C30,40 60,20 90,25 S150,10 180,15 S240,5 300,8"
              fill="none"
              stroke={C.purpleMid}
              strokeWidth="2"
            />
            <path
              d="M0,45 C30,40 60,20 90,25 S150,10 180,15 S240,5 300,8 L300,60 L0,60 Z"
              fill="url(#sparkGrad)"
            />
            <circle cx="180" cy="15" r="5" fill={C.purpleMid} />
            <rect x="155" y="0" width="60" height="18" rx="6" fill={C.purpleMid} />
            <text x="185" y="12" textAnchor="middle" fill="white" fontSize="9" fontWeight="600">
              ₹{fmt(totalRevenue / 1000)}k
            </text>
          </svg>
          <div style={{ display: "flex", justifyContent: "space-between", marginTop: 4 }}>
            {["12 AM", "06 AM", "12 PM", "06 PM", "12 AM"].map((t) => (
              <span key={t} style={{ fontSize: 9, color: C.textMuted }}>{t}</span>
            ))}
          </div>
        </div>

        {/* Top Performers */}
        <div style={{ fontWeight: 600, fontSize: 15, color: C.text, marginBottom: 12 }}>Top Performers</div>
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {[...staff]
            .sort((a, b) => (b.revenue_today || 0) - (a.revenue_today || 0))
            .slice(0, 5)
            .map((s, i) => (
              <div
                key={s.id}
                style={{
                  background: C.white,
                  borderRadius: 14,
                  padding: "14px 16px",
                  border: `1px solid ${C.border}`,
                  display: "flex",
                  alignItems: "center",
                  gap: 12,
                }}
              >
                <span style={{ fontSize: 16, fontWeight: 700, color: C.textMuted, minWidth: 20 }}>
                  #{i + 1}
                </span>
                <Avatar name={s.name} photo={s.photo} size={40} />
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 600, fontSize: 14, color: C.text }}>{s.name}</div>
                  <div style={{ fontSize: 12, color: C.textMuted }}>{s.role || "Staff"}</div>
                </div>
                <div style={{ textAlign: "right" }}>
                  <div style={{ fontWeight: 700, color: C.purpleMid, fontSize: 14 }}>₹{fmt(s.revenue_today)}</div>
                  <div style={{ fontSize: 11, color: C.textMuted }}>{s.services_today || 0} services</div>
                </div>
              </div>
            ))}
        </div>
      </div>
    </div>
  );
};

// ══════════════════════════════════════════════════════════════════════════════
// SCREEN 3 — Add Staff Form
// ══════════════════════════════════════════════════════════════════════════════
const AddStaffScreen = ({ onBack, onSave, salonId }) => {
  const [form, setForm] = useState({
    name: "",
    role: "",
    phone: "",
    email: "",
    status: "active",
    pin: "",
  });
  const [saving, setSaving] = useState(false);
  const [photo, setPhoto] = useState(null);

  const roles = ["Hair Stylist", "Senior Stylist", "Beauty Specialist", "Barber", "Makeup Artist", "Nail Artist", "Manager"];

  const handleSave = async () => {
    if (!form.name || !form.role || !form.phone) return alert("Naam, role aur phone zaroori hai");
    setSaving(true);
    try {
      const { error } = await supabase.from("staff").insert({
        salon_id: salonId,
        name: form.name,
        role: form.role,
        phone: form.phone,
        email: form.email,
        status: form.status,
        pin: form.pin || "0000",
      });
      if (error) throw error;
      onSave?.();
      onBack();
    } catch (e) {
      alert("Error: " + e.message);
    }
    setSaving(false);
  };

  return (
    <div style={{ background: C.bg, minHeight: "100vh", paddingBottom: 40 }}>
      <BackHeader title="Add Staff" onBack={onBack} />

      <div style={{ padding: 20 }}>
        {/* Photo Upload */}
        <div
          style={{
            background: C.white,
            borderRadius: 16,
            padding: 24,
            border: `2px dashed ${C.purpleBorder}`,
            textAlign: "center",
            marginBottom: 20,
            cursor: "pointer",
          }}
        >
          <div
            style={{
              width: 64,
              height: 64,
              borderRadius: "50%",
              background: C.purpleMid,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              margin: "0 auto 10px",
              fontSize: 24,
            }}
          >
            📷
          </div>
          <div style={{ fontWeight: 500, fontSize: 14, color: C.text }}>Upload Photo</div>
          <div style={{ fontSize: 12, color: C.textMuted, marginTop: 4 }}>JPG, PNG up to 5MB</div>
        </div>

        {/* Form Fields */}
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          <Field label="Full Name">
            <input
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              placeholder="Enter full name"
              style={inputStyle}
            />
          </Field>

          <Field label="Role">
            <select
              value={form.role}
              onChange={(e) => setForm({ ...form, role: e.target.value })}
              style={inputStyle}
            >
              <option value="">Select role</option>
              {roles.map((r) => <option key={r} value={r}>{r}</option>)}
            </select>
          </Field>

          <Field label="Phone Number">
            <input
              value={form.phone}
              onChange={(e) => setForm({ ...form, phone: e.target.value.replace(/\D/g, "").slice(0, 10) })}
              placeholder="Enter phone number"
              inputMode="numeric"
              style={inputStyle}
            />
          </Field>

          <Field label="Email (Optional)">
            <input
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
              placeholder="Enter email address"
              type="email"
              style={inputStyle}
            />
          </Field>

          <Field label="Staff PIN">
            <input
              value={form.pin}
              onChange={(e) => setForm({ ...form, pin: e.target.value.replace(/\D/g, "").slice(0, 4) })}
              placeholder="4-digit PIN"
              inputMode="numeric"
              style={inputStyle}
            />
          </Field>

          <Field label="Status">
            <div style={{ display: "flex", gap: 10 }}>
              {["active", "on_leave"].map((s) => (
                <button
                  key={s}
                  onClick={() => setForm({ ...form, status: s })}
                  style={{
                    flex: 1,
                    padding: "10px 0",
                    borderRadius: 10,
                    border: "none",
                    background: form.status === s ? C.purpleMid : C.border,
                    color: form.status === s ? C.white : C.textMuted,
                    fontWeight: 500,
                    fontSize: 14,
                    cursor: "pointer",
                  }}
                >
                  {s === "active" ? "Active" : "On Leave"}
                </button>
              ))}
            </div>
          </Field>
        </div>

        {/* Add Button */}
        <button
          onClick={handleSave}
          disabled={saving}
          style={{
            marginTop: 28,
            width: "100%",
            padding: "16px 0",
            background: saving ? C.textLight : C.purpleMid,
            color: C.white,
            border: "none",
            borderRadius: 14,
            fontSize: 16,
            fontWeight: 600,
            cursor: saving ? "not-allowed" : "pointer",
          }}
        >
          {saving ? "Adding..." : "Add Staff"}
        </button>
      </div>
    </div>
  );
};

const Field = ({ label, children }) => (
  <div>
    <label style={{ fontSize: 13, fontWeight: 500, color: C.text, display: "block", marginBottom: 6 }}>
      {label}
    </label>
    {children}
  </div>
);

const inputStyle = {
  width: "100%",
  padding: "12px 14px",
  borderRadius: 10,
  border: `1px solid ${C.border}`,
  fontSize: 14,
  color: C.text,
  background: C.white,
  outline: "none",
  boxSizing: "border-box",
};

// ══════════════════════════════════════════════════════════════════════════════
// SCREEN 4 — Staff Profile Detail
// ══════════════════════════════════════════════════════════════════════════════
const StaffProfileScreen = ({ member, onBack, onEdit, onDelete }) => {
  const [tab, setTab] = useState("Overview");
  const tabs = ["Overview", "Performance", "Schedule", "Payouts"];

  return (
    <div style={{ background: C.bg, minHeight: "100vh", paddingBottom: 80 }}>
      <BackHeader
        title="Staff Profile"
        onBack={onBack}
        right={
          <button style={{ background: "none", border: "none", cursor: "pointer", fontSize: 20, color: C.textMuted }}>
            ⋯
          </button>
        }
      />

      {/* Profile Hero */}
      <div style={{ background: C.white, padding: "20px 20px 0", borderBottom: `1px solid ${C.border}` }}>
        <div style={{ display: "flex", gap: 14, alignItems: "flex-start", marginBottom: 16 }}>
          <Avatar name={member.name} photo={member.photo} size={64} showOnline status={member.status} />
          <div>
            <div style={{ fontWeight: 700, fontSize: 20, color: C.text }}>{member.name}</div>
            <div style={{ fontSize: 13, color: C.textMuted, margin: "2px 0 6px" }}>{member.role || "Staff"}</div>
            <StatusLabel status={member.status} />
          </div>
        </div>

        {/* Quick Actions */}
        <div style={{ display: "flex", justifyContent: "space-around", paddingBottom: 16 }}>
          {[
            { icon: "💬", label: "Message" },
            { icon: "📞", label: "Call" },
            { icon: "📅", label: "Schedule" },
            { icon: "⋯", label: "More" },
          ].map((a) => (
            <button
              key={a.label}
              style={{
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                gap: 4,
                background: "none",
                border: "none",
                cursor: "pointer",
              }}
            >
              <div
                style={{
                  width: 44,
                  height: 44,
                  borderRadius: "50%",
                  background: C.purpleLight,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: 18,
                }}
              >
                {a.icon}
              </div>
              <span style={{ fontSize: 11, color: C.textMuted }}>{a.label}</span>
            </button>
          ))}
        </div>

        {/* Tabs */}
        <div style={{ display: "flex", borderBottom: `2px solid ${C.border}` }}>
          {tabs.map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              style={{
                flex: 1,
                padding: "10px 0",
                border: "none",
                borderBottom: tab === t ? `2px solid ${C.purpleMid}` : "2px solid transparent",
                background: "none",
                color: tab === t ? C.purpleMid : C.textMuted,
                fontWeight: tab === t ? 600 : 400,
                fontSize: 13,
                cursor: "pointer",
                marginBottom: -2,
              }}
            >
              {t}
            </button>
          ))}
        </div>
      </div>

      {/* Tab Content */}
      <div style={{ padding: 16 }}>
        {tab === "Overview" && (
          <>
            <SectionTitle>Today's Overview</SectionTitle>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 10, marginBottom: 20 }}>
              <MiniStat label="Revenue" value={`₹${fmt(member.revenue_today)}`} />
              <MiniStat label="Services" value={member.services_today || 0} />
              <MiniStat label="Attendance" value={`${member.attendance_pct || 95}%`} />
            </div>
            <SectionTitle>This Week</SectionTitle>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 10, marginBottom: 20 }}>
              <MiniStat label="Revenue" value={`₹${fmt((member.revenue_today || 0) * 5)}`} />
              <MiniStat label="Services" value={(member.services_today || 0) * 5} />
              <MiniStat label="Attendance" value={`${member.attendance_pct || 97}%`} />
            </div>
          </>
        )}
        {tab === "Performance" && (
          <div style={{ textAlign: "center", padding: 40, color: C.textMuted }}>
            Performance data loading...
          </div>
        )}
        {tab === "Schedule" && (
          <div style={{ textAlign: "center", padding: 40, color: C.textMuted }}>
            Schedule data loading...
          </div>
        )}
        {tab === "Payouts" && (
          <div style={{ textAlign: "center", padding: 40, color: C.textMuted }}>
            Payout data loading...
          </div>
        )}

        {/* Action Buttons */}
        <div style={{ display: "flex", gap: 10, marginTop: 20 }}>
          <button
            onClick={() => onEdit?.(member)}
            style={{
              flex: 1,
              padding: "14px 0",
              borderRadius: 12,
              background: C.purpleMid,
              color: C.white,
              border: "none",
              fontWeight: 600,
              fontSize: 14,
              cursor: "pointer",
            }}
          >
            Edit Profile
          </button>
          <button
            onClick={() => {
              if (confirm(`${member.name} ko delete karna chahte hain?`)) onDelete?.(member.id);
            }}
            style={{
              padding: "14px 20px",
              borderRadius: 12,
              background: C.redBg,
              color: C.red,
              border: "none",
              fontWeight: 600,
              fontSize: 14,
              cursor: "pointer",
            }}
          >
            Delete
          </button>
        </div>
      </div>
    </div>
  );
};

const SectionTitle = ({ children }) => (
  <div style={{ fontWeight: 600, fontSize: 14, color: C.text, marginBottom: 10 }}>{children}</div>
);

const MiniStat = ({ label, value }) => (
  <div
    style={{
      background: C.white,
      borderRadius: 12,
      padding: "12px 8px",
      textAlign: "center",
      border: `1px solid ${C.border}`,
    }}
  >
    <div style={{ fontWeight: 700, fontSize: 15, color: C.purpleMid }}>{value}</div>
    <div style={{ fontSize: 11, color: C.textMuted, marginTop: 2 }}>{label}</div>
  </div>
);

// ══════════════════════════════════════════════════════════════════════════════
// SCREEN 5 — Attendance Calendar
// ══════════════════════════════════════════════════════════════════════════════
const AttendanceScreen = ({ staff, salonId, onBack }) => {
  const today = new Date();
  const [month, setMonth] = useState(today.getMonth());
  const [year, setYear] = useState(today.getFullYear());
  const [attendance, setAttendance] = useState([]);

  const monthNames = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
  const fullMonthNames = ["January","February","March","April","May","June","July","August","September","October","November","December"];

  useEffect(() => {
    loadAttendance();
  }, [month, year]);

  const loadAttendance = async () => {
    const from = new Date(year, month, 1).toISOString().split("T")[0];
    const to = new Date(year, month + 1, 0).toISOString().split("T")[0];
    const { data } = await supabase
      .from("attendance")
      .select("*")
      .eq("salon_id", salonId)
      .gte("date", from)
      .lte("date", to);
    if (data) setAttendance(data);
  };

  const getDaysInMonth = (m, y) => new Date(y, m + 1, 0).getDate();
  const getFirstDay = (m, y) => {
    const d = new Date(y, m, 1).getDay();
    return d === 0 ? 6 : d - 1; // Mon=0
  };

  const days = getDaysInMonth(month, year);
  const firstDay = getFirstDay(month, year);
  const dayLabels = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

  const presentCount = attendance.filter((a) => a.status === "present").length;
  const absentCount = attendance.filter((a) => a.status === "absent").length;
  const leaveCount = attendance.filter((a) => a.status === "on_leave").length;

  return (
    <div style={{ background: C.bg, minHeight: "100vh", paddingBottom: 80 }}>
      <BackHeader title="Attendance" onBack={onBack} right={<span style={{ fontSize: 18 }}>🔽</span>} />

      <div style={{ padding: 16 }}>
        {/* Month Navigator */}
        <div
          style={{
            background: C.white,
            borderRadius: 16,
            padding: "16px",
            border: `1px solid ${C.border}`,
            marginBottom: 16,
          }}
        >
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <span style={{ fontWeight: 600, fontSize: 15, color: C.text }}>
                {fullMonthNames[month]} {year}
              </span>
              <button
                onClick={() => {
                  if (month < 11) setMonth(month + 1);
                  else { setMonth(0); setYear(year + 1); }
                }}
                style={{ background: "none", border: "none", cursor: "pointer", fontSize: 16, color: C.textMuted }}
              >
                ›
              </button>
            </div>
            <button
              onClick={() => { setMonth(today.getMonth()); setYear(today.getFullYear()); }}
              style={{
                background: C.purpleLight,
                color: C.purpleMid,
                border: "none",
                borderRadius: 8,
                padding: "6px 12px",
                fontSize: 12,
                fontWeight: 500,
                cursor: "pointer",
              }}
            >
              Today
            </button>
            <button
              onClick={() => {
                if (month > 0) setMonth(month - 1);
                else { setMonth(11); setYear(year - 1); }
              }}
              style={{ background: "none", border: "none", cursor: "pointer", fontSize: 16, color: C.textMuted }}
            >
              ‹
            </button>
          </div>

          {/* Calendar Grid */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: 4, marginBottom: 8 }}>
            {dayLabels.map((d) => (
              <div key={d} style={{ textAlign: "center", fontSize: 11, color: C.textMuted, fontWeight: 500, paddingBottom: 4 }}>
                {d}
              </div>
            ))}
            {Array.from({ length: firstDay }).map((_, i) => <div key={`e${i}`} />)}
            {Array.from({ length: days }).map((_, i) => {
              const day = i + 1;
              const isToday = day === today.getDate() && month === today.getMonth() && year === today.getFullYear();
              return (
                <div
                  key={day}
                  style={{
                    textAlign: "center",
                    padding: "6px 0",
                    borderRadius: "50%",
                    background: isToday ? C.purpleMid : "transparent",
                    color: isToday ? C.white : C.text,
                    fontWeight: isToday ? 700 : 400,
                    fontSize: 13,
                    cursor: "pointer",
                  }}
                >
                  {day}
                </div>
              );
            })}
          </div>
        </div>

        {/* Summary */}
        <div
          style={{
            background: C.white,
            borderRadius: 16,
            padding: 16,
            border: `1px solid ${C.border}`,
          }}
        >
          {[
            { dot: C.green, label: "Present", count: presentCount || 14 },
            { dot: C.red, label: "Absent", count: absentCount || 1 },
            { dot: C.orange, label: "On Leave", count: leaveCount || 3 },
          ].map((r) => (
            <div
              key={r.label}
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                padding: "12px 0",
                borderBottom: `1px solid ${C.border}`,
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <span style={{ width: 10, height: 10, borderRadius: "50%", background: r.dot, display: "inline-block" }} />
                <span style={{ fontSize: 14, color: C.text }}>{r.label}</span>
              </div>
              <span style={{ fontWeight: 600, fontSize: 16, color: C.text }}>{r.count}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

// ══════════════════════════════════════════════════════════════════════════════
// SCREEN 6 — Staff Detail (individual breakdown)
// ══════════════════════════════════════════════════════════════════════════════
const StaffDetailScreen = ({ member, onBack }) => {
  const sections = [
    { icon: "👤", label: "Personal Information" },
    { icon: "📅", label: "Work Schedule" },
    { icon: "📊", label: "Performance" },
    { icon: "💰", label: "Payout & Commission" },
    { icon: "📋", label: "History" },
  ];

  return (
    <div style={{ background: C.bg, minHeight: "100vh", paddingBottom: 80 }}>
      <BackHeader title="Staff Details" onBack={onBack} />

      <div style={{ padding: 16 }}>
        {/* Identity Card */}
        <div
          style={{
            background: C.white,
            borderRadius: 16,
            padding: 16,
            border: `1px solid ${C.border}`,
            marginBottom: 16,
          }}
        >
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
              <Avatar name={member.name} photo={member.photo} size={48} />
              <div>
                <div style={{ fontWeight: 600, fontSize: 16, color: C.text }}>{member.name}</div>
                <div style={{ fontSize: 12, color: C.textMuted }}>{member.role || "Staff"}</div>
                <div style={{ fontSize: 12, color: C.green, marginTop: 2 }}>● Active</div>
              </div>
            </div>
            <span style={{ color: C.textMuted, fontSize: 18 }}>›</span>
          </div>
        </div>

        {/* Quick Stats */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr 1fr", gap: 8, marginBottom: 16 }}>
          {[
            { label: "Revenue", value: `₹${fmt(member.revenue_today)}`, bg: "#f0fdf4", color: C.green },
            { label: "Services", value: member.services_today || 0, bg: C.bg, color: C.textMuted },
            { label: "Present", value: 1, bg: "#f0fdf4", color: C.green },
            { label: "Absent", value: 4, bg: "#fef2f2", color: C.red },
          ].map((s) => (
            <div
              key={s.label}
              style={{
                background: s.bg,
                borderRadius: 10,
                padding: "10px 6px",
                textAlign: "center",
              }}
            >
              <div style={{ fontWeight: 700, fontSize: 15, color: s.color }}>{s.value}</div>
              <div style={{ fontSize: 10, color: C.textMuted, marginTop: 2 }}>{s.label}</div>
            </div>
          ))}
        </div>

        {/* Revenue Share */}
        <div
          style={{
            background: C.white,
            borderRadius: 14,
            padding: 16,
            border: `1px solid ${C.border}`,
            marginBottom: 16,
          }}
        >
          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}>
            <span style={{ fontSize: 14, color: C.text }}>Revenue share</span>
            <span style={{ fontWeight: 600, color: C.purpleMid }}>20%</span>
          </div>
          <div style={{ height: 6, background: C.border, borderRadius: 4, overflow: "hidden" }}>
            <div style={{ width: "20%", height: "100%", background: C.purpleMid, borderRadius: 4 }} />
          </div>
        </div>

        {/* Sections List */}
        <div
          style={{
            background: C.white,
            borderRadius: 16,
            border: `1px solid ${C.border}`,
            overflow: "hidden",
          }}
        >
          {sections.map((s, i) => (
            <div
              key={s.label}
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                padding: "16px",
                borderBottom: i < sections.length - 1 ? `1px solid ${C.border}` : "none",
                cursor: "pointer",
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                <span style={{ fontSize: 18 }}>{s.icon}</span>
                <span style={{ fontSize: 14, color: C.text }}>{s.label}</span>
              </div>
              <span style={{ color: C.textMuted, fontSize: 18 }}>›</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

// ══════════════════════════════════════════════════════════════════════════════
// MAIN COMPONENT — Navigation Controller
// ══════════════════════════════════════════════════════════════════════════════
export default function StaffManagement({ salonId, onBack }) {
  const SALON_ID = salonId || "ba0e6447-c162-4bc7-b049-fe825121e092";

  const [screen, setScreen] = useState("list"); // list | summary | add | profile | detail | attendance
  const [staff, setStaff] = useState([]);
  const [selected, setSelected] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadStaff();
  }, []);

  const loadStaff = async () => {
    setLoading(true);
    const { data } = await supabase
      .from("staff")
      .select("*")
      .eq("salon_id", SALON_ID)
      .order("name");
    if (data) {
      setStaff(
        data.map((s) => ({
          ...s,
          status: s.status || "available",
          revenue_today: s.revenue_today || 0,
          services_today: s.services_today || 0,
          attendance_pct: s.attendance_pct || 0,
          is_top: s.is_top || false,
        }))
      );
    }
    setLoading(false);
  };

  if (loading) {
    return (
      <div style={{ display: "flex", alignItems: "center", justifyContent: "center", minHeight: "100vh", background: C.bg }}>
        <div style={{ textAlign: "center" }}>
          <div style={{ fontSize: 32, marginBottom: 12 }}>✂️</div>
          <div style={{ color: C.textMuted, fontSize: 14 }}>Loading staff...</div>
        </div>
      </div>
    );
  }

  if (screen === "summary")
    return <StaffSummaryScreen staff={staff} onBack={() => setScreen("list")} />;

  if (screen === "add")
    return (
      <AddStaffScreen
        salonId={SALON_ID}
        onBack={() => setScreen("list")}
        onSave={loadStaff}
      />
    );

  if (screen === "profile" && selected)
    return (
      <StaffProfileScreen
        member={selected}
        onBack={() => setScreen("list")}
        onEdit={(m) => { setSelected(m); setScreen("detail"); }}
        onDelete={async (id) => {
          await supabase.from("staff").delete().eq("id", id);
          loadStaff();
          setScreen("list");
        }}
      />
    );

  if (screen === "detail" && selected)
    return (
      <StaffDetailScreen
        member={selected}
        onBack={() => setScreen("profile")}
      />
    );

  if (screen === "attendance")
    return (
      <AttendanceScreen
        staff={staff}
        salonId={SALON_ID}
        onBack={() => setScreen("list")}
      />
    );

  return (
    <StaffListScreen
      staff={staff}
      onAddStaff={() => setScreen("add")}
      onViewSummary={() => setScreen("summary")}
      onSelectStaff={(s) => { setSelected(s); setScreen("profile"); }}
      onBack={onBack}
    />
  );
}
