import { useState, useMemo, useEffect } from "react";
import { supabase } from "../lib/supabase";
import CustomerHistory from "./CustomerHistoryApp";

// ─── Design Tokens ────────────────────────────────────────────────────────────
const T = {
  bg:"#f0f4f8", surface:"#ffffff", border:"#e8edf3",
  green:"#22c55e", gl:"#e8fdf0", gm:"#bbf7d0", gd:"#16a34a",
  text:"#1a1a2e", tm:"#555", ts:"#888", tf:"#aaa", tg:"#ccc",
  yellow:"#fef9c3", yb:"#fde68a", yt:"#a16207",
  blue:"#eff6ff", bb:"#93c5fd", bt:"#2563eb",
  red:"#fff0f0", rb:"#fca5a5", rt:"#dc2626",
  sub:"#f8fafc", inp:"#fafbfc", wa:"#25d366",
  dark:"#1a1a2e",
};

const IS = {
  width:"100%", padding:"11px 13px", border:`2px solid ${T.border}`,
  borderRadius:11, fontSize:14, fontFamily:"inherit", outline:"none",
  background:T.inp, boxSizing:"border-box", color:T.text,
};

const SERVICES = ["Haircut","Haircut + Beard","Hair Colour","Facial + Cleanup","Bridal Makeup","Hair Spa","Manicure/Pedicure","Beard Trim","Blow Dry","Head Massage","Waxing","Threading","Keratin","Blowdry"];
const AVATAR_COLORS = [
  {bg:"#fce7f3",text:"#9d174d"},{bg:"#dbeafe",text:"#1e40af"},
  {bg:"#d1fae5",text:"#065f46"},{bg:"#fef3c7",text:"#92400e"},{bg:"#ede9fe",text:"#4c1d95"},
];

const today = new Date().toISOString().slice(0,10);
const thisWeekStart = (()=>{const d=new Date();d.setDate(d.getDate()-d.getDay());return d.toISOString().slice(0,10);})();
const thisMonthStart = new Date().toISOString().slice(0,8)+"01";

function initials(name){return name.split(" ").map(w=>w[0]).join("").substring(0,2).toUpperCase();}
function avc(id){const n=typeof id==="string"?id.charCodeAt(0):(id||1);return AVATAR_COLORS[Math.abs(n-1)%AVATAR_COLORS.length];}
function fc(n){return "₹"+Number(n).toLocaleString("en-IN");}
function fd(d){return new Date(d+"T00:00:00").toLocaleDateString("en-IN",{day:"numeric",month:"short"});}

// ─── Add Work Log Modal ────────────────────────────────────────────────────────
function AddLogModal({staffId,salonId,isPresent,onSave,onClose}){
  const [clientName,setClientName]=useState("");
  const [service,setService]=useState(SERVICES[0]);
  const [amount,setAmount]=useState("");
  const [date,setDate]=useState(today);
  const [saving,setSaving]=useState(false);
  const [showNewCustomer,setShowNewCustomer]=useState(false);
  const [newCustPhone,setNewCustPhone]=useState("");
  const [newCustDob,setNewCustDob]=useState("");
  const [newCustGender,setNewCustGender]=useState("male");
  const [savingCustomer,setSavingCustomer]=useState(false);
  const [pendingLogData,setPendingLogData]=useState(null);

  if(!isPresent){
    return(
      <div onClick={e=>e.target===e.currentTarget&&onClose()} style={{position:"fixed",inset:0,background:"rgba(0,0,0,0.5)",zIndex:200,display:"flex",alignItems:"flex-end"}}>
        <div style={{background:T.surface,borderRadius:"20px 20px 0 0",padding:"20px 18px 36px",width:"100%"}}>
          <div style={{width:36,height:4,background:T.border,borderRadius:2,margin:"0 auto 16px"}}/>
          <div style={{textAlign:"center",padding:"20px 0"}}>
            <div style={{fontSize:48,marginBottom:12}}>⚠️</div>
            <div style={{fontWeight:900,fontSize:18,color:T.rt,marginBottom:8}}>Pehle Present Mark Karo!</div>
            <div style={{fontSize:13,color:T.ts,marginBottom:24}}>Aap abhi absent hain. Work log add karne se pehle attendance mark karo.</div>
            <button onClick={onClose} style={{padding:"12px 32px",background:T.green,border:"none",borderRadius:12,color:"#fff",fontFamily:"inherit",fontSize:14,fontWeight:800,cursor:"pointer"}}>Okay, Mark Karta Hoon</button>
          </div>
        </div>
      </div>
    );
  }

  async function save(){
    if(!clientName.trim()||!amount||isNaN(amount))return;
    setSaving(true);
    try{
      if(salonId){
        const {data:existingCustomers}=await supabase.from("customers").select("id").eq("salon_id",salonId).eq("name",clientName.trim());
        if(!existingCustomers||existingCustomers.length===0){
          setPendingLogData({staffId,clientName:clientName.trim(),service,amount:Number(amount),date});
          setSaving(false);
          setShowNewCustomer(true);
          return;
        }
      }
      await saveLog({staffId,clientName:clientName.trim(),service,amount:Number(amount),date});
    }catch(e){
      setPendingLogData({staffId,clientName:clientName.trim(),service,amount:Number(amount),date});
      setSaving(false);
      setShowNewCustomer(true);
    }
  }

  async function saveLog(logData){
    try{
      if(salonId){
        const {data:res}=await supabase.from("work_logs").insert({
          salon_id:salonId, staff_id:logData.staffId,
          client_name:logData.clientName, service:logData.service,
          amount:logData.amount, date:logData.date
        }).select().single();
        const custRes = await supabase.from("customers").select("id").eq("salon_id", salonId).eq("name", logData.clientName).single();
        if(custRes.data){
          await supabase.from("visit_history").insert({
            salon_id: salonId,
            customer_id: custRes.data.id,
            date: logData.date,
            services: [logData.service],
            stylist: logData.staffId,
            amount: logData.amount,
            notes: "",
            photos: []
          });
        }
        if(res){
          onSave({id:res.id,staffId:res.staff_id,clientName:res.client_name,service:res.service,amount:res.amount,date:res.date});
          onClose();return;
        }
      }
      onSave({id:Date.now(),...logData});
      onClose();
    }catch(e){console.error(e);}
  }

  async function saveNewCustomer(skipDetails=false){
    setSavingCustomer(true);
    try{
      if(salonId&&!skipDetails){
        await supabase.from("customers").insert({
          salon_id:salonId,
          name:pendingLogData.clientName,
          phone:newCustPhone||"",
          birthday:newCustDob||null,
          gender:newCustGender||"male",
        });
      }
      await saveLog(pendingLogData);
    }catch(e){
      console.error(e);
      await saveLog(pendingLogData);
    }
    setSavingCustomer(false);
  }

  if(showNewCustomer&&pendingLogData){
    return(
      <div onClick={e=>e.target===e.currentTarget&&onClose()} style={{position:"fixed",inset:0,background:"rgba(0,0,0,0.5)",zIndex:200,display:"flex",alignItems:"flex-end"}}>
        <div style={{background:T.surface,borderRadius:"20px 20px 0 0",padding:"20px 18px 36px",width:"100%",maxHeight:"90vh",overflowY:"auto"}}>
          <div style={{width:36,height:4,background:T.border,borderRadius:2,margin:"0 auto 16px"}}/>
          <div style={{display:"flex",alignItems:"center",gap:12,marginBottom:16}}>
            <div style={{width:44,height:44,borderRadius:14,background:T.blue,border:`2px solid ${T.bb}`,display:"flex",alignItems:"center",justifyContent:"center",fontSize:22,flexShrink:0}}>🆕</div>
            <div>
              <div style={{fontWeight:900,fontSize:16,color:T.text}}>Naya Customer!</div>
              <div style={{fontSize:12,color:T.ts,marginTop:2}}>{pendingLogData.clientName} pehle kabhi nahi aaya</div>
            </div>
          </div>
          <div style={{background:T.gl,border:`1.5px solid ${T.gm}`,borderRadius:10,padding:"10px 13px",marginBottom:16,fontSize:12,color:T.gd,fontWeight:700}}>
            💡 Iska data save karo — owner ke dashboard mein bhi dikh jaayega!
          </div>
          <div style={{marginBottom:12}}>
            <div style={{fontSize:12,fontWeight:800,color:T.tm,marginBottom:5}}>Phone Number *</div>
            <input style={IS} type="tel" placeholder="e.g. 9876543210" value={newCustPhone} onChange={e=>setNewCustPhone(e.target.value.replace(/\D/g,"").slice(0,10))} onFocus={e=>e.target.style.borderColor=T.green} onBlur={e=>e.target.style.borderColor=T.border} autoFocus/>
          </div>
          <div style={{marginBottom:12}}>
            <div style={{fontSize:12,fontWeight:800,color:T.tm,marginBottom:5}}>Date of Birth (optional)</div>
            <input style={IS} type="date" value={newCustDob} onChange={e=>setNewCustDob(e.target.value)}/>
          </div>
          <div style={{marginBottom:16}}>
            <div style={{fontSize:12,fontWeight:800,color:T.tm,marginBottom:8}}>Gender</div>
            <div style={{display:"flex",gap:8}}>{[{id:"male",label:"👨 Male"},{id:"female",label:"👩 Female"}].map(g=>(<button key={g.id} onClick={()=>setNewCustGender(g.id)} style={{flex:1,padding:"9px",borderRadius:10,border:`2px solid ${newCustGender===g.id?T.green:T.border}`,background:newCustGender===g.id?T.gl:"#fff",color:newCustGender===g.id?T.gd:T.ts,fontFamily:"inherit",fontSize:13,fontWeight:800,cursor:"pointer"}}>{g.label}</button>))}</div>
          </div>
          <button onClick={()=>saveNewCustomer(false)} disabled={savingCustomer||!newCustPhone||newCustPhone.length<10} style={{width:"100%",padding:13,background:savingCustomer||!newCustPhone||newCustPhone.length<10?"#d1d5db":T.green,border:"none",borderRadius:12,color:"#fff",fontFamily:"inherit",fontSize:14,fontWeight:800,cursor:newCustPhone.length===10?"pointer":"not-allowed"}}>
            {savingCustomer?"Saving...":"✓ Customer + Log Save"}
          </button>
        </div>
      </div>
    );
  }

  return(
    <div onClick={e=>e.target===e.currentTarget&&onClose()} style={{position:"fixed",inset:0,background:"rgba(0,0,0,0.5)",zIndex:200,display:"flex",alignItems:"flex-end"}}>
      <div style={{background:T.surface,borderRadius:"20px 20px 0 0",padding:"20px 18px 36px",width:"100%",maxHeight:"80vh",overflowY:"auto"}}>
        <div style={{width:36,height:4,background:T.border,borderRadius:2,margin:"0 auto 16px"}}/>
        <div style={{fontWeight:900,fontSize:16,marginBottom:16}}>➕ Work Log Add Karo</div>
        <div style={{marginBottom:12}}>
          <div style={{fontSize:12,fontWeight:800,color:T.tm,marginBottom:5}}>Client Naam *</div>
          <input style={IS} placeholder="e.g. Anjali Mehta" value={clientName} onChange={e=>setClientName(e.target.value)} onFocus={e=>e.target.style.borderColor=T.green} onBlur={e=>e.target.style.borderColor=T.border} autoFocus/>
        </div>
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10,marginBottom:12}}>
          <div>
            <div style={{fontSize:12,fontWeight:800,color:T.tm,marginBottom:5}}>Service</div>
            <select style={{...IS,cursor:"pointer"}} value={service} onChange={e=>setService(e.target.value)}>
              {SERVICES.map(s=><option key={s}>{s}</option>)}
            </select>
          </div>
          <div>
            <div style={{fontSize:12,fontWeight:800,color:T.tm,marginBottom:5}}>Date</div>
            <input style={IS} type="date" value={date} onChange={e=>setDate(e.target.value)}/>
          </div>
        </div>
        <div style={{marginBottom:18}}>
          <div style={{fontSize:12,fontWeight:800,color:T.tm,marginBottom:5}}>Amount (₹) *</div>
          <input style={IS} type="number" placeholder="500" value={amount} onChange={e=>setAmount(e.target.value)} onFocus={e=>e.target.style.borderColor=T.green} onBlur={e=>e.target.style.borderColor=T.border}/>
        </div>
        <div style={{display:"flex",gap:10}}>
          <button onClick={onClose} style={{flex:1,padding:12,border:`2px solid ${T.border}`,borderRadius:12,background:T.surface,fontFamily:"inherit",fontSize:13,fontWeight:700,cursor:"pointer"}}>Cancel</button>
          <button onClick={save} disabled={saving} style={{flex:2,padding:12,border:"none",borderRadius:12,background:clientName.trim()&&amount?T.green:"#d1d5db",color:"#fff",fontFamily:"inherit",fontSize:13,fontWeight:800,cursor:"pointer"}}>
            {saving?"Saving...":"✓ Save"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Tab 1: Attendance & Work Log ─────────────────────────────────────────────
function EntryDetailModal({log, onClose}){
  function svcIcon(svc){
    const s=(svc||"").toLowerCase();
    if(s.includes("color")||s.includes("colour"))return{icon:"🎨",bg:"#fff7ed",border:"#fed7aa",color:"#ea580c"};
    if(s.includes("beard")||s.includes("shave"))return{icon:"🪒",bg:"#f0fdf4",border:"#bbf7d0",color:"#16a34a"};
    if(s.includes("facial")||s.includes("face"))return{icon:"💆",bg:"#fdf4ff",border:"#e9d5ff",color:"#9333ea"};
    return{icon:"✂️",bg:"#f0eeff",border:"#ddd6fe",color:"#5b3fc4"};
  }
  const si=svcIcon(log.service);
  return(
    <div style={{position:"fixed",inset:0,background:"rgba(0,0,0,0.5)",display:"flex",alignItems:"flex-end",justifyContent:"center",zIndex:999,fontFamily:"system-ui,sans-serif"}} onClick={onClose}>
      <div style={{background:"#fff",borderRadius:"22px 22px 0 0",width:"100%",maxWidth:480,paddingBottom:32}} onClick={e=>e.stopPropagation()}>
        <div style={{width:36,height:4,background:"#e5e7eb",borderRadius:2,margin:"12px auto 0"}}/>
        <div style={{background:"linear-gradient(135deg,#3d2490,#5b3fc4)",padding:"14px 18px",margin:"12px 0 0"}}>
          <div style={{display:"flex",alignItems:"center",justifyContent:"space-between"}}>
            <div>
              <div style={{fontSize:10,color:"rgba(255,255,255,0.6)"}}>Work Entry</div>
              <div style={{fontSize:15,fontWeight:800,color:"#fff",marginTop:2}}>Service Details</div>
            </div>
            <div onClick={onClose} style={{width:30,height:30,borderRadius:"50%",background:"rgba(255,255,255,0.15)",display:"flex",alignItems:"center",justifyContent:"center",cursor:"pointer",fontSize:14,color:"#fff"}}>✕</div>
          </div>
        </div>
        <div style={{padding:"16px 18px"}}>
          <div style={{display:"flex",alignItems:"center",gap:12,marginBottom:14,padding:"12px",background:"#f8f7ff",borderRadius:12}}>
            <div style={{width:42,height:42,borderRadius:14,background:"linear-gradient(135deg,#5b3fc4,#2d1b69)",display:"flex",alignItems:"center",justifyContent:"center",fontSize:14,fontWeight:800,color:"#fff",flexShrink:0}}>{(log.clientName||"?").slice(0,2).toUpperCase()}</div>
            <div>
              <div style={{fontSize:14,fontWeight:800,color:"#0f0a2e"}}>{log.clientName}</div>
              <div style={{fontSize:11,color:"#9b8ec4",marginTop:2}}>Client</div>
            </div>
          </div>
          <div style={{display:"flex",flexDirection:"column",gap:8,marginBottom:16}}>
            <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",padding:"11px 14px",background:si.bg,borderRadius:11,border:`1px solid ${si.border}`}}>
              <div style={{display:"flex",alignItems:"center",gap:8}}><span style={{fontSize:16}}>{si.icon}</span><span style={{fontSize:13,color:"#374151"}}>Service</span></div>
              <span style={{fontSize:13,fontWeight:700,color:si.color}}>{log.service}</span>
            </div>
            <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",padding:"11px 14px",background:"#f0fdf4",borderRadius:11,border:"1px solid #bbf7d0"}}>
              <div style={{display:"flex",alignItems:"center",gap:8}}><span style={{fontSize:16}}>💰</span><span style={{fontSize:13,color:"#374151"}}>Amount</span></div>
              <span style={{fontSize:13,fontWeight:700,color:"#16a34a"}}>₹{Number(log.amount||0).toLocaleString("en-IN")}</span>
            </div>
            <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",padding:"11px 14px",background:"#f8f7ff",borderRadius:11,border:"1px solid #e5e7eb"}}>
              <div style={{display:"flex",alignItems:"center",gap:8}}><span style={{fontSize:16}}>📅</span><span style={{fontSize:13,color:"#374151"}}>Date</span></div>
              <span style={{fontSize:13,fontWeight:700,color:"#0f0a2e"}}>{new Date(log.date+"T00:00:00").toLocaleDateString("en-IN",{day:"numeric",month:"short",year:"numeric"})}</span>
            </div>
          </div>
          <button onClick={onClose} style={{width:"100%",padding:"13px",background:"linear-gradient(135deg,#5b3fc4,#2d1b69)",border:"none",borderRadius:12,color:"#fff",fontFamily:"inherit",fontSize:14,fontWeight:700,cursor:"pointer"}}>Done</button>
        </div>
      </div>
    </div>
  );
}


function AttendanceTab({staff, logs, setLogs, attendance, setAttendance, showRevenue, absentNotes, setAbsentNotes, salonId}){
  const [workTab,setWorkTab]=useState("today");
  const [showAddLog,setShowAddLog]=useState(false);
  const [selectedLog,setSelectedLog]=useState(null);
  const N={white:"#fff",bg:"#f8f7ff",border:"#f1f0f5",text:"#0f0a2e",muted:"#6b7280",mid:"#5b3fc4"};

  const isPresent=!!(attendance[today]||{})[staff.id];

  async function toggleAttendance(){
    const newVal=!isPresent;
    setAttendance(prev=>{const dm={...(prev[today]||{})};dm[staff.id]=newVal;return{...prev,[today]:dm};});
    if(salonId){
      await supabase.from("attendance").upsert({
        salon_id:salonId, staff_id:staff.id, date:today, is_present:newVal,
        absent_reason: newVal ? null : ((absentNotes||{})[today]||null)
      },{onConflict:"salon_id,staff_id,date"});
    }
  }

  function addLog(data){setLogs(prev=>[...prev,data]);}

  const filtered=useMemo(()=>{
    const cutoff=workTab==="today"?today:workTab==="week"?thisWeekStart:thisMonthStart;
    return logs.filter(l=>l.staffId===staff.id&&l.date>=cutoff).sort((a,b)=>b.date.localeCompare(a.date));
  },[logs,workTab,staff.id]);

  const monthPresent=Object.entries(attendance).filter(([d,m])=>d>=thisMonthStart&&m[staff.id]).length;
  const monthAbsent=new Date().getDate()-monthPresent;
  const attRate=monthPresent+monthAbsent>0?Math.round((monthPresent/(monthPresent+monthAbsent))*100):0;
  const monthClients=useMemo(()=>new Set(logs.filter(l=>l.staffId===staff.id&&l.date>=thisMonthStart).map(l=>l.clientName)).size,[logs,staff.id]);
  const monthLogs=logs.filter(l=>l.staffId===staff.id&&l.date>=thisMonthStart).length;
  const monthRevenue=logs.filter(l=>l.staffId===staff.id&&l.date>=thisMonthStart).reduce((s,l)=>s+l.amount,0);
  const heatDays=[];
  for(let i=13;i>=0;i--){const d=new Date();d.setDate(d.getDate()-i);const ds=d.toISOString().slice(0,10);heatDays.push({ds,present:!!(attendance[ds]||{})[staff.id],future:ds>today});}
  let streak=0;
  for(let i=0;i<30;i++){const dd=new Date();dd.setDate(dd.getDate()-i);const ds=dd.toISOString().slice(0,10);if((attendance[ds]||{})[staff.id])streak++;else if(i>0)break;}
  function svcIcon(svc){const s=(svc||"").toLowerCase();if(s.includes("color")||s.includes("colour"))return{icon:"🎨",bg:"#fff7ed",border:"#fed7aa",color:"#ea580c"};if(s.includes("beard")||s.includes("shave"))return{icon:"🪒",bg:"#f0fdf4",border:"#bbf7d0",color:"#16a34a"};if(s.includes("facial")||s.includes("face"))return{icon:"💆",bg:"#fdf4ff",border:"#e9d5ff",color:"#9333ea"};return{icon:"✂️",bg:"#f0eeff",border:"#ddd6fe",color:"#5b3fc4"};}

  return(
    <div style={{padding:"14px 16px 80px"}}>
      <div style={{background:isPresent?T.gl:T.red,border:`2px solid ${isPresent?T.gm:T.rb}`,borderRadius:16,padding:"16px",marginBottom:14}}>
        <div style={{display:"flex",alignItems:"center",justifyContent:"space-between"}}>
          <div>
            <div style={{fontWeight:900,fontSize:15,color:isPresent?T.gd:T.rt}}>{isPresent?"✅ Present Hai Aaj!":"❌ Absent Ho Aaj"}</div>
            <div style={{fontSize:12,color:isPresent?T.gd:T.rt,marginTop:3}}>{new Date().toLocaleDateString("en-IN",{day:"numeric",month:"long",year:"numeric"})}</div>
          </div>
          <div onClick={toggleAttendance} style={{width:56,height:28,borderRadius:14,background:isPresent?T.green:"#d1d5db",position:"relative",cursor:"pointer",transition:"background 0.2s",flexShrink:0}}>
            <div style={{width:22,height:22,borderRadius:"50%",background:"#fff",position:"absolute",top:3,left:isPresent?31:3,transition:"left 0.2s",boxShadow:"0 1px 3px rgba(0,0,0,0.2)"}}/>
          </div>
        </div>
      </div>

      <div style={{background:T.surface,border:`2px solid ${T.border}`,borderRadius:14,padding:"14px",marginBottom:14}}>
        <div style={{fontWeight:800,fontSize:13,color:T.text,marginBottom:10}}>📅 This Month's Attendance</div>
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10}}>
          <div style={{background:T.gl,border:`1.5px solid ${T.gm}`,borderRadius:11,padding:"12px",textAlign:"center"}}>
            <div style={{fontSize:28,fontWeight:900,color:T.gd}}>{monthPresent}</div>
            <div style={{fontSize:11,fontWeight:700,color:T.gd,marginTop:2}}>Present Din</div>
          </div>
          <div style={{background:T.red,border:`1.5px solid ${T.rb}`,borderRadius:11,padding:"12px",textAlign:"center"}}>
            <div style={{fontSize:28,fontWeight:900,color:T.rt}}>{monthAbsent}</div>
            <div style={{fontSize:11,fontWeight:700,color:T.rt,marginTop:2}}>Absent Din</div>
          </div>
        </div>
        {!isPresent&&(
          <div style={{marginTop:12}}>
            <div style={{fontSize:12,fontWeight:800,color:T.ts,marginBottom:6}}>🔒 Reason for absence (only you can see):</div>
            <input style={{...IS,fontSize:13,background:T.blue,borderColor:T.bb}} placeholder="Add reason — owner won't see this..." value={(absentNotes||{})[today]||""} onChange={async e=>{
  setAbsentNotes(prev=>({...prev,[today]:e.target.value}));
  if(salonId) await supabase.from("attendance").upsert({
    salon_id:salonId,staff_id:staff.id,date:today,is_present:false,absent_reason:e.target.value
  },{onConflict:"salon_id,staff_id,date"});
}} onFocus={e=>e.target.style.borderColor=T.green} onBlur={e=>e.target.style.borderColor=T.bb}/>
          </div>
        )}
      </div>

      <div style={{background:T.surface,border:`2px solid ${T.border}`,borderRadius:14,overflow:"hidden"}}>
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",background:T.sub,borderBottom:`2px solid ${T.border}`}}>
          {[{k:"today",l:"Aaj"},{k:"week",l:"Is Hafte"},{k:"month",l:"Is Mahine"}].map(t=>(
            <button key={t.k} onClick={()=>setWorkTab(t.k)} style={{padding:"10px 0",border:"none",background:workTab===t.k?T.dark:"transparent",color:workTab===t.k?"#fff":T.ts,fontSize:12,fontWeight:700,cursor:"pointer",fontFamily:"inherit"}}>{t.l}</button>
          ))}
        </div>
        <div style={{display:"grid",gridTemplateColumns:showRevenue?"1fr 1fr":"1fr",borderBottom:`2px solid ${T.border}`}}>
          <div style={{padding:"12px",textAlign:"center",borderRight:showRevenue?`1px solid ${T.border}`:"none"}}>
            <div style={{fontSize:24,fontWeight:900,color:T.dark}}>{filtered.length}</div>
            <div style={{fontSize:11,fontWeight:700,color:T.ts,marginTop:2}}>Clients</div>
          </div>
          {showRevenue&&<div style={{padding:"12px",textAlign:"center"}}><div style={{fontSize:22,fontWeight:900,color:T.gd}}>{fc(filtered.reduce((s,l)=>s+l.amount,0))}</div><div style={{fontSize:11,fontWeight:700,color:T.ts,marginTop:2}}>Revenue</div></div>}
        </div>
        <div style={{padding:"10px 14px",borderBottom:`1px solid ${T.border}`,display:"flex",alignItems:"center",justifyContent:"space-between"}}>
          <div style={{fontSize:13,fontWeight:800,color:T.text}}>Work Entries</div>
          <button onClick={()=>setShowAddLog(true)} style={{background:T.dark,color:"#fff",border:"none",borderRadius:8,padding:"6px 14px",fontSize:12,fontWeight:700,cursor:"pointer"}}>+ Add Entry</button>
        </div>
        <div style={{padding:"8px 0"}}>
          {filtered.length===0?(<div style={{textAlign:"center",color:T.ts,fontSize:13,padding:"24px 0"}}>No entries yet</div>)
          :filtered.map(log=>(
            <div key={log.id} style={{display:"flex",alignItems:"center",gap:12,padding:"11px 14px",borderBottom:`1px solid ${T.border}`}}>
              <div style={{flex:1}}>
                <div style={{fontSize:14,fontWeight:700,color:T.text}}>{log.clientName}</div>
                <div style={{fontSize:11,color:T.ts,marginTop:2}}>{log.service} · {fd(log.date)}</div>
              </div>
              {showRevenue&&<div style={{fontSize:14,fontWeight:700,color:T.gd}}>{fc(log.amount)}</div>}
            </div>
          ))}
        </div>
      </div>
      {showAddLog&&<AddLogModal staffId={staff.id} salonId={salonId} isPresent={isPresent} onSave={addLog} onClose={()=>setShowAddLog(false)}/>}
    </div>
  );
}

// ─── Main Staff Dashboard ─────────────────────────────────────────────────────
export default function StaffDashboard({staff, showRevenue=false, onLogout}){
  const [tab,setTab]=useState("attendance");
  const [showAddLogFab,setShowAddLogFab]=useState(false);
  const [logs,setLogs]=useState([]);
  const [attendance,setAttendance]=useState({});
  const [absentNotes,setAbsentNotes]=useState({});
  const [loading,setLoading]=useState(true);

  const salonId = staff?.salon_id || null;

  useEffect(()=>{
    async function loadData(){
      if(!salonId){setLoading(false);return;}
      setLoading(true);

      const {data:logsData}=await supabase.from("work_logs").select("*").eq("salon_id",salonId).eq("staff_id",staff.id);
      if(logsData){
        setLogs(logsData.map(l=>({id:l.id,staffId:l.staff_id,clientName:l.client_name,service:l.service,amount:l.amount,date:l.date})));
      }

      const {data:attData}=await supabase.from("attendance").select("*").eq("salon_id",salonId).eq("staff_id",staff.id);
      if(attData){
        const attMap={};
        attData.forEach(row=>{
          if(!attMap[row.date])attMap[row.date]={};
          attMap[row.date][row.staff_id]=row.is_present;
        });
        setAttendance(attMap);
      }

      setLoading(false);
    }
    loadData();
  },[salonId, staff?.id]);

  const c=avc(staff?.id||1);

  const TABS=[
    {id:"attendance",icon:"📋",label:"Attendance"},
    {id:"customers",icon:"👥",label:"Customers"},
  ];

  if(loading){
    return(<div style={{height:"100vh",display:"flex",alignItems:"center",justifyContent:"center",background:T.bg,fontFamily:"system-ui,sans-serif"}}><div style={{textAlign:"center"}}><div style={{fontSize:32,marginBottom:12}}>✂️</div><div style={{fontSize:14,color:T.ts,fontWeight:700}}>Loading...</div></div></div>);
  }

  return(
    <div style={{height:"100vh",display:"flex",flexDirection:"column",fontFamily:"-apple-system,system-ui,sans-serif",color:"#0f0a2e",background:"#f8f7ff",overflow:"hidden"}}>
      {/* White Header */}
      <div style={{background:"#fff",padding:"12px 16px 10px",display:"flex",alignItems:"center",justifyContent:"space-between",borderBottom:"1px solid #f1f0f5",flexShrink:0}}>
        <div style={{display:"flex",alignItems:"center",gap:10}}>
          <div style={{width:38,height:38,borderRadius:12,background:c.bg,display:"flex",alignItems:"center",justifyContent:"center",fontWeight:800,fontSize:14,color:c.text,flexShrink:0}}>{initials(staff?.name||"ST")}</div>
          <div>
            <div style={{fontWeight:800,fontSize:14,color:"#0f0a2e"}}>{staff?.name}</div>
            <div style={{fontSize:10,color:"#9b8ec4",marginTop:1}}>{staff?.role} · Staff Portal</div>
          </div>
        </div>
        <button onClick={onLogout} style={{display:"flex",alignItems:"center",gap:5,padding:"7px 12px",background:"#fff5f5",border:"1.5px solid #fca5a5",borderRadius:9,fontSize:11,fontWeight:700,color:"#dc2626",cursor:"pointer",fontFamily:"inherit"}}>🚪 Logout</button>
      </div>

      {/* Content */}
      <div style={{flex:1,overflow:"hidden",display:"flex",flexDirection:"column",position:"relative"}}>
        {tab==="attendance"&&(<div style={{flex:1,overflowY:"auto",WebkitOverflowScrolling:"touch"}}><AttendanceTab staff={staff} logs={logs} setLogs={setLogs} attendance={attendance} setAttendance={setAttendance} showRevenue={showRevenue} absentNotes={absentNotes} setAbsentNotes={setAbsentNotes} salonId={salonId}/></div>)}
        {tab==="customers"&&salonId&&(<CustomerHistory key={salonId} currentUser={{id:salonId,salon_id:salonId,role:"staff",name:staff?.name||"Staff"}}/>)}
        {tab==="attendance"&&(
          <div style={{position:"absolute",right:14,bottom:14,display:"flex",flexDirection:"column",alignItems:"center",gap:3,zIndex:10}}>
            <div onClick={()=>setShowAddLogFab(true)} style={{width:54,height:54,borderRadius:"50%",background:"linear-gradient(135deg,#5b3fc4,#2d1b69)",display:"flex",alignItems:"center",justifyContent:"center",fontSize:24,color:"#fff",boxShadow:"0 4px 18px rgba(91,63,196,0.45)",cursor:"pointer"}}>+</div>
            <span style={{fontSize:9,fontWeight:700,color:"#5b3fc4",background:"#fff",padding:"1px 5px",borderRadius:4}}>Add Log</span>
          </div>
        )}
      </div>

      {showAddLogFab&&<AddLogModal staffId={staff.id} salonId={salonId} isPresent={!!(attendance[today]||{})[staff.id]} onSave={log=>{setLogs(prev=>[...prev,log]);setShowAddLogFab(false);}} onClose={()=>setShowAddLogFab(false)}/>}

      {/* Bottom Tab Bar */}
      <div style={{background:"#fff",borderTop:"1px solid #f1f0f5",display:"flex",flexShrink:0,padding:"6px 0 8px"}}>
        {[{id:"attendance",icon:"📅",label:"Attendance"},{id:"customers",icon:"👥",label:"Customers"}].map(t=>(
          <div key={t.id} onClick={()=>setTab(t.id)} style={{flex:1,display:"flex",flexDirection:"column",alignItems:"center",gap:3,cursor:"pointer",paddingBottom:4,borderBottom:`2.5px solid ${tab===t.id?"#5b3fc4":"transparent"}`}}>
            <span style={{fontSize:17}}>{t.icon}</span>
            <span style={{fontSize:10,fontWeight:tab===t.id?800:600,color:tab===t.id?"#5b3fc4":"#9ca3af"}}>{t.label}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Staff Login Page ─────────────────────────────────────────────────────────
export function StaffLoginPage({salonId, onLogin, onBack}){
  const [staffList,setStaffList]=useState([]);
  const [selectedId,setSelectedId]=useState("");
  const [pin,setPin]=useState("");
  const [error,setError]=useState("");
  const [loading,setLoading]=useState(false);
  const [loadingStaff,setLoadingStaff]=useState(true);

  useEffect(()=>{
    async function loadStaff(){
      if(!salonId){setLoadingStaff(false);return;}
      const {data}=await supabase.from("staff").select("*").eq("salon_id",salonId);
      if(data&&data.length>0){
        setStaffList(data);
        setSelectedId(data[0].id);
      }
      setLoadingStaff(false);
    }
    loadStaff();
  },[salonId]);

  function handleLogin(){
    if(!selectedId){setError("Staff select karo!");return;}
    setLoading(true);setError("");
    setTimeout(()=>{
      const staff=staffList.find(s=>String(s.id)===String(selectedId));
      if(staff&&staff.pin===pin){
        onLogin({...staff,salon_id:salonId});
      }else{
        setError("Incorrect PIN! Please try again.");
        setPin("");setLoading(false);
      }
    },800);
  }

  if(loadingStaff){
    return(<div style={{minHeight:"100vh",background:"linear-gradient(135deg,#1a1a2e,#16213e)",display:"flex",alignItems:"center",justifyContent:"center",fontFamily:"system-ui,sans-serif"}}><div style={{textAlign:"center",color:"#fff"}}><div style={{fontSize:32,marginBottom:12}}>✂️</div><div style={{fontSize:14,color:"#a0a0c0"}}>Loading staff...</div></div></div>);
  }

  if(!salonId||staffList.length===0){
    return(
      <div style={{minHeight:"100vh",background:"linear-gradient(135deg,#1a1a2e,#16213e)",display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",padding:"24px 20px",fontFamily:"system-ui,sans-serif"}}>
        <div style={{fontSize:28,fontWeight:900,color:"#fff",marginBottom:4}}>✂️ SnipBook</div>
        <div style={{background:"#fff",borderRadius:20,padding:"26px 22px",width:"100%",maxWidth:360,marginTop:24}}>
          <div style={{fontWeight:900,fontSize:17,marginBottom:8,color:T.text}}>No staff found</div>
          <div style={{fontSize:13,color:T.ts,marginBottom:20}}>No staff registered in this salon.</div>
          <button onClick={onBack} style={{width:"100%",padding:"13px",background:T.dark,border:"none",borderRadius:12,color:"#fff",fontFamily:"inherit",fontSize:14,fontWeight:800,cursor:"pointer"}}>← Back to Login</button>
        </div>
      </div>
    );
  }

  return(
    <div style={{minHeight:"100vh",background:"linear-gradient(135deg,#1a1a2e,#16213e)",display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",padding:"24px 20px",fontFamily:"system-ui,sans-serif"}}>
      <div style={{fontSize:28,fontWeight:900,color:"#fff",marginBottom:4}}>✂️ SnipBook</div>
      <div style={{fontSize:13,color:"#a0a0c0",marginBottom:32}}>Staff Portal</div>

      <div style={{background:"#fff",borderRadius:20,padding:"26px 22px",width:"100%",maxWidth:360,boxShadow:"0 16px 48px rgba(0,0,0,0.3)"}}>
        <div style={{fontWeight:900,fontSize:17,marginBottom:3,color:T.text}}>Staff Login</div>
        <div style={{fontSize:13,color:T.ts,marginBottom:20}}>Enter your name and PIN</div>

        <div style={{marginBottom:14}}>
          <div style={{fontSize:13,fontWeight:800,color:T.tm,marginBottom:6}}>Your Name</div>
          <select style={{...IS,cursor:"pointer"}} value={selectedId} onChange={e=>{setSelectedId(e.target.value);setError("");}}>
            {staffList.map(s=><option key={s.id} value={s.id}>{s.name} — {s.role}</option>)}
          </select>
        </div>

        <div style={{marginBottom:18}}>
          <div style={{fontSize:13,fontWeight:800,color:T.tm,marginBottom:6}}>4-digit PIN</div>
          <input style={IS} type="password" placeholder="••••" maxLength={4} value={pin} onChange={e=>{setPin(e.target.value);setError("");}} onKeyDown={e=>e.key==="Enter"&&handleLogin()} onFocus={e=>e.target.style.borderColor=T.green} onBlur={e=>e.target.style.borderColor=T.border}/>
        </div>

        {error&&<div style={{background:T.red,border:`1.5px solid ${T.rb}`,borderRadius:9,padding:"9px 12px",marginBottom:14,fontSize:12,color:T.rt,fontWeight:600}}>⚠️ {error}</div>}

        <button onClick={handleLogin} disabled={loading} style={{width:"100%",padding:"13px",background:loading?"#86efac":T.green,border:"none",borderRadius:12,color:"#fff",fontFamily:"inherit",fontSize:15,fontWeight:800,cursor:"pointer",marginBottom:12}}>
          {loading?"Logging in...":"Login →"}
        </button>

        <button onClick={onBack} style={{width:"100%",background:"none",border:"none",color:T.ts,fontSize:13,fontWeight:700,cursor:"pointer",fontFamily:"inherit"}}>← Back to Login</button>
      </div>
    </div>
  );
}
