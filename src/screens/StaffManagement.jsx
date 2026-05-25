import { useState, useMemo, useEffect } from "react";
import { supabase } from "../lib/supabase";

const SERVICES = ["Haircut", "Hair Color", "Facial", "Waxing", "Bridal Makeup", "Manicure", "Pedicure", "Head Massage", "Threading", "Blowdry", "Keratin", "Hair Spa"];
const today = new Date().toISOString().slice(0, 10);
const thisWeekStart = (() => { const d = new Date(); d.setDate(d.getDate() - d.getDay()); return d.toISOString().slice(0, 10); })();
const thisMonthStart = new Date().toISOString().slice(0, 8) + "01";

const AVATAR_COLORS = [
  { bg: "#fce7f3", text: "#9d174d" },
  { bg: "#dbeafe", text: "#1e40af" },
  { bg: "#d1fae5", text: "#065f46" },
  { bg: "#fef3c7", text: "#92400e" },
  { bg: "#ede9fe", text: "#4c1d95" },
];

function initials(name) { return name.split(" ").map(w => w[0]).join("").substring(0, 2).toUpperCase(); }
function avatarColor(id) { const num = typeof id === "string" ? id.charCodeAt(0) : (id || 1); return AVATAR_COLORS[Math.abs(num - 1) % AVATAR_COLORS.length]; }
function formatCurrency(n) { return "₹" + Number(n).toLocaleString("en-IN"); }
function formatDate(d) { return new Date(d + "T00:00:00").toLocaleDateString("en-IN", { day: "numeric", month: "short" }); }
function formatDateFull(d) { return new Date(d + "T00:00:00").toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" }); }

// ─── Work Log Modal ────────────────────────────────────────────────────────────
function WorkLogModal({ staffList, preselectedStaffId, onSave, onClose }) {
  const [staffId, setStaffId] = useState(preselectedStaffId || staffList[0]?.id || "");
  const [clientName, setClientName] = useState("");
  const [service, setService] = useState(SERVICES[0]);
  const [amount, setAmount] = useState("");
  const [date, setDate] = useState(today);
  function handleSave() {
    if (!clientName.trim()) { alert("Client ka naam daalo!"); return; }
    if (!amount || isNaN(amount)) { alert("Amount daalo!"); return; }
    onSave({ staffId, clientName: clientName.trim(), service, amount: Number(amount), date });
    onClose();
  }
  return (
    <div style={styles.modalBg} onClick={e => e.target === e.currentTarget && onClose()}>
      <div style={styles.modal}>
        <div style={styles.modalTitle}>Work Log Add Karo</div>
        {!preselectedStaffId && (
          <div style={styles.formGroup}>
            <label style={styles.label}>Staff Member</label>
            <select style={styles.input} value={staffId} onChange={e => setStaffId(e.target.value)}>
              {staffList.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
            </select>
          </div>
        )}
        <div style={styles.formRow}>
          <div style={styles.formGroup}><label style={styles.label}>Client Naam</label><input style={styles.input} placeholder="Anjali Mehta" value={clientName} onChange={e => setClientName(e.target.value)} /></div>
          <div style={styles.formGroup}><label style={styles.label}>Date</label><input style={styles.input} type="date" value={date} onChange={e => setDate(e.target.value)} /></div>
        </div>
        <div style={styles.formRow}>
          <div style={styles.formGroup}><label style={styles.label}>Service</label><select style={styles.input} value={service} onChange={e => setService(e.target.value)}>{SERVICES.map(s => <option key={s}>{s}</option>)}</select></div>
          <div style={styles.formGroup}><label style={styles.label}>Amount (₹)</label><input style={styles.input} type="number" placeholder="500" value={amount} onChange={e => setAmount(e.target.value)} /></div>
        </div>
        <div style={styles.modalActions}>
          <button style={styles.btnCancel} onClick={onClose}>Cancel</button>
          <button style={styles.btnSave} onClick={handleSave}>Save Karo</button>
        </div>
      </div>
    </div>
  );
}

// ─── Add Staff Modal ───────────────────────────────────────────────────────────
function AddStaffModal({ onSave, onClose }) {
  const [name, setName] = useState(""); const [role, setRole] = useState("Hairstylist");
  const [phone, setPhone] = useState(""); const [salary, setSalary] = useState(""); const [pin, setPin] = useState(""); const [error, setError] = useState("");
  function handleSave() {
    setError("");
    if (!name.trim()) { setError("Naam daalo!"); return; }
    if (phone && !/^\d{10}$/.test(phone)) { setError("Phone 10 digits hona chahiye!"); return; }
    if (!pin || pin.length !== 4) { setError("4-digit PIN daalo!"); return; }
    onSave({ name: name.trim(), role, phone, salary: Number(salary) || 0, pin });
    onClose();
  }
  return (
    <div style={styles.modalBg} onClick={e => e.target === e.currentTarget && onClose()}>
      <div style={styles.modal}>
        <div style={styles.modalTitle}>Naya Staff Add Karo</div>
        {error && <div style={{ background: "#fff0f0", border: "1px solid #fca5a5", borderRadius: 8, padding: "8px 12px", fontSize: 12, color: "#dc2626", fontWeight: 700, marginBottom: 12 }}>{error}</div>}
        <div style={styles.formRow}>
          <div style={styles.formGroup}><label style={styles.label}>Naam *</label><input style={styles.input} placeholder="Priya Sharma" value={name} onChange={e => setName(e.target.value)} /></div>
          <div style={styles.formGroup}><label style={styles.label}>Role</label><select style={styles.input} value={role} onChange={e => setRole(e.target.value)}>{["Hairstylist","Makeup Artist","Nail Artist","Receptionist","Manager"].map(r => <option key={r}>{r}</option>)}</select></div>
        </div>
        <div style={styles.formRow}>
          <div style={styles.formGroup}><label style={styles.label}>Phone</label><input style={styles.input} placeholder="9876543210" value={phone} onChange={e => setPhone(e.target.value.replace(/\D/g,"").slice(0,10))} /></div>
          <div style={styles.formGroup}><label style={styles.label}>Salary (₹/month)</label><input style={styles.input} type="number" placeholder="12000" value={salary} onChange={e => setSalary(e.target.value)} /></div>
        </div>
        <div style={styles.formGroup}><label style={styles.label}>Staff PIN (4 digit) *</label><input style={styles.input} type="number" placeholder="1234" value={pin} onChange={e => setPin(e.target.value.slice(0,4))} /></div>
        <div style={styles.modalActions}><button style={styles.btnCancel} onClick={onClose}>Cancel</button><button style={styles.btnSave} onClick={handleSave}>Add Karo</button></div>
      </div>
    </div>
  );
}

// ─── Edit Staff Modal ──────────────────────────────────────────────────────────
function EditStaffModal({ staff, onSave, onDelete, onClose }) {
  const [name, setName] = useState(staff.name); const [role, setRole] = useState(staff.role);
  const [phone, setPhone] = useState(staff.phone || ""); const [salary, setSalary] = useState(staff.salary);
  const [pin, setPin] = useState(staff.pin); const [confirmDelete, setConfirmDelete] = useState(false); const [error, setError] = useState("");
  function handleSave() {
    setError("");
    if (!name.trim()) { setError("Naam daalo!"); return; }
    if (phone && !/^\d{10}$/.test(phone.replace(/\s/g,""))) { setError("Phone 10 digits hona chahiye!"); return; }
    onSave({ ...staff, name: name.trim(), role, phone, salary: Number(salary) || 0, pin });
    onClose();
  }
  return (
    <div style={styles.modalBg} onClick={e => e.target === e.currentTarget && onClose()}>
      <div style={styles.modal}>
        <div style={styles.modalTitle}>Staff Edit Karo</div>
        {error && <div style={{ background: "#fff0f0", border: "1px solid #fca5a5", borderRadius: 8, padding: "8px 12px", fontSize: 12, color: "#dc2626", fontWeight: 700, marginBottom: 12 }}>{error}</div>}
        <div style={styles.formRow}>
          <div style={styles.formGroup}><label style={styles.label}>Naam</label><input style={styles.input} value={name} onChange={e => setName(e.target.value)} /></div>
          <div style={styles.formGroup}><label style={styles.label}>Role</label><select style={styles.input} value={role} onChange={e => setRole(e.target.value)}>{["Hairstylist","Makeup Artist","Nail Artist","Receptionist","Manager"].map(r => <option key={r}>{r}</option>)}</select></div>
        </div>
        <div style={styles.formRow}>
          <div style={styles.formGroup}><label style={styles.label}>Phone</label><input style={styles.input} value={phone} onChange={e => setPhone(e.target.value.replace(/\D/g,"").slice(0,10))} /></div>
          <div style={styles.formGroup}><label style={styles.label}>Salary (₹/month)</label><input style={styles.input} type="number" value={salary} onChange={e => setSalary(e.target.value)} /></div>
        </div>
        <div style={styles.formGroup}><label style={styles.label}>PIN (4 digit)</label><input style={styles.input} type="number" value={pin} onChange={e => setPin(e.target.value.slice(0,4))} /></div>
        <div style={styles.modalActions}><button style={styles.btnCancel} onClick={onClose}>Cancel</button><button style={styles.btnSave} onClick={handleSave}>Save</button></div>
        {!confirmDelete
          ? <button onClick={() => setConfirmDelete(true)} style={{ width: "100%", marginTop: 10, padding: 10, border: "1px solid #fecaca", background: "white", borderRadius: 10, fontSize: 13, fontWeight: 700, color: "#dc2626", cursor: "pointer" }}>Remove Staff</button>
          : <div style={{ marginTop: 10, background: "#fef2f2", borderRadius: 10, padding: 12 }}>
              <div style={{ fontSize: 13, color: "#dc2626", fontWeight: 600, marginBottom: 10 }}>Pakka delete karna hai?</div>
              <div style={{ display: "flex", gap: 8 }}>
                <button onClick={() => setConfirmDelete(false)} style={{ flex: 1, padding: 9, border: "1px solid #e2e8f0", background: "white", borderRadius: 8, fontSize: 13, cursor: "pointer" }}>Cancel</button>
                <button onClick={() => { onDelete(staff.id); onClose(); }} style={{ flex: 1, padding: 9, border: "none", background: "#dc2626", borderRadius: 8, fontSize: 13, fontWeight: 700, color: "white", cursor: "pointer" }}>Delete</button>
              </div>
            </div>
        }
      </div>
    </div>
  );
}

// ─── Edit Log Modal ────────────────────────────────────────────────────────────
function EditLogModal({ log, onSave, onDelete, onClose }) {
  const [clientName, setClientName] = useState(log.clientName);
  const [service, setService] = useState(log.service);
  const [amount, setAmount] = useState(log.amount);
  const [date, setDate] = useState(log.date);
  const [confirmDelete, setConfirmDelete] = useState(false);
  function handleSave() {
    if (!clientName.trim()) { alert("Client naam daalo!"); return; }
    onSave({ ...log, clientName: clientName.trim(), service, amount: Number(amount), date });
    onClose();
  }
  return (
    <div style={styles.modalBg} onClick={e => e.target === e.currentTarget && onClose()}>
      <div style={styles.modal}>
        <div style={styles.modalTitle}>Entry Edit Karo</div>
        <div style={styles.formRow}>
          <div style={styles.formGroup}><label style={styles.label}>Client Naam</label><input style={styles.input} value={clientName} onChange={e => setClientName(e.target.value)} /></div>
          <div style={styles.formGroup}><label style={styles.label}>Date</label><input style={styles.input} type="date" value={date} onChange={e => setDate(e.target.value)} /></div>
        </div>
        <div style={styles.formRow}>
          <div style={styles.formGroup}><label style={styles.label}>Service</label><select style={styles.input} value={service} onChange={e => setService(e.target.value)}>{SERVICES.map(s => <option key={s}>{s}</option>)}</select></div>
          <div style={styles.formGroup}><label style={styles.label}>Amount</label><input style={styles.input} type="number" value={amount} onChange={e => setAmount(e.target.value)} /></div>
        </div>
        <div style={styles.modalActions}><button style={styles.btnCancel} onClick={onClose}>Cancel</button><button style={styles.btnSave} onClick={handleSave}>Save</button></div>
        {!confirmDelete
          ? <button onClick={() => setConfirmDelete(true)} style={{ width: "100%", marginTop: 10, padding: 10, border: "1px solid #fecaca", background: "white", borderRadius: 10, fontSize: 13, fontWeight: 700, color: "#dc2626", cursor: "pointer" }}>Delete Entry</button>
          : <div style={{ marginTop: 10, background: "#fef2f2", borderRadius: 10, padding: 12 }}>
              <div style={{ fontSize: 13, color: "#dc2626", fontWeight: 600, marginBottom: 10 }}>Pakka?</div>
              <div style={{ display: "flex", gap: 8 }}>
                <button onClick={() => setConfirmDelete(false)} style={{ flex: 1, padding: 9, border: "1px solid #e2e8f0", background: "white", borderRadius: 8, fontSize: 13, cursor: "pointer" }}>Cancel</button>
                <button onClick={() => { onDelete(log.id); onClose(); }} style={{ flex: 1, padding: 9, border: "none", background: "#dc2626", borderRadius: 8, fontSize: 13, fontWeight: 700, color: "white", cursor: "pointer" }}>Delete</button>
              </div>
            </div>
        }
      </div>
    </div>
  );
}

// ─── Salary Slip ───────────────────────────────────────────────────────────────
function SalarySlipScreen({ staff, logs, attendance, onBack }) {
  const [slipMonth, setSlipMonth] = useState(new Date().toISOString().slice(0, 7));
  const monthStart = slipMonth + "-01";
  const monthEnd = (() => { const [y, m] = slipMonth.split("-").map(Number); return new Date(y, m, 0).toISOString().slice(0, 10); })();
  const totalDaysInMonth = (() => { const [y, m] = slipMonth.split("-").map(Number); return new Date(y, m, 0).getDate(); })();
  const presentDays = Object.entries(attendance).filter(([d, map]) => d >= monthStart && d <= monthEnd && map[staff.id]).length;
  const absentDays = totalDaysInMonth - presentDays;
  const monthLogs = logs.filter(l => l.staffId === staff.id && l.date >= monthStart && l.date <= monthEnd);
  const totalRevenue = monthLogs.reduce((s, l) => s + l.amount, 0);
  const earnedSalary = Math.round((staff.salary / totalDaysInMonth) * presentDays);
  const deduction = staff.salary - earnedSalary;
  const c = avatarColor(staff.id);
  const monthLabel = new Date(slipMonth + "-01").toLocaleDateString("en-IN", { month: "long", year: "numeric" });
  return (
    <div style={styles.page}>
      <div style={styles.header}>
        <button onClick={onBack} style={styles.backBtn}>← Back</button>
        <div style={{ textAlign: "center" }}><div style={styles.headerTitle}>Salary Slip</div><div style={styles.headerSub}>{staff.name}</div></div>
        <div style={{ width: 60 }} />
      </div>
      <div style={{ padding: "14px" }}>
        <div style={styles.formGroup}><label style={styles.label}>Month</label><input style={styles.input} type="month" value={slipMonth} onChange={e => setSlipMonth(e.target.value)} /></div>
        <div style={{ background: "white", border: "0.5px solid #e8e8e0", borderRadius: 14, padding: "14px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 14, paddingBottom: 12, borderBottom: "0.5px solid #f1f5f9" }}>
            <div style={{ ...styles.avatar, width: 48, height: 48, fontSize: 16, background: c.bg, color: c.text }}>{initials(staff.name)}</div>
            <div><div style={{ fontSize: 15, fontWeight: 800 }}>{staff.name}</div><div style={{ fontSize: 12, color: "#888" }}>{staff.role}</div></div>
          </div>
          <div style={{ fontSize: 13, fontWeight: 700, textAlign: "center", marginBottom: 12 }}>{monthLabel} ka Salary</div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 8, marginBottom: 14 }}>
            <div style={{ background: "#f0fdf4", borderRadius: 10, padding: "10px", textAlign: "center" }}><div style={{ fontSize: 22, fontWeight: 800, color: "#16a34a" }}>{presentDays}</div><div style={{ fontSize: 10, color: "#166534" }}>Present</div></div>
            <div style={{ background: "#fef2f2", borderRadius: 10, padding: "10px", textAlign: "center" }}><div style={{ fontSize: 22, fontWeight: 800, color: "#dc2626" }}>{absentDays}</div><div style={{ fontSize: 10, color: "#991b1b" }}>Absent</div></div>
            <div style={{ background: "#f8fafc", borderRadius: 10, padding: "10px", textAlign: "center" }}><div style={{ fontSize: 22, fontWeight: 800 }}>{totalDaysInMonth}</div><div style={{ fontSize: 10, color: "#555" }}>Total Din</div></div>
          </div>
          <div style={{ background: "#f8fafc", borderRadius: 10, padding: "12px", marginBottom: 12 }}>
            {[{ label: "Fixed Salary", value: formatCurrency(staff.salary), color: "#1a1a2e" }, { label: "Earned", value: formatCurrency(earnedSalary), color: "#16a34a" }, { label: "Deduction", value: "- " + formatCurrency(deduction), color: "#dc2626" }].map(row => (
              <div key={row.label} style={{ display: "flex", justifyContent: "space-between", padding: "6px 0", borderBottom: "0.5px solid #e8e8e0" }}>
                <div style={{ fontSize: 12, color: "#555" }}>{row.label}</div>
                <div style={{ fontSize: 13, fontWeight: 700, color: row.color }}>{row.value}</div>
              </div>
            ))}
            <div style={{ display: "flex", justifyContent: "space-between", marginTop: 10, background: "#1a1a2e", borderRadius: 8, padding: "10px 12px" }}>
              <div style={{ fontSize: 13, fontWeight: 700, color: "white" }}>Net Payable</div>
              <div style={{ fontSize: 18, fontWeight: 800, color: "#4ade80" }}>{formatCurrency(earnedSalary)}</div>
            </div>
          </div>
          <div style={{ background: "#f0f9ff", borderRadius: 10, padding: "12px" }}>
            <div style={{ display: "flex", justifyContent: "space-between" }}><div style={{ fontSize: 13, color: "#555" }}>Total Clients</div><div style={{ fontSize: 13, fontWeight: 700 }}>{monthLogs.length}</div></div>
            <div style={{ display: "flex", justifyContent: "space-between", marginTop: 4 }}><div style={{ fontSize: 13, color: "#555" }}>Revenue</div><div style={{ fontSize: 13, fontWeight: 700, color: "#16a34a" }}>{formatCurrency(totalRevenue)}</div></div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Staff Detail Modal (Revenue breakdown) ────────────────────────────────────
function StaffRevenueModal({ staff, logs, fromDate, toDate, onClose }) {
  const rangeLogs = logs.filter(l => l.staffId === staff.id && l.date >= fromDate && l.date <= toDate)
    .sort((a, b) => b.date.localeCompare(a.date));
  const total = rangeLogs.reduce((s, l) => s + l.amount, 0);
  const svcCount = {};
  rangeLogs.forEach(l => { svcCount[l.service] = (svcCount[l.service] || 0) + 1; });
  const topSvc = Object.entries(svcCount).sort((a, b) => b[1] - a[1])[0];
  const c = avatarColor(staff.id);
  return (
    <div style={styles.modalBg} onClick={e => e.target === e.currentTarget && onClose()}>
      <div style={{ ...styles.modal, maxHeight: "85vh", overflowY: "auto", paddingBottom: 32 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 16 }}>
          <div style={{ ...styles.avatar, background: c.bg, color: c.text, width: 40, height: 40 }}>{initials(staff.name)}</div>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 15, fontWeight: 800, color: "#1a1a2e" }}>{staff.name}</div>
            <div style={{ fontSize: 11, color: "#888" }}>Revenue Details · {formatDate(fromDate)} → {formatDate(toDate)}</div>
          </div>
          <button onClick={onClose} style={{ background: "#f1f5f9", border: "none", borderRadius: 8, padding: "4px 10px", fontSize: 13, cursor: "pointer", color: "#555", fontWeight: 700 }}>✕</button>
        </div>
        {/* Summary */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 8, marginBottom: 14 }}>
          <div style={{ background: "#f0fdf4", borderRadius: 10, padding: "10px", textAlign: "center" }}>
            <div style={{ fontSize: 18, fontWeight: 800, color: "#16a34a" }}>{formatCurrency(total)}</div>
            <div style={{ fontSize: 9, color: "#888", marginTop: 2 }}>Total Revenue</div>
          </div>
          <div style={{ background: "#eff6ff", borderRadius: 10, padding: "10px", textAlign: "center" }}>
            <div style={{ fontSize: 18, fontWeight: 800, color: "#2563eb" }}>{rangeLogs.length}</div>
            <div style={{ fontSize: 9, color: "#888", marginTop: 2 }}>Clients</div>
          </div>
          <div style={{ background: "#fef9c3", borderRadius: 10, padding: "10px", textAlign: "center" }}>
            <div style={{ fontSize: 13, fontWeight: 800, color: "#a16207" }}>{topSvc ? topSvc[0].split(" ")[0] : "—"}</div>
            <div style={{ fontSize: 9, color: "#888", marginTop: 2 }}>Top Service</div>
          </div>
        </div>
        {/* Work Log List */}
        {rangeLogs.length === 0
          ? <div style={{ textAlign: "center", color: "#aaa", padding: "24px 0", fontSize: 13 }}>Is period mein koi entry nahi</div>
          : rangeLogs.map((log, i) => (
            <div key={log.id} style={{ display: "flex", alignItems: "center", gap: 10, padding: "10px 0", borderBottom: i < rangeLogs.length - 1 ? "1px solid #f0f4f8" : "none" }}>
              <div style={{ width: 36, height: 36, borderRadius: 10, background: "#f0fdf4", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 13, fontWeight: 800, color: "#16a34a", flexShrink: 0 }}>✂️</div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 13, fontWeight: 700, color: "#1a1a2e" }}>{log.clientName}</div>
                <div style={{ fontSize: 11, color: "#888", marginTop: 1 }}>{log.service} · {formatDateFull(log.date)}</div>
              </div>
              <div style={{ fontSize: 14, fontWeight: 800, color: "#16a34a" }}>{formatCurrency(log.amount)}</div>
            </div>
          ))
        }
      </div>
    </div>
  );
}

// ─── Staff Attendance Modal ────────────────────────────────────────────────────
function StaffAttendanceModal({ staff, attendance, fromDate, toDate, onClose }) {
  const c = avatarColor(staff.id);
  // Get all dates in range
  const dates = [];
  let cur = new Date(fromDate + "T00:00:00");
  const end = new Date(toDate + "T00:00:00");
  while (cur <= end) {
    dates.push(cur.toISOString().slice(0, 10));
    cur.setDate(cur.getDate() + 1);
  }
  const presentDays = dates.filter(d => (attendance[d] || {})[staff.id]).length;
  const absentDays = dates.length - presentDays;
  const attPct = dates.length > 0 ? Math.round((presentDays / dates.length) * 100) : 0;

  return (
    <div style={styles.modalBg} onClick={e => e.target === e.currentTarget && onClose()}>
      <div style={{ ...styles.modal, maxHeight: "85vh", overflowY: "auto", paddingBottom: 32 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 16 }}>
          <div style={{ ...styles.avatar, background: c.bg, color: c.text, width: 40, height: 40 }}>{initials(staff.name)}</div>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 15, fontWeight: 800, color: "#1a1a2e" }}>{staff.name}</div>
            <div style={{ fontSize: 11, color: "#888" }}>Attendance · {formatDate(fromDate)} → {formatDate(toDate)}</div>
          </div>
          <button onClick={onClose} style={{ background: "#f1f5f9", border: "none", borderRadius: 8, padding: "4px 10px", fontSize: 13, cursor: "pointer", color: "#555", fontWeight: 700 }}>✕</button>
        </div>
        {/* Stats */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 8, marginBottom: 16 }}>
          <div style={{ background: "#f0fdf4", borderRadius: 10, padding: "10px", textAlign: "center" }}>
            <div style={{ fontSize: 20, fontWeight: 800, color: "#16a34a" }}>{presentDays}</div>
            <div style={{ fontSize: 9, color: "#166534" }}>Present</div>
          </div>
          <div style={{ background: "#fef2f2", borderRadius: 10, padding: "10px", textAlign: "center" }}>
            <div style={{ fontSize: 20, fontWeight: 800, color: "#dc2626" }}>{absentDays}</div>
            <div style={{ fontSize: 9, color: "#991b1b" }}>Absent</div>
          </div>
          <div style={{ background: attPct >= 80 ? "#f0fdf4" : attPct >= 60 ? "#fef9c3" : "#fef2f2", borderRadius: 10, padding: "10px", textAlign: "center" }}>
            <div style={{ fontSize: 20, fontWeight: 800, color: attPct >= 80 ? "#16a34a" : attPct >= 60 ? "#a16207" : "#dc2626" }}>{attPct}%</div>
            <div style={{ fontSize: 9, color: "#888" }}>Attendance</div>
          </div>
        </div>
        {/* Attendance Progress Bar */}
        <div style={{ background: "#f0f4f8", borderRadius: 20, height: 8, overflow: "hidden", marginBottom: 16 }}>
          <div style={{ width: `${attPct}%`, height: "100%", background: attPct >= 80 ? "#22c55e" : attPct >= 60 ? "#f59e0b" : "#ef4444", borderRadius: 20, transition: "width 0.5s" }} />
        </div>
        {/* Calendar View */}
        <div style={{ fontSize: 12, fontWeight: 700, color: "#888", marginBottom: 10 }}>📅 Din-wise Record</div>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
          {dates.map(d => {
            const isPresent = !!(attendance[d] || {})[staff.id];
            const reason = (attendance[d] || {})[staff.id + "_reason"];
            const isToday = d === today;
            return (
              <div key={d} title={reason ? `Reason: ${reason}` : ""}
                style={{ background: isPresent ? "#dcfce7" : "#fee2e2", border: `1.5px solid ${isPresent ? "#86efac" : "#fca5a5"}`, borderRadius: 8, padding: "5px 8px", textAlign: "center", minWidth: 44, outline: isToday ? "2px solid #1a1a2e" : "none" }}>
                <div style={{ fontSize: 11, fontWeight: 800, color: isPresent ? "#16a34a" : "#dc2626" }}>{new Date(d + "T00:00:00").getDate()}</div>
                <div style={{ fontSize: 9, color: isPresent ? "#16a34a" : "#dc2626" }}>{isPresent ? "✓" : "✗"}</div>
              </div>
            );
          })}
        </div>
        {/* Absent Reasons */}
        {dates.some(d => !(attendance[d] || {})[staff.id] && (attendance[d] || {})[staff.id + "_reason"]) && (
          <div style={{ marginTop: 14 }}>
            <div style={{ fontSize: 12, fontWeight: 700, color: "#888", marginBottom: 8 }}>📝 Absent Reasons</div>
            {dates.filter(d => !(attendance[d] || {})[staff.id] && (attendance[d] || {})[staff.id + "_reason"]).map(d => (
              <div key={d} style={{ background: "#fef2f2", borderRadius: 8, padding: "8px 10px", marginBottom: 6, display: "flex", gap: 8 }}>
                <div style={{ fontSize: 11, fontWeight: 700, color: "#dc2626", flexShrink: 0 }}>{formatDate(d)}</div>
                <div style={{ fontSize: 11, color: "#555" }}>{(attendance[d] || {})[staff.id + "_reason"]}</div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// ─── NEW: Staff Summary Screen ─────────────────────────────────────────────────
function StaffSummaryScreen({ staffList, logs, attendance, onBack }) {
  const [fromDate, setFromDate] = useState(thisMonthStart);
  const [toDate, setToDate] = useState(today);
  const [sortBy, setSortBy] = useState("revenue"); // revenue | attendance | clients
  const [revenueModal, setRevenueModal] = useState(null);
  const [attendanceModal, setAttendanceModal] = useState(null);

  // Quick range presets
  const PRESETS = [
    { label: "Aaj", from: today, to: today },
    { label: "Is Hafte", from: thisWeekStart, to: today },
    { label: "Is Mahine", from: thisMonthStart, to: today },
  ];

  // Compute stats for each staff
  const staffStats = staffList.map(s => {
    const rangeLogs = logs.filter(l => l.staffId === s.id && l.date >= fromDate && l.date <= toDate);
    const revenue = rangeLogs.reduce((sum, l) => sum + l.amount, 0);
    const clients = rangeLogs.length;

    // Count days in range
    const dates = [];
    let cur = new Date(fromDate + "T00:00:00");
    const end = new Date(toDate + "T00:00:00");
    while (cur <= end) { dates.push(cur.toISOString().slice(0, 10)); cur.setDate(cur.getDate() + 1); }
    const totalDays = dates.length;
    const presentDays = dates.filter(d => (attendance[d] || {})[s.id]).length;
    const attPct = totalDays > 0 ? Math.round((presentDays / totalDays) * 100) : 0;

    return { ...s, revenue, clients, presentDays, absentDays: totalDays - presentDays, attPct, totalDays };
  });

  // Sort
  const sorted = [...staffStats].sort((a, b) => {
    if (sortBy === "revenue") return b.revenue - a.revenue;
    if (sortBy === "attendance") return b.attPct - a.attPct;
    if (sortBy === "clients") return b.clients - a.clients;
    return 0;
  });

  const totalRevenue = sorted.reduce((s, st) => s + st.revenue, 0);
  const totalClients = sorted.reduce((s, st) => s + st.clients, 0);
  const avgAtt = sorted.length > 0 ? Math.round(sorted.reduce((s, st) => s + st.attPct, 0) / sorted.length) : 0;

  const rankColors = ["#f59e0b", "#9ca3af", "#cd7c2f"]; // Gold, Silver, Bronze

  return (
    <div style={styles.page}>
      {/* Header */}
      <div style={{ background: "#1a1a2e", padding: "14px 16px", display: "flex", alignItems: "center", gap: 12 }}>
        <button onClick={onBack} style={styles.backBtn}>← Back</button>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 16, fontWeight: 800, color: "#fff" }}>📊 Staff Summary</div>
          <div style={{ fontSize: 11, color: "#a0a0c0", marginTop: 1 }}>Performance Overview</div>
        </div>
      </div>

      {/* Date Range */}
      <div style={{ background: "white", padding: "12px 14px", borderBottom: "1px solid #f0f4f8" }}>
        {/* Presets */}
        <div style={{ display: "flex", gap: 6, marginBottom: 10 }}>
          {PRESETS.map(p => (
            <button key={p.label} onClick={() => { setFromDate(p.from); setToDate(p.to); }}
              style={{ padding: "5px 12px", borderRadius: 20, border: `1.5px solid ${fromDate === p.from && toDate === p.to ? "#22c55e" : "#e8edf3"}`, background: fromDate === p.from && toDate === p.to ? "#e8fdf0" : "white", color: fromDate === p.from && toDate === p.to ? "#16a34a" : "#888", fontSize: 11, fontWeight: 700, cursor: "pointer", fontFamily: "inherit" }}>
              {p.label}
            </button>
          ))}
          <div style={{ flex: 1 }} />
        </div>
        {/* Custom Range */}
        <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
          <input type="date" value={fromDate} onChange={e => setFromDate(e.target.value)}
            style={{ flex: 1, border: "1.5px solid #e8edf3", borderRadius: 8, padding: "7px 10px", fontSize: 12, outline: "none", color: "#1a1a2e" }} />
          <div style={{ color: "#888", fontWeight: 700, fontSize: 12 }}>→</div>
          <input type="date" value={toDate} onChange={e => setToDate(e.target.value)}
            style={{ flex: 1, border: "1.5px solid #e8edf3", borderRadius: 8, padding: "7px 10px", fontSize: 12, outline: "none", color: "#1a1a2e" }} />
        </div>
      </div>

      {/* Overall Stats */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 8, padding: "12px 14px 0" }}>
        {[
          { label: "Total Revenue", val: formatCurrency(totalRevenue), color: "#16a34a", bg: "#f0fdf4", icon: "💰" },
          { label: "Total Clients", val: totalClients, color: "#2563eb", bg: "#eff6ff", icon: "👥" },
          { label: "Avg Attendance", val: `${avgAtt}%`, color: avgAtt >= 80 ? "#16a34a" : avgAtt >= 60 ? "#a16207" : "#dc2626", bg: "#f8fafc", icon: "📅" },
        ].map(s => (
          <div key={s.label} style={{ background: s.bg, borderRadius: 12, padding: "12px 8px", textAlign: "center", border: "1.5px solid #e8edf3" }}>
            <div style={{ fontSize: 16, marginBottom: 4 }}>{s.icon}</div>
            <div style={{ fontSize: 15, fontWeight: 900, color: s.color }}>{s.val}</div>
            <div style={{ fontSize: 9, color: "#888", marginTop: 2, fontWeight: 700 }}>{s.label}</div>
          </div>
        ))}
      </div>

      {/* Sort Tabs */}
      <div style={{ padding: "12px 14px 0" }}>
        <div style={{ display: "flex", background: "#f0f4f8", borderRadius: 10, padding: 3, gap: 3 }}>
          {[{ key: "revenue", label: "💰 Revenue" }, { key: "clients", label: "👥 Clients" }, { key: "attendance", label: "📅 Attendance" }].map(t => (
            <button key={t.key} onClick={() => setSortBy(t.key)}
              style={{ flex: 1, padding: "7px 4px", border: "none", borderRadius: 8, background: sortBy === t.key ? "#1a1a2e" : "transparent", color: sortBy === t.key ? "white" : "#888", fontSize: 11, fontWeight: 700, cursor: "pointer", fontFamily: "inherit" }}>
              {t.label}
            </button>
          ))}
        </div>
      </div>

      {/* Staff Ranking Cards */}
      <div style={{ padding: "12px 14px 80px" }}>
        {sorted.length === 0 && <div style={styles.emptyState}>Koi staff nahi</div>}
        {sorted.map((s, idx) => {
          const c = avatarColor(s.id);
          const rankColor = idx < 3 ? rankColors[idx] : "#e8edf3";
          const revenueShare = totalRevenue > 0 ? Math.round((s.revenue / totalRevenue) * 100) : 0;
          return (
            <div key={s.id} style={{ background: "white", borderRadius: 16, border: `2px solid ${idx === 0 ? "#fde68a" : "#e8edf3"}`, padding: "14px", marginBottom: 10, boxShadow: idx === 0 ? "0 2px 12px rgba(251,191,36,0.15)" : "none" }}>
              {/* Top Row */}
              <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 12 }}>
                {/* Rank Badge */}
                <div style={{ width: 28, height: 28, borderRadius: 8, background: rankColor + "22", border: `2px solid ${rankColor}`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 12, fontWeight: 900, color: rankColor, flexShrink: 0 }}>
                  {idx < 3 ? ["🥇","🥈","🥉"][idx] : idx + 1}
                </div>
                <div style={{ ...styles.avatar, background: c.bg, color: c.text, width: 38, height: 38, fontSize: 12, flexShrink: 0 }}>{initials(s.name)}</div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 14, fontWeight: 800, color: "#1a1a2e" }}>{s.name}</div>
                  <div style={{ fontSize: 11, color: "#888", marginTop: 1 }}>{s.role}</div>
                </div>
                {/* Attendance Badge */}
                <div style={{ background: s.attPct >= 80 ? "#dcfce7" : s.attPct >= 60 ? "#fef9c3" : "#fee2e2", color: s.attPct >= 80 ? "#16a34a" : s.attPct >= 60 ? "#a16207" : "#dc2626", fontSize: 10, fontWeight: 800, padding: "3px 8px", borderRadius: 20, flexShrink: 0 }}>
                  {s.attPct}% att.
                </div>
              </div>

              {/* Clickable Stats Grid */}
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr 1fr", gap: 8, marginBottom: 12 }}>
                {/* Revenue — clickable */}
                <div onClick={() => setRevenueModal(s)} style={{ background: "#f0fdf4", borderRadius: 10, padding: "10px 6px", textAlign: "center", cursor: "pointer", border: "1.5px solid #bbf7d0", transition: "transform 0.1s" }}
                  onMouseOver={e => e.currentTarget.style.transform = "scale(1.03)"}
                  onMouseOut={e => e.currentTarget.style.transform = "scale(1)"}>
                  <div style={{ fontSize: 13, fontWeight: 900, color: "#16a34a" }}>{s.revenue >= 1000 ? `₹${(s.revenue/1000).toFixed(1)}k` : formatCurrency(s.revenue)}</div>
                  <div style={{ fontSize: 9, color: "#888", marginTop: 2 }}>Revenue 💰</div>
                </div>
                {/* Clients — clickable */}
                <div onClick={() => setRevenueModal(s)} style={{ background: "#eff6ff", borderRadius: 10, padding: "10px 6px", textAlign: "center", cursor: "pointer", border: "1.5px solid #93c5fd" }}
                  onMouseOver={e => e.currentTarget.style.transform = "scale(1.03)"}
                  onMouseOut={e => e.currentTarget.style.transform = "scale(1)"}>
                  <div style={{ fontSize: 13, fontWeight: 900, color: "#2563eb" }}>{s.clients}</div>
                  <div style={{ fontSize: 9, color: "#888", marginTop: 2 }}>Clients 👥</div>
                </div>
                {/* Present — clickable */}
                <div onClick={() => setAttendanceModal(s)} style={{ background: "#f0fdf4", borderRadius: 10, padding: "10px 6px", textAlign: "center", cursor: "pointer", border: "1.5px solid #86efac" }}
                  onMouseOver={e => e.currentTarget.style.transform = "scale(1.03)"}
                  onMouseOut={e => e.currentTarget.style.transform = "scale(1)"}>
                  <div style={{ fontSize: 13, fontWeight: 900, color: "#16a34a" }}>{s.presentDays}</div>
                  <div style={{ fontSize: 9, color: "#888", marginTop: 2 }}>Present ✅</div>
                </div>
                {/* Absent — clickable */}
                <div onClick={() => setAttendanceModal(s)} style={{ background: "#fef2f2", borderRadius: 10, padding: "10px 6px", textAlign: "center", cursor: "pointer", border: "1.5px solid #fca5a5" }}
                  onMouseOver={e => e.currentTarget.style.transform = "scale(1.03)"}
                  onMouseOut={e => e.currentTarget.style.transform = "scale(1)"}>
                  <div style={{ fontSize: 13, fontWeight: 900, color: "#dc2626" }}>{s.absentDays}</div>
                  <div style={{ fontSize: 9, color: "#888", marginTop: 2 }}>Absent ❌</div>
                </div>
              </div>

              {/* Revenue Share Bar */}
              <div>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
                  <div style={{ fontSize: 10, color: "#888", fontWeight: 700 }}>Revenue share</div>
                  <div style={{ fontSize: 10, fontWeight: 800, color: "#16a34a" }}>{revenueShare}%</div>
                </div>
                <div style={{ background: "#f0f4f8", borderRadius: 20, height: 6, overflow: "hidden" }}>
                  <div style={{ width: `${revenueShare}%`, height: "100%", background: "linear-gradient(90deg, #22c55e, #86efac)", borderRadius: 20 }} />
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Modals */}
      {revenueModal && <StaffRevenueModal staff={revenueModal} logs={logs} fromDate={fromDate} toDate={toDate} onClose={() => setRevenueModal(null)} />}
      {attendanceModal && <StaffAttendanceModal staff={attendanceModal} attendance={attendance} fromDate={fromDate} toDate={toDate} onClose={() => setAttendanceModal(null)} />}
    </div>
  );
}

// ─── Staff Detail Screen ───────────────────────────────────────────────────────
function StaffDetailScreen({ staff, logs, setLogs, attendance, onBack, onAddLog, onEditStaff, onDeleteStaff, currentUser }) {
  const [tab, setTab] = useState("month");
  const [editingLog, setEditingLog] = useState(null);
  const [showSalarySlip, setShowSalarySlip] = useState(false);
  const [showEditStaff, setShowEditStaff] = useState(false);
  const c = avatarColor(staff.id);

  const filtered = useMemo(() => {
    const cutoff = tab === "today" ? today : tab === "week" ? thisWeekStart : thisMonthStart;
    return logs.filter(l => l.staffId === staff.id && l.date >= cutoff).sort((a, b) => b.date.localeCompare(a.date));
  }, [logs, tab, staff.id]);

  const totalRevenue = filtered.reduce((s, l) => s + l.amount, 0);
  const attendedDays = Object.entries(attendance).filter(([d, m]) => {
    const cutoff = tab === "today" ? today : tab === "week" ? thisWeekStart : thisMonthStart;
    return d >= cutoff && m[staff.id];
  }).length;

  async function handleEditLog(updated) {
    if (currentUser?.id) {
      await supabase.from("work_logs").update({ client_name: updated.clientName, service: updated.service, amount: updated.amount, date: updated.date }).eq("id", updated.id);
    }
    setLogs(prev => prev.map(l => l.id === updated.id ? updated : l));
  }

  async function handleDeleteLog(id) {
    if (currentUser?.id) { await supabase.from("work_logs").delete().eq("id", id); }
    setLogs(prev => prev.filter(l => l.id !== id));
  }

  if (showSalarySlip) return <SalarySlipScreen staff={staff} logs={logs} attendance={attendance} onBack={() => setShowSalarySlip(false)} />;

  return (
    <div style={styles.page}>
      <div style={styles.header}>
        <button onClick={onBack} style={styles.backBtn}>← Back</button>
        <div style={{ textAlign: "center" }}><div style={styles.headerTitle}>{staff.name}</div><div style={styles.headerSub}>{staff.role}</div></div>
        <button onClick={() => setShowEditStaff(true)} style={{ ...styles.backBtn, fontSize: 11 }}>Edit</button>
      </div>
      <div style={{ padding: "14px 14px 0", display: "flex", gap: 14, alignItems: "center" }}>
        <div style={{ ...styles.avatar, width: 52, height: 52, fontSize: 18, background: c.bg, color: c.text }}>{initials(staff.name)}</div>
        <div style={{ flex: 1 }}><div style={{ fontSize: 13, color: "#888" }}>{staff.phone} · {formatCurrency(staff.salary)}/mo</div></div>
        <button onClick={() => setShowSalarySlip(true)} style={{ background: "#f0fdf4", border: "1px solid #bbf7d0", borderRadius: 10, padding: "8px 12px", fontSize: 11, fontWeight: 700, color: "#166534", cursor: "pointer" }}>Salary Slip</button>
      </div>
      <div style={{ padding: "14px 14px 0" }}>
        <div style={{ ...styles.tabRow, display: "grid", gridTemplateColumns: "1fr 1fr 1fr" }}>
          {[{ key: "today", label: "Aaj" }, { key: "week", label: "Hafte" }, { key: "month", label: "Mahine" }].map(t => (
            <button key={t.key} style={{ ...styles.tabBtn, ...(tab === t.key ? styles.tabActive : {}) }} onClick={() => setTab(t.key)}>{t.label}</button>
          ))}
        </div>
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 10, padding: "12px 14px 0" }}>
        <div style={styles.statCard}><div style={{ ...styles.statNum, color: "#1a1a2e" }}>{filtered.length}</div><div style={styles.statLabel}>Clients</div></div>
        <div style={styles.statCard}><div style={{ ...styles.statNum, color: "#16a34a", fontSize: 16 }}>{formatCurrency(totalRevenue)}</div><div style={styles.statLabel}>Revenue</div></div>
        <div style={styles.statCard}><div style={{ ...styles.statNum, color: "#2563eb" }}>{attendedDays}d</div><div style={styles.statLabel}>Present</div></div>
      </div>
      <div style={{ padding: "14px" }}>
        <div style={styles.sectionHeader}>
          <div style={styles.sectionTitle}>Kaam ki entries</div>
          <button style={styles.addBtn} onClick={onAddLog}>+ Add</button>
        </div>
        {filtered.length === 0 ? <div style={styles.emptyState}>Koi entry nahi</div>
          : filtered.map(log => (
            <div key={log.id} onClick={() => setEditingLog(log)} style={{ ...styles.logCard, cursor: "pointer" }}>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 14, fontWeight: 600, color: "#1a1a2e" }}>{log.clientName}</div>
                <div style={{ fontSize: 12, color: "#888", marginTop: 2 }}>{log.service} · {formatDate(log.date)}</div>
              </div>
              <div style={{ fontSize: 14, fontWeight: 700, color: "#16a34a" }}>{formatCurrency(log.amount)}</div>
            </div>
          ))}
      </div>
      {editingLog && <EditLogModal log={editingLog} onSave={handleEditLog} onDelete={handleDeleteLog} onClose={() => setEditingLog(null)} />}
      {showEditStaff && <EditStaffModal staff={staff} onSave={onEditStaff} onDelete={onDeleteStaff} onClose={() => setShowEditStaff(false)} />}
    </div>
  );
}

// ─── Owner Dashboard ───────────────────────────────────────────────────────────
function OwnerDashboard({ staffList, setStaffList, logs, setLogs, attendance, setAttendance, showRevenueToStaff, setShowRevenueToStaff, currentUser }) {
  const [view, setView] = useState("list");
  const [selectedStaff, setSelectedStaff] = useState(null);
  const [showAddStaff, setShowAddStaff] = useState(false);
  const [showAddLog, setShowAddLog] = useState(false);
  const [logForStaff, setLogForStaff] = useState(null);
  const [nextLogId, setNextLogId] = useState(100);
  const [ownerSelectedDate, setOwnerSelectedDate] = useState(today);
  const [showSummary, setShowSummary] = useState(false);

  async function toggleAttendance(staffId) {
    const currentVal = !!(attendance[ownerSelectedDate] || {})[staffId];
    const newVal = !currentVal;
    setAttendance(prev => { const dm = { ...(prev[ownerSelectedDate] || {}) }; dm[staffId] = newVal; return { ...prev, [ownerSelectedDate]: dm }; });
    if (currentUser?.id) {
      await supabase.from("attendance").upsert({ salon_id: currentUser.id, staff_id: staffId, date: ownerSelectedDate, is_present: newVal }, { onConflict: "salon_id,staff_id,date" });
    }
  }

  async function addStaff(data) {
    if (currentUser?.id) {
      const { data: res } = await supabase.from("staff").insert({ salon_id: currentUser.id, name: data.name, role: data.role, phone: data.phone, salary: data.salary, pin: data.pin }).select().single();
      if (res) { setStaffList(prev => [...prev, res]); return; }
    }
    setStaffList(prev => [...prev, { ...data, id: Date.now() }]);
  }

  async function editStaff(updated) {
    if (currentUser?.id && typeof updated.id === "string") {
      await supabase.from("staff").update({ name: updated.name, role: updated.role, phone: updated.phone, salary: updated.salary, pin: updated.pin }).eq("id", updated.id);
    }
    setStaffList(prev => prev.map(s => s.id === updated.id ? updated : s));
  }

  async function deleteStaff(id) {
    if (currentUser?.id && typeof id === "string") { await supabase.from("staff").delete().eq("id", id); }
    setStaffList(prev => prev.filter(s => s.id !== id));
    setView("list");
  }

  async function addLog(data) {
    if (currentUser?.id) {
      const { data: res } = await supabase.from("work_logs").insert({ salon_id: currentUser.id, staff_id: data.staffId, client_name: data.clientName, service: data.service, amount: data.amount, date: data.date }).select().single();
      if (res) { setLogs(prev => [...prev, { id: res.id, staffId: res.staff_id, clientName: res.client_name, service: res.service, amount: res.amount, date: res.date }]); return; }
    }
    setLogs(prev => [...prev, { ...data, id: nextLogId }]);
    setNextLogId(n => n + 1);
  }

  const viewAtt = attendance[ownerSelectedDate] || {};
  const presentCount = staffList.filter(s => viewAtt[s.id]).length;
  const absentCount = staffList.length - presentCount;
  const viewServices = logs.filter(l => l.date === ownerSelectedDate).length;
  const viewRevenue = logs.filter(l => l.date === ownerSelectedDate).reduce((s, l) => s + l.amount, 0);
  const isViewingToday = ownerSelectedDate === today;
  const viewLabel = isViewingToday ? "Aaj" : formatDate(ownerSelectedDate);

  if (showSummary) return <StaffSummaryScreen staffList={staffList} logs={logs} attendance={attendance} onBack={() => setShowSummary(false)} />;

  if (view === "detail" && selectedStaff) {
    return (
      <>
        <StaffDetailScreen staff={selectedStaff} logs={logs} setLogs={setLogs} attendance={attendance} onBack={() => setView("list")}
          onAddLog={() => { setLogForStaff(selectedStaff.id); setShowAddLog(true); }}
          onEditStaff={editStaff} onDeleteStaff={deleteStaff} currentUser={currentUser} />
        {showAddLog && <WorkLogModal staffList={staffList} preselectedStaffId={logForStaff} onSave={addLog} onClose={() => setShowAddLog(false)} />}
      </>
    );
  }

  return (
    <div style={styles.page}>
      {/* Header */}
      <div style={styles.header}>
        <div><div style={styles.headerTitle}>Staff Management</div><div style={styles.headerSub}>Owner View</div></div>
        <div style={{ display: "flex", gap: 6 }}>
          <button style={{ ...styles.addBtn, background: "#22c55e" }} onClick={() => setShowSummary(true)}>📊 Summary</button>
          <button style={styles.addBtn} onClick={() => { setLogForStaff(null); setShowAddLog(true); }}>+ Log</button>
        </div>
      </div>

      {/* Revenue Toggle */}
      <div style={{ background: showRevenueToStaff ? "#f0fdf4" : "#fef2f2", borderBottom: "0.5px solid #e8e8e0", padding: "10px 14px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <div><div style={{ fontSize: 13, fontWeight: 700, color: "#1a1a2e" }}>Staff ko Sales dikhao?</div><div style={{ fontSize: 11, color: "#888", marginTop: 1 }}>{showRevenueToStaff ? "ON" : "OFF"}</div></div>
        <div style={{ width: 52, height: 26, borderRadius: 13, background: showRevenueToStaff ? "#16a34a" : "#d1d5db", position: "relative", cursor: "pointer" }} onClick={() => setShowRevenueToStaff(v => !v)}>
          <div style={{ width: 20, height: 20, borderRadius: "50%", background: "white", position: "absolute", top: 3, left: showRevenueToStaff ? 29 : 3, transition: "left 0.2s", boxShadow: "0 1px 3px rgba(0,0,0,0.2)" }} />
        </div>
      </div>

      {/* Date Picker */}
      <div style={{ background: "white", padding: "10px 14px", borderBottom: "0.5px solid #e8e8e0", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <div style={{ fontSize: 13, fontWeight: 700, color: "#1a1a2e" }}>📅 {viewLabel}</div>
        <input type="date" value={ownerSelectedDate} onChange={e => setOwnerSelectedDate(e.target.value)}
          style={{ border: "2px solid #22c55e", borderRadius: 8, padding: "5px 10px", fontSize: 12, fontWeight: 700, color: "#16a34a", outline: "none", cursor: "pointer" }} />
      </div>

      {/* Stats */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr 1fr", gap: 8, padding: "12px 14px 0" }}>
        <div style={styles.statCard}><div style={{ ...styles.statNum, color: "#16a34a" }}>{presentCount}</div><div style={styles.statLabel}>Present</div></div>
        <div style={styles.statCard}><div style={{ ...styles.statNum, color: "#dc2626" }}>{absentCount}</div><div style={styles.statLabel}>Absent</div></div>
        <div style={styles.statCard}><div style={{ ...styles.statNum, color: "#1a1a2e" }}>{viewServices}</div><div style={styles.statLabel}>Services</div></div>
        <div style={styles.statCard}><div style={{ ...styles.statNum, color: "#2563eb", fontSize: 13 }}>{formatCurrency(viewRevenue)}</div><div style={styles.statLabel}>Revenue</div></div>
      </div>

      {/* Staff List */}
      <div style={{ padding: "14px" }}>
        <div style={styles.sectionHeader}>
          <div style={styles.sectionTitle}>{viewLabel} ka Staff</div>
          <button style={styles.addBtn} onClick={() => setShowAddStaff(true)}>+ Add Staff</button>
        </div>
        {staffList.map(s => {
          const c = avatarColor(s.id);
          const isPresent = !!viewAtt[s.id];
          const staffLogs = logs.filter(l => l.staffId === s.id && l.date === ownerSelectedDate);
          return (
            <div key={s.id} style={styles.staffCard}>
              <div style={{ ...styles.avatar, background: c.bg, color: c.text }}>{initials(s.name)}</div>
              <div style={{ flex: 1, minWidth: 0, cursor: "pointer" }} onClick={() => { setSelectedStaff(s); setView("detail"); }}>
                <div style={{ fontSize: 14, fontWeight: 600, color: "#1a1a2e" }}>{s.name}</div>
                <div style={{ fontSize: 12, color: "#888", marginTop: 1 }}>{s.role}</div>
                {isPresent
                  ? <div style={{ fontSize: 11, color: "#2563eb", marginTop: 3 }}>{staffLogs.length} clients · {formatCurrency(staffLogs.reduce((a, l) => a + l.amount, 0))} · Detail →</div>
                  : <div style={{ fontSize: 11, color: "#9ca3af", marginTop: 3 }}>
                      Absent
                      {attendance[ownerSelectedDate]?.[s.id + "_reason"] && <span style={{ color: "#ef4444", marginLeft: 4 }}>· {attendance[ownerSelectedDate][s.id + "_reason"]}</span>}
                    </div>
                }
              </div>
              <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 3, flexShrink: 0 }}>
                <div style={{ width: 52, height: 26, borderRadius: 13, background: isPresent ? "#16a34a" : "#d1d5db", position: "relative", cursor: "pointer" }} onClick={() => toggleAttendance(s.id)}>
                  <div style={{ width: 20, height: 20, borderRadius: "50%", background: "white", position: "absolute", top: 3, left: isPresent ? 29 : 3, transition: "left 0.2s", boxShadow: "0 1px 3px rgba(0,0,0,0.2)" }} />
                </div>
                <span style={{ fontSize: 10, fontWeight: 700, color: isPresent ? "#16a34a" : "#9ca3af" }}>{isPresent ? "Present" : "Absent"}</span>
              </div>
            </div>
          );
        })}
      </div>
      {showAddStaff && <AddStaffModal onSave={addStaff} onClose={() => setShowAddStaff(false)} />}
      {showAddLog && <WorkLogModal staffList={staffList.filter(s => viewAtt[s.id])} preselectedStaffId={logForStaff} onSave={addLog} onClose={() => setShowAddLog(false)} />}
    </div>
  );
}

// ─── Staff Self View ───────────────────────────────────────────────────────────
function StaffSelfView({ staff, logs, setLogs, attendance, setAttendance, nextLogId, setNextLogId, showRevenue, onLogout }) {
  const [tab, setTab] = useState("month");
  const [showAddLog, setShowAddLog] = useState(false);
  const c = avatarColor(staff.id);
  const isPresent = !!(attendance[today] || {})[staff.id];
  function toggleMyAttendance() { setAttendance(prev => { const m = { ...(prev[today] || {}) }; m[staff.id] = !m[staff.id]; return { ...prev, [today]: m }; }); }
  function addLog(data) { setLogs(prev => [...prev, { ...data, id: nextLogId }]); setNextLogId(n => n + 1); }
  const filtered = useMemo(() => {
    const cutoff = tab === "today" ? today : tab === "week" ? thisWeekStart : thisMonthStart;
    return logs.filter(l => l.staffId === staff.id && l.date >= cutoff).sort((a, b) => b.date.localeCompare(a.date));
  }, [logs, tab, staff.id]);
  return (
    <div style={styles.page}>
      <div style={styles.header}>
        <div><div style={styles.headerTitle}>Mera Dashboard</div><div style={styles.headerSub}>Staff View</div></div>
        <button onClick={onLogout} style={{ ...styles.backBtn, fontSize: 11 }}>Logout</button>
      </div>
      <div style={{ padding: "14px", display: "flex", gap: 14, alignItems: "center", background: "white", borderBottom: "0.5px solid #e8e8e0" }}>
        <div style={{ ...styles.avatar, width: 52, height: 52, fontSize: 18, background: c.bg, color: c.text }}>{initials(staff.name)}</div>
        <div style={{ flex: 1 }}><div style={{ fontSize: 16, fontWeight: 700, color: "#1a1a2e" }}>{staff.name}</div><div style={{ fontSize: 12, color: "#888" }}>{staff.role}</div></div>
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 3 }}>
          <div style={{ width: 56, height: 28, borderRadius: 14, background: isPresent ? "#16a34a" : "#d1d5db", position: "relative", cursor: "pointer" }} onClick={toggleMyAttendance}>
            <div style={{ width: 22, height: 22, borderRadius: "50%", background: "white", position: "absolute", top: 3, left: isPresent ? 31 : 3, transition: "left 0.2s", boxShadow: "0 1px 3px rgba(0,0,0,0.2)" }} />
          </div>
          <span style={{ fontSize: 11, fontWeight: 700, color: isPresent ? "#16a34a" : "#9ca3af" }}>{isPresent ? "Present" : "Mark Present"}</span>
        </div>
      </div>
      <div style={{ padding: "12px 14px 0" }}>
        <div style={{ ...styles.tabRow, display: "grid", gridTemplateColumns: "1fr 1fr 1fr" }}>
          {[{ key: "today", label: "Aaj" }, { key: "week", label: "Is Hafte" }, { key: "month", label: "Is Mahine" }].map(t => (
            <button key={t.key} style={{ ...styles.tabBtn, ...(tab === t.key ? styles.tabActive : {}) }} onClick={() => setTab(t.key)}>{t.label}</button>
          ))}
        </div>
      </div>
      <div style={{ display: "grid", gridTemplateColumns: showRevenue ? "1fr 1fr" : "1fr", gap: 10, padding: "12px 14px 0" }}>
        <div style={styles.statCard}><div style={{ ...styles.statNum, color: "#1a1a2e" }}>{filtered.length}</div><div style={styles.statLabel}>Clients</div></div>
        {showRevenue && <div style={styles.statCard}><div style={{ ...styles.statNum, color: "#16a34a" }}>{formatCurrency(filtered.reduce((s, l) => s + l.amount, 0))}</div><div style={styles.statLabel}>Revenue</div></div>}
      </div>
      <div style={{ padding: "14px" }}>
        <div style={styles.sectionHeader}><div style={styles.sectionTitle}>Mera Kaam</div><button style={styles.addBtn} onClick={() => setShowAddLog(true)}>+ Add</button></div>
        {filtered.length === 0 ? <div style={styles.emptyState}>Koi entry nahi!</div>
          : filtered.map(log => (
            <div key={log.id} style={styles.logCard}>
              <div style={{ flex: 1 }}><div style={{ fontSize: 14, fontWeight: 600, color: "#1a1a2e" }}>{log.clientName}</div><div style={{ fontSize: 12, color: "#888", marginTop: 2 }}>{log.service} · {formatDate(log.date)}</div></div>
              {showRevenue && <div style={{ fontSize: 14, fontWeight: 700, color: "#16a34a" }}>{formatCurrency(log.amount)}</div>}
            </div>
          ))}
      </div>
      {showAddLog && <WorkLogModal staffList={[staff]} preselectedStaffId={staff.id} onSave={addLog} onClose={() => setShowAddLog(false)} />}
    </div>
  );
}

// ─── Main Export ───────────────────────────────────────────────────────────────
export default function StaffManagement({ role = "owner", currentUser, showRevenue = false, setShowRevenue }) {
  const [staffList, setStaffList] = useState([]);
  const [logs, setLogs] = useState([]);
  const [attendance, setAttendance] = useState({});
  const [nextLogId, setNextLogId] = useState(100);

  useEffect(() => {
    async function loadStaff() {
      const { data } = await supabase.from("staff").select("*").eq("salon_id", currentUser?.id);
      setStaffList(data && data.length > 0 ? data : []);
    }
    if (currentUser?.id) loadStaff();
  }, [currentUser?.id]);

  useEffect(() => {
    async function loadLogs() {
      const { data } = await supabase.from("work_logs").select("*").eq("salon_id", currentUser?.id);
      setLogs(data && data.length > 0 ? data.map(l => ({ id: l.id, staffId: l.staff_id, clientName: l.client_name, service: l.service, amount: l.amount, date: l.date })) : []);
    }
    if (currentUser?.id) loadLogs();
  }, [currentUser?.id]);

  useEffect(() => {
    async function loadAttendance() {
      const { data } = await supabase.from("attendance").select("*").eq("salon_id", currentUser?.id);
      if (data && data.length > 0) {
        const attMap = {};
        data.forEach(row => {
          if (!attMap[row.date]) attMap[row.date] = {};
          attMap[row.date][row.staff_id] = row.is_present;
          if (row.absent_reason) attMap[row.date][row.staff_id + "_reason"] = row.absent_reason;
        });
        setAttendance(attMap);
      } else setAttendance({});
    }
    if (currentUser?.id) loadAttendance();
  }, [currentUser?.id]);

  const loggedInStaff = role === "staff" ? staffList.find(s => s.id === currentUser?.staffId) || staffList[0] : null;

  if (role === "owner") {
    return <OwnerDashboard staffList={staffList} setStaffList={setStaffList} logs={logs} setLogs={setLogs}
      attendance={attendance} setAttendance={setAttendance}
      showRevenueToStaff={showRevenue} setShowRevenueToStaff={setShowRevenue || (() => {})}
      currentUser={currentUser} />;
  }
  if (role === "staff" && loggedInStaff) {
    return <StaffSelfView staff={loggedInStaff} logs={logs} setLogs={setLogs} attendance={attendance} setAttendance={setAttendance}
      nextLogId={nextLogId} setNextLogId={setNextLogId} showRevenue={showRevenue} onLogout={() => {}} />;
  }
  return null;
}

// ─── Styles ────────────────────────────────────────────────────────────────────
const styles = {
  page: { background: "#f5f5f0", minHeight: "100vh", paddingBottom: 80, fontFamily: "'Segoe UI', sans-serif", overflowY: "auto", height: "100%" },
  header: { background: "#1a1a2e", color: "white", padding: "14px 16px", display: "flex", alignItems: "center", justifyContent: "space-between" },
  headerTitle: { fontSize: 17, fontWeight: 700 },
  headerSub: { fontSize: 11, color: "#a0a0c0", marginTop: 1 },
  backBtn: { background: "transparent", border: "1px solid rgba(255,255,255,0.3)", color: "white", borderRadius: 8, padding: "6px 12px", fontSize: 13, cursor: "pointer" },
  statCard: { background: "white", borderRadius: 10, padding: "12px 10px", textAlign: "center", border: "0.5px solid #e8e8e0" },
  statNum: { fontSize: 20, fontWeight: 800 },
  statLabel: { fontSize: 10, color: "#888", marginTop: 2 },
  sectionHeader: { display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 10 },
  sectionTitle: { fontSize: 14, fontWeight: 700, color: "#1a1a2e" },
  addBtn: { background: "#1a1a2e", color: "white", border: "none", borderRadius: 8, padding: "7px 14px", fontSize: 12, fontWeight: 700, cursor: "pointer" },
  staffCard: { background: "white", borderRadius: 12, border: "0.5px solid #e8e8e0", padding: "12px 14px", display: "flex", alignItems: "center", gap: 12, marginBottom: 10 },
  avatar: { width: 42, height: 42, borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 700, fontSize: 14, flexShrink: 0 },
  logCard: { background: "white", borderRadius: 10, border: "0.5px solid #e8e8e0", padding: "11px 14px", display: "flex", alignItems: "center", gap: 12, marginBottom: 8 },
  emptyState: { textAlign: "center", color: "#9ca3af", fontSize: 13, padding: "24px 0" },
  tabRow: { display: "flex", background: "white", borderRadius: 10, border: "0.5px solid #e8e8e0", padding: 3, marginBottom: 12 },
  tabBtn: { flex: 1, border: "none", background: "transparent", padding: "8px 0", fontSize: 13, fontWeight: 600, color: "#888", borderRadius: 8, cursor: "pointer" },
  tabActive: { background: "#1a1a2e", color: "white" },
  modalBg: { position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)", display: "flex", alignItems: "flex-end", justifyContent: "center", zIndex: 100 },
  modal: { background: "white", borderRadius: "20px 20px 0 0", padding: 20, width: "100%", maxWidth: 480 },
  modalTitle: { fontSize: 16, fontWeight: 700, color: "#1a1a2e", marginBottom: 16 },
  formGroup: { marginBottom: 13 },
  formRow: { display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 },
  label: { fontSize: 12, fontWeight: 600, color: "#555", marginBottom: 5, display: "block" },
  input: { width: "100%", border: "1px solid #e2e8f0", borderRadius: 8, padding: "9px 11px", fontSize: 14, color: "#1a1a2e", background: "#fafafa", outline: "none", boxSizing: "border-box" },
  modalActions: { display: "flex", gap: 10, marginTop: 18 },
  btnCancel: { flex: 1, padding: 11, border: "1px solid #e2e8f0", background: "white", borderRadius: 10, fontSize: 14, fontWeight: 600, color: "#666", cursor: "pointer" },
  btnSave: { flex: 2, padding: 11, border: "none", background: "#1a1a2e", borderRadius: 10, fontSize: 14, fontWeight: 600, color: "white", cursor: "pointer" },
};
