import { useState, useMemo } from "react";

// ─── Dummy Data ───────────────────────────────────────────────────────────────
const SERVICES = ["Haircut", "Hair Color", "Facial", "Waxing", "Bridal Makeup", "Manicure", "Pedicure", "Head Massage", "Threading", "Blowdry", "Keratin", "Hair Spa"];

const INITIAL_STAFF = [
  { id: 1, name: "Priya Sharma",  role: "Hairstylist",    phone: "98765 43210", salary: 14000, pin: "1111" },
  { id: 2, name: "Ritu Gupta",    role: "Makeup Artist",  phone: "87654 32109", salary: 16000, pin: "2222" },
  { id: 3, name: "Suresh Kumar",  role: "Nail Artist",    phone: "76543 21098", salary: 11000, pin: "3333" },
  { id: 4, name: "Neha Singh",    role: "Receptionist",   phone: "65432 10987", salary: 10000, pin: "4444" },
];

const today = new Date().toISOString().slice(0, 10);
const thisWeekStart = (() => {
  const d = new Date(); d.setDate(d.getDate() - d.getDay()); return d.toISOString().slice(0, 10);
})();
const thisMonthStart = new Date().toISOString().slice(0, 8) + "01";

function daysAgo(n) {
  const d = new Date(); d.setDate(d.getDate() - n); return d.toISOString().slice(0, 10);
}

const INITIAL_LOGS = [
  { id: 1, staffId: 1, clientName: "Anjali Mehta",   service: "Hair Color",  amount: 1200, date: today },
  { id: 2, staffId: 1, clientName: "Sunita Rao",     service: "Haircut",     amount: 400,  date: today },
  { id: 3, staffId: 1, clientName: "Pooja Verma",    service: "Blowdry",     amount: 300,  date: today },
  { id: 4, staffId: 2, clientName: "Meera Joshi",    service: "Facial",      amount: 800,  date: today },
  { id: 5, staffId: 2, clientName: "Divya Shah",     service: "Waxing",      amount: 500,  date: today },
  { id: 6, staffId: 4, clientName: "Kavya Nair",     service: "Threading",   amount: 100,  date: today },
  { id: 7, staffId: 1, clientName: "Rina Das",       service: "Haircut",     amount: 350,  date: daysAgo(1) },
  { id: 8, staffId: 1, clientName: "Sonal Tiwari",   service: "Hair Spa",    amount: 900,  date: daysAgo(2) },
  { id: 9, staffId: 2, clientName: "Prerna Gupta",   service: "Bridal Makeup", amount: 3500, date: daysAgo(3) },
  { id: 10, staffId: 3, clientName: "Nisha Patil",   service: "Manicure",    amount: 400,  date: daysAgo(4) },
];

const INITIAL_ATTENDANCE = {
  [today]: { 1: true, 2: true, 3: false, 4: true },
};

const AVATAR_COLORS = [
  { bg: "#fce7f3", text: "#9d174d" },
  { bg: "#dbeafe", text: "#1e40af" },
  { bg: "#d1fae5", text: "#065f46" },
  { bg: "#fef3c7", text: "#92400e" },
  { bg: "#ede9fe", text: "#4c1d95" },
];

function initials(name) { return name.split(" ").map(w => w[0]).join("").substring(0, 2).toUpperCase(); }
function avatarColor(id) { return AVATAR_COLORS[(id - 1) % AVATAR_COLORS.length]; }
function formatCurrency(n) { return "₹" + Number(n).toLocaleString("en-IN"); }
function formatDate(d) { return new Date(d + "T00:00:00").toLocaleDateString("en-IN", { day: "numeric", month: "short" }); }

// ─── Shared: Work Log Entry Modal ─────────────────────────────────────────────
function WorkLogModal({ staffList, preselectedStaffId, onSave, onClose }) {
  const [staffId, setStaffId] = useState(preselectedStaffId || staffList[0]?.id || "");
  const [clientName, setClientName] = useState("");
  const [service, setService] = useState(SERVICES[0]);
  const [amount, setAmount] = useState("");
  const [date, setDate] = useState(today);

  function handleSave() {
    if (!clientName.trim()) { alert("Client ka naam daalo!"); return; }
    if (!amount || isNaN(amount)) { alert("Amount daalo!"); return; }
    onSave({ staffId: Number(staffId), clientName: clientName.trim(), service, amount: Number(amount), date });
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
          <div style={styles.formGroup}>
            <label style={styles.label}>Client Naam</label>
            <input style={styles.input} placeholder="Anjali Mehta" value={clientName} onChange={e => setClientName(e.target.value)} />
          </div>
          <div style={styles.formGroup}>
            <label style={styles.label}>Date</label>
            <input style={styles.input} type="date" value={date} onChange={e => setDate(e.target.value)} />
          </div>
        </div>

        <div style={styles.formRow}>
          <div style={styles.formGroup}>
            <label style={styles.label}>Service</label>
            <select style={styles.input} value={service} onChange={e => setService(e.target.value)}>
              {SERVICES.map(s => <option key={s}>{s}</option>)}
            </select>
          </div>
          <div style={styles.formGroup}>
            <label style={styles.label}>Amount (₹)</label>
            <input style={styles.input} type="number" placeholder="500" value={amount} onChange={e => setAmount(e.target.value)} />
          </div>
        </div>

        <div style={styles.modalActions}>
          <button style={styles.btnCancel} onClick={onClose}>Cancel</button>
          <button style={styles.btnSave} onClick={handleSave}>Save Karo ✓</button>
        </div>
      </div>
    </div>
  );
}

// ─── Shared: Add Staff Modal ───────────────────────────────────────────────────
function AddStaffModal({ onSave, onClose }) {
  const [name, setName] = useState("");
  const [role, setRole] = useState("Hairstylist");
  const [phone, setPhone] = useState("");
  const [salary, setSalary] = useState("");
  const [pin, setPin] = useState("");

  function handleSave() {
    if (!name.trim()) { alert("Naam daalo!"); return; }
    if (!pin || pin.length < 4) { alert("4-digit PIN daalo staff ke liye!"); return; }
    onSave({ name: name.trim(), role, phone, salary: Number(salary) || 0, pin });
    onClose();
  }

  return (
    <div style={styles.modalBg} onClick={e => e.target === e.currentTarget && onClose()}>
      <div style={styles.modal}>
        <div style={styles.modalTitle}>Naya Staff Add Karo</div>
        <div style={styles.formRow}>
          <div style={styles.formGroup}>
            <label style={styles.label}>Naam</label>
            <input style={styles.input} placeholder="Priya Sharma" value={name} onChange={e => setName(e.target.value)} />
          </div>
          <div style={styles.formGroup}>
            <label style={styles.label}>Role</label>
            <select style={styles.input} value={role} onChange={e => setRole(e.target.value)}>
              {["Hairstylist","Makeup Artist","Nail Artist","Receptionist","Manager"].map(r => <option key={r}>{r}</option>)}
            </select>
          </div>
        </div>
        <div style={styles.formRow}>
          <div style={styles.formGroup}>
            <label style={styles.label}>Phone</label>
            <input style={styles.input} placeholder="98765 43210" value={phone} onChange={e => setPhone(e.target.value)} />
          </div>
          <div style={styles.formGroup}>
            <label style={styles.label}>Salary (₹/month)</label>
            <input style={styles.input} type="number" placeholder="12000" value={salary} onChange={e => setSalary(e.target.value)} />
          </div>
        </div>
        <div style={styles.formGroup}>
          <label style={styles.label}>Staff PIN (4 digit — login ke liye)</label>
          <input style={styles.input} type="number" placeholder="1234" maxLength={4} value={pin} onChange={e => setPin(e.target.value.slice(0,4))} />
        </div>
        <div style={styles.modalActions}>
          <button style={styles.btnCancel} onClick={onClose}>Cancel</button>
          <button style={styles.btnSave} onClick={handleSave}>Add Karo ✓</button>
        </div>
      </div>
    </div>
  );
}

// ─── Staff Analytics Tabs — Attendance | Work ────────────────────────────────
function StaffAnalyticsTabs({ rangeLogs, rangeRevenue, rangePresentDays, rangeDays, showRevenue, presentDates, absentDates, absentNotes, setAbsentNotes }) {
  const [activeTab, setActiveTab] = useState("attendance");
  const [drawer, setDrawer] = useState(null);

  const absentDays = rangeDays - rangePresentDays;
  const attPct = rangeDays > 0 ? Math.round((rangePresentDays / rangeDays) * 100) : 0;
  const attColor = attPct >= 80 ? "#16a34a" : attPct >= 50 ? "#f59e0b" : "#dc2626";
  const attBg    = attPct >= 80 ? "#f0fdf4"  : attPct >= 50 ? "#fffbeb"  : "#fef2f2";
  const attRating = attPct >= 90 ? "🌟 Excellent!" : attPct >= 75 ? "✅ Good" : attPct >= 50 ? "⚠️ Average" : "❌ Needs Improvement";

  return (
    <div>
      {/* Tab bar */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", margin: "12px 14px 0", background: "#f1f5f9", borderRadius: 10, padding: 3 }}>
        <button onClick={() => setActiveTab("attendance")}
          style={{ padding: "8px 0", border: "none", borderRadius: 8, fontSize: 13, fontWeight: 700, cursor: "pointer",
            background: activeTab === "attendance" ? "#1a1a2e" : "transparent",
            color: activeTab === "attendance" ? "white" : "#888" }}>
          Attendance
        </button>
        <button onClick={() => setActiveTab("work")}
          style={{ padding: "8px 0", border: "none", borderRadius: 8, fontSize: 13, fontWeight: 700, cursor: "pointer",
            background: activeTab === "work" ? "#1a1a2e" : "transparent",
            color: activeTab === "work" ? "white" : "#888" }}>
          Work Log
        </button>
      </div>

      {/* ── ATTENDANCE TAB ── */}
      {activeTab === "attendance" && (
        <div style={{ padding: "14px 14px 8px" }}>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 12 }}>
            {/* CLICKABLE Present box */}
            <div
              onClick={() => setDrawer("present")}
              style={{ background: "#f0fdf4", borderRadius: 12, padding: "14px", textAlign: "center", cursor: "pointer", border: "0.5px solid #bbf7d0" }}>
              <div style={{ fontSize: 36, fontWeight: 800, color: "#16a34a" }}>{rangePresentDays}</div>
              <div style={{ fontSize: 12, fontWeight: 700, color: "#166534", marginTop: 2 }}>Present din</div>
              <div style={{ fontSize: 10, color: "#16a34a", marginTop: 3 }}>tap for dates →</div>
            </div>
            {/* CLICKABLE Absent box */}
            <div
              onClick={() => setDrawer("absent")}
              style={{ background: "#fef2f2", borderRadius: 12, padding: "14px", textAlign: "center", cursor: "pointer", border: "0.5px solid #fecaca" }}>
              <div style={{ fontSize: 36, fontWeight: 800, color: "#dc2626" }}>{absentDays}</div>
              <div style={{ fontSize: 12, fontWeight: 700, color: "#991b1b", marginTop: 2 }}>Absent din</div>
              <div style={{ fontSize: 10, color: "#dc2626", marginTop: 3 }}>tap for reason →</div>
            </div>
          </div>
          <div style={{ background: attBg, borderRadius: 10, padding: "10px 14px", textAlign: "center" }}>
            <div style={{ fontSize: 13, color: "#555", marginBottom: 4 }}>{rangePresentDays} / {rangeDays} din present</div>
            <div style={{ fontSize: 15, fontWeight: 800, color: attColor }}>{attRating}</div>
          </div>
        </div>
      )}

      {activeTab === "work" && (
        <div style={{ padding: "14px 14px 8px" }}>
          <div style={{ display: "grid", gridTemplateColumns: showRevenue ? "1fr 1fr" : "1fr", gap: 10, marginBottom: 12 }}>
            {showRevenue && (
              <div style={{ background: "#f0fdf4", borderRadius: 12, padding: "14px", textAlign: "center" }}>
                <div style={{ fontSize: 24, fontWeight: 800, color: "#16a34a" }}>{formatCurrency(rangeRevenue)}</div>
                <div style={{ fontSize: 12, fontWeight: 700, color: "#166534", marginTop: 2 }}>Total Revenue</div>
              </div>
            )}
            <div style={{ background: "#f8fafc", borderRadius: 12, padding: "14px", textAlign: "center" }}>
              <div style={{ fontSize: 36, fontWeight: 800, color: "#1a1a2e" }}>{rangeLogs.length}</div>
              <div style={{ fontSize: 12, fontWeight: 700, color: "#555", marginTop: 2 }}>Clients</div>
            </div>
          </div>

          {rangeLogs.length > 0 ? (
            <div>
              <div style={{ fontSize: 12, fontWeight: 700, color: "#1a1a2e", marginBottom: 8 }}>Client Entries</div>
              {[...rangeLogs].sort((a, b) => b.date.localeCompare(a.date)).map(log => (
                <div
                  key={log.id}
                  onClick={() => setDrawer({ type: "workDetail", log })}
                  style={{ background: "#f8fafc", borderRadius: 10, padding: "10px 12px", marginBottom: 8, cursor: "pointer", border: "0.5px solid #e8e8e0" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <div style={{ fontSize: 13, fontWeight: 700, color: "#1a1a2e" }}>{log.clientName}</div>
                    {showRevenue && <div style={{ fontSize: 13, fontWeight: 700, color: "#16a34a" }}>{formatCurrency(log.amount)}</div>}
                  </div>
                  <div style={{ display: "flex", gap: 8, marginTop: 5 }}>
                    <span style={{ fontSize: 11, background: "#e0e7ff", color: "#3730a3", borderRadius: 5, padding: "2px 7px", fontWeight: 600 }}>{log.service}</span>
                    <span style={{ fontSize: 11, color: "#888" }}>{formatDate(log.date)}</span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div style={styles.emptyState}>Is period mein koi work entry nahi</div>
          )}
        </div>
      )}

      {/* ── DRAWERS ── */}
      {drawer === "present" && (
        <DetailDrawer title="Present Dates" onClose={() => setDrawer(null)}>
          {(presentDates || []).length === 0
            ? <div style={styles.emptyState}>Koi present day nahi</div>
            : (presentDates || []).map(d => (
              <div key={d} style={{ display: "flex", alignItems: "center", gap: 10, padding: "9px 0", borderBottom: "0.5px solid #f1f5f9" }}>
                <div style={{ width: 8, height: 8, borderRadius: "50%", background: "#16a34a" }} />
                <div style={{ fontSize: 13, fontWeight: 600, color: "#1a1a2e" }}>{formatDate(d)}</div>
                <div style={{ fontSize: 11, color: "#16a34a", marginLeft: "auto", fontWeight: 700 }}>✓ Present</div>
              </div>
            ))
          }
        </DetailDrawer>
      )}

      {drawer === "absent" && (
        <DetailDrawer title="Absent Dates + Apna Reason" onClose={() => setDrawer(null)}>
          {/* Staff-only note label */}
          <div style={{ background: "#eff6ff", borderRadius: 8, padding: "7px 10px", marginBottom: 12, display: "flex", alignItems: "center", gap: 6 }}>
            <div style={{ fontSize: 11, color: "#1e40af", fontWeight: 700 }}>🔒 Sirf Apna Note — Owner ko nahi dikhega</div>
          </div>
          {(absentDates || []).length === 0
            ? <div style={styles.emptyState}>Koi absent day nahi!</div>
            : (absentDates || []).map(d => (
              <div key={d} style={{ padding: "10px 0", borderBottom: "0.5px solid #f1f5f9" }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6 }}>
                  <div style={{ width: 8, height: 8, borderRadius: "50%", background: "#dc2626" }} />
                  <div style={{ fontSize: 13, fontWeight: 600, color: "#1a1a2e" }}>{formatDate(d)}</div>
                  <div style={{ fontSize: 11, color: "#dc2626", marginLeft: "auto", fontWeight: 700 }}>✗ Absent</div>
                </div>
                <input
                  style={{ ...styles.input, fontSize: 12, padding: "7px 10px", background: "#eff6ff", border: "0.5px solid #93c5fd" }}
                  placeholder="Apna reason likho (sirf tum dekhoge)..."
                  value={(absentNotes || {})[d] || ""}
                  onChange={e => setAbsentNotes(prev => ({ ...prev, [d]: e.target.value }))}
                />
              </div>
            ))
          }
        </DetailDrawer>
      )}

      {drawer?.type === "workDetail" && (
        <DetailDrawer title="Service Detail" onClose={() => setDrawer(null)}>
          <div style={{ background: "#f8fafc", borderRadius: 12, padding: "16px", marginBottom: 8 }}>
            <div style={{ fontSize: 16, fontWeight: 800, color: "#1a1a2e", marginBottom: 12 }}>{drawer.log.clientName}</div>
            <div style={{ display: "flex", justifyContent: "space-between", padding: "8px 0", borderBottom: "0.5px solid #e8e8e0" }}>
              <div style={{ fontSize: 12, color: "#888" }}>Service</div>
              <div style={{ fontSize: 13, fontWeight: 600, color: "#3730a3" }}>{drawer.log.service}</div>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", padding: "8px 0", borderBottom: "0.5px solid #e8e8e0" }}>
              <div style={{ fontSize: 12, color: "#888" }}>Date</div>
              <div style={{ fontSize: 13, fontWeight: 600, color: "#1a1a2e" }}>{formatDate(drawer.log.date)}</div>
            </div>
            {showRevenue && (
              <div style={{ display: "flex", justifyContent: "space-between", padding: "8px 0" }}>
                <div style={{ fontSize: 12, color: "#888" }}>Amount</div>
                <div style={{ fontSize: 15, fontWeight: 800, color: "#16a34a" }}>{formatCurrency(drawer.log.amount)}</div>
              </div>
            )}
          </div>
        </DetailDrawer>
      )}
    </div>
  );
}

// ─── Mini Calendar Component (with range selection) ───────────────────────────
function MiniCalendar({ staffId, logs, attendance, selectedDate, onSelectDate, onRangeSelect, showRevenue = true, absentNotes = {}, setAbsentNotes = () => {} }) {
  const [calYear, setCalYear] = useState(new Date().getFullYear());
  const [calMonth, setCalMonth] = useState(new Date().getMonth());
  const [mode, setMode] = useState("single");
  const [rangeStart, setRangeStart] = useState(null);
  const [rangeEnd, setRangeEnd] = useState(null);

  const firstDay = new Date(calYear, calMonth, 1).getDay();
  const daysInMonth = new Date(calYear, calMonth + 1, 0).getDate();
  const monthLabel = new Date(calYear, calMonth).toLocaleDateString("en-IN", { month: "long", year: "numeric" });

  const logDates = new Set(logs.filter(l => l.staffId === staffId).map(l => l.date));
  const presentDates = new Set(
    Object.entries(attendance).filter(([, m]) => m[staffId]).map(([d]) => d)
  );

  function dateStr(day) {
    return `${calYear}-${String(calMonth + 1).padStart(2,"0")}-${String(day).padStart(2,"0")}`;
  }
  function prevMonth() {
    if (calMonth === 0) { setCalMonth(11); setCalYear(y => y - 1); } else setCalMonth(m => m - 1);
  }
  function nextMonth() {
    if (calMonth === 11) { setCalMonth(0); setCalYear(y => y + 1); } else setCalMonth(m => m + 1);
  }

  function applyQuickRange(type) {
    setMode("range");
    const s = type === "week" ? thisWeekStart : thisMonthStart;
    setRangeStart(s); setRangeEnd(today);
    setCalMonth(new Date().getMonth()); setCalYear(new Date().getFullYear());
    if (onRangeSelect) onRangeSelect(s, today);
  }

  function handleDateTap(ds) {
    if (ds > today) return;
    if (mode === "single") {
      onSelectDate(ds);
      setRangeStart(null); setRangeEnd(null);
    } else {
      if (!rangeStart || (rangeStart && rangeEnd)) {
        setRangeStart(ds); setRangeEnd(null);
        if (onRangeSelect) onRangeSelect(ds, null);
      } else {
        const s = rangeStart <= ds ? rangeStart : ds;
        const e = rangeStart <= ds ? ds : rangeStart;
        setRangeStart(s); setRangeEnd(e);
        if (onRangeSelect) onRangeSelect(s, e);
      }
    }
  }

  const hasRange = mode === "range" && rangeStart && rangeEnd;

  // Range analytics for this staff
  const rangeLogs = useMemo(() => {
    if (hasRange) return logs.filter(l => l.staffId === staffId && l.date >= rangeStart && l.date <= rangeEnd);
    return [];
  }, [logs, staffId, rangeStart, rangeEnd, hasRange]);

  const rangeRevenue = rangeLogs.reduce((s, l) => s + l.amount, 0);
  const rangePresentDays = hasRange
    ? Object.entries(attendance).filter(([d, m]) => d >= rangeStart && d <= rangeEnd && m[staffId]).length
    : 0;
  const rangeDays = hasRange ? Math.round((new Date(rangeEnd) - new Date(rangeStart)) / 86400000) + 1 : 0;

  const blanks = Array(firstDay).fill(null);
  const days = Array.from({ length: daysInMonth }, (_, i) => i + 1);
  const DAY_LABELS = ["Su","Mo","Tu","We","Th","Fr","Sa"];

  const rangeLabel = hasRange
    ? `${formatDate(rangeStart)} – ${formatDate(rangeEnd)}`
    : rangeStart ? `${formatDate(rangeStart)} se…` : "Range chuno";

  return (
    <div style={{ background: "white", borderRadius: 14, border: "0.5px solid #e8e8e0", margin: "0 14px 14px", overflow: "hidden" }}>
      <div style={{ padding: "12px 14px 0" }}>

        {/* Mode + quick shortcuts */}
        <div style={{ display: "flex", gap: 5, marginBottom: 10, flexWrap: "wrap" }}>
          <button onClick={() => { setMode("single"); setRangeStart(null); setRangeEnd(null); }}
            style={{ fontSize: 11, fontWeight: 700, padding: "5px 10px", borderRadius: 8, border: "none", cursor: "pointer", background: mode === "single" ? "#1a1a2e" : "#f1f5f9", color: mode === "single" ? "white" : "#555" }}>
            Ek Din
          </button>
          <button onClick={() => { setMode("range"); setRangeStart(null); setRangeEnd(null); }}
            style={{ fontSize: 11, fontWeight: 700, padding: "5px 10px", borderRadius: 8, border: "none", cursor: "pointer", background: mode === "range" ? "#1a1a2e" : "#f1f5f9", color: mode === "range" ? "white" : "#555" }}>
            Range
          </button>
          <div style={{ width: "0.5px", height: 20, background: "#e2e8f0", margin: "0 2px", alignSelf: "center" }} />
          <button onClick={() => applyQuickRange("week")}
            style={{ fontSize: 11, fontWeight: 700, padding: "5px 10px", borderRadius: 8, border: "none", cursor: "pointer", background: "#f0f9ff", color: "#0369a1" }}>
            Is Hafte
          </button>
          <button onClick={() => applyQuickRange("month")}
            style={{ fontSize: 11, fontWeight: 700, padding: "5px 10px", borderRadius: 8, border: "none", cursor: "pointer", background: "#f0fdf4", color: "#166534" }}>
            Is Mahine
          </button>
        </div>

        {/* Range instruction */}
        {mode === "range" && !rangeEnd && (
          <div style={{ fontSize: 11, color: "#f59e0b", fontWeight: 600, marginBottom: 8, background: "#fffbeb", padding: "5px 10px", borderRadius: 7 }}>
            {rangeStart ? `Start: ${formatDate(rangeStart)} — Ab end date chuno` : "Pehle start date tap karo"}
          </div>
        )}

        {/* Month nav */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 8 }}>
          <button onClick={prevMonth} style={{ border: "none", background: "transparent", fontSize: 18, cursor: "pointer", color: "#1a1a2e", padding: "0 6px" }}>‹</button>
          <div style={{ fontSize: 13, fontWeight: 700, color: "#1a1a2e" }}>{monthLabel}</div>
          <button onClick={nextMonth} style={{ border: "none", background: "transparent", fontSize: 18, cursor: "pointer", color: "#1a1a2e", padding: "0 6px" }}>›</button>
        </div>

        {/* Day labels */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", marginBottom: 4 }}>
          {DAY_LABELS.map(d => (
            <div key={d} style={{ textAlign: "center", fontSize: 10, fontWeight: 700, color: "#9ca3af" }}>{d}</div>
          ))}
        </div>

        {/* Grid */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: 2, marginBottom: 10 }}>
          {blanks.map((_, i) => <div key={"b"+i} />)}
          {days.map(day => {
            const ds = dateStr(day);
            const isToday = ds === today;
            const isSingleSel = mode === "single" && ds === selectedDate;
            const isEdge = ds === rangeStart || ds === rangeEnd;
            const inRange = hasRange && ds >= rangeStart && ds <= rangeEnd;
            const isFuture = ds > today;

            let bg = "transparent";
            if (isSingleSel || isEdge) bg = "#1a1a2e";
            else if (inRange) bg = "#e0e7ff";
            else if (isToday) bg = "#f0f4ff";

            let textColor = "#374151";
            if (isSingleSel || isEdge) textColor = "white";
            else if (inRange) textColor = "#3730a3";
            else if (isToday) textColor = "#2563eb";

            return (
              <div key={day} onClick={() => handleDateTap(ds)}
                style={{ textAlign: "center", padding: "5px 2px 4px", borderRadius: 8, cursor: isFuture ? "default" : "pointer", background: bg, opacity: isFuture ? 0.3 : 1 }}>
                <div style={{ fontSize: 12, fontWeight: (isToday || isSingleSel || isEdge || inRange) ? 700 : 400, color: textColor }}>
                  {day}
                </div>
                <div style={{ display: "flex", justifyContent: "center", gap: 2, marginTop: 2, minHeight: 5 }}>
                  {presentDates.has(ds) && !isSingleSel && !isEdge && <div style={{ width: 4, height: 4, borderRadius: "50%", background: inRange ? "#4f46e5" : "#16a34a" }} />}
                  {logDates.has(ds) && !isSingleSel && !isEdge && <div style={{ width: 4, height: 4, borderRadius: "50%", background: inRange ? "#7c3aed" : "#2563eb" }} />}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Range analytics panel */}
      {hasRange && (
        <div style={{ borderTop: "0.5px solid #e8e8e0" }}>
          <div style={{ background: "#1a1a2e", padding: "8px 14px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <div style={{ fontSize: 12, fontWeight: 700, color: "white" }}>{rangeLabel}</div>
            <div style={{ fontSize: 11, color: "#a0a0c0" }}>{rangeDays} din</div>
          </div>

          {(() => {
            // Compute all dates in range
            const allRangeDates = [];
            let cur = new Date(rangeStart + "T00:00:00");
            const end = new Date(rangeEnd + "T00:00:00");
            while (cur <= end) {
              allRangeDates.push(cur.toISOString().slice(0, 10));
              cur.setDate(cur.getDate() + 1);
            }
            const pDates = allRangeDates.filter(d => attendance[d]?.[staffId]);
            const aDates = allRangeDates.filter(d => !attendance[d]?.[staffId]);
            return (
              <StaffAnalyticsTabs
                rangeLogs={rangeLogs}
                rangeRevenue={rangeRevenue}
                rangePresentDays={rangePresentDays}
                rangeDays={rangeDays}
                showRevenue={showRevenue}
                presentDates={pDates}
                absentDates={aDates}
                absentNotes={absentNotes}
                setAbsentNotes={setAbsentNotes}
              />
            );
          })()}
          <div style={{ height: 8 }} />
        </div>
      )}

      {/* Legend */}
      <div style={{ display: "flex", gap: 12, padding: "8px 14px 12px", justifyContent: "center", borderTop: "0.5px solid #f1f5f9" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 4, fontSize: 10, color: "#6b7280" }}>
          <div style={{ width: 6, height: 6, borderRadius: "50%", background: "#16a34a" }} /> Present
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 4, fontSize: 10, color: "#6b7280" }}>
          <div style={{ width: 6, height: 6, borderRadius: "50%", background: "#2563eb" }} /> Kaam
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 4, fontSize: 10, color: "#6b7280" }}>
          <div style={{ width: 12, height: 8, background: "#e0e7ff", borderRadius: 2 }} /> Range
        </div>
      </div>
    </div>
  );
}

// ─── Edit Staff Modal ─────────────────────────────────────────────────────────
function EditStaffModal({ staff, onSave, onDelete, onClose }) {
  const [name, setName] = useState(staff.name);
  const [role, setRole] = useState(staff.role);
  const [phone, setPhone] = useState(staff.phone);
  const [salary, setSalary] = useState(staff.salary);
  const [pin, setPin] = useState(staff.pin);
  const [confirmDelete, setConfirmDelete] = useState(false);

  function handleSave() {
    if (!name.trim()) { alert("Naam daalo!"); return; }
    onSave({ ...staff, name: name.trim(), role, phone, salary: Number(salary) || 0, pin });
    onClose();
  }

  return (
    <div style={styles.modalBg} onClick={e => e.target === e.currentTarget && onClose()}>
      <div style={styles.modal}>
        <div style={styles.modalTitle}>Staff Edit Karo</div>
        <div style={styles.formRow}>
          <div style={styles.formGroup}>
            <label style={styles.label}>Naam</label>
            <input style={styles.input} value={name} onChange={e => setName(e.target.value)} />
          </div>
          <div style={styles.formGroup}>
            <label style={styles.label}>Role</label>
            <select style={styles.input} value={role} onChange={e => setRole(e.target.value)}>
              {["Hairstylist","Makeup Artist","Nail Artist","Receptionist","Manager"].map(r => <option key={r}>{r}</option>)}
            </select>
          </div>
        </div>
        <div style={styles.formRow}>
          <div style={styles.formGroup}>
            <label style={styles.label}>Phone</label>
            <input style={styles.input} value={phone} onChange={e => setPhone(e.target.value)} />
          </div>
          <div style={styles.formGroup}>
            <label style={styles.label}>Salary (₹/month)</label>
            <input style={styles.input} type="number" value={salary} onChange={e => setSalary(e.target.value)} />
          </div>
        </div>
        <div style={styles.formGroup}>
          <label style={styles.label}>PIN (4 digit)</label>
          <input style={styles.input} type="number" maxLength={4} value={pin} onChange={e => setPin(e.target.value.slice(0,4))} />
        </div>

        <div style={styles.modalActions}>
          <button style={styles.btnCancel} onClick={onClose}>Cancel</button>
          <button style={styles.btnSave} onClick={handleSave}>Save ✓</button>
        </div>

        {/* Delete section */}
        {!confirmDelete
          ? <button onClick={() => setConfirmDelete(true)} style={{ width: "100%", marginTop: 10, padding: 10, border: "1px solid #fecaca", background: "white", borderRadius: 10, fontSize: 13, fontWeight: 700, color: "#dc2626", cursor: "pointer" }}>
              🗑 Staff Remove Karo
            </button>
          : <div style={{ marginTop: 10, background: "#fef2f2", borderRadius: 10, padding: 12 }}>
              <div style={{ fontSize: 13, color: "#dc2626", fontWeight: 600, marginBottom: 10 }}>Confirm? Yeh action undo nahi hoga.</div>
              <div style={{ display: "flex", gap: 8 }}>
                <button onClick={() => setConfirmDelete(false)} style={{ flex: 1, padding: 9, border: "1px solid #e2e8f0", background: "white", borderRadius: 8, fontSize: 13, fontWeight: 600, color: "#666", cursor: "pointer" }}>Cancel</button>
                <button onClick={() => { onDelete(staff.id); onClose(); }} style={{ flex: 1, padding: 9, border: "none", background: "#dc2626", borderRadius: 8, fontSize: 13, fontWeight: 700, color: "white", cursor: "pointer" }}>Haan, Delete Karo</button>
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
          <div style={styles.formGroup}>
            <label style={styles.label}>Client Naam</label>
            <input style={styles.input} value={clientName} onChange={e => setClientName(e.target.value)} />
          </div>
          <div style={styles.formGroup}>
            <label style={styles.label}>Date</label>
            <input style={styles.input} type="date" value={date} onChange={e => setDate(e.target.value)} />
          </div>
        </div>
        <div style={styles.formRow}>
          <div style={styles.formGroup}>
            <label style={styles.label}>Service</label>
            <select style={styles.input} value={service} onChange={e => setService(e.target.value)}>
              {SERVICES.map(s => <option key={s}>{s}</option>)}
            </select>
          </div>
          <div style={styles.formGroup}>
            <label style={styles.label}>Amount (₹)</label>
            <input style={styles.input} type="number" value={amount} onChange={e => setAmount(e.target.value)} />
          </div>
        </div>
        <div style={styles.modalActions}>
          <button style={styles.btnCancel} onClick={onClose}>Cancel</button>
          <button style={styles.btnSave} onClick={handleSave}>Save ✓</button>
        </div>
        {!confirmDelete
          ? <button onClick={() => setConfirmDelete(true)} style={{ width: "100%", marginTop: 10, padding: 10, border: "1px solid #fecaca", background: "white", borderRadius: 10, fontSize: 13, fontWeight: 700, color: "#dc2626", cursor: "pointer" }}>
              🗑 Entry Delete Karo
            </button>
          : <div style={{ marginTop: 10, background: "#fef2f2", borderRadius: 10, padding: 12 }}>
              <div style={{ fontSize: 13, color: "#dc2626", fontWeight: 600, marginBottom: 10 }}>Pakka delete karna hai?</div>
              <div style={{ display: "flex", gap: 8 }}>
                <button onClick={() => setConfirmDelete(false)} style={{ flex: 1, padding: 9, border: "1px solid #e2e8f0", background: "white", borderRadius: 8, fontSize: 13, fontWeight: 600, color: "#666", cursor: "pointer" }}>Cancel</button>
                <button onClick={() => { onDelete(log.id); onClose(); }} style={{ flex: 1, padding: 9, border: "none", background: "#dc2626", borderRadius: 8, fontSize: 13, fontWeight: 700, color: "white", cursor: "pointer" }}>Delete</button>
              </div>
            </div>
        }
      </div>
    </div>
  );
}

// ─── Salary Slip Screen ────────────────────────────────────────────────────────
function SalarySlipScreen({ staff, logs, attendance, onBack }) {
  const [slipMonth, setSlipMonth] = useState(new Date().toISOString().slice(0, 7)); // YYYY-MM

  const monthStart = slipMonth + "-01";
  const monthEnd = (() => {
    const [y, m] = slipMonth.split("-").map(Number);
    return new Date(y, m, 0).toISOString().slice(0, 10);
  })();

  const totalDaysInMonth = (() => {
    const [y, m] = slipMonth.split("-").map(Number);
    return new Date(y, m, 0).getDate();
  })();

  const presentDays = Object.entries(attendance).filter(([d, map]) =>
    d >= monthStart && d <= monthEnd && map[staff.id]
  ).length;

  const absentDays = totalDaysInMonth - presentDays;
  const monthLogs = logs.filter(l => l.staffId === staff.id && l.date >= monthStart && l.date <= monthEnd);
  const totalRevenue = monthLogs.reduce((s, l) => s + l.amount, 0);

  // Per-day salary calculation
  const perDaySalary = staff.salary / totalDaysInMonth;
  const earnedSalary = Math.round(perDaySalary * presentDays);
  const deduction = staff.salary - earnedSalary;

  const c = avatarColor(staff.id);
  const monthLabel = new Date(slipMonth + "-01").toLocaleDateString("en-IN", { month: "long", year: "numeric" });

  return (
    <div style={styles.page}>
      <div style={styles.header}>
        <button onClick={onBack} style={styles.backBtn}>← Back</button>
        <div style={{ textAlign: "center" }}>
          <div style={styles.headerTitle}>Salary Slip</div>
          <div style={styles.headerSub}>{staff.name}</div>
        </div>
        <div style={{ width: 60 }} />
      </div>

      <div style={{ padding: "14px" }}>
        {/* Month picker */}
        <div style={styles.formGroup}>
          <label style={styles.label}>Month select karo</label>
          <input style={styles.input} type="month" value={slipMonth} onChange={e => setSlipMonth(e.target.value)} />
        </div>

        {/* Staff card */}
        <div style={{ background: "white", border: "0.5px solid #e8e8e0", borderRadius: 14, padding: "14px", marginBottom: 14 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 14, paddingBottom: 12, borderBottom: "0.5px solid #f1f5f9" }}>
            <div style={{ ...styles.avatar, width: 48, height: 48, fontSize: 16, background: c.bg, color: c.text }}>{initials(staff.name)}</div>
            <div>
              <div style={{ fontSize: 15, fontWeight: 800, color: "#1a1a2e" }}>{staff.name}</div>
              <div style={{ fontSize: 12, color: "#888" }}>{staff.role} · {staff.phone}</div>
            </div>
          </div>

          {/* Month label */}
          <div style={{ fontSize: 13, fontWeight: 700, color: "#1a1a2e", marginBottom: 12, textAlign: "center" }}>
            {monthLabel} ka Salary Statement
          </div>

          {/* Attendance summary */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 8, marginBottom: 14 }}>
            <div style={{ background: "#f0fdf4", borderRadius: 10, padding: "10px", textAlign: "center" }}>
              <div style={{ fontSize: 22, fontWeight: 800, color: "#16a34a" }}>{presentDays}</div>
              <div style={{ fontSize: 10, color: "#166534", fontWeight: 700 }}>Present</div>
            </div>
            <div style={{ background: "#fef2f2", borderRadius: 10, padding: "10px", textAlign: "center" }}>
              <div style={{ fontSize: 22, fontWeight: 800, color: "#dc2626" }}>{absentDays}</div>
              <div style={{ fontSize: 10, color: "#991b1b", fontWeight: 700 }}>Absent</div>
            </div>
            <div style={{ background: "#f8fafc", borderRadius: 10, padding: "10px", textAlign: "center" }}>
              <div style={{ fontSize: 22, fontWeight: 800, color: "#1a1a2e" }}>{totalDaysInMonth}</div>
              <div style={{ fontSize: 10, color: "#555", fontWeight: 700 }}>Total Din</div>
            </div>
          </div>

          {/* Salary breakdown */}
          <div style={{ background: "#f8fafc", borderRadius: 10, padding: "12px", marginBottom: 12 }}>
            <div style={{ fontSize: 12, fontWeight: 700, color: "#1a1a2e", marginBottom: 10 }}>Salary Breakdown</div>
            {[
              { label: "Fixed Monthly Salary", value: formatCurrency(staff.salary), color: "#1a1a2e" },
              { label: `Per Din Salary (÷${totalDaysInMonth})`, value: formatCurrency(Math.round(perDaySalary)), color: "#555" },
              { label: `Earned (${presentDays} din × ${formatCurrency(Math.round(perDaySalary))})`, value: formatCurrency(earnedSalary), color: "#16a34a" },
              { label: `Deduction (${absentDays} din absent)`, value: `- ${formatCurrency(deduction)}`, color: "#dc2626" },
            ].map(row => (
              <div key={row.label} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "6px 0", borderBottom: "0.5px solid #e8e8e0" }}>
                <div style={{ fontSize: 12, color: "#555" }}>{row.label}</div>
                <div style={{ fontSize: 13, fontWeight: 700, color: row.color }}>{row.value}</div>
              </div>
            ))}
            {/* Net payable */}
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: 10, background: "#1a1a2e", borderRadius: 8, padding: "10px 12px" }}>
              <div style={{ fontSize: 13, fontWeight: 700, color: "white" }}>Net Payable</div>
              <div style={{ fontSize: 18, fontWeight: 800, color: "#4ade80" }}>{formatCurrency(earnedSalary)}</div>
            </div>
          </div>

          {/* Work summary */}
          <div style={{ background: "#f0f9ff", borderRadius: 10, padding: "12px" }}>
            <div style={{ fontSize: 12, fontWeight: 700, color: "#0369a1", marginBottom: 8 }}>Is Mahine ka Kaam</div>
            <div style={{ display: "flex", justifyContent: "space-between" }}>
              <div style={{ fontSize: 13, color: "#555" }}>Total Clients</div>
              <div style={{ fontSize: 13, fontWeight: 700, color: "#1a1a2e" }}>{monthLogs.length}</div>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", marginTop: 4 }}>
              <div style={{ fontSize: 13, color: "#555" }}>Revenue Generated</div>
              <div style={{ fontSize: 13, fontWeight: 700, color: "#16a34a" }}>{formatCurrency(totalRevenue)}</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}


function StaffDetailScreen({ staff, logs, setLogs, attendance, onBack, onAddLog, onEditStaff, onDeleteStaff }) {
  const [tab, setTab] = useState("month");
  const [selectedDate, setSelectedDate] = useState(today);
  const [editingLog, setEditingLog] = useState(null);
  const [showSalarySlip, setShowSalarySlip] = useState(false);
  const [showEditStaff, setShowEditStaff] = useState(false);
  const c = avatarColor(staff.id);

  const filtered = useMemo(() => {
    if (tab === "calendar") return logs.filter(l => l.staffId === staff.id && l.date === selectedDate).sort((a, b) => b.date.localeCompare(a.date));
    const cutoff = tab === "today" ? today : tab === "week" ? thisWeekStart : thisMonthStart;
    return logs.filter(l => l.staffId === staff.id && l.date >= cutoff).sort((a, b) => b.date.localeCompare(a.date));
  }, [logs, tab, staff.id, selectedDate]);

  const totalClients = filtered.length;
  const totalRevenue = filtered.reduce((s, l) => s + l.amount, 0);
  const attendedDays = Object.entries(attendance).filter(([d, m]) => {
    if (tab === "calendar") return d === selectedDate && m[staff.id];
    const cutoff = tab === "today" ? today : tab === "week" ? thisWeekStart : thisMonthStart;
    return d >= cutoff && m[staff.id];
  }).length;

  const historyLabel = tab === "calendar" ? formatDate(selectedDate)
    : tab === "today" ? "Aaj" : tab === "week" ? "Is Hafte" : "Is Mahine";

  function handleEditLog(updated) { setLogs(prev => prev.map(l => l.id === updated.id ? updated : l)); }
  function handleDeleteLog(id) { setLogs(prev => prev.filter(l => l.id !== id)); }

  if (showSalarySlip) {
    return <SalarySlipScreen staff={staff} logs={logs} attendance={attendance} onBack={() => setShowSalarySlip(false)} />;
  }

  return (
    <div style={styles.page}>
      <div style={styles.header}>
        <button onClick={onBack} style={styles.backBtn}>← Back</button>
        <div style={{ textAlign: "center" }}>
          <div style={styles.headerTitle}>{staff.name}</div>
          <div style={styles.headerSub}>{staff.role}</div>
        </div>
        <button onClick={() => setShowEditStaff(true)} style={{ ...styles.backBtn, fontSize: 11, padding: "5px 10px" }}>✏️ Edit</button>
      </div>

      {/* Avatar + Salary Slip button */}
      <div style={{ padding: "14px 14px 0", display: "flex", gap: 14, alignItems: "center" }}>
        <div style={{ ...styles.avatar, width: 56, height: 56, fontSize: 18, background: c.bg, color: c.text }}>{initials(staff.name)}</div>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 13, color: "#888" }}>{staff.phone} · {formatCurrency(staff.salary)}/mo</div>
        </div>
        <button onClick={() => setShowSalarySlip(true)}
          style={{ background: "#f0fdf4", border: "1px solid #bbf7d0", borderRadius: 10, padding: "8px 12px", fontSize: 11, fontWeight: 700, color: "#166534", cursor: "pointer" }}>
          💰 Salary Slip
        </button>
      </div>

      {/* Tabs */}
      <div style={{ padding: "14px 14px 0" }}>
        <div style={{ ...styles.tabRow, gridTemplateColumns: "1fr 1fr 1fr 1fr", display: "grid" }}>
          {[{ key: "today", label: "Aaj" }, { key: "week", label: "Hafte" }, { key: "month", label: "Mahine" }, { key: "calendar", label: "📅" }].map(t => (
            <button key={t.key} style={{ ...styles.tabBtn, ...(tab === t.key ? styles.tabActive : {}) }} onClick={() => setTab(t.key)}>{t.label}</button>
          ))}
        </div>
      </div>

      {tab === "calendar" && (
        <MiniCalendar staffId={staff.id} logs={logs} attendance={attendance} selectedDate={selectedDate} onSelectDate={setSelectedDate} />
      )}

      {/* Summary cards */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 10, padding: "12px 14px 0" }}>
        <div style={styles.statCard}><div style={{ ...styles.statNum, color: "#1a1a2e" }}>{totalClients}</div><div style={styles.statLabel}>Clients</div></div>
        <div style={styles.statCard}><div style={{ ...styles.statNum, color: "#16a34a" }}>{formatCurrency(totalRevenue)}</div><div style={styles.statLabel}>Revenue</div></div>
        <div style={styles.statCard}><div style={{ ...styles.statNum, color: "#2563eb" }}>{attendedDays}d</div><div style={styles.statLabel}>Present</div></div>
      </div>

      {/* Log list — tap any entry to edit */}
      <div style={{ padding: "14px" }}>
        <div style={styles.sectionHeader}>
          <div style={styles.sectionTitle}>{historyLabel} ka kaam</div>
          <button style={styles.addBtn} onClick={onAddLog}>+ Add</button>
        </div>
        {filtered.length === 0
          ? <div style={styles.emptyState}>Koi entry nahi — {historyLabel}</div>
          : filtered.map(log => (
            <div key={log.id} onClick={() => setEditingLog(log)} style={{ ...styles.logCard, cursor: "pointer" }}>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 14, fontWeight: 600, color: "#1a1a2e" }}>{log.clientName}</div>
                <div style={{ fontSize: 12, color: "#888", marginTop: 2 }}>{log.service} · {formatDate(log.date)}</div>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <div style={{ fontSize: 14, fontWeight: 700, color: "#16a34a" }}>{formatCurrency(log.amount)}</div>
                <div style={{ fontSize: 11, color: "#9ca3af" }}>✏️</div>
              </div>
            </div>
          ))
        }
      </div>

      {editingLog && <EditLogModal log={editingLog} onSave={handleEditLog} onDelete={handleDeleteLog} onClose={() => setEditingLog(null)} />}
      {showEditStaff && <EditStaffModal staff={staff} onSave={onEditStaff} onDelete={onDeleteStaff} onClose={() => setShowEditStaff(false)} />}
    </div>
  );
}

// ─── Detail Drawer — bottom sheet ────────────────────────────────────────────
function DetailDrawer({ title, onClose, children }) {
  return (
    <div style={styles.modalBg} onClick={e => e.target === e.currentTarget && onClose()}>
      <div style={{ ...styles.modal, maxHeight: "80vh", overflowY: "auto", paddingBottom: 28 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
          <div style={{ fontSize: 15, fontWeight: 700, color: "#1a1a2e" }}>{title}</div>
          <button onClick={onClose} style={{ border: "none", background: "#f1f5f9", borderRadius: 8, padding: "4px 10px", fontSize: 13, cursor: "pointer", color: "#555", fontWeight: 700 }}>✕</button>
        </div>
        {children}
      </div>
    </div>
  );
}

// ─── Owner Analytics Tabs — Attendance | Work ────────────────────────────────
function OwnerAnalyticsTabs({ staffBreakdown, rangeLogs, totalRevenue, rangeDays, hasRange, selectedDate, attendance, rangeStart, rangeEnd, absentNotes, setAbsentNotes }) {
  const [activeTab, setActiveTab] = useState("attendance");
  const [drawer, setDrawer] = useState(null); // { type: "present"|"absent"|"work", staffId, staffName }

  const sortedByAtt  = [...staffBreakdown].sort((a, b) => b.presentDays - a.presentDays);
  const sortedByWork = [...staffBreakdown].sort((a, b) => b.revenue - a.revenue);

  // Get all dates in range
  function getDatesInRange() {
    if (!hasRange || !rangeStart || !rangeEnd) return [selectedDate];
    const dates = [];
    let cur = new Date(rangeStart + "T00:00:00");
    const end = new Date(rangeEnd + "T00:00:00");
    while (cur <= end) {
      dates.push(cur.toISOString().slice(0, 10));
      cur.setDate(cur.getDate() + 1);
    }
    return dates;
  }

  const allDates = getDatesInRange();

  function getPresentDates(staffId) {
    return allDates.filter(d => attendance[d]?.[staffId]);
  }
  function getAbsentDates(staffId) {
    return allDates.filter(d => !attendance[d]?.[staffId]);
  }

  function noteKey(staffId, date) { return `${staffId}_${date}`; }

  return (
    <div>
      {/* Tab bar */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", margin: "12px 14px 0", background: "#f1f5f9", borderRadius: 10, padding: 3 }}>
        <button onClick={() => setActiveTab("attendance")}
          style={{ padding: "8px 0", border: "none", borderRadius: 8, fontSize: 13, fontWeight: 700, cursor: "pointer",
            background: activeTab === "attendance" ? "#1a1a2e" : "transparent",
            color: activeTab === "attendance" ? "white" : "#888" }}>Attendance</button>
        <button onClick={() => setActiveTab("work")}
          style={{ padding: "8px 0", border: "none", borderRadius: 8, fontSize: 13, fontWeight: 700, cursor: "pointer",
            background: activeTab === "work" ? "#1a1a2e" : "transparent",
            color: activeTab === "work" ? "white" : "#888" }}>Work Log</button>
      </div>

      {/* ── ATTENDANCE TAB ── */}
      {activeTab === "attendance" && (
        <div style={{ padding: "14px 14px 0" }}>
          {sortedByAtt.map((s, i) => {
            const c = avatarColor(s.id);
            const absentDays = rangeDays - s.presentDays;
            const isHighest = i === 0 && s.presentDays > 0;
            const isLowest = i === sortedByAtt.length - 1 && sortedByAtt.length > 1 && s.presentDays < sortedByAtt[0].presentDays;
            return (
              <div key={s.id} style={{ background: "white", border: "0.5px solid #e8e8e0", borderRadius: 12, padding: "12px 14px", marginBottom: 10 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 10 }}>
                  <div style={{ ...styles.avatar, width: 34, height: 34, fontSize: 11, background: c.bg, color: c.text, flexShrink: 0 }}>{initials(s.name)}</div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 13, fontWeight: 700, color: "#1a1a2e", display: "flex", alignItems: "center", gap: 5 }}>
                      {s.name}
                      {isHighest && <span style={{ fontSize: 9, background: "#d1fae5", color: "#065f46", borderRadius: 4, padding: "1px 6px", fontWeight: 700 }}>↑ Highest</span>}
                      {isLowest && <span style={{ fontSize: 9, background: "#fee2e2", color: "#991b1b", borderRadius: 4, padding: "1px 6px", fontWeight: 700 }}>↓ Lowest</span>}
                    </div>
                    <div style={{ fontSize: 11, color: "#888", marginTop: 1 }}>{s.role}</div>
                  </div>
                </div>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
                  {/* CLICKABLE Present box */}
                  <div
                    onClick={() => setDrawer({ type: "present", staffId: s.id, staffName: s.name })}
                    style={{ background: "#f0fdf4", borderRadius: 8, padding: "8px 10px", textAlign: "center", cursor: "pointer", border: "0.5px solid #bbf7d0" }}>
                    <div style={{ fontSize: 20, fontWeight: 800, color: "#16a34a" }}>{s.presentDays}</div>
                    <div style={{ fontSize: 10, color: "#166534", fontWeight: 600, marginTop: 1 }}>Present din</div>
                    <div style={{ fontSize: 9, color: "#16a34a", marginTop: 2 }}>tap for dates →</div>
                  </div>
                  {/* CLICKABLE Absent box */}
                  <div
                    onClick={() => setDrawer({ type: "absent", staffId: s.id, staffName: s.name })}
                    style={{ background: "#fef2f2", borderRadius: 8, padding: "8px 10px", textAlign: "center", cursor: "pointer", border: "0.5px solid #fecaca" }}>
                    <div style={{ fontSize: 20, fontWeight: 800, color: "#dc2626" }}>{absentDays}</div>
                    <div style={{ fontSize: 10, color: "#991b1b", fontWeight: 600, marginTop: 1 }}>Absent din</div>
                    <div style={{ fontSize: 9, color: "#dc2626", marginTop: 2 }}>tap for reason →</div>
                  </div>
                </div>
                {hasRange && <div style={{ fontSize: 11, color: "#888", textAlign: "center", marginTop: 8 }}>{s.presentDays} / {rangeDays} din present</div>}
              </div>
            );
          })}
        </div>
      )}

      {/* ── WORK TAB ── */}
      {activeTab === "work" && (
        <div style={{ padding: "14px 14px 0" }}>
          <div style={{ background: "#f0fdf4", border: "0.5px solid #bbf7d0", borderRadius: 10, padding: "10px 14px", marginBottom: 12, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <div style={{ fontSize: 12, color: "#166534", fontWeight: 600 }}>Total Revenue</div>
            <div style={{ fontSize: 18, fontWeight: 800, color: "#16a34a" }}>{formatCurrency(totalRevenue)}</div>
          </div>
          {sortedByWork.map((s, i) => {
            const c = avatarColor(s.id);
            const revPct = totalRevenue > 0 ? Math.round((s.revenue / totalRevenue) * 100) : 0;
            return (
              <div
                key={s.id}
                onClick={() => setDrawer({ type: "work", staffId: s.id, staffName: s.name })}
                style={{ background: "white", border: "0.5px solid #e8e8e0", borderRadius: 12, padding: "12px 14px", marginBottom: 10, cursor: "pointer" }}>
                <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 10 }}>
                  <div style={{ ...styles.avatar, width: 34, height: 34, fontSize: 11, background: c.bg, color: c.text, flexShrink: 0 }}>{initials(s.name)}</div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 13, fontWeight: 700, color: "#1a1a2e", display: "flex", alignItems: "center", gap: 5 }}>
                      {s.name}
                      {i === 0 && s.clients > 0 && <span style={{ fontSize: 9, background: "#fef3c7", color: "#92400e", borderRadius: 4, padding: "1px 6px", fontWeight: 700 }}>⭐ Top</span>}
                    </div>
                    <div style={{ fontSize: 11, color: "#888", marginTop: 1 }}>{s.role}</div>
                  </div>
                  <div style={{ fontSize: 16, fontWeight: 800, color: "#16a34a" }}>{formatCurrency(s.revenue)}</div>
                </div>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
                  <div style={{ background: "#f8fafc", borderRadius: 8, padding: "7px 10px", textAlign: "center" }}>
                    <div style={{ fontSize: 18, fontWeight: 800, color: "#1a1a2e" }}>{s.clients}</div>
                    <div style={{ fontSize: 10, color: "#555", fontWeight: 600, marginTop: 1 }}>Clients</div>
                  </div>
                  <div style={{ background: "#f8fafc", borderRadius: 8, padding: "7px 10px", textAlign: "center" }}>
                    <div style={{ fontSize: 14, fontWeight: 800, color: "#2563eb" }}>{revPct}%</div>
                    <div style={{ fontSize: 10, color: "#555", fontWeight: 600, marginTop: 1 }}>Revenue share</div>
                  </div>
                </div>
                <div style={{ fontSize: 10, color: "#2563eb", textAlign: "center", marginTop: 6 }}>tap for client details →</div>
              </div>
            );
          })}
          {rangeLogs.length === 0 && <div style={styles.emptyState}>Is period mein koi work entry nahi</div>}
        </div>
      )}

      {/* ── DRAWERS ── */}
      {drawer?.type === "present" && (() => {
        const dates = getPresentDates(drawer.staffId);
        return (
          <DetailDrawer title={`${drawer.staffName} — Present Dates`} onClose={() => setDrawer(null)}>
            {dates.length === 0
              ? <div style={styles.emptyState}>Koi present day nahi is range mein</div>
              : dates.map(d => (
                <div key={d} style={{ display: "flex", alignItems: "center", gap: 10, padding: "9px 0", borderBottom: "0.5px solid #f1f5f9" }}>
                  <div style={{ width: 8, height: 8, borderRadius: "50%", background: "#16a34a", flexShrink: 0 }} />
                  <div style={{ fontSize: 13, fontWeight: 600, color: "#1a1a2e" }}>{formatDate(d)}</div>
                  <div style={{ fontSize: 11, color: "#16a34a", marginLeft: "auto", fontWeight: 700 }}>✓ Present</div>
                </div>
              ))
            }
          </DetailDrawer>
        );
      })()}

      {drawer?.type === "absent" && (() => {
        const dates = getAbsentDates(drawer.staffId);
        return (
          <DetailDrawer title={`${drawer.staffName} — Absent Dates`} onClose={() => setDrawer(null)}>
            {/* Owner-only note label */}
            <div style={{ background: "#fef3c7", borderRadius: 8, padding: "7px 10px", marginBottom: 12, display: "flex", alignItems: "center", gap: 6 }}>
              <div style={{ fontSize: 11, color: "#92400e", fontWeight: 700 }}>🔒 Sirf Owner ka Internal Note — Staff ko nahi dikhega</div>
            </div>
            {dates.length === 0
              ? <div style={styles.emptyState}>Is range mein koi absent day nahi!</div>
              : dates.map(d => {
                const key = noteKey(drawer.staffId, d);
                return (
                  <div key={d} style={{ padding: "10px 0", borderBottom: "0.5px solid #f1f5f9" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6 }}>
                      <div style={{ width: 8, height: 8, borderRadius: "50%", background: "#dc2626", flexShrink: 0 }} />
                      <div style={{ fontSize: 13, fontWeight: 600, color: "#1a1a2e" }}>{formatDate(d)}</div>
                      <div style={{ fontSize: 11, color: "#dc2626", marginLeft: "auto", fontWeight: 700 }}>✗ Absent</div>
                    </div>
                    <input
                      style={{ ...styles.input, fontSize: 12, padding: "7px 10px", background: "#fffbeb", border: "0.5px solid #fcd34d" }}
                      placeholder="Internal note daalo (sirf owner dekhega)..."
                      value={absentNotes[key] || ""}
                      onChange={e => setAbsentNotes(prev => ({ ...prev, [key]: e.target.value }))}
                    />
                  </div>
                );
              })
            }
          </DetailDrawer>
        );
      })()}

      {drawer?.type === "work" && (() => {
        const staffLogs = rangeLogs.filter(l => l.staffId === drawer.staffId).sort((a, b) => b.date.localeCompare(a.date));
        const staffRevenue = staffLogs.reduce((s, l) => s + l.amount, 0);
        return (
          <DetailDrawer title={`${drawer.staffName} — Client Details`} onClose={() => setDrawer(null)}>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, marginBottom: 14 }}>
              <div style={styles.statCard}>
                <div style={{ ...styles.statNum, color: "#1a1a2e", fontSize: 18 }}>{staffLogs.length}</div>
                <div style={styles.statLabel}>Clients</div>
              </div>
              <div style={styles.statCard}>
                <div style={{ ...styles.statNum, color: "#16a34a", fontSize: 16 }}>{formatCurrency(staffRevenue)}</div>
                <div style={styles.statLabel}>Revenue</div>
              </div>
            </div>
            {staffLogs.length === 0
              ? <div style={styles.emptyState}>Koi work entry nahi</div>
              : staffLogs.map(log => (
                <div key={log.id} style={{ background: "#f8fafc", borderRadius: 10, padding: "10px 12px", marginBottom: 8 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                    <div style={{ fontSize: 13, fontWeight: 700, color: "#1a1a2e" }}>{log.clientName}</div>
                    <div style={{ fontSize: 14, fontWeight: 800, color: "#16a34a" }}>{formatCurrency(log.amount)}</div>
                  </div>
                  <div style={{ display: "flex", gap: 8, marginTop: 5 }}>
                    <span style={{ fontSize: 11, background: "#e0e7ff", color: "#3730a3", borderRadius: 5, padding: "2px 7px", fontWeight: 600 }}>{log.service}</span>
                    <span style={{ fontSize: 11, color: "#888" }}>{formatDate(log.date)}</span>
                  </div>
                </div>
              ))
            }
          </DetailDrawer>
        );
      })()}
    </div>
  );
}

// ─── Owner Calendar — range selection + analytics ────────────────────────────
function OwnerCalendar({ logs, attendance, staffList, selectedDate, onSelectDate, absentNotes, setAbsentNotes }) {
  const [calYear, setCalYear] = useState(new Date().getFullYear());
  const [calMonth, setCalMonth] = useState(new Date().getMonth());
  const [rangeStart, setRangeStart] = useState(null);
  const [rangeEnd, setRangeEnd] = useState(null);
  const [mode, setMode] = useState("single"); // "single" | "range"

  const firstDay = new Date(calYear, calMonth, 1).getDay();
  const daysInMonth = new Date(calYear, calMonth + 1, 0).getDate();
  const monthLabel = new Date(calYear, calMonth).toLocaleDateString("en-IN", { month: "long", year: "numeric" });

  function dateStr(day) {
    return `${calYear}-${String(calMonth + 1).padStart(2,"0")}-${String(day).padStart(2,"0")}`;
  }

  function prevMonth() {
    if (calMonth === 0) { setCalMonth(11); setCalYear(y => y - 1); }
    else setCalMonth(m => m - 1);
  }
  function nextMonth() {
    if (calMonth === 11) { setCalMonth(0); setCalYear(y => y + 1); }
    else setCalMonth(m => m + 1);
  }

  function handleDateTap(ds) {
    if (ds > today) return;
    if (mode === "single") {
      onSelectDate(ds);
      setRangeStart(null); setRangeEnd(null);
    } else {
      // range mode: first tap = start, second tap = end
      if (!rangeStart || (rangeStart && rangeEnd)) {
        setRangeStart(ds); setRangeEnd(null);
      } else {
        const s = rangeStart <= ds ? rangeStart : ds;
        const e = rangeStart <= ds ? ds : rangeStart;
        setRangeStart(s); setRangeEnd(e);
      }
    }
  }

  function applyQuickRange(type) {
    setMode("range");
    if (type === "week") {
      setRangeStart(thisWeekStart); setRangeEnd(today);
    } else {
      setRangeStart(thisMonthStart); setRangeEnd(today);
    }
    // Navigate calendar to current month
    setCalMonth(new Date().getMonth());
    setCalYear(new Date().getFullYear());
  }

  // Analytics for selected range or single date
  const analyticsStart = mode === "range" && rangeStart ? rangeStart : (mode === "range" ? null : selectedDate);
  const analyticsEnd   = mode === "range" && rangeEnd   ? rangeEnd   : (mode === "range" ? null : selectedDate);
  const hasRange = mode === "range" && rangeStart && rangeEnd;
  const hasSingle = mode === "single";

  const rangeLogs = useMemo(() => {
    if (hasRange) return logs.filter(l => l.date >= analyticsStart && l.date <= analyticsEnd);
    if (hasSingle) return logs.filter(l => l.date === selectedDate);
    return [];
  }, [logs, analyticsStart, analyticsEnd, hasRange, hasSingle, selectedDate]);

  const totalRevenue = rangeLogs.reduce((s, l) => s + l.amount, 0);

  // Days in range count — must be before staffBreakdown
  const rangeDays = hasRange
    ? Math.round((new Date(analyticsEnd) - new Date(analyticsStart)) / 86400000) + 1
    : 1;

  // Per-staff breakdown — revenue + attendance both
  const staffBreakdown = staffList.map(s => {
    const sLogs = rangeLogs.filter(l => l.staffId === s.id);
    const presentDays = hasRange
      ? Object.entries(attendance).filter(([d, m]) => d >= analyticsStart && d <= analyticsEnd && m[s.id]).length
      : (attendance[selectedDate]?.[s.id] ? 1 : 0);
    const attendancePct = rangeDays > 0 ? Math.round((presentDays / rangeDays) * 100) : 0;
    return { ...s, clients: sLogs.length, revenue: sLogs.reduce((a, l) => a + l.amount, 0), presentDays, attendancePct };
  }).sort((a, b) => b.presentDays - a.presentDays || b.revenue - a.revenue);

  const maxPresentDays = Math.max(...staffBreakdown.map(s => s.presentDays), 1);
  const totalPresentSlots = staffBreakdown.reduce((a, s) => a + s.presentDays, 0);

  const blanks = Array(firstDay).fill(null);
  const days = Array.from({ length: daysInMonth }, (_, i) => i + 1);
  const DAY_LABELS = ["Su","Mo","Tu","We","Th","Fr","Sa"];

  function isInRange(ds) {
    if (!hasRange) return false;
    return ds >= rangeStart && ds <= rangeEnd;
  }
  function isRangeEdge(ds) {
    return ds === rangeStart || ds === rangeEnd;
  }

  const rangeLabel = hasRange
    ? `${formatDate(rangeStart)} – ${formatDate(rangeEnd)} (${rangeDays} din)`
    : mode === "single" ? formatDate(selectedDate) : (rangeStart ? `${formatDate(rangeStart)} se…` : "Date chuno");

  return (
    <div style={{ background: "white", borderBottom: "0.5px solid #e8e8e0" }}>
      <div style={{ padding: "12px 14px 0" }}>

        {/* Mode toggle + quick range buttons */}
        <div style={{ display: "flex", gap: 6, marginBottom: 12, alignItems: "center" }}>
          <button
            onClick={() => { setMode("single"); setRangeStart(null); setRangeEnd(null); }}
            style={{ fontSize: 11, fontWeight: 700, padding: "5px 10px", borderRadius: 8, border: "none", cursor: "pointer", background: mode === "single" ? "#1a1a2e" : "#f1f5f9", color: mode === "single" ? "white" : "#555" }}
          >Ek Din</button>
          <button
            onClick={() => { setMode("range"); setRangeStart(null); setRangeEnd(null); }}
            style={{ fontSize: 11, fontWeight: 700, padding: "5px 10px", borderRadius: 8, border: "none", cursor: "pointer", background: mode === "range" ? "#1a1a2e" : "#f1f5f9", color: mode === "range" ? "white" : "#555" }}
          >Range</button>
          <div style={{ width: "0.5px", height: 20, background: "#e2e8f0", margin: "0 2px" }} />
          <button onClick={() => applyQuickRange("week")} style={{ fontSize: 11, fontWeight: 700, padding: "5px 10px", borderRadius: 8, border: "none", cursor: "pointer", background: "#f0f9ff", color: "#0369a1" }}>Is Hafte</button>
          <button onClick={() => applyQuickRange("month")} style={{ fontSize: 11, fontWeight: 700, padding: "5px 10px", borderRadius: 8, border: "none", cursor: "pointer", background: "#f0fdf4", color: "#166534" }}>Is Mahine</button>
        </div>

        {/* Range instruction */}
        {mode === "range" && !rangeEnd && (
          <div style={{ fontSize: 11, color: "#f59e0b", fontWeight: 600, marginBottom: 8, background: "#fffbeb", padding: "5px 10px", borderRadius: 7 }}>
            {rangeStart ? `Start: ${formatDate(rangeStart)} — Ab end date chuno` : "Pehle start date tap karo"}
          </div>
        )}

        {/* Month nav */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 8 }}>
          <button onClick={prevMonth} style={{ border: "none", background: "transparent", fontSize: 20, cursor: "pointer", color: "#1a1a2e", padding: "0 8px" }}>‹</button>
          <div style={{ fontSize: 13, fontWeight: 700, color: "#1a1a2e" }}>{monthLabel}</div>
          <button onClick={nextMonth} style={{ border: "none", background: "transparent", fontSize: 20, cursor: "pointer", color: "#1a1a2e", padding: "0 8px" }}>›</button>
        </div>

        {/* Day labels */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", marginBottom: 4 }}>
          {DAY_LABELS.map(d => (
            <div key={d} style={{ textAlign: "center", fontSize: 10, fontWeight: 700, color: "#9ca3af" }}>{d}</div>
          ))}
        </div>

        {/* Calendar grid */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: 2, marginBottom: 10 }}>
          {blanks.map((_, i) => <div key={"b"+i} />)}
          {days.map(day => {
            const ds = dateStr(day);
            const isToday = ds === today;
            const isSingleSelected = mode === "single" && ds === selectedDate;
            const inRange = isInRange(ds);
            const isEdge = isRangeEdge(ds);
            const isFuture = ds > today;
            const presentCount = Object.values(attendance[ds] || {}).filter(Boolean).length;
            const logCount = logs.filter(l => l.date === ds).length;

            let bg = "transparent";
            if (isSingleSelected || isEdge) bg = "#1a1a2e";
            else if (inRange) bg = "#e0e7ff";
            else if (isToday) bg = "#f0f4ff";

            let textColor = "#374151";
            if (isSingleSelected || isEdge) textColor = "white";
            else if (isToday) textColor = "#2563eb";
            else if (inRange) textColor = "#3730a3";

            return (
              <div
                key={day}
                onClick={() => handleDateTap(ds)}
                style={{ textAlign: "center", padding: "5px 2px 4px", borderRadius: 8, cursor: isFuture ? "default" : "pointer", background: bg, opacity: isFuture ? 0.3 : 1 }}
              >
                <div style={{ fontSize: 12, fontWeight: (isToday || isSingleSelected || isEdge || inRange) ? 700 : 400, color: textColor }}>
                  {day}
                </div>
                <div style={{ display: "flex", justifyContent: "center", gap: 1, marginTop: 2, minHeight: 5 }}>
                  {presentCount > 0 && !isSingleSelected && !isEdge && <div style={{ width: 4, height: 4, borderRadius: "50%", background: inRange ? "#4f46e5" : "#16a34a" }} />}
                  {logCount > 0 && !isSingleSelected && !isEdge && <div style={{ width: 4, height: 4, borderRadius: "50%", background: inRange ? "#7c3aed" : "#2563eb" }} />}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Analytics panel */}
      {(hasSingle || hasRange) && (
        <div style={{ borderTop: "0.5px solid #e8e8e0" }}>
          {/* Header bar */}
          <div style={{ background: "#1a1a2e", padding: "8px 14px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <div style={{ fontSize: 12, fontWeight: 700, color: "white" }}>{rangeLabel}</div>
            <div style={{ fontSize: 11, color: "#a0a0c0" }}>{rangeDays} din</div>
          </div>

          {/* Tab switcher — Attendance vs Work */}
          <OwnerAnalyticsTabs
            staffBreakdown={staffBreakdown}
            rangeLogs={rangeLogs}
            totalRevenue={totalRevenue}
            rangeDays={rangeDays}
            hasRange={hasRange}
            selectedDate={selectedDate}
            attendance={attendance}
            rangeStart={analyticsStart}
            rangeEnd={analyticsEnd}
            absentNotes={absentNotes}
            setAbsentNotes={setAbsentNotes}
          />

          {rangeLogs.length === 0 && staffBreakdown.every(s => s.presentDays === 0) && (
            <div style={styles.emptyState}>Is period mein koi data nahi</div>
          )}
          <div style={{ height: 14 }} />
        </div>
      )}

      {/* Legend */}
      <div style={{ display: "flex", gap: 14, padding: "8px 14px 12px", justifyContent: "center", borderTop: "0.5px solid #f1f5f9" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 4, fontSize: 10, color: "#6b7280" }}>
          <div style={{ width: 6, height: 6, borderRadius: "50%", background: "#16a34a" }} /> Present
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 4, fontSize: 10, color: "#6b7280" }}>
          <div style={{ width: 6, height: 6, borderRadius: "50%", background: "#2563eb" }} /> Services
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 4, fontSize: 10, color: "#6b7280" }}>
          <div style={{ width: 12, height: 8, background: "#e0e7ff", borderRadius: 2 }} /> Range
        </div>
      </div>
    </div>
  );
}

// ─── OWNER DASHBOARD ──────────────────────────────────────────────────────────
function OwnerDashboard({ staffList, setStaffList, logs, setLogs, attendance, setAttendance, showRevenueToStaff, setShowRevenueToStaff, absentNotes, setAbsentNotes }) {
  const [view, setView] = useState("list"); // list | detail
  const [selectedStaff, setSelectedStaff] = useState(null);
  const [showAddStaff, setShowAddStaff] = useState(false);
  const [showAddLog, setShowAddLog] = useState(false);
  const [logForStaff, setLogForStaff] = useState(null);
  const [nextId, setNextId] = useState(5);
  const [nextLogId, setNextLogId] = useState(11);
  const [showCalendar, setShowCalendar] = useState(false);
  const [ownerSelectedDate, setOwnerSelectedDate] = useState(today);

  function toggleAttendance(staffId) {
    setAttendance(prev => {
      const dateMap = { ...(prev[ownerSelectedDate] || {}) };
      dateMap[staffId] = !dateMap[staffId];
      return { ...prev, [ownerSelectedDate]: dateMap };
    });
  }

  function addStaff(data) {
    setStaffList(prev => [...prev, { ...data, id: nextId }]);
    setNextId(n => n + 1);
  }

  function addLog(data) {
    setLogs(prev => [...prev, { ...data, id: nextLogId }]);
    setNextLogId(n => n + 1);
  }

  const viewDate = ownerSelectedDate;
  const viewAtt = attendance[viewDate] || {};
  const todayAtt = attendance[today] || {};
  const presentCount = staffList.filter(s => viewAtt[s.id]).length;
  const absentCount = staffList.length - presentCount;
  const viewServices = logs.filter(l => l.date === viewDate).length;
  const viewRevenue = logs.filter(l => l.date === viewDate).reduce((s, l) => s + l.amount, 0);
  const isViewingToday = viewDate === today;
  const viewLabel = isViewingToday ? "Aaj" : formatDate(viewDate);

  if (view === "detail" && selectedStaff) {
    return (
      <>
        <StaffDetailScreen
          staff={selectedStaff}
          logs={logs}
          setLogs={setLogs}
          attendance={attendance}
          onBack={() => setView("list")}
          onAddLog={() => { setLogForStaff(selectedStaff.id); setShowAddLog(true); }}
          onEditStaff={updated => setStaffList(prev => prev.map(s => s.id === updated.id ? updated : s))}
          onDeleteStaff={id => { setStaffList(prev => prev.filter(s => s.id !== id)); setView("list"); }}
        />
        {showAddLog && (
          <WorkLogModal
            staffList={staffList}
            preselectedStaffId={logForStaff}
            onSave={addLog}
            onClose={() => setShowAddLog(false)}
          />
        )}
      </>
    );
  }

  return (
    <div style={styles.page}>
      <div style={styles.header}>
        <div>
          <div style={styles.headerTitle}>Staff Management</div>
          <div style={styles.headerSub}>Owner View</div>
        </div>
        <div style={{ display: "flex", gap: 8 }}>
          <button
            style={{ ...styles.addBtn, background: showCalendar ? "#e2e8f0" : "#1a1a2e", color: showCalendar ? "#1a1a2e" : "white" }}
            onClick={() => setShowCalendar(v => !v)}
          >
            📅
          </button>
          <button style={styles.addBtn} onClick={() => { setLogForStaff(null); setShowAddLog(true); }}>+ Log Entry</button>
        </div>
      </div>

      {/* Revenue visibility toggle — owner ka control */}
      <div style={{ background: showRevenueToStaff ? "#f0fdf4" : "#fef2f2", borderBottom: "0.5px solid #e8e8e0", padding: "10px 14px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <div>
          <div style={{ fontSize: 13, fontWeight: 700, color: "#1a1a2e" }}>Staff ko Sales amount dikhao?</div>
          <div style={{ fontSize: 11, color: "#888", marginTop: 1 }}>
            {showRevenueToStaff ? "Staff apni earnings dekh sakta hai" : "Staff ko ₹ amounts hidden hain"}
          </div>
        </div>
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 3, flexShrink: 0 }}>
          <div
            style={{ width: 52, height: 26, borderRadius: 13, background: showRevenueToStaff ? "#16a34a" : "#d1d5db", position: "relative", cursor: "pointer", transition: "background 0.2s" }}
            onClick={() => setShowRevenueToStaff(v => !v)}
          >
            <div style={{ width: 20, height: 20, borderRadius: "50%", background: "white", position: "absolute", top: 3, left: showRevenueToStaff ? 29 : 3, transition: "left 0.2s", boxShadow: "0 1px 3px rgba(0,0,0,0.2)" }} />
          </div>
          <span style={{ fontSize: 10, fontWeight: 700, color: showRevenueToStaff ? "#16a34a" : "#9ca3af" }}>{showRevenueToStaff ? "ON" : "OFF"}</span>
        </div>
      </div>

      {/* Owner Calendar — all staff dots */}
      {showCalendar && (
        <OwnerCalendar
          logs={logs}
          attendance={attendance}
          staffList={staffList}
          selectedDate={ownerSelectedDate}
          onSelectDate={d => { setOwnerSelectedDate(d); }}
          absentNotes={absentNotes}
          setAbsentNotes={setAbsentNotes}
        />
      )}

      {/* Date banner — only show when calendar closed AND viewing a past date */}
      {!showCalendar && !isViewingToday && (
        <div style={{ background: "#fef3c7", padding: "8px 14px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div style={{ fontSize: 12, fontWeight: 700, color: "#92400e" }}>📅 {formatDate(viewDate)} ka data dekh rahe ho</div>
          <button onClick={() => setOwnerSelectedDate(today)} style={{ fontSize: 11, color: "#92400e", background: "transparent", border: "1px solid #f59e0b", borderRadius: 6, padding: "3px 8px", cursor: "pointer" }}>Aaj pe wapas</button>
        </div>
      )}

      {/* Stats */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr 1fr", gap: 8, padding: "14px 14px 0" }}>
        <div style={styles.statCard}><div style={{ ...styles.statNum, color: "#16a34a" }}>{presentCount}</div><div style={styles.statLabel}>Present</div></div>
        <div style={styles.statCard}><div style={{ ...styles.statNum, color: "#dc2626" }}>{absentCount}</div><div style={styles.statLabel}>Absent</div></div>
        <div style={styles.statCard}><div style={{ ...styles.statNum, color: "#1a1a2e" }}>{viewServices}</div><div style={styles.statLabel}>Services</div></div>
        <div style={styles.statCard}><div style={{ ...styles.statNum, color: "#2563eb", fontSize: 14 }}>{formatCurrency(viewRevenue)}</div><div style={styles.statLabel}>Revenue</div></div>
      </div>

      {/* Staff list */}
      <div style={{ padding: "14px" }}>
        <div style={styles.sectionHeader}>
          <div style={styles.sectionTitle}>{viewLabel} ka Staff</div>
          <button style={styles.addBtn} onClick={() => setShowAddStaff(true)}>+ Add Staff</button>
        </div>

        {staffList.map(s => {
          const c = avatarColor(s.id);
          const isPresent = !!viewAtt[s.id];
          const staffLogs = logs.filter(l => l.staffId === s.id && l.date === viewDate);
          return (
            <div key={s.id} style={styles.staffCard}>
              <div style={{ ...styles.avatar, background: c.bg, color: c.text }}>{initials(s.name)}</div>
              <div style={{ flex: 1, minWidth: 0, cursor: "pointer" }} onClick={() => { setSelectedStaff(s); setView("detail"); }}>
                <div style={{ fontSize: 14, fontWeight: 600, color: "#1a1a2e" }}>{s.name}</div>
                <div style={{ fontSize: 12, color: "#888", marginTop: 1 }}>{s.role}</div>
                {isPresent
                  ? <div style={{ fontSize: 11, color: "#2563eb", marginTop: 3 }}>
                      {staffLogs.length} clients · {formatCurrency(staffLogs.reduce((a, l) => a + l.amount, 0))} · <span style={{ color: "#2563eb", textDecoration: "underline" }}>Detail dekho →</span>
                    </div>
                  : <div style={{ fontSize: 11, color: "#9ca3af", marginTop: 3 }}>Absent {viewLabel === "Aaj" ? "today" : formatDate(viewDate)}</div>
                }
              </div>
              <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 3, flexShrink: 0 }}>
                <div
                  style={{ width: 52, height: 26, borderRadius: 13, background: isPresent ? "#16a34a" : "#d1d5db", position: "relative", cursor: "pointer", transition: "background 0.2s" }}
                  onClick={() => toggleAttendance(s.id)}
                >
                  <div style={{ width: 20, height: 20, borderRadius: "50%", background: "white", position: "absolute", top: 3, left: isPresent ? 29 : 3, transition: "left 0.2s", boxShadow: "0 1px 3px rgba(0,0,0,0.2)" }} />
                </div>
                <span style={{ fontSize: 10, fontWeight: 700, color: isPresent ? "#16a34a" : "#9ca3af" }}>{isPresent ? "Present" : "Absent"}</span>
              </div>
            </div>
          );
        })}
      </div>

      {showAddStaff && <AddStaffModal onSave={addStaff} onClose={() => setShowAddStaff(false)} />}
      {showAddLog && (
        <WorkLogModal
          staffList={staffList.filter(s => viewAtt[s.id])}
          preselectedStaffId={logForStaff}
          onSave={addLog}
          onClose={() => setShowAddLog(false)}
        />
      )}
    </div>
  );
}

// ─── STAFF LOGIN ───────────────────────────────────────────────────────────────
function StaffLogin({ staffList, onLogin }) {
  const [selectedId, setSelectedId] = useState(staffList[0]?.id || "");
  const [pin, setPin] = useState("");
  const [error, setError] = useState("");

  function handleLogin() {
    const staff = staffList.find(s => s.id === Number(selectedId));
    if (staff && staff.pin === pin) {
      onLogin(staff);
    } else {
      setError("PIN galat hai! Dobara try karo.");
      setPin("");
    }
  }

  return (
    <div style={{ ...styles.page, display: "flex", flexDirection: "column", justifyContent: "center", alignItems: "center", padding: 24, background: "#1a1a2e", minHeight: "100vh" }}>
      <div style={{ fontSize: 28, fontWeight: 800, color: "white", marginBottom: 4 }}>✂️ SnipBook</div>
      <div style={{ fontSize: 14, color: "#a0a0c0", marginBottom: 32 }}>Staff Portal</div>

      <div style={{ background: "white", borderRadius: 16, padding: 24, width: "100%", maxWidth: 360 }}>
        <div style={{ fontSize: 16, fontWeight: 700, color: "#1a1a2e", marginBottom: 18 }}>Apna account select karo</div>

        <div style={styles.formGroup}>
          <label style={styles.label}>Naam</label>
          <select style={styles.input} value={selectedId} onChange={e => { setSelectedId(e.target.value); setError(""); }}>
            {staffList.map(s => <option key={s.id} value={s.id}>{s.name} — {s.role}</option>)}
          </select>
        </div>

        <div style={styles.formGroup}>
          <label style={styles.label}>4-digit PIN</label>
          <input
            style={styles.input}
            type="password"
            placeholder="••••"
            maxLength={4}
            value={pin}
            onChange={e => { setPin(e.target.value); setError(""); }}
            onKeyDown={e => e.key === "Enter" && handleLogin()}
          />
        </div>

        {error && <div style={{ fontSize: 12, color: "#dc2626", marginBottom: 12 }}>{error}</div>}

        <button style={{ ...styles.btnSave, width: "100%", padding: 13, fontSize: 15 }} onClick={handleLogin}>
          Login Karo →
        </button>

        <div style={{ fontSize: 11, color: "#9ca3af", textAlign: "center", marginTop: 12 }}>
          Demo PINs: Priya=1111, Ritu=2222, Suresh=3333, Neha=4444
        </div>
      </div>
    </div>
  );
}

// ─── STAFF SELF-VIEW ──────────────────────────────────────────────────────────
function StaffSelfView({ staff, logs, setLogs, attendance, setAttendance, nextLogId, setNextLogId, showRevenue, absentNotes, setAbsentNotes, onLogout }) {
  const [showCalendar, setShowCalendar] = useState(false);
  const [tab, setTab] = useState("month");
  const [showAddLog, setShowAddLog] = useState(false);
  const c = avatarColor(staff.id);

  const todayAtt = attendance[today] || {};
  const isPresent = !!todayAtt[staff.id];

  function toggleMyAttendance() {
    setAttendance(prev => {
      const todayMap = { ...(prev[today] || {}) };
      todayMap[staff.id] = !todayMap[staff.id];
      return { ...prev, [today]: todayMap };
    });
  }

  function addLog(data) {
    setLogs(prev => [...prev, { ...data, id: nextLogId }]);
    setNextLogId(n => n + 1);
  }

  const filtered = useMemo(() => {
    const cutoff = tab === "today" ? today : tab === "week" ? thisWeekStart : thisMonthStart;
    return logs.filter(l => l.staffId === staff.id && l.date >= cutoff).sort((a, b) => b.date.localeCompare(a.date));
  }, [logs, tab, staff.id]);

  const totalClients = filtered.length;
  const totalRevenue = filtered.reduce((s, l) => s + l.amount, 0);

  return (
    <div style={styles.page}>
      {/* Header */}
      <div style={styles.header}>
        <div>
          <div style={styles.headerTitle}>Mera Dashboard</div>
          <div style={styles.headerSub}>Staff View</div>
        </div>
        <div style={{ display: "flex", gap: 8 }}>
          <button
            style={{ ...styles.addBtn, background: showCalendar ? "#e2e8f0" : "#1a1a2e", color: showCalendar ? "#1a1a2e" : "white" }}
            onClick={() => setShowCalendar(v => !v)}
          >📅</button>
          <button onClick={onLogout} style={{ ...styles.backBtn, fontSize: 11 }}>Logout</button>
        </div>
      </div>

      {/* Profile + attendance toggle */}
      <div style={{ padding: "14px", display: "flex", gap: 14, alignItems: "center", background: "white", borderBottom: "0.5px solid #e8e8e0" }}>
        <div style={{ ...styles.avatar, width: 52, height: 52, fontSize: 18, background: c.bg, color: c.text }}>{initials(staff.name)}</div>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 16, fontWeight: 700, color: "#1a1a2e" }}>{staff.name}</div>
          <div style={{ fontSize: 12, color: "#888" }}>{staff.role}</div>
        </div>
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 3 }}>
          <div
            style={{ width: 56, height: 28, borderRadius: 14, background: isPresent ? "#16a34a" : "#d1d5db", position: "relative", cursor: "pointer" }}
            onClick={toggleMyAttendance}
          >
            <div style={{ width: 22, height: 22, borderRadius: "50%", background: "white", position: "absolute", top: 3, left: isPresent ? 31 : 3, transition: "left 0.2s", boxShadow: "0 1px 3px rgba(0,0,0,0.2)" }} />
          </div>
          <span style={{ fontSize: 11, fontWeight: 700, color: isPresent ? "#16a34a" : "#9ca3af" }}>{isPresent ? "Present ✓" : "Mark Present"}</span>
        </div>
      </div>

      {/* Calendar — same as owner, toggle se khulta hai */}
      {showCalendar && (
        <MiniCalendar
          staffId={staff.id}
          logs={logs}
          attendance={attendance}
          selectedDate={today}
          onSelectDate={() => {}}
          showRevenue={showRevenue}
          absentNotes={absentNotes}
          setAbsentNotes={setAbsentNotes}
        />
      )}

      {/* Normal view — sirf jab calendar band ho */}
      {!showCalendar && (
        <>
          {/* Tabs */}
          <div style={{ padding: "12px 14px 0" }}>
            <div style={{ ...styles.tabRow, display: "grid", gridTemplateColumns: "1fr 1fr 1fr" }}>
              {[
                { key: "today", label: "Aaj" },
                { key: "week",  label: "Is Hafte" },
                { key: "month", label: "Is Mahine" },
              ].map(t => (
                <button key={t.key} style={{ ...styles.tabBtn, ...(tab === t.key ? styles.tabActive : {}) }} onClick={() => setTab(t.key)}>
                  {t.label}
                </button>
              ))}
            </div>
          </div>

          {/* Stats */}
          <div style={{ display: "grid", gridTemplateColumns: showRevenue ? "1fr 1fr" : "1fr", gap: 10, padding: "12px 14px 0" }}>
            <div style={styles.statCard}>
              <div style={{ ...styles.statNum, color: "#1a1a2e" }}>{totalClients}</div>
              <div style={styles.statLabel}>Clients serve kiye</div>
            </div>
            {showRevenue && (
              <div style={styles.statCard}>
                <div style={{ ...styles.statNum, color: "#16a34a" }}>{formatCurrency(totalRevenue)}</div>
                <div style={styles.statLabel}>Total revenue</div>
              </div>
            )}
          </div>

          {/* Log list */}
          <div style={{ padding: "14px" }}>
            <div style={styles.sectionHeader}>
              <div style={styles.sectionTitle}>Mera Kaam</div>
              <button style={styles.addBtn} onClick={() => setShowAddLog(true)}>+ Add Entry</button>
            </div>
            {filtered.length === 0
              ? <div style={styles.emptyState}>Koi entry nahi — {tab === "today" ? "aaj" : tab === "week" ? "is hafte" : "is mahine"} — add karo!</div>
              : filtered.map(log => (
                <div key={log.id} style={styles.logCard}>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 14, fontWeight: 600, color: "#1a1a2e" }}>{log.clientName}</div>
                    <div style={{ fontSize: 12, color: "#888", marginTop: 2 }}>{log.service} · {formatDate(log.date)}</div>
                  </div>
                  {showRevenue && (
                    <div style={{ fontSize: 14, fontWeight: 700, color: "#16a34a" }}>{formatCurrency(log.amount)}</div>
                  )}
                </div>
              ))
            }
          </div>
        </>
      )}

      {showAddLog && (
        <WorkLogModal
          staffList={[staff]}
          preselectedStaffId={staff.id}
          onSave={addLog}
          onClose={() => setShowAddLog(false)}
        />
      )}
    </div>
  );
}

// ─── ROOT APP ─────────────────────────────────────────────────────────────────
// Props: role = "owner" | "staff", currentUser = user object, showRevenue = bool, setShowRevenue = fn
export default function StaffManagement({ role = "owner", currentUser, showRevenue = false, setShowRevenue }) {
  const [staffList, setStaffList] = useState(INITIAL_STAFF);
  const [logs, setLogs] = useState(INITIAL_LOGS);
  const [attendance, setAttendance] = useState(INITIAL_ATTENDANCE);
  const [nextLogId, setNextLogId] = useState(11);
  const [staffAbsentNotes, setStaffAbsentNotes] = useState({});
  const [ownerAbsentNotes, setOwnerAbsentNotes] = useState({});

  // Find logged in staff from staffList if role is staff
  const loggedInStaff = role === "staff"
    ? staffList.find(s => s.id === currentUser?.staffId) || staffList[0]
    : null;

  if (role === "owner") {
    return (
      <OwnerDashboard
        staffList={staffList} setStaffList={setStaffList}
        logs={logs} setLogs={setLogs}
        attendance={attendance} setAttendance={setAttendance}
        showRevenueToStaff={showRevenue}
        setShowRevenueToStaff={setShowRevenue || (() => {})}
        absentNotes={ownerAbsentNotes}
        setAbsentNotes={setOwnerAbsentNotes}
      />
    );
  }

  if (role === "staff" && loggedInStaff) {
    return (
      <StaffSelfView
        staff={loggedInStaff}
        logs={logs} setLogs={setLogs}
        attendance={attendance} setAttendance={setAttendance}
        nextLogId={nextLogId} setNextLogId={setNextLogId}
        showRevenue={showRevenue}
        absentNotes={staffAbsentNotes}
        setAbsentNotes={setStaffAbsentNotes}
        onLogout={() => {}}
      />
    );
  }

  return null;
}

// ─── Styles ───────────────────────────────────────────────────────────────────
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
