import { useState } from "react";

// ── Tokens ────────────────────────────────────────────────────────────────────
const T = {
  bg:"#f0f4f8",surface:"#ffffff",border:"#e8edf3",hover:"#22c55e",
  green:"#22c55e",gl:"#e8fdf0",gm:"#bbf7d0",gd:"#16a34a",
  text:"#1a1a2e",tm:"#555",ts:"#888",tf:"#aaa",tg:"#ccc",
  yellow:"#fef9c3",yb:"#fde68a",yt:"#a16207",
  blue:"#eff6ff",bb:"#93c5fd",bt:"#2563eb",
  red:"#fff0f0",rb:"#fca5a5",rt:"#dc2626",
  sub:"#f8fafc",inp:"#fafbfc",
  wa:"#25d366",
};
const IS={width:"100%",padding:"11px 13px",border:`2px solid ${T.border}`,borderRadius:11,fontSize:14,fontFamily:"inherit",outline:"none",background:T.inp,boxSizing:"border-box",color:T.text};
const TAG={VIP:{bg:T.yellow,color:T.yt,border:T.yb,label:"⭐ VIP"},Regular:{bg:T.gl,color:T.gd,border:T.gm,label:"Regular"},New:{bg:T.blue,color:T.bt,border:T.bb,label:"New"}};
const SERVICES=["Haircut","Haircut + Beard","Hair Colour","Facial + Cleanup","Bridal Makeup","Hair Spa","Manicure/Pedicure","Beard Trim","Blow Dry","Head Massage"];
const SLOTS=["9:00 AM","9:30 AM","10:00 AM","10:30 AM","11:00 AM","11:30 AM","12:00 PM","2:00 PM","2:30 PM","3:00 PM","3:30 PM","4:00 PM","4:30 PM","5:00 PM","5:30 PM","6:00 PM"];
const DEMO_USERS=[
  {id:"o1",name:"Rahul Sharma",role:"owner",email:"owner@salon.com",password:"owner123",avatar:"RS",color:"#22c55e"},
  {id:"s1",name:"Raju Bhai",role:"staff",email:"raju@salon.com",password:"staff123",avatar:"RB",color:"#3b82f6"},
  {id:"s2",name:"Priya",role:"staff",email:"priya@salon.com",password:"priya123",avatar:"PR",color:"#a855f7"},
];

// ── Mock Data ─────────────────────────────────────────────────────────────────
const INIT=[
  {id:1,name:"Arjun Mehta",phone:"9876543210",city:"Delhi",src:"wa",avatar:"AM",color:"#22c55e",joined:"Jan 2026",visits:8,totalSpent:5800,lastVisit:"12 Apr",tag:"VIP",dob:"1990-04-18",
   favServices:["Haircut","Beard Trim","Hair Colour"],
   visitHistory:[
     {id:"v1",date:"12 Apr 2026",services:["Haircut","Beard Trim"],stylist:"Raju Bhai",amount:650,notes:"Side fade, 1.5 inch top. Low taper near ears.",products:["Wella Shampoo","Beard Oil"],photos:[{type:"before",filled:false,url:null},{type:"after",filled:true,url:null},{type:"extra",filled:false,url:null}]},
     {id:"v2",date:"28 Mar 2026",services:["Hair Colour","Blow Dry"],stylist:"Priya",amount:1800,notes:"Natural brown. Allergic to ammonia.",products:["Schwarzkopf Brown #4","Olaplex No.3"],photos:[{type:"before",filled:true,url:null},{type:"after",filled:true,url:null},{type:"extra",filled:false,url:null}]},
     {id:"v3",date:"10 Mar 2026",services:["Haircut"],stylist:"Raju Bhai",amount:300,notes:"",products:[],photos:[{type:"before",filled:false,url:null},{type:"after",filled:true,url:null},{type:"extra",filled:false,url:null}]},
   ]},
  {id:2,name:"Priya Kapoor",phone:"9123456789",city:"Delhi",src:"wa",avatar:"PK",color:"#3b82f6",joined:"Feb 2026",visits:4,totalSpent:4800,lastVisit:"08 Apr",tag:"Regular",dob:"1995-04-20",
   favServices:["Haircut","Facial","Hair Colour"],
   visitHistory:[
     {id:"v1",date:"08 Apr 2026",services:["Haircut","Facial"],stylist:"Priya",amount:850,notes:"French crop. Wants blunt fringe next time.",products:["Lotus Face Wash","SPF Moisturizer"],photos:[{type:"before",filled:true,url:null},{type:"after",filled:true,url:null},{type:"extra",filled:false,url:null}]},
     {id:"v2",date:"20 Mar 2026",services:["Hair Colour"],stylist:"Priya",amount:1200,notes:"",products:["L'Oreal Burgundy"],photos:[{type:"before",filled:false,url:null},{type:"after",filled:true,url:null},{type:"extra",filled:false,url:null}]},
   ]},
  {id:3,name:"Rohan Singh",phone:"8877665544",city:"Noida",src:"walk",avatar:"RS",color:"#f59e0b",joined:"Jan 2026",visits:6,totalSpent:2700,lastVisit:"24 Mar",tag:"Regular",dob:"1988-12-05",
   favServices:["Facial + Cleanup","Haircut"],
   visitHistory:[
     {id:"v1",date:"24 Mar 2026",services:["Facial + Cleanup"],stylist:"Priya",amount:600,notes:"Oily skin. Avoid heavy creams.",products:["Neem Face Pack"],photos:[{type:"before",filled:false,url:null},{type:"after",filled:true,url:null},{type:"extra",filled:false,url:null}]},
   ]},
  {id:4,name:"Sneha Reddy",phone:"9955443322",city:"Delhi",src:"wa",avatar:"SR",color:"#14b8a6",joined:"Mar 2026",visits:2,totalSpent:1500,lastVisit:"01 Apr",tag:"New",dob:"1998-04-22",
   favServices:["Hair Spa","Manicure/Pedicure"],
   visitHistory:[
     {id:"v1",date:"01 Apr 2026",services:["Hair Spa"],stylist:"Priya",amount:700,notes:"First visit. Liked coconut treatment.",products:["Coconut Milk Mask"],photos:[{type:"before",filled:false,url:null},{type:"after",filled:true,url:null},{type:"extra",filled:false,url:null}]},
   ]},
];

// ── Atoms ─────────────────────────────────────────────────────────────────────
const Chip=({children,style={}})=><span style={{display:"inline-block",padding:"3px 10px",borderRadius:20,fontSize:11,fontWeight:700,background:T.gl,color:T.gd,border:`1.5px solid ${T.gm}`,...style}}>{children}</span>;
const SL=({children,style={}})=><div style={{fontSize:10,fontWeight:800,color:T.tf,letterSpacing:1.2,textTransform:"uppercase",marginBottom:10,...style}}>{children}</div>;
const StatBox=({icon,val,label,accent})=><div style={{background:T.sub,border:`2px solid ${T.border}`,borderRadius:12,padding:"12px 8px",textAlign:"center",flex:1}}><div style={{fontSize:18,marginBottom:4}}>{icon}</div><div style={{fontWeight:900,fontSize:15,color:accent||T.green}}>{val}</div><div style={{fontSize:10,color:T.tf,fontWeight:700,marginTop:2}}>{label}</div></div>;
const EditBtn=({onEdit})=><button onClick={onEdit} style={{background:"none",border:`1.5px solid ${T.border}`,borderRadius:8,padding:"3px 10px",fontSize:11,fontWeight:700,color:T.ts,cursor:"pointer",fontFamily:"inherit"}}>✏️ Edit</button>;
const SCBar=({onSave,onCancel})=><div style={{display:"flex",gap:6}}><button onClick={onCancel} style={{background:"none",border:`1.5px solid ${T.border}`,borderRadius:8,padding:"3px 9px",fontSize:11,color:T.ts,cursor:"pointer",fontFamily:"inherit"}}>Cancel</button><button onClick={onSave} style={{background:T.green,border:"none",borderRadius:8,padding:"3px 12px",fontSize:11,fontWeight:800,color:"#fff",cursor:"pointer",fontFamily:"inherit"}}>✓ Save</button></div>;

// ── Birthday check ─────────────────────────────────────────────────────────────
function getBirthdayStatus(dob){
  if(!dob)return null;
  const today=new Date();
  const bday=new Date(dob);
  bday.setFullYear(today.getFullYear());
  const diff=Math.ceil((bday-today)/(1000*60*60*24));
  if(diff===0)return{label:"🎂 Birthday Today!",color:T.rt,bg:T.red,border:T.rb};
  if(diff>0&&diff<=7)return{label:`🎂 Birthday in ${diff} day${diff>1?"s":""}`,color:T.yt,bg:T.yellow,border:T.yb};
  if(diff<0&&diff>=-3)return{label:"🎂 Birthday was recently",color:T.ts,bg:T.sub,border:T.border};
  return null;
}

// ── Photo Tile with Camera/Gallery picker ──────────────────────────────────────
function PhotoTile({photo,onUpdate}){
  const [showPicker,setShowPicker]=useState(false);
  const cfg={
    before:{label:"Before",icon:"📷",bg:"#fff8e6",bdr:"#fcd34d",clr:"#d97706"},
    after:{label:"After",icon:"✅",bg:T.gl,bdr:T.gm,clr:T.gd},
    extra:{label:"Extra",icon:"🖼️",bg:T.blue,bdr:T.bb,clr:T.bt},
  };
  const c=cfg[photo.type]||cfg.extra;

  function handleOption(src){
    setShowPicker(false);
    onUpdate({...photo,filled:true,src});
  }
  function handleRemove(e){e.stopPropagation();setShowPicker(false);onUpdate({...photo,filled:false,url:null,src:null});}

  return(
    <div style={{position:"relative",flexShrink:0}}>
      <div onClick={()=>setShowPicker(p=>!p)} style={{width:86,height:86,borderRadius:14,cursor:"pointer",background:photo.filled?c.bg:T.sub,border:`2px ${photo.filled?"solid":"dashed"} ${photo.filled?c.bdr:T.border}`,display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",transition:"all 0.15s",position:"relative"}}>
        {photo.filled&&<div style={{position:"absolute",top:5,right:5,width:14,height:14,borderRadius:"50%",background:c.clr,display:"flex",alignItems:"center",justifyContent:"center",fontSize:8,color:"#fff",fontWeight:900}}>✓</div>}
        <div style={{fontSize:photo.filled?26:20,opacity:photo.filled?1:0.25}}>{c.icon}</div>
        <div style={{fontSize:10,fontWeight:700,marginTop:5,color:photo.filled?c.clr:T.tg}}>{c.label}</div>
        {!photo.filled&&<div style={{fontSize:9,color:T.tg,marginTop:1}}>tap to add</div>}
      </div>

      {/* Camera/Gallery Picker */}
      {showPicker&&(
        <div style={{position:"absolute",top:92,left:0,zIndex:100,background:T.surface,border:`2px solid ${T.border}`,borderRadius:14,boxShadow:"0 8px 24px rgba(0,0,0,0.12)",minWidth:160,overflow:"hidden"}}>
          {!photo.filled?<>
            <div onClick={()=>handleOption("camera")} style={{padding:"12px 16px",fontSize:13,fontWeight:700,color:T.text,cursor:"pointer",borderBottom:`1px solid ${T.border}`,display:"flex",alignItems:"center",gap:10}} onMouseOver={e=>e.currentTarget.style.background=T.gl} onMouseOut={e=>e.currentTarget.style.background="transparent"}>
              📷 Take Photo
            </div>
            <div onClick={()=>handleOption("gallery")} style={{padding:"12px 16px",fontSize:13,fontWeight:700,color:T.text,cursor:"pointer",display:"flex",alignItems:"center",gap:10}} onMouseOver={e=>e.currentTarget.style.background=T.gl} onMouseOut={e=>e.currentTarget.style.background="transparent"}>
              🖼️ Choose from Gallery
            </div>
          </>:<>
            <div onClick={()=>handleOption("camera")} style={{padding:"12px 16px",fontSize:13,fontWeight:700,color:T.text,cursor:"pointer",borderBottom:`1px solid ${T.border}`,display:"flex",alignItems:"center",gap:10}} onMouseOver={e=>e.currentTarget.style.background=T.gl} onMouseOut={e=>e.currentTarget.style.background="transparent"}>
              🔄 Replace Photo
            </div>
            <div onClick={handleRemove} style={{padding:"12px 16px",fontSize:13,fontWeight:700,color:T.rt,cursor:"pointer",display:"flex",alignItems:"center",gap:10}} onMouseOver={e=>e.currentTarget.style.background=T.red} onMouseOut={e=>e.currentTarget.style.background="transparent"}>
              🗑️ Remove
            </div>
          </>}
          <div onClick={()=>setShowPicker(false)} style={{padding:"8px 16px",fontSize:11,color:T.ts,cursor:"pointer",textAlign:"center",borderTop:`1px solid ${T.border}`}}>Cancel</div>
        </div>
      )}
    </div>
  );
}

// ── WhatsApp Prompt (auto after visit save) ────────────────────────────────────
function WAPrompt({customer,visit,onSend,onSkip}){
  const [sent,setSent]=useState(false);
  const pc=visit.photos.filter(p=>p.filled).length;
  const msg=[`🙏 Namaste ${customer.name}!`,``,`✂️ *Visit Summary — ${visit.date}*`,`💈 Sharma's Salon`,``,`*Services:*`,...visit.services.map(s=>`• ${s}`),visit.products.length?`\n*Products Used:*\n${visit.products.map(p=>`• ${p}`).join("\n")}`:"",visit.notes?`\n📝 ${visit.notes}`:"",``,`💰 *Amount: ₹${visit.amount}*`,pc>0?`📸 ${pc} photo${pc>1?"s":""} attached`:"",``,`Thank you for visiting! 💈`,`_Powered by SnipBook_`].filter(Boolean).join("\n").trim();
  const waUrl=`https://wa.me/${customer.phone}?text=${encodeURIComponent(msg)}`;
  return(
    <div style={{position:"fixed",inset:0,background:"rgba(0,0,0,0.5)",zIndex:800,display:"flex",alignItems:"flex-end"}}>
      <div style={{background:T.surface,borderRadius:"20px 20px 0 0",padding:"20px 18px 36px",width:"100%",boxShadow:"0 -8px 40px rgba(0,0,0,0.15)"}}>
        <div style={{width:36,height:4,background:T.border,borderRadius:2,margin:"0 auto 16px"}}/>
        <div style={{display:"flex",alignItems:"center",gap:12,marginBottom:14}}>
          <div style={{width:44,height:44,borderRadius:14,background:"#e7fce8",border:"2px solid #a7f3c0",display:"flex",alignItems:"center",justifyContent:"center",fontSize:22}}>💬</div>
          <div>
            <div style={{fontWeight:900,fontSize:15,color:T.text}}>Send Visit Summary?</div>
            <div style={{fontSize:12,color:T.ts,marginTop:2}}>to {customer.name} · +91 {customer.phone}</div>
          </div>
        </div>
        <div style={{background:"#e5ddd5",borderRadius:12,padding:12,marginBottom:14}}>
          <div style={{background:"#fff",borderRadius:"10px 10px 10px 3px",padding:"10px 12px",maxWidth:"85%"}}>
            <pre style={{margin:0,fontFamily:"inherit",fontSize:11,lineHeight:1.6,color:T.text,whiteSpace:"pre-wrap",wordBreak:"break-word"}}>{msg}</pre>
          </div>
        </div>
        {!sent?(
          <div style={{display:"flex",gap:10}}>
            <button onClick={onSkip} style={{flex:1,padding:12,border:`2px solid ${T.border}`,borderRadius:12,background:T.surface,fontFamily:"inherit",fontSize:13,fontWeight:700,cursor:"pointer",color:T.tm}}>Skip</button>
            <a href={waUrl} target="_blank" rel="noreferrer" onClick={()=>{setSent(true);setTimeout(onSend,1500);}} style={{flex:2,padding:12,background:T.wa,border:"none",borderRadius:12,color:"#fff",fontFamily:"inherit",fontSize:14,fontWeight:800,cursor:"pointer",textDecoration:"none",display:"flex",alignItems:"center",justifyContent:"center",gap:8}}>💬 Send on WhatsApp</a>
          </div>
        ):(
          <div style={{background:T.gl,border:`2px solid ${T.gm}`,borderRadius:12,padding:14,textAlign:"center",fontWeight:800,color:T.gd}}>✅ WhatsApp opened!</div>
        )}
      </div>
    </div>
  );
}

// ── Quick Add Visit (3 taps) ───────────────────────────────────────────────────
function QuickAddModal({customer,staffName,onSave,onClose}){
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
    <div onClick={onClose} style={{position:"fixed",inset:0,background:"rgba(0,0,0,0.45)",zIndex:700,display:"flex",alignItems:"flex-end"}}>
      <div onClick={e=>e.stopPropagation()} style={{background:T.surface,borderRadius:"20px 20px 0 0",padding:"20px 18px 36px",width:"100%",boxShadow:"0 -8px 40px rgba(0,0,0,0.12)"}}>
        <div style={{width:36,height:4,background:T.border,borderRadius:2,margin:"0 auto 14px"}}/>

        {/* Progress dots */}
        <div style={{display:"flex",justifyContent:"center",gap:8,marginBottom:18}}>
          {[1,2,3].map(i=><div key={i} style={{width:i<=step?28:8,height:8,borderRadius:20,background:i<=step?T.green:T.border,transition:"all 0.3s"}}/>)}
        </div>

        {step===1&&<>
          <div style={{fontWeight:900,fontSize:16,marginBottom:4}}>⚡ Quick Add Visit</div>
          <div style={{fontSize:12,color:T.ts,marginBottom:16}}>Step 1 of 3 — Pick service for {customer.name}</div>
          <div style={{display:"flex",flexDirection:"column",gap:7,marginBottom:20}}>
            {[...customer.favServices,...SERVICES.filter(s=>!customer.favServices.includes(s))].slice(0,8).map(s=>(
              <button key={s} onClick={()=>{setSvc(s);setStep(2);}} style={{padding:"13px 16px",borderRadius:12,border:`2px solid ${svc===s?T.green:T.border}`,background:svc===s?T.gl:T.surface,color:svc===s?T.gd:T.tm,fontSize:13,fontWeight:700,cursor:"pointer",fontFamily:"inherit",textAlign:"left",display:"flex",alignItems:"center",justifyContent:"space-between"}}>
                <span>{s}</span>
                {customer.favServices.includes(s)&&<span style={{fontSize:10,background:T.green,color:"#fff",padding:"2px 7px",borderRadius:20,fontWeight:800}}>Fav</span>}
              </button>
            ))}
          </div>
          <button onClick={onClose} style={{width:"100%",padding:12,border:`2px solid ${T.border}`,borderRadius:12,background:T.surface,fontFamily:"inherit",fontSize:13,fontWeight:700,cursor:"pointer"}}>Cancel</button>
        </>}

        {step===2&&<>
          <div style={{fontWeight:900,fontSize:16,marginBottom:4}}>⚡ Quick Add Visit</div>
          <div style={{fontSize:12,color:T.ts,marginBottom:16}}>Step 2 of 3 — Bill amount</div>
          <div style={{background:T.gl,border:`1.5px solid ${T.gm}`,borderRadius:10,padding:"10px 13px",marginBottom:16,fontSize:13,fontWeight:700,color:T.gd}}>✂️ {svc}</div>
          <div style={{fontWeight:800,fontSize:13,color:T.tm,marginBottom:8}}>Amount (₹)</div>
          <input type="number" value={amt} onChange={e=>setAmt(e.target.value)} placeholder="e.g. 450" autoFocus style={{...IS,fontSize:16,fontWeight:800,marginBottom:20}} onFocus={e=>e.target.style.borderColor=T.green} onBlur={e=>e.target.style.borderColor=T.border}/>
          <div style={{display:"flex",gap:10}}>
            <button onClick={()=>setStep(1)} style={{flex:1,padding:12,border:`2px solid ${T.border}`,borderRadius:12,background:T.surface,fontFamily:"inherit",fontSize:13,fontWeight:700,cursor:"pointer"}}>← Back</button>
            <button onClick={()=>{if(amt)setStep(3);}} style={{flex:2,padding:12,background:amt?T.green:"#d1d5db",border:"none",borderRadius:12,color:"#fff",fontFamily:"inherit",fontSize:13,fontWeight:800,cursor:amt?"pointer":"not-allowed"}}>Next →</button>
          </div>
        </>}

        {step===3&&<>
          <div style={{fontWeight:900,fontSize:16,marginBottom:4}}>⚡ Quick Add Visit</div>
          <div style={{fontSize:12,color:T.ts,marginBottom:16}}>Step 3 of 3 — Confirm</div>
          <div style={{background:T.sub,border:`2px solid ${T.border}`,borderRadius:14,padding:16,marginBottom:20}}>
            <div style={{display:"flex",justifyContent:"space-between",marginBottom:10}}>
              <div style={{fontSize:13,color:T.ts}}>Customer</div>
              <div style={{fontSize:13,fontWeight:800,color:T.text}}>{customer.name}</div>
            </div>
            <div style={{display:"flex",justifyContent:"space-between",marginBottom:10}}>
              <div style={{fontSize:13,color:T.ts}}>Service</div>
              <div style={{fontSize:13,fontWeight:800,color:T.text}}>{svc}</div>
            </div>
            <div style={{display:"flex",justifyContent:"space-between",marginBottom:10}}>
              <div style={{fontSize:13,color:T.ts}}>Staff</div>
              <div style={{fontSize:13,fontWeight:800,color:T.text}}>{staffName}</div>
            </div>
            <div style={{height:1,background:T.border,margin:"4px 0 10px"}}/>
            <div style={{display:"flex",justifyContent:"space-between"}}>
              <div style={{fontSize:14,fontWeight:800,color:T.text}}>Total</div>
              <div style={{fontSize:18,fontWeight:900,color:T.green}}>₹{amt}</div>
            </div>
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

// ── Book Appointment Modal ─────────────────────────────────────────────────────
function BookModal({customer,onClose,onConfirm}){
  const today=new Date();
  const [selDate,setSelDate]=useState(today.toISOString().split("T")[0]);
  const [selSlot,setSelSlot]=useState("");
  const [selSvc,setSelSvc]=useState(customer.favServices[0]||"");
  const [done,setDone]=useState(false);
  function confirm(){if(!selSlot||!selSvc)return;setDone(true);setTimeout(()=>onConfirm({customer,date:selDate,slot:selSlot,service:selSvc}),1500);}
  return(
    <div onClick={onClose} style={{position:"fixed",inset:0,background:"rgba(0,0,0,0.45)",zIndex:700,display:"flex",alignItems:"flex-end"}}>
      <div onClick={e=>e.stopPropagation()} style={{background:T.surface,borderRadius:"20px 20px 0 0",padding:"20px 18px 36px",width:"100%",maxHeight:"90vh",overflowY:"auto",boxShadow:"0 -8px 40px rgba(0,0,0,0.15)"}}>
        <div style={{width:36,height:4,background:T.border,borderRadius:2,margin:"0 auto 18px"}}/>
        <div style={{display:"flex",alignItems:"center",gap:12,marginBottom:20}}>
          <div style={{width:46,height:46,borderRadius:14,background:customer.color+"22",border:`2px solid ${customer.color}44`,display:"flex",alignItems:"center",justifyContent:"center",fontSize:17,fontWeight:900,color:customer.color}}>{customer.avatar}</div>
          <div><div style={{fontWeight:900,fontSize:16}}>📅 Book Appointment</div><div style={{fontSize:12,color:T.ts}}>for {customer.name}</div></div>
        </div>
        {!done?<>
          <div style={{marginBottom:14}}><div style={{fontSize:13,fontWeight:800,color:T.tm,marginBottom:8}}>Service</div><div style={{display:"flex",flexWrap:"wrap",gap:6}}>{SERVICES.map(s=>{const a=selSvc===s;return <button key={s} onClick={()=>setSelSvc(s)} style={{padding:"7px 13px",borderRadius:20,border:`2px solid ${a?T.green:T.border}`,background:a?T.gl:T.surface,color:a?T.gd:T.tm,fontSize:12,fontWeight:700,cursor:"pointer",fontFamily:"inherit"}}>{a?"✓ ":""}{s}</button>;})}  </div></div>
          <div style={{marginBottom:14}}><div style={{fontSize:13,fontWeight:800,color:T.tm,marginBottom:8}}>Date</div><input type="date" value={selDate} onChange={e=>setSelDate(e.target.value)} style={IS} onFocus={e=>e.target.style.borderColor=T.green} onBlur={e=>e.target.style.borderColor=T.border}/></div>
          <div style={{marginBottom:20}}><div style={{fontSize:13,fontWeight:800,color:T.tm,marginBottom:8}}>Time Slot</div><div style={{display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:7}}>{SLOTS.map(sl=>{const a=selSlot===sl;return <button key={sl} onClick={()=>setSelSlot(sl)} style={{padding:"8px 4px",borderRadius:10,border:`2px solid ${a?T.green:T.border}`,background:a?T.gl:T.surface,color:a?T.gd:T.tm,fontSize:11,fontWeight:700,cursor:"pointer",fontFamily:"inherit",textAlign:"center"}}>{sl}</button>;})}</div></div>
          <div style={{display:"flex",gap:10}}>
            <button onClick={onClose} style={{flex:1,padding:13,border:`2px solid ${T.border}`,borderRadius:12,background:T.surface,fontFamily:"inherit",fontSize:13,fontWeight:700,cursor:"pointer"}}>Cancel</button>
            <button onClick={confirm} style={{flex:2,padding:13,background:selSlot&&selSvc?T.green:"#d1d5db",border:"none",borderRadius:12,color:"#fff",fontFamily:"inherit",fontSize:14,fontWeight:800,cursor:selSlot&&selSvc?"pointer":"not-allowed"}}>✓ Confirm Booking</button>
          </div>
        </>:<div style={{textAlign:"center",padding:"20px 0"}}><div style={{fontSize:48,marginBottom:12}}>🎉</div><div style={{fontWeight:900,fontSize:18,marginBottom:6}}>Booking Confirmed!</div><div style={{fontSize:13,color:T.ts,lineHeight:1.7}}><strong>{customer.name}</strong><br/>{selSvc} · {selDate} · {selSlot}</div></div>}
      </div>
    </div>
  );
}

// ── Date range helpers ─────────────────────────────────────────────────────────
function parseVisitDate(dateStr){
  // "12 Apr 2026" → Date
  const months={Jan:0,Feb:1,Mar:2,Apr:3,May:4,Jun:5,Jul:6,Aug:7,Sep:8,Oct:9,Nov:10,Dec:11};
  const parts=dateStr.split(" ");
  if(parts.length===3) return new Date(parseInt(parts[2]),months[parts[1]],parseInt(parts[0]));
  return null;
}
function getDateRange(preset,customFrom,customTo){
  const now=new Date();
  const today=new Date(now.getFullYear(),now.getMonth(),now.getDate());
  if(preset==="today") return {from:today,to:today,label:"Today"};
  if(preset==="week"){const from=new Date(today);from.setDate(today.getDate()-today.getDay());return{from,to:today,label:"This Week"};}
  if(preset==="month"){const from=new Date(today.getFullYear(),today.getMonth(),1);return{from,to:today,label:"This Month"};}
  if(preset==="quarter"){const from=new Date(today.getFullYear(),today.getMonth()-2,1);return{from,to:today,label:"Last 3 Months"};}
  if(preset==="year"){const from=new Date(today.getFullYear(),0,1);return{from,to:today,label:"This Year"};}
  if(preset==="all") return{from:new Date(2020,0,1),to:today,label:"All Time"};
  if(preset==="custom"&&customFrom&&customTo) return{from:new Date(customFrom),to:new Date(customTo),label:`${customFrom} → ${customTo}`};
  return{from:new Date(2020,0,1),to:today,label:"All Time"};
}

// ── Owner Dashboard ────────────────────────────────────────────────────────────
function OwnerDashboard({customers}){
  const [preset,setPreset]=useState("month");
  const [customFrom,setCustomFrom]=useState("");
  const [customTo,setCustomTo]=useState("");
  const [appliedFrom,setAppliedFrom]=useState("");
  const [appliedTo,setAppliedTo]=useState("");
  const [showCustom,setShowCustom]=useState(false);

  // Use applied range for actual filtering, not live input
  const {from,to,label}=getDateRange(preset,appliedFrom,appliedTo);
  const canApply=customFrom&&customTo&&customFrom<=customTo;

  // Filter visits in range
  function visitsInRange(customer){
    return customer.visitHistory.filter(v=>{
      const d=parseVisitDate(v.date);
      if(!d)return false;
      const df=new Date(from.getFullYear(),from.getMonth(),from.getDate());
      const dt=new Date(to.getFullYear(),to.getMonth(),to.getDate(),23,59,59);
      return d>=df&&d<=dt;
    });
  }

  const filteredVisits=customers.flatMap(c=>visitsInRange(c).map(v=>({...v,customerName:c.name,customerTag:c.tag})));
  const totalRevenue=filteredVisits.reduce((s,v)=>s+v.amount,0);
  const totalVisits=filteredVisits.length;
  const uniqueCustomers=new Set(filteredVisits.map(v=>v.customerName)).size;
  const avgTicket=totalVisits?Math.round(totalRevenue/totalVisits):0;

  const svcCount={};
  filteredVisits.forEach(v=>v.services.forEach(s=>{svcCount[s]=(svcCount[s]||0)+1;}));
  const topServices=Object.entries(svcCount).sort((a,b)=>b[1]-a[1]).slice(0,5);

  const birthdays=customers.filter(c=>getBirthdayStatus(c.dob));

  // Revenue by customer (top spenders in range)
  const customerRevenue={};
  customers.forEach(c=>{
    const rev=visitsInRange(c).reduce((s,v)=>s+v.amount,0);
    if(rev>0)customerRevenue[c.name]={rev,avatar:c.avatar,color:c.color,tag:c.tag};
  });
  const topCustomers=Object.entries(customerRevenue).sort((a,b)=>b[1].rev-a[1].rev).slice(0,5);

  const PRESETS=[
    {id:"today",label:"Today"},
    {id:"week",label:"Week"},
    {id:"month",label:"Month"},
    {id:"quarter",label:"3 Months"},
    {id:"year",label:"Year"},
    {id:"all",label:"All Time"},
    {id:"custom",label:"Custom 📅"},
  ];

  return(
    <div style={{flex:1,overflowY:"auto",padding:"0 0 80px 0"}}>

      {/* Header */}
      <div style={{padding:"16px 16px 0"}}>
        <div style={{fontWeight:900,fontSize:18,color:T.text,marginBottom:2}}>Good Morning 👑</div>
        <div style={{fontSize:12,color:T.ts,marginBottom:14}}>Sharma's Salon · {new Date().toLocaleDateString("en-IN",{weekday:"long",day:"numeric",month:"long"})}</div>
      </div>

      {/* Date Range Selector */}
      <div style={{padding:"0 16px 14px"}}>
        <div style={{background:T.surface,border:`2px solid ${T.border}`,borderRadius:14,padding:"12px 14px"}}>
          <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:10}}>
            <div style={{fontSize:12,fontWeight:800,color:T.ts}}>📅 Analysing: <span style={{color:T.green}}>{label}</span></div>
            {totalVisits>0&&<div style={{fontSize:11,color:T.tf}}>{totalVisits} visit{totalVisits!==1?"s":""}</div>}
          </div>
          <div style={{display:"flex",gap:6,overflowX:"auto"}}>
            {PRESETS.map(p=>(
              <button key={p.id} onClick={()=>{setPreset(p.id);if(p.id==="custom")setShowCustom(true);else setShowCustom(false);}} style={{padding:"6px 12px",borderRadius:20,border:`2px solid ${preset===p.id?T.green:T.border}`,background:preset===p.id?T.green:T.surface,color:preset===p.id?"#fff":T.ts,fontSize:11,fontWeight:800,cursor:"pointer",whiteSpace:"nowrap",fontFamily:"inherit",flexShrink:0,transition:"all 0.15s"}}>{p.label}</button>
            ))}
          </div>
          {/* Custom date range */}
          {showCustom&&(
            <div style={{marginTop:12}}>
              <div style={{display:"flex",gap:8,alignItems:"center",marginBottom:10}}>
                <div style={{flex:1}}>
                  <div style={{fontSize:10,fontWeight:700,color:T.ts,marginBottom:4}}>FROM</div>
                  <input type="date" value={customFrom} onChange={e=>setCustomFrom(e.target.value)} style={{...IS,padding:"9px 10px",fontSize:13}} onFocus={e=>e.target.style.borderColor=T.green} onBlur={e=>e.target.style.borderColor=T.border}/>
                </div>
                <div style={{paddingTop:18,color:T.ts,fontWeight:800}}>→</div>
                <div style={{flex:1}}>
                  <div style={{fontSize:10,fontWeight:700,color:T.ts,marginBottom:4}}>TO</div>
                  <input type="date" value={customTo} onChange={e=>setCustomTo(e.target.value)} style={{...IS,padding:"9px 10px",fontSize:13}} onFocus={e=>e.target.style.borderColor=T.green} onBlur={e=>e.target.style.borderColor=T.border}/>
                </div>
              </div>
              <button
                onClick={()=>{if(canApply){setAppliedFrom(customFrom);setAppliedTo(customTo);}}}
                style={{
                  width:"100%",padding:"11px",
                  background:canApply?T.green:"#d1d5db",
                  border:"none",borderRadius:11,
                  color:"#fff",fontFamily:"inherit",
                  fontSize:13,fontWeight:800,
                  cursor:canApply?"pointer":"not-allowed",
                  transition:"all 0.15s",
                  boxShadow:canApply?"0 3px 10px rgba(34,197,94,0.25)":"none",
                }}
              >
                {canApply?"✓ Apply Date Range":"Select both dates to apply"}
              </button>
              {appliedFrom&&appliedTo&&appliedFrom===customFrom&&appliedTo===customTo&&(
                <div style={{textAlign:"center",fontSize:11,color:T.gd,fontWeight:700,marginTop:8}}>
                  ✅ Showing {appliedFrom} → {appliedTo}
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      <div style={{padding:"0 16px"}}>

        {/* KPI Grid */}
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10,marginBottom:14}}>
          {[
            {icon:"💰",val:totalRevenue>=1000?`₹${(totalRevenue/1000).toFixed(1)}k`:`₹${totalRevenue}`,label:"Revenue",accent:T.gd},
            {icon:"✂️",val:totalVisits,label:"Visits",accent:T.bt},
            {icon:"👥",val:uniqueCustomers,label:"Customers",accent:"#a855f7"},
            {icon:"📊",val:`₹${avgTicket}`,label:"Avg Ticket",accent:"#f59e0b"},
          ].map(s=>(
            <div key={s.label} style={{background:T.surface,border:`2px solid ${T.border}`,borderRadius:14,padding:"16px 14px",display:"flex",alignItems:"center",gap:12}}>
              <div style={{fontSize:24}}>{s.icon}</div>
              <div><div style={{fontWeight:900,fontSize:20,color:s.accent,lineHeight:1}}>{s.val}</div><div style={{fontSize:11,color:T.ts,fontWeight:700,marginTop:3}}>{s.label}</div></div>
            </div>
          ))}
        </div>

        {/* No data state */}
        {totalVisits===0&&(
          <div style={{background:T.surface,border:`2px dashed ${T.border}`,borderRadius:14,padding:"32px",textAlign:"center",marginBottom:14}}>
            <div style={{fontSize:32,marginBottom:8}}>📭</div>
            <div style={{fontWeight:800,fontSize:14,color:T.tm,marginBottom:4}}>No visits in this period</div>
            <div style={{fontSize:12,color:T.ts}}>Try selecting a different date range</div>
          </div>
        )}

        {/* Top Services */}
        {topServices.length>0&&(
          <div style={{background:T.surface,border:`2px solid ${T.border}`,borderRadius:14,padding:"14px",marginBottom:14}}>
            <SL>🏆 Most Popular Services</SL>
            {topServices.map(([svc,count],i)=>(
              <div key={svc} style={{display:"flex",alignItems:"center",gap:10,marginBottom:i<topServices.length-1?12:0}}>
                <div style={{width:24,height:24,borderRadius:8,background:i===0?T.green:T.sub,border:`1.5px solid ${i===0?T.gm:T.border}`,display:"flex",alignItems:"center",justifyContent:"center",fontSize:10,fontWeight:900,color:i===0?"#fff":T.ts,flexShrink:0}}>{i+1}</div>
                <div style={{flex:1}}>
                  <div style={{fontSize:13,fontWeight:700,color:T.text,marginBottom:4}}>{svc}</div>
                  <div style={{height:6,borderRadius:20,background:T.border,overflow:"hidden"}}><div style={{width:`${(count/topServices[0][1])*100}%`,height:"100%",background:i===0?T.green:"#86efac",borderRadius:20,transition:"width 0.5s"}}/></div>
                </div>
                <div style={{fontSize:12,fontWeight:800,color:T.gd,flexShrink:0}}>{count} visits</div>
              </div>
            ))}
          </div>
        )}

        {/* Top Customers by Revenue */}
        {topCustomers.length>0&&(
          <div style={{background:T.surface,border:`2px solid ${T.border}`,borderRadius:14,padding:"14px",marginBottom:14}}>
            <SL>💎 Top Customers — {label}</SL>
            {topCustomers.map(([name,data],i)=>(
              <div key={name} style={{display:"flex",alignItems:"center",gap:10,marginBottom:i<topCustomers.length-1?10:0}}>
                <div style={{width:32,height:32,borderRadius:10,background:data.color+"22",border:`1.5px solid ${data.color}44`,display:"flex",alignItems:"center",justifyContent:"center",fontSize:11,fontWeight:900,color:data.color,flexShrink:0}}>{data.avatar}</div>
                <div style={{flex:1}}>
                  <div style={{fontSize:13,fontWeight:800,color:T.text}}>{name}</div>
                  <div style={{height:5,borderRadius:20,background:T.border,overflow:"hidden",marginTop:4}}><div style={{width:`${(data.rev/topCustomers[0][1].rev)*100}%`,height:"100%",background:data.color,borderRadius:20}}/></div>
                </div>
                <div style={{fontSize:13,fontWeight:900,color:T.gd,flexShrink:0}}>₹{data.rev.toLocaleString()}</div>
              </div>
            ))}
          </div>
        )}

        {/* Birthday Alerts — always show */}
        {birthdays.length>0&&(
          <div style={{background:T.yellow,border:`2px solid ${T.yb}`,borderRadius:14,padding:"14px",marginBottom:14}}>
            <SL style={{color:T.yt}}>🎂 Upcoming Birthdays</SL>
            {birthdays.map(c=>{
              const status=getBirthdayStatus(c.dob);
              return(
                <div key={c.id} style={{display:"flex",alignItems:"center",gap:10,marginBottom:8}}>
                  <div style={{width:36,height:36,borderRadius:10,background:c.color+"22",border:`1.5px solid ${c.color}44`,display:"flex",alignItems:"center",justifyContent:"center",fontSize:13,fontWeight:900,color:c.color}}>{c.avatar}</div>
                  <div style={{flex:1}}><div style={{fontWeight:800,fontSize:13}}>{c.name}</div><div style={{fontSize:11,color:status.color,fontWeight:700}}>{status.label}</div></div>
                  <a href={`https://wa.me/${c.phone}?text=${encodeURIComponent(`🎂 Happy Birthday ${c.name}! Visit us for a special birthday treat! 💈 - Sharma's Salon`)}`} target="_blank" rel="noreferrer" style={{padding:"6px 12px",background:T.wa,borderRadius:20,color:"#fff",fontSize:11,fontWeight:800,textDecoration:"none"}}>💬 Wish</a>
                </div>
              );
            })}
          </div>
        )}

        {/* Client Breakdown — always show */}
        <div style={{background:T.surface,border:`2px solid ${T.border}`,borderRadius:14,padding:"14px"}}>
          <SL>👥 Client Breakdown</SL>
          <div style={{display:"flex",gap:8}}>
            {[
              {label:"VIP",val:customers.filter(c=>c.tag==="VIP").length,color:"#f59e0b",bg:T.yellow},
              {label:"Regular",val:customers.filter(c=>c.tag==="Regular").length,color:T.gd,bg:T.gl},
              {label:"New",val:customers.filter(c=>c.tag==="New").length,color:T.bt,bg:T.blue},
              {label:"WhatsApp",val:customers.filter(c=>c.src==="wa").length,color:T.wa,bg:"#e7fce8"},
            ].map(s=>(
              <div key={s.label} style={{flex:1,background:s.bg,borderRadius:11,padding:"10px 6px",textAlign:"center"}}>
                <div style={{fontWeight:900,fontSize:18,color:s.color}}>{s.val}</div>
                <div style={{fontSize:9,color:T.ts,fontWeight:700,marginTop:2}}>{s.label}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Visit Card ─────────────────────────────────────────────────────────────────
function VisitCard({visit,index,isStaff,onUpdate,onWA}){
  const [open,setOpen]=useState(false);
  const [eN,setEN]=useState(false);const [nV,setNV]=useState(visit.notes);
  const [eP,setEP]=useState(false);const [pV,setPV]=useState([...visit.products]);const [np,setNp]=useState("");
  const [eA,setEA]=useState(false);const [aV,setAV]=useState(String(visit.amount));
  function sN(){onUpdate(visit.id,{notes:nV});setEN(false);}
  function sP(){onUpdate(visit.id,{products:pV});setEP(false);}
  function sA(){onUpdate(visit.id,{amount:parseInt(aV)||0});setEA(false);}
  function ap(){if(!np.trim())return;setPV(p=>[...p,np.trim()]);setNp("");}
  function updatePhoto(i,updated){onUpdate(visit.id,{photos:visit.photos.map((p,idx)=>idx===i?updated:p)});}
  const isFirst=index===0;
  return(
    <div style={{display:"flex",gap:0,marginBottom:0}}>
      <div style={{display:"flex",flexDirection:"column",alignItems:"center",width:36,flexShrink:0}}>
        <div style={{width:28,height:28,borderRadius:"50%",flexShrink:0,zIndex:1,background:isFirst?T.green:T.sub,border:`2px solid ${isFirst?T.green:T.border}`,display:"flex",alignItems:"center",justifyContent:"center",fontSize:10,fontWeight:900,color:isFirst?"#fff":T.tf}}>{index+1}</div>
        <div style={{width:2,flex:1,minHeight:16,background:T.border,margin:"4px 0"}}/>
      </div>
      <div style={{flex:1,background:T.surface,border:`2px solid ${open?T.hover:T.border}`,borderRadius:14,overflow:"hidden",marginBottom:12,transition:"border-color 0.15s"}}>
        <div onClick={()=>setOpen(o=>!o)} style={{padding:"13px 14px",cursor:"pointer",userSelect:"none",display:"flex",alignItems:"center",justifyContent:"space-between",background:open?T.sub:T.surface,borderBottom:open?`2px solid ${T.border}`:"none"}}>
          <div><div style={{fontWeight:800,fontSize:14,color:T.text}}>{visit.date}</div><div style={{fontSize:12,color:T.ts,marginTop:3}}>{visit.services.join(" + ")} · {visit.stylist}</div></div>
          <div style={{display:"flex",alignItems:"center",gap:8}}>
            <div style={{background:T.gl,color:T.gd,border:`1.5px solid ${T.gm}`,padding:"4px 11px",borderRadius:20,fontSize:13,fontWeight:800}}>₹{visit.amount}</div>
            <div style={{color:T.tg,fontSize:11}}>{open?"▲":"▼"}</div>
          </div>
        </div>
        {open&&<div style={{padding:"16px 14px"}}>
          <div style={{marginBottom:14}}><SL>Services</SL><div style={{display:"flex",flexWrap:"wrap",gap:6}}>{visit.services.map(s=><Chip key={s}>{s}</Chip>)}</div></div>

          {isStaff&&<div style={{background:T.sub,border:`2px solid ${eA?T.green:T.border}`,borderRadius:12,padding:"12px 13px",marginBottom:14}}>
            <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:8}}><SL>💰 Bill Amount</SL>{!eA?<EditBtn onEdit={()=>setEA(true)}/>:<SCBar onSave={sA} onCancel={()=>{setAV(String(visit.amount));setEA(false);}}/>}</div>
            {eA?<input type="number" value={aV} onChange={e=>setAV(e.target.value)} style={IS} autoFocus onFocus={e=>e.target.style.borderColor=T.green} onBlur={e=>e.target.style.borderColor=T.border}/>:<div style={{fontWeight:900,fontSize:18,color:T.green}}>₹{visit.amount}</div>}
          </div>}

          <div style={{background:T.sub,borderRadius:12,border:`2px solid ${eP?T.green:T.border}`,padding:"12px 13px",marginBottom:14}}>
            <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:10}}><SL>🧴 Products Used</SL>{!eP?<EditBtn onEdit={()=>{setPV([...visit.products]);setEP(true);}}/>:<SCBar onSave={sP} onCancel={()=>{setPV([...visit.products]);setEP(false);setNp("");}}/>}</div>
            {!eP?visit.products.length>0?<div style={{display:"flex",flexWrap:"wrap",gap:6}}>{visit.products.map((p,i)=><Chip key={i} style={{background:T.blue,color:T.bt,border:`1.5px solid ${T.bb}`}}>{p}</Chip>)}</div>:<div style={{fontSize:12,color:T.tg,fontStyle:"italic"}}>No products recorded</div>:<div>
              {pV.map((p,i)=><div key={i} style={{display:"flex",gap:7,marginBottom:7,alignItems:"center"}}><div style={{flex:1,background:T.surface,border:`2px solid ${T.border}`,borderRadius:9,padding:"8px 12px",fontSize:13}}>🧴 {p}</div><button onClick={()=>setPV(v=>v.filter((_,idx)=>idx!==i))} style={{width:30,height:30,background:T.red,border:`2px solid ${T.rb}`,borderRadius:8,color:T.rt,cursor:"pointer",fontSize:13,display:"flex",alignItems:"center",justifyContent:"center"}}>✕</button></div>)}
              <div style={{display:"flex",gap:7,marginTop:4}}><input value={np} onChange={e=>setNp(e.target.value)} onKeyDown={e=>e.key==="Enter"&&ap()} placeholder="Add product…" style={{...IS,flex:1,padding:"9px 12px",fontSize:13}} onFocus={e=>e.target.style.borderColor=T.green} onBlur={e=>e.target.style.borderColor=T.border}/><button onClick={ap} style={{padding:"9px 14px",background:T.gl,border:`2px solid ${T.gm}`,borderRadius:9,color:T.gd,fontWeight:900,fontSize:16,cursor:"pointer",fontFamily:"inherit",flexShrink:0}}>＋</button></div>
            </div>}
          </div>

          <div style={{background:eN?"#f0fdf4":T.sub,borderRadius:12,border:`2px solid ${eN?T.green:T.border}`,padding:"12px 13px",marginBottom:14}}>
            <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:8}}><SL>📝 Stylist Notes</SL>{!eN?<EditBtn onEdit={()=>{setNV(visit.notes);setEN(true);}}/>:<SCBar onSave={sN} onCancel={()=>{setNV(visit.notes);setEN(false);}}/>}</div>
            {!eN?<div style={{fontSize:13,lineHeight:1.65,color:visit.notes?T.tm:T.tg,fontStyle:visit.notes?"normal":"italic"}}>{visit.notes||"No notes yet — tap Edit to add"}</div>:<textarea value={nV} onChange={e=>setNV(e.target.value)} rows={3} style={{...IS,resize:"vertical",lineHeight:1.65,borderColor:T.green,background:T.surface,fontSize:13,padding:"10px 12px"}} autoFocus/>}
          </div>

          {/* Photos with camera/gallery picker */}
          <div style={{marginBottom:14}}>
            <SL>📸 Visit Photos</SL>
            <div style={{fontSize:11,color:T.ts,marginBottom:10}}>Tap any photo to add from camera or gallery</div>
            <div style={{display:"flex",gap:10,flexWrap:"wrap"}}>
              {visit.photos.map((ph,i)=><PhotoTile key={i} photo={ph} onUpdate={updated=>updatePhoto(i,updated)}/>)}
            </div>
          </div>

          <button onClick={()=>onWA(visit)} style={{width:"100%",padding:12,background:T.wa,border:"none",borderRadius:12,color:"#fff",fontFamily:"inherit",fontSize:13,fontWeight:800,cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",gap:8,boxShadow:"0 3px 10px rgba(37,211,102,0.3)"}}>💬 Send Visit Summary on WhatsApp</button>
        </div>}
      </div>
    </div>
  );
}

// ── Full Add Visit Modal ────────────────────────────────────────────────────────
function FullAddModal({staffName,onSave,onClose}){
  const [step,setStep]=useState(1);
  const [form,setForm]=useState({services:[],amount:"",notes:"",products:[],newProd:""});
  function toggleSvc(s){setForm(f=>({...f,services:f.services.includes(s)?f.services.filter(x=>x!==s):[...f.services,s]}));}
  function addProd(){if(!form.newProd.trim())return;setForm(f=>({...f,products:[...f.products,f.newProd.trim()],newProd:""}));}
  function save(){
    if(!form.services.length||!form.amount)return;
    const d=new Date().toLocaleDateString("en-IN",{day:"2-digit",month:"short",year:"numeric"});
    onSave({id:"v"+Date.now(),date:d,services:form.services,stylist:staffName,amount:parseInt(form.amount)||0,notes:form.notes,products:form.products,photos:[{type:"before",filled:false},{type:"after",filled:false},{type:"extra",filled:false}]});
    onClose();
  }
  return(
    <div onClick={onClose} style={{position:"fixed",inset:0,background:"rgba(0,0,0,0.45)",zIndex:700,display:"flex",alignItems:"flex-end"}}>
      <div onClick={e=>e.stopPropagation()} style={{background:T.surface,borderRadius:"20px 20px 0 0",padding:"20px 18px 36px",width:"100%",maxHeight:"90vh",overflowY:"auto",boxShadow:"0 -8px 40px rgba(0,0,0,0.12)"}}>
        <div style={{width:36,height:4,background:T.border,borderRadius:2,margin:"0 auto 16px"}}/>
        <div style={{fontWeight:900,fontSize:16,marginBottom:4}}>➕ Add Detailed Visit</div>
        <div style={{fontSize:12,color:T.ts,marginBottom:18}}>Staff: {staffName}</div>
        {step===1&&<><SL>Select Services</SL><div style={{display:"flex",flexWrap:"wrap",gap:8,marginBottom:20}}>{SERVICES.map(s=>{const a=form.services.includes(s);return <button key={s} onClick={()=>toggleSvc(s)} style={{padding:"8px 14px",borderRadius:20,border:`2px solid ${a?T.green:T.border}`,background:a?T.gl:T.surface,color:a?T.gd:T.tm,fontSize:12,fontWeight:700,cursor:"pointer",fontFamily:"inherit"}}>{a?"✓ ":""}{s}</button>;})}</div><div style={{display:"flex",gap:10}}><button onClick={onClose} style={{flex:1,padding:12,border:`2px solid ${T.border}`,borderRadius:12,background:T.surface,fontFamily:"inherit",fontSize:13,fontWeight:700,cursor:"pointer"}}>Cancel</button><button onClick={()=>{if(form.services.length)setStep(2);}} style={{flex:2,padding:12,background:form.services.length?T.green:"#d1d5db",border:"none",borderRadius:12,color:"#fff",fontFamily:"inherit",fontSize:13,fontWeight:800,cursor:form.services.length?"pointer":"not-allowed"}}>Next →</button></div></>}
        {step===2&&<><div style={{display:"flex",flexWrap:"wrap",gap:6,marginBottom:14}}>{form.services.map(s=><Chip key={s}>{s}</Chip>)}<button onClick={()=>setStep(1)} style={{background:"none",border:`1.5px solid ${T.border}`,borderRadius:20,padding:"3px 10px",fontSize:11,color:T.ts,cursor:"pointer",fontFamily:"inherit"}}>✏️</button></div>
        <div style={{marginBottom:13}}><div style={{fontSize:13,fontWeight:800,color:T.tm,marginBottom:5}}>Bill Amount (₹) *</div><input type="number" value={form.amount} onChange={e=>setForm(f=>({...f,amount:e.target.value}))} placeholder="e.g. 450" style={IS} onFocus={e=>e.target.style.borderColor=T.green} onBlur={e=>e.target.style.borderColor=T.border}/></div>
        <div style={{marginBottom:13}}><div style={{fontSize:13,fontWeight:800,color:T.tm,marginBottom:8}}>Products Used</div>{form.products.map((p,i)=><div key={i} style={{display:"flex",gap:7,marginBottom:7,alignItems:"center"}}><div style={{flex:1,background:T.sub,border:`2px solid ${T.border}`,borderRadius:9,padding:"8px 12px",fontSize:13}}>🧴 {p}</div><button onClick={()=>setForm(f=>({...f,products:f.products.filter((_,idx)=>idx!==i)}))} style={{width:30,height:30,background:T.red,border:`2px solid ${T.rb}`,borderRadius:8,color:T.rt,cursor:"pointer",fontSize:13,display:"flex",alignItems:"center",justifyContent:"center"}}>✕</button></div>)}<div style={{display:"flex",gap:7}}><input value={form.newProd} onChange={e=>setForm(f=>({...f,newProd:e.target.value}))} onKeyDown={e=>e.key==="Enter"&&addProd()} placeholder="Add product…" style={{...IS,flex:1,padding:"9px 12px",fontSize:13}} onFocus={e=>e.target.style.borderColor=T.green} onBlur={e=>e.target.style.borderColor=T.border}/><button onClick={addProd} style={{padding:"9px 14px",background:T.gl,border:`2px solid ${T.gm}`,borderRadius:9,color:T.gd,fontWeight:900,fontSize:16,cursor:"pointer",fontFamily:"inherit",flexShrink:0}}>＋</button></div></div>
        <div style={{marginBottom:20}}><div style={{fontSize:13,fontWeight:800,color:T.tm,marginBottom:5}}>Stylist Notes</div><textarea value={form.notes} onChange={e=>setForm(f=>({...f,notes:e.target.value}))} rows={3} placeholder="Treatment details…" style={{...IS,resize:"vertical",lineHeight:1.6,fontSize:13,padding:"10px 12px"}} onFocus={e=>e.target.style.borderColor=T.green} onBlur={e=>e.target.style.borderColor=T.border}/></div>
        <div style={{display:"flex",gap:10}}><button onClick={()=>setStep(1)} style={{flex:1,padding:12,border:`2px solid ${T.border}`,borderRadius:12,background:T.surface,fontFamily:"inherit",fontSize:13,fontWeight:700,cursor:"pointer"}}>← Back</button><button onClick={save} style={{flex:2,padding:12,background:form.services.length&&form.amount?T.green:"#d1d5db",border:"none",borderRadius:12,color:"#fff",fontFamily:"inherit",fontSize:13,fontWeight:800,cursor:form.services.length&&form.amount?"pointer":"not-allowed"}}>✓ Save Visit</button></div></>}
      </div>
    </div>
  );
}

// ── Customer Detail ────────────────────────────────────────────────────────────
function CustomerDetail({customer,isStaff,currentUser,onBack,onUpdate,allCustomers}){
  const [tab,setTab]=useState("overview");
  const [waVisit,setWaVisit]=useState(null);
  const [waPrompt,setWaPrompt]=useState(null);
  const [showQuick,setShowQuick]=useState(false);
  const [showFull,setShowFull]=useState(false);
  const [bookModal,setBookModal]=useState(false);
  const [bookDone,setBookDone]=useState(null);

  const avg=customer.visitHistory.length?Math.round(customer.totalSpent/customer.visitHistory.length):0;
  const tag=TAG[customer.tag]||TAG.Regular;
  const bday=getBirthdayStatus(customer.dob);

  function hvUpdate(id,ch){onUpdate(customer.id,{visitHistory:customer.visitHistory.map(v=>v.id===id?{...v,...ch}:v)});}
  function addVisit(nv){
    onUpdate(customer.id,{visitHistory:[nv,...customer.visitHistory],visits:customer.visits+1,totalSpent:customer.totalSpent+nv.amount,lastVisit:nv.date});
    setWaPrompt(nv); // Auto-prompt WhatsApp after save
  }

  const TABS=[{id:"overview",label:"Overview",icon:"📋"},{id:"visits",label:"Visits",icon:"📅"},{id:"photos",label:"Photos",icon:"📸"}];

  return(
    <div style={{flex:1,display:"flex",flexDirection:"column",overflow:"hidden"}}>
      <div style={{background:T.surface,borderBottom:`2px solid ${T.border}`,flexShrink:0}}>
        <div style={{padding:"10px 16px 0",display:"flex",alignItems:"center",gap:10}}>
          <button onClick={onBack} style={{width:32,height:32,borderRadius:9,border:`2px solid ${T.border}`,background:T.surface,cursor:"pointer",fontSize:16,color:T.tm,display:"flex",alignItems:"center",justifyContent:"center"}}>‹</button>
          <span style={{fontSize:12,color:T.ts,fontWeight:700}}>All Customers</span>
          {isStaff&&<div style={{marginLeft:"auto",background:"#fef3c7",border:"1.5px solid #fde68a",borderRadius:20,padding:"3px 10px",fontSize:10,fontWeight:800,color:"#92400e"}}>👨‍💼 {currentUser.name}</div>}
        </div>
        <div style={{padding:"14px 16px 16px",display:"flex",alignItems:"center",gap:14}}>
          <div style={{width:58,height:58,borderRadius:18,flexShrink:0,background:customer.color+"22",border:`2.5px solid ${customer.color}55`,display:"flex",alignItems:"center",justifyContent:"center",fontSize:20,fontWeight:900,color:customer.color}}>{customer.avatar}</div>
          <div style={{flex:1}}>
            <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:3}}>
              <div style={{fontWeight:900,fontSize:18,color:T.text}}>{customer.name}</div>
              <div style={{background:tag.bg,color:tag.color,border:`1.5px solid ${tag.border}`,fontSize:10,fontWeight:800,padding:"2px 8px",borderRadius:20}}>{tag.label}</div>
              {bday&&<div style={{background:bday.bg,color:bday.color,border:`1.5px solid ${bday.border}`,fontSize:10,fontWeight:800,padding:"2px 8px",borderRadius:20}}>🎂</div>}
            </div>
            <div style={{fontSize:12,color:T.ts}}>📱 +91 {customer.phone} · 📍 {customer.city}</div>
            <div style={{fontSize:11,color:T.tf,marginTop:2}}>{customer.src==="wa"?"💬 WhatsApp":"🚶 Walk-in"} · Since {customer.joined}</div>
          </div>
        </div>
        <div style={{display:"flex",borderTop:`2px solid ${T.border}`}}>
          {TABS.map(t=><div key={t.id} onClick={()=>setTab(t.id)} style={{flex:1,padding:"10px 4px",display:"flex",flexDirection:"column",alignItems:"center",gap:3,cursor:"pointer",borderBottom:`3px solid ${tab===t.id?T.green:"transparent"}`,transition:"all 0.15s"}}><span style={{fontSize:16}}>{t.icon}</span><span style={{fontSize:11,fontWeight:800,color:tab===t.id?T.green:T.tf}}>{t.label}</span></div>)}
        </div>
      </div>

      <div style={{flex:1,overflowY:"auto",padding:"16px 16px 80px"}}>

        {/* Birthday banner */}
        {bday&&<div style={{background:bday.bg,border:`2px solid ${bday.border}`,borderRadius:12,padding:"12px 14px",marginBottom:14,display:"flex",alignItems:"center",justifyContent:"space-between"}}>
          <div style={{fontSize:13,fontWeight:800,color:bday.color}}>{bday.label}</div>
          <a href={`https://wa.me/${customer.phone}?text=${encodeURIComponent(`🎂 Happy Birthday ${customer.name}! 🎉 Visit us for a birthday treat! 💈 - Sharma's Salon`)}`} target="_blank" rel="noreferrer" style={{padding:"6px 12px",background:T.wa,borderRadius:20,color:"#fff",fontSize:11,fontWeight:800,textDecoration:"none"}}>💬 Wish Now</a>
        </div>}

        {/* Booking success */}
        {bookDone&&<div style={{background:T.gl,border:`2px solid ${T.gm}`,borderRadius:12,padding:"12px 14px",marginBottom:14,display:"flex",alignItems:"center",gap:10}}><span style={{fontSize:20}}>🎉</span><div><div style={{fontWeight:800,fontSize:13,color:T.gd}}>Appointment Booked!</div><div style={{fontSize:12,color:T.gd,marginTop:2}}>{bookDone.service} · {bookDone.date} · {bookDone.slot}</div></div></div>}

        {tab==="overview"&&<>
          <div style={{marginBottom:16}}><SL>Stats</SL><div style={{display:"flex",gap:8}}>
            <StatBox icon="✂️" val={customer.visits} label="Visits"/>
            {!isStaff&&<StatBox icon="💸" val={`₹${(customer.totalSpent/1000).toFixed(1)}k`} label="Total Spent"/>}
            {!isStaff&&<StatBox icon="📊" val={`₹${avg}`} label="Avg / Visit"/>}
            <StatBox icon="🔥" val={`${Math.min(customer.visits,6)}×`} label="Streak"/>
            {isStaff&&<StatBox icon="📅" val={customer.lastVisit} label="Last Visit"/>}
          </div></div>

          <div style={{background:T.surface,border:`2px solid ${T.border}`,borderRadius:14,padding:14,marginBottom:14}}>
            <SL>⭐ Favourite Services</SL>
            <div style={{display:"flex",flexWrap:"wrap",gap:7}}>{customer.favServices.map((s,i)=><Chip key={s} style={i===0?{background:T.green,color:"#fff",border:`1.5px solid ${T.green}`}:{}}>{i===0?"🏆 ":""}{s}</Chip>)}</div>
          </div>

          {customer.visitHistory.length>0&&(()=>{const l=customer.visitHistory[0];return(
            <div style={{background:T.surface,border:`2px solid ${T.border}`,borderRadius:14,padding:14,marginBottom:14}}>
              <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:10}}><SL>🕐 Last Visit</SL><span style={{fontSize:11,color:T.ts,fontWeight:700}}>{l.date}</span></div>
              <div style={{display:"flex",flexWrap:"wrap",gap:6,marginBottom:8}}>{l.services.map(s=><Chip key={s}>{s}</Chip>)}{!isStaff&&<Chip>₹{l.amount}</Chip>}</div>
              {l.products.length>0&&<div style={{fontSize:12,color:T.ts,marginBottom:6}}><span style={{color:T.bt,fontWeight:700}}>Products: </span>{l.products.join(", ")}</div>}
              {l.notes&&<div style={{background:T.yellow,border:`1.5px solid ${T.yb}`,borderRadius:9,padding:"8px 11px",fontSize:12,color:T.yt,lineHeight:1.6}}>📝 {l.notes}</div>}
            </div>
          );})()}

          <div style={{display:"flex",gap:10}}>
            <button onClick={()=>setBookModal(true)} style={{flex:1,padding:12,background:T.green,border:"none",borderRadius:12,color:"#fff",fontFamily:"inherit",fontSize:13,fontWeight:800,cursor:"pointer",boxShadow:"0 3px 10px rgba(34,197,94,0.25)"}}>📅 Book Appointment</button>
            <button onClick={()=>customer.visitHistory.length&&setWaVisit(customer.visitHistory[0])} style={{flex:1,padding:12,background:T.wa,border:"none",borderRadius:12,color:"#fff",fontFamily:"inherit",fontSize:13,fontWeight:800,cursor:"pointer"}}>💬 WhatsApp</button>
          </div>
        </>}

        {tab==="visits"&&<>
          <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:14}}>
            <SL>Visit Timeline — {customer.visitHistory.length} visits</SL>
            <div style={{display:"flex",gap:7}}>
              <button onClick={()=>setShowQuick(true)} style={{background:T.gl,border:`1.5px solid ${T.gm}`,borderRadius:20,padding:"6px 12px",color:T.gd,fontFamily:"inherit",fontSize:11,fontWeight:800,cursor:"pointer"}}>⚡ Quick</button>
              <button onClick={()=>setShowFull(true)} style={{background:T.green,border:"none",borderRadius:20,padding:"6px 12px",color:"#fff",fontFamily:"inherit",fontSize:11,fontWeight:800,cursor:"pointer"}}>➕ Detailed</button>
            </div>
          </div>
          {customer.visitHistory.length===0
            ?<div style={{background:T.surface,border:`2px dashed ${T.border}`,borderRadius:14,padding:36,textAlign:"center",color:T.tf}}>No visits recorded yet</div>
            :customer.visitHistory.map((v,i)=><VisitCard key={v.id} visit={v} index={i} isStaff={isStaff} onUpdate={hvUpdate} onWA={setWaVisit}/>)
          }
        </>}

        {tab==="photos"&&<>
          <SL>All Photos</SL>
          {customer.visitHistory.every(v=>v.photos.every(p=>!p.filled))
            ?<div style={{background:T.surface,border:`2px dashed ${T.border}`,borderRadius:14,padding:36,textAlign:"center",color:T.tf}}>No photos yet. Go to Visits tab to add.</div>
            :customer.visitHistory.map(v=>{const f=v.photos.filter(p=>p.filled);if(!f.length)return null;return(
              <div key={v.id} style={{marginBottom:18}}>
                <div style={{fontSize:12,fontWeight:800,color:T.ts,marginBottom:10,display:"flex",justifyContent:"space-between"}}><span>{v.date}</span><span style={{color:T.tf}}>{v.services.join(" + ")}</span></div>
                <div style={{display:"flex",gap:10,flexWrap:"wrap"}}>{v.photos.map((ph,i)=><PhotoTile key={i} photo={ph} onUpdate={updated=>hvUpdate(v.id,{photos:v.photos.map((p,idx)=>idx===i?updated:p)})}/>)}</div>
              </div>
            );})
          }
        </>}
      </div>

      {bookModal&&<BookModal customer={customer} onClose={()=>setBookModal(false)} onConfirm={(info)=>{setBookModal(false);setBookDone(info);setTimeout(()=>setBookDone(null),5000);}}/>}
      {waVisit&&<WAPrompt customer={customer} visit={waVisit} onSend={()=>setWaVisit(null)} onSkip={()=>setWaVisit(null)}/>}
      {waPrompt&&<WAPrompt customer={customer} visit={waPrompt} onSend={()=>setWaPrompt(null)} onSkip={()=>setWaPrompt(null)}/>}
      {showQuick&&<QuickAddModal customer={customer} staffName={currentUser.name} onSave={addVisit} onClose={()=>setShowQuick(false)}/>}
      {showFull&&<FullAddModal staffName={currentUser.name} onSave={addVisit} onClose={()=>setShowFull(false)}/>}
    </div>
  );
}

// ── Customer List ──────────────────────────────────────────────────────────────
function CustomerList({customers,isStaff,onSelect}){
  const [search,setSearch]=useState("");
  const [filter,setFilter]=useState("All");
  const [svcFilter,setSvcFilter]=useState("");

  const filtered=customers.filter(c=>{
    const q=search.toLowerCase();
    const ms=!q||c.name.toLowerCase().includes(q)||c.phone.includes(q);
    const mf=filter==="All"?true:filter==="VIP"?c.tag==="VIP":filter==="Regular"?c.tag==="Regular":filter==="New"?c.tag==="New":filter==="WhatsApp"?c.src==="wa":c.src==="walk";
    const msvc=!svcFilter||c.favServices.some(s=>s.toLowerCase().includes(svcFilter.toLowerCase()))||c.visitHistory.some(v=>v.services.some(s=>s.toLowerCase().includes(svcFilter.toLowerCase())));
    return ms&&mf&&msvc;
  });

  const allSvcs=[...new Set(customers.flatMap(c=>c.favServices))];

  return(
    <div style={{flex:1,display:"flex",flexDirection:"column",overflow:"hidden"}}>
      <div style={{background:T.surface,padding:"12px 16px",borderBottom:`2px solid ${T.border}`,flexShrink:0}}>
        {/* Search */}
        <div style={{position:"relative",marginBottom:10}}>
          <span style={{position:"absolute",left:12,top:"50%",transform:"translateY(-50%)",fontSize:14,color:T.tf}}>🔍</span>
          <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Search by name or number…" style={{width:"100%",padding:"10px 12px 10px 36px",border:`2px solid ${T.border}`,borderRadius:11,fontSize:13,fontFamily:"inherit",outline:"none",background:T.inp,boxSizing:"border-box"}} onFocus={e=>e.target.style.borderColor=T.green} onBlur={e=>e.target.style.borderColor=T.border}/>
        </div>
        {/* Tag filters */}
        <div style={{display:"flex",gap:6,overflowX:"auto",marginBottom:8}}>
          {["All","VIP","Regular","New","WhatsApp","Walk-in"].map(f=><button key={f} onClick={()=>setFilter(f)} style={{padding:"5px 13px",borderRadius:20,border:`2px solid ${filter===f?T.green:T.border}`,background:filter===f?T.green:T.surface,color:filter===f?"#fff":T.ts,fontSize:11,fontWeight:800,cursor:"pointer",whiteSpace:"nowrap",fontFamily:"inherit",flexShrink:0}}>{f}</button>)}
        </div>
        {/* Service filter */}
        <div style={{display:"flex",gap:6,overflowX:"auto"}}>
          <button onClick={()=>setSvcFilter("")} style={{padding:"4px 10px",borderRadius:20,border:`2px solid ${!svcFilter?T.green:T.border}`,background:!svcFilter?T.gl:T.surface,color:!svcFilter?T.gd:T.ts,fontSize:10,fontWeight:800,cursor:"pointer",whiteSpace:"nowrap",fontFamily:"inherit",flexShrink:0}}>All Services</button>
          {allSvcs.map(s=><button key={s} onClick={()=>setSvcFilter(svcFilter===s?"":s)} style={{padding:"4px 10px",borderRadius:20,border:`2px solid ${svcFilter===s?T.green:T.border}`,background:svcFilter===s?T.gl:T.surface,color:svcFilter===s?T.gd:T.ts,fontSize:10,fontWeight:800,cursor:"pointer",whiteSpace:"nowrap",fontFamily:"inherit",flexShrink:0}}>{s}</button>)}
        </div>
      </div>

      <div style={{padding:"8px 16px",background:T.sub,borderBottom:`2px solid ${T.border}`,fontSize:12,color:T.ts,fontWeight:700,flexShrink:0,display:"flex",alignItems:"center",justifyContent:"space-between"}}>
        <span>{filtered.length} customer{filtered.length!==1?"s":""}{isStaff&&<span style={{marginLeft:8,color:"#92400e"}}>· 👨‍💼 Staff</span>}</span>
        {svcFilter&&<span style={{color:T.gd}}>✂️ {svcFilter}</span>}
      </div>

      <div style={{flex:1,overflowY:"auto",padding:"12px 16px"}}>
        <div style={{display:"flex",flexDirection:"column",gap:10}}>
          {filtered.map(c=>{
            const tag=TAG[c.tag]||TAG.Regular;
            const bday=getBirthdayStatus(c.dob);
            return(
              <div key={c.id} onClick={()=>onSelect(c)} style={{background:T.surface,border:`2px solid ${bday?T.yb:T.border}`,borderRadius:16,padding:14,cursor:"pointer",transition:"all 0.15s"}} onMouseOver={e=>{e.currentTarget.style.borderColor=T.green;e.currentTarget.style.boxShadow="0 4px 14px rgba(34,197,94,0.1)";}} onMouseOut={e=>{e.currentTarget.style.borderColor=bday?T.yb:T.border;e.currentTarget.style.boxShadow="none";}}>
                <div style={{display:"flex",alignItems:"center",gap:12,marginBottom:12}}>
                  <div style={{width:44,height:44,borderRadius:14,flexShrink:0,background:c.color+"22",border:`2px solid ${c.color}44`,display:"flex",alignItems:"center",justifyContent:"center",fontSize:16,fontWeight:900,color:c.color}}>{c.avatar}</div>
                  <div style={{flex:1,minWidth:0}}>
                    <div style={{fontWeight:800,fontSize:15,color:T.text,display:"flex",alignItems:"center",gap:6}}>
                      {c.name}
                      {bday&&<span style={{fontSize:14}}>🎂</span>}
                    </div>
                    <div style={{fontSize:11,color:T.ts,marginTop:2}}>📍 {c.city} · {c.src==="wa"?"💬 WhatsApp":"🚶 Walk-in"}</div>
                  </div>
                  <div style={{background:tag.bg,color:tag.color,border:`1.5px solid ${tag.border}`,fontSize:10,fontWeight:800,padding:"3px 9px",borderRadius:20,flexShrink:0}}>{tag.label}</div>
                </div>
                {bday&&<div style={{background:bday.bg,border:`1.5px solid ${bday.border}`,borderRadius:8,padding:"6px 10px",marginBottom:10,fontSize:11,fontWeight:700,color:bday.color}}>{bday.label}</div>}
                <div style={{height:1,background:T.border,marginBottom:12}}/>
                <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:8}}>
                  {[{label:"Visits",val:c.visits},{label:isStaff?"Last Visit":"Total Spent",val:isStaff?c.lastVisit:`₹${c.totalSpent.toLocaleString()}`},{label:isStaff?"Since":"Last Visit",val:isStaff?c.joined:c.lastVisit}].map(s=>(
                    <div key={s.label} style={{background:T.sub,borderRadius:9,padding:"8px 6px",textAlign:"center",border:`1.5px solid ${T.border}`}}><div style={{fontWeight:900,fontSize:13,color:T.text}}>{s.val}</div><div style={{fontSize:9,color:T.tf,fontWeight:700,marginTop:2}}>{s.label}</div></div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

// ── Login Page ─────────────────────────────────────────────────────────────────
function LoginPage({onLogin}){
  const [roleTab,setRoleTab]=useState("owner");const [email,setEmail]=useState("owner@salon.com");const [password,setPassword]=useState("owner123");const [error,setError]=useState("");const [loading,setLoading]=useState(false);
  function switchTab(r){setRoleTab(r);setError("");if(r==="owner"){setEmail("owner@salon.com");setPassword("owner123");}else{setEmail("raju@salon.com");setPassword("staff123");}}
  function handleLogin(){setError("");setLoading(true);setTimeout(()=>{const u=DEMO_USERS.find(u=>u.email===email.trim()&&u.password===password&&u.role===roleTab);if(u)onLogin(u);else{setError("Wrong credentials.");setLoading(false);}},900);}
  return(
    <div style={{minHeight:"100vh",background:"linear-gradient(160deg,#f0fdf4,#f0f4f8)",display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",padding:"24px 20px",fontFamily:"system-ui,sans-serif"}}>
      <div style={{display:"flex",alignItems:"center",gap:10,marginBottom:28}}><div style={{width:44,height:44,background:T.green,borderRadius:12,display:"flex",alignItems:"center",justifyContent:"center",fontSize:22}}>✂️</div><span style={{fontWeight:900,fontSize:22,color:T.text}}>Snip<span style={{color:T.green}}>Book</span></span></div>
      <div style={{width:"100%",maxWidth:380,background:T.surface,borderRadius:20,boxShadow:"0 8px 32px rgba(0,0,0,0.08)",border:`2px solid ${T.border}`,overflow:"hidden"}}>
        <div style={{display:"flex",borderBottom:`2px solid ${T.border}`}}>
          {[{id:"owner",icon:"👑",label:"Owner Login"},{id:"staff",icon:"👨‍💼",label:"Staff Login"}].map(t=>(
            <div key={t.id} onClick={()=>switchTab(t.id)} style={{flex:1,padding:"14px 8px",display:"flex",flexDirection:"column",alignItems:"center",gap:4,cursor:"pointer",background:roleTab===t.id?T.gl:T.sub,borderBottom:`3px solid ${roleTab===t.id?T.green:"transparent"}`,transition:"all 0.15s"}}>
              <span style={{fontSize:20}}>{t.icon}</span><span style={{fontSize:12,fontWeight:800,color:roleTab===t.id?T.gd:T.ts}}>{t.label}</span>
            </div>
          ))}
        </div>
        <div style={{padding:"22px 22px 26px"}}>
          <div style={{marginBottom:13}}><div style={{fontSize:13,fontWeight:800,color:T.tm,marginBottom:5}}>Email</div><input value={email} onChange={e=>setEmail(e.target.value)} type="email" style={IS} onFocus={e=>e.target.style.borderColor=T.green} onBlur={e=>e.target.style.borderColor=T.border}/></div>
          <div style={{marginBottom:16}}><div style={{fontSize:13,fontWeight:800,color:T.tm,marginBottom:5}}>Password</div><input value={password} onChange={e=>setPassword(e.target.value)} onKeyDown={e=>e.key==="Enter"&&handleLogin()} type="password" style={IS} onFocus={e=>e.target.style.borderColor=T.green} onBlur={e=>e.target.style.borderColor=T.border}/></div>
          {error&&<div style={{background:T.red,border:`1.5px solid ${T.rb}`,borderRadius:9,padding:"9px 12px",marginBottom:14,fontSize:12,color:T.rt,fontWeight:600}}>⚠️ {error}</div>}
          <button onClick={handleLogin} style={{width:"100%",padding:13,background:loading?"#86efac":T.green,border:"none",borderRadius:12,color:"#fff",fontFamily:"inherit",fontSize:14,fontWeight:800,cursor:"pointer",boxShadow:"0 4px 14px rgba(34,197,94,0.3)",marginBottom:16}}>
            {loading?"Logging in...":`Login as ${roleTab==="owner"?"Owner 👑":"Staff 👨‍💼"}`}
          </button>
          <div style={{background:T.sub,border:`1.5px solid ${T.border}`,borderRadius:10,padding:"11px 13px"}}>
            <div style={{fontSize:11,fontWeight:800,color:T.ts,marginBottom:8}}>💡 Demo accounts:</div>
            {DEMO_USERS.filter(u=>u.role===roleTab).map(u=>(
              <div key={u.id} onClick={()=>{setEmail(u.email);setPassword(u.password);setError("");}} style={{display:"flex",alignItems:"center",gap:9,padding:"8px 10px",borderRadius:9,marginBottom:5,background:T.surface,border:`1.5px solid ${T.border}`,cursor:"pointer"}} onMouseOver={e=>e.currentTarget.style.borderColor=T.green} onMouseOut={e=>e.currentTarget.style.borderColor=T.border}>
                <div style={{width:30,height:30,borderRadius:8,background:u.color+"22",border:`1.5px solid ${u.color}44`,display:"flex",alignItems:"center",justifyContent:"center",fontSize:11,fontWeight:900,color:u.color}}>{u.avatar}</div>
                <div style={{flex:1}}><div style={{fontSize:12,fontWeight:800,color:T.text}}>{u.name}</div><div style={{fontSize:10,color:T.ts}}>{u.email}</div></div>
                <div style={{fontSize:10,color:T.green,fontWeight:700}}>tap →</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

// ── ROOT ───────────────────────────────────────────────────────────────────────
export default function App(){
  const [currentUser,setCurrentUser]=useState(null);
  const [customers,setCustomers]=useState(INIT);
  const [selectedId,setSelectedId]=useState(null);
  const [ownerTab,setOwnerTab]=useState("customers"); // "dashboard" | "customers"

  const isStaff=currentUser?.role==="staff";
  const isOwner=currentUser?.role==="owner";
  const selected=customers.find(c=>c.id===selectedId)||null;

  function handleUpdate(cId,ch){setCustomers(prev=>prev.map(c=>c.id===cId?{...c,...ch}:c));}
  if(!currentUser)return <LoginPage onLogin={setCurrentUser}/>;

  return(
    <div style={{height:"100vh",display:"flex",flexDirection:"column",fontFamily:"system-ui,-apple-system,sans-serif",color:T.text,background:T.bg,overflow:"hidden"}}>
      {/* Top bar */}
      <div style={{background:T.surface,borderBottom:`2px solid ${T.border}`,padding:"10px 16px",display:"flex",alignItems:"center",justifyContent:"space-between",flexShrink:0,boxShadow:"0 2px 8px rgba(0,0,0,0.05)"}}>
        <div style={{display:"flex",alignItems:"center",gap:8}}><div style={{width:30,height:30,background:T.green,borderRadius:8,display:"flex",alignItems:"center",justifyContent:"center",fontSize:15}}>✂️</div><span style={{fontWeight:900,fontSize:14}}>Snip<span style={{color:T.green}}>Book</span></span></div>
        <div style={{display:"flex",alignItems:"center",gap:6,background:isStaff?"#fef3c7":T.gl,border:`1.5px solid ${isStaff?"#fde68a":T.gm}`,borderRadius:20,padding:"4px 10px"}}><div style={{width:6,height:6,borderRadius:"50%",background:isStaff?"#f59e0b":T.green}}/><span style={{fontSize:11,fontWeight:800,color:isStaff?"#92400e":T.gd}}>{isStaff?"👨‍💼":"👑"} {currentUser.name}</span></div>
        <button onClick={()=>{setCurrentUser(null);setSelectedId(null);}} style={{background:"none",border:`1.5px solid ${T.border}`,borderRadius:8,padding:"5px 10px",fontSize:11,fontWeight:700,color:T.ts,cursor:"pointer",fontFamily:"inherit"}}>Logout</button>
      </div>

      {/* Owner tab switcher — Dashboard vs Customers */}
      {isOwner&&!selected&&(
        <div style={{background:T.surface,borderBottom:`2px solid ${T.border}`,display:"flex",flexShrink:0}}>
          {[{id:"dashboard",icon:"📊",label:"Dashboard"},{id:"customers",icon:"👥",label:"Customers"}].map(t=>(
            <div key={t.id} onClick={()=>setOwnerTab(t.id)} style={{flex:1,padding:"10px 4px",display:"flex",flexDirection:"column",alignItems:"center",gap:3,cursor:"pointer",borderBottom:`3px solid ${ownerTab===t.id?T.green:"transparent"}`,transition:"all 0.15s"}}>
              <span style={{fontSize:18}}>{t.icon}</span>
              <span style={{fontSize:11,fontWeight:800,color:ownerTab===t.id?T.green:T.tf}}>{t.label}</span>
            </div>
          ))}
        </div>
      )}

      {/* Content */}
      {selected
        ?<CustomerDetail customer={selected} isStaff={isStaff} currentUser={currentUser} onBack={()=>setSelectedId(null)} onUpdate={handleUpdate} allCustomers={customers}/>
        :isOwner&&ownerTab==="dashboard"
          ?<OwnerDashboard customers={customers}/>
          :<CustomerList customers={customers} isStaff={isStaff} onSelect={c=>setSelectedId(c.id)}/>
      }
    </div>
  );
}
