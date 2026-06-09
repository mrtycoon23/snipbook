import { useState, useMemo, useEffect } from "react";
import { supabase } from "../lib/supabase";
import CustomerHistory from "./CustomerHistoryApp";

const TP={
  bg:"#f4f2ff",surface:"#ffffff",border:"#e0d8ff",
  purple:"#2d1b69",purpleLight:"#ede9fe",purpleMid:"#5b3fc4",
  text:"#1a0a4a",tm:"#4a3580",ts:"#9b8ec4",tf:"#c4b8f0",
  green:"#22c55e",gl:"#e8fdf0",gm:"#bbf7d0",gd:"#16a34a",
  yellow:"#fef9c3",yb:"#fde68a",yt:"#a16207",
  red:"#fff0f0",rb:"#fca5a5",rt:"#dc2626",
  sub:"#f4f2ff",inp:"#fafbff",
};

const IS={
  width:"100%",padding:"11px 13px",border:`2px solid ${TP.border}`,
  borderRadius:11,fontSize:14,fontFamily:"inherit",outline:"none",
  background:TP.inp,boxSizing:"border-box",color:TP.text,
};

const CARD_COLORS=[
  {cardBg:"#ede9fe",avBg:"#c4b8f0",avColor:"#2d1b69"},
  {cardBg:"#fef9c3",avBg:"#fde68a",avColor:"#a16207"},
  {cardBg:"#f0fdf4",avBg:"#bbf7d0",avColor:"#16a34a"},
  {cardBg:"#fff0f6",avBg:"#fbcfe8",avColor:"#db2777"},
  {cardBg:"#eff6ff",avBg:"#bfdbfe",avColor:"#1d4ed8"},
  {cardBg:"#fff7ed",avBg:"#fed7aa",avColor:"#ea580c"},
  {cardBg:"#f0fdfa",avBg:"#99f6e4",avColor:"#0f766e"},
];

const SERVICES=["Haircut","Haircut + Beard","Hair Colour","Facial + Cleanup","Bridal Makeup","Hair Spa","Manicure/Pedicure","Beard Trim","Blow Dry","Head Massage","Waxing","Threading","Keratin","Blowdry"];
const today=new Date().toISOString().slice(0,10);
const thisWeekStart=(()=>{const d=new Date();d.setDate(d.getDate()-d.getDay());return d.toISOString().slice(0,10);})();
const thisMonthStart=new Date().toISOString().slice(0,8)+"01";

function initials(name){return name.split(" ").map(w=>w[0]).join("").substring(0,2).toUpperCase();}
function avc(id){const n=typeof id==="string"?id.charCodeAt(0):(id||1);return CARD_COLORS[Math.abs(n)%CARD_COLORS.length];}
function fc(n){return "₹"+Number(n).toLocaleString("en-IN");}
function fd(d){return new Date(d+"T00:00:00").toLocaleDateString("en-IN",{day:"numeric",month:"short"});}

// ─── Add Work Log Modal ───────────────────────────────────────────────────────
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
            <button onClick={onClose} style={{padding:"12px 32px",background:TP.green,border:"none",borderRadius:12,color:"#fff",fontFamily:"inherit",fontSize:14,fontWeight:800,cursor:"pointer"}}>Okay, Got it</button>
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
          setSaving(false);setShowNewCustomer(true);return;
        }
      }
      await saveLog({staffId,clientName:clientName.trim(),service,amount:Number(amount),date});
    }catch(e){
      setPendingLogData({staffId,clientName:clientName.trim(),service,amount:Number(amount),date});
      setSaving(false);setShowNewCustomer(true);
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
      onSave({id:Date.now(),...logData});onClose();
    }catch(e){console.error(e);}
  }

  async function saveNewCustomer(){
    setSavingCustomer(true);
    try{
      if(salonId){
        await supabase.from("customers").insert({
          salon_id:salonId,name:pendingLogData.clientName,
          phone:newCustPhone||"",birthday:newCustDob||null,gender:newCustGender||"male",
        });
      }
      await saveLog(pendingLogData);
    }catch(e){await saveLog(pendingLogData);}
    setSavingCustomer(false);
  }

  if(showNewCustomer&&pendingLogData){
    return(
      <div onClick={e=>e.target===e.currentTarget&&onClose()} style={{position:"fixed",inset:0,background:"rgba(45,27,105,0.4)",zIndex:200,display:"flex",alignItems:"flex-end"}}>
        <div style={{background:TP.surface,borderRadius:"20px 20px 0 0",padding:"20px 18px 36px",width:"100%",maxHeight:"90vh",overflowY:"auto"}}>
          <div style={{width:36,height:4,background:TP.border,borderRadius:2,margin:"0 auto 16px"}}/>
          <div style={{display:"flex",alignItems:"center",gap:12,marginBottom:16}}>
            <div style={{width:44,height:44,borderRadius:14,background:TP.purpleLight,display:"flex",alignItems:"center",justifyContent:"center",fontSize:22}}>🆕</div>
            <div><div style={{fontWeight:900,fontSize:16,color:TP.text}}>New Customer!</div><div style={{fontSize:12,color:TP.ts,marginTop:2}}>{pendingLogData.clientName} first time visit</div></div>
          </div>
          <div style={{marginBottom:12}}><div style={{fontSize:12,fontWeight:800,color:TP.tm,marginBottom:5}}>Phone Number *</div><input style={IS} type="tel" placeholder="9876543210" value={newCustPhone} onChange={e=>setNewCustPhone(e.target.value.replace(/\D/g,"").slice(0,10))} autoFocus/></div>
          <div style={{marginBottom:12}}><div style={{fontSize:12,fontWeight:800,color:TP.tm,marginBottom:5}}>Date of Birth (optional)</div><input style={IS} type="date" value={newCustDob} onChange={e=>setNewCustDob(e.target.value)}/></div>
          <div style={{marginBottom:16}}><div style={{fontSize:12,fontWeight:800,color:TP.tm,marginBottom:8}}>Gender</div>
            <div style={{display:"flex",gap:8}}>{[{id:"male",label:"👨 Male"},{id:"female",label:"👩 Female"}].map(g=>(<button key={g.id} onClick={()=>setNewCustGender(g.id)} style={{flex:1,padding:"9px",borderRadius:10,border:`2px solid ${newCustGender===g.id?TP.purpleMid:TP.border}`,background:newCustGender===g.id?TP.purpleLight:TP.surface,color:newCustGender===g.id?TP.purpleMid:TP.ts,fontFamily:"inherit",fontSize:13,fontWeight:800,cursor:"pointer"}}>{g.label}</button>))}</div>
          </div>
          <button onClick={saveNewCustomer} disabled={savingCustomer||!newCustPhone||newCustPhone.length<10} style={{width:"100%",padding:13,background:savingCustomer||!newCustPhone||newCustPhone.length<10?"#d1d5db":`linear-gradient(135deg,${TP.purple},${TP.purpleMid})`,border:"none",borderRadius:12,color:"#fff",fontFamily:"inherit",fontSize:14,fontWeight:800,cursor:newCustPhone.length===10?"pointer":"not-allowed"}}>
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
        <div style={{marginBottom:12}}><div style={{fontSize:12,fontWeight:800,color:TP.tm,marginBottom:5}}>Client Naam *</div><input style={IS} placeholder="e.g. Anjali Mehta" value={clientName} onChange={e=>setClientName(e.target.value)} autoFocus/></div>
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10,marginBottom:12}}>
          <div><div style={{fontSize:12,fontWeight:800,color:TP.tm,marginBottom:5}}>Service</div><select style={{...IS,cursor:"pointer"}} value={service} onChange={e=>setService(e.target.value)}>{SERVICES.map(s=><option key={s}>{s}</option>)}</select></div>
          <div><div style={{fontSize:12,fontWeight:800,color:TP.tm,marginBottom:5}}>Date</div><input style={IS} type="date" value={date} onChange={e=>setDate(e.target.value)}/></div>
        </div>
        <div style={{marginBottom:18}}><div style={{fontSize:12,fontWeight:800,color:TP.tm,marginBottom:5}}>Amount (₹) *</div><input style={IS} type="number" placeholder="500" value={amount} onChange={e=>setAmount(e.target.value)}/></div>
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

// ─── Attendance Tab ───────────────────────────────────────────────────────────
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
  let streak=0;
  for(let i=0;i<30;i++){const dd=new Date();dd.setDate(dd.getDate()-i);const ds=dd.toISOString().slice(0,10);if((attendance[ds]||{})[staff.id])streak++;else if(i>0)break;}

  function svcIcon(svc){const s=(svc||"").toLowerCase();if(s.includes("color")||s.includes("colour"))return{icon:"🎨",bg:"#fff7ed",border:"#fed7aa",color:"#ea580c"};if(s.includes("beard")||s.includes("shave"))return{icon:"🪒",bg:"#f0fdf4",border:"#bbf7d0",color:"#16a34a"};if(s.includes("facial")||s.includes("face"))return{icon:"💆",bg:"#fdf4ff",border:"#e9d5ff",color:"#9333ea"};return{icon:"✂️",bg:"#f0eeff",border:"#ddd6fe",color:"#5b3fc4"};}
  const N={white:"#fff",bg:"#f8f7ff",border:"#f1f0f5",text:"#0f0a2e",muted:"#6b7280",mid:"#5b3fc4"};
  const attRate=monthPresent+monthAbsent>0?Math.round((monthPresent/(monthPresent+monthAbsent))*100):0;
  const monthClients=useMemo(()=>new Set(logs.filter(l=>l.staffId===staff.id&&l.date>=thisMonthStart).map(l=>l.clientName)).size,[logs,staff.id]);
  const monthLogs=logs.filter(l=>l.staffId===staff.id&&l.date>=thisMonthStart).length;
  const monthRevenue=logs.filter(l=>l.staffId===staff.id&&l.date>=thisMonthStart).reduce((s,l)=>s+l.amount,0);
  const heatDays=[];
  for(let i=13;i>=0;i--){const d=new Date();d.setDate(d.getDate()-i);const ds=d.toISOString().slice(0,10);heatDays.push({ds,present:!!(attendance[ds]||{})[staff.id],future:ds>today});}


  return(
    <div style={{padding:"12px 14px 80px",background:N.bg}}>

      {/* WHITE HERO CARD */}
      <div style={{background:N.white,borderRadius:18,padding:"14px",border:"1px solid #e5e7eb",boxShadow:"0 2px 12px rgba(0,0,0,0.05)",marginBottom:10,position:"relative",overflow:"hidden"}}>


        {/* Title + Rate */}
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:12}}>
          <div>
            <div style={{fontSize:10,color:"#9b8ec4",letterSpacing:"0.5px"}}>{new Date().toLocaleDateString("en-IN",{month:"long",year:"numeric"}).toUpperCase()}</div>
            <div style={{fontSize:15,fontWeight:800,color:N.text,marginTop:2}}>Attendance Overview</div>
          </div>
          <div style={{textAlign:"right"}}>
            <div style={{fontSize:22,fontWeight:800,color:attRate>=80?"#16a34a":attRate>=60?"#d97706":"#dc2626",lineHeight:1}}>{attRate}%</div>
            <div style={{fontSize:9,color:"#9ca3af",marginTop:1}}>att. rate</div>
          </div>
        </div>

        {/* Row: Donut left, Heatmap right */}
        <div style={{display:"flex",gap:10,marginBottom:10,alignItems:"flex-start"}}>

          {/* Left col: donut + 4 pills */}
          <div style={{display:"flex",flexDirection:"column",alignItems:"center",gap:6,flexShrink:0,width:90}}>
            <svg width="72" height="72" viewBox="0 0 72 72">
              <circle cx="36" cy="36" r="26" fill="none" stroke="#f1f0f5" strokeWidth="9"/>
              <circle cx="36" cy="36" r="26" fill="none" stroke="#22c55e" strokeWidth="9"
                strokeDasharray={`${(monthPresent/Math.max(monthPresent+monthAbsent,1))*163} 163`}
                strokeLinecap="round" transform="rotate(-90 36 36)"/>
              <circle cx="36" cy="36" r="26" fill="none" stroke="#f87171" strokeWidth="9"
                strokeDasharray={`${(monthAbsent/Math.max(monthPresent+monthAbsent,1))*163} 163`}
                strokeDashoffset={`-${(monthPresent/Math.max(monthPresent+monthAbsent,1))*163}`}
                strokeLinecap="round" transform="rotate(-90 36 36)"/>
              <text x="36" y="32" textAnchor="middle" fill={N.text} fontSize="10" fontWeight="800" fontFamily="system-ui">{monthPresent}/{monthAbsent}</text>
              <text x="36" y="44" textAnchor="middle" fill="#9ca3af" fontSize="7" fontFamily="system-ui">P / A</text>
            </svg>
            {/* 4 mini pills 2x2 */}
            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:4,width:"100%"}}>
              {[
                {bg:"#f0fdf4",c:"#16a34a",v:monthPresent,l:"Present"},
                {bg:"#fff5f5",c:"#dc2626",v:monthAbsent,l:"Absent"},
                {bg:"#eff6ff",c:"#2563eb",v:monthClients,l:"Clients"},
                {bg:"#f5f3ff",c:N.mid,v:monthLogs,l:"Logs"},
              ].map(s=>(
                <div key={s.l} style={{background:s.bg,borderRadius:7,padding:"5px 3px",textAlign:"center"}}>
                  <div style={{fontSize:13,fontWeight:800,color:s.c,lineHeight:1}}>{s.v}</div>
                  <div style={{fontSize:7,color:"#6b7280",marginTop:2}}>{s.l}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Right col: heatmap + revenue/logs */}
          <div style={{flex:1,minWidth:0,display:"flex",flexDirection:"column",gap:8}}>
            {/* Heatmap */}
            <div>
              <div style={{display:"grid",gridTemplateColumns:"repeat(7,1fr)",gap:3,marginBottom:3}}>
                {["M","T","W","T","F","S","S"].map((l,i)=><div key={i} style={{fontSize:7,color:"#9ca3af",textAlign:"center"}}>{l}</div>)}
              </div>
              <div style={{display:"grid",gridTemplateColumns:"repeat(7,1fr)",gap:3}}>
                {heatDays.map((d,i)=>(
                  <div key={i} style={{height:15,borderRadius:4,background:d.future?"#f1f0f5":d.present?"#bbf7d0":"#fca5a5"}}/>
                ))}
              </div>
            </div>
            <div style={{height:1,background:"#f1f0f5"}}/>
            {/* Revenue + logs */}
            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:6}}>
              <div style={{background:"#f0fdf4",border:"1px solid #bbf7d0",borderRadius:10,padding:"9px 10px"}}>
                <div style={{fontSize:14,fontWeight:800,color:"#16a34a",lineHeight:1}}>{fc(monthRevenue)}</div>
                <div style={{fontSize:9,color:"#6b7280",marginTop:3}}>Revenue</div>
                <div style={{fontSize:8,color:"#16a34a",marginTop:2}}>↑ 25% vs last</div>
              </div>
              <div style={{background:"#f5f3ff",border:"1px solid #ddd6fe",borderRadius:10,padding:"9px 10px"}}>
                <div style={{fontSize:14,fontWeight:800,color:N.mid,lineHeight:1}}>{monthLogs} logs</div>
                <div style={{fontSize:9,color:"#6b7280",marginTop:3}}>Work Entries</div>
                <div style={{fontSize:8,color:N.mid,marginTop:2}}>This Month</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Present/Absent toggle */}
      <div style={{background:isPresent?"#f0fdf4":"#fff5f5",border:`1px solid ${isPresent?"#bbf7d0":"#fca5a5"}`,borderRadius:12,padding:"10px 14px",marginBottom:10,display:"flex",alignItems:"center",justifyContent:"space-between"}}>
        <div style={{display:"flex",alignItems:"center",gap:9}}>
          <div style={{width:28,height:28,borderRadius:"50%",background:isPresent?"#22c55e":"#f87171",display:"flex",alignItems:"center",justifyContent:"center",fontSize:12,color:"#fff",flexShrink:0}}>{isPresent?"✓":"✗"}</div>
          <div>
            <div style={{fontSize:12,fontWeight:800,color:isPresent?"#15803d":"#b91c1c"}}>{isPresent?"Present Today 🎉":"Absent Today"}</div>
            <div style={{fontSize:9,color:isPresent?"#16a34a":"#dc2626",marginTop:1}}>{new Date().toLocaleDateString("en-IN",{day:"numeric",month:"long",year:"numeric"})}</div>
          </div>
        </div>
        <div style={{display:"flex",alignItems:"center",gap:6}}>
          <span style={{fontSize:9,color:"#6b7280"}}>Mark Absent</span>
          <div onClick={toggleAttendance} style={{width:34,height:19,borderRadius:10,background:isPresent?"#22c55e":"#d1d5db",position:"relative",cursor:"pointer",flexShrink:0}}>
            <div style={{width:13,height:13,borderRadius:"50%",background:"#fff",position:"absolute",top:3,left:isPresent?18:3,transition:"left 0.2s",boxShadow:"0 1px 2px rgba(0,0,0,0.15)"}}/>
          </div>
        </div>
      </div>

      {streak>=3&&(
        <div style={{background:"linear-gradient(135deg,#fff7ed,#fef3c7)",border:"1px solid #fde68a",borderRadius:14,padding:"10px 14px",display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:10}}>
          <div style={{display:"flex",alignItems:"center",gap:10}}>
            <div style={{fontSize:24}}>🔥</div>
            <div>
              <div style={{fontSize:13,fontWeight:800,color:"#78350f"}}>{streak} Day Streak!</div>
              <div style={{fontSize:10,color:"#a16207",marginTop:1}}>Keep it up — on a roll!</div>
            </div>
          </div>
          <div style={{display:"flex",gap:4}}>{["M","T","W","T","F"].slice(0,Math.min(streak,5)).map((l,i)=>(<div key={i} style={{width:22,height:22,borderRadius:"50%",background:"#22c55e",display:"flex",alignItems:"center",justifyContent:"center",fontSize:8,color:"#fff",fontWeight:700}}>{l}</div>))}</div>
        </div>
      )}

      {!isPresent&&(
        <div style={{background:N.white,border:"1px solid #f1f0f5",borderRadius:12,padding:"12px 14px",marginBottom:10}}>
          <div style={{fontSize:11,fontWeight:700,color:"#6b7280",marginBottom:6}}>🔒 Reason for absence (only you can see):</div>
          <input style={{...IS,background:"#f8f7ff",borderColor:"#e0d8ff"}} placeholder="Add reason — owner won't see this..." value={(absentNotes||{})[today]||""} onChange={async e=>{
            setAbsentNotes(prev=>({...prev,[today]:e.target.value}));
            if(salonId)await supabase.from("attendance").upsert({salon_id:salonId,staff_id:staff.id,date:today,is_present:false,absent_reason:e.target.value},{onConflict:"salon_id,staff_id,date"});
          }}/>
        </div>
      )}

      {/* Work Entries */}
      <div style={{background:N.white,borderRadius:12,border:"1px solid #f1f0f5",overflow:"hidden"}}>
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",background:"#f8f7ff",borderBottom:"1px solid #f1f0f5"}}>
          {[{k:"today",l:"Today"},{k:"week",l:"This Week"},{k:"month",l:"This Month"}].map(t=>(
            <button key={t.k} onClick={()=>setWorkTab(t.k)} style={{padding:"7px 0",border:"none",background:workTab===t.k?"#5b3fc4":"transparent",color:workTab===t.k?"#fff":"#9ca3af",fontSize:11,fontWeight:700,cursor:"pointer",fontFamily:"inherit"}}>{t.l}</button>
          ))}
        </div>
        <div style={{padding:"9px 12px",borderBottom:"1px solid #f1f0f5"}}>
          <div style={{fontSize:12,fontWeight:800,color:N.text}}>Work Entries</div>
        </div>
        <div>
          {filtered.length===0
            ?<div style={{textAlign:"center",padding:"22px 16px"}}>
                <div style={{width:46,height:46,borderRadius:14,background:"linear-gradient(135deg,#f0eeff,#e4dcff)",display:"flex",alignItems:"center",justifyContent:"center",fontSize:20,margin:"0 auto 10px"}}>✂️</div>
                <div style={{fontSize:13,fontWeight:800,color:"#0f0a2e",marginBottom:4}}>Start your day!</div>
                <div style={{fontSize:11,color:"#9b8ec4",lineHeight:1.5}}>No work entries yet.<br/>Add your first service.</div>
              </div>
            :filtered.map((log,i)=>{
              const cc=CARD_COLORS[i%CARD_COLORS.length];
              return(
                <div key={log.id} style={{display:"flex",alignItems:"center",gap:10,padding:"10px 12px",borderBottom:"1px solid #f9f9f9",cursor:"pointer"}}>
                  <div style={{width:32,height:32,borderRadius:9,background:svcIcon(log.service).bg,border:`1px solid ${svcIcon(log.service).border}`,display:"flex",alignItems:"center",justifyContent:"center",fontSize:15,flexShrink:0}}>{svcIcon(log.service).icon}</div>
                  <div style={{flex:1,minWidth:0}}>
                    <div style={{fontSize:13,fontWeight:700,color:N.text}}>{log.clientName}</div>
                    <div style={{fontSize:10,color:svcIcon(log.service).color,fontWeight:600,marginTop:1}}>{log.service} · {fd(log.date)}</div>
                  </div>
                  {showRevenue&&<div style={{fontSize:12,fontWeight:700,color:"#16a34a",flexShrink:0}}>{fc(log.amount)}</div>}
                  <span style={{color:"#9ca3af",fontSize:14,flexShrink:0}}>›</span>
                </div>
              );
            })
          }
        </div>
      </div>
      {showAddLog&&<AddLogModal staffId={staff.id} salonId={salonId} isPresent={isPresent} onSave={addLog} onClose={()=>setShowAddLog(false)}/>}
    </div>
  );
}

// ─── Main Staff Dashboard ─────────────────────────────────────────────────────
export default function StaffDashboard({staff,showRevenue=false,onLogout}){
  const [tab,setTab]=useState("attendance");
  const [showAddLogFab,setShowAddLogFab]=useState(false);
  const [logs,setLogs]=useState([]);
  const [attendance,setAttendance]=useState({});
  const [absentNotes,setAbsentNotes]=useState({});
  const [loading,setLoading]=useState(true);
  const salonId=staff?.salon_id||null;
  const c=avc(staff?.id||1);

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

      {/* White Header */}
      <div style={{background:"#fff",padding:"12px 16px 10px",display:"flex",alignItems:"center",justifyContent:"space-between",borderBottom:"1px solid #f1f0f5",flexShrink:0}}>
        <div style={{display:"flex",alignItems:"center",gap:10}}>
          <div style={{width:38,height:38,borderRadius:12,background:c.avBg,display:"flex",alignItems:"center",justifyContent:"center",fontWeight:800,fontSize:14,color:c.avColor,flexShrink:0}}>{initials(staff?.name||"ST")}</div>
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
        setError("PIN galat hai! Dobara try karo.");
        setPin("");setLoading(false);
      }
    },800);
  }

  if(loadingStaff){
    return(<div style={{minHeight:"100vh",background:"linear-gradient(135deg,#1a1a2e,#16213e)",display:"flex",alignItems:"center",justifyContent:"center",fontFamily:"system-ui,sans-serif"}}><div style={{textAlign:"center",color:"#fff"}}><div style={{fontSize:32,marginBottom:12}}>✂️</div><div style={{fontSize:14,color:"#a0a0c0"}}>Staff load ho raha hai...</div></div></div>);
  }

  if(!salonId||staffList.length===0){
    return(
      <div style={{minHeight:"100vh",background:"linear-gradient(135deg,#1a1a2e,#16213e)",display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",padding:"24px 20px",fontFamily:"system-ui,sans-serif"}}>
        <div style={{fontSize:28,fontWeight:900,color:"#fff",marginBottom:4}}>✂️ SnipBook</div>
        <div style={{background:"#fff",borderRadius:20,padding:"26px 22px",width:"100%",maxWidth:360,marginTop:24}}>
          <div style={{fontWeight:900,fontSize:17,marginBottom:8,color:T.text}}>Koi staff nahi mila</div>
          <div style={{fontSize:13,color:T.ts,marginBottom:20}}>Is salon mein koi staff registered nahi hai.</div>
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
        <div style={{fontSize:13,color:T.ts,marginBottom:20}}>Apna naam aur PIN daalo</div>

        <div style={{marginBottom:14}}>
          <div style={{fontSize:13,fontWeight:800,color:T.tm,marginBottom:6}}>Apna Naam</div>
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
          {loading?"Logging in...":"Login Karo →"}
        </button>

        <button onClick={onBack} style={{width:"100%",background:"none",border:"none",color:T.ts,fontSize:13,fontWeight:700,cursor:"pointer",fontFamily:"inherit"}}>← Back to Login</button>
      </div>
    </div>
  );
}
