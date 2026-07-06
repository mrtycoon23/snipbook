import { useState, useRef, useEffect } from "react";
import { supabase } from "./lib/supabase"; 
import StaffManagement from "./screens/StaffManagement";
import CustomerHistory from "./screens/CustomerHistoryApp";
import EngagementCenter from "./screens/EngagementCenter";
import StaffDashboard, { StaffLoginPage } from "./screens/StaffDashboard";
import SuperAdmin from "./screens/SuperAdmin";
import LandingPage from "./screens/LandingPage";

const TP={bg:"#f4f2ff",surface:"#ffffff",border:"#e0d8ff",purple:"#2d1b69",purpleLight:"#ede9fe",purpleMid:"#5b3fc4",text:"#1a0a4a",tm:"#4a3580",ts:"#9b8ec4",tf:"#c4b8f0",tg:"#e0d8ff",green:"#22c55e",gl:"#e8fdf0",gm:"#bbf7d0",gd:"#16a34a",yellow:"#fef9c3",yb:"#fde68a",yt:"#a16207",blue:"#eff6ff",bb:"#93c5fd",bt:"#2563eb",red:"#fff0f0",rb:"#fca5a5",rt:"#dc2626",sub:"#f4f2ff",inp:"#fafbff"};
function pad(n){return String(n).padStart(2,"0");}
function addDays(d,n){const r=new Date(d);r.setDate(r.getDate()+n);return r;}
function dateKey(d){return `${d.getFullYear()}-${pad(d.getMonth()+1)}-${pad(d.getDate())}`;}
function fmt12(slot){const[h,m]=slot.split(":").map(Number);const h12=h===0?12:h>12?h-12:h;return `${h12}:${pad(m)} ${h<12?"AM":"PM"}`;}
function playNotificationSound(){
  try{
    const Ctx=window.AudioContext||window.webkitAudioContext;
    if(!Ctx)return;
    const ctx=new Ctx();
    const fire=()=>{
      const osc=ctx.createOscillator();
      const gain=ctx.createGain();
      osc.connect(gain);gain.connect(ctx.destination);
      osc.type="sine";
      osc.frequency.setValueAtTime(880,ctx.currentTime);
      osc.frequency.setValueAtTime(1100,ctx.currentTime+0.12);
      gain.gain.setValueAtTime(0.0001,ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.3,ctx.currentTime+0.02);
      gain.gain.exponentialRampToValueAtTime(0.0001,ctx.currentTime+0.3);
      osc.start();
      osc.stop(ctx.currentTime+0.32);
      setTimeout(()=>{try{ctx.close();}catch(e){}},500);
    };
    if(ctx.state==="suspended")ctx.resume().then(fire).catch(()=>{});
    else fire();
  }catch(e){}
}
const MONTHS=["January","February","March","April","May","June","July","August","September","October","November","December"];
const DAYS_S=["Sun","Mon","Tue","Wed","Thu","Fri","Sat"];
const SHORT_M=["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
const COLORS=["green","blue","purple","orange","pink","teal"];
const COLOR_MAP={green:{bg:"#f0fdf4",border:"#86efac",dot:"#22c55e"},blue:{bg:"#eff6ff",border:"#93c5fd",dot:"#3b82f6"},purple:{bg:"#ede9fe",border:"#c4b8f0",dot:"#a855f7"},orange:{bg:"#fff8e6",border:"#fcd34d",dot:"#f59e0b"},pink:{bg:"#fff0f6",border:"#f9a8d4",dot:"#ec4899"},teal:{bg:"#f0fdfa",border:"#6ee7b7",dot:"#14b8a6"}};
const STATUS_MAP={confirmed:{bg:"#ede9fe",color:"#5b3fc4",label:"✓ Confirmed"},done:{bg:"#f0f4f8",color:"#888",label:"Done"},pending:{bg:"#fef9c3",color:"#a16207",label:"⏳ Pending"},break:{bg:"#f0f4f8",color:"#aaa",label:"Break"}};
const SERVICES_LIST=["✂️ Haircut","✂️ Haircut + Beard","🎨 Hair Colour","💆 Facial + Cleanup","💄 Bridal Makeup","💆 Hair Spa","💅 Manicure/Pedicure"];
const EMOJIS=["✂️","🎨","💆","💄","💅","💇","🪒","🧴","💈","🌸"];
const WEEK_DAYS=["Mon","Tue","Wed","Thu","Fri","Sat","Sun"];
const HOURS_LIST=Array.from({length:17},(_,i)=>i+6).map(h=>({val:h,label:`${h<=12?h:h-12}:00 ${h<12?"AM":h===12?"PM":"PM"}`}));
const LOGO_BUCKET="salon-logos";
const BUCKET="visit photos";
const DEFAULT_SHOW_REVENUE=false;
const CARD_COLORS=[{cardBg:"#ede9fe",cardColor:"#5b3fc4",avBg:"#c4b8f0",avColor:"#2d1b69"},{cardBg:"#fef9c3",cardColor:"#a16207",avBg:"#fde68a",avColor:"#a16207"},{cardBg:"#f0fdf4",cardColor:"#16a34a",avBg:"#bbf7d0",avColor:"#16a34a"},{cardBg:"#fff0f6",cardColor:"#db2777",avBg:"#fbcfe8",avColor:"#db2777"},{cardBg:"#eff6ff",cardColor:"#2563eb",avBg:"#bfdbfe",avColor:"#1d4ed8"},{cardBg:"#fff7ed",cardColor:"#ea580c",avBg:"#fed7aa",avColor:"#ea580c"},{cardBg:"#f0fdfa",cardColor:"#0d9488",avBg:"#99f6e4",avColor:"#0f766e"}];
const is={width:"100%",padding:"11px 13px",border:`2px solid ${TP.border}`,borderRadius:11,fontSize:14,fontFamily:"inherit",outline:"none",background:TP.inp,boxSizing:"border-box",color:TP.text};
const nb={width:30,height:30,borderRadius:8,border:`2px solid ${TP.border}`,background:"#fff",fontSize:13,cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center"};
const obIs={width:"100%",padding:"11px 13px",border:`2px solid ${TP.border}`,borderRadius:11,fontSize:14,fontFamily:"inherit",outline:"none",background:TP.inp,boxSizing:"border-box",color:TP.text};

function seedBookings(){
  const base=new Date(2026,2,23);const data={};
  const samples=[[["09:00","Arjun Mehta","Haircut + Beard",450,"wa","done","green"],["10:00","Priya Kapoor","Hair Colour",1200,"wa","done","purple"],["12:30","__break__"],["14:00","Neha Kulkarni","Bridal Makeup",2000,"wa","confirmed","pink"],["15:30","Vikram Tiwari","Haircut",250,"wa","confirmed","blue"],["17:00","Deepa Singh","Hair Colour",900,"wa","pending","purple"]],[["09:30","Sneha Reddy","Hair Spa",700,"wa","done","teal"],["11:00","Karan Malhotra","Haircut + Beard",450,"wa","done","blue"],["12:30","__break__"],["14:30","Ravi Gupta","Haircut",250,"wa","confirmed","green"],["16:00","Pooja Verma","Facial",600,"wa","confirmed","orange"]],[["09:00","Meera Joshi","Bridal Makeup",2000,"wa","confirmed","pink"],["12:30","__break__"],["14:00","Kavya Sharma","Hair Spa",700,"wa","confirmed","teal"],["16:00","Ajay Kumar","Haircut + Beard",450,"wa","pending","blue"]]];
  for(let i=0;i<14;i++){const d=addDays(base,i);const key=dateKey(d);const s=samples[i%samples.length];data[key]={};s.forEach(row=>{if(row[1]==="__break__"){data[key][row[0]]=[{status:"break"}];}else{const[time,name,service,price,src,status,color]=row;data[key][time]=[{name,service,price,src,status,color}];}});}
  return data;
}

function Logo({size=15,iconSize=32}){return(<div style={{display:"flex",alignItems:"center",gap:8}}><div style={{width:iconSize,height:iconSize,background:TP.purple,borderRadius:Math.round(iconSize*0.28),display:"flex",alignItems:"center",justifyContent:"center",fontSize:iconSize*0.5}}>✂️</div><span style={{fontWeight:900,fontSize:size,color:"#fff"}}>Snip<span style={{color:"#c4b8f0"}}>Book</span></span></div>);}

function SalonHeader({user,screen,onSettings,unreadCount=0,onBell,onBack}){
  const screenLabel={dashboard:"Home",calendar:"Calendar",clients:"Clients",staff:"Staff",history:"Customer History",engage:"Engagement",settings:"Settings",chats:"Bot Chats"}[screen]||screen;
  const isDashboard=screen==="dashboard";
  if(isDashboard){return(
    <div style={{background:TP.bg,padding:"16px 18px 8px",display:"flex",alignItems:"center",justifyContent:"space-between",flexShrink:0}}>
      <div><div style={{fontSize:13,color:TP.ts,fontWeight:600,marginBottom:2}}>Good Morning 👋</div><div style={{fontWeight:900,fontSize:22,color:TP.text}}>{user?.name?.split(" ")[0]}!</div></div>
      <div style={{display:"flex",gap:10,alignItems:"center"}}>
        <div style={{width:40,height:40,borderRadius:"50%",background:"#fff",border:`1.5px solid ${TP.border}`,display:"flex",alignItems:"center",justifyContent:"center",fontSize:16,cursor:"pointer",boxShadow:"0 2px 8px rgba(45,27,105,0.08)"}}>🔍</div>
        <div onClick={onBell} style={{position:"relative",width:40,height:40,borderRadius:"50%",background:"#fff",border:`1.5px solid ${TP.border}`,display:"flex",alignItems:"center",justifyContent:"center",cursor:"pointer",boxShadow:"0 2px 8px rgba(45,27,105,0.08)"}}>
          <span style={{fontSize:18}}>🔔</span>
          {unreadCount>0&&<div style={{position:"absolute",top:0,right:0,width:14,height:14,borderRadius:"50%",background:"#ef4444",display:"flex",alignItems:"center",justifyContent:"center",fontSize:8,fontWeight:900,color:"#fff",border:"2px solid #fff"}}>{unreadCount>9?"9+":unreadCount}</div>}
        </div>
      </div>
    </div>
  );}
  return(<div style={{background:TP.purple,padding:"0 16px",height:56,display:"flex",alignItems:"center",justifyContent:"space-between",flexShrink:0,boxShadow:"0 2px 12px rgba(45,27,105,0.3)"}}>
    <button onClick={onBack} style={{width:34,height:34,background:"rgba(255,255,255,0.15)",border:"none",borderRadius:10,display:"flex",alignItems:"center",justifyContent:"center",fontSize:18,cursor:"pointer",color:"#fff",fontFamily:"inherit"}}>←</button>
    <div style={{flex:1,textAlign:"center"}}><div style={{fontWeight:800,fontSize:14,color:"#fff"}}>{screenLabel}</div></div>
    <div onClick={onSettings} style={{width:34,height:34,borderRadius:10,background:screen==="settings"?"rgba(255,255,255,0.3)":"rgba(255,255,255,0.15)",display:"flex",alignItems:"center",justifyContent:"center",fontSize:12,fontWeight:800,color:"#fff",cursor:"pointer",border:"2px solid rgba(255,255,255,0.2)"}}>{user?.name?.split(" ").map(w=>w[0]).join("").slice(0,2)||"??"}</div>
  </div>);
}

function ResetPasswordPage({onDone}){const [pass,setPass]=useState("");const [done,setDone]=useState(false);const [loading,setLoading]=useState(false);return(<div style={{minHeight:"100vh",background:`linear-gradient(135deg,${TP.purple},${TP.purpleMid})`,display:"flex",alignItems:"center",justifyContent:"center",padding:"24px",fontFamily:"system-ui,sans-serif"}}><div style={{background:"#fff",borderRadius:20,padding:"28px 24px",width:"100%",maxWidth:380}}><div style={{textAlign:"center",marginBottom:24}}><div style={{fontSize:40,marginBottom:8}}>🔑</div><div style={{fontWeight:900,fontSize:18,color:TP.text}}>Set New Password</div></div>{done?<div style={{textAlign:"center"}}><div style={{fontSize:40,marginBottom:12}}>✅</div><div style={{fontWeight:800,color:TP.gd,marginBottom:16}}>Password updated successfully!</div><button onClick={onDone} style={{width:"100%",padding:13,background:TP.purple,border:"none",borderRadius:12,color:"#fff",fontFamily:"inherit",fontSize:15,fontWeight:800,cursor:"pointer"}}>Login →</button></div>:<><input value={pass} onChange={e=>setPass(e.target.value)} type="password" placeholder="Naya password (min 6 chars)" style={{...is,marginBottom:16}}/><button onClick={async()=>{if(pass.length<6){alert("Min. 6 characters!");return;}setLoading(true);const{error}=await supabase.auth.updateUser({password:pass});if(error)alert("Error: "+error.message);else setDone(true);setLoading(false);}} style={{width:"100%",padding:13,background:loading?"#c4b8f0":TP.purple,border:"none",borderRadius:12,color:"#fff",fontFamily:"inherit",fontSize:15,fontWeight:800,cursor:"pointer"}}>{loading?"Saving...":"✓ Save Password"}</button></>}</div></div>);}

function LoginPage({onOwnerLogin,onStaffLogin,onSignup,onBack}){
  const [tab,setTab]=useState("owner");const [email,setEmail]=useState("");const [pass,setPass]=useState("");const [loading,setLoading]=useState(false);const [error,setError]=useState("");
  const [loginMode,setLoginMode]=useState("email"); // "email" | "phone"
  const [phone,setPhone]=useState("");

  async function handleOwnerLogin(){
    if(loginMode==="phone"){
      const phone10=phone.replace(/\D/g,"").slice(0,10);
      if(phone10.length!==10){setError("Please enter a valid 10-digit phone number");return;}
      if(!pass){setError("Please enter your password");return;}
      setLoading(true);setError("");
      try{
        // Call API to get the real auth email for this phone number
        const res=await fetch("/api/phone-login",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({phone:phone10})});
        const result=await res.json();
        if(!res.ok||result.error){setError(result.error||"No account found with this phone number");setLoading(false);return;}
        const ownerEmail=result.email;
        const{data,error:err}=await supabase.auth.signInWithPassword({email:ownerEmail,password:pass});
        if(err)throw err;
        const{data:salon}=await supabase.from("salons").select("*").eq("id",data.user.id).single();
        onOwnerLogin({id:data.user.id,email:data.user.email,name:salon?.owner_name||data.user.email,salon:salon?.salon_name||"Mera Salon",city:salon?.city||"",plan:salon?.plan||"free",logo_url:salon?.logo_url||null});
      }catch(e){setError(e.message);}
      setLoading(false);return;
    }
    // Email login (existing flow)
    if(!email||!pass){setError("Please enter your email and password");return;}setLoading(true);setError("");try{let loginEmail=email.trim();if(!loginEmail.includes("@")){setError("Please enter your email");setLoading(false);return;}const{data,error:err}=await supabase.auth.signInWithPassword({email:loginEmail,password:pass});if(err)throw err;const{data:salon}=await supabase.from("salons").select("*").eq("id",data.user.id).single();onOwnerLogin({id:data.user.id,email:data.user.email,name:salon?.owner_name||data.user.email,salon:salon?.salon_name||"Mera Salon",city:salon?.city||"",plan:salon?.plan||"free",logo_url:salon?.logo_url||null});}catch(e){setError(e.message);}setLoading(false);
  }
  return(<div style={{minHeight:"100vh",background:`linear-gradient(135deg,${TP.purple},${TP.purpleMid})`,display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",padding:"24px 20px",fontFamily:"system-ui,sans-serif"}}><div style={{width:"100%",maxWidth:400}}><div style={{textAlign:"center",marginBottom:24}}><Logo size={22} iconSize={44}/><div style={{fontSize:13,color:"rgba(255,255,255,0.6)",marginTop:8}}>Welcome back 👋</div></div><div style={{background:"#fff",borderRadius:20,overflow:"hidden",boxShadow:"0 8px 28px rgba(0,0,0,0.2)"}}><div style={{display:"flex",borderBottom:`2px solid ${TP.border}`}}>{[{id:"owner",icon:"👑",label:"Owner Login"},{id:"staff",icon:"👨‍💼",label:"Staff Login"}].map(t=>(<div key={t.id} onClick={()=>setTab(t.id)} style={{flex:1,padding:"14px 8px",display:"flex",flexDirection:"column",alignItems:"center",gap:4,cursor:"pointer",background:tab===t.id?TP.purpleLight:"#f8fafc",borderBottom:`3px solid ${tab===t.id?TP.purple:"transparent"}`}}><span style={{fontSize:22}}>{t.icon}</span><span style={{fontSize:12,fontWeight:800,color:tab===t.id?TP.purple:"#888"}}>{t.label}</span></div>))}</div><div style={{padding:"22px 22px 26px"}}>{tab==="owner"&&(<>{error&&<div style={{background:TP.red,border:`2px solid ${TP.rb}`,borderRadius:10,padding:"9px 12px",fontSize:12,color:TP.rt,fontWeight:700,marginBottom:14}}>{error}</div>}
<div style={{display:"flex",background:"#f4f2ff",borderRadius:10,padding:3,marginBottom:16,gap:3}}>
  {[{id:"email",label:"📧 Email"},{id:"phone",label:"📱 Phone"}].map(m=>(<button key={m.id} onClick={()=>{setLoginMode(m.id);setError("");}} style={{flex:1,padding:"8px 4px",borderRadius:8,border:"none",background:loginMode===m.id?"#fff":"transparent",color:loginMode===m.id?TP.purple:TP.ts,fontFamily:"inherit",fontSize:12,fontWeight:800,cursor:"pointer",boxShadow:loginMode===m.id?"0 1px 4px rgba(0,0,0,0.1)":"none"}}>{m.label}</button>))}
</div>
{loginMode==="email"
  ?<div style={{marginBottom:14}}><label style={{fontSize:13,fontWeight:800,color:TP.tm}}>Email</label><input value={email} onChange={e=>setEmail(e.target.value)} type="text" style={obIs} placeholder="email@gmail.com"/></div>
  :<div style={{marginBottom:14}}><label style={{fontSize:13,fontWeight:800,color:TP.tm}}>Phone Number</label><input value={phone} onChange={e=>setPhone(e.target.value.replace(/\D/g,"").slice(0,10))} type="tel" inputMode="numeric" maxLength={10} style={obIs} placeholder="9876543210"/><div style={{fontSize:10,color:TP.tf,marginTop:4}}>Enter the phone number linked to your salon account</div></div>
}
<div style={{marginBottom:18}}><label style={{fontSize:13,fontWeight:800,color:TP.tm}}>Password</label><input value={pass} onChange={e=>setPass(e.target.value)} type="password" style={obIs} placeholder="••••••••" onKeyDown={e=>e.key==="Enter"&&handleOwnerLogin()}/></div><button onClick={handleOwnerLogin} disabled={loading} style={{width:"100%",padding:"13px",background:loading?"#c4b8f0":TP.purple,border:"none",borderRadius:12,color:"#fff",fontFamily:"inherit",fontSize:15,fontWeight:800,cursor:loading?"not-allowed":"pointer",marginBottom:12}}>{loading?"Logging in...":"👑 Owner Login →"}</button><div style={{textAlign:"center",fontSize:13,color:"#888",marginBottom:8}}>New here? <span onClick={onSignup} style={{color:TP.purple,fontWeight:800,cursor:"pointer"}}>Start your free trial</span></div><div style={{textAlign:"center"}}><span onClick={async()=>{
  if(!email){alert("Please enter your email first!");return;}
  const emailLower=email.trim().toLowerCase();
  const{data:salonCheck}=await supabase.from("salons").select("id").eq("notification_email",emailLower).limit(1);
  if(!salonCheck||salonCheck.length===0){
    alert("⚠️ No account found with this email address. Please use the email you signed up with.");
    return;
  }
  const{error}=await supabase.auth.resetPasswordForEmail(emailLower,{redirectTo:"https://snipbook.vercel.app"});
  if(error)alert("Error: "+error.message);
  else alert("✅ Password reset link sent! Please check your email.");
}} style={{fontSize:12,color:"#aaa",cursor:"pointer",textDecoration:"underline"}}>🔑 Forgot Password?</span></div></>)}{tab==="staff"&&(<><div style={{background:TP.purpleLight,border:`2px solid #c4b8f0`,borderRadius:12,padding:"14px",marginBottom:16,textAlign:"center"}}><div style={{fontSize:24,marginBottom:6}}>👨‍💼</div><div style={{fontWeight:800,fontSize:13,color:TP.purple}}>Staff Portal</div></div><button onClick={onStaffLogin} style={{width:"100%",padding:"14px",background:TP.purple,border:"none",borderRadius:12,color:"#fff",fontFamily:"inherit",fontSize:15,fontWeight:800,cursor:"pointer"}}>👨‍💼 Staff Login →</button></>)}</div></div><div style={{textAlign:"center",marginTop:14}}><button onClick={onBack} style={{background:"none",border:"none",color:"rgba(255,255,255,0.6)",fontSize:13,fontWeight:700,cursor:"pointer",fontFamily:"inherit"}}>← Back to Home</button></div></div></div>);
}

const OB_STEPS=[{id:1,title:"Create Account",icon:"👤"},{id:2,title:"Salon Info",icon:"✂️"},{id:3,title:"Working Hours",icon:"🕐"},{id:4,title:"Services",icon:"💇"},{id:5,title:"WhatsApp",icon:"💬"},{id:6,title:"All Set!",icon:"🎉"}];
const DEF_SVCS=[{id:1,emoji:"✂️",name:"Haircut",price:250,duration:30,active:true,gender:"male"},{id:2,emoji:"✂️",name:"Haircut + Beard",price:450,duration:45,active:true,gender:"male"},{id:3,emoji:"🎨",name:"Hair Colour",price:1200,duration:90,active:false,gender:"both"},{id:4,emoji:"💆",name:"Facial + Cleanup",price:600,duration:60,active:false,gender:"both"},{id:5,emoji:"💄",name:"Bridal Makeup",price:2000,duration:90,active:false,gender:"female"},{id:6,emoji:"💆",name:"Hair Spa",price:700,duration:60,active:false,gender:"both"}];
function OBF({label,children}){return(<div style={{marginBottom:14}}><label style={{fontSize:13,fontWeight:800,color:TP.tm,display:"block",marginBottom:5}}>{label}</label>{children}</div>);}
  
function slugify(name){return (name||"").toLowerCase().trim().replace(/[^a-z0-9]/g,"");}

function Onboarding({onComplete,onBack}){
  const [step,setStep]=useState(1);const [data,setData]=useState({ownerName:"",phone:"",email:"",password:"",salonName:"",city:"",salonType:"unisex",workDays:["Mon","Tue","Wed","Thu","Fri","Sat"],openTime:9,closeTime:21,waNumber:""});const [svcs,setSvcs]=useState(DEF_SVCS);const [loading,setLoading]=useState(false);const [error,setError]=useState("");
  const [nameTaken,setNameTaken]=useState(false);const [checkingName,setCheckingName]=useState(false);
  useEffect(()=>{
    if(!data.salonName.trim()){setNameTaken(false);return;}
    const t=setTimeout(async()=>{
      setCheckingName(true);
      try{const{data:existing}=await supabase.from("salons").select("id").ilike("salon_name",data.salonName.trim()).limit(1);setNameTaken((existing||[]).length>0);}catch(e){}
      setCheckingName(false);
    },500);
    return()=>clearTimeout(t);
  },[data.salonName]);
  const progress=((step-1)/(OB_STEPS.length-1))*100;
  function canNext(){if(step===1){const ph=/^\d{10}$/.test(data.phone.replace(/\s/g,""));const em=/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email);return data.ownerName&&ph&&em&&data.password.length>=6;}if(step===2)return data.salonName&&data.city&&!nameTaken&&!checkingName;if(step===3)return data.workDays.length>0;if(step===4)return svcs.some(s=>s.active);if(step===5)return /^\d{10}$/.test(data.waNumber.replace(/\s/g,""));return true;}
  const F=OBF;
  async function handleComplete(){setLoading(true);setError("");try{const{data:authData,error:authErr}=await supabase.auth.signUp({email:data.email,password:data.password});if(authErr)throw authErr;if(!authData?.user?.id){setError("This email is already registered. Please use a different email or contact support.");setLoading(false);return;}const userId=authData.user.id;const botKeyword=slugify(data.salonName);const{error:salonErr}=await supabase.from("salons").insert({id:userId,owner_name:data.ownerName,salon_name:data.salonName,phone:data.phone,city:data.city,plan:"free",services:svcs.filter(s=>s.active),working_days:data.workDays,open_time:data.openTime,close_time:data.closeTime,whatsapp_number:data.waNumber,bot_keyword:botKeyword,notification_number:data.phone,notification_email:data.email});if(salonErr){setError(`Error saving salon: ${salonErr.message}`);setLoading(false);return;}onComplete({id:userId,name:data.ownerName,email:data.email,salon:data.salonName,city:data.city,plan:"Trial",logo_url:null});}catch(e){setError(e.message);setLoading(false);}} 
  return(<div style={{minHeight:"100dvh",background:`linear-gradient(135deg,${TP.purpleLight},#fff)`,display:"flex",flexDirection:"column",alignItems:"center",padding:"20px 16px 40px",fontFamily:"system-ui,sans-serif",overflowY:"auto",WebkitOverflowScrolling:"touch",boxSizing:"border-box"}}><div style={{marginBottom:18,display:"flex",alignItems:"center",gap:8}}><div style={{width:36,height:36,background:TP.purple,borderRadius:10,display:"flex",alignItems:"center",justifyContent:"center",fontSize:18}}>✂️</div><span style={{fontWeight:900,fontSize:18,color:TP.text}}>Snip<span style={{color:TP.purpleMid}}>Book</span></span></div><div style={{width:"100%",maxWidth:460,marginBottom:6}}><div style={{display:"flex",justifyContent:"space-between",fontSize:12,fontWeight:700,color:"#888",marginBottom:6}}><span>Step {step} of {OB_STEPS.length}</span><span style={{color:TP.purple}}>{Math.round(progress)}% done</span></div><div style={{background:TP.border,borderRadius:20,height:6,overflow:"hidden"}}><div style={{width:`${progress}%`,height:"100%",background:`linear-gradient(90deg,${TP.purple},${TP.purpleMid})`,borderRadius:20,transition:"width 0.4s"}}/></div></div><div style={{display:"flex",width:"100%",maxWidth:460,marginBottom:18}}>{OB_STEPS.map((s)=>(<div key={s.id} style={{flex:1,display:"flex",flexDirection:"column",alignItems:"center",gap:3,cursor:s.id<step?"pointer":"default"}} onClick={()=>{if(s.id<step)setStep(s.id);}}><div style={{width:24,height:24,borderRadius:"50%",background:step>s.id?TP.purple:step===s.id?TP.text:TP.border,color:step>=s.id?"#fff":"#aaa",display:"flex",alignItems:"center",justifyContent:"center",fontSize:step>s.id?11:10,fontWeight:800,border:step===s.id?`3px solid ${TP.purple}`:"3px solid transparent"}}>{step>s.id?"✓":s.id}</div><div style={{fontSize:8,fontWeight:700,color:step===s.id?TP.purple:"#ccc"}}>{s.icon}</div></div>))}</div>
  <div style={{width:"100%",maxWidth:460,background:"#fff",borderRadius:20,boxShadow:"0 8px 28px rgba(45,27,105,0.12)",border:`2px solid ${TP.border}`,overflow:"hidden"}}><div style={{padding:"16px 20px 12px",borderBottom:`2px solid ${TP.bg}`,background:TP.purpleLight,display:"flex",alignItems:"center",gap:10}}><div style={{width:36,height:36,borderRadius:11,background:"rgba(45,27,105,0.1)",display:"flex",alignItems:"center",justifyContent:"center",fontSize:18}}>{OB_STEPS[step-1].icon}</div><div style={{fontWeight:900,fontSize:15,color:TP.text}}>{OB_STEPS[step-1].title}</div></div>
  <div style={{padding:"16px 20px"}}>{error&&<div style={{background:TP.red,border:`2px solid ${TP.rb}`,borderRadius:10,padding:"9px 12px",fontSize:12,color:TP.rt,fontWeight:700,marginBottom:14}}>{error}</div>}{step===1&&(<><F label="Full Name"><input value={data.ownerName} onChange={e=>setData(p=>({...p,ownerName:e.target.value}))} placeholder="e.g. Rahul Sharma" style={obIs}/></F><F label="Mobile"><input value={data.phone} onChange={e=>setData(p=>({...p,phone:e.target.value.replace(/\D/g,"").slice(0,10)}))} maxLength={10} inputMode="numeric" placeholder="+91 98765 43210" style={obIs}/></F><F label="Email"><input value={data.email} onChange={e=>setData(p=>({...p,email:e.target.value}))} placeholder="rahul@gmail.com" type="email" style={obIs}/></F><F label="Password"><input value={data.password} onChange={e=>setData(p=>({...p,password:e.target.value}))} placeholder="Min. 6 characters" type="password" style={obIs}/></F></>)}{step===2&&(<><F label="Salon Name"><input value={data.salonName} onChange={e=>setData(p=>({...p,salonName:e.target.value}))} placeholder="e.g. Sharma's Salon" style={obIs}/>{checkingName&&<div style={{fontSize:11,color:"#aaa",marginTop:5}}>Checking availability...</div>}{!checkingName&&nameTaken&&<div style={{fontSize:12,color:TP.rt,fontWeight:700,marginTop:5,background:TP.red,padding:"7px 10px",borderRadius:8,border:`1.5px solid ${TP.rb}`}}>⚠️ This salon name already exists. Please choose a different name.</div>}{!checkingName&&!nameTaken&&data.salonName.trim()&&<div style={{fontSize:11,color:TP.gd,marginTop:5}}>✓ Name is available</div>}</F><F label="City"><input value={data.city} onChange={e=>setData(p=>({...p,city:e.target.value}))} placeholder="e.g. Delhi" style={obIs}/></F><F label="Salon Type"><select value={data.salonType} onChange={e=>setData(p=>({...p,salonType:e.target.value}))} style={{...is,marginTop:5,cursor:"pointer"}}><option value="unisex">💇 Unisex</option><option value="mens">💈 Men's Salon</option><option value="ladies">💄 Ladies Parlour</option><option value="bridal">👰 Bridal Studio</option></select></F></>)}{step===3&&(<><div style={{marginBottom:14}}><div style={{fontSize:13,fontWeight:800,color:TP.tm,marginBottom:8}}>Working Days</div><div style={{display:"flex",flexWrap:"wrap",gap:7}}>{WEEK_DAYS.map(d=>{const a=data.workDays.includes(d);return(<button key={d} onClick={()=>setData(p=>({...p,workDays:a?p.workDays.filter(x=>x!==d):[...p.workDays,d]}))} style={{padding:"6px 12px",borderRadius:20,border:`2px solid ${a?TP.purple:TP.border}`,background:a?TP.purpleLight:"#fff",color:a?TP.purple:"#888",fontSize:13,fontWeight:700,cursor:"pointer",fontFamily:"inherit"}}>{d}</button>);})}</div></div><div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10}}><F label="Opens At"><select value={data.openTime} onChange={e=>setData(p=>({...p,openTime:e.target.value}))} style={{...is,marginTop:5,cursor:"pointer"}}>{[6,7,8,9,10,11].map(h=><option key={h} value={h}>{h<=12?h:h-12}:00 {h<12?"AM":"PM"}</option>)}</select></F><F label="Closes At"><select value={data.closeTime} onChange={e=>setData(p=>({...p,closeTime:e.target.value}))} style={{...is,marginTop:5,cursor:"pointer"}}>{[18,19,20,21,22].map(h=><option key={h} value={h}>{h-12}:00 PM</option>)}</select></F></div></>)}{step===4&&(<div style={{display:"flex",flexDirection:"column",gap:8,maxHeight:"42vh",overflowY:"auto",WebkitOverflowScrolling:"touch",paddingBottom:"8px"}}>{svcs.filter(s=>data.salonType==="mens"?s.gender==="male":data.salonType==="ladies"?s.gender==="female":true).map(s=>(<div key={s.id} onClick={()=>setSvcs(prev=>prev.map(sv=>sv.id===s.id?{...sv,active:!sv.active}:sv))} style={{background:s.active?TP.purpleLight:"#fafbfc",border:`2px solid ${s.active?"#c4b8f0":TP.border}`,borderRadius:12,padding:"11px 13px",display:"flex",alignItems:"center",gap:10,cursor:"pointer"}}><div style={{width:24,height:24,borderRadius:"50%",background:s.active?TP.purple:TP.border,color:"#fff",fontSize:11,flexShrink:0,fontWeight:800,display:"flex",alignItems:"center",justifyContent:"center"}}>{s.active?"✓":""}</div><span style={{fontSize:17}}>{s.emoji}</span><div style={{flex:1}}><div style={{fontWeight:800,fontSize:13,color:s.active?TP.text:"#bbb"}}>{s.name}</div><div style={{fontSize:11,color:"#aaa"}}>{s.duration} min</div></div>{s.active&&<div style={{fontWeight:800,fontSize:14,color:TP.purple}}>₹{s.price}</div>}</div>))}</div>)}{step===5&&(<><div style={{background:TP.purpleLight,border:`2px solid #c4b8f0`,borderRadius:12,padding:"14px",marginBottom:14,textAlign:"center"}}><div style={{fontSize:28,marginBottom:4}}>💬</div><div style={{fontWeight:900,fontSize:13,color:TP.purple}}>Connect WhatsApp Business</div></div><F label="WhatsApp Number"><input value={data.waNumber} onChange={e=>setData(p=>({...p,waNumber:e.target.value.replace(/\D/g,"").slice(0,10)}))} maxLength={10} inputMode="numeric" placeholder="+91 98765 43210" style={obIs}/></F></>)}{step===6&&(<div style={{textAlign:"center"}}><div style={{fontSize:50,marginBottom:10}}>🎉</div><div style={{fontWeight:900,fontSize:19,marginBottom:6,color:TP.text}}>You're all set!</div><div style={{fontSize:13,color:TP.ts,lineHeight:1.7,marginBottom:18}}>{data.salonName||"Your salon"} is now live!</div><div style={{background:TP.purpleLight,border:`2px solid #c4b8f0`,borderRadius:10,padding:"10px",fontSize:12,color:TP.purple,fontWeight:700}}>✅ Setting up your account...</div></div>)}</div>
  {step<6?(<div style={{padding:"0 20px 20px",display:"flex",gap:10}}><button onClick={()=>step>1?setStep(s=>s-1):onBack()} style={{flex:1,padding:"12px",border:`2px solid ${TP.border}`,borderRadius:12,background:"#fff",fontFamily:"inherit",fontSize:14,fontWeight:700,cursor:"pointer",color:TP.tm}}>← Back</button><button onClick={()=>{if(canNext())setStep(s=>s+1);}} style={{flex:2,padding:"12px",background:canNext()?TP.purple:"#d1d5db",border:"none",borderRadius:12,color:"#fff",fontFamily:"inherit",fontSize:14,fontWeight:800,cursor:canNext()?"pointer":"not-allowed"}}>{step===5?"Finish →":"Continue →"}</button></div>):(<div style={{padding:"0 20px 20px"}}><button onClick={handleComplete} disabled={loading} style={{width:"100%",padding:"14px",background:loading?"#c4b8f0":TP.purple,border:"none",borderRadius:12,color:"#fff",fontFamily:"inherit",fontSize:15,fontWeight:800,cursor:loading?"not-allowed":"pointer"}}>{loading?"Creating your account...":"🚀 Go to Dashboard"}</button></div>)}</div></div>);
} 
const SF=({label,hint,children})=>(<div style={{marginBottom:16}}><div style={{fontSize:13,fontWeight:800,color:"#444",marginBottom:hint?3:5}}>{label}</div>{hint&&<div style={{fontSize:11,color:"#aaa",marginBottom:5}}>{hint}</div>}{children}</div>);
const SCard=({title,icon,children,np})=>(<div style={{background:"#fff",border:`2px solid ${TP.border}`,borderRadius:16,overflow:"hidden",marginBottom:12}}><div style={{padding:"12px 16px",borderBottom:`2px solid ${TP.bg}`,display:"flex",alignItems:"center",gap:9,background:TP.purpleLight}}><div style={{width:32,height:32,borderRadius:10,background:"rgba(45,27,105,0.1)",display:"flex",alignItems:"center",justifyContent:"center",fontSize:16}}>{icon}</div><div style={{fontWeight:900,fontSize:14,color:TP.text}}>{title}</div></div><div style={np?{}:{padding:"14px 16px"}}>{children}</div></div>);
const SToggle=({val,onChange})=>(<div onClick={onChange} style={{width:44,height:24,borderRadius:12,cursor:"pointer",background:val?TP.purple:TP.border,position:"relative",transition:"background 0.2s",flexShrink:0}}><div style={{width:18,height:18,borderRadius:"50%",background:"#fff",position:"absolute",top:3,transition:"left 0.2s",left:val?"23px":"3px",boxShadow:"0 1px 4px rgba(0,0,0,0.15)"}}/></div>);
  
function ChatHistory({salonId}){
  const [conversations,setConversations]=useState([]);const [selPhone,setSelPhone]=useState(null);const [messages,setMessages]=useState([]);const [loading,setLoading]=useState(true);const [msgLoading,setMsgLoading]=useState(false);const bottomRef=useRef(null);
  useEffect(()=>{async function loadConvos(){setLoading(true);const{data}=await supabase.from("message_logs").select("phone,customer_name,direction,message,created_at").eq("salon_id",salonId).order("created_at",{ascending:false});if(data){const map={};data.forEach(m=>{if(!map[m.phone]){map[m.phone]={phone:m.phone,name:m.customer_name||m.phone,lastMsg:m.message,lastTime:m.created_at,direction:m.direction};}});setConversations(Object.values(map));}setLoading(false);}loadConvos();},[salonId]);
  async function loadMessages(phone){setMsgLoading(true);setSelPhone(phone);const{data}=await supabase.from("message_logs").select("*").eq("salon_id",salonId).eq("phone",phone).order("created_at",{ascending:true});setMessages(data||[]);setMsgLoading(false);setTimeout(()=>bottomRef.current?.scrollIntoView({behavior:"smooth"}),100);}
  function fmtTime(ts){const d=new Date(ts);return d.toLocaleTimeString("en-IN",{hour:"2-digit",minute:"2-digit",hour12:true});}
  function fmtDate(ts){return new Date(ts).toLocaleDateString("en-IN",{day:"numeric",month:"short"});}
  if(selPhone){const convo=conversations.find(c=>c.phone===selPhone);return(<div style={{flex:1,display:"flex",flexDirection:"column",height:"100%",overflow:"hidden"}}><div style={{background:"#fff",borderBottom:`2px solid ${TP.border}`,padding:"12px 14px",display:"flex",alignItems:"center",gap:10,flexShrink:0}}><button onClick={()=>setSelPhone(null)} style={{width:34,height:34,borderRadius:10,background:TP.purpleLight,border:"none",fontSize:18,cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",color:TP.purple}}>←</button><div style={{width:38,height:38,borderRadius:12,background:TP.purpleLight,display:"flex",alignItems:"center",justifyContent:"center",fontSize:16,fontWeight:900,color:TP.purple,flexShrink:0}}>{(convo?.name||"?")[0].toUpperCase()}</div><div><div style={{fontWeight:900,fontSize:14,color:TP.text}}>{convo?.name||selPhone}</div><div style={{fontSize:11,color:TP.ts}}>📱 {selPhone}</div></div></div><div style={{flex:1,overflowY:"auto",padding:"12px 14px",background:TP.bg,display:"flex",flexDirection:"column",gap:8}}>{msgLoading?<div style={{textAlign:"center",color:TP.ts,padding:32}}>Loading...</div>:messages.map((m,i)=>{const isBot=m.direction==="outbound";return(<div key={i} style={{display:"flex",justifyContent:isBot?"flex-start":"flex-end"}}><div style={{maxWidth:"80%",background:isBot?"#fff":TP.purpleLight,border:`2px solid ${isBot?TP.border:"#c4b8f0"}`,borderRadius:isBot?"4px 14px 14px 14px":"14px 4px 14px 14px",padding:"9px 12px"}}>{isBot&&<div style={{fontSize:9,fontWeight:800,color:TP.purple,marginBottom:3}}>🤖 BOT</div>}<div style={{fontSize:13,color:TP.text,lineHeight:1.5,whiteSpace:"pre-wrap"}}>{m.message}</div><div style={{fontSize:10,color:TP.ts,marginTop:4,textAlign:"right"}}>{fmtTime(m.created_at)}</div></div></div>);})}<div ref={bottomRef}/></div><div style={{background:"#fff",borderTop:`2px solid ${TP.border}`,padding:"10px 14px",flexShrink:0}}><div style={{background:TP.bg,borderRadius:10,padding:"9px 12px",fontSize:12,color:TP.ts,fontWeight:700,textAlign:"center"}}>👁️ Read-only view</div></div></div>);}
  return(<div style={{flex:1,display:"flex",flexDirection:"column",overflow:"hidden"}}><div style={{background:"#fff",padding:"12px 14px",borderBottom:`2px solid ${TP.border}`,flexShrink:0}}><div style={{fontWeight:900,fontSize:15,color:TP.text}}>💬 Bot Conversations</div><div style={{fontSize:12,color:TP.ts,marginTop:2}}>{conversations.length} customers have chatted with the bot</div></div><div style={{flex:1,overflowY:"auto"}}>{loading?<div style={{padding:32,textAlign:"center",color:TP.ts}}>Loading...</div>:conversations.length===0?(<div style={{padding:32,textAlign:"center",color:TP.ts}}><div style={{fontSize:40,marginBottom:12}}>💬</div><div style={{fontWeight:800,fontSize:14,color:TP.tm}}>No chats yet</div></div>):conversations.map((c,i)=>(<div key={i} onClick={()=>loadMessages(c.phone)} style={{display:"flex",alignItems:"center",gap:12,padding:"13px 16px",borderBottom:`2px solid ${TP.bg}`,background:"#fff",cursor:"pointer"}}><div style={{width:44,height:44,borderRadius:14,background:TP.purpleLight,display:"flex",alignItems:"center",justifyContent:"center",fontSize:18,fontWeight:900,color:TP.purple,flexShrink:0}}>{(c.name||"?")[0].toUpperCase()}</div><div style={{flex:1,minWidth:0}}><div style={{fontWeight:800,fontSize:14,marginBottom:2,color:TP.text}}>{c.name||c.phone}</div><div style={{fontSize:12,color:TP.ts,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{c.direction==="inbound"?"👤":"🤖"} {c.lastMsg}</div></div><div style={{fontSize:10,color:TP.ts,fontWeight:700,flexShrink:0,textAlign:"right"}}><div>{fmtDate(c.lastTime)}</div><div style={{marginTop:4,fontSize:14,color:TP.tg}}>›</div></div></div>))}</div></div>);
}
 
function ChangePasswordSection(){
  const [open,setOpen]=useState(false);
  const [newPass,setNewPass]=useState("");
  const [confirm,setConfirm]=useState("");
  const [status,setStatus]=useState("");
  const [loading,setLoading]=useState(false);
  const inp2={width:"100%",padding:"10px 13px",border:"1.5px solid #e5e7eb",borderRadius:10,fontSize:14,fontFamily:"inherit",outline:"none",background:"#fff",boxSizing:"border-box",color:"#0f0a2e"};
  async function handleChange(){
    if(newPass.length<6){setStatus("error:Minimum 6 characters required");return;}
    if(newPass!==confirm){setStatus("error:Passwords do not match");return;}
    setLoading(true);setStatus("");
    const{error}=await supabase.auth.updateUser({password:newPass});
    setLoading(false);
    if(error){setStatus("error:"+error.message);}
    else{setStatus("success");setNewPass("");setConfirm("");setTimeout(()=>{setOpen(false);setStatus("");},2000);}
  }
  return(
    <div style={{background:"#fff",borderRadius:14,border:"1px solid #f1f0f5",overflow:"hidden",marginBottom:10}}>
      <div onClick={()=>setOpen(o=>!o)} style={{display:"flex",alignItems:"center",justifyContent:"space-between",padding:"14px 16px",cursor:"pointer"}}>
        <div style={{display:"flex",alignItems:"center",gap:10}}>
          <div style={{width:32,height:32,borderRadius:9,background:"#f0eeff",display:"flex",alignItems:"center",justifyContent:"center",fontSize:16}}>🔑</div>
          <div style={{fontWeight:700,fontSize:15,color:"#0f0a2e"}}>Change Password</div>
        </div>
        <span style={{color:"#9ca3af",fontSize:14}}>{open?"▲":"▼"}</span>
      </div>
      {open&&<div style={{padding:"0 16px 16px",display:"flex",flexDirection:"column",gap:10}}>
        {status==="success"&&<div style={{background:"#f0fdf4",border:"1px solid #bbf7d0",borderRadius:10,padding:"10px 12px",fontSize:13,color:"#16a34a",fontWeight:700}}>✅ Password changed successfully!</div>}
        {status.startsWith("error:")&&<div style={{background:"#fff0f0",border:"1px solid #fca5a5",borderRadius:10,padding:"10px 12px",fontSize:12,color:"#dc2626",fontWeight:700}}>⚠️ {status.replace("error:","")}</div>}
        <div>
          <div style={{fontSize:12,fontWeight:600,color:"#6b7280",marginBottom:5}}>New Password</div>
          <input type="password" value={newPass} onChange={e=>setNewPass(e.target.value)} placeholder="Min. 6 characters" style={inp2} onFocus={e=>e.target.style.borderColor="#5b3fc4"} onBlur={e=>e.target.style.borderColor="#e5e7eb"}/>
        </div>
        <div>
          <div style={{fontSize:12,fontWeight:600,color:"#6b7280",marginBottom:5}}>Confirm Password</div>
          <input type="password" value={confirm} onChange={e=>setConfirm(e.target.value)} placeholder="Re-enter new password" style={inp2} onFocus={e=>e.target.style.borderColor="#5b3fc4"} onBlur={e=>e.target.style.borderColor="#e5e7eb"}/>
        </div>
        <button onClick={handleChange} disabled={loading||!newPass||!confirm} style={{padding:"11px",background:loading||!newPass||!confirm?"#d1d5db":"#5b3fc4",border:"none",borderRadius:10,color:"#fff",fontFamily:"inherit",fontSize:13,fontWeight:700,cursor:newPass&&confirm?"pointer":"not-allowed"}}>
          {loading?"Updating...":"🔑 Change Password"}
        </button>
      </div>}
    </div>
  );
}

function Settings({user,onBack,onLogout,onSalonUpdate,showRevenue,setShowRevenue}){
  const [tab,setTab]=useState("profile");const [saved,setSaved]=useState(false);const [saveError,setSaveError]=useState("");const [loading,setLoading]=useState(true);
  const [profile,setProfile]=useState({salonName:user.salon,ownerName:user.name,phone:"",email:user.email,city:user.city||"",salonType:"unisex",address:"",mapsLink:"",notifNumber:"",notifEmail:""});
  const [logoUrl,setLogoUrl]=useState(user.logo_url||null);const [logoUploading,setLogoUploading]=useState(false);const logoFileRef=useRef(null);
  const [services,setServices]=useState([{id:1,emoji:"✂️",name:"Haircut",price:250,duration:30,active:true,gender:"male"},{id:2,emoji:"✂️",name:"Haircut + Beard",price:450,duration:45,active:true,gender:"male"},{id:3,emoji:"🎨",name:"Hair Colour",price:1200,duration:90,active:true,gender:"both"},{id:4,emoji:"💆",name:"Facial + Cleanup",price:600,duration:60,active:false,gender:"both"},{id:5,emoji:"💄",name:"Bridal Makeup",price:2000,duration:90,active:false,gender:"female"}]);
  const [hours,setHours]=useState({workDays:["Mon","Tue","Wed","Thu","Fri","Sat"],openTime:9,closeTime:21});
  const [wa,setWa]=useState({number:"8307340281",botKeyword:"snipsalon"});
  const [editId,setEditId]=useState(null);const [showAdd,setShowAdd]=useState(false);const [openSection,setOpenSection]=useState(null);const [newSvc,setNewSvc]=useState({emoji:"✂️",name:"",price:"",duration:30,gender:"both"});
  const SETTING_TABS=[{id:"profile",icon:"🏪",label:"Salon"},{id:"services",icon:"💇",label:"Services"},{id:"hours",icon:"🕐",label:"Hours"},{id:"whatsapp",icon:"💬",label:"WhatsApp"},{id:"account",icon:"👤",label:"Account"}];
  useEffect(()=>{async function loadSalonData(){try{const{data:salon}=await supabase.from("salons").select("*").eq("id",user.id).single();if(salon){setProfile(p=>({...p,salonName:salon.salon_name||p.salonName,ownerName:salon.owner_name||p.ownerName,phone:salon.phone||p.phone,city:salon.city||p.city,address:salon.address||"",mapsLink:salon.maps_link||"",notifNumber:salon.notification_number||"",notifEmail:salon.notification_email||""}));if(salon.services&&salon.services.length>0)setServices(salon.services.map(s=>({...s,emoji:s.emoji||"✂️"})));if(salon.working_days&&salon.working_days.length>0)setHours(h=>({...h,workDays:salon.working_days,openTime:salon.open_time||9,closeTime:salon.close_time||21}));if(salon.bot_keyword)setWa(w=>({...w,botKeyword:salon.bot_keyword}));}}catch(e){}setLoading(false);}loadSalonData();},[user.id]);
  async function handleLogoUpload(e){const file=e.target.files[0];if(!file)return;setLogoUploading(true);try{const ext=file.name.split(".").pop()||"jpg";const path=`${user.id}/logo.${ext}`;const{error:uploadErr}=await supabase.storage.from(LOGO_BUCKET).upload(path,file,{upsert:true});if(uploadErr)throw uploadErr;const{data:urlData}=supabase.storage.from(LOGO_BUCKET).getPublicUrl(path);const newUrl=urlData.publicUrl;setLogoUrl(newUrl);await supabase.from("salons").update({logo_url:newUrl}).eq("id",user.id);onSalonUpdate(profile.salonName,newUrl);}catch(err){}setLogoUploading(false);e.target.value="";}
  async function save(){
    if((profile.phone&&profile.phone.length<10)||(profile.notifNumber&&profile.notifNumber.length<10)){
      setSaveError("Phone and Notification Number must each be exactly 10 digits");
      setTimeout(()=>setSaveError(""),3500);
      return;
    }
    setSaveError("");
    setSaved(true);
    try{await supabase.from("salons").update({salon_name:profile.salonName,owner_name:profile.ownerName,phone:profile.phone||"",city:profile.city,address:profile.address||"",maps_link:profile.mapsLink||"",whatsapp_number:wa.number||"",bot_keyword:wa.botKeyword||"",services,working_days:hours.workDays,open_time:hours.openTime,close_time:hours.closeTime,notification_number:profile.notifNumber||"",notification_email:profile.notifEmail||""}).eq("id",user.id);onSalonUpdate(profile.salonName,logoUrl);}catch(e){}setTimeout(()=>setSaved(false),2500);
  }
  async function handleLogout(){await supabase.auth.signOut();onLogout();}
  function toggleSvc(id){setServices(p=>p.map(s=>s.id===id?{...s,active:!s.active}:s));}
  function updSvc(id,f,v){setServices(p=>p.map(s=>s.id===id?{...s,[f]:v}:s));}
  function delSvc(id){setServices(p=>p.filter(s=>s.id!==id));setEditId(null);}
  function toggleDay(d){setHours(p=>({...p,workDays:p.workDays.includes(d)?p.workDays.filter(x=>x!==d):[...p.workDays,d]}));}
  const inputStyle={...is,marginTop:5};const F=SF;const Card=SCard;const Toggle=SToggle;
  const rawNum=(wa.number||"").replace(/[^0-9]/g,""); 
  const bookingLink=`https://wa.me/${rawNum.startsWith("91")?rawNum:"91"+rawNum}?text=${encodeURIComponent(`Namaste! Main ${wa.botKeyword||"snipsalon"} mein appointment book karna chahta hoon 🙏`)}`;
  const C={purple:"#2d1b69",purpleMid:"#5b3fc4",purpleLight:"#ede9fe",bg:"#f8f7ff",white:"#ffffff",text:"#0f0a2e",muted:"#6b7280",border:"#e5e7eb",green:"#16a34a"};
  const inp={width:"100%",padding:"10px 13px",border:"1.5px solid #e5e7eb",borderRadius:10,fontSize:14,fontFamily:"inherit",outline:"none",background:"#fff",boxSizing:"border-box",color:"#0f0a2e"};
  const sectionTitle=(icon,title)=>(<div style={{display:"flex",alignItems:"center",gap:10,padding:"14px 16px 10px"}}><div style={{width:32,height:32,borderRadius:9,background:"#f0eeff",display:"flex",alignItems:"center",justifyContent:"center",fontSize:16}}>{icon}</div><div style={{fontWeight:700,fontSize:15,color:"#0f0a2e",letterSpacing:"-0.2px"}}>{title}</div></div>);
  const Divider=()=><div style={{height:1,background:"#f1f0f5",margin:"0 16px"}}/>;
  const FieldLabel=({children})=><div style={{fontSize:12,fontWeight:600,color:"#6b7280",marginBottom:5}}>{children}</div>;
  if(loading)return<div style={{flex:1,display:"flex",alignItems:"center",justifyContent:"center",fontSize:14,color:TP.ts}}>Loading...</div>;
  return(<div style={{flex:1,display:"flex",flexDirection:"column",overflow:"hidden",background:"#f8f7ff"}}>
    <div style={{background:"#fff",padding:"14px 18px 12px",display:"flex",alignItems:"center",justifyContent:"space-between",borderBottom:"1px solid #f1f0f5",flexShrink:0}}>
      <div style={{display:"flex",alignItems:"center",gap:10}}>
        <button onClick={onBack} style={{width:34,height:34,borderRadius:10,background:"#f5f3ff",border:"1px solid #e0d8ff",display:"flex",alignItems:"center",justifyContent:"center",fontSize:16,color:"#5b3fc4",cursor:"pointer",fontWeight:600}}>←</button>
        <div><div style={{fontWeight:800,fontSize:16,color:"#0f0a2e",letterSpacing:"-0.3px"}}>Settings</div><div style={{fontSize:11,color:"#9b8ec4",marginTop:2,fontWeight:500}}>Manage your salon</div></div>
      </div>
    </div>
    <div style={{background:"#fff",borderBottom:"1px solid #f1f0f5",display:"flex",flexShrink:0}}>
      {SETTING_TABS.map(t=>(<div key={t.id} onClick={()=>setTab(t.id)} style={{flex:1,padding:"10px 2px 8px",display:"flex",flexDirection:"column",alignItems:"center",gap:3,cursor:"pointer",borderBottom:`2.5px solid ${tab===t.id?"#5b3fc4":"transparent"}`}}><span style={{fontSize:18}}>{t.icon}</span><span style={{fontSize:10,fontWeight:tab===t.id?700:500,color:tab===t.id?"#5b3fc4":"#9ca3af",letterSpacing:"-0.1px"}}>{t.label}</span></div>))}
    </div>
    <div style={{flex:1,overflowY:"auto",padding:"14px 14px 80px"}}>
      {tab==="profile"&&(<div style={{flex:1,overflowY:"auto",paddingBottom:80}}>
        <input ref={logoFileRef} type="file" accept="image/*" style={{display:"none"}} onChange={handleLogoUpload}/>
        <div style={{background:"#fff",borderRadius:14,margin:"12px 16px 0",border:"1px solid #f1f0f5",overflow:"hidden"}}>{sectionTitle("🖼️","Salon Logo")}<Divider/><div style={{padding:"14px 16px",display:"flex",alignItems:"center",gap:14}}><div style={{width:64,height:64,borderRadius:14,overflow:"hidden",border:"1.5px solid #e5e7eb",background:"#f8f7ff",display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}>{logoUrl?<img src={logoUrl} alt="logo" style={{width:"100%",height:"100%",objectFit:"cover"}}/>:<span style={{fontSize:26}}>✂️</span>}</div><div style={{flex:1}}><div style={{fontWeight:600,fontSize:13,color:"#0f0a2e",marginBottom:8}}>{logoUrl?"Logo uploaded ✅":"No logo yet"}</div><button onClick={()=>logoFileRef.current?.click()} style={{display:"flex",alignItems:"center",gap:6,padding:"8px 16px",background:"#f0eeff",border:"1.5px solid #ddd6fe",borderRadius:10,color:"#5b3fc4",fontFamily:"inherit",fontSize:12,fontWeight:700,cursor:"pointer"}}>📤 {logoUploading?"Uploading...":"Upload Logo"}</button></div></div></div>
        <div style={{background:"#fff",borderRadius:14,margin:"10px 16px 0",border:"1px solid #f1f0f5",overflow:"hidden"}}>{sectionTitle("🏪","Salon Details")}<Divider/><div style={{padding:"14px 16px",display:"flex",flexDirection:"column",gap:12}}>{[{label:"Salon Name",key:"salonName",placeholder:"e.g. Style Adda"},{label:"Owner Name",key:"ownerName",placeholder:"e.g. Rahul Sharma"},{label:"Phone Number",key:"phone",placeholder:"9876543210"},{label:"City",key:"city",placeholder:"e.g. Delhi"},{label:"Address",key:"address",placeholder:"e.g. Shop 12, MG Road"},{label:"Google Maps Link",key:"mapsLink",placeholder:"https://maps.google.com/..."},{label:"Notification Number",key:"notifNumber",placeholder:"9876543210"},{label:"Notification Email",key:"notifEmail",placeholder:"you@gmail.com",isEmail:true}].map(f=>{const isPhoneField=f.key==="phone"||f.key==="notifNumber";const val=profile[f.key]||"";const tooShort=isPhoneField&&val.length>0&&val.length<10;return(<div key={f.key}><FieldLabel>{f.label}</FieldLabel><input type={f.isEmail?"email":"text"} value={val} onChange={e=>setProfile(p=>({...p,[f.key]:isPhoneField?e.target.value.replace(/\D/g,"").slice(0,10):e.target.value}))} placeholder={f.placeholder} maxLength={isPhoneField?10:undefined} inputMode={isPhoneField?"numeric":undefined} style={inp} onFocus={e=>e.target.style.borderColor="#5b3fc4"} onBlur={e=>e.target.style.borderColor="#e5e7eb"}/>{isPhoneField&&<div style={{fontSize:10,color:tooShort?"#dc2626":"#9ca3af",marginTop:4,fontWeight:tooShort?700:500}}>{tooShort?`⚠️ Only ${val.length} digits entered — `:""}Must be exactly 10 digits</div>}{f.key==="notifEmail"&&<div style={{fontSize:10,color:"#9ca3af",marginTop:4}}>Booking confirmation emails will be sent to this address</div>}</div>);})}</div></div>
        <div style={{background:"#fff",borderRadius:14,margin:"10px 16px 0",border:"1px solid #f1f0f5",overflow:"hidden"}}>{sectionTitle("👨‍💼","Staff Settings")}<Divider/><div style={{padding:"14px 16px",display:"flex",alignItems:"center",justifyContent:"space-between"}}><div><div style={{fontWeight:600,fontSize:13,color:"#0f0a2e"}}>Show Revenue to Staff?</div><div style={{fontSize:11,color:"#6b7280",marginTop:2}}>{showRevenue?"Staff can see their earnings":"Revenue hidden from staff"}</div></div><Toggle val={showRevenue} onChange={()=>setShowRevenue(v=>!v)}/></div></div>
      </div>)}
      {tab==="services"&&(<div style={{flex:1,overflowY:"auto",padding:"12px 16px 80px"}}>{["male","female"].map(gs=>{const sectionSvcs=services.filter(s=>(s.gender||"both")===gs||(s.gender||"both")==="both");const sc=gs==="male"?TP.purpleMid:"#db2777";const sb=gs==="male"?TP.purpleLight:"#fff0f6";const sbd=gs==="male"?"#c4b8f0":"#f9a8d4";const sl=gs==="male"?"👨 Male Services":"👩 Female Services";if(profile.salonType==="mens"&&gs==="female")return null;if(profile.salonType==="ladies"&&gs==="male")return null;const isOpen=openSection===gs;const isAdding=showAdd===gs;return(<div key={gs} style={{background:"#fff",border:`2px solid ${isOpen?sc:sbd}`,borderRadius:16,overflow:"hidden",marginBottom:12}}><div onClick={()=>{setOpenSection(isOpen?null:gs);setShowAdd(false);setEditId(null);}} style={{padding:"14px 16px",background:isOpen?sb:"#fff",display:"flex",alignItems:"center",justifyContent:"space-between",cursor:"pointer"}}><div style={{display:"flex",alignItems:"center",gap:10}}><div style={{fontWeight:900,fontSize:14,color:isOpen?sc:TP.text}}>{sl}</div><div style={{background:isOpen?sc+"22":TP.bg,color:isOpen?sc:TP.ts,fontSize:11,fontWeight:800,padding:"2px 8px",borderRadius:20}}>{sectionSvcs.filter(s=>s.active).length} services</div></div><div style={{fontSize:16,color:isOpen?sc:"#aaa",transform:isOpen?"rotate(180deg)":"none"}}>⌄</div></div>{isOpen&&<>{sectionSvcs.map(s=>(<div key={s.id}>{editId===s.id?(<div style={{padding:"13px 14px",borderBottom:`2px solid ${TP.bg}`,background:TP.bg}}><div style={{fontWeight:800,fontSize:13,color:sc,marginBottom:9}}>✏️ {s.name}</div><div style={{display:"grid",gridTemplateColumns:"46px 1fr",gap:7,marginBottom:9}}><select value={s.emoji} onChange={e=>updSvc(s.id,"emoji",e.target.value)} style={{...is,fontSize:18,textAlign:"center",padding:"8px 4px",height:44,marginTop:0}}>{EMOJIS.map(em=><option key={em} value={em}>{em}</option>)}</select><input value={s.name} onChange={e=>updSvc(s.id,"name",e.target.value)} style={{...is,height:44}}/></div><div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8,marginBottom:11}}><div><div style={{fontSize:12,fontWeight:700,color:TP.tm,marginBottom:4}}>Price (₹)</div><input type="number" value={s.price} onChange={e=>updSvc(s.id,"price",parseInt(e.target.value)||0)} style={is}/></div><div><div style={{fontSize:12,fontWeight:700,color:TP.tm,marginBottom:4}}>Duration</div><select value={s.duration} onChange={e=>updSvc(s.id,"duration",parseInt(e.target.value))} style={{...is,cursor:"pointer"}}>{[15,30,45,60,75,90,120].map(d=><option key={d} value={d}>{d} min</option>)}</select></div></div><div style={{display:"flex",gap:8}}><button onClick={()=>setEditId(null)} style={{flex:1,padding:"10px",background:sc,border:"none",borderRadius:10,color:"#fff",fontFamily:"inherit",fontSize:13,fontWeight:800,cursor:"pointer"}}>✓ Done</button><button onClick={()=>delSvc(s.id)} style={{padding:"10px 14px",background:TP.red,border:`2px solid ${TP.rb}`,borderRadius:10,color:TP.rt,fontFamily:"inherit",fontSize:13,cursor:"pointer"}}>🗑</button></div></div>):(<div onClick={()=>toggleSvc(s.id)} style={{display:"flex",alignItems:"center",gap:11,padding:"12px 14px",borderBottom:`2px solid ${TP.bg}`,background:s.active?"#fff":TP.bg,cursor:"pointer"}}><div style={{width:22,height:22,borderRadius:"50%",background:s.active?sc:TP.border,color:"#fff",fontSize:10,fontWeight:800,flexShrink:0,display:"flex",alignItems:"center",justifyContent:"center"}}>{s.active?"✓":""}</div><span style={{fontSize:18,flexShrink:0}}>{s.emoji}</span><div style={{flex:1}}><div style={{fontWeight:800,fontSize:13,color:s.active?TP.text:"#aaa"}}>{s.name}</div><div style={{fontSize:11,color:"#aaa"}}>{s.duration} min</div></div><div style={{fontWeight:800,fontSize:13,color:s.active?sc:"#ccc"}}>₹{s.price}</div><button onClick={e=>{e.stopPropagation();setEditId(s.id);}} style={{width:30,height:30,border:`2px solid ${TP.border}`,borderRadius:8,background:"#fff",cursor:"pointer",fontSize:13,display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}>✏️</button></div>)}</div>))}{isAdding?(<div style={{padding:"13px 14px",background:sb}}><div style={{fontWeight:800,fontSize:13,color:sc,marginBottom:9}}>➕ New Service</div><div style={{display:"grid",gridTemplateColumns:"46px 1fr",gap:7,marginBottom:9}}><select value={newSvc.emoji} onChange={e=>setNewSvc(p=>({...p,emoji:e.target.value}))} style={{...is,fontSize:18,textAlign:"center",padding:"8px 4px",height:44,marginTop:0}}>{EMOJIS.map(em=><option key={em} value={em}>{em}</option>)}</select><input value={newSvc.name} onChange={e=>setNewSvc(p=>({...p,name:e.target.value}))} placeholder="Service name" style={{...is,height:44}}/></div><div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8,marginBottom:11}}><div><div style={{fontSize:12,fontWeight:700,color:TP.tm,marginBottom:4}}>Price (₹)</div><input type="number" value={newSvc.price} onChange={e=>setNewSvc(p=>({...p,price:e.target.value}))} placeholder="450" style={is}/></div><div><div style={{fontSize:12,fontWeight:700,color:TP.tm,marginBottom:4}}>Duration</div><select value={newSvc.duration} onChange={e=>setNewSvc(p=>({...p,duration:parseInt(e.target.value)}))} style={{...is,cursor:"pointer"}}>{[15,30,45,60,75,90,120].map(d=><option key={d} value={d}>{d} min</option>)}</select></div></div><div style={{display:"flex",gap:8}}><button onClick={()=>{if(!newSvc.name.trim())return;setServices(p=>[...p,{id:Date.now(),emoji:newSvc.emoji,name:newSvc.name.trim(),price:parseInt(newSvc.price)||0,duration:newSvc.duration,active:true,gender:gs}]);setNewSvc({emoji:"✂️",name:"",price:"",duration:30,gender:"both"});setShowAdd(false);}} style={{flex:1,padding:"10px",background:sc,border:"none",borderRadius:10,color:"#fff",fontFamily:"inherit",fontSize:13,fontWeight:800,cursor:"pointer"}}>➕ Add</button><button onClick={()=>setShowAdd(false)} style={{padding:"10px 14px",background:"#fff",border:`2px solid ${TP.border}`,borderRadius:10,fontFamily:"inherit",fontSize:13,cursor:"pointer",color:"#888"}}>Cancel</button></div></div>):(<div style={{padding:"11px 14px"}}><button onClick={()=>{setShowAdd(gs);setNewSvc({emoji:"✂️",name:"",price:"",duration:30,gender:gs});}} style={{width:"100%",padding:"10px",background:sb,border:`2px dashed ${sbd}`,borderRadius:11,color:sc,fontFamily:"inherit",fontSize:13,fontWeight:800,cursor:"pointer"}}>➕ Add Service</button></div>)}</>}</div>);})} </div>)}
      {tab==="hours"&&(<div style={{flex:1,overflowY:"auto",paddingBottom:80}}><div style={{background:"#fff",borderRadius:14,margin:"12px 16px 0",border:"1px solid #f1f0f5",overflow:"hidden"}}>{sectionTitle("📅","Working Days")}<Divider/><div style={{padding:"14px 16px",display:"flex",flexWrap:"wrap",gap:8}}>{WEEK_DAYS.map(d=>{const a=hours.workDays.includes(d);return(<button key={d} onClick={()=>toggleDay(d)} style={{padding:"8px 16px",borderRadius:20,border:`1.5px solid ${a?"#5b3fc4":"#e5e7eb"}`,background:a?"#5b3fc4":"#fff",color:a?"#fff":"#374151",fontSize:13,fontWeight:600,cursor:"pointer",fontFamily:"inherit"}}>{d}</button>);})}</div></div><div style={{background:"#fff",borderRadius:14,margin:"10px 16px 0",border:"1px solid #f1f0f5",overflow:"hidden"}}>{sectionTitle("🕐","Timings")}<Divider/><div style={{padding:"14px 16px"}}><div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12,marginBottom:12}}><div><FieldLabel>Opens At</FieldLabel><select value={hours.openTime} onChange={e=>setHours(p=>({...p,openTime:parseInt(e.target.value)}))} style={{...inp,cursor:"pointer"}}>{HOURS_LIST.filter(h=>h.val<=14).map(h=><option key={h.val} value={h.val}>{h.label}</option>)}</select></div><div><FieldLabel>Closes At</FieldLabel><select value={hours.closeTime} onChange={e=>setHours(p=>({...p,closeTime:parseInt(e.target.value)}))} style={{...inp,cursor:"pointer"}}>{HOURS_LIST.filter(h=>h.val>=12).map(h=><option key={h.val} value={h.val}>{h.label}</option>)}</select></div></div><div style={{background:"#f0eeff",border:"1px solid #ddd6fe",borderRadius:10,padding:"10px 14px",fontSize:13,color:"#5b3fc4",fontWeight:600}}>🕐 {hours.openTime}:00 AM → {hours.closeTime>12?hours.closeTime-12:hours.closeTime}:00 PM</div></div></div></div>)}
      {tab==="whatsapp"&&(<div style={{flex:1,overflowY:"auto",paddingBottom:80}}><div style={{background:"#fff",borderRadius:14,margin:"12px 16px 0",border:"1px solid #f1f0f5",overflow:"hidden"}}>{sectionTitle("💬","SnipBook Bot Number")}<Divider/><div style={{padding:"14px 16px",display:"flex",flexDirection:"column",gap:12}}><div><FieldLabel>This is fixed — do not change</FieldLabel><input value={wa.number} readOnly style={{...inp,background:"#f3f2fa",color:"#6b7280",cursor:"not-allowed"}}/></div></div></div><div style={{background:"#fff",borderRadius:14,margin:"10px 16px 0",border:"1px solid #f1f0f5",overflow:"hidden"}}>{sectionTitle("🔗","Booking Link & QR")}<Divider/><div style={{padding:"14px 16px",display:"flex",flexDirection:"column",gap:12}}><div><FieldLabel>Bot Keyword</FieldLabel><input value={wa.botKeyword||""} onChange={e=>setWa(p=>({...p,botKeyword:e.target.value}))} placeholder="e.g. snipsalon" style={inp} onFocus={e=>e.target.style.borderColor="#5b3fc4"} onBlur={e=>e.target.style.borderColor="#e5e7eb"}/></div><div><FieldLabel>Booking Link</FieldLabel><div style={{display:"flex",alignItems:"center",gap:8,background:"#f8f7ff",border:"1px solid #e5e7eb",borderRadius:10,padding:"10px 12px"}}><span style={{flex:1,fontSize:11,color:"#6b7280",overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{bookingLink}</span><button onClick={()=>navigator.clipboard.writeText(bookingLink)} style={{background:"none",border:"none",cursor:"pointer",fontSize:16,flexShrink:0}}>📋</button></div></div><button onClick={()=>window.open(`https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(bookingLink)}`,"_blank")} style={{width:"100%",padding:"11px",background:"#5b3fc4",border:"none",borderRadius:10,color:"#fff",fontFamily:"inherit",fontSize:13,fontWeight:700,cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",gap:6}}>📷 Generate QR Code</button></div></div></div>)}
      {tab==="account"&&(<div style={{flex:1,overflowY:"auto",padding:"12px 16px 80px"}}><div style={{background:"linear-gradient(135deg,#2d1b69,#5b3fc4)",borderRadius:16,padding:"18px",marginBottom:10}}><div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:14}}><div><div style={{fontSize:11,color:"rgba(255,255,255,0.55)",fontWeight:500,marginBottom:4}}>Current Plan</div><div style={{fontWeight:800,fontSize:22,color:"#fff",letterSpacing:"-0.4px"}}>⚡ Early Access</div></div><div style={{background:"rgba(255,255,255,0.15)",borderRadius:20,padding:"4px 12px",fontSize:11,color:"#c4b8f0",fontWeight:600}}>Beta User 🎉</div></div><button style={{width:"100%",padding:"11px",background:"rgba(255,255,255,0.15)",border:"1.5px solid rgba(255,255,255,0.25)",borderRadius:12,color:"#fff",fontFamily:"inherit",fontSize:13,fontWeight:700,cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",gap:6}}>✉️ Contact for Pricing</button></div>
        <div style={{background:"#fff",borderRadius:14,border:"1px solid #f1f0f5",overflow:"hidden",marginBottom:10}}>{sectionTitle("👤","Account Info")}<Divider/><div style={{padding:"12px 16px",display:"flex",flexDirection:"column",gap:10}}><div style={{display:"flex",alignItems:"center",gap:10}}><span style={{fontSize:14}}>📧</span><span style={{fontSize:13,color:"#374151"}}>{user.email}</span></div><div style={{display:"flex",alignItems:"center",gap:10}}><span style={{fontSize:14}}>🏪</span><span style={{fontSize:13,color:"#374151"}}>{user.salon}</span></div></div></div>
        <ChangePasswordSection/>
        <button onClick={handleLogout} style={{width:"100%",padding:"14px",background:"#fff",border:"1.5px solid #fca5a5",borderRadius:14,color:"#dc2626",fontFamily:"inherit",fontSize:14,fontWeight:700,cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",gap:6}}>🚪 Logout</button></div>)}
    </div>
    {tab!=="account"&&(<div style={{background:"#fff",borderTop:"1px solid #f1f0f5",padding:"12px 16px",flexShrink:0,boxShadow:"0 -2px 12px rgba(0,0,0,0.04)"}}>{saveError&&<div style={{background:"#fff0f0",border:"1.5px solid #fca5a5",borderRadius:10,padding:"8px 12px",marginBottom:8,fontSize:12,color:"#dc2626",fontWeight:700,textAlign:"center"}}>⚠️ {saveError}</div>}<button onClick={save} style={{width:"100%",padding:"14px",background:saved?"#f0eeff":"#5b3fc4",border:saved?"1.5px solid #ddd6fe":"none",borderRadius:12,color:saved?"#5b3fc4":"#fff",fontFamily:"inherit",fontSize:14,fontWeight:700,cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",gap:6,letterSpacing:"-0.1px"}}>{saved?"✅ Saved!":"💾 Save Changes"}</button></div>)}
  </div>);
}

function StaffSalonEntry({onFound,onBack}){
  const [phone,setPhone]=useState("");const [pin,setPin]=useState("");const [loading,setLoading]=useState(false);const [error,setError]=useState("");
  async function handleLogin(){if(!phone.trim()){setError("Please enter your phone number!");return;}if(!pin||pin.length!==4){setError("Please enter your 4-digit PIN!");return;}setLoading(true);setError("");try{const{data:staffData}=await supabase.from("staff").select("*").eq("phone",phone.trim()).single();if(!staffData){setError("No staff member found with this number!");setLoading(false);return;}if(staffData.locked_until&&new Date(staffData.locked_until)>new Date()){const mins=Math.ceil((new Date(staffData.locked_until)-new Date())/60000);setError(`Account locked. ${mins} minutes. Please try again later.`);setLoading(false);return;}if(staffData.pin!==pin){const attempts=(staffData.pin_attempts||0)+1;if(attempts>=3){const lockUntil=new Date(Date.now()+15*60*1000).toISOString();await supabase.from("staff").update({pin_attempts:0,locked_until:lockUntil}).eq("id",staffData.id);setError("3 incorrect PIN attempts. Account locked for 15 minutes.");}else{await supabase.from("staff").update({pin_attempts:attempts}).eq("id",staffData.id);setError(`Incorrect PIN! ${3-attempts} attempts remaining.`);}setPin("");setLoading(false);return;}await supabase.from("staff").update({pin_attempts:0,locked_until:null}).eq("id",staffData.id);onFound(staffData);}catch(e){setError("No staff member found!");}setLoading(false);}
  return(<div style={{minHeight:"100vh",background:`linear-gradient(135deg,${TP.purple},${TP.purpleMid})`,display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",padding:"24px 20px",fontFamily:"system-ui,sans-serif"}}><div style={{fontSize:28,fontWeight:900,color:"#fff",marginBottom:4}}>✂️ SnipBook</div><div style={{fontSize:13,color:"rgba(255,255,255,0.6)",marginBottom:32}}>Staff Portal</div><div style={{background:"#fff",borderRadius:20,padding:"26px 22px",width:"100%",maxWidth:360,boxShadow:"0 16px 48px rgba(0,0,0,0.3)"}}><div style={{fontWeight:900,fontSize:17,marginBottom:4,color:TP.text}}>Staff Login</div><div style={{fontSize:13,color:TP.ts,marginBottom:20}}>Enter your phone number and PIN</div><div style={{marginBottom:14}}><div style={{fontSize:13,fontWeight:800,color:TP.tm,marginBottom:6}}>Phone Number</div><input style={obIs} placeholder="9876543210" value={phone} onChange={e=>setPhone(e.target.value.replace(/\D/g,"").slice(0,10))} autoFocus/></div><div style={{marginBottom:18}}><div style={{fontSize:13,fontWeight:800,color:TP.tm,marginBottom:6}}>4-digit PIN</div><input style={obIs} type="password" placeholder="••••" maxLength={4} value={pin} onChange={e=>{setPin(e.target.value);setError("");}} onKeyDown={e=>e.key==="Enter"&&handleLogin()}/></div>{error&&<div style={{background:TP.red,border:`1.5px solid ${TP.rb}`,borderRadius:9,padding:"9px 12px",marginBottom:14,fontSize:12,color:TP.rt,fontWeight:600}}>⚠️ {error}</div>}<button onClick={handleLogin} style={{width:"100%",padding:"13px",background:loading?"#c4b8f0":TP.purple,border:"none",borderRadius:12,color:"#fff",fontFamily:"inherit",fontSize:15,fontWeight:800,cursor:"pointer",marginBottom:12}}>{loading?"Logging in...":"Login →"}</button><button onClick={onBack} style={{width:"100%",background:"none",border:"none",color:"#888",fontSize:13,fontWeight:700,cursor:"pointer",fontFamily:"inherit"}}>← Back</button></div></div>);
}

const NAV=[{id:"dashboard",icon:"🏠",label:"Home"},{id:"calendar",icon:"📅",label:"Calendar"},{id:"clients",icon:"👥",label:"Clients"},{id:"staff",icon:"👨‍💼",label:"Staff"},{id:"history",icon:"📋",label:"History"},{id:"engage",icon:"💫",label:"Engage"},{id:"settings",icon:"⚙️",label:"Settings"}];

const OWNER_LOG_SERVICES=["Haircut","Hair Color","Facial","Waxing","Bridal Makeup","Manicure","Pedicure","Head Massage","Threading","Blowdry","Keratin","Hair Spa"];

function RevenueDetailModal({rows,staffMap,onClose}){
  const total=rows.reduce((s,r)=>s+(r.amount||0),0);
  return(
    <div onClick={e=>e.target===e.currentTarget&&onClose()} style={{position:"fixed",inset:0,background:"rgba(0,0,0,0.5)",zIndex:900,display:"flex",alignItems:"flex-end"}}>
      <div style={{background:"#fff",borderRadius:"20px 20px 0 0",width:"100%",maxHeight:"85vh",display:"flex",flexDirection:"column"}}>
        <div style={{padding:"16px 18px 12px",borderBottom:"1px solid #f1f0f5",flexShrink:0}}>
          <div style={{width:36,height:4,background:"#e0d8ff",borderRadius:2,margin:"0 auto 14px"}}/>
          <div style={{display:"flex",alignItems:"center",justifyContent:"space-between"}}>
            <div>
              <div style={{fontWeight:900,fontSize:16,color:"#0f0a2e"}}>Today's Services</div>
              <div style={{fontSize:11,color:"#9b8ec4",marginTop:2}}>{rows.length} entries · ₹{total.toLocaleString("en-IN")}</div>
            </div>
            <button onClick={onClose} style={{background:"#f1f0f5",border:"none",borderRadius:8,padding:"6px 10px",fontSize:13,cursor:"pointer",color:"#555",fontWeight:700}}>✕</button>
          </div>
        </div>
        <div style={{flex:1,overflowY:"auto",padding:"6px 18px 24px"}}>
          {rows.length===0
            ?<div style={{textAlign:"center",color:"#aaa",padding:"32px 0",fontSize:13}}>No services recorded today</div>
            :rows.map((r,i)=>(
              <div key={r.id||i} style={{display:"flex",alignItems:"center",gap:10,padding:"11px 0",borderBottom:"1px solid #f4f2ff"}}>
                <div style={{width:36,height:36,borderRadius:10,background:"#ede9fe",display:"flex",alignItems:"center",justifyContent:"center",fontSize:14,flexShrink:0,fontWeight:800,color:"#5b3fc4"}}>{(r.client_name||"?").slice(0,2).toUpperCase()}</div>
                <div style={{flex:1,minWidth:0}}>
                  <div style={{fontSize:13,fontWeight:700,color:"#0f0a2e"}}>{r.client_name}</div>
                  <div style={{fontSize:11,color:"#6b7280",marginTop:1}}>{r.service}</div>
                  <div style={{fontSize:11,color:"#5b3fc4",marginTop:1,fontWeight:600}}>👤 {staffMap?.[r.staff_id]||"Staff"}</div>
                </div>
                <div style={{fontSize:13,fontWeight:800,color:"#16a34a",flexShrink:0}}>₹{(r.amount||0).toLocaleString("en-IN")}</div>
              </div>
            ))
          }
        </div>
      </div>
    </div>
  );
}

function OwnerStagedPhotoItem({photo,onRemove}){
  const [removing,setRemoving]=useState(false);
  async function handleRemove(){
    if(photo?.path){setRemoving(true);await supabase.storage.from(BUCKET).remove([photo.path]);setRemoving(false);}
    onRemove();
  }
  return(
    <div style={{position:"relative",flexShrink:0,width:80,height:80}}>
      <img src={photo.url} alt="visit" style={{width:80,height:80,borderRadius:12,objectFit:"cover",border:`2px solid ${TP.border}`,display:"block"}}/>
      {removing
        ?<div style={{position:"absolute",inset:0,background:"rgba(0,0,0,0.5)",borderRadius:12,display:"flex",alignItems:"center",justifyContent:"center"}}><div style={{fontSize:10,color:"white",fontWeight:800}}>...</div></div>
        :<button onClick={handleRemove} style={{position:"absolute",top:-6,left:-6,width:20,height:20,borderRadius:"50%",background:TP.rt,border:"2px solid white",color:"white",fontSize:11,cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",fontWeight:900,zIndex:10,padding:0}}>✕</button>}
    </div>
  );
}

function OwnerStagedAddPhotoBtn({tempId,onAdd}){
  const fileRef=useRef();
  const [uploading,setUploading]=useState(false);
  async function handleFileChange(e){
    const file=e.target.files[0];
    if(!file)return;
    setUploading(true);
    try{
      const ext=file.name.split(".").pop()||"jpg";
      const path=`${tempId}/photo_${Date.now()}.${ext}`;
      const{error}=await supabase.storage.from(BUCKET).upload(path,file,{upsert:true});
      if(error){setUploading(false);return;}
      const{data:urlData}=supabase.storage.from(BUCKET).getPublicUrl(path);
      onAdd({url:urlData.publicUrl,path});
    }catch(err){}
    setUploading(false);
    e.target.value="";
  }
  return(
    <div style={{flexShrink:0}}>
      <input ref={fileRef} type="file" accept="image/*" style={{display:"none"}} onChange={handleFileChange}/>
      <div onClick={()=>!uploading&&fileRef.current?.click()} style={{width:80,height:80,borderRadius:12,cursor:uploading?"wait":"pointer",background:TP.sub,border:`2px dashed ${TP.border}`,display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",gap:4}}>
        {uploading
          ?<div style={{fontSize:10,color:TP.ts,fontWeight:700}}>Uploading...</div>
          :<><div style={{fontSize:26,color:TP.purple,fontWeight:900,lineHeight:1}}>+</div><div style={{fontSize:9,color:TP.ts,fontWeight:700}}>Add Photo</div></>}
      </div>
    </div>
  );
}

function OwnerWorkLogModal({salonId,salonName,onSave,onClose}){
  const [clientName,setClientName]=useState("");
  const [clientPhone,setClientPhone]=useState("");
  const [service,setService]=useState(OWNER_LOG_SERVICES[0]);
  const [amount,setAmount]=useState("");
  const [date,setDate]=useState(dateKey(new Date()));
  const [saving,setSaving]=useState(false);
  const [showNewCustomer,setShowNewCustomer]=useState(false);
  const [newCustPhone,setNewCustPhone]=useState("");
  const [newCustDob,setNewCustDob]=useState("");
  const [newCustGender,setNewCustGender]=useState("male");
  const [savingCustomer,setSavingCustomer]=useState(false);
  const [pendingLogData,setPendingLogData]=useState(null);
  const [waPromptData,setWaPromptData]=useState(null);
  const [waSending,setWaSending]=useState(false);
  const [waStatus,setWaStatus]=useState("idle");
  const [ambiguousCustomers,setAmbiguousCustomers]=useState([]);
  const [showPickCustomer,setShowPickCustomer]=useState(false); // idle | sending | sent | error
  const [notes,setNotes]=useState("");
  const [photos,setPhotos]=useState([]);
  const [tempVisitId]=useState(()=>`owner_${Date.now()}_${Math.random().toString(36).slice(2,8)}`);

  useEffect(()=>{
    const prevOverflow=document.body.style.overflow;
    document.body.style.overflow="hidden";
    return()=>{document.body.style.overflow=prevOverflow;};
  },[]);

  async function handleCancel(){
    if(photos.length>0){
      const paths=photos.map(p=>p.path).filter(Boolean);
      if(paths.length>0){try{await supabase.storage.from(BUCKET).remove(paths);}catch(e){}}
    }
    onClose();
  }

  async function getOwnerStaffId(){
    const{data:existing}=await supabase.from("staff").select("id").eq("salon_id",salonId).eq("name","Owner").maybeSingle();
    if(existing?.id)return existing.id;
    const{data:created}=await supabase.from("staff").insert({salon_id:salonId,name:"Owner",role:"Owner",phone:"",salary:0,pin:"0000"}).select().single();
    return created?.id;
  }

  async function saveLog(logData){
    try{
      const ownerStaffId=await getOwnerStaffId();
      if(!ownerStaffId){onClose();return;}
      await supabase.from("work_logs").insert({
        salon_id:salonId,staff_id:ownerStaffId,client_name:logData.clientName,
        service:logData.service,amount:logData.amount,date:logData.date
      });
      let customerId=logData.customerId||null;
      if(!customerId){
        const{data:custMatches}=await supabase.from("customers").select("id").eq("salon_id",salonId).eq("name",logData.clientName).limit(1);
        customerId=custMatches?.[0]?.id||null;
      }
      if(customerId){
        await supabase.from("visit_history").insert({
          salon_id:salonId,customer_id:customerId,date:logData.date,
          services:[logData.service],stylist:ownerStaffId,amount:logData.amount,notes:logData.notes||"",photos:logData.photos||[]
        });
      }
      onSave({client_name:logData.clientName,service:logData.service,amount:logData.amount,date:logData.date,staff_id:ownerStaffId});
      const phone10=(logData.clientPhone||"").replace(/\D/g,"").slice(0,10);
      if(phone10.length===10){
        setWaPromptData({phone:phone10,name:logData.clientName,service:logData.service,amount:logData.amount,date:logData.date,notes:logData.notes||""});
        setWaStatus("idle");
      }else{
        onClose();
      }
    }catch(e){console.error(e);onClose();}
  }

  async function save(){
    if(!clientName.trim()||!amount||isNaN(amount))return;
    setSaving(true);
    const base={clientName:clientName.trim(),clientPhone:clientPhone,service,amount:Number(amount),date,notes,photos};
    try{
      const phone10=clientPhone.replace(/\D/g,"").slice(0,10);
      if(phone10.length===10){
        // Phone diya phone-first — most reliable, eliminates name-clash risk
        const{data:byPhone}=await supabase.from("customers").select("id").eq("salon_id",salonId).ilike("phone",`%${phone10}%`);
        if(byPhone&&byPhone.length>0){
          await saveLog({...base,customerId:byPhone[0].id});
        }else{
          const{data:newCust}=await supabase.from("customers").insert({salon_id:salonId,name:base.clientName,phone:phone10,gender:"male"}).select().single();
          await saveLog({...base,customerId:newCust?.id||null});
        }
        return;
      }
      // No phone given — fallback to name match
      const{data:existingCustomers}=await supabase.from("customers").select("id,name,phone,last_visit").eq("salon_id",salonId).eq("name",base.clientName);
      if(!existingCustomers||existingCustomers.length===0){
        setPendingLogData(base);
        setSaving(false);
        setShowNewCustomer(true);
        return;
      }
      if(existingCustomers.length>1){
        setAmbiguousCustomers(existingCustomers);
        setPendingLogData(base);
        setSaving(false);
        setShowPickCustomer(true);
        return;
      }
      await saveLog({...base,customerId:existingCustomers[0].id});
    }catch(e){
      setPendingLogData(base);
      setSaving(false);
      setShowNewCustomer(true);
    }
  }

  async function saveNewCustomer(){
    setSavingCustomer(true);
    try{
      const{data:created}=await supabase.from("customers").insert({
        salon_id:salonId,name:pendingLogData.clientName,phone:newCustPhone||"",
        birthday:newCustDob||null,gender:newCustGender||"male"
      }).select().single();
      await saveLog({...pendingLogData,customerId:created?.id||null});
    }catch(e){
      console.error(e);
      await saveLog(pendingLogData);
    }
    setSavingCustomer(false);
  }

  if(showPickCustomer&&pendingLogData){
    return(
      <div onClick={e=>e.target===e.currentTarget&&handleCancel()} style={{position:"fixed",inset:0,background:"rgba(0,0,0,0.5)",zIndex:700,display:"flex",alignItems:"flex-end"}}>
        <div style={{background:"#fff",borderRadius:"20px 20px 0 0",padding:"20px 18px 36px",width:"100%",maxHeight:"85vh",overflowY:"auto"}}>
          <div style={{width:36,height:4,background:TP.border,borderRadius:2,margin:"0 auto 16px"}}/>
          <div style={{display:"flex",alignItems:"center",gap:12,marginBottom:14}}>
            <div style={{width:44,height:44,borderRadius:14,background:TP.yellow,border:`2px solid ${TP.yb}`,display:"flex",alignItems:"center",justifyContent:"center",fontSize:22,flexShrink:0}}>🤔</div>
            <div>
              <div style={{fontWeight:900,fontSize:15,color:TP.text}}>"{pendingLogData.clientName}" customers found with the name</div>
              <div style={{fontSize:12,color:TP.ts,marginTop:2}}>Which one is it? Please select below</div>
            </div>
          </div>
          <div style={{display:"flex",flexDirection:"column",gap:8,marginBottom:14}}>
            {ambiguousCustomers.map(c=>(
              <button key={c.id} disabled={saving} onClick={async()=>{setShowPickCustomer(false);setSaving(true);await saveLog({...pendingLogData,customerId:c.id});}} style={{textAlign:"left",padding:"12px 14px",border:`2px solid ${TP.border}`,borderRadius:12,background:TP.sub,cursor:"pointer",fontFamily:"inherit"}}>
                <div style={{fontWeight:800,fontSize:14,color:TP.text}}>{c.name}</div>
                <div style={{fontSize:12,color:TP.ts,marginTop:2}}>{c.phone?`📱 ${c.phone}`:"📱 No phone on record"}{c.last_visit?` · Last visit: ${c.last_visit}`:""}</div>
              </button>
            ))}
          </div>
          <button onClick={()=>{setShowPickCustomer(false);setShowNewCustomer(true);}} style={{width:"100%",padding:13,border:`2px solid ${TP.purple}`,borderRadius:12,background:TP.purpleLight,color:TP.purple,fontFamily:"inherit",fontSize:14,fontWeight:800,cursor:"pointer",marginBottom:8}}>
            ➕ This is a New Customer
          </button>
          <button onClick={handleCancel} style={{width:"100%",padding:12,border:`2px solid ${TP.border}`,borderRadius:12,background:"#fff",fontFamily:"inherit",fontSize:13,fontWeight:700,cursor:"pointer",color:TP.tm}}>Cancel</button>
        </div>
      </div>
    );
  }

  if(showNewCustomer&&pendingLogData){
    return(
      <div onClick={e=>e.target===e.currentTarget&&handleCancel()} style={{position:"fixed",inset:0,background:"rgba(0,0,0,0.5)",zIndex:700,display:"flex",alignItems:"flex-end"}}>
        <div style={{background:"#fff",borderRadius:"20px 20px 0 0",padding:"20px 18px 36px",width:"100%",maxHeight:"90vh",overflowY:"auto"}}>
          <div style={{width:36,height:4,background:TP.border,borderRadius:2,margin:"0 auto 16px"}}/>
          <div style={{display:"flex",alignItems:"center",gap:12,marginBottom:16}}>
            <div style={{width:44,height:44,borderRadius:14,background:TP.blue,border:`2px solid ${TP.bb}`,display:"flex",alignItems:"center",justifyContent:"center",fontSize:22,flexShrink:0}}>🆕</div>
            <div>
              <div style={{fontWeight:900,fontSize:16,color:TP.text}}>New Customer!</div>
              <div style={{fontSize:12,color:TP.ts,marginTop:2}}>{pendingLogData.clientName} has not visited before</div>
            </div>
          </div>
          <div style={{marginBottom:12}}>
            <div style={{fontSize:12,fontWeight:800,color:TP.tm,marginBottom:5}}>Phone Number *</div>
            <input style={is} type="tel" placeholder="e.g. 9876543210" value={newCustPhone} onChange={e=>setNewCustPhone(e.target.value.replace(/\D/g,"").slice(0,10))} autoFocus/>
          </div>
          <div style={{marginBottom:12}}>
            <div style={{fontSize:12,fontWeight:800,color:TP.tm,marginBottom:5}}>Date of Birth (optional)</div>
            <input style={is} type="date" value={newCustDob} onChange={e=>setNewCustDob(e.target.value)}/>
          </div>
          <div style={{marginBottom:16}}>
            <div style={{fontSize:12,fontWeight:800,color:TP.tm,marginBottom:8}}>Gender</div>
            <div style={{display:"flex",gap:8}}>{[{id:"male",label:"👨 Male"},{id:"female",label:"👩 Female"}].map(g=>(<button key={g.id} onClick={()=>setNewCustGender(g.id)} style={{flex:1,padding:"9px",borderRadius:10,border:`2px solid ${newCustGender===g.id?TP.purple:TP.border}`,background:newCustGender===g.id?TP.purpleLight:"#fff",color:newCustGender===g.id?TP.purple:TP.ts,fontFamily:"inherit",fontSize:13,fontWeight:800,cursor:"pointer"}}>{g.label}</button>))}</div>
          </div>
          <button onClick={saveNewCustomer} disabled={savingCustomer||!newCustPhone||newCustPhone.length<10} style={{width:"100%",padding:13,background:savingCustomer||!newCustPhone||newCustPhone.length<10?"#d1d5db":TP.purple,border:"none",borderRadius:12,color:"#fff",fontFamily:"inherit",fontSize:14,fontWeight:800,cursor:newCustPhone.length===10?"pointer":"not-allowed"}}>
            {savingCustomer?"Saving...":"✓ Save Customer & Log"}
          </button>
        </div>
      </div>
    );
  }

  if(waPromptData){return(
    <div style={{position:"fixed",inset:0,background:"rgba(0,0,0,0.5)",zIndex:700,display:"flex",alignItems:"flex-end"}}>
      <div style={{background:"#fff",borderRadius:"20px 20px 0 0",padding:"22px 18px 36px",width:"100%"}}>
        <div style={{width:36,height:4,background:TP.border,borderRadius:2,margin:"0 auto 16px"}}/>
        <div style={{display:"flex",alignItems:"center",gap:12,marginBottom:14}}>
          <div style={{width:44,height:44,borderRadius:14,background:"#e8fdf0",border:"2px solid #bbf7d0",display:"flex",alignItems:"center",justifyContent:"center",fontSize:22}}>✅</div>
          <div><div style={{fontWeight:900,fontSize:15,color:TP.text}}>Work log saved!</div><div style={{fontSize:12,color:TP.ts,marginTop:2}}>Send visit summary to {waPromptData.name}?</div></div>
        </div>
        <div style={{background:TP.sub,border:`1.5px solid ${TP.border}`,borderRadius:12,padding:"12px 14px",marginBottom:16}}>
          <div style={{fontSize:12,color:TP.tm}}>✂️ {waPromptData.service} · ₹{waPromptData.amount}</div>
          <div style={{fontSize:12,color:TP.tm,marginTop:4}}>📱 +91 {waPromptData.phone}</div>
        </div>
        {waStatus==="idle"&&<div style={{display:"flex",gap:10}}>
          <button onClick={onClose} style={{flex:1,padding:12,border:`2px solid ${TP.border}`,borderRadius:12,background:"#fff",fontFamily:"inherit",fontSize:13,fontWeight:700,cursor:"pointer",color:TP.tm}}>Skip</button>
          <button onClick={async()=>{setWaStatus("sending");try{const r=await fetch("/api/send-summary",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({customerPhone:waPromptData.phone,customerName:waPromptData.name,salonName:salonName,visit:{date:waPromptData.date,services:[waPromptData.service],amount:waPromptData.amount,notes:waPromptData.notes||"",photos:[]}})});setWaStatus(r.ok?"sent":"error");if(r.ok)setTimeout(()=>onClose(),1800);}catch(e){setWaStatus("error");}}} style={{flex:2,padding:12,background:"#25d366",border:"none",borderRadius:12,color:"#fff",fontFamily:"inherit",fontSize:14,fontWeight:800,cursor:"pointer"}}>💬 Send on WhatsApp</button>
        </div>}
        {waStatus==="sending"&&<div style={{background:TP.purpleLight,borderRadius:12,padding:14,textAlign:"center",fontWeight:800,color:TP.purpleMid}}>📤 Sending...</div>}
        {waStatus==="sent"&&<div style={{background:"#e8fdf0",border:"2px solid #bbf7d0",borderRadius:12,padding:14,textAlign:"center",fontWeight:800,color:"#16a34a"}}>✅ Summary sent on WhatsApp!</div>}
        {waStatus==="error"&&<div style={{display:"flex",flexDirection:"column",gap:8}}><div style={{background:TP.red,border:`2px solid ${TP.rb}`,borderRadius:12,padding:10,textAlign:"center",fontSize:12,color:TP.rt,fontWeight:700}}>⚠️ Failed — 24h window may have expired.</div><div style={{display:"flex",gap:10}}><button onClick={onClose} style={{flex:1,padding:12,border:`2px solid ${TP.border}`,borderRadius:12,background:"#fff",fontFamily:"inherit",fontSize:13,fontWeight:700,cursor:"pointer"}}>Close</button><button onClick={()=>setWaStatus("idle")} style={{flex:1,padding:12,background:"#25d366",border:"none",borderRadius:12,color:"#fff",fontFamily:"inherit",fontSize:13,fontWeight:800,cursor:"pointer"}}>🔄 Retry</button></div></div>}
      </div>
    </div>
  );}

  return(
    <div onClick={e=>e.target===e.currentTarget&&handleCancel()} style={{position:"fixed",inset:0,background:"rgba(0,0,0,0.5)",zIndex:700,display:"flex",alignItems:"flex-end"}}>
      <div style={{background:"#fff",borderRadius:"20px 20px 0 0",padding:"20px 18px 36px",width:"100%",maxHeight:"80vh",overflowY:"auto",overflowX:"hidden",boxSizing:"border-box",WebkitOverflowScrolling:"touch"}}>
        <div style={{width:36,height:4,background:TP.border,borderRadius:2,margin:"0 auto 16px"}}/>
        <div style={{fontWeight:900,fontSize:16,marginBottom:4,color:TP.text}}>➕ Add Your Work Log</div>
        <div style={{fontSize:12,color:TP.ts,marginBottom:16}}>Record the service you provided</div>
        <div style={{marginBottom:12}}>
          <div style={{fontSize:12,fontWeight:800,color:TP.tm,marginBottom:5}}>Client Name *</div>
          <input style={is} placeholder="e.g. Anjali Mehta" value={clientName} onChange={e=>setClientName(e.target.value)} autoFocus/>
        </div>
        <div style={{marginBottom:12}}>
          <div style={{fontSize:12,fontWeight:800,color:TP.tm,marginBottom:5}}>Phone Number <span style={{color:TP.tf,fontWeight:600}}>(optional, recommended)</span></div>
          <input style={is} type="tel" placeholder="e.g. 9876543210" value={clientPhone} onChange={e=>setClientPhone(e.target.value.replace(/\D/g,"").slice(0,10))}/>
          <div style={{fontSize:10,color:TP.tf,marginTop:4}}>Helps identify customers with the same name</div>
        </div>
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10,marginBottom:12}}>
          <div style={{minWidth:0}}>
            <div style={{fontSize:12,fontWeight:800,color:TP.tm,marginBottom:5}}>Service</div>
            <select style={{...is,cursor:"pointer",width:"100%",boxSizing:"border-box"}} value={service} onChange={e=>setService(e.target.value)}>
              {OWNER_LOG_SERVICES.map(s=><option key={s}>{s}</option>)}
            </select>
          </div>
          <div style={{minWidth:0}}>
            <div style={{fontSize:12,fontWeight:800,color:TP.tm,marginBottom:5}}>Date</div>
            <input style={{...is,width:"100%",boxSizing:"border-box"}} type="date" value={date} onChange={e=>setDate(e.target.value)}/>
          </div>
        </div>
        <div style={{marginBottom:18}}>
          <div style={{fontSize:12,fontWeight:800,color:TP.tm,marginBottom:5}}>Amount (₹) *</div>
          <input style={is} type="number" placeholder="500" value={amount} onChange={e=>setAmount(e.target.value)}/>
        </div>
        <div style={{marginBottom:14}}>
          <div style={{fontSize:12,fontWeight:800,color:TP.tm,marginBottom:5}}>📝 Stylist Notes</div>
          <textarea style={{...is,resize:"vertical",lineHeight:1.6,minHeight:64,fontFamily:"inherit"}} placeholder="e.g. Shampooed and conditioned hair..." value={notes} onChange={e=>setNotes(e.target.value)}/>
        </div>
        <div style={{marginBottom:18}}>
          <div style={{fontSize:12,fontWeight:800,color:TP.tm,marginBottom:8}}>📸 Visit Photos ({photos.length})</div>
          <div style={{display:"flex",gap:10,flexWrap:"wrap"}}>
            {photos.map((ph,i)=><OwnerStagedPhotoItem key={i} photo={ph} onRemove={()=>setPhotos(prev=>prev.filter((_,idx)=>idx!==i))}/>)}
            <OwnerStagedAddPhotoBtn tempId={tempVisitId} onAdd={ph=>setPhotos(prev=>[...prev,ph])}/>
          </div>
        </div>
        <div style={{display:"flex",gap:10}}>
          <button onClick={handleCancel} style={{flex:1,padding:12,border:`2px solid ${TP.border}`,borderRadius:12,background:"#fff",fontFamily:"inherit",fontSize:13,fontWeight:700,cursor:"pointer",color:TP.tm}}>Cancel</button>
          <button onClick={save} disabled={saving} style={{flex:2,padding:12,border:"none",borderRadius:12,background:clientName.trim()&&amount?TP.purple:"#d1d5db",color:"#fff",fontFamily:"inherit",fontSize:13,fontWeight:800,cursor:"pointer"}}>
            {saving?"Saving...":"✓ Save"}
          </button>
        </div>
      </div>
    </div>
  );
}

function MainApp({user,setUser,onLogout,showRevenue,setShowRevenue}){
  const [screen,setScreen]=useState("dashboard");
  const [bookings,setBookings]=useState(user?.id==="demo"?seedBookings():{});
  const today=new Date();const todayKey=dateKey(today);const dayData=bookings[todayKey]||{};
  const dayDataFlat=Object.values(dayData).flat();
  const booked=dayDataFlat.filter(b=>b.status!=="break").length;
  const revenue=dayDataFlat.reduce((s,b)=>s+(b.price||0),0);
  const pending=dayDataFlat.filter(b=>b.status==="pending").length;
  const todaysList=Object.entries(dayData).flatMap(([slot,arr])=>(arr||[]).filter(b=>b.status!=="break").map(b=>({...b,slot})));
  const [earnedRevenue,setEarnedRevenue]=useState(0);
  const [todayWorkLogs,setTodayWorkLogs]=useState([]);
  useEffect(()=>{
    async function loadEarnedRevenue(){
      try{
        const{data}=await supabase.from("work_logs").select("*").eq("salon_id",user.id).eq("date",todayKey);
        setTodayWorkLogs(data||[]);
        setEarnedRevenue(data?data.reduce((s,l)=>s+(l.amount||0),0):0);
      }catch(e){}
    }
    loadEarnedRevenue();
  },[user.id,todayKey]);
  const [staffMap,setStaffMap]=useState({});
  useEffect(()=>{
    async function loadStaffMap(){
      try{
        const{data}=await supabase.from("staff").select("id,name").eq("salon_id",user.id);
        if(data){const map={};data.forEach(s=>{map[s.id]=s.name;});setStaffMap(map);}
      }catch(e){}
    }
    loadStaffMap();
  },[user.id]);
  const [showRevenueDetail,setShowRevenueDetail]=useState(false);
  const [selDate,setSelDate]=useState(today);
  const [showNotifs,setShowNotifs]=useState(false);const [notifications,setNotifications]=useState([]);const [unreadCount,setUnreadCount]=useState(0);
  const [bookingToast,setBookingToast]=useState(null);
  const toastTimerRef=useRef(null);
  const prevUnreadRef=useRef(0);
  useEffect(()=>{
    async function loadNotifications(){try{const{data}=await supabase.from("appointments").select("*").eq("salon_id",user.id).eq("status","confirmed").order("created_at",{ascending:false}).limit(10);if(data&&data.length>0){setNotifications(data);let seenIds=[];try{seenIds=JSON.parse(localStorage.getItem(`notif_seen_ids_${user.id}`)||"[]");}catch(e){seenIds=[];}const unseen=data.filter(a=>!seenIds.includes(a.id));setUnreadCount(unseen.length);if(unseen.length>prevUnreadRef.current){playNotificationSound();setBookingToast(unseen[0]);if(toastTimerRef.current)clearTimeout(toastTimerRef.current);toastTimerRef.current=setTimeout(()=>setBookingToast(null),6000);}prevUnreadRef.current=unseen.length;}}catch(e){console.error("Notif load error:",e?.message);}}
    loadNotifications();const interval=setInterval(loadNotifications,10000);return()=>clearInterval(interval);
  },[user.id]);
  function handleBell(){setShowNotifs(v=>!v);try{localStorage.setItem(`notif_seen_ids_${user.id}`,JSON.stringify(notifications.map(n=>n.id)));}catch(e){}setUnreadCount(0);prevUnreadRef.current=0;}
  const [botChatUnread,setBotChatUnread]=useState(0);
  useEffect(()=>{
    async function loadChatBadge(){try{const{data}=await supabase.from("message_logs").select("created_at").eq("salon_id",user.id).eq("direction","inbound").order("created_at",{ascending:false}).limit(50);if(data&&data.length>0){const lastSeen=localStorage.getItem(`chats_seen_${user.id}`)||"0";const unseen=data.filter(m=>new Date(m.created_at)>new Date(lastSeen));setBotChatUnread(unseen.length);}}catch(e){}}
    loadChatBadge();const interval=setInterval(loadChatBadge,10000);return()=>clearInterval(interval);
  },[user.id]);
  function openChats(){localStorage.setItem(`chats_seen_${user.id}`,new Date().toISOString());setBotChatUnread(0);setScreen("chats");}
  const [weekStart,setWeekStart]=useState(()=>{const d=new Date(today);d.setDate(d.getDate()-d.getDay()+1);return d;});
  const [calModal,setCalModal]=useState(null);const [calForm,setCalForm]=useState({name:"",service:SERVICES_LIST[0],price:"",src:"wa"});
  const touchStart=useRef(null);const touchStartY=useRef(null);const selKey=dateKey(selDate);const sDayData=bookings[selKey]||{};
  const slots=[];for(let h=9;h<21;h++){slots.push(`${pad(h)}:00`);slots.push(`${pad(h)}:30`);}
  function prevDay(){const d=addDays(selDate,-1);setSelDate(d);const ws=new Date(d);ws.setDate(ws.getDate()-ws.getDay()+1);setWeekStart(ws);}
  function nextDay(){const d=addDays(selDate,1);setSelDate(d);const ws=new Date(d);ws.setDate(ws.getDate()-ws.getDay()+1);setWeekStart(ws);}
  async function saveCal(){if(!calForm.name.trim())return;const color=COLORS[Math.floor(Math.random()*COLORS.length)];const service=calForm.service.replace(/^[\S]+ /,"");const price=parseInt(calForm.price)||0;await supabase.from("appointments").insert({salon_id:user.id,service,amount:price,date:selKey,time_slot:calModal.slot,status:"confirmed"});setBookings(prev=>{const daySlots={...(prev[selKey]||{})};const existing=daySlots[calModal.slot]||[];daySlots[calModal.slot]=[...existing,{name:calForm.name.trim(),service,price,src:calForm.src,status:"confirmed",color,staffId:null}];return{...prev,[selKey]:daySlots};});setCalModal(null);}
  useEffect(()=>{
    async function loadBookings(){try{const{data}=await supabase.from("appointments").select("*").eq("salon_id",user.id).eq("status","confirmed");if(data&&data.length>0){const bk={};data.forEach(a=>{if(!bk[a.date])bk[a.date]={};const slot=a.time_slot?.includes(" ")?a.time_slot.split(" ")[0]:a.time_slot;if(slot){if(!bk[a.date][slot])bk[a.date][slot]=[];bk[a.date][slot].push({id:a.id,name:a.customer_name||a.customer_phone||"WhatsApp Customer",service:a.service,price:a.amount||0,src:"wa",status:a.status||"confirmed",color:COLORS[Math.floor(Math.random()*COLORS.length)],staffId:a.staff_id||null});}}); setBookings(bk);}}catch(e){}}
    loadBookings();
  },[user.id]);
  const [clients,setClients]=useState([]);const [selClient,setSelClient]=useState(null);const [cSearch,setCSearch]=useState("");
  const [showAddClient,setShowAddClient]=useState(false);const [newClient,setNewClient]=useState({name:"",phone:"",city:"",dob:"",tag:"Regular",gender:"male"});
  const [editClient,setEditClient]=useState(null);const [showEditClient,setShowEditClient]=useState(false);
  const [welcomeSending,setWelcomeSending]=useState(false);const [welcomeModal,setWelcomeModal]=useState(null);const [welcomeModalMsg,setWelcomeModalMsg]=useState("");
  useEffect(()=>{
    async function loadClients(){const{data}=await supabase.from("customers").select("*").eq("salon_id",user.id);if(data&&data.length>0){setClients(data.map(c=>({...c,src:c.source||"walk",avatar:c.name.split(" ").map(w=>w[0]).join("").slice(0,2).toUpperCase(),joined:new Date(c.created_at).toLocaleDateString("en-IN",{month:"short",year:"numeric"}),visits:0,totalSpent:0,lastVisit:"-",history:[]})));}}
    if(screen==="clients")loadClients();
  },[user.id,screen]);
  const filtC=clients.filter(c=>{const q=cSearch.toLowerCase();return !q||c.name.toLowerCase().includes(q)||c.phone.includes(q);});
  async function sendWelcomeMessage(){if(!selClient?.phone)return;setWelcomeSending(true);setWelcomeModal(null);try{const res=await fetch("/api/send-welcome",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({customerPhone:selClient.phone,customerName:selClient.name,salonId:user.id,salonName:user.salon})});if(res.ok){setWelcomeModalMsg(`${user.salon} is all set for ${selClient.name}!`);setWelcomeModal("success");}else{setWelcomeModalMsg("Please enter a valid phone number.");setWelcomeModal("error");}}catch(e){setWelcomeModalMsg("Network error: "+e.message);setWelcomeModal("error");}setWelcomeSending(false);}
  const [showShareLink,setShowShareLink]=useState(false);const [salonBotKeyword,setSalonBotKeyword]=useState("");
  const [showQuickAdd,setShowQuickAdd]=useState(false);const [showOwnerWorkLog,setShowOwnerWorkLog]=useState(false);
  useEffect(()=>{async function loadKeyword(){try{const{data}=await supabase.from("salons").select("bot_keyword").eq("id",user.id).single();if(data?.bot_keyword)setSalonBotKeyword(data.bot_keyword);}catch(e){}}loadKeyword();},[user.id]);
  const shareBookingLink=`https://wa.me/918307340281?text=${encodeURIComponent(`Namaste! Main ${salonBotKeyword||"snipsalon"} mein appointment book karna chahta hoon 🙏`)}`;
  const [showDrawer,setShowDrawer]=useState(false);
  const weekDays=Array.from({length:6},(_,i)=>addDays(weekStart,i));
  return(
    <div style={{height:"100dvh",display:"flex",flexDirection:"column",fontFamily:"system-ui,sans-serif",color:TP.text,background:TP.bg,overflow:"hidden"}}>
      {["chats"].includes(screen)&&<SalonHeader user={user} screen={screen} onSettings={()=>setScreen("settings")} unreadCount={unreadCount} onBell={handleBell} onBack={()=>setScreen("dashboard")}/>}
      <div style={{flex:1,overflow:"hidden",display:"flex",flexDirection:"column"}}>
        {screen==="dashboard"&&(
          <div style={{display:"flex",flexDirection:"column",height:"100%",overflow:"hidden"}}>
            <div style={{background:"#fff",padding:"12px 18px 10px",display:"flex",alignItems:"center",justifyContent:"space-between",borderBottom:"0.5px solid #e0d8ff",flexShrink:0}}>
              <div style={{display:"flex",alignItems:"center",gap:10}}>
                <div onClick={()=>setShowDrawer(true)} style={{display:"flex",flexDirection:"column",gap:4,cursor:"pointer",padding:"4px"}}>
                  <div style={{height:2,background:"#2d1b69",borderRadius:2,width:20}}/>
                  <div style={{height:2,background:"#2d1b69",borderRadius:2,width:14}}/>
                  <div style={{height:2,background:"#2d1b69",borderRadius:2,width:20}}/>
                </div>
                <div style={{display:"flex",alignItems:"center",gap:6}}>
                  <div style={{width:24,height:24,background:"#2d1b69",borderRadius:7,display:"flex",alignItems:"center",justifyContent:"center",fontSize:12,color:"#fff"}}>✂</div>
                  <span style={{fontWeight:800,fontSize:16,color:"#2d1b69"}}>Snip<span style={{color:"#5b3fc4"}}>Book</span></span>
                </div>
              </div>
              <div style={{display:"flex",alignItems:"center",gap:8}}>
                <div onClick={()=>window.location.reload()} title="Refresh" style={{width:34,height:34,borderRadius:"50%",background:"#f4f2ff",border:"1.5px solid #e0d8ff",display:"flex",alignItems:"center",justifyContent:"center",cursor:"pointer"}}>
                  <span style={{fontSize:15}}>🔄</span>
                </div>
                <div onClick={handleBell} style={{position:"relative",width:34,height:34,borderRadius:"50%",background:"#f4f2ff",border:"1.5px solid #e0d8ff",display:"flex",alignItems:"center",justifyContent:"center",cursor:"pointer"}}>
                  <span style={{fontSize:15}}>🔔</span>
                  {unreadCount>0&&<div style={{position:"absolute",top:0,right:0,width:13,height:13,borderRadius:"50%",background:"#ef4444",display:"flex",alignItems:"center",justifyContent:"center",fontSize:7,fontWeight:900,color:"#fff",border:"2px solid #fff"}}>{unreadCount>9?"9+":unreadCount}</div>}
                </div>
                <div style={{width:34,height:34,borderRadius:"50%",background:"linear-gradient(135deg,#5b3fc4,#2d1b69)",display:"flex",alignItems:"center",justifyContent:"center",fontSize:12,fontWeight:800,color:"#fff"}}>{user?.name?.split(" ").map(w=>w[0]).join("").slice(0,2)||"S"}</div>
              </div>
            </div>
            <div style={{flex:1,overflowY:"auto",WebkitOverflowScrolling:"touch",background:"#f4f2ff",overscrollBehavior:"contain"}}>
            <div style={{margin:"10px 16px 0",background:"linear-gradient(135deg,#3d2490 0%,#5b3fc4 60%,#7c5fe6 100%)",borderRadius:18,padding:"16px",position:"relative",overflow:"hidden"}}>
              <svg style={{position:"absolute",bottom:0,right:0,opacity:0.15}} width="140" height="70" viewBox="0 0 140 70"><polyline points="0,60 25,45 50,52 75,28 100,35 120,15 140,22" fill="none" stroke="#fff" strokeWidth="2.5"/></svg>
              <div style={{position:"absolute",width:100,height:100,borderRadius:"50%",background:"rgba(255,255,255,0.05)",top:-30,right:-20}}/>
              <div style={{fontSize:11,color:"rgba(255,255,255,0.6)",fontWeight:700,letterSpacing:0.5,marginBottom:4}}>Today's Revenue</div>
              <div style={{fontSize:32,fontWeight:800,color:"#fff",marginBottom:6}}>₹{earnedRevenue>=1000?(earnedRevenue/1000).toFixed(1)+"k":earnedRevenue||"0"}</div>
              <div style={{display:"flex",alignItems:"center",gap:6,flexWrap:"wrap"}}>
                <div style={{display:"inline-flex",alignItems:"center",gap:5,background:"rgba(255,255,255,0.15)",borderRadius:20,padding:"3px 10px"}}><span style={{color:"#fff",fontSize:11,fontWeight:700}}>📅 Expected (bookings): ₹{revenue>=1000?(revenue/1000).toFixed(1)+"k":revenue||0}</span></div>
              </div>
            </div>
            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr 1fr",gap:6,margin:"8px 16px 0"}}>
              {[{icon:"📅",val:booked,label:"Bookings",color:"#1a0a4a"},{icon:"⏳",val:pending,label:"Pending",color:"#f59e0b"},{icon:"👥",val:clients.length,label:"Clients",color:"#22c55e"},{icon:"💰",val:"₹"+(earnedRevenue>=1000?(earnedRevenue/1000).toFixed(1)+"k":earnedRevenue||0),label:"Revenue",color:"#5b3fc4"}].map(s=>(<div key={s.label} onClick={s.label==="Revenue"?()=>setShowRevenueDetail(true):undefined} style={{background:"#fff",borderRadius:10,padding:"8px 4px",textAlign:"center",border:`0.5px solid ${s.label==="Revenue"?"#c4b8f0":"#e0d8ff"}`,cursor:s.label==="Revenue"?"pointer":"default"}}><div style={{fontSize:13,marginBottom:2}}>{s.icon}</div><div style={{fontSize:15,fontWeight:800,color:s.color,lineHeight:1}}>{s.val}</div><div style={{fontSize:9,color:"#9b8ec4",marginTop:2}}>{s.label}</div></div>))}
            </div>
            <div style={{padding:"8px 16px 0"}}>
              <div style={{display:"flex",justifyContent:"space-between",alignItems:"center"}}>
                {weekDays.map((d,i)=>{const key=dateKey(d);const isSel=key===selKey;const isToday=key===dateKey(today);const cnt=Object.values(bookings[key]||{}).flat().filter(b=>b.status!=="break").length;return(<div key={i} onClick={()=>{setSelDate(d);setScreen("calendar");}} style={{display:"flex",flexDirection:"column",alignItems:"center",gap:3,cursor:"pointer",flex:1}}><div style={{fontSize:9,fontWeight:700,color:isSel?"#5b3fc4":"#9b8ec4",letterSpacing:0.3}}>{["MON","TUE","WED","THU","FRI","SAT"][i]}</div><div style={{width:34,height:34,borderRadius:"50%",display:"flex",alignItems:"center",justifyContent:"center",background:isSel?"#2d1b69":isToday?"#ede9fe":"transparent",boxShadow:isSel?"0 4px 12px rgba(45,27,105,0.3)":"none"}}><div style={{fontSize:14,fontWeight:800,color:isSel?"#fff":isToday?"#2d1b69":"#1a0a4a"}}>{d.getDate()}</div></div><div style={{width:4,height:4,borderRadius:"50%",background:cnt>0?(isSel?"rgba(255,255,255,0.8)":"#5b3fc4"):"transparent"}}/></div>);})}
              </div>
            </div>
            <div style={{padding:"14px 16px 0"}}>
              <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:10}}>
                <div style={{fontSize:15,fontWeight:800,color:"#1a0a4a"}}>Today's Appointments</div>
                <div onClick={()=>setScreen("calendar")} style={{fontSize:12,fontWeight:700,color:"#5b3fc4",cursor:"pointer"}}>View all →</div>
              </div>
              {todaysList.length===0?(<div style={{background:"#fff",borderRadius:14,padding:"20px",textAlign:"center",color:"#9b8ec4",fontSize:13,border:"0.5px solid #e0d8ff"}}>No appointments today 🌟</div>):todaysList.slice(0,3).map((b,i)=>{const st=STATUS_MAP[b.status]||STATUS_MAP.confirmed;const av=b.name.split(" ").map(w=>w[0]).join("").slice(0,2);const staffLabel=b.staffId?(staffMap[b.staffId]||""):"";const cardStyles=[{cardBg:"#ede9fe",avBg:"#c4b8f0",avColor:"#2d1b69",textColor:"#3d1f8f"},{cardBg:"#fef9c3",avBg:"#fde68a",avColor:"#a16207",textColor:"#92400e"},{cardBg:"#e8fdf0",avBg:"#bbf7d0",avColor:"#16a34a",textColor:"#14532d"},{cardBg:"#fff0f6",avBg:"#fbcfe8",avColor:"#db2777",textColor:"#9d174d"},{cardBg:"#eff6ff",avBg:"#bfdbfe",avColor:"#2563eb",textColor:"#1e40af"},{cardBg:"#f0fdfa",avBg:"#99f6e4",avColor:"#0d9488",textColor:"#0f766e"}];const cs=cardStyles[i%cardStyles.length];return(<div key={i} style={{background:cs.cardBg,borderRadius:16,padding:"13px 14px",marginBottom:8,display:"flex",alignItems:"center",gap:12,position:"relative",overflow:"hidden"}}><div style={{position:"absolute",width:60,height:60,borderRadius:"50%",background:"rgba(255,255,255,0.25)",top:-15,right:-10}}/><div style={{width:44,height:44,borderRadius:13,background:cs.avBg,display:"flex",alignItems:"center",justifyContent:"center",fontWeight:800,fontSize:14,color:cs.avColor,flexShrink:0}}>{av}</div><div style={{flex:1,minWidth:0}}><div style={{fontWeight:800,fontSize:13,color:"#1a0a4a"}}>{b.name}</div><div style={{fontSize:11,color:cs.textColor,opacity:0.8,marginTop:2}}>{b.service} · {b.src==="wa"?"💬":"🚶"}{staffLabel?` · 🙋 ${staffLabel}`:""}</div></div><div style={{textAlign:"right",flexShrink:0}}><div style={{fontSize:12,fontWeight:800,color:"#1a0a4a",marginBottom:4}}>{fmt12(b.slot)}</div><div style={{background:"rgba(255,255,255,0.6)",color:cs.avColor,fontSize:10,fontWeight:700,padding:"2px 9px",borderRadius:20}}>{st.label}</div></div></div>);})}
            </div>
            <div style={{padding:"12px 16px 30px"}}>
              <div style={{fontSize:13,fontWeight:800,color:"#1a0a4a",marginBottom:8}}>Quick Actions</div>
              <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8}}>
                {[{icon:"🔗",label:"Share Booking Link",sub:"WhatsApp link & QR",s:"__share__",dark:true},{icon:"👥",label:"Add Client",sub:"New customer",s:"clients",dark:false},{icon:"💬",label:"Bot Chats",sub:"WhatsApp history",s:"chats",dark:false},{icon:"💫",label:"Create Offer",sub:"New campaign",s:"engage",dark:false}].map(a=>(<div key={a.label} onClick={()=>a.s==="__share__"?setShowShareLink(true):a.s==="chats"?openChats():setScreen(a.s)} style={{background:a.dark?"#2d1b69":"#fff",borderRadius:14,padding:"14px 12px",cursor:"pointer",border:a.dark?"none":"0.5px solid #e0d8ff",display:"flex",alignItems:"center",gap:10}}><div style={{position:"relative",width:36,height:36,background:a.dark?"rgba(255,255,255,0.15)":"#f4f2ff",borderRadius:10,display:"flex",alignItems:"center",justifyContent:"center",fontSize:18,flexShrink:0}}>{a.icon}{a.s==="chats"&&botChatUnread>0&&<div style={{position:"absolute",top:-5,right:-5,minWidth:16,height:16,padding:"0 3px",borderRadius:8,background:"#ef4444",display:"flex",alignItems:"center",justifyContent:"center",fontSize:9,fontWeight:900,color:"#fff",border:"2px solid #fff"}}>{botChatUnread>9?"9+":botChatUnread}</div>}</div><div><div style={{fontWeight:700,fontSize:13,color:a.dark?"#fff":"#1a0a4a"}}>{a.label}</div><div style={{fontSize:11,color:a.dark?"rgba(255,255,255,0.5)":"#9b8ec4",marginTop:1}}>{a.sub}</div></div></div>))}
              </div>
            </div>
            </div>
          </div>
        )}
        {screen==="calendar"&&(
          <div style={{flex:1,display:"flex",flexDirection:"column",overflow:"hidden"}}>
            <div style={{background:"#fff",padding:"14px 18px 12px",display:"flex",alignItems:"center",justifyContent:"space-between",borderBottom:"1px solid #f1f0f5",flexShrink:0}}>
              <div style={{display:"flex",alignItems:"center",gap:10}}>
                <button onClick={()=>setScreen("dashboard")} style={{width:34,height:34,borderRadius:10,background:"#f5f3ff",border:"1px solid #e0d8ff",display:"flex",alignItems:"center",justifyContent:"center",fontSize:16,color:"#5b3fc4",cursor:"pointer",fontWeight:600}}>←</button>
                <div><div style={{fontWeight:800,fontSize:16,color:"#0f0a2e",letterSpacing:"-0.3px"}}>Calendar</div><div style={{fontSize:11,color:"#9b8ec4",marginTop:2,fontWeight:500}}>Appointments & bookings</div></div>
              </div>
            </div>
            <div style={{background:"#fff",borderBottom:"0.5px solid #e0d8ff",padding:"12px 16px",flexShrink:0}}>
              <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:12}}>
                <div style={{fontSize:17,fontWeight:800,color:"#1a0a4a"}}>{MONTHS[selDate.getMonth()]} {selDate.getFullYear()}</div>
                <div style={{display:"flex",gap:6,alignItems:"center"}}>
                  <button onClick={prevDay} style={{width:30,height:30,borderRadius:8,border:"0.5px solid #e0d8ff",background:"#fff",fontSize:13,cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",color:"#5b3fc4"}}>←</button>
                  <button onClick={()=>{setSelDate(today);const ws=new Date(today);ws.setDate(ws.getDate()-ws.getDay()+1);setWeekStart(ws);}} style={{background:"#ede9fe",border:"0.5px solid #c4b8f0",borderRadius:8,padding:"5px 12px",fontSize:11,fontWeight:700,color:"#5b3fc4",cursor:"pointer",fontFamily:"inherit"}}>Today</button>
                  <button onClick={nextDay} style={{width:30,height:30,borderRadius:8,border:"0.5px solid #e0d8ff",background:"#fff",fontSize:13,cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",color:"#5b3fc4"}}>→</button>
                </div>
              </div>
              <div style={{display:"flex",gap:4}}>
                {Array.from({length:7}).map((_,i)=>{const d=addDays(weekStart,i);const key=dateKey(d);const isSel=dateKey(d)===selKey;const isToday=dateKey(d)===dateKey(today);const cnt=Object.values(bookings[key]||{}).flat().filter(b=>b.status!=="break").length;return(<div key={i} onClick={()=>setSelDate(d)} style={{flex:1,display:"flex",flexDirection:"column",alignItems:"center",gap:3,padding:"8px 2px",borderRadius:10,cursor:"pointer",background:isSel?"#2d1b69":isToday?"#ede9fe":"#fff",border:`0.5px solid ${isSel?"#2d1b69":isToday?"#c4b8f0":"#e0d8ff"}`}}><div style={{fontSize:9,fontWeight:700,color:isSel?"rgba(255,255,255,0.6)":isToday?"#5b3fc4":"#9b8ec4"}}>{DAYS_S[d.getDay()]}</div><div style={{fontSize:15,fontWeight:800,color:isSel?"#fff":isToday?"#2d1b69":"#1a0a4a"}}>{d.getDate()}</div><div style={{width:5,height:5,borderRadius:"50%",background:cnt>0?(isSel?"rgba(255,255,255,0.7)":"#5b3fc4"):"transparent"}}/></div>);})}
              </div>
            </div>
            <div style={{padding:"8px 16px",background:"#f4f2ff",borderBottom:"0.5px solid #e0d8ff",display:"flex",justifyContent:"space-between",alignItems:"center",flexShrink:0}}>
              <div style={{fontSize:13,fontWeight:800,color:"#1a0a4a"}}>{DAYS_S[selDate.getDay()]}, {selDate.getDate()} {SHORT_M[selDate.getMonth()]}</div>
              <div style={{fontSize:12,fontWeight:700,color:"#5b3fc4"}}>{Object.values(sDayData).flat().filter(b=>b.status!=="break").length} Booked</div>
            </div>
            <div style={{flex:1,overflowY:"auto",padding:"10px 16px",WebkitOverflowScrolling:"touch"}} onTouchStart={e=>{touchStart.current=e.touches[0].clientX;touchStartY.current=e.touches[0].clientY;}} onTouchEnd={e=>{if(touchStart.current===null)return;const diffX=touchStart.current-e.changedTouches[0].clientX;const diffY=(touchStartY.current||0)-e.changedTouches[0].clientY;if(Math.abs(diffX)>60&&Math.abs(diffX)>Math.abs(diffY)*1.5){diffX>0?nextDay():prevDay();}touchStart.current=null;touchStartY.current=null;}}>
              <div style={{display:"flex",flexDirection:"column",gap:6}}>
                {slots.map(key=>{const arr=sDayData[key]||[];const isHour=key.endsWith(":00");const isBreak=arr.length>0&&arr[0]?.status==="break";if(isBreak)return(<div key={key} style={{display:"flex",gap:10,alignItems:"center"}}><div style={{width:52,flexShrink:0,fontSize:11,fontWeight:700,color:"#ccc",textAlign:"right"}}>{fmt12(key)}</div><div style={{flex:1,background:"repeating-linear-gradient(45deg,#f8fafc,#f8fafc 5px,#f0f4f8 5px,#f0f4f8 10px)",border:"0.5px dashed #e0d8ff",borderRadius:10,padding:"9px 12px",color:"#ccc",fontSize:12,fontWeight:700}}>Break</div></div>);if(arr.length>0){const cardStyles=[{cardBg:"#ede9fe",left:"#5b3fc4",nameColor:"#2d1b69",priceColor:"#5b3fc4"},{cardBg:"#fef9c3",left:"#f59e0b",nameColor:"#92400e",priceColor:"#a16207"},{cardBg:"#e8fdf0",left:"#16a34a",nameColor:"#14532d",priceColor:"#16a34a"},{cardBg:"#fff0f6",left:"#db2777",nameColor:"#9d174d",priceColor:"#db2777"},{cardBg:"#eff6ff",left:"#2563eb",nameColor:"#1e40af",priceColor:"#2563eb"},{cardBg:"#f0fdfa",left:"#0d9488",nameColor:"#0f766e",priceColor:"#0d9488"}];const slotIdx=slots.indexOf(key);return(<div key={key} style={{display:"flex",gap:10,alignItems:"flex-start"}}><div style={{width:52,flexShrink:0,fontSize:11,fontWeight:700,color:isHour?"#1a0a4a":"#ccc",textAlign:"right",paddingTop:12}}>{fmt12(key)}</div><div style={{flex:1,display:"flex",flexDirection:"column",gap:6}}>{arr.map((b,bi)=>{const st=STATUS_MAP[b.status]||STATUS_MAP.confirmed;const cs=cardStyles[(slotIdx+bi)%cardStyles.length];const staffLabel=b.staffId?(staffMap[b.staffId]||""):"";return(<div key={bi} style={{background:cs.cardBg,borderRadius:12,padding:"11px 13px",borderLeft:`3px solid ${cs.left}`,position:"relative",overflow:"hidden"}}><div style={{position:"absolute",width:50,height:50,borderRadius:"50%",background:"rgba(255,255,255,0.2)",top:-10,right:-10}}/><div style={{display:"flex",justifyContent:"space-between",alignItems:"center"}}><div><div style={{fontSize:13,fontWeight:800,color:"#1a0a4a"}}>{b.name}</div><div style={{fontSize:11,color:cs.nameColor,opacity:0.8,marginTop:2}}>{b.service}{staffLabel?` · 🙋 ${staffLabel}`:""}</div></div><div style={{textAlign:"right",flexShrink:0}}><div style={{fontSize:12,fontWeight:800,color:cs.priceColor}}>₹{b.price}</div><div style={{background:"rgba(255,255,255,0.6)",color:cs.left,fontSize:9,fontWeight:700,padding:"2px 8px",borderRadius:20,marginTop:3,display:"inline-block"}}>{st.label}</div></div></div></div>);})}<button onClick={()=>{setCalForm({name:"",service:SERVICES_LIST[0],price:"",src:"wa"});setCalModal({slot:key});}} style={{border:"0.5px dashed #e0d8ff",borderRadius:8,background:"#fff",padding:"6px 10px",color:"#9b8ec4",fontSize:11,fontWeight:700,cursor:"pointer",textAlign:"center",fontFamily:"inherit"}}>+ Add Another</button></div></div>);}return(<div key={key} style={{display:"flex",gap:10,alignItems:"center"}}><div style={{width:52,flexShrink:0,fontSize:11,fontWeight:700,color:isHour?"#1a0a4a":"#ccc",textAlign:"right"}}>{fmt12(key)}</div><button onClick={()=>{setCalForm({name:"",service:SERVICES_LIST[0],price:"",src:"wa"});setCalModal({slot:key});}} style={{flex:1,border:"0.5px dashed #e0d8ff",borderRadius:10,background:"#fff",padding:"9px 12px",color:"#ccc",fontSize:12,fontWeight:700,cursor:"pointer",textAlign:"left",fontFamily:"inherit"}}>+ {fmt12(key)}</button></div>);})}
              </div>
            </div>
            {calModal&&(<div onClick={()=>setCalModal(null)} style={{position:"fixed",inset:0,background:"rgba(0,0,0,0.4)",zIndex:500,display:"flex",alignItems:"flex-end"}}><div onClick={e=>e.stopPropagation()} style={{background:"#fff",borderRadius:"20px 20px 0 0",padding:"20px 18px 32px",width:"100%"}}><div style={{width:36,height:4,background:"#e0d8ff",borderRadius:2,margin:"0 auto 16px"}}/><div style={{fontWeight:800,fontSize:15,marginBottom:4,color:"#1a0a4a"}}>New Booking</div><div style={{fontSize:12,color:"#9b8ec4",marginBottom:14}}>{fmt12(calModal.slot)}</div>{[{label:"Client Name",el:<input value={calForm.name} onChange={e=>setCalForm(f=>({...f,name:e.target.value}))} placeholder="e.g. Priya Sharma" style={obIs}/>},{label:"Service",el:<select value={calForm.service} onChange={e=>setCalForm(f=>({...f,service:e.target.value}))} style={{...is,marginTop:5,cursor:"pointer"}}>{SERVICES_LIST.map(s=><option key={s}>{s}</option>)}</select>},{label:"Price",el:<input type="number" value={calForm.price} onChange={e=>setCalForm(f=>({...f,price:e.target.value}))} placeholder="450" style={{...is,marginTop:5}}/>},{label:"Source",el:<select value={calForm.src} onChange={e=>setCalForm(f=>({...f,src:e.target.value}))} style={{...is,marginTop:5,cursor:"pointer"}}><option value="wa">WhatsApp</option><option value="walk">Walk-in</option></select>}].map(({label,el})=>(<div key={label} style={{marginBottom:10}}><div style={{fontSize:12,fontWeight:800,color:"#4a3580"}}>{label}</div>{el}</div>))}<div style={{display:"flex",gap:10,marginTop:14}}><button onClick={()=>setCalModal(null)} style={{flex:1,padding:11,border:"2px solid #e0d8ff",borderRadius:12,background:"#fff",fontFamily:"inherit",fontSize:13,fontWeight:700,cursor:"pointer",color:"#4a3580"}}>Cancel</button><button onClick={saveCal} style={{flex:2,padding:11,border:"none",borderRadius:12,background:calForm.name.trim()?"#2d1b69":"#ccc",color:"#fff",fontFamily:"inherit",fontSize:13,fontWeight:800,cursor:"pointer"}}>Save</button></div></div></div>)}
          </div>
        )}
        {screen==="clients"&&(
          <div style={{flex:1,display:"flex",flexDirection:"column",overflow:"hidden"}}>
            <div style={{background:"#fff",padding:"14px 20px 12px",display:"flex",alignItems:"center",justifyContent:"space-between",borderBottom:"0.5px solid #e0d8ff",flexShrink:0}}>
              <div style={{display:"flex",alignItems:"center",gap:10}}>
                <div style={{display:"flex",flexDirection:"column",gap:4,justifyContent:"center",cursor:"pointer"}} onClick={()=>setScreen("dashboard")}><div style={{height:2,background:"#2d1b69",borderRadius:2,width:22}}/><div style={{height:2,background:"#2d1b69",borderRadius:2,width:16}}/><div style={{height:2,background:"#2d1b69",borderRadius:2,width:22}}/></div>
                <div><div style={{fontSize:17,fontWeight:800,color:"#1a0a4a"}}>Clients</div><div style={{fontSize:11,color:"#9b8ec4"}}>Manage your customers</div></div>
              </div>
              <div onClick={()=>setShowAddClient(true)} style={{background:"#5b3fc4",color:"#fff",border:"none",borderRadius:8,padding:"8px 14px",fontSize:12,fontWeight:700,cursor:"pointer"}}>+ Add New</div>
            </div>
            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr 1fr",background:"#fff",borderBottom:"0.5px solid #e0d8ff",flexShrink:0}}>
              {[{val:clients.length,label:"Total",color:"#1a0a4a"},{val:clients.filter(c=>c.tag==="VIP").length,label:"VIP",color:"#5b3fc4"},{val:clients.filter(c=>c.tag==="Regular").length,label:"Regular",color:"#f59e0b"},{val:clients.filter(c=>c.tag==="New").length,label:"New",color:"#22c55e"}].map((s,i)=>(<div key={s.label} style={{textAlign:"center",padding:"12px 8px",borderRight:i<3?"0.5px solid #f0eeff":"none"}}><div style={{fontSize:20,fontWeight:800,color:s.color}}>{s.val}</div><div style={{fontSize:10,color:"#9b8ec4",marginTop:2}}>{s.label}</div></div>))}
            </div>
            <div style={{padding:"10px 16px 8px",background:"#fff",borderBottom:"0.5px solid #f0eeff",flexShrink:0}}>
              <div style={{background:"#f4f2ff",borderRadius:12,padding:"9px 14px",display:"flex",alignItems:"center",gap:8,border:"0.5px solid #e0d8ff"}}><span style={{fontSize:14,color:"#9b8ec4"}}>🔍</span><input value={cSearch} onChange={e=>setCSearch(e.target.value)} placeholder="Search by name or number..." style={{background:"transparent",border:"none",outline:"none",fontSize:13,color:"#1a0a4a",fontFamily:"inherit",flex:1}}/></div>
            </div>
            <div style={{flex:1,overflowY:"auto",padding:"8px 16px 80px",WebkitOverflowScrolling:"touch"}}>
              <div style={{fontSize:11,color:"#9b8ec4",textAlign:"center",padding:"4px 0 8px"}}>Showing all customers</div>
              {filtC.length===0&&<div style={{textAlign:"center",padding:"32px 0",color:"#9b8ec4",fontSize:13}}>No clients found</div>}
              {filtC.map((c,idx)=>{const avColors=[{bg:"#ede9fe",color:"#5b3fc4"},{bg:"#fef9c3",color:"#a16207"},{bg:"#e8fdf0",color:"#16a34a"},{bg:"#fff0f6",color:"#db2777"},{bg:"#eff6ff",color:"#2563eb"},{bg:"#f0fdfa",color:"#0d9488"}];const ac=avColors[idx%avColors.length];return(<div key={c.id} onClick={()=>setSelClient(c)} style={{background:"#fff",borderRadius:16,padding:"14px",marginBottom:8,border:"0.5px solid #e0d8ff",cursor:"pointer"}}><div style={{display:"flex",alignItems:"center",gap:12,marginBottom:c.visits>0?10:0}}><div style={{width:44,height:44,borderRadius:14,background:ac.bg,display:"flex",alignItems:"center",justifyContent:"center",fontWeight:800,fontSize:14,color:ac.color,flexShrink:0}}>{c.avatar}</div><div style={{flex:1,minWidth:0}}><div style={{display:"flex",alignItems:"center",gap:6}}><div style={{fontWeight:800,fontSize:13,color:"#1a0a4a"}}>{c.name}</div>{c.tag==="VIP"&&<div style={{background:"#fef9c3",color:"#a16207",fontSize:9,fontWeight:700,padding:"2px 7px",borderRadius:20}}>⭐ VIP</div>}</div><div style={{fontSize:11,color:"#9b8ec4",marginTop:2,display:"flex",alignItems:"center",gap:4}}><span>{c.src==="wa"?"💬":"🚶"}</span><span>{c.phone}</span></div></div><div style={{text:"right",flexShrink:0}}><div style={{background:c.tag==="VIP"?"#fef9c3":c.tag==="New"?"#e8fdf0":"#ede9fe",color:c.tag==="VIP"?"#a16207":c.tag==="New"?"#16a34a":"#5b3fc4",fontSize:10,fontWeight:700,padding:"2px 9px",borderRadius:20,display:"inline-block",marginBottom:4}}>{c.tag}</div><div style={{display:"flex",gap:8,justifyContent:"flex-end"}}><div style={{textAlign:"center"}}><div style={{fontSize:13,fontWeight:800,color:"#1a0a4a"}}>{c.visits||0}</div><div style={{fontSize:9,color:"#9b8ec4"}}>visits</div></div><div style={{textAlign:"center"}}><div style={{fontSize:13,fontWeight:800,color:"#1a0a4a"}}>₹{((c.totalSpent||0)/1000).toFixed(1)}k</div><div style={{fontSize:9,color:"#9b8ec4"}}>spent</div></div></div></div></div></div>);})}
            </div>
            {selClient&&(<div onClick={()=>setSelClient(null)} style={{position:"fixed",inset:0,background:"rgba(0,0,0,0.4)",zIndex:500,display:"flex",alignItems:"flex-end"}}><div onClick={e=>e.stopPropagation()} style={{background:"#fff",borderRadius:"20px 20px 0 0",width:"100%",maxHeight:"85vh",overflowY:"auto"}}><div style={{background:"#fff",padding:"12px 18px 10px",borderRadius:"20px 20px 0 0",borderBottom:"0.5px solid #f0eeff"}}><div style={{width:32,height:4,background:"#e0d8ff",borderRadius:2,margin:"0 auto 10px"}}/><div style={{display:"flex",gap:10,alignItems:"center"}}><div style={{width:40,height:40,borderRadius:12,background:"#ede9fe",display:"flex",alignItems:"center",justifyContent:"center",fontWeight:800,fontSize:15,color:"#5b3fc4",flexShrink:0}}>{selClient.avatar}</div><div style={{flex:1,minWidth:0}}><div style={{fontWeight:800,fontSize:15,color:"#1a0a4a"}}>{selClient.name}</div><div style={{fontSize:11,color:"#9b8ec4",marginTop:1}}>{selClient.phone}{selClient.city?" · "+selClient.city:""}</div></div><div style={{background:"#ede9fe",borderRadius:20,padding:"2px 10px",fontSize:10,fontWeight:700,color:"#5b3fc4",flexShrink:0}}>{selClient.tag||"Regular"}</div></div></div><div style={{padding:"16px 18px"}}><div style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:8,marginBottom:12}}>{[{val:selClient.visits||0,label:"Visits",color:"#5b3fc4"},{val:`₹${(selClient.totalSpent||0).toLocaleString()}`,label:"Total Spent",color:"#16a34a"},{val:selClient.lastVisit||"—",label:"Last Visit",color:"#f59e0b"}].map(s=>(<div key={s.label} style={{background:"#f8f7ff",borderRadius:10,padding:"10px 6px",textAlign:"center",border:"0.5px solid #e0d8ff"}}><div style={{fontWeight:800,fontSize:16,color:s.color}}>{s.val}</div><div style={{fontSize:10,color:"#9b8ec4",marginTop:2,fontWeight:600}}>{s.label}</div></div>))}</div><div style={{display:"flex",gap:8,marginBottom:10}}><button onClick={()=>{setScreen("calendar");setSelClient(null);}} style={{flex:1,padding:"11px",background:"#2d1b69",border:"none",borderRadius:12,color:"#fff",fontFamily:"inherit",fontSize:13,fontWeight:800,cursor:"pointer"}}>📅 Book Now</button><button onClick={()=>{if(!selClient?.phone)return;setWelcomeModal("confirm");}} style={{flex:1,padding:"11px",background:welcomeSending?"#f4f2ff":"#ede9fe",border:"0.5px solid #c4b8f0",borderRadius:12,color:"#5b3fc4",fontFamily:"inherit",fontSize:13,fontWeight:800,cursor:"pointer"}}>{welcomeSending?"Sending...":"💬 WhatsApp"}</button></div><button onClick={()=>{setEditClient({...selClient});setShowEditClient(true);}} style={{width:"100%",padding:"11px",background:"#fff",border:"0.5px solid #e0d8ff",borderRadius:12,color:"#4a3580",fontFamily:"inherit",fontSize:13,fontWeight:700,cursor:"pointer",marginBottom:8}}>✏️ Edit Profile</button><button onClick={()=>{setScreen("history");setSelClient(null);}} style={{width:"100%",padding:"12px",background:"#ede9fe",border:"0.5px solid #c4b8f0",borderRadius:12,color:"#5b3fc4",fontFamily:"inherit",fontSize:13,fontWeight:800,cursor:"pointer",marginBottom:8}}>📋 Visit History →</button><button onClick={async()=>{if(!window.confirm(`${selClient.name} — confirm delete?`))return;await supabase.from("customers").delete().eq("id",selClient.id);setClients(prev=>prev.filter(c=>c.id!==selClient.id));setSelClient(null);}} style={{width:"100%",padding:"12px",background:"#fff0f0",border:"0.5px solid #fca5a5",borderRadius:12,color:"#dc2626",fontFamily:"inherit",fontSize:13,fontWeight:800,cursor:"pointer"}}>🗑️ Delete Customer</button></div></div></div>)}
            {welcomeModal&&selClient&&(<div style={{position:"fixed",inset:0,background:"rgba(0,0,0,0.55)",zIndex:800,display:"flex",alignItems:"center",justifyContent:"center",padding:"20px"}}><div style={{background:"#fff",borderRadius:20,padding:"26px 22px",width:"100%",maxWidth:340}}>{welcomeModal==="confirm"&&(<><div style={{textAlign:"center",marginBottom:20}}><div style={{width:64,height:64,borderRadius:20,background:"#ede9fe",display:"flex",alignItems:"center",justifyContent:"center",fontSize:30,margin:"0 auto 12px"}}>💬</div><div style={{fontWeight:900,fontSize:17,color:"#1a0a4a",marginBottom:6}}>Welcome Message?</div><div style={{fontSize:13,color:"#666"}}>{selClient.name} ko WhatsApp pe message jayega</div></div><div style={{display:"flex",gap:10}}><button onClick={()=>setWelcomeModal(null)} style={{flex:1,padding:"12px",border:"2px solid #e0d8ff",borderRadius:12,background:"#fff",fontFamily:"inherit",fontSize:14,fontWeight:700,cursor:"pointer",color:"#888"}}>Cancel</button><button onClick={sendWelcomeMessage} style={{flex:2,padding:"12px",background:"#2d1b69",border:"none",borderRadius:12,color:"#fff",fontFamily:"inherit",fontSize:14,fontWeight:800,cursor:"pointer"}}>Bhejo</button></div></>)}{welcomeModal==="success"&&(<><div style={{textAlign:"center",marginBottom:20}}><div style={{fontSize:50,marginBottom:8}}>✅</div><div style={{fontWeight:900,fontSize:17,color:"#16a34a",marginBottom:8}}>Message Bhej Diya!</div><div style={{fontSize:13,color:"#555"}}>{welcomeModalMsg}</div></div><button onClick={()=>setWelcomeModal(null)} style={{width:"100%",padding:"13px",background:"#2d1b69",border:"none",borderRadius:12,color:"#fff",fontFamily:"inherit",fontSize:14,fontWeight:800,cursor:"pointer"}}>Done</button></>)}{welcomeModal==="error"&&(<><div style={{textAlign:"center",marginBottom:20}}><div style={{fontSize:50,marginBottom:8}}>❌</div><div style={{fontWeight:900,fontSize:17,color:"#dc2626",marginBottom:8}}>Message Nahi Gaya</div><div style={{fontSize:13,color:"#555"}}>{welcomeModalMsg}</div></div><div style={{display:"flex",gap:10}}><button onClick={()=>setWelcomeModal(null)} style={{flex:1,padding:"12px",border:"2px solid #e0d8ff",borderRadius:12,background:"#fff",fontFamily:"inherit",fontSize:14,fontWeight:700,cursor:"pointer",color:"#888"}}>Close</button><button onClick={()=>setWelcomeModal("confirm")} style={{flex:1,padding:"12px",background:"#ef4444",border:"none",borderRadius:12,color:"#fff",fontFamily:"inherit",fontSize:14,fontWeight:800,cursor:"pointer"}}>Retry</button></div></>)}</div></div>)}
            {showEditClient&&editClient&&(<div onClick={()=>setShowEditClient(false)} style={{position:"fixed",inset:0,background:"rgba(0,0,0,0.4)",zIndex:600,display:"flex",alignItems:"flex-end"}}><div onClick={e=>e.stopPropagation()} style={{background:"#fff",borderRadius:"20px 20px 0 0",padding:"18px 18px 32px",width:"100%",maxHeight:"90vh",overflowY:"auto"}}><div style={{width:36,height:4,background:"#e0d8ff",borderRadius:2,margin:"0 auto 14px"}}/><div style={{fontWeight:900,fontSize:16,marginBottom:16,color:"#1a0a4a"}}>Edit Customer</div>{[{label:"Full Name",key:"name",ph:"Priya Sharma",type:"text"},{label:"Phone",key:"phone",ph:"9876543210",type:"tel"},{label:"City",key:"city",ph:"Delhi",type:"text"},{label:"Date of Birth",key:"dob",ph:"",type:"date"},{label:"Email",key:"email",ph:"customer@gmail.com",type:"email"}].map(f=>(<div key={f.key} style={{marginBottom:12}}><div style={{fontSize:13,fontWeight:800,color:"#4a3580",marginBottom:4}}>{f.label}</div><input type={f.type} value={editClient[f.key]||""} onChange={e=>setEditClient(p=>({...p,[f.key]:e.target.value}))} placeholder={f.ph} style={is} onFocus={e=>e.target.style.borderColor="#5b3fc4"} onBlur={e=>e.target.style.borderColor="#e0d8ff"}/></div>))}<div style={{marginBottom:12}}><div style={{fontSize:13,fontWeight:800,color:"#4a3580",marginBottom:8}}>Gender</div><div style={{display:"flex",gap:8}}>{[{id:"male",label:"Male"},{id:"female",label:"Female"}].map(g=>(<button key={g.id} onClick={()=>setEditClient(p=>({...p,gender:g.id}))} style={{flex:1,padding:"9px",borderRadius:10,border:`2px solid ${editClient.gender===g.id?"#5b3fc4":"#e0d8ff"}`,background:editClient.gender===g.id?"#ede9fe":"#fff",color:editClient.gender===g.id?"#5b3fc4":"#888",fontFamily:"inherit",fontSize:13,fontWeight:800,cursor:"pointer"}}>{g.label}</button>))}</div></div><div style={{marginBottom:16}}><div style={{fontSize:13,fontWeight:800,color:"#4a3580",marginBottom:8}}>Tag</div><div style={{display:"flex",gap:8}}>{["New","Regular","VIP"].map(t=>(<button key={t} onClick={()=>setEditClient(p=>({...p,tag:t}))} style={{flex:1,padding:"9px",borderRadius:10,border:`2px solid ${editClient.tag===t?"#5b3fc4":"#e0d8ff"}`,background:editClient.tag===t?"#ede9fe":"#fff",color:editClient.tag===t?"#5b3fc4":"#888",fontFamily:"inherit",fontSize:13,fontWeight:800,cursor:"pointer"}}>{t}</button>))}</div></div><div style={{display:"flex",gap:10}}><button onClick={()=>setShowEditClient(false)} style={{flex:1,padding:"12px",border:"2px solid #e0d8ff",borderRadius:12,background:"#fff",fontFamily:"inherit",fontSize:13,fontWeight:700,cursor:"pointer",color:"#4a3580"}}>Cancel</button><button onClick={async()=>{if(!editClient.name.trim())return;await supabase.from("customers").update({name:editClient.name.trim(),phone:editClient.phone||"",city:editClient.city||"",birthday:editClient.dob||null,email:editClient.email||"",tag:editClient.tag||"Regular",gender:editClient.gender||"male"}).eq("id",editClient.id);setClients(prev=>prev.map(c=>c.id===editClient.id?{...c,...editClient,name:editClient.name.trim()}:c));setSelClient(prev=>prev?{...prev,...editClient,name:editClient.name.trim()}:null);setShowEditClient(false);}} style={{flex:2,padding:"12px",border:"none",borderRadius:12,background:editClient.name.trim()?"#2d1b69":"#ccc",color:"#fff",fontFamily:"inherit",fontSize:13,fontWeight:800,cursor:"pointer"}}>Save</button></div></div></div>)}
            {showAddClient&&(<div onClick={()=>setShowAddClient(false)} style={{position:"fixed",inset:0,background:"rgba(0,0,0,0.4)",zIndex:600,display:"flex",alignItems:"flex-end"}}><div onClick={e=>e.stopPropagation()} style={{background:"#fff",borderRadius:"20px 20px 0 0",padding:"18px 18px 32px",width:"100%",maxHeight:"90vh",overflowY:"auto"}}><div style={{width:36,height:4,background:"#e0d8ff",borderRadius:2,margin:"0 auto 14px"}}/><div style={{fontWeight:900,fontSize:16,marginBottom:16,color:"#1a0a4a"}}>Add New Customer</div>{[{label:"Full Name *",key:"name",ph:"Priya Sharma",type:"text"},{label:"Phone *",key:"phone",ph:"9876543210",type:"tel"},{label:"City",key:"city",ph:"Delhi",type:"text"},{label:"Date of Birth",key:"dob",ph:"",type:"date"}].map(f=>(<div key={f.key} style={{marginBottom:12}}><div style={{fontSize:13,fontWeight:800,color:"#4a3580",marginBottom:4}}>{f.label}</div><input type={f.type} value={newClient[f.key]} onChange={e=>setNewClient(p=>({...p,[f.key]:f.key==="phone"?e.target.value.replace(/\D/g,"").slice(0,10):e.target.value}))} placeholder={f.ph} maxLength={f.key==="phone"?10:undefined} inputMode={f.key==="phone"?"numeric":undefined} style={is} onFocus={e=>e.target.style.borderColor="#5b3fc4"} onBlur={e=>e.target.style.borderColor="#e0d8ff"}/></div>))}<div style={{marginBottom:12}}><div style={{fontSize:13,fontWeight:800,color:"#4a3580",marginBottom:8}}>Gender</div><div style={{display:"flex",gap:8}}>{[{id:"male",label:"Male"},{id:"female",label:"Female"}].map(g=>(<button key={g.id} onClick={()=>setNewClient(p=>({...p,gender:g.id}))} style={{flex:1,padding:"9px",borderRadius:10,border:`2px solid ${newClient.gender===g.id?"#5b3fc4":"#e0d8ff"}`,background:newClient.gender===g.id?"#ede9fe":"#fff",color:newClient.gender===g.id?"#5b3fc4":"#888",fontFamily:"inherit",fontSize:13,fontWeight:800,cursor:"pointer"}}>{g.label}</button>))}</div></div><div style={{marginBottom:16}}><div style={{fontSize:13,fontWeight:800,color:"#4a3580",marginBottom:8}}>Tag</div><div style={{display:"flex",gap:8}}>{["New","Regular","VIP"].map(t=>(<button key={t} onClick={()=>setNewClient(p=>({...p,tag:t}))} style={{flex:1,padding:"9px",borderRadius:10,border:`2px solid ${newClient.tag===t?"#5b3fc4":"#e0d8ff"}`,background:newClient.tag===t?"#ede9fe":"#fff",color:newClient.tag===t?"#5b3fc4":"#888",fontFamily:"inherit",fontSize:13,fontWeight:800,cursor:"pointer"}}>{t}</button>))}</div></div><div style={{display:"flex",gap:10}}><button onClick={()=>setShowAddClient(false)} style={{flex:1,padding:"12px",border:"2px solid #e0d8ff",borderRadius:12,background:"#fff",fontFamily:"inherit",fontSize:13,fontWeight:700,cursor:"pointer",color:"#4a3580"}}>Cancel</button><button onClick={async()=>{if(!newClient.name.trim()||!newClient.phone.trim())return;await supabase.from("customers").insert({salon_id:user.id,name:newClient.name.trim(),phone:newClient.phone.trim(),city:newClient.city||"",tag:newClient.tag,source:"walk",birthday:newClient.dob||null,gender:newClient.gender||"male"});const ini=newClient.name.split(" ").map(w=>w[0]).join("").slice(0,2).toUpperCase();setClients(prev=>[{id:Date.now(),name:newClient.name.trim(),phone:newClient.phone.trim(),city:newClient.city||"—",src:"walk",avatar:ini,joined:new Date().toLocaleDateString("en-IN",{month:"short",year:"numeric"}),visits:0,totalSpent:0,lastVisit:"—",tag:newClient.tag,history:[]},...prev]);setNewClient({name:"",phone:"",city:"",dob:"",tag:"Regular",gender:"male"});setShowAddClient(false);}} style={{flex:2,padding:"12px",border:"none",borderRadius:12,background:newClient.name.trim()&&newClient.phone.trim()?"#2d1b69":"#ccc",color:"#fff",fontFamily:"inherit",fontSize:13,fontWeight:800,cursor:"pointer"}}>Save</button></div></div></div>)}
          </div>
        )}
        {screen==="staff"&&(<div style={{flex:1,overflow:"hidden",display:"flex",flexDirection:"column"}}><div style={{flex:1,overflowY:"auto"}}><StaffManagement role="owner" currentUser={user} showRevenue={showRevenue} setShowRevenue={setShowRevenue} onBack={()=>setScreen("dashboard")}/></div></div>)}
        {screen==="history"&&(<div style={{flex:1,overflow:"hidden",display:"flex",flexDirection:"column"}}><CustomerHistory key={screen} currentUser={{...user,role:"owner"}} onBack={()=>setScreen("dashboard")} onBookAppointment={()=>setScreen("calendar")}/></div>)}
        {screen==="chats"&&(<div style={{flex:1,overflow:"hidden",display:"flex",flexDirection:"column"}}><ChatHistory salonId={user.id}/></div>)}
        {screen==="engage"&&(<div style={{flex:1,overflow:"hidden",display:"flex",flexDirection:"column"}}><EngagementCenter currentUser={user} onBack={()=>setScreen("dashboard")} onAddBirthday={()=>{setScreen("clients");setShowAddClient(true);}}/></div>)} 
        {screen==="settings"&&(<div style={{flex:1,overflow:"hidden",display:"flex",flexDirection:"column"}}><Settings user={user} onBack={()=>setScreen("dashboard")} onLogout={onLogout} onSalonUpdate={(newName,newLogoUrl)=>setUser(prev=>({...prev,salon:newName,logo_url:newLogoUrl||prev.logo_url}))} showRevenue={showRevenue} setShowRevenue={setShowRevenue}/></div>)}
      </div>
      <div style={{background:"#fff",borderTop:"0.5px solid #e0d8ff",paddingBottom:"env(safe-area-inset-bottom,0px)",display:"flex",alignItems:"center",flexShrink:0,boxShadow:"0 -4px 20px rgba(45,27,105,0.07)",position:"relative",height:62}}>
        {[{id:"dashboard",icon:"🏠",label:"Home"},{id:"calendar",icon:"📅",label:"Calendar"}].map(item=>{const active=screen===item.id;return(<div key={item.id} onClick={()=>setScreen(item.id)} style={{flex:1,display:"flex",flexDirection:"column",alignItems:"center",gap:1,cursor:"pointer",padding:"8px 4px 6px",position:"relative",height:"100%",justifyContent:"center"}}>{active&&<div style={{position:"absolute",top:0,left:"50%",transform:"translateX(-50%)",width:20,height:3,borderRadius:"0 0 4px 4px",background:"#2d1b69"}}/>}<div style={{width:30,height:30,borderRadius:9,display:"flex",alignItems:"center",justifyContent:"center",background:active?"#ede9fe":"transparent"}}><span style={{fontSize:16}}>{item.icon}</span></div><span style={{fontSize:9,fontWeight:active?800:600,color:active?"#2d1b69":"#9b8ec4"}}>{item.label}</span></div>);})}
        <div style={{flex:1,display:"flex",justifyContent:"center",alignItems:"center"}}><div onClick={()=>setShowQuickAdd(true)} style={{width:50,height:50,borderRadius:"50%",background:"linear-gradient(135deg,#2d1b69,#5b3fc4)",display:"flex",alignItems:"center",justifyContent:"center",fontSize:26,color:"#fff",boxShadow:"0 4px 16px rgba(45,27,105,0.4)",cursor:"pointer",marginBottom:8}}>+</div></div>
        {[{id:"staff",icon:"👨‍💼",label:"Staff"},{id:"settings",icon:"⚙️",label:"Settings"}].map(item=>{const active=screen===item.id;return(<div key={item.id} onClick={()=>setScreen(item.id)} style={{flex:1,display:"flex",flexDirection:"column",alignItems:"center",gap:1,cursor:"pointer",padding:"8px 4px 6px",position:"relative",height:"100%",justifyContent:"center"}}>{active&&<div style={{position:"absolute",top:0,left:"50%",transform:"translateX(-50%)",width:20,height:3,borderRadius:"0 0 4px 4px",background:"#2d1b69"}}/>}<div style={{width:30,height:30,borderRadius:9,display:"flex",alignItems:"center",justifyContent:"center",background:active?"#ede9fe":"transparent"}}><span style={{fontSize:16}}>{item.icon}</span></div><span style={{fontSize:9,fontWeight:active?800:600,color:active?"#2d1b69":"#9b8ec4"}}>{item.label}</span></div>);})}
      </div>
      {showDrawer&&(<><div onClick={()=>setShowDrawer(false)} style={{position:"fixed",inset:0,background:"rgba(0,0,0,0.4)",zIndex:700}}/><div style={{position:"fixed",top:0,left:0,bottom:0,width:280,background:"#fff",zIndex:800,display:"flex",flexDirection:"column",boxShadow:"4px 0 24px rgba(0,0,0,0.15)"}}><div style={{background:"#f4f2ff",padding:"44px 16px 12px",borderBottom:"0.5px solid #e0d8ff"}}><div style={{display:"flex",alignItems:"center",gap:10}}><div style={{width:38,height:38,borderRadius:10,background:"#ede9fe",border:"1.5px solid #c4b8f0",display:"flex",alignItems:"center",justifyContent:"center",fontWeight:800,fontSize:13,color:"#5b3fc4",flexShrink:0}}>{user?.salon?.split(" ").map(w=>w[0]).join("").slice(0,2)||"S"}</div><div><div style={{fontWeight:800,fontSize:14,color:"#1a0a4a"}}>✂️ {user?.salon}</div><div style={{fontSize:11,color:"#9b8ec4",marginTop:1}}>{user?.name}</div></div></div></div><div style={{flex:1,overflowY:"auto",padding:"4px 0"}}>{[{id:"dashboard",icon:"🏠",label:"Home"},{id:"calendar",icon:"📅",label:"Calendar"},{id:"clients",icon:"👥",label:"Clients"},{id:"staff",icon:"👨‍💼",label:"Staff"},{id:"history",icon:"📋",label:"Customer History"},{id:"engage",icon:"💫",label:"Engagement"},{id:"chats",icon:"💬",label:"Bot Chats"},{id:"settings",icon:"⚙️",label:"Settings"}].map(item=>{const active=screen===item.id;return(<div key={item.id} onClick={()=>{if(item.id==="chats")openChats();else setScreen(item.id);setShowDrawer(false);}} style={{display:"flex",alignItems:"center",gap:10,padding:"9px 16px",cursor:"pointer",background:active?"#f4f2ff":"transparent",borderLeft:active?"3px solid #2d1b69":"3px solid transparent"}}><div style={{width:30,height:30,borderRadius:8,background:active?"#ede9fe":"#f4f2ff",display:"flex",alignItems:"center",justifyContent:"center",fontSize:14,flexShrink:0}}>{item.icon}</div><div style={{fontWeight:active?800:500,fontSize:13,color:active?"#2d1b69":"#1a0a4a",flex:1}}>{item.label}</div>{item.id==="chats"&&botChatUnread>0&&<div style={{minWidth:18,height:18,padding:"0 4px",borderRadius:9,background:"#ef4444",display:"flex",alignItems:"center",justifyContent:"center",fontSize:10,fontWeight:900,color:"#fff"}}>{botChatUnread>9?"9+":botChatUnread}</div>}{active&&<div style={{marginLeft:item.id==="chats"&&botChatUnread>0?6:"auto",width:5,height:5,borderRadius:"50%",background:"#2d1b69"}}/>}</div>);})}</div><div style={{padding:"12px 16px",borderTop:"1px solid #f1f0f5"}}><button onClick={()=>{setShowDrawer(false);onLogout();}} style={{width:"100%",padding:"11px 16px",background:"#fff5f5",border:"1px solid #fca5a5",borderRadius:12,display:"flex",alignItems:"center",gap:10,cursor:"pointer",fontFamily:"inherit"}}><div style={{width:32,height:32,borderRadius:9,background:"#fee2e2",display:"flex",alignItems:"center",justifyContent:"center",fontSize:16,flexShrink:0}}>🚪</div><span style={{fontSize:14,fontWeight:700,color:"#dc2626"}}>Logout</span></button><div style={{fontSize:10,color:"#c4b8f0",textAlign:"center",marginTop:10}}>SnipBook · {user?.salon}</div></div></div></>)}
      {bookingToast&&(<div onClick={()=>{setScreen("calendar");if(bookingToast.date)setSelDate(new Date(bookingToast.date));setBookingToast(null);}} style={{position:"fixed",top:"calc(12px + env(safe-area-inset-top,0px))",left:12,right:12,zIndex:999,background:"linear-gradient(135deg,#16a34a,#22c55e)",borderRadius:16,padding:"14px 16px",boxShadow:"0 8px 24px rgba(0,0,0,0.3)",display:"flex",alignItems:"center",gap:12,cursor:"pointer"}}>
        <div style={{fontSize:24,flexShrink:0}}>🎉</div>
        <div style={{flex:1,minWidth:0}}>
          <div style={{fontWeight:800,fontSize:14,color:"#fff"}}>New Booking!</div>
          <div style={{fontSize:12,color:"rgba(255,255,255,0.9)",marginTop:2,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{bookingToast.customer_name||"Customer"} · {bookingToast.service}{bookingToast.time_slot?` · ${fmt12(bookingToast.time_slot)}`:""}</div>
        </div>
        <div onClick={e=>{e.stopPropagation();setBookingToast(null);}} style={{color:"#fff",fontSize:14,flexShrink:0,padding:4}}>✕</div>
      </div>)}
      {showNotifs&&(<div onClick={()=>setShowNotifs(false)} style={{position:"fixed",inset:0,background:"rgba(0,0,0,0.4)",zIndex:600,display:"flex",alignItems:"flex-start",justifyContent:"flex-end"}}><div onClick={e=>e.stopPropagation()} style={{background:"#fff",width:"90%",maxWidth:360,height:"100vh",overflowY:"auto"}}><div style={{padding:"16px",borderBottom:`2px solid ${TP.border}`,display:"flex",alignItems:"center",justifyContent:"space-between",background:TP.purple,position:"sticky",top:0}}><div style={{fontWeight:900,fontSize:16,color:"#fff"}}>🔔 Notifications</div><button onClick={()=>setShowNotifs(false)} style={{background:"rgba(255,255,255,0.15)",border:"none",fontSize:18,cursor:"pointer",color:"#fff",borderRadius:8,width:32,height:32,display:"flex",alignItems:"center",justifyContent:"center"}}>✕</button></div>{notifications.length===0?(<div style={{padding:32,textAlign:"center",color:TP.ts}}>No notifications</div>):notifications.map((n,i)=>(<div key={i} onClick={()=>{setScreen("calendar");setSelDate(new Date(n.date));setShowNotifs(false);}} style={{padding:"14px 16px",borderBottom:`2px solid ${TP.bg}`,cursor:"pointer"}}><div style={{display:"flex",alignItems:"center",gap:10}}><div style={{width:38,height:38,borderRadius:12,background:TP.purpleLight,display:"flex",alignItems:"center",justifyContent:"center",fontSize:18,flexShrink:0}}>📅</div><div style={{flex:1}}><div style={{fontWeight:800,fontSize:13,color:TP.text}}>{n.customer_name||"Customer"}</div><div style={{fontSize:11,color:TP.ts,marginTop:2}}>{n.service} · ₹{n.amount||0}</div><div style={{fontSize:11,color:TP.purple,marginTop:2,fontWeight:700}}>{n.date} at {n.time_slot}</div></div></div></div>))}</div></div>)}
      {showShareLink&&(<div onClick={()=>setShowShareLink(false)} style={{position:"fixed",inset:0,background:"rgba(0,0,0,0.45)",zIndex:700,display:"flex",alignItems:"flex-end"}}><div onClick={e=>e.stopPropagation()} style={{background:"#fff",borderRadius:"20px 20px 0 0",padding:"22px 20px 36px",width:"100%",boxSizing:"border-box",textAlign:"center"}}><div style={{width:36,height:4,background:"#e0d8ff",borderRadius:2,margin:"0 auto 18px"}}/><div style={{fontSize:36,marginBottom:8}}>🔗</div><div style={{fontWeight:900,fontSize:17,marginBottom:4,color:"#1a0a4a"}}>Share Booking Link</div><div style={{fontSize:12,color:"#9b8ec4",marginBottom:18}}>Share with customers or let them scan the QR</div><img src={`https://api.qrserver.com/v1/create-qr-code/?size=240x240&data=${encodeURIComponent(shareBookingLink)}`} alt="QR" style={{width:200,height:200,borderRadius:14,border:"2px solid #e0d8ff",marginBottom:18}}/><div style={{background:"#f4f2ff",border:"1.5px solid #e0d8ff",borderRadius:12,padding:"11px 14px",display:"flex",alignItems:"center",gap:8,marginBottom:14}}><span style={{flex:1,minWidth:0,fontSize:11,color:"#4a3580",overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap",textAlign:"left"}}>{shareBookingLink}</span><button onClick={()=>navigator.clipboard.writeText(shareBookingLink)} style={{background:"none",border:"none",cursor:"pointer",fontSize:16,flexShrink:0}}>📋</button></div><button onClick={()=>setShowShareLink(false)} style={{width:"100%",padding:13,border:"2px solid #e0d8ff",borderRadius:12,background:"#fff",fontFamily:"inherit",fontSize:13,fontWeight:700,cursor:"pointer",color:"#4a3580"}}>Close</button></div></div>)}
      {showQuickAdd&&(<div onClick={()=>setShowQuickAdd(false)} style={{position:"fixed",inset:0,background:"rgba(0,0,0,0.4)",zIndex:650,display:"flex",alignItems:"flex-end"}}><div onClick={e=>e.stopPropagation()} style={{background:"#fff",borderRadius:"20px 20px 0 0",padding:"18px 18px 32px",width:"100%"}}><div style={{width:36,height:4,background:"#e0d8ff",borderRadius:2,margin:"0 auto 16px"}}/><div style={{fontWeight:900,fontSize:15,marginBottom:14,color:"#1a0a4a"}}>What would you like to add?</div><div onClick={()=>{setShowQuickAdd(false);setScreen("clients");setShowAddClient(true);}} style={{display:"flex",alignItems:"center",gap:12,padding:"14px",background:"#f4f2ff",borderRadius:14,marginBottom:10,cursor:"pointer",border:"0.5px solid #e0d8ff"}}><div style={{width:42,height:42,borderRadius:12,background:"#ede9fe",display:"flex",alignItems:"center",justifyContent:"center",fontSize:20}}>👥</div><div><div style={{fontWeight:800,fontSize:14,color:"#1a0a4a"}}>Add Client</div><div style={{fontSize:11,color:"#9b8ec4",marginTop:1}}>Add new customer</div></div></div><div onClick={()=>{setShowQuickAdd(false);setShowOwnerWorkLog(true);}} style={{display:"flex",alignItems:"center",gap:12,padding:"14px",background:"#f4f2ff",borderRadius:14,cursor:"pointer",border:"0.5px solid #e0d8ff"}}><div style={{width:42,height:42,borderRadius:12,background:"#ede9fe",display:"flex",alignItems:"center",justifyContent:"center",fontSize:20}}>✂️</div><div><div style={{fontWeight:800,fontSize:14,color:"#1a0a4a"}}>Add Work Log</div><div style={{fontSize:11,color:"#9b8ec4",marginTop:1}}>Describe the service provided</div></div></div></div></div>)}
      {showOwnerWorkLog&&<OwnerWorkLogModal salonId={user.id} salonName={user.salon||"Salon"} onSave={(logData)=>{if(logData.date===todayKey){setEarnedRevenue(prev=>prev+logData.amount);setTodayWorkLogs(prev=>[...prev,logData]);}}} onClose={()=>setShowOwnerWorkLog(false)}/>}
      {showRevenueDetail&&<RevenueDetailModal rows={todayWorkLogs} staffMap={staffMap} onClose={()=>setShowRevenueDetail(false)}/>}
    </div>
  );
}

export default function SnipBook(){
  const [page,setPage]=useState("loading");const [user,setUser]=useState(null);const [staffUser,setStaffUser]=useState(null);const [showRevenue,setShowRevenue]=useState(DEFAULT_SHOW_REVENUE);
  useEffect(()=>{
    if(window.location.hash.includes("type=recovery")){setPage("resetPassword");return;}
    const savedStaff=localStorage.getItem("snipbook_staff");
    if(savedStaff){try{const staffData=JSON.parse(savedStaff);setStaffUser(staffData);setPage("staffApp");return;}catch(e){localStorage.removeItem("snipbook_staff");}}
    supabase.auth.getSession().then(async({data:{session}})=>{if(session){const{data:salon}=await supabase.from("salons").select("*").eq("id",session.user.id).single();setUser({id:session.user.id,email:session.user.email,name:salon?.owner_name||session.user.email,salon:salon?.salon_name||"Mera Salon",city:salon?.city||"",plan:salon?.plan||"free",logo_url:salon?.logo_url||null});setPage("app");}else{setPage("landing");}});
    const{data:{subscription}}=supabase.auth.onAuthStateChange(async(event,session)=>{if(event==="SIGNED_OUT"){setUser(null);setPage("landing");}});
    return()=>subscription.unsubscribe();
  },[]);
  function ownerLogout(){supabase.auth.signOut();setUser(null);setPage("landing");}
  function staffLogout(){setStaffUser(null);localStorage.removeItem("snipbook_staff");setPage("login");}
  if(window.location.pathname==="/admin")return<SuperAdmin/>;
  if(page==="loading"){return(<div style={{height:"100vh",display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",background:`linear-gradient(135deg,${TP.purple},${TP.purpleMid})`,fontFamily:"system-ui,sans-serif"}}><div style={{display:"flex",alignItems:"center",gap:10}}><div style={{width:48,height:48,background:"rgba(255,255,255,0.15)",borderRadius:14,display:"flex",alignItems:"center",justifyContent:"center",fontSize:24}}>✂️</div><span style={{fontWeight:900,fontSize:22,color:"#fff"}}>Snip<span style={{color:"#c4b8f0"}}>Book</span></span></div><div style={{marginTop:20,fontSize:13,color:"rgba(255,255,255,0.5)",fontWeight:700}}>Loading...</div></div>);}
  return(<>{page==="landing"&&<LandingPage onStart={()=>setPage("onboarding")} onLogin={()=>setPage("login")}/>}{page==="login"&&<LoginPage onOwnerLogin={u=>{setUser(u);setPage("app");}} onStaffLogin={async()=>{setPage("staffSalonEntry");}} onSignup={()=>setPage("onboarding")} onBack={()=>setPage("landing")}/>}{page==="staffSalonEntry"&&<StaffSalonEntry onFound={(staffData)=>{const sd={...staffData,salon_id:staffData.salon_id};setStaffUser(sd);localStorage.setItem("snipbook_staff",JSON.stringify(sd));setPage("staffApp");}} onBack={()=>setPage("login")}/>}{page==="staffApp"&&staffUser&&<StaffDashboard staff={staffUser} showRevenue={showRevenue} onLogout={staffLogout}/>}{page==="onboarding"&&<Onboarding onComplete={u=>{setUser(u);setPage("app");}} onBack={()=>setPage("landing")}/>}{page==="resetPassword"&&<ResetPasswordPage onDone={()=>setPage("login")}/>}{page==="app"&&user&&<MainApp user={user} setUser={setUser} onLogout={ownerLogout} showRevenue={showRevenue} setShowRevenue={setShowRevenue}/>}</>);
}
