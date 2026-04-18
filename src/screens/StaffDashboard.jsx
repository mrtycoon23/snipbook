import { useState, useMemo } from "react";

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

// ─── Constants ────────────────────────────────────────────────────────────────
const SERVICES = ["Haircut","Haircut + Beard","Hair Colour","Facial + Cleanup","Bridal Makeup","Hair Spa","Manicure/Pedicure","Beard Trim","Blow Dry","Head Massage","Waxing","Threading","Keratin","Blowdry","Head Massage"];
const AVATAR_COLORS = [
  {bg:"#fce7f3",text:"#9d174d"},
  {bg:"#dbeafe",text:"#1e40af"},
  {bg:"#d1fae5",text:"#065f46"},
  {bg:"#fef3c7",text:"#92400e"},
  {bg:"#ede9fe",text:"#4c1d95"},
];

const today = new Date().toISOString().slice(0,10);
const thisWeekStart = (()=>{const d=new Date();d.setDate(d.getDate()-d.getDay());return d.toISOString().slice(0,10);})();
const thisMonthStart = new Date().toISOString().slice(0,8)+"01";

function daysAgo(n){const d=new Date();d.setDate(d.getDate()-n);return d.toISOString().slice(0,10);}

// ─── Demo Data ────────────────────────────────────────────────────────────────
const DEMO_STAFF = [
  {id:1, name:"Priya Sharma",  role:"Hairstylist",   phone:"98765 43210", salary:14000, pin:"1111", email:"priya@salon.com"},
  {id:2, name:"Ritu Gupta",    role:"Makeup Artist",  phone:"87654 32109", salary:16000, pin:"2222", email:"ritu@salon.com"},
  {id:3, name:"Suresh Kumar",  role:"Nail Artist",    phone:"76543 21098", salary:11000, pin:"3333", email:"suresh@salon.com"},
  {id:4, name:"Neha Singh",    role:"Receptionist",   phone:"65432 10987", salary:10000, pin:"4444", email:"neha@salon.com"},
];

const INITIAL_LOGS = [
  {id:1, staffId:1, clientName:"Anjali Mehta",  service:"Hair Colour", amount:1200, date:today},
  {id:2, staffId:1, clientName:"Sunita Rao",    service:"Haircut",     amount:400,  date:today},
  {id:3, staffId:2, clientName:"Meera Joshi",   service:"Facial + Cleanup", amount:800, date:today},
  {id:4, staffId:1, clientName:"Rina Das",      service:"Haircut",     amount:350,  date:daysAgo(1)},
  {id:5, staffId:2, clientName:"Prerna Gupta",  service:"Bridal Makeup", amount:3500, date:daysAgo(3)},
  {id:6, staffId:3, clientName:"Nisha Patil",   service:"Manicure/Pedicure", amount:400, date:daysAgo(4)},
];

const INITIAL_ATTENDANCE = {[today]:{1:true, 2:true, 3:false, 4:true}};

const DEMO_CUSTOMERS = [
  {id:1, name:"Arjun Mehta",   phone:"9876543210", city:"Delhi", src:"wa", avatar:"AM", color:"#22c55e", joined:"Jan 2026", visits:8,  totalSpent:5800, lastVisit:"12 Apr", tag:"VIP",     dob:"1990-04-18",
   favServices:["Haircut","Beard Trim","Hair Colour"],
   visitHistory:[
     {id:"v1", date:"12 Apr 2026", services:["Haircut","Beard Trim"], stylist:"Priya Sharma", amount:650, notes:"Side fade. Low taper near ears.", products:["Wella Shampoo","Beard Oil"], photos:[{type:"before",filled:false},{type:"after",filled:true},{type:"extra",filled:false}]},
     {id:"v2", date:"28 Mar 2026", services:["Hair Colour"], stylist:"Ritu Gupta", amount:1800, notes:"Natural brown. Allergic to ammonia.", products:["Schwarzkopf Brown #4"], photos:[{type:"before",filled:true},{type:"after",filled:true},{type:"extra",filled:false}]},
   ]},
  {id:2, name:"Priya Kapoor",  phone:"9123456789", city:"Delhi", src:"wa", avatar:"PK", color:"#3b82f6", joined:"Feb 2026", visits:4,  totalSpent:4800, lastVisit:"08 Apr", tag:"Regular", dob:"1995-04-20",
   favServices:["Haircut","Facial + Cleanup","Hair Colour"],
   visitHistory:[
     {id:"v1", date:"08 Apr 2026", services:["Haircut","Facial + Cleanup"], stylist:"Priya Sharma", amount:850, notes:"French crop.", products:["Lotus Face Wash"], photos:[{type:"before",filled:true},{type:"after",filled:true},{type:"extra",filled:false}]},
   ]},
  {id:3, name:"Rohan Singh",   phone:"8877665544", city:"Noida", src:"walk", avatar:"RS", color:"#f59e0b", joined:"Jan 2026", visits:6, totalSpent:2700, lastVisit:"24 Mar", tag:"Regular", dob:"1988-12-05",
   favServices:["Facial + Cleanup","Haircut"],
   visitHistory:[
     {id:"v1", date:"24 Mar 2026", services:["Facial + Cleanup"], stylist:"Priya Sharma", amount:600, notes:"Oily skin. Avoid heavy creams.", products:["Neem Face Pack"], photos:[{type:"before",filled:false},{type:"after",filled:true},{type:"extra",filled:false}]},
   ]},
  {id:4, name:"Sneha Reddy",   phone:"9955443322", city:"Delhi", src:"wa", avatar:"SR", color:"#14b8a6", joined:"Mar 2026", visits:2,  totalSpent:1500, lastVisit:"01 Apr", tag:"New",     dob:"1998-04-22",
   favServices:["Hair Spa","Manicure/Pedicure"],
   visitHistory:[
     {id:"v1", date:"01 Apr 2026", services:["Hair Spa"], stylist:"Ritu Gupta", amount:700, notes:"First visit. Liked coconut treatment.", products:["Coconut Milk Mask"], photos:[{type:"before",filled:false},{type:"after",filled:true},{type:"extra",filled:false}]},
   ]},
];

// ─── Helpers ──────────────────────────────────────────────────────────────────
function initials(name){return name.split(" ").map(w=>w[0]).join("").substring(0,2).toUpperCase();}
function avc(id){return AVATAR_COLORS[(id-1)%AVATAR_COLORS.length];}
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
function AddLogModal({staffId,onSave,onClose}){
  const [clientName,setClientName]=useState("");
  const [service,setService]=useState(SERVICES[0]);
  const [amount,setAmount]=useState("");
  const [date,setDate]=useState(today);
  function save(){
    if(!clientName.trim()||!amount||isNaN(amount))return;
    onSave({staffId,clientName:clientName.trim(),service,amount:Number(amount),date});
    onClose();
  }
  return(
    <div onClick={e=>e.target===e.currentTarget&&onClose()} style={{position:"fixed",inset:0,background:"rgba(0,0,0,0.5)",zIndex:200,display:"flex",alignItems:"flex-end"}}>
      <div style={{background:T.surface,borderRadius:"20px 20px 0 0",padding:"20px 18px 36px",width:"100%",maxHeight:"80vh",overflowY:"auto",boxShadow:"0 -8px 40px rgba(0,0,0,0.15)"}}>
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
          <button onClick={save} style={{flex:2,padding:12,border:"none",borderRadius:12,background:clientName.trim()&&amount?T.green:"#d1d5db",color:"#fff",fontFamily:"inherit",fontSize:13,fontWeight:800,cursor:"pointer"}}>✓ Save Karo</button>
        </div>
      </div>
    </div>
  );
}

// ─── Quick Add Visit Modal ────────────────────────────────────────────────────
function QuickAddVisitModal({customer,staffName,onSave,onClose}){
  const [step,setStep]=useState(1);
  const [svc,setSvc]=useState("");
  const [amt,setAmt]=useState("");
  const [saving,setSaving]=useState(false);

  function save(){
    if(!svc||!amt)return;
    setSaving(true);
    setTimeout(()=>{
      const d=new Date().toLocaleDateString("en-IN",{day:"2-digit",month:"short",year:"numeric"});
      onSave({id:"v"+Date.now(),date:d,services:[svc],stylist:staffName,amount:parseInt(amt)||0,notes:"",products:[],photos:[{type:"before",filled:false},{type:"after",filled:false},{type:"extra",filled:false}]});
    },600);
  }

  return(
    <div onClick={onClose} style={{position:"fixed",inset:0,background:"rgba(0,0,0,0.5)",zIndex:300,display:"flex",alignItems:"flex-end"}}>
      <div onClick={e=>e.stopPropagation()} style={{background:T.surface,borderRadius:"20px 20px 0 0",padding:"20px 18px 36px",width:"100%",boxShadow:"0 -8px 40px rgba(0,0,0,0.12)"}}>
        <div style={{width:36,height:4,background:T.border,borderRadius:2,margin:"0 auto 14px"}}/>
        <div style={{display:"flex",justifyContent:"center",gap:8,marginBottom:18}}>
          {[1,2,3].map(i=><div key={i} style={{width:i<=step?28:8,height:8,borderRadius:20,background:i<=step?T.green:T.border,transition:"all 0.3s"}}/>)}
        </div>

        {step===1&&<>
          <div style={{fontWeight:900,fontSize:16,marginBottom:4}}>⚡ Quick Add Visit</div>
          <div style={{fontSize:12,color:T.ts,marginBottom:16}}>Step 1 — Service for {customer.name}</div>
          <div style={{display:"flex",flexDirection:"column",gap:7,marginBottom:16}}>
            {[...customer.favServices,...SERVICES.filter(s=>!customer.favServices.includes(s))].slice(0,8).map(s=>(
              <button key={s} onClick={()=>{setSvc(s);setStep(2);}} style={{padding:"12px 16px",borderRadius:12,border:`2px solid ${svc===s?T.green:T.border}`,background:svc===s?T.gl:T.surface,color:svc===s?T.gd:T.tm,fontSize:13,fontWeight:700,cursor:"pointer",fontFamily:"inherit",textAlign:"left",display:"flex",alignItems:"center",justifyContent:"space-between"}}>
                <span>{s}</span>
                {customer.favServices.includes(s)&&<span style={{fontSize:10,background:T.green,color:"#fff",padding:"2px 7px",borderRadius:20,fontWeight:800}}>Fav</span>}
              </button>
            ))}
          </div>
          <button onClick={onClose} style={{width:"100%",padding:12,border:`2px solid ${T.border}`,borderRadius:12,background:T.surface,fontFamily:"inherit",fontSize:13,fontWeight:700,cursor:"pointer"}}>Cancel</button>
        </>}

        {step===2&&<>
          <div style={{fontWeight:900,fontSize:16,marginBottom:4}}>⚡ Quick Add Visit</div>
          <div style={{fontSize:12,color:T.ts,marginBottom:14}}>Step 2 — Bill amount</div>
          <div style={{background:T.gl,border:`1.5px solid ${T.gm}`,borderRadius:10,padding:"10px 13px",marginBottom:14,fontSize:13,fontWeight:700,color:T.gd}}>✂️ {svc}</div>
          <div style={{fontWeight:800,fontSize:13,color:T.tm,marginBottom:8}}>Amount (₹)</div>
          <input type="number" value={amt} onChange={e=>setAmt(e.target.value)} placeholder="e.g. 450" autoFocus style={{...IS,fontSize:16,fontWeight:800,marginBottom:18}} onFocus={e=>e.target.style.borderColor=T.green} onBlur={e=>e.target.style.borderColor=T.border}/>
          <div style={{display:"flex",gap:10}}>
            <button onClick={()=>setStep(1)} style={{flex:1,padding:12,border:`2px solid ${T.border}`,borderRadius:12,background:T.surface,fontFamily:"inherit",fontSize:13,fontWeight:700,cursor:"pointer"}}>← Back</button>
            <button onClick={()=>{if(amt)setStep(3);}} style={{flex:2,padding:12,background:amt?T.green:"#d1d5db",border:"none",borderRadius:12,color:"#fff",fontFamily:"inherit",fontSize:13,fontWeight:800,cursor:amt?"pointer":"not-allowed"}}>Next →</button>
          </div>
        </>}

        {step===3&&<>
          <div style={{fontWeight:900,fontSize:16,marginBottom:4}}>⚡ Quick Add Visit</div>
          <div style={{fontSize:12,color:T.ts,marginBottom:14}}>Step 3 — Confirm</div>
          <div style={{background:T.sub,border:`2px solid ${T.border}`,borderRadius:14,padding:16,marginBottom:18}}>
            {[{l:"Customer",v:customer.name},{l:"Service",v:svc},{l:"Staff",v:staffName}].map(r=>(
              <div key={r.l} style={{display:"flex",justifyContent:"space-between",marginBottom:10}}><div style={{fontSize:13,color:T.ts}}>{r.l}</div><div style={{fontSize:13,fontWeight:800,color:T.text}}>{r.v}</div></div>
            ))}
            <div style={{height:1,background:T.border,margin:"4px 0 10px"}}/>
            <div style={{display:"flex",justifyContent:"space-between"}}><div style={{fontSize:14,fontWeight:800,color:T.text}}>Total</div><div style={{fontSize:18,fontWeight:900,color:T.green}}>₹{amt}</div></div>
          </div>
          <div style={{display:"flex",gap:10}}>
            <button onClick={()=>setStep(2)} style={{flex:1,padding:12,border:`2px solid ${T.border}`,borderRadius:12,background:T.surface,fontFamily:"inherit",fontSize:13,fontWeight:700,cursor:"pointer"}}>← Back</button>
            <button onClick={save} style={{flex:2,padding:12,background:saving?"#86efac":T.green,border:"none",borderRadius:12,color:"#fff",fontFamily:"inherit",fontSize:14,fontWeight:800,cursor:"pointer",boxShadow:"0 4px 14px rgba(34,197,94,0.3)"}}>
              {saving?"Saving...":"✓ Save Visit"}
            </button>
          </div>
        </>}
      </div>
    </div>
  );
}

// ─── WA Prompt ────────────────────────────────────────────────────────────────
function WAPrompt({customer,visit,onDone}){
  const [sent,setSent]=useState(false);
  const msg=`🙏 Namaste ${customer.name}!\n\n✂️ Visit Summary\n💈 Sharma's Salon\n\nServices: ${visit.services.join(", ")}\n💰 Amount: ₹${visit.amount}\n\nThank you! 💈`.trim();
  const waUrl=`https://wa.me/${customer.phone}?text=${encodeURIComponent(msg)}`;
  return(
    <div style={{position:"fixed",inset:0,background:"rgba(0,0,0,0.5)",zIndex:400,display:"flex",alignItems:"flex-end"}}>
      <div style={{background:T.surface,borderRadius:"20px 20px 0 0",padding:"20px 18px 36px",width:"100%",boxShadow:"0 -8px 40px rgba(0,0,0,0.15)"}}>
        <div style={{width:36,height:4,background:T.border,borderRadius:2,margin:"0 auto 16px"}}/>
        <div style={{display:"flex",alignItems:"center",gap:12,marginBottom:14}}>
          <div style={{width:44,height:44,borderRadius:14,background:"#e7fce8",border:"2px solid #a7f3c0",display:"flex",alignItems:"center",justifyContent:"center",fontSize:22}}>💬</div>
          <div><div style={{fontWeight:900,fontSize:15,color:T.text}}>Send Visit Summary?</div><div style={{fontSize:12,color:T.ts,marginTop:2}}>to {customer.name}</div></div>
        </div>
        <div style={{background:"#e5ddd5",borderRadius:12,padding:12,marginBottom:14}}>
          <div style={{background:"#fff",borderRadius:"10px 10px 10px 3px",padding:"10px 12px",maxWidth:"85%"}}>
            <pre style={{margin:0,fontFamily:"inherit",fontSize:11,lineHeight:1.6,color:T.text,whiteSpace:"pre-wrap"}}>{msg}</pre>
          </div>
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
function AttendanceTab({staff, logs, setLogs, attendance, setAttendance, showRevenue, absentNotes, setAbsentNotes}){
  const [workTab,setWorkTab]=useState("today");
  const [showAddLog,setShowAddLog]=useState(false);

  const todayAtt=(attendance[today]||{})[staff.id];
  const isPresent=!!todayAtt;

  function toggleAttendance(){
    setAttendance(prev=>{
      const dm={...(prev[today]||{})};
      dm[staff.id]=!dm[staff.id];
      return{...prev,[today]:dm};
    });
  }

  function addLog(data){
    setLogs(prev=>[...prev,{...data,id:Date.now()}]);
  }

  const filtered=useMemo(()=>{
    const cutoff=workTab==="today"?today:workTab==="week"?thisWeekStart:thisMonthStart;
    return logs.filter(l=>l.staffId===staff.id&&l.date>=cutoff).sort((a,b)=>b.date.localeCompare(a.date));
  },[logs,workTab,staff.id]);

  const totalRevenue=filtered.reduce((s,l)=>s+l.amount,0);
  const totalClients=filtered.length;

  // Attendance summary for month
  const monthPresent=Object.entries(attendance).filter(([d,m])=>d>=thisMonthStart&&m[staff.id]).length;
  const allDaysThisMonth=()=>{const now=new Date();return now.getDate();};
  const monthAbsent=allDaysThisMonth()-monthPresent;

  return(
    <div style={{padding:"14px 16px 80px"}}>
      {/* Today attendance toggle */}
      <div style={{background:isPresent?T.gl:T.red,border:`2px solid ${isPresent?T.gm:T.rb}`,borderRadius:16,padding:"16px",marginBottom:14}}>
        <div style={{display:"flex",alignItems:"center",justifyContent:"space-between"}}>
          <div>
            <div style={{fontWeight:900,fontSize:15,color:isPresent?T.gd:T.rt}}>
              {isPresent?"✅ Present Hai Aaj!":"❌ Absent Ho Aaj"}
            </div>
            <div style={{fontSize:12,color:isPresent?T.gd:T.rt,marginTop:3}}>
              {new Date().toLocaleDateString("en-IN",{day:"numeric",month:"long",year:"numeric"})}
            </div>
          </div>
          <div onClick={toggleAttendance} style={{width:56,height:28,borderRadius:14,background:isPresent?T.green:"#d1d5db",position:"relative",cursor:"pointer",transition:"background 0.2s",flexShrink:0}}>
            <div style={{width:22,height:22,borderRadius:"50%",background:"#fff",position:"absolute",top:3,left:isPresent?31:3,transition:"left 0.2s",boxShadow:"0 1px 3px rgba(0,0,0,0.2)"}}/>
          </div>
        </div>
      </div>

      {/* Monthly attendance summary */}
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
        {/* Absent note */}
        {!isPresent&&(
          <div style={{marginTop:12}}>
            <div style={{fontSize:12,fontWeight:800,color:T.ts,marginBottom:6}}>🔒 Aaj ki absence ka reason (sirf aap dekhoge):</div>
            <input
              style={{...IS,fontSize:13,background:T.blue,borderColor:T.bb}}
              placeholder="Reason likho — owner ko nahi dikhega..."
              value={(absentNotes||{})[today]||""}
              onChange={e=>setAbsentNotes(prev=>({...prev,[today]:e.target.value}))}
              onFocus={e=>e.target.style.borderColor=T.green}
              onBlur={e=>e.target.style.borderColor=T.bb}
            />
          </div>
        )}
      </div>

      {/* Work log */}
      <div style={{background:T.surface,border:`2px solid ${T.border}`,borderRadius:14,overflow:"hidden"}}>
        {/* Tab bar */}
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",background:T.sub,borderBottom:`2px solid ${T.border}`}}>
          {[{k:"today",l:"Aaj"},{k:"week",l:"Is Hafte"},{k:"month",l:"Is Mahine"}].map(t=>(
            <button key={t.k} onClick={()=>setWorkTab(t.k)} style={{padding:"10px 0",border:"none",background:workTab===t.k?T.dark:"transparent",color:workTab===t.k?"#fff":T.ts,fontSize:12,fontWeight:700,cursor:"pointer",fontFamily:"inherit"}}>
              {t.l}
            </button>
          ))}
        </div>

        {/* Stats */}
        <div style={{display:"grid",gridTemplateColumns:showRevenue?"1fr 1fr":"1fr",gap:0,borderBottom:`2px solid ${T.border}`}}>
          <div style={{padding:"12px",textAlign:"center",borderRight:showRevenue?`1px solid ${T.border}`:"none"}}>
            <div style={{fontSize:24,fontWeight:900,color:T.dark}}>{totalClients}</div>
            <div style={{fontSize:11,fontWeight:700,color:T.ts,marginTop:2}}>Clients</div>
          </div>
          {showRevenue&&(
            <div style={{padding:"12px",textAlign:"center"}}>
              <div style={{fontSize:22,fontWeight:900,color:T.gd}}>{fc(totalRevenue)}</div>
              <div style={{fontSize:11,fontWeight:700,color:T.ts,marginTop:2}}>Revenue</div>
            </div>
          )}
        </div>

        {/* Add button */}
        <div style={{padding:"10px 14px",borderBottom:`1px solid ${T.border}`,display:"flex",alignItems:"center",justifyContent:"space-between"}}>
          <div style={{fontSize:13,fontWeight:800,color:T.text}}>Mera Kaam</div>
          <button onClick={()=>setShowAddLog(true)} style={{background:T.dark,color:"#fff",border:"none",borderRadius:8,padding:"6px 14px",fontSize:12,fontWeight:700,cursor:"pointer"}}>+ Add Entry</button>
        </div>

        {/* Log list */}
        <div style={{padding:"8px 0"}}>
          {filtered.length===0?(
            <div style={{textAlign:"center",color:T.ts,fontSize:13,padding:"24px 0"}}>Koi entry nahi — add karo!</div>
          ):filtered.map(log=>(
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

      {showAddLog&&<AddLogModal staffId={staff.id} onSave={addLog} onClose={()=>setShowAddLog(false)}/>}
    </div>
  );
}

// ─── Tab 2: Customer History ──────────────────────────────────────────────────
function CustomerHistoryTab({staff, customers, setCustomers}){
  const [selectedId,setSelectedId]=useState(null);
  const [search,setSearch]=useState("");
  const [filter,setFilter]=useState("All");
  const [showQuickAdd,setShowQuickAdd]=useState(false);
  const [waPrompt,setWaPrompt]=useState(null);

  const selected=customers.find(c=>c.id===selectedId)||null;

  function updateCustomer(cId,changes){
    setCustomers(prev=>prev.map(c=>c.id===cId?{...c,...changes}:c));
  }

  function addVisit(v){
    updateCustomer(selectedId,{
      visitHistory:[v,...selected.visitHistory],
      visits:selected.visits+1,
      totalSpent:selected.totalSpent+v.amount,
      lastVisit:v.date.split(" ").slice(0,2).join(" "),
    });
    setShowQuickAdd(false);
    setWaPrompt({customer:selected,visit:v});
  }

  const filtered=customers.filter(c=>{
    const q=search.toLowerCase();
    const ms=!q||c.name.toLowerCase().includes(q)||c.phone.includes(q);
    const mf=filter==="All"?true:c.tag===filter;
    return ms&&mf;
  });

  if(selected){
    return(
      <div style={{flex:1,display:"flex",flexDirection:"column",overflow:"hidden"}}>
        {/* Customer header */}
        <div style={{background:T.surface,borderBottom:`2px solid ${T.border}`,padding:"12px 16px",flexShrink:0}}>
          <button onClick={()=>setSelectedId(null)} style={{background:"none",border:"none",color:T.green,fontSize:13,fontWeight:700,cursor:"pointer",fontFamily:"inherit",marginBottom:10}}>← Back to Customers</button>
          <div style={{display:"flex",alignItems:"center",gap:12,marginBottom:12}}>
            <div style={{width:52,height:52,borderRadius:16,background:selected.color+"22",border:`2px solid ${selected.color}44`,display:"flex",alignItems:"center",justifyContent:"center",fontSize:19,fontWeight:900,color:selected.color,flexShrink:0}}>{selected.avatar}</div>
            <div style={{flex:1}}>
              <div style={{fontWeight:900,fontSize:17,color:T.text}}>{selected.name}</div>
              <div style={{fontSize:12,color:T.ts,marginTop:2}}>📱 +91 {selected.phone} · {selected.city}</div>
            </div>
            <div style={{background:TAG_STYLES[selected.tag]?.bg||T.gl,color:TAG_STYLES[selected.tag]?.color||T.gd,border:`1.5px solid ${TAG_STYLES[selected.tag]?.border||T.gm}`,fontSize:11,fontWeight:800,padding:"3px 10px",borderRadius:20}}>
              {TAG_STYLES[selected.tag]?.label||selected.tag}
            </div>
          </div>
          {/* Stats */}
          <div style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:8,marginBottom:12}}>
            {[{val:selected.visits,label:"Visits"},{val:`₹${selected.totalSpent.toLocaleString()}`,label:"Total Spent"},{val:selected.lastVisit,label:"Last Visit"}].map(s=>(
              <div key={s.label} style={{background:T.sub,border:`2px solid ${T.border}`,borderRadius:11,padding:"10px",textAlign:"center"}}>
                <div style={{fontWeight:900,fontSize:13,color:T.green}}>{s.val}</div>
                <div style={{fontSize:10,color:T.tf,fontWeight:700,marginTop:2}}>{s.label}</div>
              </div>
            ))}
          </div>
          {/* Quick add visit button */}
          <button onClick={()=>setShowQuickAdd(true)} style={{width:"100%",padding:"11px",background:T.green,border:"none",borderRadius:12,color:"#fff",fontFamily:"inherit",fontSize:14,fontWeight:800,cursor:"pointer",boxShadow:"0 3px 10px rgba(34,197,94,0.3)"}}>⚡ Quick Add Visit</button>
        </div>

        {/* Visit history */}
        <div style={{flex:1,overflowY:"auto",padding:"14px 16px 80px"}}>
          <div style={{fontSize:12,fontWeight:800,color:T.ts,letterSpacing:1.2,textTransform:"uppercase",marginBottom:12}}>Visit History</div>
          {selected.visitHistory.length===0?(
            <div style={{background:T.surface,border:`2px dashed ${T.border}`,borderRadius:14,padding:"32px 20px",textAlign:"center"}}>
              <div style={{fontSize:32,marginBottom:8}}>📋</div>
              <div style={{fontWeight:800,fontSize:14,color:T.tm}}>Koi visit nahi abhi</div>
              <div style={{fontSize:12,color:T.ts,marginTop:4}}>Quick Add Visit se pehli visit add karo!</div>
            </div>
          ):selected.visitHistory.map((v,i)=>(
            <div key={v.id} style={{background:T.surface,border:`2px solid ${T.border}`,borderRadius:14,overflow:"hidden",marginBottom:12}}>
              <div style={{padding:"12px 14px",background:T.sub,borderBottom:`1px solid ${T.border}`,display:"flex",alignItems:"center",justifyContent:"space-between"}}>
                <div>
                  <div style={{fontWeight:800,fontSize:14,color:T.text}}>{v.date}</div>
                  <div style={{fontSize:12,color:T.ts,marginTop:2}}>{v.services.join(" + ")} · {v.stylist}</div>
                </div>
                <div style={{background:T.gl,color:T.gd,border:`1.5px solid ${T.gm}`,padding:"4px 12px",borderRadius:20,fontSize:14,fontWeight:900}}>₹{v.amount}</div>
              </div>
              {(v.notes||v.products?.length>0)&&(
                <div style={{padding:"10px 14px"}}>
                  {v.notes&&<div style={{fontSize:12,color:T.tm,marginBottom:v.products?.length>0?8:0}}>📝 {v.notes}</div>}
                  {v.products?.length>0&&(
                    <div style={{display:"flex",flexWrap:"wrap",gap:6}}>
                      {v.products.map((p,i)=><div key={i} style={{background:T.blue,color:T.bt,border:`1.5px solid ${T.bb}`,padding:"3px 10px",borderRadius:20,fontSize:11,fontWeight:700}}>🧴 {p}</div>)}
                    </div>
                  )}
                </div>
              )}
              {/* Photos summary */}
              {v.photos?.some(p=>p.filled)&&(
                <div style={{padding:"8px 14px",borderTop:`1px solid ${T.border}`,display:"flex",gap:8,alignItems:"center"}}>
                  <span style={{fontSize:11,color:T.ts}}>📸 Photos:</span>
                  {v.photos.map((p,i)=>p.filled&&(
                    <div key={i} style={{background:T.gl,border:`1.5px solid ${T.gm}`,borderRadius:8,padding:"2px 8px",fontSize:10,fontWeight:700,color:T.gd}}>{p.type==="before"?"Before":p.type==="after"?"After":"Extra"}</div>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>

        {showQuickAdd&&<QuickAddVisitModal customer={selected} staffName={staff.name} onSave={addVisit} onClose={()=>setShowQuickAdd(false)}/>}
        {waPrompt&&<WAPrompt customer={waPrompt.customer} visit={waPrompt.visit} onDone={()=>setWaPrompt(null)}/>}
      </div>
    );
  }

  return(
    <div style={{flex:1,display:"flex",flexDirection:"column",overflow:"hidden"}}>
      {/* Search + filter */}
      <div style={{background:T.surface,padding:"12px 16px",borderBottom:`2px solid ${T.border}`,flexShrink:0}}>
        <div style={{position:"relative",marginBottom:10}}>
          <span style={{position:"absolute",left:12,top:"50%",transform:"translateY(-50%)",fontSize:13,color:T.tf}}>🔍</span>
          <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Search customers…" style={{...IS,padding:"10px 12px 10px 36px",fontSize:13}} onFocus={e=>e.target.style.borderColor=T.green} onBlur={e=>e.target.style.borderColor=T.border}/>
        </div>
        <div style={{display:"flex",gap:6}}>
          {["All","VIP","Regular","New"].map(f=>(
            <button key={f} onClick={()=>setFilter(f)} style={{padding:"5px 13px",borderRadius:20,border:`2px solid ${filter===f?T.green:T.border}`,background:filter===f?T.green:T.surface,color:filter===f?"#fff":T.ts,fontSize:11,fontWeight:800,cursor:"pointer",fontFamily:"inherit"}}>{f}</button>
          ))}
        </div>
      </div>

      {/* Customer list */}
      <div style={{flex:1,overflowY:"auto",padding:"12px 16px"}}>
        {filtered.map(c=>{
          const tag=TAG_STYLES[c.tag]||TAG_STYLES.Regular;
          const bday=getBirthdayStatus(c.dob);
          return(
            <div key={c.id} onClick={()=>setSelectedId(c.id)} style={{background:T.surface,border:`2px solid ${bday?T.yb:T.border}`,borderRadius:14,padding:14,cursor:"pointer",marginBottom:10,transition:"all 0.15s"}} onMouseOver={e=>e.currentTarget.style.borderColor=T.green} onMouseOut={e=>e.currentTarget.style.borderColor=bday?T.yb:T.border}>
              <div style={{display:"flex",alignItems:"center",gap:12,marginBottom:10}}>
                <div style={{width:44,height:44,borderRadius:13,background:c.color+"22",border:`2px solid ${c.color}44`,display:"flex",alignItems:"center",justifyContent:"center",fontSize:16,fontWeight:900,color:c.color,flexShrink:0}}>{c.avatar}</div>
                <div style={{flex:1}}>
                  <div style={{fontWeight:800,fontSize:15,color:T.text,display:"flex",alignItems:"center",gap:6}}>{c.name}{bday&&<span style={{fontSize:14}}>🎂</span>}</div>
                  <div style={{fontSize:11,color:T.ts,marginTop:2}}>📱 {c.phone} · {c.favServices[0]}</div>
                </div>
                <div style={{background:tag.bg,color:tag.color,border:`1.5px solid ${tag.border}`,fontSize:10,fontWeight:800,padding:"3px 9px",borderRadius:20,flexShrink:0}}>{tag.label}</div>
              </div>
              {bday&&<div style={{background:bday.bg,border:`1.5px solid ${bday.border}`,borderRadius:8,padding:"6px 10px",marginBottom:10,fontSize:11,fontWeight:700,color:bday.color}}>{bday.label}</div>}
              <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:8}}>
                {[{label:"Visits",val:c.visits},{label:"Last Visit",val:c.lastVisit},{label:"Since",val:c.joined}].map(s=>(
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
  const [logs,setLogs]=useState(INITIAL_LOGS);
  const [attendance,setAttendance]=useState(INITIAL_ATTENDANCE);
  const [customers,setCustomers]=useState(DEMO_CUSTOMERS);
  const [absentNotes,setAbsentNotes]=useState({});

  const c=avc(staff.id);

  const TABS=[
    {id:"attendance", icon:"📋", label:"Attendance"},
    {id:"customers",  icon:"👥", label:"Customers"},
  ];

  return(
    <div style={{height:"100vh",display:"flex",flexDirection:"column",fontFamily:"system-ui,sans-serif",color:T.text,background:T.bg,overflow:"hidden"}}>
      {/* Header */}
      <div style={{background:T.dark,padding:"12px 16px",display:"flex",alignItems:"center",justifyContent:"space-between",flexShrink:0}}>
        <div style={{display:"flex",alignItems:"center",gap:10}}>
          <div style={{width:40,height:40,borderRadius:12,background:c.bg,display:"flex",alignItems:"center",justifyContent:"center",fontSize:15,fontWeight:900,color:c.text,flexShrink:0}}>{initials(staff.name)}</div>
          <div>
            <div style={{fontWeight:900,fontSize:14,color:"#fff"}}>{staff.name}</div>
            <div style={{fontSize:11,color:"#a0a0c0",marginTop:1}}>{staff.role} · 👨‍💼 Staff Portal</div>
          </div>
        </div>
        <button onClick={onLogout} style={{background:"transparent",border:"1px solid rgba(255,255,255,0.3)",color:"#fff",borderRadius:8,padding:"6px 12px",fontSize:12,cursor:"pointer",fontFamily:"inherit"}}>Logout</button>
      </div>

      {/* Tab bar */}
      <div style={{background:T.surface,borderBottom:`2px solid ${T.border}`,display:"flex",flexShrink:0}}>
        {TABS.map(t=>(
          <div key={t.id} onClick={()=>setTab(t.id)} style={{flex:1,padding:"11px 4px",display:"flex",flexDirection:"column",alignItems:"center",gap:3,cursor:"pointer",borderBottom:`3px solid ${tab===t.id?T.green:"transparent"}`,transition:"all 0.15s"}}>
            <span style={{fontSize:19}}>{t.icon}</span>
            <span style={{fontSize:11,fontWeight:800,color:tab===t.id?T.green:T.tf}}>{t.label}</span>
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
            />
          </div>
        )}
        {tab==="customers"&&(
          <CustomerHistoryTab
            staff={staff}
            customers={customers}
            setCustomers={setCustomers}
          />
        )}
      </div>
    </div>
  );
}

// ─── Staff Login Page (exported for use in App.jsx) ────────────────────────────
export function StaffLoginPage({staffList, onLogin, onBack}){
  const [selectedId,setSelectedId]=useState(staffList[0]?.id||"");
  const [pin,setPin]=useState("");
  const [error,setError]=useState("");
  const [loading,setLoading]=useState(false);

  function handleLogin(){
    setLoading(true);
    setTimeout(()=>{
      const staff=staffList.find(s=>s.id===Number(selectedId));
      if(staff&&staff.pin===pin){
        onLogin(staff);
      }else{
        setError("PIN galat hai! Dobara try karo.");
        setPin("");
        setLoading(false);
      }
    },800);
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
          <input
            style={IS}
            type="password"
            placeholder="••••"
            maxLength={4}
            value={pin}
            onChange={e=>{setPin(e.target.value);setError("");}}
            onKeyDown={e=>e.key==="Enter"&&handleLogin()}
            onFocus={e=>e.target.style.borderColor=T.green}
            onBlur={e=>e.target.style.borderColor=T.border}
          />
        </div>

        {error&&<div style={{background:T.red,border:`1.5px solid ${T.rb}`,borderRadius:9,padding:"9px 12px",marginBottom:14,fontSize:12,color:T.rt,fontWeight:600}}>⚠️ {error}</div>}

        <button onClick={handleLogin} style={{width:"100%",padding:"13px",background:loading?"#86efac":T.green,border:"none",borderRadius:12,color:"#fff",fontFamily:"inherit",fontSize:15,fontWeight:800,cursor:"pointer",boxShadow:"0 4px 14px rgba(34,197,94,0.3)",marginBottom:12}}>
          {loading?"Logging in...":"Login Karo →"}
        </button>

        <div style={{background:T.sub,border:`1.5px solid ${T.border}`,borderRadius:10,padding:"10px 12px",marginBottom:16}}>
          <div style={{fontSize:11,fontWeight:800,color:T.ts,marginBottom:6}}>💡 Demo PINs:</div>
          {staffList.map(s=>(
            <div key={s.id} onClick={()=>{setSelectedId(s.id);setPin(s.pin);setError("");}} style={{display:"flex",alignItems:"center",justifyContent:"space-between",padding:"6px 8px",borderRadius:8,cursor:"pointer",marginBottom:3}} onMouseOver={e=>e.currentTarget.style.background=T.gl} onMouseOut={e=>e.currentTarget.style.background="transparent"}>
              <span style={{fontSize:12,fontWeight:700,color:T.text}}>{s.name}</span>
              <span style={{fontSize:12,color:T.ts}}>PIN: {s.pin}</span>
            </div>
          ))}
        </div>

        <button onClick={onBack} style={{width:"100%",background:"none",border:"none",color:T.ts,fontSize:13,fontWeight:700,cursor:"pointer",fontFamily:"inherit"}}>← Back to Login</button>
      </div>
    </div>
  );
}
