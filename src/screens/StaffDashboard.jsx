import { useState, useMemo, useEffect } from "react";
import { supabase } from "../lib/supabase";
import CustomerHistory from "./CustomerHistoryApp";

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

const IS={
  width:"100%",padding:"11px 13px",border:`2px solid ${TP.border}`,
  borderRadius:11,fontSize:14,fontFamily:"inherit",outline:"none",
  background:TP.inp,boxSizing:"border-box",color:TP.text,
};

const SERVICES=["Haircut","Haircut + Beard","Hair Colour","Facial + Cleanup","Bridal Makeup","Hair Spa","Manicure/Pedicure","Beard Trim","Blow Dry","Head Massage","Waxing","Threading","Keratin","Blowdry"];

const today=new Date().toISOString().slice(0,10);
const thisWeekStart=(()=>{const d=new Date();d.setDate(d.getDate()-d.getDay());return d.toISOString().slice(0,10);})();
const thisMonthStart=new Date().toISOString().slice(0,8)+"01";

function initials(name){return name.split(" ").map(w=>w[0]).join("").substring(0,2).toUpperCase();}
function avc(id){const n=typeof id==="string"?id.charCodeAt(0):(id||1);return CARD_COLORS[Math.abs(n)%CARD_COLORS.length];}
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
      <div onClick={e=>e.target===e.currentTarget&&onClose()} style={{position:"fixed",inset:0,background:"rgba(45,27,105,0.4)",zIndex:200,display:"flex",alignItems:"flex-end"}}>
        <div style={{background:TP.surface,borderRadius:"20px 20px 0 0",padding:"20px 18px 36px",width:"100%"}}>
          <div style={{width:36,height:4,background:TP.border,borderRadius:2,margin:"0 auto 16px"}}/>
          <div style={{textAlign:"center",padding:"20px 0"}}>
            <div style={{fontSize:48,marginBottom:12}}>⚠️</div>
            <div style={{fontWeight:900,fontSize:18,color:TP.rt,marginBottom:8}}>Pehle Present Mark Karo!</div>
            <div style={{fontSize:13,color:TP.ts,marginBottom:24}}>Aap abhi absent hain. Work log add karne se pehle attendance mark karo.</div>
            <button onClick={onClose} style={{padding:"12px 32px",background:TP.green,border:"none",borderRadius:12,color:"#fff",fontFamily:"inherit",fontSize:14,fontWeight:800,cursor:"pointer"}}>Okay, Mark Karta Hoon</button>
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
        const{data:existingCustomers}=await supabase.from("customers").select("id").eq("salon_id",salonId).eq("name",clientName.trim());
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
        const{data:res}=await supabase.from("work_logs").insert({
          salon_id:salonId,staff_id:logData.staffId,
          client_name:logData.clientName,service:logData.service,
          amount:logData.amount,date:logData.date
        }).select().single();
        const custRes=await supabase.from("customers").select("id").eq("salon_id",salonId).eq("name",logData.clientName).single();
        if(custRes.data){
          await supabase.from("visit_history").insert({
            salon_id:salonId,customer_id:custRes.data.id,
            date:logData.date,services:[logData.service],
            stylist:logData.staffId,amount:logData.amount,notes:"",photos:[]
          });
        }
        if(res){onSave({id:res.id,staffId:res.staff_id,clientName:res.client_name,service:res.service,amount:res.amount,date:res.date});onClose();return;}
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
          salon_id:salonId,name:pendingLogData.clientName,
          phone:newCustPhone||"",birthday:newCustDob||null,gender:newCustGender||"male",
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
      <div onClick={e=>e.target===e.currentTarget&&onClose()} style={{position:"fixed",inset:0,background:"rgba(45,27,105,0.4)",zIndex:200,display:"flex",alignItems:"flex-end"}}>
        <div style={{background:TP.surface,borderRadius:"20px 20px 0 0",padding:"20px 18px 36px",width:"100%",maxHeight:"90vh",overflowY:"auto"}}>
          <div style={{width:36,height:4,background:TP.border,borderRadius:2,margin:"0 auto 16px"}}/>
          <div style={{display:"flex",alignItems:"center",gap:12,marginBottom:16}}>
            <div style={{width:44,height:44,borderRadius:14,background:TP.purpleLight,border:`2px solid ${TP.border}`,display:"flex",alignItems:"center",justifyContent:"center",fontSize:22,flexShrink:0}}>🆕</div>
            <div>
              <div style={{fontWeight:900,fontSize:16,color:TP.text}}>Naya Customer!</div>
              <div style={{fontSize:12,color:TP.ts,marginTop:2}}>{pendingLogData.clientName} pehle kabhi nahi aaya</div>
            </div>
          </div>
          <div style={{background:TP.gl,border:`1.5px solid ${TP.gm}`,borderRadius:10,padding:"10px 13px",marginBottom:16,fontSize:12,color:TP.gd,fontWeight:700}}>
            💡 Iska data save karo — owner ke dashboard mein bhi dikh jaayega!
          </div>
          <div style={{marginBottom:12}}>
            <div style={{fontSize:12,fontWeight:800,color:TP.tm,marginBottom:5}}>Phone Number *</div>
            <input style={IS} type="tel" placeholder="9876543210" value={newCustPhone} onChange={e=>setNewCustPhone(e.target.value.replace(/\D/g,"").slice(0,10))} autoFocus/>
          </div>
          <div style={{marginBottom:12}}>
            <div style={{fontSize:12,fontWeight:800,color:TP.tm,marginBottom:5}}>Date of Birth (optional)</div>
            <input style={IS} type="date" value={newCustDob} onChange={e=>setNewCustDob(e.target.value)}/>
          </div>
          <div style={{marginBottom:16}}>
            <div style={{fontSize:12,fontWeight:800,color:TP.tm,marginBottom:8}}>Gender</div>
            <div style={{display:"flex",gap:8}}>{[{id:"male",label:"👨 Male"},{id:"female",label:"👩 Female"}].map(g=>(<button key={g.id} onClick={()=>setNewCustGender(g.id)} style={{flex:1,padding:"9px",borderRadius:10,border:`2px solid ${newCustGender===g.id?TP.purpleMid:TP.border}`,background:newCustGender===g.id?TP.purpleLight:TP.surface,color:newCustGender===g.id?TP.purpleMid:TP.ts,fontFamily:"inherit",fontSize:13,fontWeight:800,cursor:"pointer"}}>{g.label}</button>))}</div>
          </div>
          <button onClick={()=>saveNewCustomer(false)} disabled={savingCustomer||!newCustPhone||newCustPhone.length<10} style={{width:"100%",padding:13,background:savingCustomer||!newCustPhone||newCustPhone.length<10?"#d1d5db":`linear-gradient(135deg,${TP.purple},${TP.purpleMid})`,border:"none",borderRadius:12,color:"#fff",fontFamily:"inherit",fontSize:14,fontWeight:800,cursor:newCustPhone.length===10?"pointer":"not-allowed"}}>
            {savingCustomer?"Saving...":"✓ Customer + Log Save Karo"}
          </button>
        </div>
      </div>
    );
  }

  return(
    <div onClick={e=>e.target===e.currentTarget&&onClose()} style={{position:"fixed",inset:0,background:"rgba(45,27,105,0.4)",zIndex:200,display:"flex",alignItems:"flex-end"}}>
      <div style={{background:TP.surface,borderRadius:"20px 20px 0 0",padding:"20px 18px 36px",width:"100%",maxHeight:"80vh",overflowY:"auto"}}>
        <div style={{width:36,height:4,background:TP.border,borderRadius:2,margin:"0 auto 16px"}}/>
        <div style={{fontWeight:900,fontSize:16,marginBottom:16,color:TP.text}}>➕ Work Log Add Karo</div>
        <div style={{marginBottom:12}}>
          <div style={{fontSize:12,fontWeight:800,color:TP.tm,marginBottom:5}}>Client Naam *</div>
          <input style={IS} placeholder="e.g. Anjali Mehta" value={clientName} onChange={e=>setClientName(e.target.value)} autoFocus/>
        </div>
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10,marginBottom:12}}>
          <div>
            <div style={{fontSize:12,fontWeight:800,color:TP.tm,marginBottom:5}}>Service</div>
            <select style={{...IS,cursor:"pointer"}} value={service} onChange={e=>setService(e.target.value)}>
              {SERVICES.map(s=><option key={s}>{s}</option>)}
            </select>
          </div>
          <div>
            <div style={{fontSize:12,fontWeight:800,color:TP.tm,marginBottom:5}}>Date</div>
            <input style={IS} type="date" value={date} onChange={e=>setDate(e.target.value)}/>
          </div>
        </div>
        <div style={{marginBottom:18}}>
          <div style={{fontSize:12,fontWeight:800,color:TP.tm,marginBottom:5}}>Amount (₹) *</div>
          <input style={IS} type="number" placeholder="500" value={amount} onChange={e=>setAmount(e.target.value)}/>
        </div>
        <div style={{display:"flex",gap:10}}>
          <button onClick={onClose} style={{flex:1,padding:12,border:`2px solid ${TP.border}`,borderRadius:12,background:TP.surface,fontFamily:"inherit",fontSize:13,fontWeight:700,cursor:"pointer",color:TP.tm}}>Cancel</button>
          <button onClick={save} disabled={saving} style={{flex:2,padding:12,border:"none",borderRadius:12,background:clientName.trim()&&amount?`linear-gradient(135deg,${TP.purple},${TP.purpleMid})`:"#d1d5db",color:"#fff",fontFamily:"inherit",fontSize:13,fontWeight:800,cursor:"pointer"}}>
            {saving?"Saving...":"✓ Save Karo"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Attendance Tab ────────────────────────────────────────────────────────────
function AttendanceTab({staff,logs,setLogs,attendance,setAttendance,showRevenue,absentNotes,setAbsentNotes,salonId}){
  const [workTab,setWorkTab]=useState("today");
  const [showAddLog,setShowAddLog]=useState(false);

  const isPresent=!!(attendance[today]||{})[staff.id];

  async function toggleAttendance(){
    const newVal=!isPresent;
    setAttendance(prev=>{const dm={...(prev[today]||{})};dm[staff.id]=newVal;return{...prev,[today]:dm};});
    if(salonId){
      await supabase.from("attendance").upsert({
        salon_id:salonId,staff_id:staff.id,date:today,is_present:newVal,
        absent_reason:newVal?null:((absentNotes||{})[today]||null)
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

  return(
    <div style={{padding:"14px 16px 80px"}}>
      {/* Attendance card */}
      <div style={{background:isPresent?TP.gl:TP.red,border:`2px solid ${isPresent?TP.gm:TP.rb}`,borderRadius:16,padding:"16px",marginBottom:14}}>
        <div style={{display:"flex",alignItems:"center",justifyContent:"space-between"}}>
          <div>
            <div style={{fontWeight:900,fontSize:15,color:isPresent?TP.gd:TP.rt}}>{isPresent?"✅ Present Hai Aaj!":"❌ Absent Ho Aaj"}</div>
            <div style={{fontSize:12,color:isPresent?TP.gd:TP.rt,marginTop:3}}>{new Date().toLocaleDateString("en-IN",{day:"numeric",month:"long",year:"numeric"})}</div>
          </div>
          <div onClick={toggleAttendance} style={{width:56,height:28,borderRadius:14,background:isPresent?TP.green:"#d1d5db",position:"relative",cursor:"pointer",transition:"background 0.2s",flexShrink:0}}>
            <div style={{width:22,height:22,borderRadius:"50%",background:"#fff",position:"absolute",top:3,left:isPresent?31:3,transition:"left 0.2s",boxShadow:"0 1px 3px rgba(0,0,0,0.2)"}}/>
          </div>
        </div>
      </div>

      {/* Monthly stats */}
      <div style={{background:TP.surface,border:`2px solid ${TP.border}`,borderRadius:14,padding:"14px",marginBottom:14}}>
        <div style={{fontWeight:800,fontSize:13,color:TP.text,marginBottom:10}}>📅 Is Mahine ki Attendance</div>
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10}}>
          <div style={{background:TP.gl,border:`1.5px solid ${TP.gm}`,borderRadius:11,padding:"12px",textAlign:"center"}}>
            <div style={{fontSize:28,fontWeight:900,color:TP.gd}}>{monthPresent}</div>
            <div style={{fontSize:11,fontWeight:700,color:TP.gd,marginTop:2}}>Present Din</div>
          </div>
          <div style={{background:TP.red,border:`1.5px solid ${TP.rb}`,borderRadius:11,padding:"12px",textAlign:"center"}}>
            <div style={{fontSize:28,fontWeight:900,color:TP.rt}}>{monthAbsent}</div>
            <div style={{fontSize:11,fontWeight:700,color:TP.rt,marginTop:2}}>Absent Din</div>
          </div>
        </div>
        {!isPresent&&(
          <div style={{marginTop:12}}>
            <div style={{fontSize:12,fontWeight:800,color:TP.ts,marginBottom:6}}>🔒 Aaj ki absence ka reason (sirf aap dekhoge):</div>
            <input style={{...IS,background:TP.purpleLight,borderColor:TP.border}} placeholder="Reason likho — owner ko nahi dikhega..." value={(absentNotes||{})[today]||""} onChange={async e=>{
              setAbsentNotes(prev=>({...prev,[today]:e.target.value}));
              if(salonId)await supabase.from("attendance").upsert({
                salon_id:salonId,staff_id:staff.id,date:today,is_present:false,absent_reason:e.target.value
              },{onConflict:"salon_id,staff_id,date"});
            }}/>
          </div>
        )}
      </div>

      {/* Work log section */}
      <div style={{background:TP.surface,border:`2px solid ${TP.border}`,borderRadius:14,overflow:"hidden"}}>
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",background:TP.sub,borderBottom:`2px solid ${TP.border}`}}>
          {[{k:"today",l:"Aaj"},{k:"week",l:"Is Hafte"},{k:"month",l:"Is Mahine"}].map(t=>(
            <button key={t.k} onClick={()=>setWorkTab(t.k)} style={{padding:"10px 0",border:"none",background:workTab===t.k?TP.purple:"transparent",color:workTab===t.k?"#fff":TP.ts,fontSize:12,fontWeight:700,cursor:"pointer",fontFamily:"inherit"}}>{t.l}</button>
          ))}
        </div>
        <div style={{display:"grid",gridTemplateColumns:showRevenue?"1fr 1fr":"1fr",borderBottom:`2px solid ${TP.border}`}}>
          <div style={{padding:"12px",textAlign:"center",borderRight:showRevenue?`1px solid ${TP.border}`:"none"}}>
            <div style={{fontSize:24,fontWeight:900,color:TP.purpleMid}}>{filtered.length}</div>
            <div style={{fontSize:11,fontWeight:700,color:TP.ts,marginTop:2}}>Clients</div>
          </div>
          {showRevenue&&<div style={{padding:"12px",textAlign:"center"}}><div style={{fontSize:22,fontWeight:900,color:TP.gd}}>{fc(filtered.reduce((s,l)=>s+l.amount,0))}</div><div style={{fontSize:11,fontWeight:700,color:TP.ts,marginTop:2}}>Revenue</div></div>}
        </div>
        <div style={{padding:"10px 14px",borderBottom:`1px solid ${TP.border}`,display:"flex",alignItems:"center",justifyContent:"space-between"}}>
          <div style={{fontSize:13,fontWeight:800,color:TP.text}}>Mera Kaam</div>
          <button onClick={()=>setShowAddLog(true)} style={{background:`linear-gradient(135deg,${TP.purple},${TP.purpleMid})`,color:"#fff",border:"none",borderRadius:8,padding:"6px 14px",fontSize:12,fontWeight:700,cursor:"pointer"}}>+ Add Entry</button>
        </div>
        <div style={{padding:"8px 0"}}>
          {filtered.length===0
            ?<div style={{textAlign:"center",color:TP.ts,fontSize:13,padding:"24px 0"}}>Koi entry nahi — add karo!</div>
            :filtered.map(log=>(
              <div key={log.id} style={{display:"flex",alignItems:"center",gap:12,padding:"11px 14px",borderBottom:`1px solid ${TP.border}`}}>
                <div style={{flex:1}}>
                  <div style={{fontSize:14,fontWeight:700,color:TP.text}}>{log.clientName}</div>
                  <div style={{fontSize:11,color:TP.ts,marginTop:2}}>{log.service} · {fd(log.date)}</div>
                </div>
                {showRevenue&&<div style={{fontSize:14,fontWeight:700,color:TP.gd}}>{fc(log.amount)}</div>}
              </div>
            ))
          }
        </div>
      </div>
      {showAddLog&&<AddLogModal staffId={staff.id} salonId={salonId} isPresent={isPresent} onSave={addLog} onClose={()=>setShowAddLog(false)}/>}
    </div>
  );
}

// ─── Main Staff Dashboard ──────────────────────────────────────────────────────
export default function StaffDashboard({staff,showRevenue=false,onLogout}){
  const [tab,setTab]=useState("attendance");
  const [logs,setLogs]=useState([]);
  const [attendance,setAttendance]=useState({});
  const [absentNotes,setAbsentNotes]=useState({});
  const [loading,setLoading]=useState(true);

  const salonId=staff?.salon_id||null;

  useEffect(()=>{
    async function loadData(){
      if(!salonId){setLoading(false);return;}
      setLoading(true);
      const{data:logsData}=await supabase.from("work_logs").select("*").eq("salon_id",salonId).eq("staff_id",staff.id);
      if(logsData){setLogs(logsData.map(l=>({id:l.id,staffId:l.staff_id,clientName:l.client_name,service:l.service,amount:l.amount,date:l.date})));}
      const{data:attData}=await supabase.from("attendance").select("*").eq("salon_id",salonId).eq("staff_id",staff.id);
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
  },[salonId,staff?.id]);

  const c=avc(staff?.id||1);

  const TABS=[
    {id:"attendance",icon:"📋",label:"Attendance"},
    {id:"customers",icon:"👥",label:"Customers"},
  ];

  if(loading){
    return(
      <div style={{height:"100vh",display:"flex",alignItems:"center",justifyContent:"center",background:TP.bg,fontFamily:"system-ui,sans-serif"}}>
        <div style={{textAlign:"center"}}>
          <div style={{fontSize:32,marginBottom:12}}>✂️</div>
          <div style={{fontSize:14,color:TP.ts,fontWeight:700}}>Loading...</div>
        </div>
      </div>
    );
  }

  return(
    <div style={{height:"100vh",display:"flex",flexDirection:"column",fontFamily:"system-ui,sans-serif",color:TP.text,background:TP.bg,overflow:"hidden"}}>
      {/* Header */}
      <div style={{background:`linear-gradient(135deg,${TP.purple},${TP.purpleMid})`,padding:"12px 16px",display:"flex",alignItems:"center",justifyContent:"space-between",flexShrink:0}}>
        <div style={{display:"flex",alignItems:"center",gap:10}}>
          <div style={{width:40,height:40,borderRadius:12,background:c.avBg,display:"flex",alignItems:"center",justifyContent:"center",fontSize:15,fontWeight:900,color:c.avColor,flexShrink:0}}>{initials(staff?.name||"ST")}</div>
          <div>
            <div style={{fontWeight:900,fontSize:14,color:"#fff"}}>{staff?.name}</div>
            <div style={{fontSize:11,color:"#c4b8f0",marginTop:1}}>{staff?.role} · 👨‍💼 Staff Portal</div>
          </div>
        </div>
        <button onClick={onLogout} style={{background:"transparent",border:"1px solid rgba(255,255,255,0.3)",color:"#fff",borderRadius:8,padding:"6px 12px",fontSize:12,cursor:"pointer",fontFamily:"inherit"}}>Logout</button>
      </div>

      {/* Tab bar */}
      <div style={{background:TP.surface,borderBottom:`2px solid ${TP.border}`,display:"flex",flexShrink:0}}>
        {TABS.map(t=>(
          <div key={t.id} onClick={()=>setTab(t.id)} style={{flex:1,padding:"11px 4px",display:"flex",flexDirection:"column",alignItems:"center",gap:3,cursor:"pointer",borderBottom:`3px solid ${tab===t.id?TP.purpleMid:"transparent"}`,background:tab===t.id?TP.purpleLight:"transparent",transition:"background 0.15s"}}>
            <span style={{fontSize:19}}>{t.icon}</span>
            <span style={{fontSize:11,fontWeight:800,color:tab===t.id?TP.purpleMid:TP.tf}}>{t.label}</span>
          </div>
        ))}
      </div>

      {/* Content */}
      <div style={{flex:1,overflow:"hidden",display:"flex",flexDirection:"column"}}>
        {tab==="attendance"&&(
          <div style={{flex:1,overflowY:"auto"}}>
            <AttendanceTab
              staff={staff}
              logs={logs}
              setLogs={setLogs}
              attendance={attendance}
              setAttendance={setAttendance}
              showRevenue={showRevenue}
              absentNotes={absentNotes}
              setAbsentNotes={setAbsentNotes}
              salonId={salonId}
            />
          </div>
        )}
        {tab==="customers"&&salonId&&(
          <CustomerHistory
            key={salonId}
            currentUser={{
              id:salonId,salon_id:salonId,role:"staff",name:staff?.name||"Staff",
            }}
          />
        )}
      </div>
    </div>
  );
}

// ─── Staff Login Page ──────────────────────────────────────────────────────────
export function StaffLoginPage({salonId,onLogin,onBack}){
  const [staffList,setStaffList]=useState([]);
  const [selectedId,setSelectedId]=useState("");
  const [pin,setPin]=useState("");
  const [error,setError]=useState("");
  const [loading,setLoading]=useState(false);
  const [loadingStaff,setLoadingStaff]=useState(true);

  useEffect(()=>{
    async function loadStaff(){
      if(!salonId){setLoadingStaff(false);return;}
      const{data}=await supabase.from("staff").select("*").eq("salon_id",salonId);
      if(data&&data.length>0){setStaffList(data);setSelectedId(data[0].id);}
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
        setError("PIN galat hai! Dobara try karo.");
        setPin("");setLoading(false);
      }
    },800);
  }

  if(loadingStaff){
    return(
      <div style={{minHeight:"100vh",background:`linear-gradient(135deg,${TP.purple},${TP.purpleMid})`,display:"flex",alignItems:"center",justifyContent:"center",fontFamily:"system-ui,sans-serif"}}>
        <div style={{textAlign:"center",color:"#fff"}}>
          <div style={{fontSize:32,marginBottom:12}}>✂️</div>
          <div style={{fontSize:14,color:"#c4b8f0"}}>Staff load ho raha hai...</div>
        </div>
      </div>
    );
  }

  if(!salonId||staffList.length===0){
    return(
      <div style={{minHeight:"100vh",background:`linear-gradient(135deg,${TP.purple},${TP.purpleMid})`,display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",padding:"24px 20px",fontFamily:"system-ui,sans-serif"}}>
        <div style={{fontSize:28,fontWeight:900,color:"#fff",marginBottom:4}}>✂️ SnipBook</div>
        <div style={{background:"#fff",borderRadius:20,padding:"26px 22px",width:"100%",maxWidth:360,marginTop:24}}>
          <div style={{fontWeight:900,fontSize:17,marginBottom:8,color:TP.text}}>Koi staff nahi mila</div>
          <div style={{fontSize:13,color:TP.ts,marginBottom:20}}>Is salon mein koi staff registered nahi hai.</div>
          <button onClick={onBack} style={{width:"100%",padding:"13px",background:`linear-gradient(135deg,${TP.purple},${TP.purpleMid})`,border:"none",borderRadius:12,color:"#fff",fontFamily:"inherit",fontSize:14,fontWeight:800,cursor:"pointer"}}>← Back to Login</button>
        </div>
      </div>
    );
  }

  return(
    <div style={{minHeight:"100vh",background:`linear-gradient(135deg,${TP.purple},${TP.purpleMid})`,display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",padding:"24px 20px",fontFamily:"system-ui,sans-serif"}}>
      <div style={{fontSize:28,fontWeight:900,color:"#fff",marginBottom:4}}>✂️ SnipBook</div>
      <div style={{fontSize:13,color:"#c4b8f0",marginBottom:32}}>Staff Portal</div>

      <div style={{background:"#fff",borderRadius:20,padding:"26px 22px",width:"100%",maxWidth:360,boxShadow:"0 16px 48px rgba(45,27,105,0.3)"}}>
        <div style={{fontWeight:900,fontSize:17,marginBottom:3,color:TP.text}}>Staff Login</div>
        <div style={{fontSize:13,color:TP.ts,marginBottom:20}}>Apna naam aur PIN daalo</div>

        <div style={{marginBottom:14}}>
          <div style={{fontSize:13,fontWeight:800,color:TP.tm,marginBottom:6}}>Apna Naam</div>
          <select style={{...{width:"100%",padding:"11px 13px",border:`2px solid ${TP.border}`,borderRadius:11,fontSize:14,fontFamily:"inherit",outline:"none",background:TP.inp,boxSizing:"border-box",color:TP.text},cursor:"pointer"}} value={selectedId} onChange={e=>{setSelectedId(e.target.value);setError("");}}>
            {staffList.map(s=><option key={s.id} value={s.id}>{s.name} — {s.role}</option>)}
          </select>
        </div>

        <div style={{marginBottom:18}}>
          <div style={{fontSize:13,fontWeight:800,color:TP.tm,marginBottom:6}}>4-digit PIN</div>
          <input style={{width:"100%",padding:"11px 13px",border:`2px solid ${TP.border}`,borderRadius:11,fontSize:14,fontFamily:"inherit",outline:"none",background:TP.inp,boxSizing:"border-box",color:TP.text}} type="password" placeholder="••••" maxLength={4} value={pin} onChange={e=>{setPin(e.target.value);setError("");}} onKeyDown={e=>e.key==="Enter"&&handleLogin()}/>
        </div>

        {error&&<div style={{background:TP.red,border:`1.5px solid ${TP.rb}`,borderRadius:9,padding:"9px 12px",marginBottom:14,fontSize:12,color:TP.rt,fontWeight:600}}>⚠️ {error}</div>}

        <button onClick={handleLogin} disabled={loading} style={{width:"100%",padding:"13px",background:loading?"#c4b8f0":`linear-gradient(135deg,${TP.purple},${TP.purpleMid})`,border:"none",borderRadius:12,color:"#fff",fontFamily:"inherit",fontSize:15,fontWeight:800,cursor:"pointer",marginBottom:12}}>
          {loading?"Logging in...":"Login Karo →"}
        </button>

        <button onClick={onBack} style={{width:"100%",background:"none",border:"none",color:TP.ts,fontSize:13,fontWeight:700,cursor:"pointer",fontFamily:"inherit"}}>← Back to Login</button>
      </div>
    </div>
  );
}
