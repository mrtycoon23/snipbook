import { useState, useMemo, useEffect } from "react";
import { supabase } from "../lib/supabase";

const SERVICES = ["Haircut","Hair Color","Facial","Waxing","Bridal Makeup","Manicure","Pedicure","Head Massage","Threading","Blowdry","Keratin","Hair Spa"];
const today = new Date().toISOString().slice(0,10);
const thisWeekStart = (()=>{const d=new Date();d.setDate(d.getDate()-d.getDay());return d.toISOString().slice(0,10);})();
const thisMonthStart = new Date().toISOString().slice(0,8)+"01";

// ─── Purple Theme ─────────────────────────────────────────────────────────────
const TP={
  bg:"#f4f2ff",surface:"#ffffff",border:"#e0d8ff",
  purple:"#2d1b69",purpleLight:"#ede9fe",purpleMid:"#5b3fc4",
  text:"#1a0a4a",tm:"#4a3580",ts:"#9b8ec4",tf:"#c4b8f0",tg:"#e0d8ff",
  green:"#22c55e",gl:"#e8fdf0",gm:"#bbf7d0",gd:"#16a34a",
  yellow:"#fef9c3",yb:"#fde68a",yt:"#a16207",
  blue:"#eff6ff",bb:"#93c5fd",bt:"#2563eb",
  red:"#fff0f0",rb:"#fca5a5",rt:"#dc2626",
  sub:"#f4f2ff",inp:"#fafbff",
};

const CARD_COLORS=[
  {cardBg:"#ede9fe",cardColor:"#5b3fc4",avBg:"#c4b8f0",avColor:"#2d1b69"},
  {cardBg:"#fef9c3",cardColor:"#a16207",avBg:"#fde68a",avColor:"#a16207"},
  {cardBg:"#f0fdf4",cardColor:"#16a34a",avBg:"#bbf7d0",avColor:"#16a34a"},
  {cardBg:"#fff0f6",cardColor:"#db2777",avBg:"#fbcfe8",avColor:"#db2777"},
  {cardBg:"#eff6ff",cardColor:"#2563eb",avBg:"#bfdbfe",avColor:"#1d4ed8"},
  {cardBg:"#fff7ed",cardColor:"#ea580c",avBg:"#fed7aa",avColor:"#ea580c"},
  {cardBg:"#f0fdfa",cardColor:"#0d9488",avBg:"#99f6e4",avColor:"#0f766e"},
];

function initials(name){return name.split(" ").map(w=>w[0]).join("").substring(0,2).toUpperCase();}
function avatarColor(id){const num=typeof id==="string"?id.charCodeAt(0):(id||1);return CARD_COLORS[Math.abs(num)%CARD_COLORS.length];}
function fc(n){return "₹"+Number(n).toLocaleString("en-IN");}
function fd(d){return new Date(d+"T00:00:00").toLocaleDateString("en-IN",{day:"numeric",month:"short"});}
function fdFull(d){return new Date(d+"T00:00:00").toLocaleDateString("en-IN",{day:"numeric",month:"short",year:"numeric"});}

function PhoneInput({value,onChange,placeholder="9876543210",style={}}){
  return(
    <input type="tel" inputMode="numeric" pattern="[0-9]*" maxLength={10} value={value}
      onChange={e=>onChange(e.target.value.replace(/\D/g,"").slice(0,10))}
      placeholder={placeholder}
      style={{width:"100%",border:`1.5px solid ${TP.border}`,borderRadius:10,padding:"9px 11px",fontSize:14,color:TP.text,background:TP.inp,outline:"none",boxSizing:"border-box",...style}}/>
  );
}

function DateRangePicker({fromDate,toDate,onFromChange,onToChange}){
  const PRESETS=[
    {label:"Aaj",from:today,to:today},
    {label:"Hafte",from:thisWeekStart,to:today},
    {label:"Mahine",from:thisMonthStart,to:today},
  ];
  return(
    <div style={{background:TP.surface,padding:"10px 14px",borderBottom:`1px solid ${TP.border}`}}>
      <div style={{display:"flex",gap:6,marginBottom:8}}>
        {PRESETS.map(p=>{
          const active=fromDate===p.from&&toDate===p.to;
          return(
            <button key={p.label} onClick={()=>{onFromChange(p.from);onToChange(p.to);}}
              style={{padding:"5px 14px",borderRadius:20,border:`1.5px solid ${active?TP.purpleMid:TP.border}`,background:active?TP.purpleLight:"white",color:active?TP.purpleMid:TP.ts,fontSize:12,fontWeight:700,cursor:"pointer",fontFamily:"inherit"}}>
              {p.label}
            </button>
          );
        })}
      </div>
      <div style={{display:"flex",gap:8,alignItems:"center"}}>
        <input type="date" value={fromDate} onChange={e=>onFromChange(e.target.value)}
          style={{flex:1,border:`1.5px solid ${TP.border}`,borderRadius:8,padding:"7px 10px",fontSize:12,outline:"none",color:TP.text,background:TP.inp}}/>
        <span style={{color:TP.tf,fontSize:12,fontWeight:700}}>→</span>
        <input type="date" value={toDate} onChange={e=>onToChange(e.target.value)}
          style={{flex:1,border:`1.5px solid ${TP.border}`,borderRadius:8,padding:"7px 10px",fontSize:12,outline:"none",color:TP.text,background:TP.inp}}/>
      </div>
    </div>
  );
}

function WorkLogModal({staffList,preselectedStaffId,onSave,onClose}){
  const [staffId,setStaffId]=useState(preselectedStaffId||staffList[0]?.id||"");
  const [clientName,setClientName]=useState("");
  const [service,setService]=useState(SERVICES[0]);
  const [amount,setAmount]=useState("");
  const [date,setDate]=useState(today);
  function handleSave(){
    if(!clientName.trim()){alert("Client naam daalo!");return;}
    if(!amount||isNaN(amount)){alert("Amount daalo!");return;}
    onSave({staffId,clientName:clientName.trim(),service,amount:Number(amount),date});
    onClose();
  }
  return(
    <div style={S.modalBg} onClick={e=>e.target===e.currentTarget&&onClose()}>
      <div style={S.modal}>
        <div style={{width:36,height:4,background:TP.border,borderRadius:2,margin:"0 auto 16px"}}/>
        <div style={S.modalTitle}>➕ Work Log Add Karo</div>
        {!preselectedStaffId&&(
          <div style={S.fg}><label style={S.label}>Staff</label>
            <select style={S.input} value={staffId} onChange={e=>setStaffId(e.target.value)}>
              {staffList.map(s=><option key={s.id} value={s.id}>{s.name}</option>)}
            </select>
          </div>
        )}
        <div style={S.fr}>
          <div style={S.fg}><label style={S.label}>Client Naam *</label><input style={S.input} placeholder="Anjali Mehta" value={clientName} onChange={e=>setClientName(e.target.value)}/></div>
          <div style={S.fg}><label style={S.label}>Date</label><input style={S.input} type="date" value={date} onChange={e=>setDate(e.target.value)}/></div>
        </div>
        <div style={S.fr}>
          <div style={S.fg}><label style={S.label}>Service</label><select style={S.input} value={service} onChange={e=>setService(e.target.value)}>{SERVICES.map(s=><option key={s}>{s}</option>)}</select></div>
          <div style={S.fg}><label style={S.label}>Amount (₹) *</label><input style={S.input} type="number" placeholder="500" value={amount} onChange={e=>setAmount(e.target.value)}/></div>
        </div>
        <div style={S.ma}>
          <button style={S.bc} onClick={onClose}>Cancel</button>
          <button style={S.bs} onClick={handleSave}>✓ Save</button>
        </div>
      </div>
    </div>
  );
}

function AddStaffModal({onSave,onClose}){
  const [name,setName]=useState("");const [role,setRole]=useState("Hairstylist");
  const [phone,setPhone]=useState("");const [salary,setSalary]=useState("");
  const [pin,setPin]=useState("");const [error,setError]=useState("");
  function handleSave(){
    setError("");
    if(!name.trim()){setError("Naam daalo!");return;}
    if(phone&&phone.length!==10){setError("Phone 10 digits hona chahiye!");return;}
    if(!pin||pin.length!==4){setError("4-digit PIN daalo!");return;}
    onSave({name:name.trim(),role,phone,salary:Number(salary)||0,pin});
    onClose();
  }
  return(
    <div style={S.modalBg} onClick={e=>e.target===e.currentTarget&&onClose()}>
      <div style={{...S.modal,maxHeight:"85vh",overflowY:"auto",WebkitOverflowScrolling:"touch"}}>
        <div style={{width:36,height:4,background:TP.border,borderRadius:2,margin:"0 auto 16px"}}/>
        <div style={S.modalTitle}>👤 Naya Staff Add Karo</div>
        {error&&<div style={S.err}>{error}</div>}
        <div style={S.fr}>
          <div style={S.fg}><label style={S.label}>Naam *</label><input style={S.input} placeholder="Priya Sharma" value={name} onChange={e=>setName(e.target.value)}/></div>
          <div style={S.fg}><label style={S.label}>Role</label><select style={S.input} value={role} onChange={e=>setRole(e.target.value)}>{["Hairstylist","Makeup Artist","Nail Artist","Receptionist","Manager"].map(r=><option key={r}>{r}</option>)}</select></div>
        </div>
        <div style={S.fr}>
          <div style={S.fg}><label style={S.label}>Phone</label><PhoneInput value={phone} onChange={setPhone}/></div>
          <div style={S.fg}><label style={S.label}>Salary (₹/mo)</label><input style={S.input} type="number" placeholder="12000" value={salary} onChange={e=>setSalary(e.target.value)}/></div>
        </div>
        <div style={S.fg}><label style={S.label}>PIN (4 digit) *</label><input style={S.input} type="number" placeholder="1234" maxLength={4} value={pin} onChange={e=>setPin(e.target.value.slice(0,4))}/></div>
        <div style={S.ma}><button style={S.bc} onClick={onClose}>Cancel</button><button style={S.bs} onClick={handleSave}>✓ Add Karo</button></div>
      </div>
    </div>
  );
}

function EditStaffModal({staff,onSave,onDelete,onClose}){
  const [name,setName]=useState(staff.name);const [role,setRole]=useState(staff.role);
  const [phone,setPhone]=useState(staff.phone||"");const [salary,setSalary]=useState(staff.salary);
  const [pin,setPin]=useState(staff.pin);const [confirmDelete,setConfirmDelete]=useState(false);const [error,setError]=useState("");
  function handleSave(){
    setError("");
    if(!name.trim()){setError("Naam daalo!");return;}
    if(phone&&phone.length!==10){setError("Phone 10 digits hona chahiye!");return;}
    onSave({...staff,name:name.trim(),role,phone,salary:Number(salary)||0,pin});
    onClose();
  }
  return(
    <div style={S.modalBg} onClick={e=>e.target===e.currentTarget&&onClose()}>
      <div style={{...S.modal,maxHeight:"85vh",overflowY:"auto",WebkitOverflowScrolling:"touch"}}>
        <div style={{width:36,height:4,background:TP.border,borderRadius:2,margin:"0 auto 16px"}}/>
        <div style={S.modalTitle}>✏️ Staff Edit Karo</div>
        {error&&<div style={S.err}>{error}</div>}
        <div style={S.fr}>
          <div style={S.fg}><label style={S.label}>Naam</label><input style={S.input} value={name} onChange={e=>setName(e.target.value)}/></div>
          <div style={S.fg}><label style={S.label}>Role</label><select style={S.input} value={role} onChange={e=>setRole(e.target.value)}>{["Hairstylist","Makeup Artist","Nail Artist","Receptionist","Manager"].map(r=><option key={r}>{r}</option>)}</select></div>
        </div>
        <div style={S.fr}>
          <div style={S.fg}><label style={S.label}>Phone</label><PhoneInput value={phone} onChange={setPhone}/></div>
          <div style={S.fg}><label style={S.label}>Salary (₹/mo)</label><input style={S.input} type="number" value={salary} onChange={e=>setSalary(e.target.value)}/></div>
        </div>
        <div style={S.fg}><label style={S.label}>PIN (4 digit)</label><input style={S.input} type="number" maxLength={4} value={pin} onChange={e=>setPin(e.target.value.slice(0,4))}/></div>
        <div style={S.ma}><button style={S.bc} onClick={onClose}>Cancel</button><button style={S.bs} onClick={handleSave}>✓ Save</button></div>
        {!confirmDelete
          ?<button onClick={()=>setConfirmDelete(true)} style={{width:"100%",marginTop:10,padding:10,border:`1px solid ${TP.rb}`,background:"white",borderRadius:10,fontSize:13,fontWeight:700,color:TP.rt,cursor:"pointer"}}>🗑 Remove Staff</button>
          :<div style={{marginTop:10,background:TP.red,borderRadius:10,padding:12}}>
            <div style={{fontSize:13,color:TP.rt,fontWeight:600,marginBottom:10}}>Pakka delete karna hai?</div>
            <div style={{display:"flex",gap:8}}>
              <button onClick={()=>setConfirmDelete(false)} style={{flex:1,padding:9,border:`1px solid ${TP.border}`,background:"white",borderRadius:8,fontSize:13,cursor:"pointer"}}>Cancel</button>
              <button onClick={()=>{onDelete(staff.id);onClose();}} style={{flex:1,padding:9,border:"none",background:TP.rt,borderRadius:8,fontSize:13,fontWeight:700,color:"white",cursor:"pointer"}}>Delete</button>
            </div>
          </div>
        }
      </div>
    </div>
  );
}

function EditLogModal({log,onSave,onDelete,onClose}){
  const [clientName,setClientName]=useState(log.clientName);
  const [service,setService]=useState(log.service);
  const [amount,setAmount]=useState(log.amount);
  const [date,setDate]=useState(log.date);
  const [confirmDelete,setConfirmDelete]=useState(false);
  function handleSave(){
    if(!clientName.trim()){alert("Client naam daalo!");return;}
    onSave({...log,clientName:clientName.trim(),service,amount:Number(amount),date});
    onClose();
  }
  return(
    <div style={S.modalBg} onClick={e=>e.target===e.currentTarget&&onClose()}>
      <div style={S.modal}>
        <div style={{width:36,height:4,background:TP.border,borderRadius:2,margin:"0 auto 16px"}}/>
        <div style={S.modalTitle}>✏️ Entry Edit Karo</div>
        <div style={S.fr}>
          <div style={S.fg}><label style={S.label}>Client Naam</label><input style={S.input} value={clientName} onChange={e=>setClientName(e.target.value)}/></div>
          <div style={S.fg}><label style={S.label}>Date</label><input style={S.input} type="date" value={date} onChange={e=>setDate(e.target.value)}/></div>
        </div>
        <div style={S.fr}>
          <div style={S.fg}><label style={S.label}>Service</label><select style={S.input} value={service} onChange={e=>setService(e.target.value)}>{SERVICES.map(s=><option key={s}>{s}</option>)}</select></div>
          <div style={S.fg}><label style={S.label}>Amount</label><input style={S.input} type="number" value={amount} onChange={e=>setAmount(e.target.value)}/></div>
        </div>
        <div style={S.ma}><button style={S.bc} onClick={onClose}>Cancel</button><button style={S.bs} onClick={handleSave}>✓ Save</button></div>
        {!confirmDelete
          ?<button onClick={()=>setConfirmDelete(true)} style={{width:"100%",marginTop:10,padding:10,border:`1px solid ${TP.rb}`,background:"white",borderRadius:10,fontSize:13,fontWeight:700,color:TP.rt,cursor:"pointer"}}>🗑 Delete Entry</button>
          :<div style={{marginTop:10,background:TP.red,borderRadius:10,padding:12}}>
            <div style={{fontSize:13,color:TP.rt,fontWeight:600,marginBottom:10}}>Pakka?</div>
            <div style={{display:"flex",gap:8}}>
              <button onClick={()=>setConfirmDelete(false)} style={{flex:1,padding:9,border:`1px solid ${TP.border}`,background:"white",borderRadius:8,fontSize:13,cursor:"pointer"}}>Cancel</button>
              <button onClick={()=>{onDelete(log.id);onClose();}} style={{flex:1,padding:9,border:"none",background:TP.rt,borderRadius:8,fontSize:13,fontWeight:700,color:"white",cursor:"pointer"}}>Delete</button>
            </div>
          </div>
        }
      </div>
    </div>
  );
}

function SalarySlipScreen({staff,logs,attendance,onBack}){
  const [slipMonth,setSlipMonth]=useState(new Date().toISOString().slice(0,7));
  const monthStart=slipMonth+"-01";
  const monthEnd=(()=>{const[y,m]=slipMonth.split("-").map(Number);return new Date(y,m,0).toISOString().slice(0,10);})();
  const totalDaysInMonth=(()=>{const[y,m]=slipMonth.split("-").map(Number);return new Date(y,m,0).getDate();})();
  const presentDays=Object.entries(attendance).filter(([d,map])=>d>=monthStart&&d<=monthEnd&&map[staff.id]).length;
  const absentDays=totalDaysInMonth-presentDays;
  const monthLogs=logs.filter(l=>l.staffId===staff.id&&l.date>=monthStart&&l.date<=monthEnd);
  const totalRevenue=monthLogs.reduce((s,l)=>s+l.amount,0);
  const earnedSalary=Math.round((staff.salary/totalDaysInMonth)*presentDays);
  const deduction=staff.salary-earnedSalary;
  const c=avatarColor(staff.id);
  const monthLabel=new Date(slipMonth+"-01").toLocaleDateString("en-IN",{month:"long",year:"numeric"});
  return(
    <div style={{display:"flex",flexDirection:"column",height:"100%",background:TP.bg,fontFamily:"'Segoe UI',sans-serif"}}>
      <div style={{...S.hdr,flexShrink:0}}>
        <button onClick={onBack} style={S.backBtn}>← Back</button>
        <div style={{textAlign:"center"}}><div style={S.hdrT}>Salary Slip</div><div style={S.hdrS}>{staff.name}</div></div>
        <div style={{width:60}}/>
      </div>
      <div style={{flex:1,overflowY:"auto",WebkitOverflowScrolling:"touch",padding:"14px"}}>
        <div style={S.fg}><label style={S.label}>Month</label><input style={S.input} type="month" value={slipMonth} onChange={e=>setSlipMonth(e.target.value)}/></div>
        <div style={{background:"white",border:`1px solid ${TP.border}`,borderRadius:16,padding:"14px"}}>
          <div style={{display:"flex",alignItems:"center",gap:12,marginBottom:14,paddingBottom:12,borderBottom:`1px solid ${TP.border}`}}>
            <div style={{width:48,height:48,borderRadius:"50%",display:"flex",alignItems:"center",justifyContent:"center",fontWeight:700,fontSize:16,background:c.avBg,color:c.avColor,flexShrink:0}}>{initials(staff.name)}</div>
            <div><div style={{fontSize:15,fontWeight:800,color:TP.text}}>{staff.name}</div><div style={{fontSize:12,color:TP.ts}}>{staff.role}</div></div>
          </div>
          <div style={{fontSize:13,fontWeight:700,textAlign:"center",color:TP.tm,marginBottom:12}}>{monthLabel} ka Salary</div>
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:8,marginBottom:14}}>
            <div style={{background:"#f0fdf4",borderRadius:10,padding:"10px",textAlign:"center"}}><div style={{fontSize:22,fontWeight:800,color:"#16a34a"}}>{presentDays}</div><div style={{fontSize:10,color:"#166534"}}>Present</div></div>
            <div style={{background:"#fef2f2",borderRadius:10,padding:"10px",textAlign:"center"}}><div style={{fontSize:22,fontWeight:800,color:"#dc2626"}}>{absentDays}</div><div style={{fontSize:10,color:"#991b1b"}}>Absent</div></div>
            <div style={{background:TP.purpleLight,borderRadius:10,padding:"10px",textAlign:"center"}}><div style={{fontSize:22,fontWeight:800,color:TP.purpleMid}}>{totalDaysInMonth}</div><div style={{fontSize:10,color:TP.ts}}>Total Din</div></div>
          </div>
          <div style={{background:TP.sub,borderRadius:10,padding:"12px",marginBottom:12}}>
            {[{label:"Fixed Salary",value:fc(staff.salary),color:TP.text},{label:"Earned",value:fc(earnedSalary),color:"#16a34a"},{label:"Deduction",value:"- "+fc(deduction),color:"#dc2626"}].map(row=>(
              <div key={row.label} style={{display:"flex",justifyContent:"space-between",padding:"6px 0",borderBottom:`0.5px solid ${TP.border}`}}>
                <div style={{fontSize:12,color:TP.ts}}>{row.label}</div>
                <div style={{fontSize:13,fontWeight:700,color:row.color}}>{row.value}</div>
              </div>
            ))}
            <div style={{display:"flex",justifyContent:"space-between",marginTop:10,background:`linear-gradient(135deg,${TP.purple},${TP.purpleMid})`,borderRadius:8,padding:"10px 12px"}}>
              <div style={{fontSize:13,fontWeight:700,color:"white"}}>Net Payable</div>
              <div style={{fontSize:18,fontWeight:800,color:"#c4b8f0"}}>{fc(earnedSalary)}</div>
            </div>
          </div>
          <div style={{background:TP.purpleLight,borderRadius:10,padding:"12px"}}>
            <div style={{display:"flex",justifyContent:"space-between"}}><div style={{fontSize:13,color:TP.ts}}>Total Clients</div><div style={{fontSize:13,fontWeight:700,color:TP.text}}>{monthLogs.length}</div></div>
            <div style={{display:"flex",justifyContent:"space-between",marginTop:4}}><div style={{fontSize:13,color:TP.ts}}>Revenue</div><div style={{fontSize:13,fontWeight:700,color:"#16a34a"}}>{fc(totalRevenue)}</div></div>
          </div>
        </div>
      </div>
    </div>
  );
}

function RevenueModal({staff,logs,fromDate,toDate,onClose}){
  const rangeLogs=logs.filter(l=>l.staffId===staff.id&&l.date>=fromDate&&l.date<=toDate).sort((a,b)=>b.date.localeCompare(a.date));
  const total=rangeLogs.reduce((s,l)=>s+l.amount,0);
  const c=avatarColor(staff.id);
  return(
    <div style={S.modalBg} onClick={e=>e.target===e.currentTarget&&onClose()}>
      <div style={{...S.modal,height:"88vh",display:"flex",flexDirection:"column"}}>
        <div style={{width:36,height:4,background:TP.border,borderRadius:2,margin:"0 auto 14px"}}/>
        <div style={{display:"flex",alignItems:"center",gap:10,marginBottom:14,flexShrink:0}}>
          <div style={{width:38,height:38,borderRadius:"50%",display:"flex",alignItems:"center",justifyContent:"center",fontWeight:700,fontSize:12,background:c.avBg,color:c.avColor,flexShrink:0}}>{initials(staff.name)}</div>
          <div style={{flex:1}}>
            <div style={{fontSize:14,fontWeight:800,color:TP.text}}>{staff.name} — Revenue</div>
            <div style={{fontSize:11,color:TP.ts}}>{fd(fromDate)} → {fd(toDate)}</div>
          </div>
          <button onClick={onClose} style={{background:TP.purpleLight,border:"none",borderRadius:8,padding:"6px 10px",fontSize:13,cursor:"pointer",color:TP.purpleMid,fontWeight:700}}>✕</button>
        </div>
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8,marginBottom:14,flexShrink:0}}>
          <div style={{background:"#f0fdf4",borderRadius:10,padding:"12px",textAlign:"center"}}>
            <div style={{fontSize:20,fontWeight:900,color:"#16a34a"}}>{fc(total)}</div>
            <div style={{fontSize:10,color:"#888",marginTop:2}}>Total Revenue</div>
          </div>
          <div style={{background:TP.purpleLight,borderRadius:10,padding:"12px",textAlign:"center"}}>
            <div style={{fontSize:20,fontWeight:900,color:TP.purpleMid}}>{rangeLogs.length}</div>
            <div style={{fontSize:10,color:TP.ts,marginTop:2}}>Total Clients</div>
          </div>
        </div>
        <div style={{flex:1,overflowY:"auto",WebkitOverflowScrolling:"touch"}}>
          {rangeLogs.length===0
            ?<div style={{textAlign:"center",color:TP.ts,padding:"24px 0",fontSize:13}}>Koi entry nahi</div>
            :rangeLogs.map((log,i)=>(
              <div key={log.id} style={{display:"flex",alignItems:"center",gap:10,padding:"10px 0",borderBottom:i<rangeLogs.length-1?`1px solid ${TP.border}`:"none"}}>
                <div style={{width:34,height:34,borderRadius:10,background:TP.purpleLight,display:"flex",alignItems:"center",justifyContent:"center",fontSize:14,flexShrink:0}}>✂️</div>
                <div style={{flex:1,minWidth:0}}>
                  <div style={{fontSize:13,fontWeight:700,color:TP.text,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{log.clientName}</div>
                  <div style={{fontSize:11,color:TP.ts,marginTop:1}}>{log.service} · {fdFull(log.date)}</div>
                </div>
                <div style={{fontSize:13,fontWeight:800,color:"#16a34a",flexShrink:0}}>{fc(log.amount)}</div>
              </div>
            ))
          }
        </div>
      </div>
    </div>
  );
}

function AttendanceModal({staff,attendance,fromDate,toDate,onClose}){
  const c=avatarColor(staff.id);
  const dates=[];
  let cur=new Date(fromDate+"T00:00:00");
  const end=new Date(toDate+"T00:00:00");
  const todayD=new Date(today+"T00:00:00");
  while(cur<=end&&cur<=todayD){dates.push(cur.toISOString().slice(0,10));cur.setDate(cur.getDate()+1);}
  const presentDays=dates.filter(d=>(attendance[d]||{})[staff.id]).length;
  const absentDays=dates.length-presentDays;
  const attPct=dates.length>0?Math.round((presentDays/dates.length)*100):0;
  return(
    <div style={S.modalBg} onClick={e=>e.target===e.currentTarget&&onClose()}>
      <div style={{...S.modal,height:"88vh",display:"flex",flexDirection:"column"}}>
        <div style={{width:36,height:4,background:TP.border,borderRadius:2,margin:"0 auto 14px"}}/>
        <div style={{display:"flex",alignItems:"center",gap:10,marginBottom:14,flexShrink:0}}>
          <div style={{width:38,height:38,borderRadius:"50%",display:"flex",alignItems:"center",justifyContent:"center",fontWeight:700,fontSize:12,background:c.avBg,color:c.avColor,flexShrink:0}}>{initials(staff.name)}</div>
          <div style={{flex:1}}>
            <div style={{fontSize:14,fontWeight:800,color:TP.text}}>{staff.name} — Attendance</div>
            <div style={{fontSize:11,color:TP.ts}}>{fd(fromDate)} → {fd(toDate)}</div>
          </div>
          <button onClick={onClose} style={{background:TP.purpleLight,border:"none",borderRadius:8,padding:"6px 10px",fontSize:13,cursor:"pointer",color:TP.purpleMid,fontWeight:700}}>✕</button>
        </div>
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:8,marginBottom:12,flexShrink:0}}>
          <div style={{background:"#f0fdf4",borderRadius:10,padding:"10px",textAlign:"center"}}>
            <div style={{fontSize:20,fontWeight:800,color:"#16a34a"}}>{presentDays}</div>
            <div style={{fontSize:9,color:"#166534"}}>Present</div>
          </div>
          <div style={{background:"#fef2f2",borderRadius:10,padding:"10px",textAlign:"center"}}>
            <div style={{fontSize:20,fontWeight:800,color:"#dc2626"}}>{absentDays}</div>
            <div style={{fontSize:9,color:"#991b1b"}}>Absent</div>
          </div>
          <div style={{background:attPct>=80?TP.gl:attPct>=60?TP.yellow:TP.red,borderRadius:10,padding:"10px",textAlign:"center"}}>
            <div style={{fontSize:20,fontWeight:800,color:attPct>=80?"#16a34a":attPct>=60?"#a16207":"#dc2626"}}>{attPct}%</div>
            <div style={{fontSize:9,color:TP.ts}}>Attendance</div>
          </div>
        </div>
        <div style={{background:TP.border,borderRadius:20,height:6,overflow:"hidden",marginBottom:14,flexShrink:0}}>
          <div style={{width:`${attPct}%`,height:"100%",background:attPct>=80?"#22c55e":attPct>=60?"#f59e0b":"#ef4444",borderRadius:20}}/>
        </div>
        <div style={{flex:1,overflowY:"auto",WebkitOverflowScrolling:"touch"}}>
          <div style={{fontSize:12,fontWeight:700,color:TP.ts,marginBottom:10}}>📅 Din-wise Record</div>
          <div style={{display:"flex",flexWrap:"wrap",gap:6,marginBottom:14}}>
            {dates.map(d=>{
              const isP=!!(attendance[d]||{})[staff.id];
              const reason=(attendance[d]||{})[staff.id+"_reason"];
              return(
                <div key={d} title={reason?`Reason: ${reason}`:""}
                  style={{background:isP?"#dcfce7":"#fee2e2",border:`1.5px solid ${isP?"#86efac":"#fca5a5"}`,borderRadius:8,padding:"6px 8px",textAlign:"center",minWidth:40,outline:d===today?`2px solid ${TP.purpleMid}`:"none"}}>
                  <div style={{fontSize:11,fontWeight:800,color:isP?"#16a34a":"#dc2626"}}>{new Date(d+"T00:00:00").getDate()}</div>
                  <div style={{fontSize:9,color:isP?"#16a34a":"#dc2626"}}>{isP?"✓":"✗"}</div>
                </div>
              );
            })}
          </div>
          {dates.some(d=>!(attendance[d]||{})[staff.id]&&(attendance[d]||{})[staff.id+"_reason"])&&(
            <div>
              <div style={{fontSize:12,fontWeight:700,color:TP.ts,marginBottom:8}}>📝 Absent Reasons</div>
              {dates.filter(d=>!(attendance[d]||{})[staff.id]&&(attendance[d]||{})[staff.id+"_reason"]).map(d=>(
                <div key={d} style={{background:TP.red,borderRadius:8,padding:"8px 10px",marginBottom:6,display:"flex",gap:8}}>
                  <div style={{fontSize:11,fontWeight:700,color:"#dc2626",flexShrink:0}}>{fd(d)}</div>
                  <div style={{fontSize:11,color:TP.tm}}>{(attendance[d]||{})[staff.id+"_reason"]}</div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Staff Summary Screen ──────────────────────────────────────────────────────
function StaffSummaryScreen({staffList,logs,attendance,onBack}){
  const [fromDate,setFromDate]=useState(thisMonthStart);
  const [toDate,setToDate]=useState(today);
  const [sortBy,setSortBy]=useState("revenue");
  const [revenueModal,setRevenueModal]=useState(null);
  const [attModal,setAttModal]=useState(null);

  const staffStats=staffList.map(s=>{
    const rangeLogs=logs.filter(l=>l.staffId===s.id&&l.date>=fromDate&&l.date<=toDate);
    const revenue=rangeLogs.reduce((sum,l)=>sum+l.amount,0);
    const clients=rangeLogs.length;
    const dates=[];
    let cur=new Date(fromDate+"T00:00:00");
    const end=new Date(toDate+"T00:00:00");
    const todayD=new Date(today+"T00:00:00");
    while(cur<=end&&cur<=todayD){dates.push(cur.toISOString().slice(0,10));cur.setDate(cur.getDate()+1);}
    const totalDays=dates.length;
    const presentDays=dates.filter(d=>(attendance[d]||{})[s.id]).length;
    const attPct=totalDays>0?Math.round((presentDays/totalDays)*100):0;
    return{...s,revenue,clients,presentDays,absentDays:totalDays-presentDays,attPct,totalDays};
  });

  const sorted=[...staffStats].sort((a,b)=>{
    if(sortBy==="revenue")return b.revenue-a.revenue;
    if(sortBy==="attendance")return b.attPct-a.attPct;
    if(sortBy==="clients")return b.clients-a.clients;
    return 0;
  });

  const totalRevenue=sorted.reduce((s,st)=>s+st.revenue,0);
  const totalClients=sorted.reduce((s,st)=>s+st.clients,0);
  const avgAtt=sorted.length>0?Math.round(sorted.reduce((s,st)=>s+st.attPct,0)/sorted.length):0;
  const rankMedals=["🥇","🥈","🥉"];

  return(
    <div style={{display:"flex",flexDirection:"column",height:"100%",background:TP.bg,fontFamily:"'Segoe UI',sans-serif"}}>
      <div style={{...S.hdr,flexShrink:0}}>
        <button onClick={onBack} style={S.backBtn}>← Back</button>
        <div style={{textAlign:"center"}}>
          <div style={S.hdrT}>📊 Staff Summary</div>
          <div style={S.hdrS}>Performance Overview</div>
        </div>
        <div style={{width:60}}/>
      </div>
      <div style={{flex:1,overflowY:"auto",WebkitOverflowScrolling:"touch"}}>
        <DateRangePicker fromDate={fromDate} toDate={toDate} onFromChange={setFromDate} onToChange={setToDate}/>
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:8,padding:"12px 14px 0"}}>
          {[
            {label:"Revenue",val:fc(totalRevenue),color:"#16a34a",bg:"#f0fdf4",icon:"💰"},
            {label:"Clients",val:totalClients,color:TP.purpleMid,bg:TP.purpleLight,icon:"👥"},
            {label:"Avg Att.",val:`${avgAtt}%`,color:avgAtt>=80?"#16a34a":avgAtt>=60?"#a16207":"#dc2626",bg:TP.sub,icon:"📅"},
          ].map(s=>(
            <div key={s.label} style={{background:s.bg,borderRadius:12,padding:"12px 8px",textAlign:"center",border:`1.5px solid ${TP.border}`}}>
              <div style={{fontSize:16,marginBottom:3}}>{s.icon}</div>
              <div style={{fontSize:14,fontWeight:900,color:s.color}}>{s.val}</div>
              <div style={{fontSize:9,color:TP.ts,marginTop:2,fontWeight:700}}>{s.label}</div>
            </div>
          ))}
        </div>
        <div style={{padding:"10px 14px 0"}}>
          <div style={{display:"flex",background:TP.border,borderRadius:10,padding:3,gap:2}}>
            {[{key:"revenue",label:"💰 Revenue"},{key:"clients",label:"👥 Clients"},{key:"attendance",label:"📅 Attendance"}].map(t=>(
              <button key={t.key} onClick={()=>setSortBy(t.key)}
                style={{flex:1,padding:"7px 4px",border:"none",borderRadius:8,background:sortBy===t.key?TP.purple:"transparent",color:sortBy===t.key?"white":TP.ts,fontSize:11,fontWeight:700,cursor:"pointer",fontFamily:"inherit"}}>
                {t.label}
              </button>
            ))}
          </div>
        </div>
        <div style={{padding:"10px 14px 100px"}}>
          {sorted.length===0&&<div style={{textAlign:"center",color:TP.ts,padding:"32px 0",fontSize:13}}>Koi staff nahi</div>}
          {sorted.map((s,idx)=>{
            const c=avatarColor(s.id);
            const revenueShare=totalRevenue>0?Math.round((s.revenue/totalRevenue)*100):0;
            return(
              <div key={s.id} style={{background:"white",borderRadius:16,border:`2px solid ${idx===0?TP.tf:TP.border}`,padding:"14px",marginBottom:10,boxShadow:idx===0?`0 2px 12px rgba(91,63,196,0.10)`:"none"}}>
                <div style={{display:"flex",alignItems:"center",gap:10,marginBottom:12}}>
                  <div style={{fontSize:idx<3?20:14,fontWeight:800,width:28,textAlign:"center",flexShrink:0}}>{idx<3?rankMedals[idx]:`#${idx+1}`}</div>
                  <div style={{width:38,height:38,borderRadius:"50%",display:"flex",alignItems:"center",justifyContent:"center",fontWeight:700,fontSize:12,background:c.avBg,color:c.avColor,flexShrink:0}}>{initials(s.name)}</div>
                  <div style={{flex:1,minWidth:0}}>
                    <div style={{fontSize:14,fontWeight:800,color:TP.text,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{s.name}</div>
                    <div style={{fontSize:11,color:TP.ts,marginTop:1}}>{s.role}</div>
                  </div>
                  <div style={{background:s.attPct>=80?"#dcfce7":s.attPct>=60?"#fef9c3":"#fee2e2",color:s.attPct>=80?"#16a34a":s.attPct>=60?"#a16207":"#dc2626",fontSize:10,fontWeight:800,padding:"3px 8px",borderRadius:20,flexShrink:0}}>{s.attPct}%</div>
                </div>
                <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr 1fr",gap:8,marginBottom:10}}>
                  <div onClick={()=>setRevenueModal(s)} style={{background:"#f0fdf4",borderRadius:10,padding:"10px 4px",textAlign:"center",cursor:"pointer",border:"1.5px solid #bbf7d0",userSelect:"none"}}>
                    <div style={{fontSize:12,fontWeight:900,color:"#16a34a"}}>{s.revenue>=1000?`₹${(s.revenue/1000).toFixed(1)}k`:fc(s.revenue)}</div>
                    <div style={{fontSize:9,color:TP.ts,marginTop:2}}>Revenue</div>
                  </div>
                  <div onClick={()=>setRevenueModal(s)} style={{background:TP.purpleLight,borderRadius:10,padding:"10px 4px",textAlign:"center",cursor:"pointer",border:`1.5px solid ${TP.border}`,userSelect:"none"}}>
                    <div style={{fontSize:12,fontWeight:900,color:TP.purpleMid}}>{s.clients}</div>
                    <div style={{fontSize:9,color:TP.ts,marginTop:2}}>Clients</div>
                  </div>
                  <div onClick={()=>setAttModal(s)} style={{background:"#f0fdf4",borderRadius:10,padding:"10px 4px",textAlign:"center",cursor:"pointer",border:"1.5px solid #86efac",userSelect:"none"}}>
                    <div style={{fontSize:12,fontWeight:900,color:"#16a34a"}}>{s.presentDays}</div>
                    <div style={{fontSize:9,color:TP.ts,marginTop:2}}>Present</div>
                  </div>
                  <div onClick={()=>setAttModal(s)} style={{background:"#fef2f2",borderRadius:10,padding:"10px 4px",textAlign:"center",cursor:"pointer",border:"1.5px solid #fca5a5",userSelect:"none"}}>
                    <div style={{fontSize:12,fontWeight:900,color:"#dc2626"}}>{s.absentDays}</div>
                    <div style={{fontSize:9,color:TP.ts,marginTop:2}}>Absent</div>
                  </div>
                </div>
                <div>
                  <div style={{display:"flex",justifyContent:"space-between",marginBottom:4}}>
                    <div style={{fontSize:10,color:TP.ts,fontWeight:700}}>Revenue share</div>
                    <div style={{fontSize:10,fontWeight:800,color:"#16a34a"}}>{revenueShare}%</div>
                  </div>
                  <div style={{background:TP.border,borderRadius:20,height:5,overflow:"hidden"}}>
                    <div style={{width:`${revenueShare}%`,height:"100%",background:`linear-gradient(90deg,${TP.purpleMid},${TP.tf})`,borderRadius:20}}/>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
      {revenueModal&&<RevenueModal staff={revenueModal} logs={logs} fromDate={fromDate} toDate={toDate} onClose={()=>setRevenueModal(null)}/>}
      {attModal&&<AttendanceModal staff={attModal} attendance={attendance} fromDate={fromDate} toDate={toDate} onClose={()=>setAttModal(null)}/>}
    </div>
  );
}

// ─── Staff Detail Screen ───────────────────────────────────────────────────────
function StaffDetailScreen({staff,logs,setLogs,attendance,onBack,onAddLog,onEditStaff,onDeleteStaff,currentUser}){
  const [fromDate,setFromDate]=useState(thisMonthStart);
  const [toDate,setToDate]=useState(today);
  const [editingLog,setEditingLog]=useState(null);
  const [showSalarySlip,setShowSalarySlip]=useState(false);
  const [showEditStaff,setShowEditStaff]=useState(false);
  const [showAttModal,setShowAttModal]=useState(false);
  const [showRevenueModal,setShowRevenueModal]=useState(false);
  const c=avatarColor(staff.id);

  const filtered=useMemo(()=>{
    return logs.filter(l=>l.staffId===staff.id&&l.date>=fromDate&&l.date<=toDate).sort((a,b)=>b.date.localeCompare(a.date));
  },[logs,fromDate,toDate,staff.id]);

  const totalRevenue=filtered.reduce((s,l)=>s+l.amount,0);

  const dates=[];
  let cur=new Date(fromDate+"T00:00:00");
  const end=new Date(toDate+"T00:00:00");
  const todayD=new Date(today+"T00:00:00");
  while(cur<=end&&cur<=todayD){dates.push(cur.toISOString().slice(0,10));cur.setDate(cur.getDate()+1);}
  const attendedDays=dates.filter(d=>(attendance[d]||{})[staff.id]).length;
  const totalDays=dates.length;
  const attPct=totalDays>0?Math.round((attendedDays/totalDays)*100):0;

  async function handleEditLog(updated){
    if(currentUser?.id){await supabase.from("work_logs").update({client_name:updated.clientName,service:updated.service,amount:updated.amount,date:updated.date}).eq("id",updated.id);}
    setLogs(prev=>prev.map(l=>l.id===updated.id?updated:l));
  }
  async function handleDeleteLog(id){
    if(currentUser?.id){await supabase.from("work_logs").delete().eq("id",id);}
    setLogs(prev=>prev.filter(l=>l.id!==id));
  }

  if(showSalarySlip)return<SalarySlipScreen staff={staff} logs={logs} attendance={attendance} onBack={()=>setShowSalarySlip(false)}/>;

  return(
    <div style={{display:"flex",flexDirection:"column",height:"100%",background:TP.bg,fontFamily:"'Segoe UI',sans-serif"}}>
      <div style={{...S.hdr,flexShrink:0}}>
        <button onClick={onBack} style={S.backBtn}>← Back</button>
        <div style={{textAlign:"center"}}><div style={S.hdrT}>{staff.name}</div><div style={S.hdrS}>{staff.role}</div></div>
        <button onClick={()=>setShowEditStaff(true)} style={{...S.backBtn,fontSize:11}}>Edit</button>
      </div>

      <div style={{flex:1,overflowY:"auto",WebkitOverflowScrolling:"touch"}}>
        {/* Profile Card */}
        <div style={{background:"white",margin:"14px 14px 0",borderRadius:16,padding:"16px",border:`1px solid ${TP.border}`,display:"flex",alignItems:"center",gap:14}}>
          <div style={{width:56,height:56,borderRadius:"50%",display:"flex",alignItems:"center",justifyContent:"center",fontWeight:700,fontSize:20,background:c.avBg,color:c.avColor,flexShrink:0}}>{initials(staff.name)}</div>
          <div style={{flex:1}}>
            <div style={{fontSize:16,fontWeight:800,color:TP.text}}>{staff.name}</div>
            <div style={{fontSize:12,color:TP.ts,marginTop:2}}>{staff.role}</div>
            {staff.phone&&<div style={{fontSize:12,color:TP.ts,marginTop:1}}>📞 {staff.phone}</div>}
            <div style={{fontSize:12,color:"#16a34a",fontWeight:700,marginTop:2}}>{fc(staff.salary)}/mo</div>
          </div>
          <button onClick={()=>setShowSalarySlip(true)} style={{background:TP.purpleLight,border:`1.5px solid ${TP.border}`,borderRadius:12,padding:"8px 12px",fontSize:11,fontWeight:700,color:TP.purpleMid,cursor:"pointer",textAlign:"center"}}>
            📄<br/>Salary<br/>Slip
          </button>
        </div>

        <div style={{marginTop:12}}>
          <DateRangePicker fromDate={fromDate} toDate={toDate} onFromChange={setFromDate} onToChange={setToDate}/>
        </div>

        {/* Stats */}
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:10,padding:"12px 14px 0"}}>
          <div onClick={()=>setShowRevenueModal(true)} style={{background:"linear-gradient(135deg,#f0fdf4,#dcfce7)",borderRadius:14,padding:"14px 10px",textAlign:"center",cursor:"pointer",border:"1.5px solid #bbf7d0"}}>
            <div style={{fontSize:18,fontWeight:900,color:"#16a34a"}}>{filtered.length}</div>
            <div style={{fontSize:10,color:"#166534",fontWeight:700,marginTop:2}}>Clients 👥</div>
          </div>
          <div onClick={()=>setShowRevenueModal(true)} style={{background:`linear-gradient(135deg,${TP.purpleLight},${TP.border})`,borderRadius:14,padding:"14px 10px",textAlign:"center",cursor:"pointer",border:`1.5px solid ${TP.border}`}}>
            <div style={{fontSize:filtered.length>0&&totalRevenue>=10000?13:18,fontWeight:900,color:TP.purpleMid}}>{fc(totalRevenue)}</div>
            <div style={{fontSize:10,color:TP.tm,fontWeight:700,marginTop:2}}>Revenue 💰</div>
          </div>
          <div onClick={()=>setShowAttModal(true)} style={{background:`linear-gradient(135deg,${attPct>=80?"#f0fdf4,#dcfce7":attPct>=60?"#fef9c3,#fef3c7":"#fef2f2,#fee2e2"})`,borderRadius:14,padding:"14px 10px",textAlign:"center",cursor:"pointer",border:`1.5px solid ${attPct>=80?"#86efac":attPct>=60?"#fcd34d":"#fca5a5"}`}}>
            <div style={{fontSize:18,fontWeight:900,color:attPct>=80?"#16a34a":attPct>=60?"#a16207":"#dc2626"}}>{attPct}%</div>
            <div style={{fontSize:10,color:TP.ts,fontWeight:700,marginTop:2}}>Attendance 📅</div>
          </div>
        </div>

        {/* Attendance bar */}
        <div style={{padding:"8px 14px 0"}}>
          <div style={{background:TP.border,borderRadius:20,height:4,overflow:"hidden"}}>
            <div style={{width:`${attPct}%`,height:"100%",background:attPct>=80?"#22c55e":attPct>=60?"#f59e0b":"#ef4444",borderRadius:20,transition:"width 0.5s"}}/>
          </div>
          <div style={{display:"flex",justifyContent:"space-between",marginTop:4}}>
            <div style={{fontSize:10,color:TP.ts}}>{attendedDays} din present</div>
            <div style={{fontSize:10,color:TP.ts}}>{totalDays-attendedDays} din absent</div>
          </div>
        </div>

        {/* Work Logs */}
        <div style={{padding:"14px"}}>
          <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:10}}>
            <div style={{fontSize:14,fontWeight:800,color:TP.text}}>Kaam ki Entries</div>
            <button style={S.addBtn} onClick={onAddLog}>+ Add</button>
          </div>
          {filtered.length===0
            ?<div style={{textAlign:"center",color:TP.ts,fontSize:13,padding:"32px 0",background:"white",borderRadius:14,border:`1px dashed ${TP.border}`}}>
              <div style={{fontSize:24,marginBottom:8}}>📋</div>
              Is period mein koi entry nahi
            </div>
            :filtered.map(log=>(
              <div key={log.id} onClick={()=>setEditingLog(log)}
                style={{background:"white",borderRadius:12,border:`1px solid ${TP.border}`,padding:"12px 14px",display:"flex",alignItems:"center",gap:12,marginBottom:8,cursor:"pointer"}}>
                <div style={{width:38,height:38,borderRadius:10,background:TP.purpleLight,display:"flex",alignItems:"center",justifyContent:"center",fontSize:16,flexShrink:0}}>✂️</div>
                <div style={{flex:1,minWidth:0}}>
                  <div style={{fontSize:13,fontWeight:700,color:TP.text,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{log.clientName}</div>
                  <div style={{fontSize:11,color:TP.ts,marginTop:2}}>{log.service} · {fd(log.date)}</div>
                </div>
                <div style={{fontSize:14,fontWeight:800,color:"#16a34a",flexShrink:0}}>{fc(log.amount)}</div>
              </div>
            ))
          }
        </div>
      </div>

      {editingLog&&<EditLogModal log={editingLog} onSave={handleEditLog} onDelete={handleDeleteLog} onClose={()=>setEditingLog(null)}/>}
      {showEditStaff&&<EditStaffModal staff={staff} onSave={onEditStaff} onDelete={onDeleteStaff} onClose={()=>setShowEditStaff(false)}/>}
      {showAttModal&&<AttendanceModal staff={staff} attendance={attendance} fromDate={fromDate} toDate={toDate} onClose={()=>setShowAttModal(false)}/>}
      {showRevenueModal&&<RevenueModal staff={staff} logs={logs} fromDate={fromDate} toDate={toDate} onClose={()=>setShowRevenueModal(false)}/>}
    </div>
  );
}

// ─── Owner Dashboard ───────────────────────────────────────────────────────────
function OwnerDashboard({staffList,setStaffList,logs,setLogs,attendance,setAttendance,showRevenueToStaff,setShowRevenueToStaff,currentUser}){
  const [view,setView]=useState("list");
  const [selectedStaff,setSelectedStaff]=useState(null);
  const [showAddStaff,setShowAddStaff]=useState(false);
  const [showAddLog,setShowAddLog]=useState(false);
  const [logForStaff,setLogForStaff]=useState(null);
  const [nextLogId,setNextLogId]=useState(100);
  const [fromDate,setFromDate]=useState(today);
  const [toDate,setToDate]=useState(today);
  const [showSummary,setShowSummary]=useState(false);

  async function toggleAttendance(staffId,date){
    const currentVal=!!(attendance[date]||{})[staffId];
    const newVal=!currentVal;
    setAttendance(prev=>{const dm={...(prev[date]||{})};dm[staffId]=newVal;return{...prev,[date]:dm};});
    if(currentUser?.id){
      await supabase.from("attendance").upsert({salon_id:currentUser.id,staff_id:staffId,date,is_present:newVal},{onConflict:"salon_id,staff_id,date"});
    }
  }

  async function addStaff(data){
    if(currentUser?.id){
      const{data:res}=await supabase.from("staff").insert({salon_id:currentUser.id,name:data.name,role:data.role,phone:data.phone,salary:data.salary,pin:data.pin}).select().single();
      if(res){setStaffList(prev=>[...prev,res]);return;}
    }
    setStaffList(prev=>[...prev,{...data,id:Date.now()}]);
  }

  async function editStaff(updated){
    if(currentUser?.id&&typeof updated.id==="string"){
      await supabase.from("staff").update({name:updated.name,role:updated.role,phone:updated.phone,salary:updated.salary,pin:updated.pin}).eq("id",updated.id);
    }
    setStaffList(prev=>prev.map(s=>s.id===updated.id?updated:s));
  }

  async function deleteStaff(id){
    if(currentUser?.id&&typeof id==="string"){await supabase.from("staff").delete().eq("id",id);}
    setStaffList(prev=>prev.filter(s=>s.id!==id));
    setView("list");
  }

  async function addLog(data){
    if(currentUser?.id){
      const{data:res}=await supabase.from("work_logs").insert({salon_id:currentUser.id,staff_id:data.staffId,client_name:data.clientName,service:data.service,amount:data.amount,date:data.date}).select().single();
      if(res){setLogs(prev=>[...prev,{id:res.id,staffId:res.staff_id,clientName:res.client_name,service:res.service,amount:res.amount,date:res.date}]);return;}
    }
    setLogs(prev=>[...prev,{...data,id:nextLogId}]);
    setNextLogId(n=>n+1);
  }

  const rangeLogs=logs.filter(l=>l.date>=fromDate&&l.date<=toDate);
  const rangeRevenue=rangeLogs.reduce((s,l)=>s+l.amount,0);
  const todayAtt=attendance[today]||{};
  const presentToday=staffList.filter(s=>todayAtt[s.id]).length;

  if(showSummary)return<StaffSummaryScreen staffList={staffList} logs={logs} attendance={attendance} onBack={()=>setShowSummary(false)}/>;
  if(view==="detail"&&selectedStaff){
    return(
      <>
        <StaffDetailScreen staff={selectedStaff} logs={logs} setLogs={setLogs} attendance={attendance} onBack={()=>setView("list")}
          onAddLog={()=>{setLogForStaff(selectedStaff.id);setShowAddLog(true);}}
          onEditStaff={editStaff} onDeleteStaff={deleteStaff} currentUser={currentUser}/>
        {showAddLog&&<WorkLogModal staffList={staffList} preselectedStaffId={logForStaff} onSave={addLog} onClose={()=>setShowAddLog(false)}/>}
      </>
    );
  }

  return(
    <div style={{display:"flex",flexDirection:"column",height:"100%",background:TP.bg,fontFamily:"'Segoe UI',sans-serif"}}>
      {/* Header */}
      <div style={{...S.hdr,flexShrink:0}}>
        <div>
          <div style={S.hdrT}>Staff Management</div>
          <div style={S.hdrS}>Owner View</div>
        </div>
        <div style={{display:"flex",gap:6}}>
          <button style={{...S.addBtn,background:"#16a34a",fontSize:11}} onClick={()=>setShowSummary(true)}>📊 Summary</button>
          <button style={{...S.addBtn,fontSize:11}} onClick={()=>{setLogForStaff(null);setShowAddLog(true);}}>+ Log</button>
        </div>
      </div>

      <div style={{flex:1,overflowY:"auto",WebkitOverflowScrolling:"touch"}}>
        {/* Revenue to staff toggle */}
        <div style={{background:showRevenueToStaff?TP.gl:TP.red,borderBottom:`1px solid ${TP.border}`,padding:"10px 14px",display:"flex",alignItems:"center",justifyContent:"space-between"}}>
          <div>
            <div style={{fontSize:13,fontWeight:700,color:TP.text}}>Staff ko Sales dikhao?</div>
            <div style={{fontSize:11,color:TP.ts,marginTop:1}}>{showRevenueToStaff?"ON":"OFF"}</div>
          </div>
          <div style={{width:52,height:26,borderRadius:13,background:showRevenueToStaff?"#16a34a":"#d1d5db",position:"relative",cursor:"pointer",flexShrink:0}} onClick={()=>setShowRevenueToStaff(v=>!v)}>
            <div style={{width:20,height:20,borderRadius:"50%",background:"white",position:"absolute",top:3,left:showRevenueToStaff?29:3,transition:"left 0.2s",boxShadow:"0 1px 3px rgba(0,0,0,0.2)"}}/>
          </div>
        </div>

        <DateRangePicker fromDate={fromDate} toDate={toDate} onFromChange={setFromDate} onToChange={setToDate}/>

        {/* Stats grid */}
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr 1fr",gap:8,padding:"12px 14px 0"}}>
          <div style={S.sc}><div style={{...S.sn,color:"#16a34a"}}>{presentToday}</div><div style={S.sl}>Present</div></div>
          <div style={S.sc}><div style={{...S.sn,color:"#dc2626"}}>{staffList.length-presentToday}</div><div style={S.sl}>Absent</div></div>
          <div style={S.sc}><div style={{...S.sn,color:TP.purpleMid}}>{rangeLogs.length}</div><div style={S.sl}>Services</div></div>
          <div style={S.sc}><div style={{...S.sn,color:"#16a34a",fontSize:12}}>{fc(rangeRevenue)}</div><div style={S.sl}>Revenue</div></div>
        </div>

        {/* Staff list */}
        <div style={{padding:"14px"}}>
          <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:10}}>
            <div style={{fontSize:14,fontWeight:800,color:TP.text}}>Staff List</div>
            <button style={S.addBtn} onClick={()=>setShowAddStaff(true)}>+ Add Staff</button>
          </div>
          {staffList.length===0&&<div style={{textAlign:"center",color:TP.ts,fontSize:13,padding:"32px 0"}}>Koi staff nahi — Add Staff karo</div>}
          {staffList.map(s=>{
            const c=avatarColor(s.id);
            const isPresent=!!(todayAtt[s.id]);
            const staffRangeLogs=logs.filter(l=>l.staffId===s.id&&l.date>=fromDate&&l.date<=toDate);
            const staffRevenue=staffRangeLogs.reduce((a,l)=>a+l.amount,0);
            return(
              <div key={s.id} style={{background:"white",borderRadius:14,border:`1.5px solid ${isPresent?TP.gm:TP.border}`,padding:"13px 14px",display:"flex",alignItems:"center",gap:12,marginBottom:10}}>
                <div style={{width:42,height:42,borderRadius:"50%",display:"flex",alignItems:"center",justifyContent:"center",fontWeight:700,fontSize:14,background:c.avBg,color:c.avColor,flexShrink:0}}>{initials(s.name)}</div>
                <div style={{flex:1,minWidth:0,cursor:"pointer"}} onClick={()=>{setSelectedStaff(s);setView("detail");}}>
                  <div style={{fontSize:14,fontWeight:700,color:TP.text}}>{s.name}</div>
                  <div style={{fontSize:11,color:TP.ts,marginTop:1}}>{s.role}</div>
                  <div style={{fontSize:11,marginTop:3,color:isPresent?TP.purpleMid:TP.ts}}>
                    {isPresent?`${staffRangeLogs.length} clients · ${fc(staffRevenue)} · Detail →`:"Absent today"}
                    {!isPresent&&attendance[today]?.[s.id+"_reason"]&&<span style={{color:"#ef4444",marginLeft:4}}>· {attendance[today][s.id+"_reason"]}</span>}
                  </div>
                </div>
                <div style={{display:"flex",flexDirection:"column",alignItems:"center",gap:3,flexShrink:0}}>
                  <div style={{width:52,height:26,borderRadius:13,background:isPresent?"#16a34a":"#d1d5db",position:"relative",cursor:"pointer"}} onClick={()=>toggleAttendance(s.id,today)}>
                    <div style={{width:20,height:20,borderRadius:"50%",background:"white",position:"absolute",top:3,left:isPresent?29:3,transition:"left 0.2s",boxShadow:"0 1px 3px rgba(0,0,0,0.2)"}}/>
                  </div>
                  <span style={{fontSize:10,fontWeight:700,color:isPresent?"#16a34a":TP.ts}}>{isPresent?"Present":"Absent"}</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {showAddStaff&&<AddStaffModal onSave={addStaff} onClose={()=>setShowAddStaff(false)}/>}
      {showAddLog&&<WorkLogModal staffList={staffList} preselectedStaffId={logForStaff} onSave={addLog} onClose={()=>setShowAddLog(false)}/>}
    </div>
  );
}

// ─── Staff Self View ───────────────────────────────────────────────────────────
function StaffSelfView({staff,logs,setLogs,attendance,setAttendance,nextLogId,setNextLogId,showRevenue,onLogout}){
  const [tab,setTab]=useState("month");
  const [showAddLog,setShowAddLog]=useState(false);
  const c=avatarColor(staff.id);
  const isPresent=!!(attendance[today]||{})[staff.id];
  function toggleMyAttendance(){setAttendance(prev=>{const m={...(prev[today]||{})};m[staff.id]=!m[staff.id];return{...prev,[today]:m};});}
  function addLog(data){setLogs(prev=>[...prev,{...data,id:nextLogId}]);setNextLogId(n=>n+1);}
  const filtered=useMemo(()=>{
    const cutoff=tab==="today"?today:tab==="week"?thisWeekStart:thisMonthStart;
    return logs.filter(l=>l.staffId===staff.id&&l.date>=cutoff).sort((a,b)=>b.date.localeCompare(a.date));
  },[logs,tab,staff.id]);
  return(
    <div style={{display:"flex",flexDirection:"column",height:"100%",background:TP.bg,fontFamily:"'Segoe UI',sans-serif"}}>
      <div style={{...S.hdr,flexShrink:0}}>
        <div><div style={S.hdrT}>Mera Dashboard</div><div style={S.hdrS}>Staff View</div></div>
        <button onClick={onLogout} style={{...S.backBtn,fontSize:11}}>Logout</button>
      </div>
      <div style={{flex:1,overflowY:"auto",WebkitOverflowScrolling:"touch"}}>
        <div style={{padding:"14px",display:"flex",gap:14,alignItems:"center",background:"white",borderBottom:`1px solid ${TP.border}`}}>
          <div style={{width:52,height:52,borderRadius:"50%",display:"flex",alignItems:"center",justifyContent:"center",fontWeight:700,fontSize:18,background:c.avBg,color:c.avColor,flexShrink:0}}>{initials(staff.name)}</div>
          <div style={{flex:1}}><div style={{fontSize:16,fontWeight:700,color:TP.text}}>{staff.name}</div><div style={{fontSize:12,color:TP.ts}}>{staff.role}</div></div>
          <div style={{display:"flex",flexDirection:"column",alignItems:"center",gap:3}}>
            <div style={{width:56,height:28,borderRadius:14,background:isPresent?"#16a34a":"#d1d5db",position:"relative",cursor:"pointer"}} onClick={toggleMyAttendance}>
              <div style={{width:22,height:22,borderRadius:"50%",background:"white",position:"absolute",top:3,left:isPresent?31:3,transition:"left 0.2s",boxShadow:"0 1px 3px rgba(0,0,0,0.2)"}}/>
            </div>
            <span style={{fontSize:11,fontWeight:700,color:isPresent?"#16a34a":TP.ts}}>{isPresent?"Present":"Mark Present"}</span>
          </div>
        </div>
        <div style={{padding:"12px 14px 0"}}>
          <div style={{display:"flex",background:TP.border,borderRadius:10,padding:3,gap:2}}>
            {[{key:"today",label:"Aaj"},{key:"week",label:"Is Hafte"},{key:"month",label:"Is Mahine"}].map(t=>(
              <button key={t.key} style={{padding:"8px 0",border:"none",borderRadius:8,background:tab===t.key?TP.purple:"transparent",color:tab===t.key?"white":TP.ts,fontSize:13,fontWeight:600,cursor:"pointer",fontFamily:"inherit",flex:1}} onClick={()=>setTab(t.key)}>{t.label}</button>
            ))}
          </div>
        </div>
        <div style={{display:"grid",gridTemplateColumns:showRevenue?"1fr 1fr":"1fr",gap:10,padding:"12px 14px 0"}}>
          <div style={S.sc}><div style={{...S.sn,color:TP.purpleMid}}>{filtered.length}</div><div style={S.sl}>Clients</div></div>
          {showRevenue&&<div style={S.sc}><div style={{...S.sn,color:"#16a34a"}}>{fc(filtered.reduce((s,l)=>s+l.amount,0))}</div><div style={S.sl}>Revenue</div></div>}
        </div>
        <div style={{padding:"14px"}}>
          <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:10}}>
            <div style={{fontSize:14,fontWeight:700,color:TP.text}}>Mera Kaam</div>
            <button style={S.addBtn} onClick={()=>setShowAddLog(true)}>+ Add</button>
          </div>
          {filtered.length===0
            ?<div style={{textAlign:"center",color:TP.ts,fontSize:13,padding:"24px 0"}}>Koi entry nahi!</div>
            :filtered.map(log=>(
              <div key={log.id} style={{background:"white",borderRadius:10,border:`1px solid ${TP.border}`,padding:"11px 14px",display:"flex",alignItems:"center",gap:12,marginBottom:8}}>
                <div style={{flex:1}}><div style={{fontSize:14,fontWeight:600,color:TP.text}}>{log.clientName}</div><div style={{fontSize:12,color:TP.ts,marginTop:2}}>{log.service} · {fd(log.date)}</div></div>
                {showRevenue&&<div style={{fontSize:14,fontWeight:700,color:"#16a34a"}}>{fc(log.amount)}</div>}
              </div>
            ))
          }
        </div>
      </div>
      {showAddLog&&<WorkLogModal staffList={[staff]} preselectedStaffId={staff.id} onSave={addLog} onClose={()=>setShowAddLog(false)}/>}
    </div>
  );
}

// ─── Main Export ───────────────────────────────────────────────────────────────
export default function StaffManagement({role="owner",currentUser,showRevenue=false,setShowRevenue}){
  const [staffList,setStaffList]=useState([]);
  const [logs,setLogs]=useState([]);
  const [attendance,setAttendance]=useState({});
  const [nextLogId,setNextLogId]=useState(100);

  useEffect(()=>{
    async function loadStaff(){
      const{data}=await supabase.from("staff").select("*").eq("salon_id",currentUser?.id);
      setStaffList(data&&data.length>0?data:[]);
    }
    if(currentUser?.id)loadStaff();
  },[currentUser?.id]);

  useEffect(()=>{
    async function loadLogs(){
      const{data}=await supabase.from("work_logs").select("*").eq("salon_id",currentUser?.id);
      setLogs(data&&data.length>0?data.map(l=>({id:l.id,staffId:l.staff_id,clientName:l.client_name,service:l.service,amount:l.amount,date:l.date})):[]);
    }
    if(currentUser?.id)loadLogs();
  },[currentUser?.id]);

  useEffect(()=>{
    async function loadAttendance(){
      const{data}=await supabase.from("attendance").select("*").eq("salon_id",currentUser?.id);
      if(data&&data.length>0){
        const attMap={};
        data.forEach(row=>{
          if(!attMap[row.date])attMap[row.date]={};
          attMap[row.date][row.staff_id]=row.is_present;
          if(row.absent_reason)attMap[row.date][row.staff_id+"_reason"]=row.absent_reason;
        });
        setAttendance(attMap);
      }else setAttendance({});
    }
    if(currentUser?.id)loadAttendance();
  },[currentUser?.id]);

  const loggedInStaff=role==="staff"?staffList.find(s=>s.id===currentUser?.staffId)||staffList[0]:null;

  if(role==="owner"){
    return<OwnerDashboard staffList={staffList} setStaffList={setStaffList} logs={logs} setLogs={setLogs}
      attendance={attendance} setAttendance={setAttendance}
      showRevenueToStaff={showRevenue} setShowRevenueToStaff={setShowRevenue||(()=>{})}
      currentUser={currentUser}/>;
  }
  if(role==="staff"&&loggedInStaff){
    return<StaffSelfView staff={loggedInStaff} logs={logs} setLogs={setLogs} attendance={attendance} setAttendance={setAttendance}
      nextLogId={nextLogId} setNextLogId={setNextLogId} showRevenue={showRevenue} onLogout={()=>{}}/>;
  }
  return null;
}

// ─── Style constants ──────────────────────────────────────────────────────────
const S={
  hdr:{background:`linear-gradient(135deg,${TP.purple},${TP.purpleMid})`,padding:"14px 16px",display:"flex",alignItems:"center",justifyContent:"space-between"},
  hdrT:{fontSize:16,fontWeight:800,color:"#fff"},
  hdrS:{fontSize:11,color:"#c4b8f0",marginTop:1},
  backBtn:{background:"transparent",border:"1px solid rgba(255,255,255,0.3)",color:"white",borderRadius:8,padding:"6px 12px",fontSize:13,cursor:"pointer",fontFamily:"inherit"},
  addBtn:{background:`linear-gradient(135deg,${TP.purple},${TP.purpleMid})`,color:"white",border:"none",borderRadius:8,padding:"7px 14px",fontSize:12,fontWeight:700,cursor:"pointer",fontFamily:"inherit"},
  sc:{background:"white",borderRadius:10,padding:"12px 10px",textAlign:"center",border:`1px solid ${TP.border}`},
  sn:{fontSize:20,fontWeight:800},
  sl:{fontSize:10,color:TP.ts,marginTop:2},
  modalBg:{position:"fixed",inset:0,background:"rgba(45,27,105,0.4)",display:"flex",alignItems:"flex-end",justifyContent:"center",zIndex:200},
  modal:{background:"white",borderRadius:"20px 20px 0 0",padding:20,width:"100%",maxWidth:480,paddingBottom:40},
  modalTitle:{fontSize:16,fontWeight:700,color:TP.text,marginBottom:16},
  fg:{marginBottom:13},
  fr:{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10},
  label:{fontSize:12,fontWeight:600,color:TP.tm,marginBottom:5,display:"block"},
  input:{width:"100%",border:`1.5px solid ${TP.border}`,borderRadius:8,padding:"9px 11px",fontSize:14,color:TP.text,background:TP.inp,outline:"none",boxSizing:"border-box"},
  ma:{display:"flex",gap:10,marginTop:18},
  bc:{flex:1,padding:11,border:`1.5px solid ${TP.border}`,borderRadius:10,fontSize:14,fontWeight:600,cursor:"pointer",fontFamily:"inherit",backgroundColor:TP.purpleLight,color:TP.purpleMid},
  bs:{flex:2,padding:11,border:"none",background:`linear-gradient(135deg,${TP.purple},${TP.purpleMid})`,borderRadius:10,fontSize:14,fontWeight:600,color:"white",cursor:"pointer",fontFamily:"inherit"},
  err:{background:"#fff0f0",border:`1px solid ${TP.rb}`,borderRadius:8,padding:"8px 12px",fontSize:12,color:TP.rt,fontWeight:700,marginBottom:12},
};
