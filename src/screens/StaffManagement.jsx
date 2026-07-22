import { useState, useMemo, useEffect } from "react";
import { supabase } from "../lib/supabase";

const SERVICES = ["Haircut","Hair Color","Facial","Waxing","Bridal Makeup","Manicure","Pedicure","Head Massage","Threading","Blowdry","Keratin","Hair Spa"];
const today = new Date().toISOString().slice(0,10);
const thisWeekStart = (()=>{const d=new Date();d.setDate(d.getDate()-d.getDay());return d.toISOString().slice(0,10);})();
const thisMonthStart = new Date().toISOString().slice(0,8)+"01";

const AVATAR_COLORS=[
  {bg:"#fce7f3",text:"#9d174d"},{bg:"#dbeafe",text:"#1e40af"},
  {bg:"#d1fae5",text:"#065f46"},{bg:"#fef3c7",text:"#92400e"},{bg:"#ede9fe",text:"#4c1d95"},
];

function initials(name){return name.split(" ").map(w=>w[0]).join("").substring(0,2).toUpperCase();}
function avatarColor(id){const num=typeof id==="string"?id.charCodeAt(0):(id||1);return AVATAR_COLORS[Math.abs(num-1)%AVATAR_COLORS.length];}
function fc(n){return "₹"+Number(n).toLocaleString("en-IN");}
function fd(d){return new Date(d+"T00:00:00").toLocaleDateString("en-IN",{day:"numeric",month:"short"});}
function fdFull(d){return new Date(d+"T00:00:00").toLocaleDateString("en-IN",{day:"numeric",month:"short",year:"numeric"});}

function PhoneInput({value,onChange,placeholder="9876543210",style={}}){
  return(
    <input type="tel" inputMode="numeric" pattern="[0-9]*" maxLength={10} value={value}
      onChange={e=>onChange(e.target.value.replace(/\D/g,"").slice(0,10))}
      placeholder={placeholder}
      style={{width:"100%",border:"1px solid #e2e8f0",borderRadius:8,padding:"9px 11px",fontSize:14,color:"#1a1a2e",background:"#fafafa",outline:"none",boxSizing:"border-box",...style}}/>
  );
}

function DateRangePicker({fromDate,toDate,onFromChange,onToChange}){
  const PRESETS=[
    {label:"Today",from:today,to:today},
    {label:"Week",from:thisWeekStart,to:today},
    {label:"Month",from:thisMonthStart,to:today},
  ];
  return(
    <div style={{background:"#fff",padding:"10px 14px",borderBottom:"1px solid #f0f4f8"}}>
      <div style={{display:"flex",gap:6,marginBottom:8}}>
        {PRESETS.map(p=>{
          const active=fromDate===p.from&&toDate===p.to;
          return(
            <button key={p.label} onClick={()=>{onFromChange(p.from);onToChange(p.to);}}
              style={{padding:"5px 14px",borderRadius:20,border:`1.5px solid ${active?"#22c55e":"#e8edf3"}`,background:active?"#e8fdf0":"white",color:active?"#16a34a":"#888",fontSize:12,fontWeight:700,cursor:"pointer",fontFamily:"inherit"}}>
              {p.label}
            </button>
          );
        })}
      </div>
      <div style={{display:"flex",gap:8,alignItems:"center"}}>
        <input type="date" value={fromDate} onChange={e=>onFromChange(e.target.value)}
          style={{flex:1,border:"1.5px solid #e8edf3",borderRadius:8,padding:"7px 10px",fontSize:12,outline:"none",color:"#1a1a2e",background:"#fafbfc"}}/>
        <span style={{color:"#aaa",fontSize:12,fontWeight:700}}>→</span>
        <input type="date" value={toDate} onChange={e=>onToChange(e.target.value)}
          style={{flex:1,border:"1.5px solid #e8edf3",borderRadius:8,padding:"7px 10px",fontSize:12,outline:"none",color:"#1a1a2e",background:"#fafbfc"}}/>
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
    if(!clientName.trim()){alert("Please enter the client name!");return;}
    if(!amount||isNaN(amount)){alert("Please enter an amount!");return;}
    onSave({staffId,clientName:clientName.trim(),service,amount:Number(amount),date});
    onClose();
  }
  return(
    <div style={S.modalBg} onClick={e=>e.target===e.currentTarget&&onClose()}>
      <div style={S.modal}>
        <div style={S.modalTitle}>➕ Add Work Log</div>
        {!preselectedStaffId&&(
          <div style={S.fg}><label style={S.label}>Staff</label>
            <select style={S.input} value={staffId} onChange={e=>setStaffId(e.target.value)}>
              {staffList.map(s=><option key={s.id} value={s.id}>{s.name}</option>)}
            </select>
          </div>
        )}
        <div style={S.fr}>
          <div style={S.fg}><label style={S.label}>Client Name *</label><input style={S.input} placeholder="Anjali Mehta" value={clientName} onChange={e=>setClientName(e.target.value)}/></div>
          <div style={S.fg}><label style={S.label}>Date</label><input style={S.input} type="date" value={date} onChange={e=>setDate(e.target.value)}/></div>
        </div>
        <div style={S.fr}>
          <div style={S.fg}><label style={S.label}>Service</label><select style={S.input} value={service} onChange={e=>setService(e.target.value)}>{SERVICES.map(s=><option key={s}>{s}</option>)}</select></div>
          <div style={S.fg}><label style={S.label}>Amount (₹) *</label><input style={S.input} type="number" placeholder="500" value={amount} onChange={e=>setAmount(e.target.value)}/></div>
        </div>
        <div style={S.ma}><button style={{...S.bc,backgroundColor:"#e8edf3",color:"#1a1a2e",border:"2px solid #d1d5db"}} onClick={onClose}>Cancel</button><button style={S.bs} onClick={handleSave}>✓ Save</button></div>
      </div>
    </div>
  );
}

function AddStaffModal({onSave,onClose}){
  const [name,setName]=useState("");const [role,setRole]=useState("Hairstylist");
  const [phone,setPhone]=useState("");const [salary,setSalary]=useState("");
  const [pin,setPin]=useState("");const [error,setError]=useState("");
  const [genderCapability,setGenderCapability]=useState("both");
  const [saving,setSaving]=useState(false);
  async function handleSave(){
    setError("");
    if(!name.trim()){setError("Please enter a name!");return;}
    if(phone&&phone.length!==10){setError("Phone number must be 10 digits!");return;}
    if(!pin||pin.length!==4){setError("Please enter a 4-digit PIN!");return;}
    setSaving(true);
    const result=await onSave({name:name.trim(),role,phone,salary:Number(salary)||0,pin,gender_capability:genderCapability});
    setSaving(false);
    if(result&&result.success===false){setError(result.message||"Could not save. Please try again.");return;}
    onClose();
  }
  return(
    <div style={S.modalBg} onClick={e=>e.target===e.currentTarget&&onClose()}>
      <div style={{...S.modal,maxHeight:"85vh",overflowY:"auto",WebkitOverflowScrolling:"touch"}}>
        <div style={S.modalTitle}>👤 Add New Staff</div>
        {error&&<div style={S.err}>{error}</div>}
        <div style={S.fr}>
          <div style={S.fg}><label style={S.label}>Name *</label><input style={S.input} placeholder="Priya Sharma" value={name} onChange={e=>setName(e.target.value)}/></div>
          <div style={S.fg}><label style={S.label}>Role</label><select style={S.input} value={role} onChange={e=>setRole(e.target.value)}>{["Hairstylist","Makeup Artist","Nail Artist","Receptionist","Manager"].map(r=><option key={r}>{r}</option>)}</select></div>
        </div>
        <div style={S.fr}>
          <div style={S.fg}><label style={S.label}>Phone</label><PhoneInput value={phone} onChange={setPhone}/></div>
          <div style={S.fg}><label style={S.label}>Salary (₹/month)</label><input style={S.input} type="number" placeholder="12000" value={salary} onChange={e=>setSalary(e.target.value)}/></div>
        </div>
        <div style={S.fg}>
          <label style={S.label}>Which clients can this staff member serve? (for WhatsApp bookings)</label>
          <div style={{display:"flex",gap:6}}>
            {[{id:"male",label:"👨 Male"},{id:"female",label:"👩 Female"},{id:"both",label:"👥 Both"}].map(g=>(
              <button key={g.id} onClick={()=>setGenderCapability(g.id)} style={{flex:1,padding:"9px 4px",borderRadius:8,border:`2px solid ${genderCapability===g.id?"#1a1a2e":"#e2e8f0"}`,background:genderCapability===g.id?"#1a1a2e":"#fff",color:genderCapability===g.id?"#fff":"#555",fontSize:12,fontWeight:700,cursor:"pointer",fontFamily:"inherit"}}>{g.label}</button>
            ))}
          </div>
        </div>
        <div style={S.fg}><label style={S.label}>PIN (4 digits) *</label><input style={S.input} type="number" placeholder="1234" maxLength={4} value={pin} onChange={e=>setPin(e.target.value.slice(0,4))}/></div>
        <div style={S.ma}><button style={S.bc} onClick={onClose} disabled={saving}>Cancel</button><button style={{...S.bs,opacity:saving?0.6:1}} onClick={handleSave} disabled={saving}>{saving?"Saving...":"✓ Add"}</button></div>
      </div>
    </div>
  );
}

function EditStaffModal({staff,onSave,onDelete,onClose}){
  const [name,setName]=useState(staff.name);const [role,setRole]=useState(staff.role);
  const [phone,setPhone]=useState(staff.phone||"");const [salary,setSalary]=useState(staff.salary);
  const [pin,setPin]=useState(staff.pin);const [confirmDelete,setConfirmDelete]=useState(false);const [error,setError]=useState("");
  const [genderCapability,setGenderCapability]=useState(staff.gender_capability||"both");
  const [saving,setSaving]=useState(false);
  async function handleSave(){
    setError("");
    if(!name.trim()){setError("Please enter a name!");return;}
    if(phone&&phone.length!==10){setError("Phone number must be 10 digits!");return;}
    setSaving(true);
    const result=await onSave({...staff,name:name.trim(),role,phone,salary:Number(salary)||0,pin,gender_capability:genderCapability});
    setSaving(false);
    if(result&&result.success===false){setError(result.message||"Could not save. Please try again.");return;}
    onClose();
  }
  return(
    <div style={S.modalBg} onClick={e=>e.target===e.currentTarget&&onClose()}>
      <div style={{...S.modal,maxHeight:"85vh",overflowY:"auto",WebkitOverflowScrolling:"touch"}}>
        <div style={S.modalTitle}>✏️ Edit Staff</div>
        {error&&<div style={S.err}>{error}</div>}
        <div style={S.fr}>
          <div style={S.fg}><label style={S.label}>Name</label><input style={S.input} value={name} onChange={e=>setName(e.target.value)}/></div>
          <div style={S.fg}><label style={S.label}>Role</label><select style={S.input} value={role} onChange={e=>setRole(e.target.value)}>{["Hairstylist","Makeup Artist","Nail Artist","Receptionist","Manager"].map(r=><option key={r}>{r}</option>)}</select></div>
        </div>
        <div style={S.fr}>
          <div style={S.fg}><label style={S.label}>Phone</label><PhoneInput value={phone} onChange={setPhone}/></div>
          <div style={S.fg}><label style={S.label}>Salary (₹/month)</label><input style={S.input} type="number" value={salary} onChange={e=>setSalary(e.target.value)}/></div>
        </div>
        <div style={S.fg}>
          <label style={S.label}>Which clients can this staff member serve? (for WhatsApp bookings)</label>
          <div style={{display:"flex",gap:6}}>
            {[{id:"male",label:"👨 Male"},{id:"female",label:"👩 Female"},{id:"both",label:"👥 Both"}].map(g=>(
              <button key={g.id} onClick={()=>setGenderCapability(g.id)} style={{flex:1,padding:"9px 4px",borderRadius:8,border:`2px solid ${genderCapability===g.id?"#1a1a2e":"#e2e8f0"}`,background:genderCapability===g.id?"#1a1a2e":"#fff",color:genderCapability===g.id?"#fff":"#555",fontSize:12,fontWeight:700,cursor:"pointer",fontFamily:"inherit"}}>{g.label}</button>
            ))}
          </div>
        </div>
        <div style={S.fg}><label style={S.label}>PIN (4 digits)</label><input style={S.input} type="number" maxLength={4} value={pin} onChange={e=>setPin(e.target.value.slice(0,4))}/></div>
        <div style={S.ma}><button style={S.bc} onClick={onClose} disabled={saving}>Cancel</button><button style={{...S.bs,opacity:saving?0.6:1}} onClick={handleSave} disabled={saving}>{saving?"Saving...":"✓ Save"}</button></div>
        {!confirmDelete
          ?<button onClick={()=>setConfirmDelete(true)} style={{width:"100%",marginTop:10,padding:10,border:"1px solid #fecaca",background:"white",borderRadius:10,fontSize:13,fontWeight:700,color:"#dc2626",cursor:"pointer"}}>🗑 Remove Staff</button>
          :<div style={{marginTop:10,background:"#fef2f2",borderRadius:10,padding:12}}>
            <div style={{fontSize:13,color:"#dc2626",fontWeight:600,marginBottom:10}}>Are you sure you want to delete?</div>
            <div style={{display:"flex",gap:8}}>
              <button onClick={()=>setConfirmDelete(false)} style={{flex:1,padding:9,border:"1px solid #e2e8f0",background:"white",borderRadius:8,fontSize:13,cursor:"pointer"}}>Cancel</button>
              <button onClick={()=>{onDelete(staff.id);onClose();}} style={{flex:1,padding:9,border:"none",background:"#dc2626",borderRadius:8,fontSize:13,fontWeight:700,color:"white",cursor:"pointer"}}>Delete</button>
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
    if(!clientName.trim()){alert("Please enter the client name!");return;}
    onSave({...log,clientName:clientName.trim(),service,amount:Number(amount),date});
    onClose();
  }
  return(
    <div style={S.modalBg} onClick={e=>e.target===e.currentTarget&&onClose()}>
      <div style={S.modal}>
        <div style={S.modalTitle}>✏️ Edit Entry</div>
        <div style={S.fr}>
          <div style={S.fg}><label style={S.label}>Client Name</label><input style={S.input} value={clientName} onChange={e=>setClientName(e.target.value)}/></div>
          <div style={S.fg}><label style={S.label}>Date</label><input style={S.input} type="date" value={date} onChange={e=>setDate(e.target.value)}/></div>
        </div>
        <div style={S.fr}>
          <div style={S.fg}><label style={S.label}>Service</label><select style={S.input} value={service} onChange={e=>setService(e.target.value)}>{SERVICES.map(s=><option key={s}>{s}</option>)}</select></div>
          <div style={S.fg}><label style={S.label}>Amount</label><input style={S.input} type="number" value={amount} onChange={e=>setAmount(e.target.value)}/></div>
        </div>
        <div style={S.ma}><button style={S.bc} onClick={onClose}>Cancel</button><button style={S.bs} onClick={handleSave}>✓ Save</button></div>
        {!confirmDelete
          ?<button onClick={()=>setConfirmDelete(true)} style={{width:"100%",marginTop:10,padding:10,border:"1px solid #fecaca",background:"white",borderRadius:10,fontSize:13,fontWeight:700,color:"#dc2626",cursor:"pointer"}}>🗑 Delete Entry</button>
          :<div style={{marginTop:10,background:"#fef2f2",borderRadius:10,padding:12}}>
            <div style={{fontSize:13,color:"#dc2626",fontWeight:600,marginBottom:10}}>Are you sure?</div>
            <div style={{display:"flex",gap:8}}>
              <button onClick={()=>setConfirmDelete(false)} style={{flex:1,padding:9,border:"1px solid #e2e8f0",background:"white",borderRadius:8,fontSize:13,cursor:"pointer"}}>Cancel</button>
              <button onClick={()=>{onDelete(log.id);onClose();}} style={{flex:1,padding:9,border:"none",background:"#dc2626",borderRadius:8,fontSize:13,fontWeight:700,color:"white",cursor:"pointer"}}>Delete</button>
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
    <div style={{display:"flex",flexDirection:"column",height:"100%",background:"#f5f5f0",fontFamily:"'Segoe UI',sans-serif"}}>
      <div style={{...S.hdr,flexShrink:0}}>
        <button onClick={onBack} style={S.backBtn}>← Back</button>
        <div style={{textAlign:"center"}}><div style={S.hdrT}>Salary Slip</div><div style={S.hdrS}>{staff.name}</div></div>
        <div style={{width:60}}/>
      </div>
      <div style={{flex:1,overflowY:"auto",WebkitOverflowScrolling:"touch",padding:"14px"}}>
        <div style={S.fg}><label style={S.label}>Month</label><input style={S.input} type="month" value={slipMonth} onChange={e=>setSlipMonth(e.target.value)}/></div>
        <div style={{background:"white",border:"0.5px solid #e8e8e0",borderRadius:14,padding:"14px"}}>
          <div style={{display:"flex",alignItems:"center",gap:12,marginBottom:14,paddingBottom:12,borderBottom:"0.5px solid #f1f5f9"}}>
            <div style={{...S.av,width:48,height:48,fontSize:16,background:c.bg,color:c.text}}>{initials(staff.name)}</div>
            <div><div style={{fontSize:15,fontWeight:800}}>{staff.name}</div><div style={{fontSize:12,color:"#888"}}>{staff.role}</div></div>
          </div>
          <div style={{fontSize:13,fontWeight:700,textAlign:"center",marginBottom:12}}>{monthLabel} Salary</div>
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:8,marginBottom:14}}>
            <div style={{background:"#f0fdf4",borderRadius:10,padding:"10px",textAlign:"center"}}><div style={{fontSize:22,fontWeight:800,color:"#16a34a"}}>{presentDays}</div><div style={{fontSize:10,color:"#166534"}}>Present</div></div>
            <div style={{background:"#fef2f2",borderRadius:10,padding:"10px",textAlign:"center"}}><div style={{fontSize:22,fontWeight:800,color:"#dc2626"}}>{absentDays}</div><div style={{fontSize:10,color:"#991b1b"}}>Absent</div></div>
            <div style={{background:"#f8fafc",borderRadius:10,padding:"10px",textAlign:"center"}}><div style={{fontSize:22,fontWeight:800}}>{totalDaysInMonth}</div><div style={{fontSize:10,color:"#555"}}>Total Days</div></div>
          </div>
          <div style={{background:"#f8fafc",borderRadius:10,padding:"12px",marginBottom:12}}>
            {[{label:"Fixed Salary",value:fc(staff.salary),color:"#1a1a2e"},{label:"Earned",value:fc(earnedSalary),color:"#16a34a"},{label:"Deduction",value:"- "+fc(deduction),color:"#dc2626"}].map(row=>(
              <div key={row.label} style={{display:"flex",justifyContent:"space-between",padding:"6px 0",borderBottom:"0.5px solid #e8e8e0"}}>
                <div style={{fontSize:12,color:"#555"}}>{row.label}</div>
                <div style={{fontSize:13,fontWeight:700,color:row.color}}>{row.value}</div>
              </div>
            ))}
            <div style={{display:"flex",justifyContent:"space-between",marginTop:10,background:"#1a1a2e",borderRadius:8,padding:"10px 12px"}}>
              <div style={{fontSize:13,fontWeight:700,color:"white"}}>Net Payable</div>
              <div style={{fontSize:18,fontWeight:800,color:"#4ade80"}}>{fc(earnedSalary)}</div>
            </div>
          </div>
          <div style={{background:"#f0f9ff",borderRadius:10,padding:"12px"}}>
            <div style={{display:"flex",justifyContent:"space-between"}}><div style={{fontSize:13,color:"#555"}}>Total Clients</div><div style={{fontSize:13,fontWeight:700}}>{monthLogs.length}</div></div>
            <div style={{display:"flex",justifyContent:"space-between",marginTop:4}}><div style={{fontSize:13,color:"#555"}}>Revenue</div><div style={{fontSize:13,fontWeight:700,color:"#16a34a"}}>{fc(totalRevenue)}</div></div>
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
        <div style={{display:"flex",alignItems:"center",gap:10,marginBottom:14,flexShrink:0}}>
          <div style={{...S.av,background:c.bg,color:c.text,width:38,height:38,fontSize:12}}>{initials(staff.name)}</div>
          <div style={{flex:1}}>
            <div style={{fontSize:14,fontWeight:800,color:"#1a1a2e"}}>{staff.name} — Revenue</div>
            <div style={{fontSize:11,color:"#888"}}>{fd(fromDate)} → {fd(toDate)}</div>
          </div>
          <button onClick={onClose} style={{background:"#f1f5f9",border:"none",borderRadius:8,padding:"6px 10px",fontSize:13,cursor:"pointer",color:"#555",fontWeight:700}}>✕</button>
        </div>
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8,marginBottom:14,flexShrink:0}}>
          <div style={{background:"#f0fdf4",borderRadius:10,padding:"12px",textAlign:"center"}}>
            <div style={{fontSize:20,fontWeight:900,color:"#16a34a"}}>{fc(total)}</div>
            <div style={{fontSize:10,color:"#888",marginTop:2}}>Total Revenue</div>
          </div>
          <div style={{background:"#eff6ff",borderRadius:10,padding:"12px",textAlign:"center"}}>
            <div style={{fontSize:20,fontWeight:900,color:"#2563eb"}}>{rangeLogs.length}</div>
            <div style={{fontSize:10,color:"#888",marginTop:2}}>Total Clients</div>
          </div>
        </div>
        <div style={{flex:1,overflowY:"auto",WebkitOverflowScrolling:"touch"}}>
          {rangeLogs.length===0
            ?<div style={{textAlign:"center",color:"#aaa",padding:"24px 0",fontSize:13}}>No entries yet</div>
            :rangeLogs.map((log,i)=>(
              <div key={log.id} style={{display:"flex",alignItems:"center",gap:10,padding:"10px 0",borderBottom:i<rangeLogs.length-1?"1px solid #f0f4f8":"none"}}>
                <div style={{width:34,height:34,borderRadius:10,background:"#f0fdf4",display:"flex",alignItems:"center",justifyContent:"center",fontSize:14,flexShrink:0}}>✂️</div>
                <div style={{flex:1,minWidth:0}}>
                  <div style={{fontSize:13,fontWeight:700,color:"#1a1a2e",overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{log.clientName}</div>
                  <div style={{fontSize:11,color:"#888",marginTop:1}}>{log.service} · {fdFull(log.date)}</div>
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
        <div style={{display:"flex",alignItems:"center",gap:10,marginBottom:14,flexShrink:0}}>
          <div style={{...S.av,background:c.bg,color:c.text,width:38,height:38,fontSize:12}}>{initials(staff.name)}</div>
          <div style={{flex:1}}>
            <div style={{fontSize:14,fontWeight:800,color:"#1a1a2e"}}>{staff.name} — Attendance</div>
            <div style={{fontSize:11,color:"#888"}}>{fd(fromDate)} → {fd(toDate)}</div>
          </div>
          <button onClick={onClose} style={{background:"#f1f5f9",border:"none",borderRadius:8,padding:"6px 10px",fontSize:13,cursor:"pointer",color:"#555",fontWeight:700}}>✕</button>
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
          <div style={{background:attPct>=80?"#f0fdf4":attPct>=60?"#fef9c3":"#fef2f2",borderRadius:10,padding:"10px",textAlign:"center"}}>
            <div style={{fontSize:20,fontWeight:800,color:attPct>=80?"#16a34a":attPct>=60?"#a16207":"#dc2626"}}>{attPct}%</div>
            <div style={{fontSize:9,color:"#888"}}>Attendance</div>
          </div>
        </div>
        <div style={{background:"#f0f4f8",borderRadius:20,height:6,overflow:"hidden",marginBottom:14,flexShrink:0}}>
          <div style={{width:`${attPct}%`,height:"100%",background:attPct>=80?"#22c55e":attPct>=60?"#f59e0b":"#ef4444",borderRadius:20}}/>
        </div>
        <div style={{flex:1,overflowY:"auto",WebkitOverflowScrolling:"touch"}}>
          <div style={{fontSize:12,fontWeight:700,color:"#888",marginBottom:10}}>📅 Din-wise Record</div>
          <div style={{display:"flex",flexWrap:"wrap",gap:6,marginBottom:14}}>
            {dates.map(d=>{
              const isP=!!(attendance[d]||{})[staff.id];
              const reason=(attendance[d]||{})[staff.id+"_reason"];
              return(
                <div key={d} title={reason?`Reason: ${reason}`:""}
                  style={{background:isP?"#dcfce7":"#fee2e2",border:`1.5px solid ${isP?"#86efac":"#fca5a5"}`,borderRadius:8,padding:"6px 8px",textAlign:"center",minWidth:40,outline:d===today?"2px solid #1a1a2e":"none"}}>
                  <div style={{fontSize:11,fontWeight:800,color:isP?"#16a34a":"#dc2626"}}>{new Date(d+"T00:00:00").getDate()}</div>
                  <div style={{fontSize:9,color:isP?"#16a34a":"#dc2626"}}>{isP?"✓":"✗"}</div>
                </div>
              );
            })}
          </div>
          {dates.some(d=>!(attendance[d]||{})[staff.id]&&(attendance[d]||{})[staff.id+"_reason"])&&(
            <div>
              <div style={{fontSize:12,fontWeight:700,color:"#888",marginBottom:8}}>📝 Absent Reasons</div>
              {dates.filter(d=>!(attendance[d]||{})[staff.id]&&(attendance[d]||{})[staff.id+"_reason"]).map(d=>(
                <div key={d} style={{background:"#fef2f2",borderRadius:8,padding:"8px 10px",marginBottom:6,display:"flex",gap:8}}>
                  <div style={{fontSize:11,fontWeight:700,color:"#dc2626",flexShrink:0}}>{fd(d)}</div>
                  <div style={{fontSize:11,color:"#555"}}>{(attendance[d]||{})[staff.id+"_reason"]}</div>
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

  const NP={purple:"#1e1b4b",purpleMid:"#7c3aed",purpleLight:"#ede9fe",bg:"#f5f3ff",white:"#ffffff",text:"#1e1b4b",muted:"#6b7280",border:"#e5e7eb",green:"#16a34a",red:"#ef4444",blue:"#2563eb"};

  return(
    <div style={{display:"flex",flexDirection:"column",height:"100%",background:NP.bg,fontFamily:"system-ui,sans-serif"}}>

      {/* Dark purple header */}
      <div style={{background:NP.purple,padding:"14px 16px",display:"flex",alignItems:"center",justifyContent:"space-between",flexShrink:0}}>
        <button onClick={onBack} style={{background:"rgba(255,255,255,0.12)",border:"none",borderRadius:10,padding:"7px 14px",display:"flex",alignItems:"center",gap:6,cursor:"pointer"}}>
          <span style={{fontSize:15,color:"#fff"}}>←</span>
          <span style={{fontSize:13,color:"#fff",fontWeight:500}}>Back</span>
        </button>
        <div style={{textAlign:"center"}}>
          <div style={{fontWeight:700,fontSize:16,color:"#fff"}}>📊 Staff Summary</div>
          <div style={{fontSize:11,color:"rgba(255,255,255,0.6)",marginTop:1}}>Performance Overview</div>
        </div>
        <div style={{width:80}}/>
      </div>

      <div style={{flex:1,overflowY:"auto",WebkitOverflowScrolling:"touch",padding:"14px 16px"}}>

        {/* Period pills */}
        <div style={{display:"flex",gap:8,marginBottom:10}}>
          {[["Daily",today,today],["Weekly",thisWeekStart,today],["Monthly",thisMonthStart,today]].map(([label,from,to])=>{
            const active=fromDate===from&&toDate===to;
            return(<button key={label} onClick={()=>{setFromDate(from);setToDate(to);}} style={{background:active?NP.purpleMid:NP.white,border:active?"none":`1px solid ${NP.border}`,borderRadius:20,padding:"7px 18px",fontSize:13,color:active?"#fff":NP.text,fontWeight:active?600:500,cursor:"pointer"}}>{label}</button>);
          })}
        </div>

        {/* Date range */}
        <div style={{display:"flex",gap:8,alignItems:"center",marginBottom:14}}>
          <div style={{flex:1,background:NP.white,border:`1px solid ${NP.border}`,borderRadius:10,padding:"9px 12px",display:"flex",alignItems:"center",gap:6}}>
            <span style={{fontSize:14}}>📅</span>
            <input type="date" value={fromDate} onChange={e=>setFromDate(e.target.value)} style={{border:"none",outline:"none",flex:1,fontSize:12,color:NP.text,background:"transparent"}}/>
          </div>
          <span style={{color:NP.muted,fontSize:14}}>→</span>
          <div style={{flex:1,background:NP.white,border:`1px solid ${NP.border}`,borderRadius:10,padding:"9px 12px",display:"flex",alignItems:"center",gap:6}}>
            <span style={{fontSize:14}}>📅</span>
            <input type="date" value={toDate} onChange={e=>setToDate(e.target.value)} style={{border:"none",outline:"none",flex:1,fontSize:12,color:NP.text,background:"transparent"}}/>
          </div>
        </div>

        {/* 3 Stat Cards */}
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:7,marginBottom:12}}>
          <div style={{background:"#f0fdf4",borderRadius:10,padding:"10px 6px",textAlign:"center",border:"1px solid #bbf7d0"}}>
            <div style={{fontSize:15,marginBottom:3}}>💰</div>
            <div style={{fontSize:15,fontWeight:700,color:NP.green,lineHeight:1}}>{fc(totalRevenue)}</div>
            <div style={{fontSize:9,color:NP.green,marginTop:3,fontWeight:500}}>Total Revenue</div>
          </div>
          <div style={{background:"#eff6ff",borderRadius:10,padding:"10px 6px",textAlign:"center",border:"1px solid #bfdbfe"}}>
            <div style={{fontSize:15,marginBottom:3}}>👥</div>
            <div style={{fontSize:15,fontWeight:700,color:NP.blue,lineHeight:1}}>{totalClients}</div>
            <div style={{fontSize:9,color:NP.blue,marginTop:3,fontWeight:500}}>Total Clients</div>
          </div>
          <div style={{background:avgAtt>=80?"#f0fdf4":avgAtt>=60?"#fef9c3":"#fff5f5",borderRadius:10,padding:"10px 6px",textAlign:"center",border:`1px solid ${avgAtt>=80?"#bbf7d0":avgAtt>=60?"#fcd34d":"#fca5a5"}`}}>
            <div style={{fontSize:15,marginBottom:3}}>📅</div>
            <div style={{fontSize:15,fontWeight:700,color:avgAtt>=80?NP.green:avgAtt>=60?"#a16207":NP.red,lineHeight:1}}>{avgAtt}%</div>
            <div style={{fontSize:9,color:avgAtt>=80?NP.green:avgAtt>=60?"#a16207":NP.red,marginTop:3,fontWeight:500}}>Avg. Attendance</div>
          </div>
        </div>

        {/* Staff ranking cards */}
        {sorted.length===0&&<div style={{textAlign:"center",color:NP.muted,padding:"32px 0",fontSize:13}}>No staff found</div>}
        {sorted.map((s,idx)=>{
          const c=avatarColor(s.id);
          const revenueShare=totalRevenue>0?Math.round((s.revenue/totalRevenue)*100):0;
          return(
            <div key={s.id} style={{background:NP.white,borderRadius:16,border:`1.5px solid ${idx===0?"#fde68a":NP.border}`,padding:"10px 12px",marginBottom:8,boxShadow:idx===0?"0 2px 8px rgba(251,191,36,0.12)":"none"}}>
              <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:8}}>
                <span style={{fontSize:idx<3?18:12,width:22,textAlign:"center",flexShrink:0}}>{idx<3?rankMedals[idx]:`#${idx+1}`}</span>
                <div style={{width:34,height:34,borderRadius:"50%",background:c.bg,color:c.text,display:"flex",alignItems:"center",justifyContent:"center",fontWeight:700,fontSize:12,flexShrink:0}}>{initials(s.name)}</div>
                <div style={{flex:1,minWidth:0}}>
                  <div style={{fontSize:13,fontWeight:700,color:NP.text,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{s.name}</div>
                  <div style={{fontSize:10,color:NP.muted}}>{s.role}</div>
                </div>
                <div style={{background:s.attPct>=80?"#dcfce7":s.attPct>=60?"#fef9c3":"#fee2e2",color:s.attPct>=80?NP.green:s.attPct>=60?"#a16207":NP.red,fontSize:10,fontWeight:700,padding:"3px 8px",borderRadius:20,flexShrink:0}}>{s.attPct}%</div>
              </div>

              {/* 4 compact mini stats */}
              <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr 1fr",gap:5,marginBottom:8}}>
                <div onClick={()=>setRevenueModal(s)} style={{background:"#f0fdf4",borderRadius:8,padding:"7px 4px",textAlign:"center",cursor:"pointer",border:"1px solid #bbf7d0"}}>
                  <div style={{fontSize:11,fontWeight:700,color:NP.green}}>{s.revenue>=1000?`₹${(s.revenue/1000).toFixed(1)}k`:fc(s.revenue)}</div>
                  <div style={{fontSize:8,color:NP.muted,marginTop:2}}>Revenue</div>
                </div>
                <div onClick={()=>setRevenueModal(s)} style={{background:"#eff6ff",borderRadius:10,padding:"10px 4px",textAlign:"center",cursor:"pointer",border:"1px solid #bfdbfe"}}>
                  <div style={{fontSize:12,fontWeight:700,color:NP.blue}}>{s.clients}</div>
                  <div style={{fontSize:9,color:NP.muted,marginTop:2}}>Clients</div>
                </div>
                <div onClick={()=>setAttModal(s)} style={{background:"#f0fdf4",borderRadius:10,padding:"10px 4px",textAlign:"center",cursor:"pointer",border:"1px solid #86efac"}}>
                  <div style={{fontSize:12,fontWeight:700,color:NP.green}}>{s.presentDays}</div>
                  <div style={{fontSize:9,color:NP.muted,marginTop:2}}>Present</div>
                </div>
                <div onClick={()=>setAttModal(s)} style={{background:"#fff5f5",borderRadius:10,padding:"10px 4px",textAlign:"center",cursor:"pointer",border:"1px solid #fca5a5"}}>
                  <div style={{fontSize:12,fontWeight:700,color:NP.red}}>{s.absentDays}</div>
                  <div style={{fontSize:9,color:NP.muted,marginTop:2}}>Absent</div>
                </div>
              </div>

              {/* Revenue share bar */}
              <div style={{display:"flex",justifyContent:"space-between",marginBottom:5}}>
                <span style={{fontSize:11,color:NP.muted}}>Revenue Share</span>
                <span style={{fontSize:11,fontWeight:700,color:NP.green}}>{revenueShare}%</span>
              </div>
              <div style={{background:"#f0f4f8",borderRadius:20,height:4,overflow:"hidden"}}>
                <div style={{width:`${revenueShare}%`,height:"100%",background:"linear-gradient(90deg,#22c55e,#86efac)",borderRadius:20}}/>
              </div>
            </div>
          );
        })}
        <div style={{height:40}}/>
      </div>
      {revenueModal&&<RevenueModal staff={revenueModal} logs={logs} fromDate={fromDate} toDate={toDate} onClose={()=>setRevenueModal(null)}/>}
      {attModal&&<AttendanceModal staff={attModal} attendance={attendance} fromDate={fromDate} toDate={toDate} onClose={()=>setAttModal(null)}/>}
    </div>
  );
}

// ─── Staff Detail Screen — REDESIGNED ─────────────────────────────────────────
function StaffDetailScreen({staff,logs,setLogs,attendance,onBack,onAddLog,onEditStaff,onDeleteStaff,currentUser}){
  const [fromDate,setFromDate]=useState(thisMonthStart);
  const [toDate,setToDate]=useState(today);
  const [editingLog,setEditingLog]=useState(null);
  const [showSalarySlip,setShowSalarySlip]=useState(false);
  const [showEditStaff,setShowEditStaff]=useState(false);
  const [showAttModal,setShowAttModal]=useState(false);
  const [showRevenueModal,setShowRevenueModal]=useState(false);
  const c=avatarColor(staff.id);
  const isOwner=staff.role==="Owner";

  const filtered=useMemo(()=>{
    return logs.filter(l=>l.staffId===staff.id&&l.date>=fromDate&&l.date<=toDate).sort((a,b)=>b.date.localeCompare(a.date));
  },[logs,fromDate,toDate,staff.id]);

  const totalRevenue=filtered.reduce((s,l)=>s+l.amount,0);

  // Attendance count (only past dates)
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

  const NP={purple:"#1e1b4b",purpleMid:"#7c3aed",purpleLight:"#ede9fe",purpleBorder:"#ddd6fe",bg:"#f5f3ff",white:"#ffffff",text:"#1e1b4b",muted:"#6b7280",light:"#9ca3af",border:"#e5e7eb",green:"#16a34a",greenBg:"#f0fdf4",red:"#ef4444",redBg:"#fff5f5"};

  return(
    <div style={{display:"flex",flexDirection:"column",height:"100%",background:NP.bg,fontFamily:"system-ui,sans-serif"}}>

      {/* Dark purple header */}
      <div style={{background:NP.purple,padding:"14px 16px",display:"flex",alignItems:"center",justifyContent:"space-between",flexShrink:0}}>
        <button onClick={onBack} style={{background:"rgba(255,255,255,0.12)",border:"none",borderRadius:10,padding:"7px 14px",display:"flex",alignItems:"center",gap:6,cursor:"pointer"}}>
          <span style={{fontSize:15,color:"#fff"}}>←</span>
          <span style={{fontSize:13,color:"#fff",fontWeight:500}}>Back</span>
        </button>
        <span style={{fontSize:16,fontWeight:700,color:"#fff"}}>Staff Profile</span>
        <button onClick={()=>setShowEditStaff(true)} style={{background:"rgba(255,255,255,0.12)",border:"none",borderRadius:10,padding:"7px 14px",cursor:"pointer"}}>
          <span style={{fontSize:13,color:"#fff",fontWeight:500}}>✏️ Edit</span>
        </button>
      </div>

      <div style={{flex:1,overflowY:"auto",WebkitOverflowScrolling:"touch",padding:"14px 16px"}}>

        {/* Profile Card */}
        <div style={{background:NP.white,borderRadius:16,padding:16,border:`1px solid ${NP.border}`,display:"flex",alignItems:"center",gap:14,marginBottom:12}}>
          <div style={{position:"relative",flexShrink:0}}>
            <div style={{width:58,height:58,borderRadius:"50%",background:c.bg,color:c.text,display:"flex",alignItems:"center",justifyContent:"center",fontWeight:700,fontSize:20}}>{initials(staff.name)}</div>
            <span style={{position:"absolute",bottom:2,right:2,width:14,height:14,borderRadius:"50%",background:NP.green,border:"2px solid white"}}/>
          </div>
          <div style={{flex:1,minWidth:0}}>
            <div style={{fontWeight:700,fontSize:17,color:NP.text}}>{staff.name}</div>
            <div style={{fontSize:12,color:NP.muted,marginTop:1}}>{staff.role}</div>
            {staff.phone&&<div style={{fontSize:12,color:NP.muted,marginTop:3}}>📞 {staff.phone}</div>}
            <div style={{fontSize:13,fontWeight:700,color:NP.green,marginTop:4}}>{fc(staff.salary||0)}/mo</div>
          </div>
          <button onClick={()=>setShowSalarySlip(true)} style={{background:NP.white,border:`1px solid ${NP.border}`,borderRadius:12,padding:"10px 10px",textAlign:"center",flexShrink:0,cursor:"pointer",minWidth:64}}>
            <div style={{fontSize:20,marginBottom:3}}>🧾</div>
            <div style={{fontSize:10,color:NP.purpleMid,fontWeight:600,lineHeight:1.3}}>Salary<br/>Slip</div>
          </button>
        </div>

        {/* Date Range */}
        <div style={{marginBottom:12}}>
          <DateRangePicker fromDate={fromDate} toDate={toDate} onFromChange={setFromDate} onToChange={setToDate}/>
        </div>

        {/* Stat boxes — 2 for owner (no attendance), 3 for staff */}
        <div style={{display:"grid",gridTemplateColumns:isOwner?"1fr 1fr":"1fr 1fr 1fr",gap:8,marginBottom:12}}>
          <div onClick={()=>setShowRevenueModal(true)} style={{background:NP.greenBg,borderRadius:14,padding:"14px 8px",textAlign:"center",cursor:"pointer"}}>
            <div style={{fontSize:22,fontWeight:700,color:NP.green}}>{filtered.length}</div>
            <div style={{fontSize:10,color:NP.green,marginTop:4,fontWeight:500}}>Clients 👥</div>
          </div>
          <div onClick={()=>setShowRevenueModal(true)} style={{background:"#eff6ff",borderRadius:14,padding:"14px 8px",textAlign:"center",cursor:"pointer",border:`1px solid #dbeafe`}}>
            <div style={{fontSize:filtered.length>0&&totalRevenue>=10000?13:20,fontWeight:700,color:"#2563eb"}}>{fc(totalRevenue)}</div>
            <div style={{fontSize:10,color:"#2563eb",marginTop:4,fontWeight:500}}>Revenue 💰</div>
          </div>
          {!isOwner&&<div onClick={()=>setShowAttModal(true)} style={{background:attPct>=80?NP.greenBg:attPct>=60?"#fef9c3":NP.redBg,borderRadius:14,padding:"14px 8px",textAlign:"center",cursor:"pointer"}}>
            <div style={{fontSize:22,fontWeight:700,color:attPct>=80?NP.green:attPct>=60?"#a16207":NP.red}}>{attPct}%</div>
            <div style={{fontSize:10,color:attPct>=80?NP.green:attPct>=60?"#a16207":NP.red,marginTop:4,fontWeight:500}}>Attendance 📅</div>
          </div>}
        </div>

        {/* Attendance bar — staff only */}
        {!isOwner&&<div style={{background:NP.white,borderRadius:12,padding:"12px 14px",border:`1px solid ${NP.border}`,marginBottom:12}}>
          <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:8}}>
            <span style={{fontSize:12,color:NP.green,fontWeight:600}}>● {attendedDays} days present</span>
            <span style={{fontSize:12,color:NP.red,fontWeight:600}}>{totalDays-attendedDays} days absent ●</span>
          </div>
          <div style={{height:7,background:"#fee2e2",borderRadius:4,overflow:"hidden"}}>
            <div style={{width:`${attPct}%`,height:"100%",background:NP.green,borderRadius:4,transition:"width 0.5s"}}/>
          </div>
        </div>}

        {/* Action buttons — 2 for owner (no attendance), 3 for staff */}
        <div style={{display:"grid",gridTemplateColumns:isOwner?"1fr 1fr":"1fr 1fr 1fr",gap:8,marginBottom:14}}>
          <button onClick={()=>{if(staff.phone)window.open(`https://wa.me/91${staff.phone.replace(/\D/g,"")}`)}} style={{background:NP.white,border:`1px solid ${NP.border}`,borderRadius:12,padding:"12px 8px",display:"flex",flexDirection:"column",alignItems:"center",gap:5,cursor:"pointer"}}>
            <span style={{fontSize:20}}>💬</span>
            <span style={{fontSize:12,color:NP.purpleMid,fontWeight:500}}>Message</span>
          </button>
          {!isOwner&&<button onClick={()=>setShowAttModal(true)} style={{background:NP.white,border:`1px solid ${NP.border}`,borderRadius:12,padding:"12px 8px",display:"flex",flexDirection:"column",alignItems:"center",gap:5,cursor:"pointer"}}>
            <span style={{fontSize:20}}>📅</span>
            <span style={{fontSize:12,color:NP.purpleMid,fontWeight:500}}>Attendance</span>
          </button>}
          <button onClick={()=>setShowRevenueModal(true)} style={{background:NP.white,border:`1px solid ${NP.border}`,borderRadius:12,padding:"12px 8px",display:"flex",flexDirection:"column",alignItems:"center",gap:5,cursor:"pointer"}}>
            <span style={{fontSize:20}}>📊</span>
            <span style={{fontSize:12,color:NP.purpleMid,fontWeight:500}}>Revenue</span>
          </button>
        </div>

        {/* Work Entries */}
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:10}}>
          <div style={{fontSize:16,fontWeight:700,color:NP.text}}>Work Entries</div>
          <button onClick={onAddLog} style={{background:NP.purpleMid,color:NP.white,border:"none",borderRadius:10,padding:"8px 16px",fontSize:12,fontWeight:600,cursor:"pointer"}}>+ Add Entry</button>
        </div>

        {filtered.length===0
          ?<div style={{background:NP.white,borderRadius:14,padding:32,border:`1px solid ${NP.border}`,textAlign:"center"}}>
            <div style={{fontSize:32,marginBottom:8}}>📋</div>
            <div style={{fontSize:14,fontWeight:600,color:NP.text,marginBottom:4}}>No entries yet</div>
            <div style={{fontSize:12,color:NP.light}}>When work is assigned, it will appear here.</div>
          </div>
          :filtered.map(log=>(
            <div key={log.id} onClick={()=>setEditingLog(log)} style={{background:NP.white,borderRadius:12,border:`1px solid ${NP.border}`,padding:"12px 14px",display:"flex",alignItems:"center",gap:12,marginBottom:8,cursor:"pointer"}}>
              <div style={{width:38,height:38,borderRadius:10,background:NP.purpleLight,display:"flex",alignItems:"center",justifyContent:"center",fontSize:16,flexShrink:0}}>✂️</div>
              <div style={{flex:1,minWidth:0}}>
                <div style={{fontSize:13,fontWeight:700,color:NP.text,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{log.clientName}</div>
                <div style={{fontSize:11,color:NP.muted,marginTop:2}}>{log.service} · {fd(log.date)}</div>
              </div>
              <div style={{fontSize:14,fontWeight:800,color:NP.green,flexShrink:0}}>{fc(log.amount)}</div>
            </div>
          ))
        }
      </div>

      {editingLog&&<EditLogModal log={editingLog} onSave={handleEditLog} onDelete={handleDeleteLog} onClose={()=>setEditingLog(null)}/>}
      {showEditStaff&&<EditStaffModal staff={staff} onSave={onEditStaff} onDelete={onDeleteStaff} onClose={()=>setShowEditStaff(false)}/>}
      {showAttModal&&<AttendanceModal staff={staff} attendance={attendance} fromDate={fromDate} toDate={toDate} onClose={()=>setShowAttModal(false)}/>}
      {showRevenueModal&&<RevenueModal staff={staff} logs={logs} fromDate={fromDate} toDate={toDate} onClose={()=>setShowRevenueModal(false)}/>}
    </div>
  );
}

// ─── Owner Dashboard ───────────────────────────────────────────────────────────
// ─── Pending Approvals Screen ─────────────────────────────────────────────────
function PendingScreen({salonId,staffList,onClose,currentUser}){
  const[pending,setPending]=useState([]);
  const[loading,setLoading]=useState(true);
  const[processing,setProcessing]=useState(null);
  const[rejectId,setRejectId]=useState(null);
  const[reason,setReason]=useState("");
  const[approvalOn,setApprovalOn]=useState(false);

  const staffName={};
  staffList.forEach(s=>{staffName[s.id]=s.name;});

  useEffect(()=>{
    async function load(){
      const[logsRes,salonRes]=await Promise.all([
        supabase.from("work_logs").select("*").eq("salon_id",salonId).eq("status","pending").order("created_at",{ascending:false}),
        supabase.from("salons").select("approval_required").eq("id",salonId).single()
      ]);
      setPending(logsRes.data||[]);
      setApprovalOn(salonRes.data?.approval_required||false);
      setLoading(false);
    }
    load();
  },[salonId]);

  async function toggleApproval(){
    const newVal=!approvalOn;
    setApprovalOn(newVal);
    await supabase.from("salons").update({approval_required:newVal}).eq("id",salonId);
  }

  async function approve(id){
    setProcessing(id);
    await supabase.from("work_logs").update({status:"approved"}).eq("id",id);
    setPending(prev=>prev.filter(l=>l.id!==id));
    setProcessing(null);

    // Re-fetch fresh — staff may have picked a WA template AFTER this list was loaded,
    // so the cached `pending` row in state could be stale.
    try{
      const{data:freshLog}=await supabase.from("work_logs").select("client_phone,template_type,client_name,service,amount,date,photos").eq("id",id).single();
      if(freshLog?.client_phone&&freshLog.client_phone.length===10&&freshLog.template_type){
        await fetch("/api/send-summary",{
          method:"POST",
          headers:{"Content-Type":"application/json"},
          body:JSON.stringify({
            customerPhone:freshLog.client_phone,
            customerName:freshLog.client_name,
            salonName:currentUser?.salon||"Salon",
            salonId:salonId,
            templateType:freshLog.template_type,
            visit:{date:freshLog.date,services:[freshLog.service],amount:freshLog.amount,notes:"",photos:freshLog.photos||[]}
          })
        });
      }
    }catch(e){console.error("[approve] auto WA send failed:",e.message);}
  }

  async function reject(id){
    setProcessing(id);
    await supabase.from("work_logs").update({status:"rejected",rejection_reason:reason}).eq("id",id);
    setPending(prev=>prev.filter(l=>l.id!==id));
    setProcessing(null);setRejectId(null);setReason("");
  }

  return(
    <div style={{position:"fixed",inset:0,background:"#f5f3ff",zIndex:300,display:"flex",flexDirection:"column",fontFamily:"system-ui,sans-serif"}}>
      {/* Header with toggle */}
      <div style={{background:"#fff",padding:"14px 18px 12px",display:"flex",alignItems:"center",justifyContent:"space-between",borderBottom:"1px solid #f1f0f5",flexShrink:0}}>
        <div style={{display:"flex",alignItems:"center",gap:10}}>
          <button onClick={onClose} style={{width:34,height:34,borderRadius:10,background:"#f5f3ff",border:"1px solid #e0d8ff",display:"flex",alignItems:"center",justifyContent:"center",fontSize:16,color:"#5b3fc4",cursor:"pointer",fontWeight:600}}>←</button>
          <div>
            <div style={{fontWeight:800,fontSize:16,color:"#0f0a2e"}}>⏳ Pending Approvals</div>
            <div style={{fontSize:11,color:"#9b8ec4",marginTop:2}}>{pending.length} logs awaiting approval</div>
          </div>
        </div>
        <div style={{display:"flex",flexDirection:"column",alignItems:"center",gap:3}}>
          <div onClick={toggleApproval} style={{width:44,height:24,borderRadius:12,background:approvalOn?"#7c3aed":"#d1d5db",position:"relative",cursor:"pointer",transition:"background 0.2s"}}>
            <div style={{width:18,height:18,borderRadius:"50%",background:"#fff",position:"absolute",top:3,left:approvalOn?23:3,transition:"left 0.2s",boxShadow:"0 1px 3px rgba(0,0,0,0.2)"}}/>
          </div>
          <span style={{fontSize:9,fontWeight:700,color:approvalOn?"#7c3aed":"#9ca3af"}}>{approvalOn?"ON":"OFF"}</span>
        </div>
      </div>

      {/* Content */}
      <div style={{flex:1,overflowY:"auto",WebkitOverflowScrolling:"touch",padding:"14px 16px"}}>
        {loading?<div style={{padding:32,textAlign:"center",color:"#9b8ec4"}}>Loading...</div>
        :pending.length===0?(
          <div style={{textAlign:"center",padding:"48px 24px"}}>
            <div style={{fontSize:40,marginBottom:12}}>✅</div>
            <div style={{fontSize:15,fontWeight:800,color:"#0f0a2e"}}>Sab approve ho gaya!</div>
            <div style={{fontSize:12,color:"#9b8ec4",marginTop:4}}>Koi pending log nahi hai</div>
          </div>
        ):pending.map(log=>(
          <div key={log.id} style={{background:"#fff",border:"1.5px solid #fde68a",borderRadius:14,padding:"14px",marginBottom:10}}>
            {rejectId===log.id?(
              <div>
                <div style={{fontSize:13,fontWeight:800,color:"#0f0a2e",marginBottom:8}}>Reject reason (optional):</div>
                <textarea value={reason} onChange={e=>setReason(e.target.value)} style={{width:"100%",padding:"9px 11px",border:"1.5px solid #e0d8ff",borderRadius:10,fontSize:13,fontFamily:"inherit",outline:"none",resize:"none",minHeight:70,boxSizing:"border-box"}} placeholder="Reason likhein..."/>
                <div style={{display:"flex",gap:8,marginTop:10}}>
                  <button onClick={()=>{setRejectId(null);setReason("");}} style={{flex:1,padding:"10px",border:"1.5px solid #e5e7eb",borderRadius:10,background:"#fff",fontSize:13,fontWeight:700,cursor:"pointer",fontFamily:"inherit",color:"#6b7280"}}>Cancel</button>
                  <button onClick={()=>reject(log.id)} disabled={processing===log.id} style={{flex:1,padding:"10px",border:"none",borderRadius:10,background:"#ef4444",color:"#fff",fontSize:13,fontWeight:800,cursor:"pointer",fontFamily:"inherit"}}>Confirm Reject</button>
                </div>
              </div>
            ):(
              <>
                <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:10}}>
                  <div>
                    <div style={{fontSize:14,fontWeight:800,color:"#0f0a2e"}}>{log.client_name}</div>
                    <div style={{fontSize:12,color:"#9b8ec4",marginTop:2}}>{log.service} · {staffName[log.staff_id]||"Staff"} · {new Date(log.date+"T00:00:00").toLocaleDateString("en-IN",{day:"numeric",month:"short"})}</div>
                  </div>
                  <div style={{fontSize:16,fontWeight:900,color:"#a16207"}}>₹{Number(log.amount||0).toLocaleString("en-IN")}</div>
                </div>
                <div style={{display:"flex",gap:8}}>
                  <button onClick={()=>approve(log.id)} disabled={processing===log.id} style={{flex:1,padding:"10px",background:"#f0fdf4",border:"1.5px solid #bbf7d0",borderRadius:10,color:"#16a34a",fontSize:13,fontWeight:800,cursor:"pointer",fontFamily:"inherit"}}>✓ Approve</button>
                  <button onClick={()=>setRejectId(log.id)} disabled={processing===log.id} style={{flex:1,padding:"10px",background:"#fff0f0",border:"1.5px solid #fca5a5",borderRadius:10,color:"#ef4444",fontSize:13,fontWeight:800,cursor:"pointer",fontFamily:"inherit"}}>✕ Reject</button>
                </div>
              </>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

function OwnerDashboard({staffList,setStaffList,logs,setLogs,attendance,setAttendance,showRevenueToStaff,setShowRevenueToStaff,currentUser,onBack,ownerStaff}){
  const [view,setView]=useState("list");
  const [selectedStaff,setSelectedStaff]=useState(null);
  const [showAddStaff,setShowAddStaff]=useState(false);
  const [showAddLog,setShowAddLog]=useState(false);
  const [logForStaff,setLogForStaff]=useState(null);
  const [nextLogId,setNextLogId]=useState(100);
  const [fromDate,setFromDate]=useState(today);
  const [toDate,setToDate]=useState(today);
  const [showSummary,setShowSummary]=useState(false);
  const [showPending,setShowPending]=useState(false);
  const [pendingCount,setPendingCount]=useState(0);

  useEffect(()=>{
    async function loadPendingCount(){
      if(!currentUser?.id)return;
      const{count}=await supabase.from("work_logs").select("id",{count:"exact",head:true}).eq("salon_id",currentUser.id).eq("status","pending");
      setPendingCount(count||0);
    }
    loadPendingCount();
  },[currentUser?.id,showPending]);

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
      const{data:res,error}=await supabase.from("staff").insert({salon_id:currentUser.id,name:data.name,role:data.role,phone:data.phone,salary:data.salary,pin:data.pin,gender_capability:data.gender_capability||"both"}).select().single();
      if(error){
        const msg=error.code==="23505"?"This phone number is already registered. Please use a different number.":"Failed to save staff: "+(error.message||"Unknown error");
        return{success:false,message:msg};
      }
      if(res){setStaffList(prev=>[...prev,res]);return{success:true};}
      return{success:false,message:"Could not save staff. Please try again."};
    }
    setStaffList(prev=>[...prev,{...data,id:Date.now()}]);
    return{success:true};
  }

  async function editStaff(updated){
    if(currentUser?.id&&typeof updated.id==="string"){
      const{error}=await supabase.from("staff").update({name:updated.name,role:updated.role,phone:updated.phone,salary:updated.salary,pin:updated.pin,gender_capability:updated.gender_capability||"both"}).eq("id",updated.id);
      if(error){
        const msg=error.code==="23505"?"This phone number is already registered. Please use a different number.":"Update failed: "+(error.message||"Unknown error");
        return{success:false,message:msg};
      }
    }
    setStaffList(prev=>prev.map(s=>s.id===updated.id?updated:s));
    return{success:true};
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
  if(showPending)return<PendingScreen salonId={currentUser?.id} staffList={staffList} onClose={()=>setShowPending(false)} currentUser={currentUser}/>;
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

  const NP={purple:"#1e1b4b",purpleMid:"#7c3aed",purpleLight:"#ede9fe",purpleBorder:"#ddd6fe",bg:"#f5f3ff",white:"#ffffff",text:"#1e1b4b",muted:"#6b7280",light:"#9ca3af",border:"#e5e7eb",green:"#16a34a",red:"#ef4444"};

  return(
    <div style={{display:"flex",flexDirection:"column",height:"100%",background:NP.bg,fontFamily:"system-ui,sans-serif"}}>

      {/* White Header — same style as other pages */}
      <div style={{background:NP.white,padding:"14px 18px 12px",display:"flex",alignItems:"center",justifyContent:"space-between",borderBottom:"1px solid #f1f0f5",flexShrink:0}}>
        <div style={{display:"flex",alignItems:"center",gap:10}}>
          {onBack&&<button onClick={onBack} style={{width:34,height:34,borderRadius:10,background:"#f5f3ff",border:"1px solid #e0d8ff",display:"flex",alignItems:"center",justifyContent:"center",fontSize:16,color:"#5b3fc4",cursor:"pointer",fontWeight:600}}>←</button>}
          <div>
            <div style={{fontWeight:800,fontSize:16,color:"#0f0a2e",letterSpacing:"-0.3px"}}>Staff Management</div>
            <div style={{fontSize:11,color:"#9b8ec4",marginTop:2,fontWeight:500}}>Manage your team performance</div>
          </div>
        </div>
        <div style={{display:"flex",gap:6}}>
          <button onClick={()=>setShowAddStaff(true)} style={{background:NP.purpleMid,color:"#fff",border:"none",borderRadius:9,padding:"7px 13px",fontSize:12,fontWeight:600,cursor:"pointer"}}>+ Add Staff</button>
          <button onClick={()=>setShowSummary(true)} style={{background:NP.white,color:NP.purpleMid,border:`1px solid ${NP.purpleBorder}`,borderRadius:9,padding:"7px 13px",fontSize:12,fontWeight:500,cursor:"pointer"}}>📈 Analytics</button>
        </div>
      </div>

      {/* Pending Banner - always visible */}
      <div onClick={()=>setShowPending(true)} style={{background:pendingCount>0?"#fef9c3":"#f5f3ff",borderBottom:"1.5px solid "+(pendingCount>0?"#fde68a":"#e0d8ff"),padding:"7px 18px",display:"flex",alignItems:"center",justifyContent:"space-between",cursor:"pointer",flexShrink:0}}>
        <div style={{display:"flex",alignItems:"center",gap:8}}>
          <span style={{fontSize:14}}>{pendingCount>0?"⏳":"⚙️"}</span>
          <div style={{fontSize:12,fontWeight:800,color:pendingCount>0?"#a16207":"#5b3fc4"}}>{pendingCount>0?(pendingCount+" Pending Log"+(pendingCount>1?"s":"")+" — Approval Needed"):"Pending Logs Settings"}</div>
        </div>
        <span style={{fontSize:14,color:pendingCount>0?"#a16207":"#9b8ec4"}}>›</span>
      </div>

      {/* Sub header — date filter + stats */}
      <div style={{padding:"10px 16px 0",background:NP.bg,flexShrink:0}}>
        <DateRangePicker fromDate={fromDate} toDate={toDate} onFromChange={setFromDate} onToChange={setToDate}/>

        {/* 3 Compact Stat Cards */}
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:6,margin:"10px 0 10px"}}>
          {[
            {icon:"👥",value:staffList.length,label:"Active Staff"},
            {icon:"💰",value:fc(rangeRevenue),label:"Revenue"},
            {icon:"✂️",value:rangeLogs.length,label:"Services"},
          ].map(c=>(
            <div key={c.label} style={{background:NP.white,borderRadius:10,border:`1px solid ${NP.border}`,padding:"8px 6px",display:"flex",alignItems:"center",gap:7}}>
              <div style={{width:26,height:26,borderRadius:"50%",background:NP.purpleLight,display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0,fontSize:12}}>{c.icon}</div>
              <div>
                <div style={{fontSize:14,fontWeight:700,color:NP.text,lineHeight:1}}>{c.value}</div>
                <div style={{fontSize:9,color:NP.muted,marginTop:2}}>{c.label}</div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Staff List */}
      <div style={{flex:1,overflowY:"auto",padding:"0 16px 80px",WebkitOverflowScrolling:"touch"}}>
        {/* Owner profile — always pinned at top */}
        {ownerStaff&&(()=>{
          const ownerRangeLogs=logs.filter(l=>l.staffId===ownerStaff.id&&l.date>=fromDate&&l.date<=toDate);
          const ownerRevenue=ownerRangeLogs.reduce((a,l)=>a+l.amount,0);
          const displayName=currentUser?.name||"Owner";
          return(
            <div key="owner" onClick={()=>{setSelectedStaff({...ownerStaff,name:displayName});setView("detail");}} style={{background:"linear-gradient(135deg,#f5f3ff,#ede9fe)",borderRadius:12,padding:"10px 12px",border:`1.5px solid ${NP.purpleMid}`,display:"flex",alignItems:"center",gap:8,marginBottom:12,cursor:"pointer"}}>
              <div style={{position:"relative",flexShrink:0}}>
                <div style={{width:40,height:40,borderRadius:"50%",background:NP.purpleMid,color:"#fff",display:"flex",alignItems:"center",justifyContent:"center",fontWeight:700,fontSize:13}}>{initials(displayName)}</div>
                <span style={{position:"absolute",bottom:-2,right:-2,fontSize:13}}>👑</span>
              </div>
              <div style={{flex:1,minWidth:0}}>
                <div style={{fontWeight:700,fontSize:13,color:NP.text,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{displayName}</div>
                <div style={{fontSize:10,color:NP.purpleMid,fontWeight:600}}>👑 Owner</div>
              </div>
              <div style={{background:"#fff",borderRadius:7,padding:"5px 8px",textAlign:"center",flexShrink:0,border:`1px solid ${NP.purpleBorder}`}}>
                <div style={{fontWeight:700,fontSize:11,color:NP.purpleMid}}>{ownerRevenue>=1000?`₹${(ownerRevenue/1000).toFixed(1)}k`:fc(ownerRevenue)}</div>
                <div style={{fontSize:8,color:NP.muted,marginTop:1}}>{ownerRangeLogs.length} services</div>
              </div>
              <span style={{color:NP.purpleMid,fontSize:16,cursor:"pointer",flexShrink:0}}>›</span>
            </div>
          );
        })()}
        {staffList.length===0&&<div style={{textAlign:"center",color:NP.light,fontSize:13,padding:"40px 0"}}>No staff yet — Add Staff</div>}
        {staffList.map(s=>{
          const c=avatarColor(s.id);
          const isPresent=!!(todayAtt[s.id]);
          const staffRangeLogs=logs.filter(l=>l.staffId===s.id&&l.date>=fromDate&&l.date<=toDate);
          const staffRevenue=staffRangeLogs.reduce((a,l)=>a+l.amount,0);
          return(
            <div key={s.id} style={{background:NP.white,borderRadius:12,padding:"10px 12px",border:`1px solid ${NP.border}`,display:"flex",alignItems:"center",gap:8,marginBottom:8}}>
              {/* Avatar */}
              <div style={{position:"relative",flexShrink:0}}>
                <div style={{width:40,height:40,borderRadius:"50%",background:c.bg,color:c.text,display:"flex",alignItems:"center",justifyContent:"center",fontWeight:700,fontSize:13}}>{initials(s.name)}</div>
                <span style={{position:"absolute",bottom:0,right:0,width:10,height:10,borderRadius:"50%",background:isPresent?NP.green:NP.red,border:"2px solid white"}}/>
              </div>
              {/* Info */}
              <div style={{flex:1,minWidth:0,cursor:"pointer"}} onClick={()=>{setSelectedStaff(s);setView("detail");}}>
                <div style={{fontWeight:600,fontSize:13,color:NP.text,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{s.name}</div>
                <div style={{fontSize:10,color:NP.muted}}>{s.role||"Staff"}</div>
                <div style={{fontSize:10,color:isPresent?NP.green:NP.red,fontWeight:500,marginTop:1}}>{isPresent?"● Present":"● Absent"}</div>
              </div>
              {/* Revenue pill */}
              <div style={{background:NP.purpleLight,borderRadius:7,padding:"5px 8px",textAlign:"center",flexShrink:0}}>
                <div style={{fontWeight:700,fontSize:11,color:NP.purpleMid}}>{staffRevenue>=1000?`₹${(staffRevenue/1000).toFixed(1)}k`:fc(staffRevenue)}</div>
                <div style={{fontSize:8,color:NP.muted,marginTop:1}}>{staffRangeLogs.length} services</div>
              </div>
              {/* Attendance toggle - small */}
              <div onClick={()=>toggleAttendance(s.id,today)} style={{width:38,height:22,borderRadius:11,background:isPresent?NP.green:"#d1d5db",position:"relative",cursor:"pointer",flexShrink:0}}>
                <div style={{width:16,height:16,borderRadius:"50%",background:"white",position:"absolute",top:3,left:isPresent?19:3,transition:"left 0.2s",boxShadow:"0 1px 3px rgba(0,0,0,0.2)"}}/>
              </div>
              {/* Chevron */}
              <span style={{color:NP.light,fontSize:16,cursor:"pointer",flexShrink:0}} onClick={()=>{setSelectedStaff(s);setView("detail");}}>›</span>
            </div>
          );
        })}
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
    <div style={{display:"flex",flexDirection:"column",height:"100%",background:"#f5f5f0",fontFamily:"'Segoe UI',sans-serif"}}>
      <div style={{...S.hdr,flexShrink:0}}>
        <div><div style={S.hdrT}>Mera Dashboard</div><div style={S.hdrS}>Staff View</div></div>
        <button onClick={onLogout} style={{...S.backBtn,fontSize:11}}>Logout</button>
      </div>
      <div style={{flex:1,overflowY:"auto",WebkitOverflowScrolling:"touch"}}>
        <div style={{padding:"14px",display:"flex",gap:14,alignItems:"center",background:"white",borderBottom:"0.5px solid #e8e8e0"}}>
          <div style={{...S.av,width:52,height:52,fontSize:18,background:c.bg,color:c.text}}>{initials(staff.name)}</div>
          <div style={{flex:1}}><div style={{fontSize:16,fontWeight:700,color:"#1a1a2e"}}>{staff.name}</div><div style={{fontSize:12,color:"#888"}}>{staff.role}</div></div>
          <div style={{display:"flex",flexDirection:"column",alignItems:"center",gap:3}}>
            <div style={{width:56,height:28,borderRadius:14,background:isPresent?"#16a34a":"#d1d5db",position:"relative",cursor:"pointer"}} onClick={toggleMyAttendance}>
              <div style={{width:22,height:22,borderRadius:"50%",background:"white",position:"absolute",top:3,left:isPresent?31:3,transition:"left 0.2s",boxShadow:"0 1px 3px rgba(0,0,0,0.2)"}}/>
            </div>
            <span style={{fontSize:11,fontWeight:700,color:isPresent?"#16a34a":"#9ca3af"}}>{isPresent?"Present":"Mark Present"}</span>
          </div>
        </div>
        <div style={{padding:"12px 14px 0"}}>
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",background:"white",borderRadius:10,border:"0.5px solid #e8e8e0",padding:3,gap:2}}>
            {[{key:"today",label:"Aaj"},{key:"week",label:"Is Hafte"},{key:"month",label:"Is Mahine"}].map(t=>(
              <button key={t.key} style={{padding:"8px 0",border:"none",borderRadius:8,background:tab===t.key?"#1a1a2e":"transparent",color:tab===t.key?"white":"#888",fontSize:13,fontWeight:600,cursor:"pointer",fontFamily:"inherit"}} onClick={()=>setTab(t.key)}>{t.label}</button>
            ))}
          </div>
        </div>
        <div style={{display:"grid",gridTemplateColumns:showRevenue?"1fr 1fr":"1fr",gap:10,padding:"12px 14px 0"}}>
          <div style={S.sc}><div style={{...S.sn,color:"#1a1a2e"}}>{filtered.length}</div><div style={S.sl}>Clients</div></div>
          {showRevenue&&<div style={S.sc}><div style={{...S.sn,color:"#16a34a"}}>{fc(filtered.reduce((s,l)=>s+l.amount,0))}</div><div style={S.sl}>Revenue</div></div>}
        </div>
        <div style={{padding:"14px"}}>
          <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:10}}>
            <div style={{fontSize:14,fontWeight:700,color:"#1a1a2e"}}>Mera Kaam</div>
            <button style={S.addBtn} onClick={()=>setShowAddLog(true)}>+ Add</button>
          </div>
          {filtered.length===0
            ?<div style={{textAlign:"center",color:"#9ca3af",fontSize:13,padding:"24px 0"}}>No entries yet!</div>
            :filtered.map(log=>(
              <div key={log.id} style={{background:"white",borderRadius:10,border:"0.5px solid #e8e8e0",padding:"11px 14px",display:"flex",alignItems:"center",gap:12,marginBottom:8}}>
                <div style={{flex:1}}><div style={{fontSize:14,fontWeight:600,color:"#1a1a2e"}}>{log.clientName}</div><div style={{fontSize:12,color:"#888",marginTop:2}}>{log.service} · {fd(log.date)}</div></div>
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
export default function StaffManagement({role="owner",currentUser,showRevenue=false,setShowRevenue,onBack}){
  const [staffList,setStaffList]=useState([]);
  const [ownerStaff,setOwnerStaff]=useState(null);
  const [logs,setLogs]=useState([]);
  const [attendance,setAttendance]=useState({});
  const [nextLogId,setNextLogId]=useState(100);

  useEffect(()=>{
    async function loadStaff(){
      try{
        const{data}=await supabase.from("staff").select("*").eq("salon_id",currentUser?.id);
        const all=data||[];
        let owner=all.find(s=>s.role==="Owner");
        if(!owner&&currentUser?.id){
          try{
            const{data:created,error}=await supabase.from("staff").insert({salon_id:currentUser.id,name:"Owner",role:"Owner",phone:"",salary:0,pin:"0000",gender_capability:"both"}).select().single();
            if(error)console.error("[owner-staff-create]",error.message);
            owner=created||null;
          }catch(e){console.error("[owner-staff-create]",e.message);}
        }
        setOwnerStaff(owner||null);
        setStaffList(all.filter(s=>s.role!=="Owner"));
      }catch(e){
        console.error("[loadStaff]",e.message);
        setStaffList([]);
      }
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
      currentUser={currentUser} onBack={onBack} ownerStaff={ownerStaff}/>;
  }
  if(role==="staff"&&loggedInStaff){
    return<StaffSelfView staff={loggedInStaff} logs={logs} setLogs={setLogs} attendance={attendance} setAttendance={setAttendance}
      nextLogId={nextLogId} setNextLogId={setNextLogId} showRevenue={showRevenue} onLogout={()=>{}}/>;
  }
  return null;
}

const S={
  hdr:{background:"#1a1a2e",padding:"14px 16px",display:"flex",alignItems:"center",justifyContent:"space-between"},
  hdrT:{fontSize:16,fontWeight:800,color:"#fff"},
  hdrS:{fontSize:11,color:"#a0a0c0",marginTop:1},
  backBtn:{background:"transparent",border:"1px solid rgba(255,255,255,0.3)",color:"white",borderRadius:8,padding:"6px 12px",fontSize:13,cursor:"pointer",fontFamily:"inherit"},
  addBtn:{background:"#1a1a2e",color:"white",border:"none",borderRadius:8,padding:"7px 14px",fontSize:12,fontWeight:700,cursor:"pointer",fontFamily:"inherit"},
  sc:{background:"white",borderRadius:10,padding:"12px 10px",textAlign:"center",border:"0.5px solid #e8e8e0"},
  sn:{fontSize:20,fontWeight:800},
  sl:{fontSize:10,color:"#888",marginTop:2},
  av:{width:42,height:42,borderRadius:"50%",display:"flex",alignItems:"center",justifyContent:"center",fontWeight:700,fontSize:14,flexShrink:0},
  modalBg:{position:"fixed",inset:0,background:"rgba(0,0,0,0.5)",display:"flex",alignItems:"flex-end",justifyContent:"center",zIndex:200},
  modal:{background:"white",borderRadius:"20px 20px 0 0",padding:20,width:"100%",maxWidth:480,paddingBottom:40},
  modalTitle:{fontSize:16,fontWeight:700,color:"#1a1a2e",marginBottom:16},
  fg:{marginBottom:13},
  fr:{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10},
  label:{fontSize:12,fontWeight:600,color:"#555",marginBottom:5,display:"block"},
  input:{width:"100%",border:"1px solid #e2e8f0",borderRadius:8,padding:"9px 11px",fontSize:14,color:"#1a1a2e",background:"#fafafa",outline:"none",boxSizing:"border-box"},
  ma:{display:"flex",gap:10,marginTop:18},
  bc:{flex:1,padding:11,border:"2px solid #e2e8f0",borderRadius:10,fontSize:14,fontWeight:600,cursor:"pointer",fontFamily:"inherit",backgroundColor:"#f0f4f8",color:"#1a1a2e",WebkitAppearance:"none",appearance:"none"},
  bs:{flex:2,padding:11,border:"none",background:"#1a1a2e",borderRadius:10,fontSize:14,fontWeight:600,color:"white",cursor:"pointer",fontFamily:"inherit"},
  err:{background:"#fff0f0",border:"1px solid #fca5a5",borderRadius:8,padding:"8px 12px",fontSize:12,color:"#dc2626",fontWeight:700,marginBottom:12},
};
