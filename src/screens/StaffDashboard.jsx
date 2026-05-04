import { useState, useMemo, useEffect } from "react";
import { supabase } from "../lib/supabase";

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

function getBirthdayStatus(dob){
  if(!dob)return null;
  const now=new Date();const bday=new Date(dob);
  bday.setFullYear(now.getFullYear());
  const diff=Math.ceil((bday-now)/(1000*60*60*24));
  if(diff===0)return{label:"🎂 Birthday Today!",color:T.rt,bg:T.red,border:T.rb};
  if(diff>0&&diff<=7)return{label:`🎂 Birthday in ${diff} day${diff>1?"s":""}`,color:T.yt,bg:T.yellow,border:T.yb};
  return null;
}

const TAG_STYLES={
  VIP:{bg:T.yellow,color:T.yt,border:T.yb,label:"⭐ VIP"},
  Regular:{bg:T.gl,color:T.gd,border:T.gm,label:"Regular"},
  New:{bg:T.blue,color:T.bt,border:T.bb,label:"New"},
};

// ─── Add Work Log Modal ────────────────────────────────────────────────────────
function AddLogModal({staffId,salonId,isPresent,onSave,onClose}){
  const [clientName,setClientName]=useState("");
  const [service,setService]=useState(SERVICES[0]);
  const [amount,setAmount]=useState("");
  const [date,setDate]=useState(today);
  const [saving,setSaving]=useState(false);
  // New customer popup state
  const [showNewCustomer,setShowNewCustomer]=useState(false);
  const [newCustPhone,setNewCustPhone]=useState("");
  const [newCustDob,setNewCustDob]=useState("");
  const [savingCustomer,setSavingCustomer]=useState(false);
  const [pendingLogData,setPendingLogData]=useState(null);

  // ✅ Issue 2: Check present before allowing log
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
      // ✅ Issue 1: Check if customer exists
      if(salonId){
        const {data:existingCustomers}=await supabase.from("customers").select("id").eq("salon_id",salonId).eq("name",clientName.trim());
        if(!existingCustomers||existingCustomers.length===0){
          // New customer! Show popup
          setPendingLogData({staffId,clientName:clientName.trim(),service,amount:Number(amount),date});
          setSaving(false);
          setShowNewCustomer(true);
          return;
        }
      }
      await saveLog({staffId,clientName:clientName.trim(),service,amount:Number(amount),date});
    }catch(e){
      // Customer not found - show new customer popup
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
        // Save customer to DB
        const colors=["#22c55e","#3b82f6","#a855f7","#f59e0b","#14b8a6","#ec4899"];
        await supabase.from("customers").insert({
 salon_id:salonId,
name:pendingLogData.clientName,
phone:newCustPhone||"",
birthday:newCustDob||null,
        });
      }
      // Save log anyway
      await saveLog(pendingLogData);
    }catch(e){
      console.error(e);
      // Save log even if customer save fails
      await saveLog(pendingLogData);
    }
    setSavingCustomer(false);
  }

  // New Customer Popup
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
          <div style={{marginBottom:20}}>
            <div style={{fontSize:12,fontWeight:800,color:T.tm,marginBottom:5}}>Date of Birth (optional)</div>
            <input style={IS} type="date" value={newCustDob} onChange={e=>setNewCustDob(e.target.value)}/>
          </div>
          <button onClick={()=>saveNewCustomer(false)} disabled={savingCustomer||!newCustPhone||newCustPhone.length<10} style={{width:"100%",padding:13,background:savingCustomer||!newCustPhone||newCustPhone.length<10?"#d1d5db":T.green,border:"none",borderRadius:12,color:"#fff",fontFamily:"inherit",fontSize:14,fontWeight:800,cursor:newCustPhone.length===10?"pointer":"not-allowed"}}>
            {savingCustomer?"Saving...":"✓ Customer + Log Save Karo"}
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
            {saving?"Saving...":"✓ Save Karo"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── WA Prompt ────────────────────────────────────────────────────────────────
function WAPrompt({customer,visit,onDone}){
  const [sent,setSent]=useState(false);
  const msg=`🙏 Namaste ${customer.name}!\n\n✂️ Visit Summary\n💈 Salon\n\nServices: ${visit.services.join(", ")}\n💰 Amount: ₹${visit.amount}\n\nThank you! 💈`.trim();
  const waUrl=`https://wa.me/${customer.phone}?text=${encodeURIComponent(msg)}`;
  return(
    <div style={{position:"fixed",inset:0,background:"rgba(0,0,0,0.5)",zIndex:400,display:"flex",alignItems:"flex-end"}}>
      <div style={{background:T.surface,borderRadius:"20px 20px 0 0",padding:"20px 18px 36px",width:"100%"}}>
        <div style={{width:36,height:4,background:T.border,borderRadius:2,margin:"0 auto 16px"}}/>
        <div style={{display:"flex",alignItems:"center",gap:12,marginBottom:14}}>
          <div style={{width:44,height:44,borderRadius:14,background:"#e7fce8",border:"2px solid #a7f3c0",display:"flex",alignItems:"center",justifyContent:"center",fontSize:22}}>💬</div>
          <div><div style={{fontWeight:900,fontSize:15}}>Send Visit Summary?</div><div style={{fontSize:12,color:T.ts}}>to {customer.name}</div></div>
        </div>
        {!sent?(
          <div style={{display:"flex",gap:10}}>
            <button onClick={onDone} style={{flex:1,padding:12,border:`2px solid ${T.border}`,borderRadius:12,background:T.surface,fontFamily:"inherit",fontSize:13,fontWeight:700,cursor:"pointer"}}>Skip</button>
            <a href={waUrl} target="_blank" rel="noreferrer" onClick={()=>{setSent(true);setTimeout(onDone,1500);}} style={{flex:2,padding:12,background:T.wa,border:"none",borderRadius:12,color:"#fff",fontFamily:"inherit",fontSize:14,fontWeight:800,cursor:"pointer",textDecoration:"none",display:"flex",alignItems:"center",justifyContent:"center",gap:8}}>💬 Send on WhatsApp</a>
          </div>
        ):(
          <div style={{background:T.gl,border:`2px solid ${T.gm}`,borderRadius:12,padding:14,textAlign:"center",fontWeight:800,color:T.gd}}>✅ WhatsApp opened!</div>
        )}
      </div>
    </div>
  );
}

// ─── Tab 1: Attendance & Work Log ─────────────────────────────────────────────
function AttendanceTab({staff, logs, setLogs, attendance, setAttendance, showRevenue, absentNotes, setAbsentNotes, salonId}){
  const [workTab,setWorkTab]=useState("today");
  const [showAddLog,setShowAddLog]=useState(false);

  const isPresent=!!(attendance[today]||{})[staff.id];

  async function toggleAttendance(){
    const newVal=!isPresent;
    setAttendance(prev=>{const dm={...(prev[today]||{})};dm[staff.id]=newVal;return{...prev,[today]:dm};});
    if(salonId){
      await supabase.from("attendance").upsert({
        salon_id:salonId, staff_id:staff.id, date:today, is_present:newVal
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
        <div style={{fontWeight:800,fontSize:13,color:T.text,marginBottom:10}}>📅 Is Mahine ki Attendance</div>
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
            <div style={{fontSize:12,fontWeight:800,color:T.ts,marginBottom:6}}>🔒 Aaj ki absence ka reason (sirf aap dekhoge):</div>
            <input style={{...IS,fontSize:13,background:T.blue,borderColor:T.bb}} placeholder="Reason likho — owner ko nahi dikhega..." value={(absentNotes||{})[today]||""} onChange={e=>setAbsentNotes(prev=>({...prev,[today]:e.target.value}))} onFocus={e=>e.target.style.borderColor=T.green} onBlur={e=>e.target.style.borderColor=T.bb}/>
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
          <div style={{fontSize:13,fontWeight:800,color:T.text}}>Mera Kaam</div>
          <button onClick={()=>setShowAddLog(true)} style={{background:T.dark,color:"#fff",border:"none",borderRadius:8,padding:"6px 14px",fontSize:12,fontWeight:700,cursor:"pointer"}}>+ Add Entry</button>
        </div>
        <div style={{padding:"8px 0"}}>
          {filtered.length===0?(<div style={{textAlign:"center",color:T.ts,fontSize:13,padding:"24px 0"}}>Koi entry nahi — add karo!</div>)
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

// ─── Tab 2: Customer History ──────────────────────────────────────────────────
function CustomerHistoryTab({staff, customers, showRevenue=false}){
  const [selectedId,setSelectedId]=useState(null);
  const [search,setSearch]=useState("");
  const [filter,setFilter]=useState("All");

  const selected=customers.find(c=>c.id===selectedId)||null;
  const filtered=customers.filter(c=>{
    const q=search.toLowerCase();
    const ms=!q||c.name.toLowerCase().includes(q)||c.phone.includes(q);
    const mf=filter==="All"?true:c.tag===filter;
    return ms&&mf;
  });

  if(selected){
    return(
      <div style={{flex:1,display:"flex",flexDirection:"column",overflow:"hidden"}}>
        <div style={{background:T.surface,borderBottom:`2px solid ${T.border}`,padding:"12px 16px",flexShrink:0}}>
          <button onClick={()=>setSelectedId(null)} style={{background:"none",border:"none",color:T.green,fontSize:13,fontWeight:700,cursor:"pointer",fontFamily:"inherit",marginBottom:10}}>← Back</button>
          <div style={{display:"flex",alignItems:"center",gap:12,marginBottom:12}}>
            <div style={{width:52,height:52,borderRadius:16,background:(selected.color||"#22c55e")+"22",border:`2px solid ${(selected.color||"#22c55e")}44`,display:"flex",alignItems:"center",justifyContent:"center",fontSize:19,fontWeight:900,color:selected.color||"#22c55e",flexShrink:0}}>
              {selected.avatar||(selected.name?.slice(0,2)||"??").toUpperCase()}
            </div>
            <div style={{flex:1}}>
              <div style={{fontWeight:900,fontSize:17,color:T.text}}>{selected.name}</div>
              <div style={{fontSize:12,color:T.ts,marginTop:2}}>📱 +91 {selected.phone}</div>
            </div>
          </div>
          <div style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:8}}>
            {[{val:selected.visits||0,label:"Visits"},{val:selected.last_visit||"—",label:"Last Visit"},{val:selected.tag||"New",label:"Tag"}].map(s=>(
              <div key={s.label} style={{background:T.sub,border:`2px solid ${T.border}`,borderRadius:11,padding:"10px",textAlign:"center"}}>
                <div style={{fontWeight:900,fontSize:12,color:T.green}}>{s.val}</div>
                <div style={{fontSize:10,color:T.tf,fontWeight:700,marginTop:2}}>{s.label}</div>
              </div>
            ))}
          </div>
        </div>
        <div style={{flex:1,overflowY:"auto",padding:"14px 16px 80px"}}>
          <div style={{fontSize:12,fontWeight:800,color:T.ts,letterSpacing:1.2,textTransform:"uppercase",marginBottom:12}}>Visit History</div>
          <div style={{background:T.surface,border:`2px dashed ${T.border}`,borderRadius:14,padding:"32px 20px",textAlign:"center"}}>
            <div style={{fontSize:32,marginBottom:8}}>📋</div>
            <div style={{fontWeight:800,fontSize:14,color:T.tm}}>History screen mein dekho</div>
            <div style={{fontSize:12,color:T.ts,marginTop:4}}>Customer History tab mein full details hain</div>
          </div>
        </div>
      </div>
    );
  }

  return(
    <div style={{flex:1,display:"flex",flexDirection:"column",overflow:"hidden"}}>
      <div style={{background:T.surface,padding:"12px 16px",borderBottom:`2px solid ${T.border}`,flexShrink:0}}>
        <div style={{position:"relative",marginBottom:10}}>
          <span style={{position:"absolute",left:12,top:"50%",transform:"translateY(-50%)",fontSize:13,color:T.tf}}>🔍</span>
          <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Search customers…" style={{...IS,padding:"10px 12px 10px 36px",fontSize:13}} onFocus={e=>e.target.style.borderColor=T.green} onBlur={e=>e.target.style.borderColor=T.border}/>
        </div>
        <div style={{display:"flex",gap:6}}>
          {["All","VIP","Regular","New"].map(f=>(<button key={f} onClick={()=>setFilter(f)} style={{padding:"5px 13px",borderRadius:20,border:`2px solid ${filter===f?T.green:T.border}`,background:filter===f?T.green:T.surface,color:filter===f?"#fff":T.ts,fontSize:11,fontWeight:800,cursor:"pointer",fontFamily:"inherit"}}>{f}</button>))}
        </div>
      </div>
      <div style={{flex:1,overflowY:"auto",padding:"12px 16px"}}>
        {filtered.length===0?(<div style={{textAlign:"center",color:T.ts,fontSize:13,padding:"40px 0"}}>Koi customer nahi</div>)
        :filtered.map(c=>{
          const tag=TAG_STYLES[c.tag]||TAG_STYLES.Regular;
          const bday=getBirthdayStatus(c.dob||c.birthday);
          const avatar=c.avatar||(c.name?.slice(0,2)||"??").toUpperCase();
          const color=c.color||"#22c55e";
          return(
            <div key={c.id} onClick={()=>setSelectedId(c.id)} style={{background:T.surface,border:`2px solid ${bday?T.yb:T.border}`,borderRadius:14,padding:14,cursor:"pointer",marginBottom:10}}>
              <div style={{display:"flex",alignItems:"center",gap:12,marginBottom:10}}>
                <div style={{width:44,height:44,borderRadius:13,background:color+"22",border:`2px solid ${color}44`,display:"flex",alignItems:"center",justifyContent:"center",fontSize:16,fontWeight:900,color,flexShrink:0}}>{avatar}</div>
                <div style={{flex:1}}>
                  <div style={{fontWeight:800,fontSize:15,color:T.text,display:"flex",alignItems:"center",gap:6}}>{c.name}{bday&&<span style={{fontSize:14}}>🎂</span>}</div>
                  <div style={{fontSize:11,color:T.ts,marginTop:2}}>📱 {c.phone}</div>
                </div>
                <div style={{background:tag.bg,color:tag.color,border:`1.5px solid ${tag.border}`,fontSize:10,fontWeight:800,padding:"3px 9px",borderRadius:20,flexShrink:0}}>{tag.label}</div>
              </div>
              {bday&&<div style={{background:bday.bg,border:`1.5px solid ${bday.border}`,borderRadius:8,padding:"6px 10px",marginBottom:10,fontSize:11,fontWeight:700,color:bday.color}}>{bday.label}</div>}
              <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:8}}>
                {[{label:"Visits",val:c.visits||0},{label:"Last Visit",val:c.last_visit||"—"},{label:"Tag",val:c.tag||"New"}].map(s=>(
                  <div key={s.label} style={{background:T.sub,borderRadius:9,padding:"8px 6px",textAlign:"center",border:`1.5px solid ${T.border}`}}>
                    <div style={{fontWeight:900,fontSize:12,color:T.text}}>{s.val}</div>
                    <div style={{fontSize:9,color:T.tf,fontWeight:700,marginTop:2}}>{s.label}</div>
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ─── Main Staff Dashboard ─────────────────────────────────────────────────────
export default function StaffDashboard({staff, showRevenue=false, onLogout}){
  const [tab,setTab]=useState("attendance");
  const [logs,setLogs]=useState([]);
  const [attendance,setAttendance]=useState({});
  const [customers,setCustomers]=useState([]);
  const [absentNotes,setAbsentNotes]=useState({});
  const [loading,setLoading]=useState(true);

  const salonId = staff?.salon_id || null;

  // ✅ Load real data from Supabase
  useEffect(()=>{
    async function loadData(){
      if(!salonId){setLoading(false);return;}
      setLoading(true);

      // Work logs for this staff
      const {data:logsData}=await supabase.from("work_logs").select("*").eq("salon_id",salonId).eq("staff_id",staff.id);
      if(logsData){
        setLogs(logsData.map(l=>({id:l.id,staffId:l.staff_id,clientName:l.client_name,service:l.service,amount:l.amount,date:l.date})));
      }

      // Attendance for this staff
      const {data:attData}=await supabase.from("attendance").select("*").eq("salon_id",salonId).eq("staff_id",staff.id);
      if(attData){
        const attMap={};
        attData.forEach(row=>{
          if(!attMap[row.date])attMap[row.date]={};
          attMap[row.date][row.staff_id]=row.is_present;
        });
        setAttendance(attMap);
      }

      // Customers for this salon
      const {data:custData}=await supabase.from("customers").select("*").eq("salon_id",salonId).order("created_at",{ascending:false});
      if(custData){
        setCustomers(custData.map(c=>({
          ...c,
          avatar:(c.name?.slice(0,2)||"??").toUpperCase(),
          color:["#22c55e","#3b82f6","#a855f7","#f59e0b","#14b8a6","#ec4899"][Math.floor(Math.random()*6)],
        })));
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
    <div style={{height:"100vh",display:"flex",flexDirection:"column",fontFamily:"system-ui,sans-serif",color:T.text,background:T.bg,overflow:"hidden"}}>
      <div style={{background:T.dark,padding:"12px 16px",display:"flex",alignItems:"center",justifyContent:"space-between",flexShrink:0}}>
        <div style={{display:"flex",alignItems:"center",gap:10}}>
          <div style={{width:40,height:40,borderRadius:12,background:c.bg,display:"flex",alignItems:"center",justifyContent:"center",fontSize:15,fontWeight:900,color:c.text,flexShrink:0}}>{initials(staff?.name||"ST")}</div>
          <div>
            <div style={{fontWeight:900,fontSize:14,color:"#fff"}}>{staff?.name}</div>
            <div style={{fontSize:11,color:"#a0a0c0",marginTop:1}}>{staff?.role} · 👨‍💼 Staff Portal</div>
          </div>
        </div>
        <button onClick={onLogout} style={{background:"transparent",border:"1px solid rgba(255,255,255,0.3)",color:"#fff",borderRadius:8,padding:"6px 12px",fontSize:12,cursor:"pointer",fontFamily:"inherit"}}>Logout</button>
      </div>

      <div style={{background:T.surface,borderBottom:`2px solid ${T.border}`,display:"flex",flexShrink:0}}>
        {TABS.map(t=>(
          <div key={t.id} onClick={()=>setTab(t.id)} style={{flex:1,padding:"11px 4px",display:"flex",flexDirection:"column",alignItems:"center",gap:3,cursor:"pointer",borderBottom:`3px solid ${tab===t.id?T.green:"transparent"}`}}>
            <span style={{fontSize:19}}>{t.icon}</span>
            <span style={{fontSize:11,fontWeight:800,color:tab===t.id?T.green:T.tf}}>{t.label}</span>
          </div>
        ))}
      </div>

      <div style={{flex:1,overflow:"hidden",display:"flex",flexDirection:"column"}}>
        {tab==="attendance"&&(
          <div style={{flex:1,overflowY:"auto"}}>
            <AttendanceTab staff={staff} logs={logs} setLogs={setLogs} attendance={attendance} setAttendance={setAttendance} showRevenue={showRevenue} absentNotes={absentNotes} setAbsentNotes={setAbsentNotes} salonId={salonId}/>
          </div>
        )}
        {tab==="customers"&&(
          <CustomerHistoryTab staff={staff} customers={customers} showRevenue={showRevenue}/>
        )}
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

  // ✅ Load real staff from Supabase
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
