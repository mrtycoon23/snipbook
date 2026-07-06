import { useState, useEffect, useRef } from "react";
import { supabase } from "../lib/supabase";

const T = {
  bg:"#f4f2ff",surface:"#ffffff",border:"#e0d8ff",
  green:"#22c55e",gl:"#e8fdf0",gm:"#bbf7d0",gd:"#16a34a",
  text:"#1a0a4a",tm:"#4a3580",ts:"#9b8ec4",tf:"#c4b8f0",tg:"#e0d8ff",
  yellow:"#fef9c3",yb:"#fde68a",yt:"#a16207",
  blue:"#eff6ff",bb:"#93c5fd",bt:"#2563eb",
  red:"#fff0f0",rb:"#fca5a5",rt:"#dc2626",
  sub:"#f4f2ff",inp:"#fafbff",wa:"#25d366",
  purple:"#2d1b69",purpleLight:"#ede9fe",purpleMid:"#5b3fc4",
};
const BUCKET="visit photos";
const IS={width:"100%",padding:"11px 13px",border:`2px solid ${T.border}`,borderRadius:11,fontSize:14,fontFamily:"inherit",outline:"none",background:T.inp,boxSizing:"border-box",color:T.text};
const TAG={VIP:{bg:"#fef9c3",color:"#a16207",border:"#fde68a",label:"⭐ VIP"},Regular:{bg:T.purpleLight,color:T.purpleMid,border:"#c4b8f0",label:"Regular"},New:{bg:T.blue,color:T.bt,border:T.bb,label:"New"}};
const SERVICES=["Haircut","Haircut + Beard","Hair Colour","Facial + Cleanup","Bridal Makeup","Hair Spa","Manicure/Pedicure","Beard Trim","Blow Dry","Head Massage"];
const SLOTS=["9:00 AM","9:30 AM","10:00 AM","10:30 AM","11:00 AM","11:30 AM","12:00 PM","2:00 PM","2:30 PM","3:00 PM","3:30 PM","4:00 PM","4:30 PM","5:00 PM","5:30 PM","6:00 PM"];
const todayISO=new Date().toISOString().split("T")[0];

const CARD_COLORS=[
  {cardBg:"#ede9fe",cardColor:"#5b3fc4",avBg:"#c4b8f0",avColor:"#2d1b69"},
  {cardBg:"#fef9c3",cardColor:"#a16207",avBg:"#fde68a",avColor:"#a16207"},
  {cardBg:"#f0fdf4",cardColor:"#16a34a",avBg:"#bbf7d0",avColor:"#16a34a"},
  {cardBg:"#fff0f6",cardColor:"#db2777",avBg:"#fbcfe8",avColor:"#db2777"},
  {cardBg:"#eff6ff",cardColor:"#2563eb",avBg:"#bfdbfe",avColor:"#1d4ed8"},
  {cardBg:"#fff7ed",cardColor:"#ea580c",avBg:"#fed7aa",avColor:"#ea580c"},
  {cardBg:"#f0fdfa",cardColor:"#0d9488",avBg:"#99f6e4",avColor:"#0f766e"},
];

const Chip=({children,style={}})=><span style={{display:"inline-block",padding:"3px 10px",borderRadius:20,fontSize:11,fontWeight:700,background:T.purpleLight,color:T.purpleMid,border:`1.5px solid #c4b8f0`,...style}}>{children}</span>;
const SL=({children,style={}})=><div style={{fontSize:10,fontWeight:800,color:T.tf,letterSpacing:1.2,textTransform:"uppercase",marginBottom:10,...style}}>{children}</div>;
const StatBox=({icon,val,label,accent})=><div style={{background:T.surface,border:`2px solid ${T.border}`,borderRadius:14,padding:"12px 8px",textAlign:"center",flex:1}}><div style={{fontSize:18,marginBottom:4}}>{icon}</div><div style={{fontWeight:900,fontSize:15,color:accent||T.purple}}>{val}</div><div style={{fontSize:10,color:T.tf,fontWeight:700,marginTop:2}}>{label}</div></div>;
const EditBtn=({onEdit})=><button onClick={onEdit} style={{background:"none",border:`1.5px solid ${T.border}`,borderRadius:8,padding:"3px 10px",fontSize:11,fontWeight:700,color:T.ts,cursor:"pointer",fontFamily:"inherit"}}>✏️ Edit</button>;
const SCBar=({onSave,onCancel})=><div style={{display:"flex",gap:6}}><button onClick={onCancel} style={{background:"none",border:`1.5px solid ${T.border}`,borderRadius:8,padding:"3px 9px",fontSize:11,color:T.ts,cursor:"pointer",fontFamily:"inherit"}}>Cancel</button><button onClick={onSave} style={{background:T.purple,border:"none",borderRadius:8,padding:"3px 12px",fontSize:11,fontWeight:800,color:"#fff",cursor:"pointer",fontFamily:"inherit"}}>✓ Save</button></div>;

// ── Compact Page Header (same as App.jsx) ──────────────────────────────────────
function PageHeader({title,subtitle,rightBtn,onRightBtn}){
  return(
    <div style={{background:"#fff",padding:"12px 18px 10px",display:"flex",alignItems:"center",justifyContent:"space-between",borderBottom:`0.5px solid ${T.border}`,flexShrink:0}}>
      <div>
        <div style={{fontSize:16,fontWeight:800,color:T.text}}>{title}</div>
        {subtitle&&<div style={{fontSize:11,color:T.ts,marginTop:1}}>{subtitle}</div>}
      </div>
      {rightBtn&&<button onClick={onRightBtn} style={{background:T.purple,color:"#fff",border:"none",borderRadius:8,padding:"7px 14px",fontSize:11,fontWeight:700,cursor:"pointer",fontFamily:"inherit"}}>{rightBtn}</button>}
    </div>
  );
}

function BackHeader({title,subtitle,onBack,rightBtn,onRightBtn}){
  return(
    <div style={{background:"#fff",padding:"12px 18px 10px",display:"flex",alignItems:"center",justifyContent:"space-between",borderBottom:`0.5px solid ${T.border}`,flexShrink:0}}>
      <div style={{display:"flex",alignItems:"center",gap:10}}>
        <button onClick={onBack} style={{width:30,height:30,borderRadius:8,border:`0.5px solid ${T.border}`,background:T.sub,fontSize:14,cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",color:T.purpleMid,fontFamily:"inherit"}}>←</button>
        <div>
          <div style={{fontSize:15,fontWeight:800,color:T.text}}>{title}</div>
          {subtitle&&<div style={{fontSize:11,color:T.ts,marginTop:1}}>{subtitle}</div>}
        </div>
      </div>
      {rightBtn&&<button onClick={onRightBtn} style={{background:T.sub,color:T.purpleMid,border:`0.5px solid ${T.border}`,borderRadius:8,padding:"6px 12px",fontSize:11,fontWeight:700,cursor:"pointer",fontFamily:"inherit"}}>{rightBtn}</button>}
    </div>
  );
}

function getBirthdayStatus(dob){if(!dob)return null;const today=new Date();const bday=new Date(dob);bday.setFullYear(today.getFullYear());const diff=Math.ceil((bday-today)/(1000*60*60*24));if(diff===0)return{label:"🎂 Birthday Today!",color:T.rt,bg:T.red,border:T.rb};if(diff>0&&diff<=7)return{label:`🎂 Birthday in ${diff} day${diff>1?"s":""}`,color:T.yt,bg:T.yellow,border:T.yb};if(diff<0&&diff>=-3)return{label:"🎂 Birthday recently",color:T.ts,bg:T.sub,border:T.border};return null;}
function formatDateDisplay(isoDate){if(!isoDate)return "";const d=new Date(isoDate+"T00:00:00");return d.toLocaleDateString("en-IN",{day:"2-digit",month:"short",year:"numeric"});}
function daysSince(dateStr){if(!dateStr)return 0;const d=new Date(dateStr);if(isNaN(d))return 0;return Math.floor((new Date()-d)/(1000*60*60*24));}

function PhotoItem({photo,visitId,onRemove}){const[loading,setLoading]=useState(false);async function handleRemove(){if(photo?.path){setLoading(true);await supabase.storage.from(BUCKET).remove([photo.path]);setLoading(false);}onRemove();}return(<div style={{position:"relative",flexShrink:0,width:90,height:90}}><img src={photo.url} alt="visit" style={{width:90,height:90,borderRadius:12,objectFit:"cover",border:`2px solid ${T.border}`,display:"block"}}/>{loading?<div style={{position:"absolute",inset:0,background:"rgba(0,0,0,0.5)",borderRadius:12,display:"flex",alignItems:"center",justifyContent:"center"}}><div style={{fontSize:10,color:"white",fontWeight:800}}>...</div></div>:<button onClick={handleRemove} style={{position:"absolute",top:-6,left:-6,width:20,height:20,borderRadius:"50%",background:T.rt,border:"2px solid white",color:"white",fontSize:11,cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",fontWeight:900,zIndex:10,padding:0}}>✕</button>}</div>);}

function AddPhotoBtn({visitId,onAdd}){const fileRef=useRef();const[uploading,setUploading]=useState(false);async function handleFileChange(e){const file=e.target.files[0];if(!file)return;setUploading(true);try{const ext=file.name.split(".").pop()||"jpg";const path=`${visitId}/photo_${Date.now()}.${ext}`;const{error}=await supabase.storage.from(BUCKET).upload(path,file,{upsert:true});if(error){setUploading(false);return;}const{data:urlData}=supabase.storage.from(BUCKET).getPublicUrl(path);onAdd({url:urlData.publicUrl,path});}catch(err){}setUploading(false);e.target.value="";}return(<div style={{flexShrink:0}}><input ref={fileRef} type="file" accept="image/*" style={{display:"none"}} onChange={handleFileChange}/><div onClick={()=>!uploading&&fileRef.current?.click()} style={{width:90,height:90,borderRadius:12,cursor:uploading?"wait":"pointer",background:T.sub,border:`2px dashed ${T.border}`,display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",gap:4}}>{uploading?<div style={{fontSize:11,color:T.ts,fontWeight:700}}>Uploading...</div>:<><div style={{fontSize:28,color:T.purple,fontWeight:900,lineHeight:1}}>+</div><div style={{fontSize:10,color:T.ts,fontWeight:700}}>Add Photo</div></>}</div></div>);}

function WAPrompt({customer,visit,onSend,onSkip,salonName}){const[status,setStatus]=useState("idle");const photoCount=(visit.photos||[]).length;async function sendViaAPI(){if(!customer.phone){window.open(`https://wa.me/?text=${encodeURIComponent(`🙏 Namaste ${customer.name}!\n\n✂️ Visit Summary — ${visit.date}\n\nServices: ${(visit.services||[]).join(", ")}\n💰 ₹${visit.amount}\n\nThank you! 💈`)}`,"_blank");setTimeout(onSend,1500);return;}setStatus("sending");try{const res=await fetch("/api/send-summary",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({customerPhone:customer.phone,customerName:customer.name,salonName:salonName||"Our Salon",visit})});if(res.ok){setStatus("sent");setTimeout(onSend,2000);}else setStatus("error");}catch(e){setStatus("error");}}return(<div style={{position:"fixed",inset:0,background:"rgba(0,0,0,0.5)",zIndex:800,display:"flex",alignItems:"flex-end"}}><div style={{background:T.surface,borderRadius:"20px 20px 0 0",padding:"20px 18px 36px",width:"100%"}}><div style={{width:36,height:4,background:T.border,borderRadius:2,margin:"0 auto 16px"}}/><div style={{display:"flex",alignItems:"center",gap:12,marginBottom:14}}><div style={{width:44,height:44,borderRadius:14,background:T.purpleLight,display:"flex",alignItems:"center",justifyContent:"center",fontSize:22}}>💬</div><div><div style={{fontWeight:900,fontSize:15,color:T.text}}>Send Visit Summary?</div><div style={{fontSize:12,color:T.ts,marginTop:2}}>to {customer.name}</div></div></div><div style={{background:T.sub,border:`2px solid ${T.border}`,borderRadius:12,padding:12,marginBottom:14}}><div style={{fontSize:12,fontWeight:700,color:T.ts,marginBottom:6}}>📋 Summary includes:</div><div style={{fontSize:12,color:T.tm}}>✂️ {(visit.services||[]).join(", ")}</div><div style={{fontSize:12,color:T.tm}}>💰 ₹{visit.amount} · 📅 {visit.date}</div>{visit.notes&&<div style={{fontSize:12,color:T.tm}}>📝 {visit.notes}</div>}{photoCount>0&&<div style={{fontSize:12,color:T.purple,fontWeight:700,marginTop:4}}>📸 {photoCount} photo{photoCount>1?"s":""} will also be included!</div>}</div>{status==="idle"&&<div style={{display:"flex",gap:10}}><button onClick={onSkip} style={{flex:1,padding:12,border:`2px solid ${T.border}`,borderRadius:12,background:T.surface,fontFamily:"inherit",fontSize:13,fontWeight:700,cursor:"pointer",color:T.tm}}>Skip</button><button onClick={sendViaAPI} style={{flex:2,padding:12,background:T.wa,border:"none",borderRadius:12,color:"#fff",fontFamily:"inherit",fontSize:14,fontWeight:800,cursor:"pointer"}}>💬 Send on WhatsApp</button></div>}{status==="sending"&&<div style={{background:T.blue,border:`2px solid ${T.bb}`,borderRadius:12,padding:14,textAlign:"center",fontWeight:800,color:T.bt}}>📤 Sending...</div>}{status==="sent"&&<div style={{background:T.gl,border:`2px solid ${T.gm}`,borderRadius:12,padding:14,textAlign:"center",fontWeight:800,color:T.gd}}>✅ Summary sent!</div>}{status==="error"&&<div style={{display:"flex",flexDirection:"column",gap:8}}><div style={{background:T.red,border:`2px solid ${T.rb}`,borderRadius:12,padding:10,textAlign:"center",fontSize:12,color:T.rt,fontWeight:700}}>⚠️ Could not send</div><div style={{display:"flex",gap:10}}><button onClick={onSkip} style={{flex:1,padding:12,border:`2px solid ${T.border}`,borderRadius:12,background:T.surface,fontFamily:"inherit",fontSize:13,fontWeight:700,cursor:"pointer"}}>Close</button><button onClick={sendViaAPI} style={{flex:1,padding:12,background:T.wa,border:"none",borderRadius:12,color:"#fff",fontFamily:"inherit",fontSize:13,fontWeight:800,cursor:"pointer"}}>🔄 Retry</button></div></div>}</div></div>);}

function QuickAddModal({customer,staffName,onSave,onClose}){const[step,setStep]=useState(1);const[svc,setSvc]=useState("");const[amt,setAmt]=useState("");const[date,setDate]=useState(todayISO);function save(){if(!svc||!amt)return;const d=formatDateDisplay(date);onSave({date:d,services:[svc],stylist:staffName,amount:parseInt(amt)||0,notes:"",photos:[]});onClose();}return(<div onClick={onClose} style={{position:"fixed",inset:0,background:"rgba(0,0,0,0.45)",zIndex:700,display:"flex",alignItems:"flex-end"}}><div onClick={e=>e.stopPropagation()} style={{background:T.surface,borderRadius:"20px 20px 0 0",padding:"20px 18px 36px",width:"100%"}}><div style={{width:36,height:4,background:T.border,borderRadius:2,margin:"0 auto 14px"}}/><div style={{display:"flex",justifyContent:"center",gap:8,marginBottom:18}}>{[1,2,3].map(i=><div key={i} style={{width:i<=step?28:8,height:8,borderRadius:20,background:i<=step?T.purple:T.border,transition:"all 0.3s"}}/>)}</div>{step===1&&<><div style={{fontWeight:900,fontSize:16,marginBottom:4,color:T.text}}>⚡ Quick Add Visit</div><div style={{fontSize:12,color:T.ts,marginBottom:16}}>Step 1 of 3 — Pick service</div><div style={{display:"flex",flexDirection:"column",gap:7,marginBottom:20}}>{[...(customer.fav_services||customer.favServices||[]),...SERVICES.filter(s=>!(customer.fav_services||customer.favServices||[]).includes(s))].slice(0,8).map(s=>(<button key={s} onClick={()=>{setSvc(s);setStep(2);}} style={{padding:"13px 16px",borderRadius:12,border:`2px solid ${svc===s?T.purple:T.border}`,background:svc===s?T.purpleLight:T.surface,color:svc===s?T.purple:T.tm,fontSize:13,fontWeight:700,cursor:"pointer",fontFamily:"inherit",textAlign:"left"}}>{s}</button>))}</div><button onClick={onClose} style={{width:"100%",padding:12,border:`2px solid ${T.border}`,borderRadius:12,background:T.surface,fontFamily:"inherit",fontSize:13,fontWeight:700,cursor:"pointer",color:T.tm}}>Cancel</button></>}{step===2&&<><div style={{fontWeight:900,fontSize:16,marginBottom:4,color:T.text}}>⚡ Quick Add Visit</div><div style={{fontSize:12,color:T.ts,marginBottom:16}}>Step 2 of 3</div><div style={{background:T.purpleLight,border:`1.5px solid #c4b8f0`,borderRadius:10,padding:"10px 13px",marginBottom:16,fontSize:13,fontWeight:700,color:T.purple}}>✂️ {svc}</div><div style={{marginBottom:12}}><div style={{fontSize:12,fontWeight:700,color:T.tm,marginBottom:6}}>Amount (₹)</div><input type="number" value={amt} onChange={e=>setAmt(e.target.value)} placeholder="e.g. 450" autoFocus style={{...IS,fontSize:16,fontWeight:800}}/></div><div style={{marginBottom:20}}><div style={{fontSize:12,fontWeight:700,color:T.tm,marginBottom:6}}>Date</div><input type="date" value={date} onChange={e=>setDate(e.target.value)} style={IS}/></div><div style={{display:"flex",gap:10}}><button onClick={()=>setStep(1)} style={{flex:1,padding:12,border:`2px solid ${T.border}`,borderRadius:12,background:T.surface,fontFamily:"inherit",fontSize:13,fontWeight:700,cursor:"pointer",color:T.tm}}>← Back</button><button onClick={()=>{if(amt)setStep(3);}} style={{flex:2,padding:12,background:amt?T.purple:"#d1d5db",border:"none",borderRadius:12,color:"#fff",fontFamily:"inherit",fontSize:13,fontWeight:800,cursor:amt?"pointer":"not-allowed"}}>Next →</button></div></>}{step===3&&<><div style={{fontWeight:900,fontSize:16,marginBottom:4,color:T.text}}>⚡ Quick Add Visit</div><div style={{fontSize:12,color:T.ts,marginBottom:16}}>Step 3 of 3 — Confirm</div><div style={{background:T.sub,border:`2px solid ${T.border}`,borderRadius:14,padding:16,marginBottom:20}}><div style={{display:"flex",justifyContent:"space-between",marginBottom:10}}><div style={{fontSize:13,color:T.ts}}>Customer</div><div style={{fontSize:13,fontWeight:800,color:T.text}}>{customer.name}</div></div><div style={{display:"flex",justifyContent:"space-between",marginBottom:10}}><div style={{fontSize:13,color:T.ts}}>Service</div><div style={{fontSize:13,fontWeight:800,color:T.text}}>{svc}</div></div><div style={{display:"flex",justifyContent:"space-between",marginBottom:10}}><div style={{fontSize:13,color:T.ts}}>Date</div><div style={{fontSize:13,fontWeight:800,color:T.text}}>{formatDateDisplay(date)}</div></div><div style={{height:1,background:T.border,margin:"4px 0 10px"}}/><div style={{display:"flex",justifyContent:"space-between"}}><div style={{fontSize:14,fontWeight:800,color:T.text}}>Total</div><div style={{fontSize:18,fontWeight:900,color:T.purple}}>₹{amt}</div></div></div><div style={{display:"flex",gap:10}}><button onClick={()=>setStep(2)} style={{flex:1,padding:12,border:`2px solid ${T.border}`,borderRadius:12,background:T.surface,fontFamily:"inherit",fontSize:13,fontWeight:700,cursor:"pointer",color:T.tm}}>← Back</button><button onClick={save} style={{flex:2,padding:12,background:T.purple,border:"none",borderRadius:12,color:"#fff",fontFamily:"inherit",fontSize:14,fontWeight:800,cursor:"pointer"}}>✓ Save Visit</button></div></>}</div></div>);}

function BookModal({customer,onClose,onConfirm}){const today=new Date();const[selDate,setSelDate]=useState(today.toISOString().split("T")[0]);const[selSlot,setSelSlot]=useState("");const[selSvc,setSelSvc]=useState((customer.fav_services||customer.favServices||[])[0]||"");const[done,setDone]=useState(false);function confirm(){if(!selSlot||!selSvc)return;setDone(true);setTimeout(()=>onConfirm({customer,date:selDate,slot:selSlot,service:selSvc}),1500);}return(<div onClick={onClose} style={{position:"fixed",inset:0,background:"rgba(0,0,0,0.45)",zIndex:700,display:"flex",alignItems:"flex-end"}}><div onClick={e=>e.stopPropagation()} style={{background:T.surface,borderRadius:"20px 20px 0 0",padding:"20px 18px 36px",width:"100%",maxHeight:"90vh",overflowY:"auto"}}><div style={{width:36,height:4,background:T.border,borderRadius:2,margin:"0 auto 18px"}}/>{!done?<><div style={{fontWeight:900,fontSize:16,marginBottom:20,color:T.text}}>📅 Book Appointment</div><div style={{marginBottom:14}}><div style={{fontSize:13,fontWeight:800,color:T.tm,marginBottom:8}}>Service</div><div style={{display:"flex",flexWrap:"wrap",gap:6}}>{SERVICES.map(s=>{const a=selSvc===s;return <button key={s} onClick={()=>setSelSvc(s)} style={{padding:"7px 13px",borderRadius:20,border:`2px solid ${a?T.purple:T.border}`,background:a?T.purpleLight:T.surface,color:a?T.purple:T.tm,fontSize:12,fontWeight:700,cursor:"pointer",fontFamily:"inherit"}}>{a?"✓ ":""}{s}</button>;})}</div></div><div style={{marginBottom:14}}><div style={{fontSize:13,fontWeight:800,color:T.tm,marginBottom:8}}>Date</div><input type="date" value={selDate} onChange={e=>setSelDate(e.target.value)} style={IS}/></div><div style={{marginBottom:20}}><div style={{fontSize:13,fontWeight:800,color:T.tm,marginBottom:8}}>Time Slot</div><div style={{display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:7}}>{SLOTS.map(sl=>{const a=selSlot===sl;return <button key={sl} onClick={()=>setSelSlot(sl)} style={{padding:"8px 4px",borderRadius:10,border:`2px solid ${a?T.purple:T.border}`,background:a?T.purpleLight:T.surface,color:a?T.purple:T.tm,fontSize:11,fontWeight:700,cursor:"pointer",fontFamily:"inherit",textAlign:"center"}}>{sl}</button>;})}</div></div><div style={{display:"flex",gap:10}}><button onClick={onClose} style={{flex:1,padding:13,border:`2px solid ${T.border}`,borderRadius:12,background:T.surface,fontFamily:"inherit",fontSize:13,fontWeight:700,cursor:"pointer",color:T.tm}}>Cancel</button><button onClick={confirm} style={{flex:2,padding:13,background:selSlot&&selSvc?T.purple:"#d1d5db",border:"none",borderRadius:12,color:"#fff",fontFamily:"inherit",fontSize:14,fontWeight:800,cursor:selSlot&&selSvc?"pointer":"not-allowed"}}>✓ Confirm</button></div></>:<div style={{textAlign:"center",padding:"20px 0"}}><div style={{fontSize:48,marginBottom:12}}>🎉</div><div style={{fontWeight:900,fontSize:18,marginBottom:6,color:T.text}}>Booking Confirmed!</div></div>}</div></div>);}

function parseVisitDate(dateStr){if(!dateStr)return null;if(dateStr.includes("-")&&dateStr.length===10)return new Date(dateStr+"T00:00:00");const months={Jan:0,Feb:1,Mar:2,Apr:3,May:4,Jun:5,Jul:6,Aug:7,Sep:8,Oct:9,Nov:10,Dec:11};const parts=dateStr.split(" ");if(parts.length===3)return new Date(parseInt(parts[2]),months[parts[1]],parseInt(parts[0]));return null;}
function getDateRange(preset,customFrom,customTo){const now=new Date();const today=new Date(now.getFullYear(),now.getMonth(),now.getDate());if(preset==="today")return{from:today,to:today,label:"Today"};if(preset==="week"){const from=new Date(today);from.setDate(today.getDate()-today.getDay());return{from,to:today,label:"This Week"};}if(preset==="month"){const from=new Date(today.getFullYear(),today.getMonth(),1);return{from,to:today,label:"This Month"};}if(preset==="quarter"){const from=new Date(today.getFullYear(),today.getMonth()-2,1);return{from,to:today,label:"Last 3 Months"};}if(preset==="year"){const from=new Date(today.getFullYear(),0,1);return{from,to:today,label:"This Year"};}if(preset==="all")return{from:new Date(2020,0,1),to:today,label:"All Time"};if(preset==="custom"&&customFrom&&customTo)return{from:new Date(customFrom+"T00:00:00"),to:new Date(customTo+"T00:00:00"),label:`${customFrom} → ${customTo}`};return{from:new Date(2020,0,1),to:today,label:"All Time"};}

function AllVisitsModal({visits,staffMap,label,onClose}){
  const sorted=[...visits].sort((a,b)=>{
    const da=parseVisitDate(a.date),db=parseVisitDate(b.date);
    if(!da||!db)return 0;
    return db-da;
  });
  const total=sorted.reduce((s,v)=>s+(v.amount||0),0);
  return(
    <div onClick={e=>e.target===e.currentTarget&&onClose()} style={{position:"fixed",inset:0,background:"rgba(0,0,0,0.5)",zIndex:900,display:"flex",alignItems:"flex-end"}}>
      <div style={{background:"#fff",borderRadius:"20px 20px 0 0",width:"100%",maxHeight:"85vh",display:"flex",flexDirection:"column"}}>
        <div style={{padding:"16px 18px 12px",borderBottom:`0.5px solid ${T.border}`,flexShrink:0}}>
          <div style={{width:36,height:4,background:T.border,borderRadius:2,margin:"0 auto 14px"}}/>
          <div style={{display:"flex",alignItems:"center",justifyContent:"space-between"}}>
            <div>
              <div style={{fontWeight:900,fontSize:16,color:T.text}}>All Services</div>
              <div style={{fontSize:11,color:T.ts,marginTop:2}}>{label} · {sorted.length} entries · ₹{total.toLocaleString("en-IN")}</div>
            </div>
            <button onClick={onClose} style={{background:T.sub,border:"none",borderRadius:8,padding:"6px 10px",fontSize:13,cursor:"pointer",color:T.tm,fontWeight:700}}>✕</button>
          </div>
        </div>
        <div style={{flex:1,overflowY:"auto",padding:"6px 18px 24px"}}>
          {sorted.length===0
            ?<div style={{textAlign:"center",color:T.tf,padding:"32px 0",fontSize:13}}>No entries for this period</div>
            :sorted.map((v,i)=>(
              <div key={v.id||i} style={{display:"flex",alignItems:"center",gap:10,padding:"11px 0",borderBottom:`1px solid ${T.bg}`}}>
                <div style={{width:36,height:36,borderRadius:10,background:T.purpleLight,display:"flex",alignItems:"center",justifyContent:"center",fontSize:14,flexShrink:0,fontWeight:800,color:T.purpleMid}}>{(v.customerName||"?").slice(0,2).toUpperCase()}</div>
                <div style={{flex:1,minWidth:0}}>
                  <div style={{fontSize:13,fontWeight:700,color:T.text}}>{v.customerName}</div>
                  <div style={{fontSize:11,color:"#6b7280",marginTop:1}}>{(v.services||[]).join(", ")} · {v.date}</div>
                  <div style={{fontSize:11,color:T.purpleMid,marginTop:1,fontWeight:600}}>👤 {staffMap?.[v.stylist]||v.stylist||"—"}</div>
                </div>
                <div style={{fontSize:13,fontWeight:800,color:T.gd,flexShrink:0}}>₹{(v.amount||0).toLocaleString("en-IN")}</div>
              </div>
            ))
          }
        </div>
      </div>
    </div>
  );
}

function OwnerDashboard({customers,staffMap}){
  const[preset,setPreset]=useState("month");const[customFrom,setCustomFrom]=useState("");const[customTo,setCustomTo]=useState("");const[appliedFrom,setAppliedFrom]=useState("");const[appliedTo,setAppliedTo]=useState("");const[showCustom,setShowCustom]=useState(false);
  const[showAllVisits,setShowAllVisits]=useState(false);
  const{from,to,label}=getDateRange(preset,appliedFrom,appliedTo);const canApply=customFrom&&customTo&&customFrom<=customTo;
  function visitsInRange(customer){return(customer.visitHistory||[]).filter(v=>{const d=parseVisitDate(v.date);if(!d)return false;return d>=from&&d<=new Date(to.getFullYear(),to.getMonth(),to.getDate(),23,59,59);});}
  const filteredVisits=customers.flatMap(c=>visitsInRange(c).map(v=>({...v,customerName:c.name})));
  const totalRevenue=filteredVisits.reduce((s,v)=>s+v.amount,0);const totalVisits=filteredVisits.length;const uniqueCustomers=new Set(filteredVisits.map(v=>v.customerName)).size;const avgTicket=totalVisits?Math.round(totalRevenue/totalVisits):0;
  const svcCount={};filteredVisits.forEach(v=>(v.services||[]).forEach(s=>{svcCount[s]=(svcCount[s]||0)+1;}));const topServices=Object.entries(svcCount).sort((a,b)=>b[1]-a[1]).slice(0,5);
  const birthdays=customers.filter(c=>getBirthdayStatus(c.dob));
  const customerRevenue={};customers.forEach(c=>{const rev=visitsInRange(c).reduce((s,v)=>s+v.amount,0);if(rev>0)customerRevenue[c.name]={rev,avatar:c.avatar||(c.name?.slice(0,2)||"??"),color:c.color||T.purple};});
  const topCustomers=Object.entries(customerRevenue).sort((a,b)=>b[1].rev-a[1].rev).slice(0,5);
  const PRESETS=[{id:"today",label:"Today"},{id:"week",label:"Week"},{id:"month",label:"Month"},{id:"quarter",label:"3 Months"},{id:"year",label:"Year"},{id:"all",label:"All Time"},{id:"custom",label:"Custom 📅"}];
  const N={purple:"#2d1b69",mid:"#5b3fc4",light:"#ede9fe",bg:"#f8f7ff",white:"#fff",text:"#0f0a2e",muted:"#6b7280",border:"#e5e7eb",green:"#16a34a"};
  return(
    <div style={{flex:1,overflowY:"auto",padding:"0 0 80px",background:N.bg}}>
      {/* Filter bar — clean date range only */}
      <div style={{background:N.white,borderBottom:`1px solid ${N.border}`,padding:"12px 16px",flexShrink:0}}>
        <div style={{display:"flex",alignItems:"center",gap:8}}>
          <div style={{flex:1,display:"flex",alignItems:"center",gap:6,background:"#f8f7ff",border:`1px solid #ddd6fe`,borderRadius:10,padding:"8px 12px",cursor:"pointer"}} onClick={()=>setShowCustom(!showCustom)}>
            <span style={{fontSize:14}}>📅</span>
            <span style={{fontSize:13,fontWeight:600,color:"#5b3fc4",flex:1}}>{label}</span>
            <span style={{fontSize:11,color:"#9b8ec4"}}>▾</span>
          </div>

        </div>
        {showCustom&&(
          <div style={{marginTop:10}}>
            <div style={{display:"flex",gap:8,alignItems:"center",marginBottom:8}}>
              <input type="date" value={customFrom} onChange={e=>setCustomFrom(e.target.value)}
                style={{flex:1,padding:"9px 12px",border:`1px solid ${N.border}`,borderRadius:10,fontSize:13,fontFamily:"inherit",outline:"none",background:N.white,color:N.text}}/>
              <span style={{color:N.muted,fontSize:14,fontWeight:500}}>→</span>
              <input type="date" value={customTo} onChange={e=>setCustomTo(e.target.value)}
                style={{flex:1,padding:"9px 12px",border:`1px solid ${N.border}`,borderRadius:10,fontSize:13,fontFamily:"inherit",outline:"none",background:N.white,color:N.text}}/>
            </div>
            <button onClick={()=>{if(canApply){setAppliedFrom(customFrom);setAppliedTo(customTo);setPreset("custom");setShowCustom(false);}}}
              style={{width:"100%",padding:"10px",background:canApply?"#5b3fc4":"#d1d5db",border:"none",borderRadius:10,color:"#fff",fontFamily:"inherit",fontSize:13,fontWeight:700,cursor:canApply?"pointer":"not-allowed"}}>
              {canApply?"✓ Apply Range":"Select both dates"}
            </button>
          </div>
        )}
      </div>

      {/* Revenue hero card */}
      <div style={{margin:"12px 16px 0",background:"linear-gradient(135deg,#3d2490,#5b3fc4)",borderRadius:20,padding:"18px",position:"relative",overflow:"hidden"}}>
        <div style={{position:"absolute",right:-10,top:-10,width:100,height:100,borderRadius:"50%",background:"rgba(255,255,255,0.08)"}}/>
        <div style={{fontSize:12,color:"rgba(255,255,255,0.6)",marginBottom:4,fontWeight:500}}>Total Revenue</div>
        <div style={{fontSize:32,fontWeight:800,color:"#fff",letterSpacing:"-0.5px",marginBottom:4}}>
          ₹{totalRevenue>=1000?(totalRevenue/1000).toFixed(1)+"k":totalRevenue.toLocaleString()}
        </div>
      </div>

      {/* 4 stat cards */}
      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10,margin:"12px 16px 0"}}>
        {[
          {icon:"💰",val:totalRevenue>=1000?`₹${(totalRevenue/1000).toFixed(1)}k`:`₹${totalRevenue}`,label:"Revenue",color:"#5b3fc4",bg:"#f0eeff",ibg:"#ede9fe"},
          {icon:"✂️",val:totalVisits,label:"Total Visits",color:"#dc2626",bg:"#fff5f5",ibg:"#fee2e2"},
          {icon:"👥",val:uniqueCustomers,label:"Customers",color:"#2563eb",bg:"#eff6ff",ibg:"#dbeafe"},
          {icon:"📊",val:`₹${avgTicket}`,label:"Avg. Ticket Size",color:"#d97706",bg:"#fffbeb",ibg:"#fef3c7"},
        ].map(s=>(
          <div key={s.label} style={{background:N.white,borderRadius:14,padding:"14px",border:`1px solid ${N.border}`,display:"flex",alignItems:"center",gap:10}}>
            <div style={{width:40,height:40,borderRadius:12,background:s.ibg,display:"flex",alignItems:"center",justifyContent:"center",fontSize:18,flexShrink:0}}>{s.icon}</div>
            <div style={{flex:1,minWidth:0}}>
              <div style={{fontSize:18,fontWeight:800,color:s.color,lineHeight:1}}>{s.val}</div>
              <div style={{fontSize:10,color:N.muted,marginTop:3,fontWeight:500}}>{s.label}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Top Services */}
      {topServices.length>0&&(
        <div style={{background:N.white,borderRadius:14,margin:"12px 16px 0",border:`1px solid ${N.border}`,padding:"14px"}}>
          <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:14}}>
            <div style={{fontSize:14,fontWeight:800,color:N.text,letterSpacing:"-0.2px"}}>Top Services</div>
            <div onClick={()=>setShowAllVisits(true)} style={{fontSize:12,color:N.mid,fontWeight:600,cursor:"pointer"}}>View All</div>
          </div>
          {topServices.map(([svc,count],i)=>(
            <div key={svc} style={{display:"flex",alignItems:"center",gap:12,marginBottom:i<topServices.length-1?14:0}}>
              <div style={{width:36,height:36,borderRadius:10,background:i===0?"#ede9fe":i===1?"#fee2e2":"#eff6ff",display:"flex",alignItems:"center",justifyContent:"center",fontSize:16,flexShrink:0}}>
                {i===0?"💰":i===1?"✂️":"👤"}
              </div>
              <div style={{flex:1}}>
                <div style={{display:"flex",justifyContent:"space-between",marginBottom:5}}>
                  <span style={{fontSize:13,fontWeight:600,color:N.text}}>{svc}</span>
                  <span style={{fontSize:11,color:N.muted}}>{Math.round((count/totalVisits)*100)||0}%</span>
                </div>
                <div style={{height:5,borderRadius:20,background:"#f1f0f5",overflow:"hidden"}}>
                  <div style={{width:`${(count/topServices[0][1])*100}%`,height:"100%",background:i===0?"#5b3fc4":i===1?"#dc2626":"#2563eb",borderRadius:20}}/>
                </div>
              </div>
              <div style={{fontSize:13,fontWeight:800,color:N.text,flexShrink:0}}>{count}</div>
            </div>
          ))}
        </div>
      )}

      {totalVisits===0&&(
        <div style={{background:N.white,border:`1px dashed ${N.border}`,borderRadius:14,padding:"32px",textAlign:"center",margin:"12px 16px 0"}}>
          <div style={{fontSize:32,marginBottom:8}}>📭</div>
          <div style={{fontWeight:700,fontSize:14,color:N.muted}}>No visits in this period</div>
        </div>
      )}
      {showAllVisits&&<AllVisitsModal visits={filteredVisits} staffMap={staffMap} label={label} onClose={()=>setShowAllVisits(false)}/>}
    </div>
  );
}

function VisitCard({visit,index,isStaff,onUpdate,onWA}){
  const[open,setOpen]=useState(false);const[eN,setEN]=useState(false);const[nV,setNV]=useState(visit.notes||"");const[eA,setEA]=useState(false);const[aV,setAV]=useState(String(visit.amount));const isFirst=index===0;const photos=visit.photos||[];
  async function sN(){onUpdate(visit.id,{notes:nV});setEN(false);await supabase.from("visit_history").update({notes:nV}).eq("id",visit.id);}
  async function sA(){const newAmt=parseInt(aV)||0;onUpdate(visit.id,{amount:newAmt});setEA(false);await supabase.from("visit_history").update({amount:newAmt}).eq("id",visit.id);}
  async function addPhoto(newPhoto){const newPhotos=[...photos,newPhoto];onUpdate(visit.id,{photos:newPhotos});await supabase.from("visit_history").update({photos:newPhotos}).eq("id",visit.id);}
  async function removePhoto(i){const newPhotos=photos.filter((_,idx)=>idx!==i);onUpdate(visit.id,{photos:newPhotos});await supabase.from("visit_history").update({photos:newPhotos}).eq("id",visit.id);}
  return(<div style={{display:"flex",gap:0,marginBottom:0}}><div style={{display:"flex",flexDirection:"column",alignItems:"center",width:36,flexShrink:0}}><div style={{width:26,height:26,borderRadius:"50%",flexShrink:0,zIndex:1,background:isFirst?T.purple:T.purpleLight,border:`2px solid ${isFirst?T.purple:T.border}`,display:"flex",alignItems:"center",justifyContent:"center",fontSize:10,fontWeight:900,color:isFirst?"#fff":T.purpleMid}}>{index+1}</div><div style={{width:2,flex:1,minHeight:16,background:T.border,margin:"4px 0"}}/></div><div style={{flex:1,background:"#fff",border:`0.5px solid ${open?T.purple:T.border}`,borderRadius:14,overflow:"hidden",marginBottom:10}}><div onClick={()=>setOpen(o=>!o)} style={{padding:"12px 13px",cursor:"pointer",userSelect:"none",display:"flex",alignItems:"center",justifyContent:"space-between",background:open?T.sub:"#fff"}}><div><div style={{fontWeight:800,fontSize:13,color:T.text}}>{visit.date}</div><div style={{fontSize:11,color:T.ts,marginTop:2}}>{(visit.services||[]).join(" + ")} · {visit.stylist}</div></div><div style={{display:"flex",alignItems:"center",gap:8}}>{photos.length>0&&<div style={{fontSize:11,color:T.ts}}>📸{photos.length}</div>}<div style={{background:T.purpleLight,color:T.purple,border:`1.5px solid #c4b8f0`,padding:"3px 10px",borderRadius:20,fontSize:12,fontWeight:800}}>₹{visit.amount}</div><div style={{color:T.tg,fontSize:11}}>{open?"▲":"▼"}</div></div></div>{open&&<div style={{padding:"14px 13px"}}><div style={{marginBottom:12}}><SL>Services</SL><div style={{display:"flex",flexWrap:"wrap",gap:6}}>{(visit.services||[]).map(s=><Chip key={s}>{s}</Chip>)}</div></div>{isStaff&&<div style={{background:T.sub,border:`1.5px solid ${eA?T.purple:T.border}`,borderRadius:11,padding:"11px 12px",marginBottom:12}}><div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:8}}><SL>💰 Bill Amount</SL>{!eA?<EditBtn onEdit={()=>setEA(true)}/>:<SCBar onSave={sA} onCancel={()=>{setAV(String(visit.amount));setEA(false);}}/>}</div>{eA?<input type="number" value={aV} onChange={e=>setAV(e.target.value)} style={IS} autoFocus/>:<div style={{fontWeight:900,fontSize:17,color:T.purple}}>₹{visit.amount}</div>}</div>}<div style={{background:eN?T.purpleLight:T.sub,borderRadius:11,border:`1.5px solid ${eN?T.purple:T.border}`,padding:"11px 12px",marginBottom:12}}><div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:8}}><SL>📝 Stylist Notes</SL>{!eN?<EditBtn onEdit={()=>{setNV(visit.notes||"");setEN(true);}}/>:<SCBar onSave={sN} onCancel={()=>{setNV(visit.notes||"");setEN(false);}}/>}</div>{!eN?<div style={{fontSize:13,lineHeight:1.65,color:visit.notes?T.tm:T.tg,fontStyle:visit.notes?"normal":"italic"}}>{visit.notes||"No notes yet — tap Edit to add"}</div>:<textarea value={nV} onChange={e=>setNV(e.target.value)} rows={3} style={{...IS,resize:"vertical",lineHeight:1.65,borderColor:T.purple,background:T.surface,fontSize:13,padding:"10px 12px"}} autoFocus/>}</div><div style={{marginBottom:12}}><SL>📸 Visit Photos ({photos.length})</SL><div style={{display:"flex",gap:10,flexWrap:"wrap",alignItems:"flex-start"}}>{photos.map((ph,i)=>(<PhotoItem key={i} photo={ph} visitId={visit.id} onRemove={()=>removePhoto(i)}/>))}<AddPhotoBtn visitId={visit.id} onAdd={addPhoto}/></div></div><button onClick={()=>onWA(visit)} style={{width:"100%",padding:11,background:T.wa,border:"none",borderRadius:11,color:"#fff",fontFamily:"inherit",fontSize:13,fontWeight:800,cursor:"pointer"}}>💬 Send Visit Summary on WhatsApp</button></div>}</div></div>);}

function FullAddModal({staffName,onSave,onClose}){const[step,setStep]=useState(1);const[form,setForm]=useState({services:[],amount:"",notes:"",date:todayISO});function toggleSvc(s){setForm(f=>({...f,services:f.services.includes(s)?f.services.filter(x=>x!==s):[...f.services,s]}));}function save(){if(!form.services.length||!form.amount)return;const d=formatDateDisplay(form.date);onSave({date:d,services:form.services,stylist:staffName,amount:parseInt(form.amount)||0,notes:form.notes,photos:[]});onClose();}return(<div onClick={onClose} style={{position:"fixed",inset:0,background:"rgba(0,0,0,0.45)",zIndex:700,display:"flex",alignItems:"flex-end"}}><div onClick={e=>e.stopPropagation()} style={{background:T.surface,borderRadius:"20px 20px 0 0",padding:"20px 18px 36px",width:"100%",maxHeight:"90vh",overflowY:"auto"}}><div style={{width:36,height:4,background:T.border,borderRadius:2,margin:"0 auto 16px"}}/><div style={{fontWeight:900,fontSize:16,marginBottom:4,color:T.text}}>➕ Add Detailed Visit</div><div style={{fontSize:12,color:T.ts,marginBottom:18}}>Staff: {staffName}</div>{step===1&&<><SL>Select Services</SL><div style={{display:"flex",flexWrap:"wrap",gap:8,marginBottom:20}}>{SERVICES.map(s=>{const a=form.services.includes(s);return <button key={s} onClick={()=>toggleSvc(s)} style={{padding:"8px 14px",borderRadius:20,border:`2px solid ${a?T.purple:T.border}`,background:a?T.purpleLight:T.surface,color:a?T.purple:T.tm,fontSize:12,fontWeight:700,cursor:"pointer",fontFamily:"inherit"}}>{a?"✓ ":""}{s}</button>;})}</div><div style={{display:"flex",gap:10}}><button onClick={onClose} style={{flex:1,padding:12,border:`2px solid ${T.border}`,borderRadius:12,background:T.surface,fontFamily:"inherit",fontSize:13,fontWeight:700,cursor:"pointer",color:T.tm}}>Cancel</button><button onClick={()=>{if(form.services.length)setStep(2);}} style={{flex:2,padding:12,background:form.services.length?T.purple:"#d1d5db",border:"none",borderRadius:12,color:"#fff",fontFamily:"inherit",fontSize:13,fontWeight:800,cursor:form.services.length?"pointer":"not-allowed"}}>Next →</button></div></>}{step===2&&<><div style={{display:"flex",flexWrap:"wrap",gap:6,marginBottom:14}}>{form.services.map(s=><Chip key={s}>{s}</Chip>)}</div><div style={{marginBottom:13}}><div style={{fontSize:13,fontWeight:800,color:T.tm,marginBottom:5}}>Bill Amount (₹) *</div><input type="number" value={form.amount} onChange={e=>setForm(f=>({...f,amount:e.target.value}))} placeholder="e.g. 450" style={IS}/></div><div style={{marginBottom:13}}><div style={{fontSize:13,fontWeight:800,color:T.tm,marginBottom:5}}>Date *</div><input type="date" value={form.date} onChange={e=>setForm(f=>({...f,date:e.target.value}))} style={IS}/></div><div style={{marginBottom:20}}><div style={{fontSize:13,fontWeight:800,color:T.tm,marginBottom:5}}>Notes</div><textarea value={form.notes} onChange={e=>setForm(f=>({...f,notes:e.target.value}))} rows={3} style={{...IS,resize:"vertical",lineHeight:1.6,fontSize:13,padding:"10px 12px"}}/></div><div style={{display:"flex",gap:10}}><button onClick={()=>setStep(1)} style={{flex:1,padding:12,border:`2px solid ${T.border}`,borderRadius:12,background:T.surface,fontFamily:"inherit",fontSize:13,fontWeight:700,cursor:"pointer",color:T.tm}}>← Back</button><button onClick={save} style={{flex:2,padding:12,background:form.services.length&&form.amount?T.purple:"#d1d5db",border:"none",borderRadius:12,color:"#fff",fontFamily:"inherit",fontSize:13,fontWeight:800,cursor:form.services.length&&form.amount?"pointer":"not-allowed"}}>✓ Save Visit</button></div></>}</div></div>);}

function CustomerDetail({customer,isStaff,currentUser,onBack,onUpdate}){
  const[tab,setTab]=useState("overview");const[waVisit,setWaVisit]=useState(null);const[waPrompt,setWaPrompt]=useState(null);const[showQuick,setShowQuick]=useState(false);const[showFull,setShowFull]=useState(false);const[bookModal,setBookModal]=useState(false);const[bookDone,setBookDone]=useState(null);const[editEmail,setEditEmail]=useState(false);const[emailVal,setEmailVal]=useState(customer.email||"");
  const avg=(customer.visitHistory||[]).length?Math.round((customer.totalSpent||0)/(customer.visitHistory||[]).length):0;const tag=TAG[customer.tag]||TAG.Regular;const bday=getBirthdayStatus(customer.dob);
  function hvUpdate(visitId,changes){onUpdate(customer.id,{visitHistory:(customer.visitHistory||[]).map(v=>v.id===visitId?{...v,...changes}:v)});}
  async function saveEmail(){onUpdate(customer.id,{email:emailVal});setEditEmail(false);await supabase.from("customers").update({email:emailVal}).eq("id",customer.id);}
  async function addVisit(nv){const{data:res}=await supabase.from("visit_history").insert({salon_id:currentUser?.salon_id||currentUser?.id,customer_id:customer.id,date:nv.date,services:nv.services,stylist:nv.stylist,amount:nv.amount,notes:nv.notes,photos:[]}).select().single();const newVisit=res?{...nv,id:res.id,photos:[]}:{...nv,id:"v"+Date.now(),photos:[]};onUpdate(customer.id,{visitHistory:[newVisit,...(customer.visitHistory||[])],visits:(customer.visits||0)+1,totalSpent:(customer.totalSpent||0)+nv.amount,lastVisit:nv.date});setWaPrompt(newVisit);}
  const TABS=[{id:"overview",label:"Overview",icon:"📋"},{id:"visits",label:"Visits",icon:"📅"},{id:"photos",label:"Photos",icon:"📸"}];
  return(
    <div style={{flex:1,display:"flex",flexDirection:"column",overflow:"hidden",background:T.bg}}>
      {/* Compact header */}
      <div style={{background:"#fff",flexShrink:0}}>
        <div style={{padding:"12px 16px 10px",display:"flex",alignItems:"center",justifyContent:"space-between",borderBottom:`0.5px solid ${T.border}`}}>
          <div style={{display:"flex",alignItems:"center",gap:10}}>
            <button onClick={onBack} style={{width:30,height:30,borderRadius:8,border:`0.5px solid ${T.border}`,background:T.sub,cursor:"pointer",fontSize:14,color:T.purpleMid,display:"flex",alignItems:"center",justifyContent:"center"}}>←</button>
            <div style={{width:36,height:36,borderRadius:10,background:T.purpleLight,display:"flex",alignItems:"center",justifyContent:"center",fontSize:13,fontWeight:800,color:T.purpleMid,flexShrink:0}}>{customer.avatar||(customer.name?.slice(0,2)||"??").toUpperCase()}</div>
            <div>
              <div style={{display:"flex",alignItems:"center",gap:6}}><div style={{fontWeight:800,fontSize:14,color:T.text}}>{customer.name}</div><div style={{background:tag.bg,color:tag.color,border:`1px solid ${tag.border}`,fontSize:9,fontWeight:800,padding:"2px 7px",borderRadius:20}}>{tag.label}</div>{bday&&<span style={{fontSize:12}}>🎂</span>}</div>
              {!isStaff&&<div style={{fontSize:11,color:T.ts}}>📱 {customer.phone}</div>}
            </div>
          </div>
        </div>
        <div style={{display:"flex",borderBottom:`0.5px solid ${T.border}`}}>{TABS.map(t=><div key={t.id} onClick={()=>setTab(t.id)} style={{flex:1,padding:"9px 4px",display:"flex",flexDirection:"column",alignItems:"center",gap:2,cursor:"pointer",borderBottom:`2px solid ${tab===t.id?T.purpleMid:"transparent"}`,background:tab===t.id?T.purpleLight:"transparent"}}><span style={{fontSize:15}}>{t.icon}</span><span style={{fontSize:10,fontWeight:800,color:tab===t.id?T.purpleMid:T.tf}}>{t.label}</span></div>)}</div>
      </div>
      <div style={{flex:1,overflowY:"auto",padding:"14px 14px 80px",background:T.bg}}>
        {bday&&<div style={{background:bday.bg,border:`1.5px solid ${bday.border}`,borderRadius:11,padding:"11px 13px",marginBottom:12,display:"flex",alignItems:"center",justifyContent:"space-between"}}><div style={{fontSize:13,fontWeight:800,color:bday.color}}>{bday.label}</div><a href={`https://wa.me/${customer.phone}?text=${encodeURIComponent(`🎂 Happy Birthday ${customer.name}! 🎉`)}`} target="_blank" rel="noreferrer" style={{padding:"5px 11px",background:T.wa,borderRadius:20,color:"#fff",fontSize:11,fontWeight:800,textDecoration:"none"}}>💬 Wish Now</a></div>}
        {bookDone&&<div style={{background:T.purpleLight,border:`1.5px solid #c4b8f0`,borderRadius:11,padding:"11px 13px",marginBottom:12,display:"flex",alignItems:"center",gap:10}}><span style={{fontSize:18}}>🎉</span><div><div style={{fontWeight:800,fontSize:13,color:T.purple}}>Booking Confirmed!</div><div style={{fontSize:12,color:T.purpleMid,marginTop:2}}>{bookDone.service} · {bookDone.date} · {bookDone.slot}</div></div></div>}
        {tab==="overview"&&<>
          <div style={{marginBottom:14}}><SL>Stats</SL><div style={{display:"flex",gap:8}}><StatBox icon="✂️" val={customer.visits||0} label="Visits"/>{!isStaff&&<StatBox icon="💸" val={`₹${((customer.totalSpent||0)/1000).toFixed(1)}k`} label="Spent"/>}{!isStaff&&<StatBox icon="📊" val={`₹${avg}`} label="Avg"/>}<StatBox icon="🔥" val={`${Math.min(customer.visits||0,6)}×`} label="Streak"/></div></div>
          <div style={{background:"#fff",border:`0.5px solid ${editEmail?T.purple:T.border}`,borderRadius:12,padding:12,marginBottom:12}}><div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:8}}><SL>📧 Email</SL>{!editEmail?<EditBtn onEdit={()=>{setEmailVal(customer.email||"");setEditEmail(true);}}/>:<SCBar onSave={saveEmail} onCancel={()=>{setEmailVal(customer.email||"");setEditEmail(false);}}/>}</div>{editEmail?<input type="email" value={emailVal} onChange={e=>setEmailVal(e.target.value)} placeholder="customer@gmail.com" style={IS} autoFocus/>:<div style={{fontSize:13,color:customer.email?T.tm:T.tg,fontStyle:customer.email?"normal":"italic"}}>{customer.email||"No email added"}</div>}</div>
          <div style={{background:"#fff",border:`0.5px solid ${T.border}`,borderRadius:12,padding:12,marginBottom:12}}><SL>⭐ Favourite Services</SL><div style={{display:"flex",flexWrap:"wrap",gap:6}}>{(customer.fav_services||customer.favServices||[]).map((s,i)=><Chip key={s} style={i===0?{background:T.purple,color:"#fff",border:`1.5px solid ${T.purple}`}:{}}>{i===0?"🏆 ":""}{s}</Chip>)}</div></div>
          <div style={{display:"flex",gap:10}}><button onClick={()=>setBookModal(true)} style={{flex:1,padding:12,background:T.purple,border:"none",borderRadius:12,color:"#fff",fontFamily:"inherit",fontSize:13,fontWeight:800,cursor:"pointer"}}>📅 Book</button></div>
        </>}
        {tab==="visits"&&<>
          <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:12}}><SL>Timeline — {(customer.visitHistory||[]).length} visits</SL><div style={{display:"flex",gap:6}}><button onClick={()=>setShowQuick(true)} style={{background:T.purpleLight,border:`1px solid #c4b8f0`,borderRadius:20,padding:"5px 11px",color:T.purple,fontFamily:"inherit",fontSize:11,fontWeight:800,cursor:"pointer"}}>⚡ Quick</button><button onClick={()=>setShowFull(true)} style={{background:T.purple,border:"none",borderRadius:20,padding:"5px 11px",color:"#fff",fontFamily:"inherit",fontSize:11,fontWeight:800,cursor:"pointer"}}>➕ Detailed</button></div></div>
          {(customer.visitHistory||[]).length===0?<div style={{background:"#fff",border:`0.5px dashed ${T.border}`,borderRadius:12,padding:32,textAlign:"center",color:T.tf}}>No visits recorded yet</div>:(customer.visitHistory||[]).map((v,i)=><VisitCard key={v.id} visit={v} index={i} isStaff={isStaff} onUpdate={hvUpdate} onWA={setWaVisit}/>)}
        </>}
        {tab==="photos"&&<>
          <SL>All Photos</SL>
          {(customer.visitHistory||[]).every(v=>!(v.photos||[]).length)?<div style={{background:"#fff",border:`0.5px dashed ${T.border}`,borderRadius:12,padding:32,textAlign:"center",color:T.tf}}>No photos yet.</div>:(customer.visitHistory||[]).map(v=>{if(!(v.photos||[]).length)return null;return(<div key={v.id} style={{marginBottom:16}}><div style={{fontSize:12,fontWeight:800,color:T.ts,marginBottom:8,display:"flex",justifyContent:"space-between"}}><span>{v.date}</span><span style={{color:T.tf}}>{(v.services||[]).join(" + ")}</span></div><div style={{display:"flex",gap:10,flexWrap:"wrap"}}>{(v.photos||[]).map((ph,i)=>(<div key={i} style={{width:90,height:90,borderRadius:12,overflow:"hidden",border:`2px solid ${T.border}`}}><img src={ph.url} alt="visit" style={{width:"100%",height:"100%",objectFit:"cover"}}/></div>))}</div></div>);})}
        </>}
      </div>
      {bookModal&&<BookModal customer={customer} onClose={()=>setBookModal(false)} onConfirm={(info)=>{setBookModal(false);setBookDone(info);setTimeout(()=>setBookDone(null),5000);}}/>}
      {waVisit&&<WAPrompt customer={customer} visit={waVisit} onSend={()=>setWaVisit(null)} onSkip={()=>setWaVisit(null)}/>}
      {waPrompt&&<WAPrompt customer={customer} visit={waPrompt} onSend={()=>setWaPrompt(null)} onSkip={()=>setWaPrompt(null)}/>}
      {showQuick&&<QuickAddModal customer={customer} staffName={currentUser?.name||"Staff"} onSave={addVisit} onClose={()=>setShowQuick(false)}/>}
      {showFull&&<FullAddModal staffName={currentUser?.name||"Staff"} onSave={addVisit} onClose={()=>setShowFull(false)}/>}
    </div>
  );
}

function CustomerList({customers,isStaff,onSelect,onAddCustomer}){
  const[search,setSearch]=useState("");
  const filtered=customers.filter(c=>{const q=search.toLowerCase();return !q||c.name.toLowerCase().includes(q)||(c.phone||"").includes(q);});
  const N={purple:"#2d1b69",mid:"#5b3fc4",light:"#ede9fe",bg:"#f8f7ff",white:"#fff",text:"#0f0a2e",muted:"#6b7280",border:"#e5e7eb"};
  return(
    <div style={{flex:1,display:"flex",flexDirection:"column",overflow:"hidden",background:N.bg}}>
      {/* Header */}
      <div style={{background:N.white,padding:"14px 18px 12px",display:"flex",alignItems:"center",justifyContent:"space-between",borderBottom:`1px solid ${N.border}`,flexShrink:0}}>
        <div>
          <div style={{fontSize:20,fontWeight:800,color:N.text,letterSpacing:"-0.3px"}}>Clients</div>
          <div style={{fontSize:11,color:N.muted,marginTop:2,fontWeight:500}}>Manage your customers</div>
        </div>
        {onAddCustomer&&<button onClick={onAddCustomer} style={{background:N.mid,color:"#fff",border:"none",borderRadius:10,padding:"9px 16px",fontSize:13,fontWeight:700,cursor:"pointer",fontFamily:"inherit",display:"flex",alignItems:"center",gap:5}}>+ Add New</button>}
      </div>
      {/* Stats — only for owner */}
      {!isStaff&&<div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr 1fr",background:N.white,borderBottom:`1px solid ${N.border}`,flexShrink:0}}>
        {[
          {label:"Total",val:customers.length,color:N.text},
          {label:"VIP",val:customers.filter(c=>c.tag==="VIP").length,color:"#d97706"},
          {label:"Regular",val:customers.filter(c=>c.tag==="Regular").length,color:N.mid},
          {label:"New",val:customers.filter(c=>c.tag==="New").length,color:"#16a34a"},
        ].map(s=>(
          <div key={s.label} style={{padding:"12px 6px",textAlign:"center",borderRight:s.label!=="New"?`1px solid #f1f0f5`:"none"}}>
            <div style={{fontSize:20,fontWeight:800,color:s.color}}>{s.val}</div>
            <div style={{fontSize:10,color:N.muted,marginTop:3,fontWeight:500}}>{s.label}</div>
          </div>
        ))}
      </div>}
      {/* Search */}
      <div style={{padding:"10px 16px 6px",background:N.bg,flexShrink:0}}>
        <div style={{display:"flex",gap:8,alignItems:"center"}}>
          <div style={{flex:1,position:"relative"}}>
            <span style={{position:"absolute",left:12,top:"50%",transform:"translateY(-50%)",fontSize:14,color:N.muted}}>🔍</span>
            <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Search by name or number..." style={{width:"100%",padding:"10px 12px 10px 36px",border:`1px solid ${N.border}`,borderRadius:12,fontSize:13,fontFamily:"inherit",outline:"none",background:N.white,boxSizing:"border-box",color:N.text}}/>
          </div>

        </div>
      </div>
      <div style={{padding:"2px 18px 6px",fontSize:11,color:N.muted,fontWeight:500,flexShrink:0}}>Showing all customers</div>
      <div style={{flex:1,overflowY:"auto",padding:"0 14px 24px"}}>
        <div style={{display:"flex",flexDirection:"column",gap:8}}>
          {filtered.map((c,idx)=>{
            const tag=TAG[c.tag]||TAG.Regular;const bday=getBirthdayStatus(c.dob);const inactive=daysSince(c.last_visit||c.lastVisit)>=30;const lastSvc=(c.visitHistory||[])[0]?.services?.[0]||null;
            const{cardBg,cardColor,avBg,avColor}=CARD_COLORS[idx%CARD_COLORS.length];
            return(<div key={c.id} onClick={()=>onSelect(c)} style={{background:"#fff",borderRadius:16,padding:"14px",cursor:"pointer",border:"1px solid #f1f0f5",boxShadow:"0 1px 3px rgba(0,0,0,0.04)"}}>
              <div style={{display:"flex",alignItems:"flex-start",gap:12}}>
                <div style={{width:44,height:44,borderRadius:14,display:"flex",alignItems:"center",justifyContent:"center",fontSize:14,fontWeight:800,background:avBg,color:avColor,flexShrink:0}}>{c.avatar||(c.name?.slice(0,2)||"??").toUpperCase()}</div>
                <div style={{flex:1,minWidth:0}}>
                  <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:3}}>
                    <div style={{fontSize:14,fontWeight:700,color:"#0f0a2e"}}>{c.name}{bday?" 🎂":""}</div>
                    <div style={{fontSize:10,fontWeight:700,padding:"3px 9px",borderRadius:20,background:tag.bg,color:tag.color,border:`1px solid ${tag.border}`,flexShrink:0,marginLeft:8}}>{tag.label}</div>
                  </div>
                  <div style={{fontSize:11,color:"#6b7280",marginBottom:6}}>🚶 {c.src==="wa"||c.source==="wa"?"Walk-in · ":"Walk-in · "}{c.phone||""}</div>
                  {lastSvc&&<div style={{display:"inline-flex",alignItems:"center",gap:4,background:"#f0eeff",borderRadius:20,padding:"3px 10px",fontSize:11,fontWeight:600,color:"#5b3fc4"}}>✂️ {lastSvc}</div>}
                  {inactive&&!bday&&c.tag!=="VIP"&&c.tag!=="New"&&<div style={{marginTop:4,fontSize:10,color:"#dc2626",fontWeight:600}}>⚠️ Inactive for {daysSince(c.last_visit||c.lastVisit)} days</div>}
                </div>
                <div style={{display:"flex",gap:12,alignItems:"center",flexShrink:0}}>
                  <div style={{textAlign:"center"}}>
                    <div style={{fontSize:14,fontWeight:800,color:"#0f0a2e"}}>{c.visits||0}</div>
                    <div style={{fontSize:9,color:"#6b7280",marginTop:1}}>Visits</div>
                  </div>
                  {!isStaff&&<div style={{textAlign:"center"}}>
                    <div style={{fontSize:14,fontWeight:800,color:"#5b3fc4"}}>₹{((c.total_spent||c.totalSpent||0)/1000).toFixed(1)}k</div>
                    <div style={{fontSize:9,color:"#6b7280",marginTop:1}}>Spent</div>
                  </div>}
                  <div style={{color:"#9ca3af",fontSize:16}}>›</div>
                </div>
              </div>
            </div>);
          })}
        </div>
      </div>
    </div>
  );
}

export default function CustomerHistory({currentUser,onBack}){
  const[customers,setCustomers]=useState([]);const[selectedId,setSelectedId]=useState(null);const[ownerTab,setOwnerTab]=useState("customers");const[loading,setLoading]=useState(true);const[showAddCustomer,setShowAddCustomer]=useState(false);const[newCustomer,setNewCustomer]=useState({name:"",phone:"",dob:"",gender:"male",email:""});const[savingCustomer,setSavingCustomer]=useState(false);
  const[staffMap,setStaffMap]=useState({});
  const isStaff=currentUser?.role==="staff";const isOwner=currentUser?.role==="owner";
  async function loadData(){setLoading(true);const salonId=currentUser?.salon_id||currentUser?.id;const{data:cData}=await supabase.from("customers").select("*").eq("salon_id",salonId);const{data:vData}=await supabase.from("visit_history").select("*").eq("salon_id",salonId);const{data:sData}=await supabase.from("staff").select("id,name").eq("salon_id",salonId);if(sData){const map={};sData.forEach(s=>{map[s.id]=s.name;});setStaffMap(map);}if(cData&&cData.length>0){const grouped={};if(vData){vData.forEach(v=>{if(!grouped[v.customer_id])grouped[v.customer_id]=[];grouped[v.customer_id].push({id:v.id,date:v.date,services:v.services||[],stylist:v.stylist,amount:v.amount,notes:v.notes||"",photos:Array.isArray(v.photos)?v.photos:[]});});}setCustomers(cData.map(c=>({...c,avatar:c.avatar||(c.name?.slice(0,2)||"??").toUpperCase(),color:c.color||T.purple,visitHistory:grouped[c.id]||[],totalSpent:c.total_spent||0,lastVisit:c.last_visit||"-",favServices:c.fav_services||[],tag:c.tag||"New",src:c.source||"wa",email:c.email||""})));}else{setCustomers([]);}setLoading(false);}
  useEffect(()=>{if(currentUser?.id)loadData();},[currentUser?.id]);
  function handleUpdate(cId,changes){setCustomers(prev=>prev.map(c=>c.id===cId?{...c,...changes}:c));}
  async function handleAddCustomer(){if(!newCustomer.name.trim()||newCustomer.phone.length<10)return;setSavingCustomer(true);try{const salonId=currentUser?.salon_id||currentUser?.id;const{data:res}=await supabase.from("customers").insert({salon_id:salonId,name:newCustomer.name.trim(),phone:newCustomer.phone.trim(),birthday:newCustomer.dob||null,gender:newCustomer.gender||"male",email:newCustomer.email.trim()||null,tag:"New",source:"walk"}).select().single();if(res){setCustomers(prev=>[{...res,avatar:(res.name?.slice(0,2)||"??").toUpperCase(),color:T.purple,visitHistory:[],totalSpent:0,lastVisit:"-",favServices:[],tag:"New",src:"walk",email:res.email||"",visits:0},...prev]);}setNewCustomer({name:"",phone:"",dob:"",gender:"male",email:""});setShowAddCustomer(false);}catch(e){console.error(e);}setSavingCustomer(false);}
  const selected=customers.find(c=>c.id===selectedId)||null;
  if(loading){return(<div style={{height:"100%",display:"flex",alignItems:"center",justifyContent:"center",background:T.bg}}><div style={{textAlign:"center"}}><div style={{fontSize:32,marginBottom:12}}>💈</div><div style={{fontSize:14,color:T.ts,fontWeight:700}}>Loading...</div></div></div>);}
  return(
    <div style={{height:"100%",display:"flex",flexDirection:"column",fontFamily:"system-ui,-apple-system,sans-serif",color:T.text,background:T.bg,overflow:"hidden"}}>
      {/* White Header — owner only */}
      {!selected&&isOwner&&<div style={{background:"#fff",padding:"14px 18px 12px",display:"flex",alignItems:"center",justifyContent:"space-between",borderBottom:"1px solid #f1f0f5",flexShrink:0}}>
        <div style={{display:"flex",alignItems:"center",gap:10}}>
          <button onClick={onBack} style={{width:34,height:34,borderRadius:10,background:"#f5f3ff",border:"1px solid #e0d8ff",display:"flex",alignItems:"center",justifyContent:"center",fontSize:16,color:"#5b3fc4",cursor:"pointer",fontWeight:600}}>←</button>
          <div>
            <div style={{fontWeight:800,fontSize:16,color:"#0f0a2e",letterSpacing:"-0.3px"}}>Customer History</div>
            <div style={{fontSize:11,color:"#9b8ec4",marginTop:2,fontWeight:500}}>Visit records & analytics</div>
          </div>
        </div>
      </div>}
      {isOwner&&!selected&&(
        <div style={{background:"#fff",borderBottom:"1px solid #f1f0f5",display:"flex",flexShrink:0}}>
          {[{id:"dashboard",icon:"📊",label:"Dashboard"},{id:"customers",icon:"👥",label:"Customers"}].map(t=>(
            <div key={t.id} onClick={()=>setOwnerTab(t.id)} style={{flex:1,padding:"11px 4px 9px",display:"flex",flexDirection:"column",alignItems:"center",gap:3,cursor:"pointer",borderBottom:`2.5px solid ${ownerTab===t.id?"#5b3fc4":"transparent"}`}}>
              <span style={{fontSize:18}}>{t.icon}</span>
              <span style={{fontSize:11,fontWeight:ownerTab===t.id?700:500,color:ownerTab===t.id?"#5b3fc4":"#9ca3af"}}>{t.label}</span>
            </div>
          ))}
        </div>
      )}
      {selected?<CustomerDetail customer={selected} isStaff={isStaff} currentUser={currentUser} onBack={()=>setSelectedId(null)} onUpdate={handleUpdate}/>:isOwner&&ownerTab==="dashboard"?<OwnerDashboard customers={customers} staffMap={staffMap}/>:<CustomerList customers={customers} isStaff={isStaff} onSelect={c=>setSelectedId(c.id)} onAddCustomer={()=>setShowAddCustomer(true)}/>}
      {showAddCustomer&&(<div onClick={()=>setShowAddCustomer(false)} style={{position:"fixed",inset:0,background:"rgba(0,0,0,0.5)",zIndex:700,display:"flex",alignItems:"flex-end"}}><div onClick={e=>e.stopPropagation()} style={{background:T.surface,borderRadius:"20px 20px 0 0",padding:"20px 18px 36px",width:"100%",maxHeight:"90vh",overflowY:"auto"}}><div style={{width:36,height:4,background:T.border,borderRadius:2,margin:"0 auto 14px"}}/><div style={{fontWeight:900,fontSize:16,color:T.text,marginBottom:16}}>🆕 Add New Customer</div>{[{label:"Full Name *",key:"name",ph:"e.g. Priya Sharma",type:"text"},{label:"Phone Number *",key:"phone",ph:"9876543210",type:"tel"},{label:"Date of Birth",key:"dob",ph:"",type:"date"},{label:"Email Address",key:"email",ph:"customer@gmail.com",type:"email"}].map(f=>(<div key={f.key} style={{marginBottom:12}}><div style={{fontSize:12,fontWeight:800,color:T.tm,marginBottom:5}}>{f.label}</div><input type={f.type} value={newCustomer[f.key]} onChange={e=>setNewCustomer(p=>({...p,[f.key]:f.key==="phone"?e.target.value.replace(/\D/g,"").slice(0,10):e.target.value}))} placeholder={f.ph} style={IS}/></div>))}<div style={{marginBottom:18}}><div style={{fontSize:12,fontWeight:800,color:T.tm,marginBottom:8}}>Gender</div><div style={{display:"flex",gap:8}}>{[{id:"male",label:"👨 Male"},{id:"female",label:"👩 Female"}].map(g=>(<button key={g.id} onClick={()=>setNewCustomer(p=>({...p,gender:g.id}))} style={{flex:1,padding:"9px",borderRadius:10,border:`2px solid ${newCustomer.gender===g.id?T.purple:T.border}`,background:newCustomer.gender===g.id?T.purpleLight:"#fff",color:newCustomer.gender===g.id?T.purple:T.ts,fontFamily:"inherit",fontSize:13,fontWeight:800,cursor:"pointer"}}>{g.label}</button>))}</div></div><div style={{display:"flex",gap:10}}><button onClick={()=>{setShowAddCustomer(false);setNewCustomer({name:"",phone:"",dob:"",gender:"male",email:""});}} style={{flex:1,padding:12,border:`2px solid ${T.border}`,borderRadius:12,background:T.surface,fontFamily:"inherit",fontSize:13,fontWeight:700,cursor:"pointer",color:T.tm}}>Cancel</button><button onClick={handleAddCustomer} disabled={savingCustomer||!newCustomer.name.trim()||newCustomer.phone.length<10} style={{flex:2,padding:12,border:"none",borderRadius:12,background:savingCustomer||!newCustomer.name.trim()||newCustomer.phone.length<10?"#d1d5db":T.purple,color:"#fff",fontFamily:"inherit",fontSize:13,fontWeight:800,cursor:newCustomer.name.trim()&&newCustomer.phone.length===10?"pointer":"not-allowed"}}>{savingCustomer?"Saving...":"✓ Save Customer"}</button></div></div></div>)}
    </div>
  );
}
