import { useState, useMemo, useEffect } from "react";
import { supabase } from "../lib/supabase";

const SERVICES = ["Haircut", "Hair Color", "Facial", "Waxing", "Bridal Makeup", "Manicure", "Pedicure", "Head Massage", "Threading", "Blowdry", "Keratin", "Hair Spa"];
const today = new Date().toISOString().slice(0, 10);
const thisWeekStart = (() => { const d = new Date(); d.setDate(d.getDate() - d.getDay()); return d.toISOString().slice(0, 10); })();
const thisMonthStart = new Date().toISOString().slice(0, 8) + "01";
function daysAgo(n) { const d = new Date(); d.setDate(d.getDate() - n); return d.toISOString().slice(0, 10); }
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

function WorkLogModal({ staffList, preselectedStaffId, onSave, onClose }) {
  const [staffId, setStaffId] = useState(preselectedStaffId || staffList[0]?.id || "");
  const [clientName, setClientName] = useState("");
  const [service, setService] = useState(SERVICES[0]);
  const [amount, setAmount] = useState("");
  const [date, setDate] = useState(today);
  function handleSave() {
    if (!clientName.trim()) { alert("Client ka naam daalo!"); return; }
    if (!amount || isNaN(amount)) { alert("Amount daalo!"); return; }
    onSave({ staffId: staffId, clientName: clientName.trim(), service, amount: Number(amount), date });
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
          <div style={styles.formGroup}><label style={styles.label}>Amount (Rs)</label><input style={styles.input} type="number" placeholder="500" value={amount} onChange={e => setAmount(e.target.value)} /></div>
        </div>
        <div style={styles.modalActions}>
          <button style={styles.btnCancel} onClick={onClose}>Cancel</button>
          <button style={styles.btnSave} onClick={handleSave}>Save Karo</button>
        </div>
      </div>
    </div>
  );
}

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
          <div style={styles.formGroup}><label style={styles.label}>Phone (10 digits)</label><input style={styles.input} placeholder="9876543210" value={phone} onChange={e => setPhone(e.target.value.replace(/\D/g,"").slice(0,10))} /></div>
          <div style={styles.formGroup}><label style={styles.label}>Salary (Rs/month)</label><input style={styles.input} type="number" placeholder="12000" value={salary} onChange={e => setSalary(e.target.value)} /></div>
        </div>
        <div style={styles.formGroup}><label style={styles.label}>Staff PIN (4 digit) *</label><input style={styles.input} type="number" placeholder="1234" value={pin} onChange={e => setPin(e.target.value.slice(0,4))} /></div>
        <div style={styles.modalActions}><button style={styles.btnCancel} onClick={onClose}>Cancel</button><button style={styles.btnSave} onClick={handleSave}>Add Karo</button></div>
      </div>
    </div>
  );
}

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
          <div style={styles.formGroup}><label style={styles.label}>Phone (10 digits)</label><input style={styles.input} value={phone} onChange={e => setPhone(e.target.value.replace(/\D/g,"").slice(0,10))} /></div>
          <div style={styles.formGroup}><label style={styles.label}>Salary (Rs/month)</label><input style={styles.input} type="number" value={salary} onChange={e => setSalary(e.target.value)} /></div>
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

function EditLogModal({ log, onSave, onDelete, onClose }) {
  const [clientName, setClientName] = useState(log.clientName); const [service, setService] = useState(log.service);
  const [amount, setAmount] = useState(log.amount); const [date, setDate] = useState(log.date); const [confirmDelete, setConfirmDelete] = useState(false);
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

function SalarySlipScreen({ staff, logs, attendance, onBack }) {
  const [slipMonth, setSlipMonth] = useState(new Date().toISOString().slice(0, 7));
  const monthStart = slipMonth + "-01";
  const monthEnd = (() => { const [y, m] = slipMonth.split("-").map(Number); return new Date(y, m, 0).toISOString().slice(0, 10); })();
  const totalDaysInMonth = (() => { const [y, m] = slipMonth.split("-").map(Number); return new Date(y, m, 0).getDate(); })();
  const presentDays = Object.entries(attendance).filter(([d, map]) => d >= monthStart && d <= monthEnd && map[staff.id]).length;
  const absentDays = totalDaysInMonth - presentDays;
  const monthLogs = logs.filter(l => l.staffId === staff.id && l.date >= monthStart && l.date <= monthEnd);
  const totalRevenue = monthLogs.reduce((s, l) => s + l.amount, 0);
  const perDaySalary = staff.salary / totalDaysInMonth;
  const earnedSalary = Math.round(perDaySalary * presentDays);
  const deduction = staff.salary - earnedSalary;
  const c = avatarColor(staff.id);
  const monthLabel = new Date(slipMonth + "-01").toLocaleDateString("en-IN", { month: "long", year: "numeric" });
  return (
    <div style={styles.page}>
      <div style={styles.header}>
        <button onClick={onBack} style={styles.backBtn}>Back</button>
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
            {[
              { label: "Fixed Salary", value: formatCurrency(staff.salary), color: "#1a1a2e" },
              { label: "Earned", value: formatCurrency(earnedSalary), color: "#16a34a" },
              { label: "Deduction", value: "- " + formatCurrency(deduction), color: "#dc2626" },
            ].map(row => (
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

function StaffSummaryScreen({ staffList, logs, attendance, onBack }) {
  const [selDate, setSelDate] = useState(today);
  const [viewMode, setViewMode] = useState("day"); // day | month
  const [selMonth, setSelMonth] = useState(new Date().toISOString().slice(0, 7));

  const viewAtt = attendance[selDate] || {};
  const dayLogs = logs.filter(l => l.date === selDate);
  const totalRevenue = dayLogs.reduce((s, l) => s + l.amount, 0);
  const presentCount = staffList.filter(s => viewAtt[s.id]).length;

  const monthStart = selMonth + "-01";
  const monthEnd = (() => { const [y, m] = selMonth.split("-").map(Number); return new Date(y, m, 0).toISOString().slice(0, 10); })();

  return (
    <div style={styles.page}>
      <div style={styles.header}>
        <button onClick={onBack} style={styles.backBtn}>← Back</button>
        <div style={{ textAlign: "center" }}>
          <div style={styles.headerTitle}>📊 Staff Summary</div>
          <div style={styles.headerSub}>Attendance + Work Logs</div>
        </div>
        <div style={{ width: 60 }} />
      </div>

      {/* View Mode Toggle */}
      <div style={{ background: "white", padding: "10px 14px", borderBottom: "0.5px solid #e8e8e0", display: "flex", gap: 8 }}>
        {[{ key: "day", label: "📅 Din Wise" }, { key: "month", label: "📆 Mahine Wise" }].map(m => (
          <button key={m.key} onClick={() => setViewMode(m.key)} style={{ flex: 1, padding: "8px", border: `2px solid ${viewMode === m.key ? "#22c55e" : "#e8edf3"}`, borderRadius: 10, background: viewMode === m.key ? "#e8fdf0" : "white", color: viewMode === m.key ? "#16a34a" : "#888", fontFamily: "inherit", fontSize: 13, fontWeight: 700, cursor: "pointer" }}>
            {m.label}
          </button>
        ))}
      </div>

      {viewMode === "day" && <>
        {/* Date Picker */}
        <div style={{ background: "white", padding: "12px 14px", borderBottom: "0.5px solid #e8e8e0", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div style={{ fontSize: 13, fontWeight: 700, color: "#1a1a2e" }}>Date</div>
          <input type="date" value={selDate} onChange={e => setSelDate(e.target.value)}
            style={{ border: "2px solid #22c55e", borderRadius: 8, padding: "6px 10px", fontSize: 13, fontWeight: 700, color: "#16a34a", outline: "none", cursor: "pointer" }} />
        </div>

        {/* Day Stats */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr 1fr", gap: 8, padding: "12px 14px 0" }}>
          {[
            { label: "Present", val: presentCount, color: "#16a34a" },
            { label: "Absent", val: staffList.length - presentCount, color: "#dc2626" },
            { label: "Services", val: dayLogs.length, color: "#1a1a2e" },
            { label: "Revenue", val: "₹" + totalRevenue.toLocaleString("en-IN"), color: "#2563eb", small: true },
          ].map(s => (
            <div key={s.label} style={styles.statCard}>
              <div style={{ ...styles.statNum, color: s.color, fontSize: s.small ? 12 : 20 }}>{s.val}</div>
              <div style={styles.statLabel}>{s.label}</div>
            </div>
          ))}
        </div>

        {/* Per Staff Day View */}
        <div style={{ padding: "14px" }}>
          {staffList.length === 0 && <div style={styles.emptyState}>Koi staff nahi</div>}
          {staffList.map(s => {
            const c = avatarColor(s.id);
            const isPresent = !!viewAtt[s.id];
            const staffLogs = dayLogs.filter(l => l.staffId === s.id);
            const staffRevenue = staffLogs.reduce((sum, l) => sum + l.amount, 0);
            const reason = attendance[selDate]?.[s.id + "_reason"];
            return (
              <div key={s.id} style={{ background: "white", borderRadius: 14, border: `2px solid ${isPresent ? "#bbf7d0" : "#fecaca"}`, padding: 14, marginBottom: 10 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: (isPresent && staffLogs.length > 0) ? 10 : 0 }}>
                  <div style={{ ...styles.avatar, background: c.bg, color: c.text, width: 38, height: 38, fontSize: 12 }}>{initials(s.name)}</div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 14, fontWeight: 700, color: "#1a1a2e" }}>{s.name}</div>
                    <div style={{ fontSize: 11, color: "#888" }}>{s.role}</div>
                  </div>
                  <div style={{ textAlign: "right" }}>
                    <div style={{ background: isPresent ? "#dcfce7" : "#fee2e2", color: isPresent ? "#16a34a" : "#dc2626", fontSize: 10, fontWeight: 800, padding: "3px 10px", borderRadius: 20 }}>
                      {isPresent ? "✅ Present" : "❌ Absent"}
                    </div>
                    {isPresent && <div style={{ fontSize: 11, fontWeight: 700, color: "#16a34a", marginTop: 4 }}>₹{staffRevenue.toLocaleString("en-IN")} · {staffLogs.length} clients</div>}
                  </div>
                </div>
                {!isPresent && reason && (
                  <div style={{ background: "#fef2f2", borderRadius: 8, padding: "6px 10px", marginTop: 8, fontSize: 11, color: "#dc2626", fontWeight: 600 }}>
                    📝 Reason: {reason}
                  </div>
                )}
                {isPresent && staffLogs.length > 0 && (
                  <div style={{ borderTop: "1px solid #f0f4f8", paddingTop: 10 }}>
                    {staffLogs.map((log, i) => (
                      <div key={log.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "5px 0", borderBottom: i < staffLogs.length - 1 ? "0.5px solid #f0f4f8" : "none" }}>
                        <div>
                          <div style={{ fontSize: 12, fontWeight: 600, color: "#1a1a2e" }}>{log.clientName}</div>
                          <div style={{ fontSize: 11, color: "#888" }}>{log.service}</div>
                        </div>
                        <div style={{ fontSize: 12, fontWeight: 700, color: "#16a34a" }}>₹{log.amount.toLocaleString("en-IN")}</div>
                      </div>
                    ))}
                  </div>
                )}
                {isPresent && staffLogs.length === 0 && (
                  <div style={{ fontSize: 11, color: "#aaa", marginTop: 8, fontStyle: "italic" }}>Koi work log nahi is din ka</div>
                )}
              </div>
            );
          })}
        </div>
      </>}

      {viewMode === "month" && <>
        {/* Month Picker */}
        <div style={{ background: "white", padding: "12px 14px", borderBottom: "0.5px solid #e8e8e0", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div style={{ fontSize: 13, fontWeight: 700, color: "#1a1a2e" }}>Month</div>
          <input type="month" value={selMonth} onChange={e => setSelMonth(e.target.value)}
            style={{ border: "2px solid #22c55e", borderRadius: 8, padding: "6px 10px", fontSize: 13, fontWeight: 700, color: "#16a34a", outline: "none", cursor: "pointer" }} />
        </div>

        {/* Per Staff Month Summary */}
        <div style={{ padding: "14px" }}>
          {staffList.map(s => {
            const c = avatarColor(s.id);
            const monthLogs = logs.filter(l => l.staffId === s.id && l.date >= monthStart && l.date <= monthEnd);
            const monthRevenue = monthLogs.reduce((sum, l) => sum + l.amount, 0);
            const presentDays = Object.entries(attendance).filter(([d, map]) => d >= monthStart && d <= monthEnd && map[s.id]).length;
            const totalDays = (() => { const [y, m] = selMonth.split("-").map(Number); return new Date(y, m, 0).getDate(); })();
            return (
              <div key={s.id} style={{ background: "white", borderRadius: 14, border: "1.5px solid #e8edf3", padding: 14, marginBottom: 10 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 12 }}>
                  <div style={{ ...styles.avatar, background: c.bg, color: c.text, width: 38, height: 38, fontSize: 12 }}>{initials(s.name)}</div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 14, fontWeight: 700, color: "#1a1a2e" }}>{s.name}</div>
                    <div style={{ fontSize: 11, color: "#888" }}>{s.role} · {formatCurrency(s.salary)}/mo</div>
                  </div>
                </div>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr 1fr", gap: 6 }}>
                  {[
                    { label: "Present", val: presentDays, color: "#16a34a", bg: "#f0fdf4" },
                    { label: "Absent", val: totalDays - presentDays, color: "#dc2626", bg: "#fef2f2" },
                    { label: "Clients", val: monthLogs.length, color: "#1a1a2e", bg: "#f8fafc" },
                    { label: "Revenue", val: "₹" + (monthRevenue/1000).toFixed(1) + "k", color: "#2563eb", bg: "#eff6ff" },
                  ].map(st => (
                    <div key={st.label} style={{ background: st.bg, borderRadius: 8, padding: "8px 4px", textAlign: "center" }}>
                      <div style={{ fontSize: 14, fontWeight: 800, color: st.color }}>{st.val}</div>
                      <div style={{ fontSize: 9, color: "#888", marginTop: 2 }}>{st.label}</div>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </>}
    </div>
  );
}

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
      await supabase.from("work_logs").update({
        client_name: updated.clientName, service: updated.service,
        amount: updated.amount, date: updated.date
      }).eq("id", updated.id);
    }
    setLogs(prev => prev.map(l => l.id === updated.id ? updated : l));
  }

  async function handleDeleteLog(id) {
    if (currentUser?.id) {
      await supabase.from("work_logs").delete().eq("id", id);
    }
    setLogs(prev => prev.filter(l => l.id !== id));
  }

  if (showSalarySlip) return <SalarySlipScreen staff={staff} logs={logs} attendance={attendance} onBack={() => setShowSalarySlip(false)} />;

  return (
    <div style={styles.page}>
      <div style={styles.header}>
        <button onClick={onBack} style={styles.backBtn}>Back</button>
        <div style={{ textAlign: "center" }}><div style={styles.headerTitle}>{staff.name}</div><div style={styles.headerSub}>{staff.role}</div></div>
        <button onClick={() => setShowEditStaff(true)} style={{ ...styles.backBtn, fontSize: 11 }}>Edit</button>
      </div>
      <div style={{ padding: "14px 14px 0", display: "flex", gap: 14, alignItems: "center" }}>
        <div style={{ ...styles.avatar, width: 56, height: 56, fontSize: 18, background: c.bg, color: c.text }}>{initials(staff.name)}</div>
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
        <div style={styles.statCard}><div style={{ ...styles.statNum, color: "#16a34a" }}>{formatCurrency(totalRevenue)}</div><div style={styles.statLabel}>Revenue</div></div>
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
    setAttendance(prev => {
      const dm = { ...(prev[ownerSelectedDate] || {}) };
      dm[staffId] = newVal;
      return { ...prev, [ownerSelectedDate]: dm };
    });
    if (currentUser?.id) {
      await supabase.from("attendance").upsert({
        salon_id: currentUser.id, staff_id: staffId,
        date: ownerSelectedDate, is_present: newVal
      }, { onConflict: "salon_id,staff_id,date" });
    }
  }

  async function addStaff(data) {
    if (currentUser?.id) {
      const { data: res } = await supabase.from("staff").insert({
        salon_id: currentUser.id, name: data.name, role: data.role,
        phone: data.phone, salary: data.salary, pin: data.pin
      }).select().single();
      if (res) { setStaffList(prev => [...prev, res]); return; }
    }
    setStaffList(prev => [...prev, { ...data, id: Date.now() }]);
  }

  async function editStaff(updated) {
    if (currentUser?.id && typeof updated.id === "string") {
      await supabase.from("staff").update({
        name: updated.name, role: updated.role, phone: updated.phone,
        salary: updated.salary, pin: updated.pin
      }).eq("id", updated.id);
    }
    setStaffList(prev => prev.map(s => s.id === updated.id ? updated : s));
  }

  async function deleteStaff(id) {
    if (currentUser?.id && typeof id === "string") {
      await supabase.from("staff").delete().eq("id", id);
    }
    setStaffList(prev => prev.filter(s => s.id !== id));
    setView("list");
  }

  async function addLog(data) {
    if (currentUser?.id) {
      const { data: res } = await supabase.from("work_logs").insert({
        salon_id: currentUser.id, staff_id: data.staffId,
        client_name: data.clientName, service: data.service,
        amount: data.amount, date: data.date
      }).select().single();
      if (res) {
        setLogs(prev => [...prev, {
          id: res.id, staffId: res.staff_id, clientName: res.client_name,
          service: res.service, amount: res.amount, date: res.date
        }]);
        return;
      }
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

  if (showSummary) {
    return <StaffSummaryScreen staffList={staffList} logs={logs} attendance={attendance} onBack={() => setShowSummary(false)} />;
  }

  if (view === "detail" && selectedStaff) {
    return (
      <>
        <StaffDetailScreen
          staff={selectedStaff} logs={logs} setLogs={setLogs}
          attendance={attendance} onBack={() => setView("list")}
          onAddLog={() => { setLogForStaff(selectedStaff.id); setShowAddLog(true); }}
          onEditStaff={editStaff} onDeleteStaff={deleteStaff}
          currentUser={currentUser}
        />
        {showAddLog && <WorkLogModal staffList={staffList} preselectedStaffId={logForStaff} onSave={addLog} onClose={() => setShowAddLog(false)} />}
      </>
    );
  }

  return (
    <div style={styles.page}>
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
                      {attendance[ownerSelectedDate]?.[s.id + "_reason"] &&
                        <span style={{ color: "#ef4444", marginLeft: 4 }}>· {attendance[ownerSelectedDate][s.id + "_reason"]}</span>
                      }
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

export default function StaffManagement({ role = "owner", currentUser, showRevenue = false, setShowRevenue }) {
  const [staffList, setStaffList] = useState([]);
  const [logs, setLogs] = useState([]);
  const [attendance, setAttendance] = useState({});
  const [nextLogId, setNextLogId] = useState(100);

  useEffect(() => {
    async function loadStaff() {
      const { data } = await supabase.from("staff").select("*").eq("salon_id", currentUser?.id);
      if (data && data.length > 0) setStaffList(data);
      else setStaffList([]);
    }
    if (currentUser?.id) loadStaff();
  }, [currentUser?.id]);

  useEffect(() => {
    async function loadLogs() {
      const { data } = await supabase.from("work_logs").select("*").eq("salon_id", currentUser?.id);
      if (data && data.length > 0) {
        setLogs(data.map(l => ({
          id: l.id, staffId: l.staff_id, clientName: l.client_name,
          service: l.service, amount: l.amount, date: l.date
        })));
      } else setLogs([]);
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
    return <OwnerDashboard
      staffList={staffList} setStaffList={setStaffList}
      logs={logs} setLogs={setLogs}
      attendance={attendance} setAttendance={setAttendance}
      showRevenueToStaff={showRevenue} setShowRevenueToStaff={setShowRevenue || (() => {})}
      currentUser={currentUser}
    />;
  }
  if (role === "staff" && loggedInStaff) {
    return <StaffSelfView
      staff={loggedInStaff} logs={logs} setLogs={setLogs}
      attendance={attendance} setAttendance={setAttendance}
      nextLogId={nextLogId} setNextLogId={setNextLogId}
      showRevenue={showRevenue} onLogout={() => {}}
    />;
  }
  return null;
}

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
