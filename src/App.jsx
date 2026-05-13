import { useState, useRef, useEffect } from "react";
import { supabase } from "./lib/supabase";
import StaffManagement from "./screens/StaffManagement";
import CustomerHistory from "./screens/CustomerHistoryApp";
import EngagementCenter from "./screens/EngagementCenter";
import StaffDashboard, { StaffLoginPage } from "./screens/StaffDashboard";

// ─── HELPERS ──────────────────────────────────────────────────────────────────
function pad(n){ return String(n).padStart(2,"0"); }
function addDays(d,n){ const r=new Date(d); r.setDate(r.getDate()+n); return r; }
function dateKey(d){ return `${d.getFullYear()}-${pad(d.getMonth()+1)}-${pad(d.getDate())}`; }
function fmt12(slot){ const[h,m]=slot.split(":").map(Number); const h12=h===0?12:h>12?h-12:h; return `${h12}:${pad(m)} ${h<12?"AM":"PM"}`; }
const MONTHS=["January","February","March","April","May","June","July","August","September","October","November","December"];
const DAYS_S=["Sun","Mon","Tue","Wed","Thu","Fri","Sat"];
const SHORT_M=["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
const COLORS=["green","blue","purple","orange","pink","teal"];
const COLOR_MAP={
  green:{bg:"#f0fdf4",border:"#86efac",dot:"#22c55e"},
  blue:{bg:"#eff6ff",border:"#93c5fd",dot:"#3b82f6"},
  purple:{bg:"#fdf4ff",border:"#d8b4fe",dot:"#a855f7"},
  orange:{bg:"#fff8e6",border:"#fcd34d",dot:"#f59e0b"},
  pink:{bg:"#fff0f6",border:"#f9a8d4",dot:"#ec4899"},
  teal:{bg:"#f0fdfa",border:"#6ee7b7",dot:"#14b8a6"},
};
const STATUS_MAP={
  confirmed:{bg:"#dcfce7",color:"#15803d",label:"✓ Confirmed"},
  done:{bg:"#f0f4f8",color:"#888",label:"Done"},
  pending:{bg:"#fef9c3",color:"#a16207",label:"⏳ Pending"},
  break:{bg:"#f0f4f8",color:"#aaa",label:"Break"},
};
const SERVICES_LIST=["✂️ Haircut","✂️ Haircut + Beard","🎨 Hair Colour","💆 Facial + Cleanup","💄 Bridal Makeup","💆 Hair Spa","💅 Manicure/Pedicure"];
const EMOJIS=["✂️","🎨","💆","💄","💅","💇","🪒","🧴","💈","🌸"];
const WEEK_DAYS=["Mon","Tue","Wed","Thu","Fri","Sat","Sun"];
const HOURS_LIST=Array.from({length:17},(_,i)=>i+6).map(h=>({val:h,label:`${h<=12?h:h-12}:00 ${h<12?"AM":h===12?"PM":"PM"}`}));
const LOGO_BUCKET = "salon-logos";

const DEMO_STAFF_LIST = [
  {id:1, name:"Priya Sharma",  role:"Hairstylist",   phone:"98765 43210", salary:14000, pin:"1111", email:"priya@salon.com"},
  {id:2, name:"Ritu Gupta",    role:"Makeup Artist",  phone:"87654 32109", salary:16000, pin:"2222", email:"ritu@salon.com"},
  {id:3, name:"Suresh Kumar",  role:"Nail Artist",    phone:"76543 21098", salary:11000, pin:"3333", email:"suresh@salon.com"},
  {id:4, name:"Neha Singh",    role:"Receptionist",   phone:"65432 10987", salary:10000, pin:"4444", email:"neha@salon.com"},
];

const DEFAULT_SHOW_REVENUE = false;

function seedBookings(){
  const base=new Date(2026,2,23); const data={};
  const samples=[
    [["09:00","Arjun Mehta","Haircut + Beard",450,"wa","done","green"],["10:00","Priya Kapoor","Hair Colour",1200,"wa","done","purple"],["12:30","__break__"],["14:00","Neha Kulkarni","Bridal Makeup",2000,"wa","confirmed","pink"],["15:30","Vikram Tiwari","Haircut",250,"wa","confirmed","blue"],["17:00","Deepa Singh","Hair Colour",900,"wa","pending","purple"]],
    [["09:30","Sneha Reddy","Hair Spa",700,"wa","done","teal"],["11:00","Karan Malhotra","Haircut + Beard",450,"wa","done","blue"],["12:30","__break__"],["14:30","Ravi Gupta","Haircut",250,"wa","confirmed","green"],["16:00","Pooja Verma","Facial",600,"wa","confirmed","orange"]],
    [["09:00","Meera Joshi","Bridal Makeup",2000,"wa","confirmed","pink"],["12:30","__break__"],["14:00","Kavya Sharma","Hair Spa",700,"wa","confirmed","teal"],["16:00","Ajay Kumar","Haircut + Beard",450,"wa","pending","blue"]],
  ];
  for(let i=0;i<14;i++){
    const d=addDays(base,i); const key=dateKey(d); const s=samples[i%samples.length]; data[key]={};
    s.forEach(row=>{ if(row[1]==="__break__"){ data[key][row[0]]={status:"break"}; }
      else{ const[time,name,service,price,src,status,color]=row; data[key][time]={name,service,price,src,status,color}; }});
  }
  return data;
}

const CLIENTS_DATA=[
  {id:1,name:"Arjun Mehta",phone:"98765 43210",city:"Delhi",src:"wa",avatar:"AM",color:"#22c55e",joined:"Jan 2026",visits:8,totalSpent:3600,lastVisit:"26 Mar",tag:"VIP",history:[{date:"26 Mar",service:"Haircut + Beard",price:450,status:"done"},{date:"10 Mar",service:"Haircut + Beard",price:450,status:"done"}]},
  {id:2,name:"Priya Kapoor",phone:"91234 56789",city:"Delhi",src:"wa",avatar:"PK",color:"#3b82f6",joined:"Feb 2026",visits:4,totalSpent:4800,lastVisit:"26 Mar",tag:"Regular",history:[{date:"26 Mar",service:"Hair Colour",price:1200,status:"done"},{date:"01 Mar",service:"Hair Spa",price:700,status:"done"}]},
  {id:3,name:"Neha Kulkarni",phone:"99887 76655",city:"Noida",src:"wa",avatar:"NK",color:"#a855f7",joined:"Mar 2026",visits:2,totalSpent:2600,lastVisit:"25 Mar",tag:"New",history:[{date:"25 Mar",service:"Bridal Makeup",price:2000,status:"confirmed"}]},
  {id:4,name:"Rohan Singh",phone:"88776 65544",city:"Delhi",src:"walk",avatar:"RS",color:"#f59e0b",joined:"Jan 2026",visits:6,totalSpent:2700,lastVisit:"24 Mar",tag:"Regular",history:[{date:"24 Mar",service:"Facial",price:600,status:"done"}]},
  {id:5,name:"Sneha Reddy",phone:"66554 43322",city:"Delhi",src:"wa",avatar:"SR",color:"#14b8a6",joined:"Jan 2026",visits:7,totalSpent:5600,lastVisit:"22 Mar",tag:"VIP",history:[{date:"22 Mar",service:"Hair Spa",price:700,status:"done"},{date:"08 Mar",service:"Bridal Makeup",price:2000,status:"done"}]},
];

const is={width:"100%",padding:"11px 13px",border:"2px solid #e8edf3",borderRadius:11,fontSize:14,fontFamily:"inherit",outline:"none",background:"#fafbfc",boxSizing:"border-box"};
const nb={width:30,height:30,borderRadius:8,border:"2px solid #e8edf3",background:"#fff",fontSize:13,cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center"};
const obIs={width:"100%",padding:"11px 13px",border:"2px solid #e8edf3",borderRadius:11,fontSize:14,fontFamily:"inherit",outline:"none",background:"#fafbfc",boxSizing:"border-box"};

function Logo({size=15,iconSize=32}){
  return(
    <div style={{display:"flex",alignItems:"center",gap:8}}>
      <div style={{width:iconSize,height:iconSize,background:"#22c55e",borderRadius:Math.round(iconSize*0.28),display:"flex",alignItems:"center",justifyContent:"center",fontSize:iconSize*0.5}}>✂️</div>
      <span style={{fontWeight:900,fontSize:size}}>Snip<span style={{color:"#22c55e"}}>Book</span></span>
    </div>
  );
}

function SalonHeader({user, screen, onSettings, unreadCount=0, onBell}){
  const salonName = user?.salon || "My Salon";
  const logoUrl = user?.logo_url || null;
  const initials = user?.name?.split(" ").map(w=>w[0]).join("").slice(0,2) || "??";

  const screenLabel = {
    dashboard:"Home", calendar:"Calendar", clients:"Clients",
    staff:"Staff", history:"Customer History", engage:"Engagement", settings:"Settings"
  }[screen] || screen;

  return(
    <div style={{background:"#fff",borderBottom:"2px solid #e8edf3",padding:"10px 16px",display:"flex",alignItems:"center",justifyContent:"space-between",flexShrink:0,boxShadow:"0 2px 8px rgba(0,0,0,0.05)"}}>
      <div style={{display:"flex",alignItems:"center",gap:8}}>
        {logoUrl ? (
          <img src={logoUrl} alt="salon logo" style={{width:32,height:32,borderRadius:10,objectFit:"cover",border:"2px solid #e8edf3"}}/>
        ) : (
          <div style={{width:32,height:32,background:"#22c55e",borderRadius:10,display:"flex",alignItems:"center",justifyContent:"center",fontSize:16}}>✂️</div>
        )}
        <span style={{fontWeight:900,fontSize:13,color:"#1a1a2e",maxWidth:100,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{salonName}</span>
      </div>
      <div style={{fontSize:11,fontWeight:800,color:"#888",textTransform:"capitalize"}}>{screenLabel}</div>
      <div style={{display:"flex",alignItems:"center",gap:8}}>
        <div style={{display:"flex",alignItems:"center",gap:5,background:"#e8fdf0",border:"1.5px solid #bbf7d0",borderRadius:20,padding:"4px 9px",fontSize:11,fontWeight:700,color:"#16a34a"}}>
          <div style={{width:6,height:6,borderRadius:"50%",background:"#22c55e"}}/>Bot ON
        </div>
        {/* ✅ Bell notification icon */}
        <div onClick={onBell} style={{position:"relative",width:32,height:32,borderRadius:"50%",background:unreadCount>0?"#fff8e6":"#f8fafc",border:`2px solid ${unreadCount>0?"#fcd34d":"#e8edf3"}`,display:"flex",alignItems:"center",justifyContent:"center",cursor:"pointer"}}>
          <span style={{fontSize:15}}>🔔</span>
          {unreadCount>0&&<div style={{position:"absolute",top:-3,right:-3,width:16,height:16,borderRadius:"50%",background:"#ef4444",display:"flex",alignItems:"center",justifyContent:"center",fontSize:9,fontWeight:900,color:"#fff",border:"2px solid #fff"}}>{unreadCount>9?"9+":unreadCount}</div>}
        </div>
        <div onClick={onSettings} style={{width:30,height:30,borderRadius:"50%",background:"#22c55e",display:"flex",alignItems:"center",justifyContent:"center",fontSize:11,fontWeight:800,color:"#fff",cursor:"pointer",border:screen==="settings"?"2px solid #1a1a2e":"2px solid transparent"}}>
          {initials}
        </div>
      </div>
    </div>
  );
}

// ─── LANDING ──────────────────────────────────────────────────────────────────
function Landing({onStart,onLogin}){
  const [email,setEmail]=useState(""); const [done,setDone]=useState(false);
  return(
    <div style={{minHeight:"100vh",fontFamily:"system-ui,sans-serif",background:"#fff",color:"#1a1a2e",overflowY:"auto"}}>
      <nav style={{background:"#fff",borderBottom:"2px solid #f0f4f8",padding:"0 20px",height:56,display:"flex",alignItems:"center",justifyContent:"space-between",position:"sticky",top:0,zIndex:100,boxShadow:"0 2px 6px rgba(0,0,0,0.04)"}}>
        <Logo/>
        <div style={{display:"flex",gap:8}}>
          <button onClick={onLogin} style={{padding:"7px 16px",background:"#f0f4f8",border:"none",borderRadius:20,fontSize:13,fontWeight:700,cursor:"pointer",fontFamily:"inherit",color:"#555"}}>Login</button>
          <button onClick={onStart} style={{padding:"7px 16px",background:"#22c55e",border:"none",borderRadius:20,fontSize:13,fontWeight:800,cursor:"pointer",fontFamily:"inherit",color:"#fff"}}>Get Started →</button>
        </div>
      </nav>
      <section style={{background:"linear-gradient(160deg,#f0fdf4,#fff 60%,#f0f4f8)",padding:"48px 20px 40px",textAlign:"center",position:"relative",overflow:"hidden"}}>
        <div style={{position:"absolute",inset:0,backgroundImage:"radial-gradient(#22c55e18 1px,transparent 1px)",backgroundSize:"26px 26px",pointerEvents:"none"}}/>
        <div style={{position:"relative",maxWidth:540,margin:"0 auto"}}>
          <div style={{display:"inline-block",background:"#e8fdf0",border:"2px solid #bbf7d0",borderRadius:20,padding:"4px 14px",fontSize:12,fontWeight:800,color:"#16a34a",marginBottom:14}}>🇮🇳 Made for Indian Salons</div>
          <h1 style={{fontSize:"clamp(26px,6vw,44px)",fontWeight:900,lineHeight:1.15,marginBottom:14,letterSpacing:"-0.5px"}}>Apne Salon ki Bookings<br/><span style={{color:"#22c55e"}}>WhatsApp se Automate Karo</span></h1>
          <p style={{fontSize:15,color:"#555",lineHeight:1.7,marginBottom:28,maxWidth:420,margin:"0 auto 28px"}}>Client WhatsApp karta hai → Bot book kar leta hai → Dashboard pe notification. <strong>Zero missed calls.</strong></p>
          {!done?(
            <div style={{display:"flex",gap:8,maxWidth:400,margin:"0 auto 14px",flexWrap:"wrap",justifyContent:"center"}}>
              <input value={email} onChange={e=>setEmail(e.target.value)} placeholder="Apna email daalo..." style={{flex:1,minWidth:200,padding:"12px 16px",border:"2px solid #e8edf3",borderRadius:12,fontSize:14,fontFamily:"inherit",outline:"none"}} onFocus={e=>e.target.style.borderColor="#22c55e"} onBlur={e=>e.target.style.borderColor="#e8edf3"}/>
              <button onClick={()=>{if(email)setDone(true); else onStart();}} style={{padding:"12px 20px",background:"#22c55e",border:"none",borderRadius:12,color:"#fff",fontSize:14,fontWeight:800,cursor:"pointer",fontFamily:"inherit",boxShadow:"0 4px 14px rgba(34,197,94,0.35)"}}>Request Early Access →</button>
            </div>
          ):(
            <div style={{background:"#e8fdf0",border:"2px solid #86efac",borderRadius:14,padding:"14px",maxWidth:400,margin:"0 auto 14px",fontWeight:800,color:"#16a34a",fontSize:15}}>🎉 Check your email!</div>
          )}
          <div style={{fontSize:12,color:"#aaa",fontWeight:700}}>✓ Quick setup &nbsp;·&nbsp; ✓ Indian salons ke liye &nbsp;·&nbsp; ✓ WhatsApp first</div>
          <div style={{display:"flex",justifyContent:"center",gap:28,marginTop:32,flexWrap:"wrap"}}>
            {[{val:"2,400+",label:"Salons"},{val:"India",label:"Made for"},{val:"70%",label:"Fewer No-shows"},{val:"3 min",label:"Setup"}].map(s=>(<div key={s.label} style={{textAlign:"center"}}><div style={{fontSize:22,fontWeight:900,color:"#22c55e"}}>{s.val}</div><div style={{fontSize:11,color:"#888",fontWeight:700,marginTop:2}}>{s.label}</div></div>))}
          </div>
        </div>
      </section>
      <section style={{padding:"40px 20px",background:"#1a1a2e"}}>
        <div style={{maxWidth:480,margin:"0 auto",textAlign:"center"}}>
          <h2 style={{fontSize:22,fontWeight:900,color:"#fff",marginBottom:6}}>3 Steps. That's it.</h2>
          <p style={{color:"#888",fontSize:13,marginBottom:24}}>Koi app nahi. Koi training nahi.</p>
          <div style={{display:"flex",flexDirection:"column",gap:10}}>
            {[{n:"01",i:"📲",t:"Client WhatsApp karta hai",d:"Bot 24/7 reply karta hai"},{n:"02",i:"🤖",t:"Bot slot book kar leta hai",d:"Service, date, time — sab automatic"},{n:"03",i:"🔔",t:"Aapko notification milti hai",d:"Dashboard pe live — kaun, kab, kitna"}].map((s,i)=>(
              <div key={i} style={{background:"#232323",border:"2px solid #2a2a2a",borderRadius:14,padding:"14px",display:"flex",alignItems:"center",gap:12,textAlign:"left"}}>
                <div style={{width:38,height:38,borderRadius:10,background:"#22c55e",display:"flex",alignItems:"center",justifyContent:"center",fontSize:10,fontWeight:900,color:"#fff",flexShrink:0}}>{s.n}</div>
                <div style={{fontSize:24,flexShrink:0}}>{s.i}</div>
                <div><div style={{fontWeight:800,fontSize:13,color:"#fff",marginBottom:2}}>{s.t}</div><div style={{fontSize:12,color:"#888"}}>{s.d}</div></div>
              </div>
            ))}
          </div>
          <button onClick={onStart} style={{marginTop:24,padding:"14px 32px",background:"#22c55e",border:"none",borderRadius:14,color:"#fff",fontSize:15,fontWeight:800,cursor:"pointer",fontFamily:"inherit",boxShadow:"0 4px 18px rgba(34,197,94,0.3)"}}>Abhi Start Karo — Free →</button>
        </div>
      </section>
      <footer style={{background:"#111",padding:"16px 20px",textAlign:"center"}}>
        <Logo size={13} iconSize={24}/>
        <div style={{fontSize:11,color:"#444",marginTop:6}}>© 2026 SnipBook · Made with ❤️ for Indian Salon Owners</div>
        <button onClick={onLogin} style={{background:"none",border:"none",color:"#555",fontSize:12,fontWeight:700,cursor:"pointer",fontFamily:"inherit",textDecoration:"underline",marginTop:8}}>Already have account? Login →</button>
      </footer>
    </div>
  );
}

// ─── LOGIN PAGE ───────────────────────────────────────────────────────────────
function LoginPage({onOwnerLogin, onStaffLogin, onSignup, onBack}){
  const [tab,setTab]=useState("owner");
  const [email,setEmail]=useState("");
  const [pass,setPass]=useState("");
  const [loading,setLoading]=useState(false);
  const [error,setError]=useState("");

  async function handleOwnerLogin(){
    if(!email||!pass){setError("Email/Phone aur password daalo");return;}
    setLoading(true); setError("");
    try{
      let loginEmail = email.trim();
      if(!loginEmail.includes("@")){
        const {data:salon}=await supabase.from("salons").select("id,owner_name,salon_name,city,plan,logo_url").eq("phone",loginEmail).single();
        if(!salon){setError("Is number se koi account nahi mila!");setLoading(false);return;}
        const {data:authData}=await supabase.from("salons").select("id").eq("id",salon.id).single();
        if(!authData){setError("Account nahi mila!");setLoading(false);return;}
        setError("Phone login ke liye apna registered email use karo abhi.");
        setLoading(false);return;
      }
      const {data,error:err}=await supabase.auth.signInWithPassword({email:loginEmail,password:pass});
      if(err)throw err;
      const {data:salon}=await supabase.from("salons").select("*").eq("id",data.user.id).single();
      onOwnerLogin({
        id:data.user.id,
        email:data.user.email,
        name:salon?.owner_name||data.user.email,
        salon:salon?.salon_name||"Mera Salon",
        city:salon?.city||"",
        plan:salon?.plan||"free",
        logo_url:salon?.logo_url||null,
      });
    }catch(e){setError(e.message);}
    setLoading(false);
  }

  return(
    <div style={{minHeight:"100vh",background:"linear-gradient(135deg,#f0fdf4,#f0f4f8)",display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",padding:"24px 20px",fontFamily:"system-ui,sans-serif"}}>
      <div style={{width:"100%",maxWidth:400}}>
        <div style={{textAlign:"center",marginBottom:24}}>
          <Logo size={22} iconSize={44}/>
          <div style={{fontSize:13,color:"#888",marginTop:8}}>Apne salon mein wapas aao 👋</div>
        </div>
        <div style={{background:"#fff",borderRadius:20,overflow:"hidden",boxShadow:"0 8px 28px rgba(0,0,0,0.08)",border:"2px solid #e8edf3"}}>
          <div style={{display:"flex",borderBottom:"2px solid #e8edf3"}}>
            {[{id:"owner",icon:"👑",label:"Owner Login"},{id:"staff",icon:"👨‍💼",label:"Staff Login"}].map(t=>(
              <div key={t.id} onClick={()=>setTab(t.id)} style={{flex:1,padding:"14px 8px",display:"flex",flexDirection:"column",alignItems:"center",gap:4,cursor:"pointer",background:tab===t.id?"#e8fdf0":"#f8fafc",borderBottom:`3px solid ${tab===t.id?"#22c55e":"transparent"}`,transition:"all 0.15s"}}>
                <span style={{fontSize:22}}>{t.icon}</span>
                <span style={{fontSize:12,fontWeight:800,color:tab===t.id?"#16a34a":"#888"}}>{t.label}</span>
              </div>
            ))}
          </div>
          <div style={{padding:"22px 22px 26px"}}>
            {tab==="owner"&&(
              <>
                {error&&<div style={{background:"#fff0f0",border:"2px solid #fca5a5",borderRadius:10,padding:"9px 12px",fontSize:12,color:"#dc2626",fontWeight:700,marginBottom:14}}>{error}</div>}
                <div style={{marginBottom:14}}>
                  <label style={{fontSize:13,fontWeight:800,color:"#555"}}>Email</label>
                  <input value={email} onChange={e=>setEmail(e.target.value)} type="text" style={obIs} placeholder="email@gmail.com ya phone number"/>
                </div>
                <div style={{marginBottom:18}}>
                  <label style={{fontSize:13,fontWeight:800,color:"#555"}}>Password</label>
                  <input value={pass} onChange={e=>setPass(e.target.value)} type="password" style={obIs} placeholder="••••••••" onKeyDown={e=>e.key==="Enter"&&handleOwnerLogin()}/>
                </div>
                <button onClick={handleOwnerLogin} disabled={loading} style={{width:"100%",padding:"13px",background:loading?"#86efac":"#22c55e",border:"none",borderRadius:12,color:"#fff",fontFamily:"inherit",fontSize:15,fontWeight:800,cursor:loading?"not-allowed":"pointer",boxShadow:"0 4px 14px rgba(34,197,94,0.3)",marginBottom:12}}>
                  {loading?"Logging in...":"👑 Owner Login →"}
                </button>
                <div style={{textAlign:"center",fontSize:13,color:"#888"}}>New ho? <span onClick={onSignup} style={{color:"#22c55e",fontWeight:800,cursor:"pointer"}}>Free trial shuru karo</span></div>
              </>
            )}
            {tab==="staff"&&(
              <>
                <div style={{background:"#fef3c7",border:"2px solid #fde68a",borderRadius:12,padding:"14px",marginBottom:16,textAlign:"center"}}>
                  <div style={{fontSize:24,marginBottom:6}}>👨‍💼</div>
                  <div style={{fontWeight:800,fontSize:13,color:"#92400e"}}>Staff Portal</div>
                  <div style={{fontSize:12,color:"#a16207",marginTop:4}}>Apna naam select karo aur PIN daalo</div>
                </div>
                <button onClick={onStaffLogin} style={{width:"100%",padding:"14px",background:"#1a1a2e",border:"none",borderRadius:12,color:"#fff",fontFamily:"inherit",fontSize:15,fontWeight:800,cursor:"pointer",boxShadow:"0 4px 14px rgba(0,0,0,0.2)"}}>
                  👨‍💼 Staff Login →
                </button>

              </>
            )}
          </div>
        </div>
        <div style={{textAlign:"center",marginTop:14}}>
          <button onClick={onBack} style={{background:"none",border:"none",color:"#aaa",fontSize:13,fontWeight:700,cursor:"pointer",fontFamily:"inherit"}}>← Back to Home</button>
        </div>
      </div>
    </div>
  );
}

// ─── ONBOARDING ───────────────────────────────────────────────────────────────
const OB_STEPS=[{id:1,title:"Create Account",icon:"👤"},{id:2,title:"Salon Info",icon:"✂️"},{id:3,title:"Working Hours",icon:"🕐"},{id:4,title:"Services",icon:"💇"},{id:5,title:"WhatsApp",icon:"💬"},{id:6,title:"All Set!",icon:"🎉"}];

// ✅ FIX: gender field added to DEF_SVCS
const DEF_SVCS=[
  {id:1,emoji:"✂️",name:"Haircut",price:250,duration:30,active:true,gender:"male"},
  {id:2,emoji:"✂️",name:"Haircut + Beard",price:450,duration:45,active:true,gender:"male"},
  {id:3,emoji:"🎨",name:"Hair Colour",price:1200,duration:90,active:false,gender:"both"},
  {id:4,emoji:"💆",name:"Facial + Cleanup",price:600,duration:60,active:false,gender:"both"},
  {id:5,emoji:"💄",name:"Bridal Makeup",price:2000,duration:90,active:false,gender:"female"},
  {id:6,emoji:"💆",name:"Hair Spa",price:700,duration:60,active:false,gender:"both"},
];

function OBF({label,children}){
  return(<div style={{marginBottom:14}}><label style={{fontSize:13,fontWeight:800,color:"#555",display:"block",marginBottom:5}}>{label}</label>{children}</div>);
}

function Onboarding({onComplete,onBack}){
  const [step,setStep]=useState(1);
  const [data,setData]=useState({ownerName:"",phone:"",email:"",password:"",salonName:"",city:"",salonType:"unisex",workDays:["Mon","Tue","Wed","Thu","Fri","Sat"],openTime:9,closeTime:21,waNumber:""});
  const [svcs,setSvcs]=useState(DEF_SVCS);
  const [loading,setLoading]=useState(false);
  const [error,setError]=useState("");
  const progress=((step-1)/(OB_STEPS.length-1))*100;

  function canNext(){
    if(step===1){
      const ph=/^\d{10}$/.test(data.phone.replace(/\s/g,""));
      const em=/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email);
      return data.ownerName&&ph&&em&&data.password.length>=6;
    }
    if(step===2)return data.salonName&&data.city;
    if(step===3)return data.workDays.length>0;
    if(step===4)return svcs.some(s=>s.active);
    if(step===5)return /^\d{10}$/.test(data.waNumber.replace(/\s/g,""));
    return true;
  }

  const F=OBF;

  async function handleComplete(){
    setLoading(true); setError("");
    try{
      const {data:authData,error:authErr}=await supabase.auth.signUp({email:data.email,password:data.password});
      if(authErr)throw authErr;
      const userId=authData.user.id;
      const {error:salonErr}=await supabase.from("salons").insert({
        id:userId,owner_name:data.ownerName,salon_name:data.salonName,phone:data.phone,city:data.city,plan:"free",
        services:svcs.filter(s=>s.active),working_days:data.workDays,open_time:data.openTime,close_time:data.closeTime,
        whatsapp_number:data.waNumber,
      });
      if(salonErr)throw salonErr;
      onComplete({id:userId,name:data.ownerName,email:data.email,salon:data.salonName,city:data.city,plan:"Trial",logo_url:null});
    }catch(e){setError(e.message);setLoading(false);}
  }

  return(
    <div style={{minHeight:"100vh",background:"linear-gradient(135deg,#f0fdf4,#f0f4f8)",display:"flex",flexDirection:"column",alignItems:"center",padding:"20px 16px 40px",fontFamily:"system-ui,sans-serif"}}>
      <div style={{marginBottom:18}}><Logo size={18} iconSize={36}/></div>
      <div style={{width:"100%",maxWidth:460,marginBottom:6}}>
        <div style={{display:"flex",justifyContent:"space-between",fontSize:12,fontWeight:700,color:"#888",marginBottom:6}}><span>Step {step} of {OB_STEPS.length}</span><span style={{color:"#22c55e"}}>{Math.round(progress)}% done</span></div>
        <div style={{background:"#e8edf3",borderRadius:20,height:6,overflow:"hidden"}}><div style={{width:`${progress}%`,height:"100%",background:"linear-gradient(90deg,#22c55e,#86efac)",borderRadius:20,transition:"width 0.4s"}}/></div>
      </div>
      <div style={{display:"flex",width:"100%",maxWidth:460,marginBottom:18}}>
        {OB_STEPS.map((s)=>(<div key={s.id} style={{flex:1,display:"flex",flexDirection:"column",alignItems:"center",gap:3,cursor:s.id<step?"pointer":"default"}} onClick={()=>{if(s.id<step)setStep(s.id);}}>
          <div style={{width:24,height:24,borderRadius:"50%",background:step>s.id?"#22c55e":step===s.id?"#1a1a2e":"#e8edf3",color:step>=s.id?"#fff":"#aaa",display:"flex",alignItems:"center",justifyContent:"center",fontSize:step>s.id?11:10,fontWeight:800,border:step===s.id?"3px solid #22c55e":"3px solid transparent"}}>{step>s.id?"✓":s.id}</div>
          <div style={{fontSize:8,fontWeight:700,color:step===s.id?"#22c55e":"#ccc"}}>{s.icon}</div>
        </div>))}
      </div>
      <div style={{width:"100%",maxWidth:460,background:"#fff",borderRadius:20,boxShadow:"0 8px 28px rgba(0,0,0,0.08)",border:"2px solid #e8edf3",overflow:"hidden"}}>
        <div style={{padding:"16px 20px 12px",borderBottom:"2px solid #f0f4f8",background:"linear-gradient(135deg,#f8fafc,#f0fdf4)",display:"flex",alignItems:"center",gap:10}}>
          <div style={{width:36,height:36,borderRadius:11,background:"#e8fdf0",display:"flex",alignItems:"center",justifyContent:"center",fontSize:18}}>{OB_STEPS[step-1].icon}</div>
          <div style={{fontWeight:900,fontSize:15}}>{OB_STEPS[step-1].title}</div>
        </div>
        <div style={{padding:"16px 20px"}}>
          {error&&<div style={{background:"#fff0f0",border:"2px solid #fca5a5",borderRadius:10,padding:"9px 12px",fontSize:12,color:"#dc2626",fontWeight:700,marginBottom:14}}>{error}</div>}
          {step===1&&(<><F label="Full Name"><input value={data.ownerName} onChange={e=>setData(p=>({...p,ownerName:e.target.value}))} placeholder="e.g. Rahul Sharma" style={obIs}/></F><F label="Mobile"><input value={data.phone} onChange={e=>setData(p=>({...p,phone:e.target.value}))} placeholder="+91 98765 43210" style={obIs}/></F><F label="Email"><input value={data.email} onChange={e=>setData(p=>({...p,email:e.target.value}))} placeholder="rahul@gmail.com" type="email" style={obIs}/></F><F label="Password"><input value={data.password} onChange={e=>setData(p=>({...p,password:e.target.value}))} placeholder="Min 6 characters" type="password" style={obIs}/></F></>)}
          {step===2&&(<><F label="Salon Name"><input value={data.salonName} onChange={e=>setData(p=>({...p,salonName:e.target.value}))} placeholder="e.g. Sharma's Salon" style={obIs}/></F><F label="City"><input value={data.city} onChange={e=>setData(p=>({...p,city:e.target.value}))} placeholder="e.g. Delhi" style={obIs}/></F><F label="Salon Type"><select value={data.salonType} onChange={e=>setData(p=>({...p,salonType:e.target.value}))} style={{...is,marginTop:5,cursor:"pointer"}}><option value="unisex">💇 Unisex</option><option value="mens">💈 Men's Salon</option><option value="ladies">💄 Ladies Parlour</option><option value="bridal">👰 Bridal Studio</option></select></F></>)}
          {step===3&&(<><div style={{marginBottom:14}}><div style={{fontSize:13,fontWeight:800,color:"#555",marginBottom:8}}>Working Days</div><div style={{display:"flex",flexWrap:"wrap",gap:7}}>{WEEK_DAYS.map(d=>{const a=data.workDays.includes(d);return(<button key={d} onClick={()=>setData(p=>({...p,workDays:a?p.workDays.filter(x=>x!==d):[...p.workDays,d]}))} style={{padding:"6px 12px",borderRadius:20,border:`2px solid ${a?"#22c55e":"#e8edf3"}`,background:a?"#e8fdf0":"#fff",color:a?"#16a34a":"#888",fontSize:13,fontWeight:700,cursor:"pointer",fontFamily:"inherit"}}>{d}</button>);})}</div></div><div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10}}><F label="Opens At"><select value={data.openTime} onChange={e=>setData(p=>({...p,openTime:e.target.value}))} style={{...is,marginTop:5,cursor:"pointer"}}>{[6,7,8,9,10,11].map(h=><option key={h} value={h}>{h<=12?h:h-12}:00 {h<12?"AM":"PM"}</option>)}</select></F><F label="Closes At"><select value={data.closeTime} onChange={e=>setData(p=>({...p,closeTime:e.target.value}))} style={{...is,marginTop:5,cursor:"pointer"}}>{[18,19,20,21,22].map(h=><option key={h} value={h}>{h-12}:00 PM</option>)}</select></F></div></>)}
          {step===4&&(<div style={{display:"flex",flexDirection:"column",gap:8}}>{svcs.map(s=>(<div key={s.id} style={{background:s.active?"#f0fdf4":"#fafbfc",border:`2px solid ${s.active?"#86efac":"#e8edf3"}`,borderRadius:12,padding:"11px 13px",display:"flex",alignItems:"center",gap:10}}><button onClick={()=>setSvcs(prev=>prev.map(sv=>sv.id===s.id?{...sv,active:!sv.active}:sv))} style={{width:24,height:24,borderRadius:"50%",border:"none",background:s.active?"#22c55e":"#e8edf3",color:"#fff",fontSize:11,cursor:"pointer",flexShrink:0,fontWeight:800}}>{s.active?"✓":""}</button><span style={{fontSize:17}}>{s.emoji}</span><div style={{flex:1}}><div style={{fontWeight:800,fontSize:13,color:s.active?"#1a1a2e":"#bbb"}}>{s.name}</div><div style={{fontSize:11,color:"#aaa"}}>{s.duration} min</div></div>{s.active&&<div style={{fontWeight:800,fontSize:14,color:"#22c55e"}}>₹{s.price}</div>}</div>))}</div>)}
          {step===5&&(<><div style={{background:"#e8fdf0",border:"2px solid #bbf7d0",borderRadius:12,padding:"14px",marginBottom:14,textAlign:"center"}}><div style={{fontSize:28,marginBottom:4}}>💬</div><div style={{fontWeight:900,fontSize:13,color:"#16a34a"}}>Connect WhatsApp Business</div></div><F label="WhatsApp Number"><input value={data.waNumber} onChange={e=>setData(p=>({...p,waNumber:e.target.value}))} placeholder="+91 98765 43210" style={obIs}/></F></>)}
          {step===6&&(<div style={{textAlign:"center"}}><div style={{fontSize:50,marginBottom:10}}>🎉</div><div style={{fontWeight:900,fontSize:19,marginBottom:6}}>You're all set!</div><div style={{fontSize:13,color:"#888",lineHeight:1.7,marginBottom:18}}>{data.salonName||"Your salon"} is now live!<br/>WhatsApp bot ready hai. 💈</div><div style={{background:"#e8fdf0",border:"2px solid #bbf7d0",borderRadius:10,padding:"10px",fontSize:12,color:"#16a34a",fontWeight:700}}>✅ Account create ho raha hai...</div></div>)}
        </div>
        {step<6?(
          <div style={{padding:"0 20px 20px",display:"flex",gap:10}}>
            <button onClick={()=>step>1?setStep(s=>s-1):onBack()} style={{flex:1,padding:"12px",border:"2px solid #e8edf3",borderRadius:12,background:"#fff",fontFamily:"inherit",fontSize:14,fontWeight:700,cursor:"pointer"}}>← Back</button>
            <button onClick={()=>{if(canNext())setStep(s=>s+1);}} style={{flex:2,padding:"12px",background:canNext()?"#22c55e":"#d1d5db",border:"none",borderRadius:12,color:"#fff",fontFamily:"inherit",fontSize:14,fontWeight:800,cursor:canNext()?"pointer":"not-allowed"}}>{step===5?"Finish →":"Continue →"}</button>
          </div>
        ):(
          <div style={{padding:"0 20px 20px"}}>
            <button onClick={handleComplete} disabled={loading} style={{width:"100%",padding:"14px",background:loading?"#86efac":"#22c55e",border:"none",borderRadius:12,color:"#fff",fontFamily:"inherit",fontSize:15,fontWeight:800,cursor:loading?"not-allowed":"pointer",boxShadow:"0 4px 14px rgba(34,197,94,0.3)"}}>
              {loading?"Account ban raha hai...":"🚀 Go to Dashboard"}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── SETTINGS FIELD COMPONENT ─────────────────────────────────────────────────
const SF=({label,hint,children})=>(<div style={{marginBottom:16}}><div style={{fontSize:13,fontWeight:800,color:"#444",marginBottom:hint?3:5}}>{label}</div>{hint&&<div style={{fontSize:11,color:"#aaa",marginBottom:5}}>{hint}</div>}{children}</div>);
const SCard=({title,icon,children,np})=>(<div style={{background:"#fff",border:"2px solid #e8edf3",borderRadius:16,overflow:"hidden",marginBottom:12}}><div style={{padding:"12px 16px",borderBottom:"2px solid #f0f4f8",display:"flex",alignItems:"center",gap:9}}><div style={{width:32,height:32,borderRadius:10,background:"#e8fdf0",display:"flex",alignItems:"center",justifyContent:"center",fontSize:16}}>{icon}</div><div style={{fontWeight:900,fontSize:14}}>{title}</div></div><div style={np?{}:{padding:"14px 16px"}}>{children}</div></div>);
const SToggle=({val,onChange})=>(<div onClick={onChange} style={{width:44,height:24,borderRadius:12,cursor:"pointer",background:val?"#22c55e":"#e8edf3",position:"relative",transition:"background 0.2s",flexShrink:0}}><div style={{width:18,height:18,borderRadius:"50%",background:"#fff",position:"absolute",top:3,transition:"left 0.2s",left:val?"23px":"3px",boxShadow:"0 1px 4px rgba(0,0,0,0.15)"}}/></div>);

// ─── SETTINGS ─────────────────────────────────────────────────────────────────
function Settings({user,onLogout,onSalonUpdate,showRevenue,setShowRevenue}){
  const [tab,setTab]=useState("profile");
  const [saved,setSaved]=useState(false);
  const [loading,setLoading]=useState(true);

  const [profile,setProfile]=useState({
    salonName:user.salon,
    ownerName:user.name,
    phone:"98765 43210",
    email:user.email,
    city:user.city||"Delhi",
    salonType:"unisex",
    address:"",
    mapsLink:"",
  });

  const [logoUrl,setLogoUrl]=useState(user.logo_url||null);
  const [logoUploading,setLogoUploading]=useState(false);
  const logoFileRef=useRef(null);

  // ✅ FIX: gender field in default services
  const [services,setServices]=useState([
    {id:1,emoji:"✂️",name:"Haircut",price:250,duration:30,active:true,gender:"male"},
    {id:2,emoji:"✂️",name:"Haircut + Beard",price:450,duration:45,active:true,gender:"male"},
    {id:3,emoji:"🎨",name:"Hair Colour",price:1200,duration:90,active:true,gender:"both"},
    {id:4,emoji:"💆",name:"Facial + Cleanup",price:600,duration:60,active:false,gender:"both"},
    {id:5,emoji:"💄",name:"Bridal Makeup",price:2000,duration:90,active:false,gender:"female"},
  ]);

  const [hours,setHours]=useState({workDays:["Mon","Tue","Wed","Thu","Fri","Sat"],openTime:9,closeTime:21,slotDuration:30});
  const [wa,setWa]=useState({number:"+91 98765 43210",autoReply:true,greeting:`🙏 Namaste! ${user.salon} mein aapka swagat hai!\n\n1️⃣ Appointment Book\n2️⃣ Services & Prices`,confirmMsg:"✅ Booking confirmed!\n\n👤 {name}\n💇 {service}\n📅 {date} at {time}\n\nSee you soon! 💈"});
  const [editId,setEditId]=useState(null);
  const [showAdd,setShowAdd]=useState(false);
  const [openSection,setOpenSection]=useState(null); // null = dono band
  // ✅ FIX: gender added to newSvc default state
  const [newSvc,setNewSvc]=useState({emoji:"✂️",name:"",price:"",duration:30,gender:"both"});

  const SETTING_TABS=[{id:"profile",icon:"🏪",label:"Salon"},{id:"services",icon:"💇",label:"Services"},{id:"hours",icon:"🕐",label:"Hours"},{id:"whatsapp",icon:"💬",label:"WhatsApp"},{id:"account",icon:"👤",label:"Account"}];

  useEffect(()=>{
    async function loadSalonData(){
      try{
        const {data:salon}=await supabase.from("salons").select("*").eq("id",user.id).single();
        if(salon){
          setProfile(p=>({
            ...p,
            salonName:salon.salon_name||p.salonName,
            ownerName:salon.owner_name||p.ownerName,
            city:salon.city||p.city,
            address:salon.address||"",
            mapsLink:salon.maps_link||"",
          }));
          if(salon.services&&salon.services.length>0) setServices(salon.services);
          if(salon.working_days&&salon.working_days.length>0) setHours(h=>({...h,workDays:salon.working_days,openTime:salon.open_time||9,closeTime:salon.close_time||21}));
          if(salon.whatsapp_number) setWa(w=>({...w,number:salon.whatsapp_number}));
          if(salon.notification_number) setProfile(p=>({...p,notifNumber:salon.notification_number}));
        }
      }catch(e){console.error("Load error:",e);}
      setLoading(false);
    }
    loadSalonData();
  },[user.id]);

  async function handleLogoUpload(e){
    const file = e.target.files[0];
    if(!file) return;
    setLogoUploading(true);
    try{
      const ext = file.name.split(".").pop() || "jpg";
      const path = `${user.id}/logo.${ext}`;
      const { error: uploadErr } = await supabase.storage.from(LOGO_BUCKET).upload(path, file, { upsert: true });
      if(uploadErr) throw uploadErr;
      const { data: urlData } = supabase.storage.from(LOGO_BUCKET).getPublicUrl(path);
      const newUrl = urlData.publicUrl;
      setLogoUrl(newUrl);
      await supabase.from("salons").update({ logo_url: newUrl }).eq("id", user.id);
      onSalonUpdate(profile.salonName, newUrl);
    }catch(err){ console.error("Logo upload error:", err); }
    setLogoUploading(false);
    e.target.value = "";
  }

  async function save(){
    setSaved(true);
    try{
      await supabase.from("salons").update({
        salon_name: profile.salonName,
        owner_name: profile.ownerName,
        city: profile.city,
        address: profile.address || "",
        maps_link: profile.mapsLink || "",
        whatsapp_number: wa.number || "",
        services: services,
        working_days: hours.workDays,
        open_time: hours.openTime,
        close_time: hours.closeTime,
        notification_number: profile.notifNumber || "",
      }).eq("id", user.id);
      onSalonUpdate(profile.salonName, logoUrl);
    }catch(e){ console.error(e); }
    setTimeout(()=>setSaved(false), 2500);
  }

  async function handleLogout(){
    await supabase.auth.signOut();
    onLogout();
  }

  function toggleSvc(id){setServices(p=>p.map(s=>s.id===id?{...s,active:!s.active}:s));}
  function updSvc(id,f,v){setServices(p=>p.map(s=>s.id===id?{...s,[f]:v}:s));}
  function delSvc(id){setServices(p=>p.filter(s=>s.id!==id));setEditId(null);}
  function addSvc(){
    if(!newSvc.name.trim())return;
    setServices(p=>[...p,{id:Date.now(),emoji:newSvc.emoji,name:newSvc.name.trim(),price:parseInt(newSvc.price)||0,duration:newSvc.duration,active:true,gender:newSvc.gender||"both"}]);
    setNewSvc({emoji:"✂️",name:"",price:"",duration:30,gender:"both"});
    setShowAdd(false);
  }
  function toggleDay(d){setHours(p=>({...p,workDays:p.workDays.includes(d)?p.workDays.filter(x=>x!==d):[...p.workDays,d]}));}

  const inputStyle={...is,marginTop:5};
  const selStyle={...inputStyle,cursor:"pointer"};
  const F=SF;
  const Card=SCard;
  const Toggle=SToggle;

  // Gender label helper
  const genderLabel=(g)=>g==="male"?"👨 Male":g==="female"?"👩 Female":"👥 Both";

  if(loading) return <div style={{flex:1,display:"flex",alignItems:"center",justifyContent:"center",fontSize:14,color:"#888"}}>Loading...</div>;

  return(
    <div style={{flex:1,display:"flex",flexDirection:"column",overflow:"hidden"}}>
      <div style={{background:"#fff",borderBottom:"2px solid #e8edf3",display:"flex",overflowX:"auto",flexShrink:0}}>
        {SETTING_TABS.map(t=>(<div key={t.id} onClick={()=>setTab(t.id)} style={{flex:1,minWidth:60,padding:"10px 4px",display:"flex",flexDirection:"column",alignItems:"center",gap:3,cursor:"pointer",borderBottom:`3px solid ${tab===t.id?"#22c55e":"transparent"}`}}><span style={{fontSize:17}}>{t.icon}</span><span style={{fontSize:10,fontWeight:800,color:tab===t.id?"#22c55e":"#aaa"}}>{t.label}</span></div>))}
      </div>
      <div style={{flex:1,overflowY:"auto",padding:"14px 14px 80px"}}>
        {tab==="profile"&&(<>
          <Card title="Salon Logo" icon="🖼️">
            <input ref={logoFileRef} type="file" accept="image/*" style={{display:"none"}} onChange={handleLogoUpload}/>
            <div style={{display:"flex",alignItems:"center",gap:14}}>
              <div style={{width:72,height:72,borderRadius:16,overflow:"hidden",border:"2px solid #e8edf3",background:"#f8fafc",display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}>
                {logoUrl ? <img src={logoUrl} alt="logo" style={{width:"100%",height:"100%",objectFit:"cover"}}/> : <span style={{fontSize:28}}>✂️</span>}
              </div>
              <div style={{flex:1}}>
                <div style={{fontWeight:800,fontSize:13,marginBottom:4}}>{logoUrl?"Logo uploaded ✅":"No logo yet"}</div>
                <div style={{fontSize:11,color:"#888",marginBottom:10}}>App header mein aur home screen pe dikhega</div>
                <button onClick={()=>logoFileRef.current?.click()} style={{padding:"8px 14px",background:logoUploading?"#f0f4f8":"#e8fdf0",border:"2px solid #bbf7d0",borderRadius:10,color:"#16a34a",fontFamily:"inherit",fontSize:12,fontWeight:800,cursor:logoUploading?"not-allowed":"pointer"}}>
                  {logoUploading?"Uploading...":"📷 Upload Logo"}
                </button>
              </div>
            </div>
          </Card>

          <Card title="Salon Details" icon="🏪">
            <F label="Salon Name"><input value={profile.salonName} onChange={e=>setProfile(p=>({...p,salonName:e.target.value}))} style={inputStyle}/></F>
            <F label="Owner Name"><input value={profile.ownerName} onChange={e=>setProfile(p=>({...p,ownerName:e.target.value}))} style={inputStyle}/></F>
            <F label="City"><input value={profile.city} onChange={e=>setProfile(p=>({...p,city:e.target.value}))} style={inputStyle}/></F>
            <F label="Address" hint="Customers ko WhatsApp pe yeh address dikhega"><input value={profile.address} onChange={e=>setProfile(p=>({...p,address:e.target.value}))} placeholder="e.g. Shop 12, MG Road, Delhi" style={inputStyle}/></F>
            <F label="Google Maps Link" hint="Paste karo apne salon ka Google Maps link"><input value={profile.mapsLink} onChange={e=>setProfile(p=>({...p,mapsLink:e.target.value}))} placeholder="https://maps.google.com/..." style={inputStyle}/></F>
            <F label="Owner Notification Number" hint="Is number pe booking notification aayegi (apna personal number)"><input value={profile.notifNumber||""} onChange={e=>setProfile(p=>({...p,notifNumber:e.target.value}))} placeholder="e.g. 919876543210" style={inputStyle}/></F>
            <F label="Salon Type"><select value={profile.salonType} onChange={e=>setProfile(p=>({...p,salonType:e.target.value}))} style={selStyle}><option value="unisex">💇 Unisex</option><option value="mens">💈 Men's Salon</option><option value="ladies">💄 Ladies Parlour</option><option value="bridal">👰 Bridal Studio</option></select></F>
          </Card>

          <Card title="Staff Settings" icon="👨‍💼">
            <div style={{display:"flex",alignItems:"center",justifyContent:"space-between"}}>
              <div><div style={{fontWeight:800,fontSize:13}}>Staff ko Revenue dikhao?</div><div style={{fontSize:11,color:"#888",marginTop:2}}>{showRevenue?"Staff apni earnings dekh sakta hai":"Staff ko ₹ amounts hidden hain"}</div></div>
              <Toggle val={showRevenue} onChange={()=>setShowRevenue(v=>!v)}/>
            </div>
          </Card>
        </>)}

        {tab==="services"&&(<>
          {["male","female"].map(genderSection=>{
            const sectionSvcs = services.filter(s=>(s.gender||"male")===genderSection);
            const sectionColor = genderSection==="male" ? "#3b82f6" : "#ec4899";
            const sectionBg    = genderSection==="male" ? "#eff6ff" : "#fff0f6";
            const sectionBorder= genderSection==="male" ? "#93c5fd" : "#f9a8d4";
            const sectionLabel = genderSection==="male" ? "👨 Male Services" : "👩 Female Services";
            const isAdding     = showAdd === genderSection;
            const isOpen       = openSection === genderSection;
            return(
              <div key={genderSection} style={{background:"#fff",border:`2px solid ${isOpen?sectionColor:sectionBorder}`,borderRadius:16,overflow:"hidden",marginBottom:12,transition:"all 0.2s"}}>
                {/* ✅ Clickable header — click se open/close */}
                <div onClick={()=>{setOpenSection(isOpen?null:genderSection);setShowAdd(false);setEditId(null);}} style={{padding:"14px 16px",background:isOpen?sectionBg:"#fff",display:"flex",alignItems:"center",justifyContent:"space-between",cursor:"pointer",transition:"background 0.2s"}}>
                  <div style={{display:"flex",alignItems:"center",gap:10}}>
                    <div style={{fontWeight:900,fontSize:14,color:isOpen?sectionColor:"#1a1a2e"}}>{sectionLabel}</div>
                    <div style={{background:isOpen?sectionColor+"22":"#f0f4f8",color:isOpen?sectionColor:"#888",fontSize:11,fontWeight:800,padding:"2px 8px",borderRadius:20}}>{sectionSvcs.filter(s=>s.active).length} services</div>
                  </div>
                  <div style={{fontSize:16,color:isOpen?sectionColor:"#aaa",transition:"transform 0.2s",transform:isOpen?"rotate(180deg)":"rotate(0deg)"}}>⌄</div>
                </div>
                {/* ✅ Content — sirf tab dikhao jab open ho */}
                {isOpen&&<>
                {sectionSvcs.map(s=>(<div key={s.id}>{editId===s.id?(
                  <div style={{padding:"13px 14px",borderBottom:"2px solid #f0f4f8",background:"#f8fafc"}}>
                    <div style={{fontWeight:800,fontSize:13,color:sectionColor,marginBottom:9}}>✏️ {s.name}</div>
                    <div style={{display:"grid",gridTemplateColumns:"46px 1fr",gap:7,marginBottom:9}}>
                      <select value={s.emoji} onChange={e=>updSvc(s.id,"emoji",e.target.value)} style={{...selStyle,fontSize:18,textAlign:"center",padding:"8px 4px",height:44,marginTop:0}}>{EMOJIS.map(em=><option key={em} value={em}>{em}</option>)}</select>
                      <input value={s.name} onChange={e=>updSvc(s.id,"name",e.target.value)} style={{...is,height:44}}/>
                    </div>
                    <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8,marginBottom:11}}>
                      <div><div style={{fontSize:12,fontWeight:700,color:"#555",marginBottom:4}}>Price (₹)</div><input type="number" value={s.price} onChange={e=>updSvc(s.id,"price",parseInt(e.target.value)||0)} style={is}/></div>
                      <div><div style={{fontSize:12,fontWeight:700,color:"#555",marginBottom:4}}>Duration</div><select value={s.duration} onChange={e=>updSvc(s.id,"duration",parseInt(e.target.value))} style={{...is,cursor:"pointer"}}>{[15,30,45,60,75,90,120].map(d=><option key={d} value={d}>{d} min</option>)}</select></div>
                    </div>
                    <div style={{display:"flex",gap:8}}>
                      <button onClick={()=>setEditId(null)} style={{flex:1,padding:"10px",background:sectionColor,border:"none",borderRadius:10,color:"#fff",fontFamily:"inherit",fontSize:13,fontWeight:800,cursor:"pointer"}}>✓ Done</button>
                      <button onClick={()=>delSvc(s.id)} style={{padding:"10px 14px",background:"#fff0f0",border:"2px solid #fca5a5",borderRadius:10,color:"#dc2626",fontFamily:"inherit",fontSize:13,cursor:"pointer"}}>🗑</button>
                    </div>
                  </div>
                ):(
                  <div style={{display:"flex",alignItems:"center",gap:11,padding:"12px 14px",borderBottom:"2px solid #f0f4f8",background:s.active?"#fff":"#fafbfc"}}>
                    <button onClick={()=>toggleSvc(s.id)} style={{width:22,height:22,borderRadius:"50%",border:"none",background:s.active?sectionColor:"#e8edf3",color:"#fff",fontSize:10,fontWeight:800,cursor:"pointer",flexShrink:0}}>{s.active?"✓":""}</button>
                    <span style={{fontSize:18,flexShrink:0}}>{s.emoji}</span>
                    <div style={{flex:1}}>
                      <div style={{fontWeight:800,fontSize:13,color:s.active?"#1a1a2e":"#aaa"}}>{s.name}</div>
                      <div style={{fontSize:11,color:"#aaa"}}>{s.duration} min</div>
                    </div>
                    <div style={{fontWeight:800,fontSize:13,color:s.active?sectionColor:"#ccc"}}>₹{s.price}</div>
                    <button onClick={()=>setEditId(s.id)} style={{width:30,height:30,border:"2px solid #e8edf3",borderRadius:8,background:"#fff",cursor:"pointer",fontSize:13,display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}>✏️</button>
                  </div>
                )}</div>))}
                {isAdding?(
                  <div style={{padding:"13px 14px",background:sectionBg}}>
                    <div style={{fontWeight:800,fontSize:13,color:sectionColor,marginBottom:9}}>➕ New {genderSection==="male"?"Male":"Female"} Service</div>
                    <div style={{display:"grid",gridTemplateColumns:"46px 1fr",gap:7,marginBottom:9}}>
                      <select value={newSvc.emoji} onChange={e=>setNewSvc(p=>({...p,emoji:e.target.value}))} style={{...selStyle,fontSize:18,textAlign:"center",padding:"8px 4px",height:44,marginTop:0}}>{EMOJIS.map(em=><option key={em} value={em}>{em}</option>)}</select>
                      <input value={newSvc.name} onChange={e=>setNewSvc(p=>({...p,name:e.target.value}))} placeholder="Service name" style={{...is,height:44}}/>
                    </div>
                    <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8,marginBottom:11}}>
                      <div><div style={{fontSize:12,fontWeight:700,color:"#555",marginBottom:4}}>Price (₹)</div><input type="number" value={newSvc.price} onChange={e=>setNewSvc(p=>({...p,price:e.target.value}))} placeholder="450" style={is}/></div>
                      <div><div style={{fontSize:12,fontWeight:700,color:"#555",marginBottom:4}}>Duration</div><select value={newSvc.duration} onChange={e=>setNewSvc(p=>({...p,duration:parseInt(e.target.value)}))} style={{...is,cursor:"pointer"}}>{[15,30,45,60,75,90,120].map(d=><option key={d} value={d}>{d} min</option>)}</select></div>
                    </div>
                    <div style={{display:"flex",gap:8}}>
                      <button onClick={()=>{
                        if(!newSvc.name.trim())return;
                        setServices(p=>[...p,{id:Date.now(),emoji:newSvc.emoji,name:newSvc.name.trim(),price:parseInt(newSvc.price)||0,duration:newSvc.duration,active:true,gender:genderSection}]);
                        setNewSvc({emoji:"✂️",name:"",price:"",duration:30,gender:"both"});
                        setShowAdd(false);
                      }} style={{flex:1,padding:"10px",background:sectionColor,border:"none",borderRadius:10,color:"#fff",fontFamily:"inherit",fontSize:13,fontWeight:800,cursor:"pointer"}}>➕ Add</button>
                      <button onClick={()=>setShowAdd(false)} style={{padding:"10px 14px",background:"#fff",border:"2px solid #e8edf3",borderRadius:10,fontFamily:"inherit",fontSize:13,cursor:"pointer",color:"#888"}}>Cancel</button>
                    </div>
                  </div>
                ):(
                  <div style={{padding:"11px 14px"}}>
                    <button onClick={()=>{setShowAdd(genderSection);setNewSvc({emoji:"✂️",name:"",price:"",duration:30,gender:genderSection});}} style={{width:"100%",padding:"10px",background:sectionBg,border:`2px dashed ${sectionBorder}`,borderRadius:11,color:sectionColor,fontFamily:"inherit",fontSize:13,fontWeight:800,cursor:"pointer"}}>
                      ➕ Add {genderSection==="male"?"Male":"Female"} Service
                    </button>
                  </div>
                )}
                </>}
              </div>
            );
          })}
        </>)}

        {tab==="hours"&&(<>
          <Card title="Working Days" icon="📅"><div style={{display:"flex",flexWrap:"wrap",gap:7}}>{WEEK_DAYS.map(d=>{const a=hours.workDays.includes(d);return(<button key={d} onClick={()=>toggleDay(d)} style={{padding:"7px 14px",borderRadius:20,border:`2px solid ${a?"#22c55e":"#e8edf3"}`,background:a?"#e8fdf0":"#fff",color:a?"#16a34a":"#888",fontSize:13,fontWeight:800,cursor:"pointer",fontFamily:"inherit"}}>{d}</button>);})}</div></Card>
          <Card title="Timings" icon="🕐">
            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10,marginBottom:12}}>
              <F label="Opens At"><select value={hours.openTime} onChange={e=>setHours(p=>({...p,openTime:parseInt(e.target.value)}))} style={selStyle}>{HOURS_LIST.filter(h=>h.val<=14).map(h=><option key={h.val} value={h.val}>{h.label}</option>)}</select></F>
              <F label="Closes At"><select value={hours.closeTime} onChange={e=>setHours(p=>({...p,closeTime:parseInt(e.target.value)}))} style={selStyle}>{HOURS_LIST.filter(h=>h.val>=12).map(h=><option key={h.val} value={h.val}>{h.label}</option>)}</select></F>
            </div>
            <div style={{background:"#f0fdf4",border:"2px solid #bbf7d0",borderRadius:11,padding:"10px 12px",fontSize:12,color:"#16a34a",fontWeight:700}}>📅 {hours.openTime}:00 → {hours.closeTime>12?hours.closeTime-12:hours.closeTime}:00</div>
          </Card>
        </>)}

        {tab==="whatsapp"&&(<>
          <Card title="WhatsApp Number" icon="📱"><F label="WhatsApp Business Number"><input value={wa.number} onChange={e=>setWa(p=>({...p,number:e.target.value}))} style={inputStyle}/></F><button style={{width:"100%",padding:"11px",background:"#e8fdf0",border:"2px solid #bbf7d0",borderRadius:11,color:"#16a34a",fontFamily:"inherit",fontSize:13,fontWeight:800,cursor:"pointer"}}>📲 Send Test Message</button></Card>
          <Card title="Bot Messages" icon="💬"><F label="Greeting Message"><textarea value={wa.greeting} onChange={e=>setWa(p=>({...p,greeting:e.target.value}))} rows={4} style={{...is,marginTop:5,resize:"vertical",lineHeight:1.6}}/></F><F label="Confirmation Message"><textarea value={wa.confirmMsg} onChange={e=>setWa(p=>({...p,confirmMsg:e.target.value}))} rows={5} style={{...is,marginTop:5,resize:"vertical",lineHeight:1.6}}/></F></Card>
        </>)}

        {tab==="account"&&(<>
          <div style={{background:"#1a1a2e",borderRadius:16,padding:"18px",marginBottom:12}}>
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:10}}>
              <div><div style={{fontSize:12,color:"#888"}}>Current Plan</div><div style={{fontWeight:900,fontSize:20,color:"#fff",marginTop:2}}>⚡ Early Access</div></div>
              <div style={{textAlign:"right"}}><div style={{fontWeight:700,fontSize:13,color:"#22c55e"}}>Beta User 🎉</div></div>
            </div>
            <button style={{width:"100%",padding:"10px",background:"#22c55e",border:"none",borderRadius:10,color:"#fff",fontFamily:"inherit",fontSize:13,fontWeight:800,cursor:"pointer"}}>📩 Contact for Pricing</button>
          </div>
          <div style={{background:"#fff",border:"2px solid #e8edf3",borderRadius:14,padding:"14px",marginBottom:12}}>
            <div style={{fontWeight:800,fontSize:13,marginBottom:4}}>Account Info</div>
            <div style={{fontSize:12,color:"#888"}}>Email: {user.email}</div>
            <div style={{fontSize:12,color:"#888",marginTop:4}}>Salon: {user.salon}</div>
          </div>
          <button onClick={handleLogout} style={{width:"100%",padding:"14px",background:"#fff",border:"2px solid #e8edf3",borderRadius:14,color:"#dc2626",fontFamily:"inherit",fontSize:14,fontWeight:800,cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",gap:8,marginBottom:12}}>🚪 Logout</button>
        </>)}
      </div>
      {tab!=="account"&&(
        <div style={{position:"sticky",bottom:0,background:"#fff",borderTop:"2px solid #e8edf3",padding:"11px 16px",boxShadow:"0 -4px 14px rgba(0,0,0,0.06)"}}>
          <button onClick={save} style={{width:"100%",padding:"13px",background:saved?"#e8fdf0":"#22c55e",border:saved?"2px solid #86efac":"none",borderRadius:12,color:saved?"#16a34a":"#fff",fontFamily:"inherit",fontSize:14,fontWeight:800,cursor:"pointer",transition:"all 0.2s"}}>
            {saved?"✅ Saved!":"💾 Save Changes"}
          </button>
        </div>
      )}
    </div>
  );
}

// ─── STAFF SALON ENTRY ────────────────────────────────────────────────────────
function StaffSalonEntry({onFound,onBack}){
  const [phone,setPhone]=useState("");
  const [pin,setPin]=useState("");
  const [loading,setLoading]=useState(false);
  const [error,setError]=useState("");

  async function handleLogin(){
    if(!phone.trim()){setError("Apna phone number daalo!");return;}
    if(!pin||pin.length!==4){setError("4-digit PIN daalo!");return;}
    setLoading(true);setError("");
    try{
      const {data:staffData}=await supabase.from("staff").select("*").eq("phone",phone.trim()).single();
      if(!staffData){setError("Is number se koi staff nahi mila! Owner se check karo.");setLoading(false);return;}
      if(staffData.pin!==pin){setError("PIN galat hai! Dobara try karo.");setPin("");setLoading(false);return;}
      onFound(staffData);
    }catch(e){
      setError("Koi staff nahi mila is number se!");
    }
    setLoading(false);
  }

  const IS2={width:"100%",padding:"11px 13px",border:"2px solid #e8edf3",borderRadius:11,fontSize:14,fontFamily:"inherit",outline:"none",background:"#fafbfc",boxSizing:"border-box",color:"#1a1a2e"};

  return(
    <div style={{minHeight:"100vh",background:"linear-gradient(135deg,#1a1a2e,#16213e)",display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",padding:"24px 20px",fontFamily:"system-ui,sans-serif"}}>
      <div style={{fontSize:28,fontWeight:900,color:"#fff",marginBottom:4}}>✂️ SnipBook</div>
      <div style={{fontSize:13,color:"#a0a0c0",marginBottom:32}}>Staff Portal</div>
      <div style={{background:"#fff",borderRadius:20,padding:"26px 22px",width:"100%",maxWidth:360,boxShadow:"0 16px 48px rgba(0,0,0,0.3)"}}>
        <div style={{fontWeight:900,fontSize:17,marginBottom:4,color:"#1a1a2e"}}>Staff Login</div>
        <div style={{fontSize:13,color:"#888",marginBottom:20}}>Apna phone number aur PIN daalo</div>
        <div style={{marginBottom:14}}>
          <div style={{fontSize:13,fontWeight:800,color:"#555",marginBottom:6}}>Apna Phone Number</div>
          <input style={IS2} placeholder="e.g. 9876543210" value={phone} onChange={e=>setPhone(e.target.value.replace(/\D/g,"").slice(0,10))} onKeyDown={e=>e.key==="Enter"&&handleLogin()} onFocus={e=>e.target.style.borderColor="#22c55e"} onBlur={e=>e.target.style.borderColor="#e8edf3"} autoFocus/>
        </div>
        <div style={{marginBottom:18}}>
          <div style={{fontSize:13,fontWeight:800,color:"#555",marginBottom:6}}>4-digit PIN</div>
          <input style={IS2} type="password" placeholder="••••" maxLength={4} value={pin} onChange={e=>{setPin(e.target.value);setError("");}} onKeyDown={e=>e.key==="Enter"&&handleLogin()} onFocus={e=>e.target.style.borderColor="#22c55e"} onBlur={e=>e.target.style.borderColor="#e8edf3"}/>
        </div>
        {error&&<div style={{background:"#fff0f0",border:"1.5px solid #fca5a5",borderRadius:9,padding:"9px 12px",marginBottom:14,fontSize:12,color:"#dc2626",fontWeight:600}}>⚠️ {error}</div>}
        <button onClick={handleLogin} style={{width:"100%",padding:"13px",background:loading?"#86efac":"#22c55e",border:"none",borderRadius:12,color:"#fff",fontFamily:"inherit",fontSize:15,fontWeight:800,cursor:"pointer",marginBottom:12}}>
          {loading?"Logging in...":"Login Karo →"}
        </button>
        <button onClick={onBack} style={{width:"100%",background:"none",border:"none",color:"#888",fontSize:13,fontWeight:700,cursor:"pointer",fontFamily:"inherit"}}>← Back</button>
      </div>
    </div>
  );
}

// ─── NAV ─────────────────────────────────────────────────────────────────────
const NAV=[
  {id:"dashboard", icon:"🏠", label:"Home"},
  {id:"calendar",  icon:"📅", label:"Calendar"},
  {id:"clients",   icon:"👥", label:"Clients"},
  {id:"staff",     icon:"👨‍💼", label:"Staff"},
  {id:"history",   icon:"📋", label:"History"},
  {id:"engage",    icon:"💫", label:"Engage"},
  {id:"settings",  icon:"⚙️", label:"Settings"},
];

// ─── MAIN OWNER APP ───────────────────────────────────────────────────────────
function MainApp({user,setUser,onLogout,showRevenue,setShowRevenue}){
  const [screen,setScreen]=useState("dashboard");
  const [bookings,setBookings]=useState(user?.id==="demo" ? seedBookings : {});
  const today=new Date(); // ✅ Real today
  const todayKey=dateKey(today);
  const dayData=bookings[todayKey]||{};
  const booked=Object.values(dayData).filter(b=>b.status!=="break").length;
  const revenue=Object.values(dayData).reduce((s,b)=>s+(b.price||0),0);
  const pending=Object.values(dayData).filter(b=>b.status==="pending").length;

  const [selDate,setSelDate]=useState(today);
  const [showNotifs,setShowNotifs]=useState(false);
  const [notifications,setNotifications]=useState([]);
  const [unreadCount,setUnreadCount]=useState(0);

  // ✅ Load recent bookings as notifications
  useEffect(()=>{
    async function loadNotifications(){
      try{
        const {data}=await supabase.from("appointments").select("*").eq("salon_id",user.id).eq("status","confirmed").order("created_at",{ascending:false}).limit(10);
        if(data&&data.length>0){
          setNotifications(data);
          // Last seen time se compare karo
          const lastSeen = localStorage.getItem(`notif_seen_${user.id}`) || "0";
          const unseen = data.filter(a=>new Date(a.created_at)>new Date(lastSeen));
          setUnreadCount(unseen.length);
        }
      }catch(e){console.error("notif error",e);}
    }
    loadNotifications();
    // Har 30 sec mein refresh
    const interval = setInterval(loadNotifications, 30000);
    return ()=>clearInterval(interval);
  },[user.id]);

  function handleBell(){
    setShowNotifs(v=>!v);
    // Mark as seen
    localStorage.setItem(`notif_seen_${user.id}`, new Date().toISOString());
    setUnreadCount(0);
  }
  const [weekStart,setWeekStart]=useState(()=>{const d=new Date(today);d.setDate(d.getDate()-d.getDay());return d;});
  const [calModal,setCalModal]=useState(null);
  const [calForm,setCalForm]=useState({name:"",service:SERVICES_LIST[0],price:"",src:"wa"});
  const touchStart=useRef(null);
  const selKey=dateKey(selDate);
  const sDayData=bookings[selKey]||{};
  const slots=[];
  for(let h=9;h<21;h++){slots.push(`${pad(h)}:00`);slots.push(`${pad(h)}:30`);}
  function prevDay(){const d=addDays(selDate,-1);setSelDate(d);const ws=new Date(d);ws.setDate(ws.getDate()-ws.getDay());setWeekStart(ws);}
  function nextDay(){const d=addDays(selDate,1);setSelDate(d);const ws=new Date(d);ws.setDate(ws.getDate()-ws.getDay());setWeekStart(ws);}
  async function saveCal(){
    if(!calForm.name.trim())return;
    const color=COLORS[Math.floor(Math.random()*COLORS.length)];
    const service=calForm.service.replace(/^[\S]+ /,"");
    const price=parseInt(calForm.price)||0;
    await supabase.from("appointments").insert({salon_id:user.id,service,amount:price,date:selKey,time_slot:calModal.slot,status:"confirmed"});
    setBookings(prev=>({...prev,[selKey]:{...(prev[selKey]||{}),[calModal.slot]:{name:calForm.name.trim(),service,price,src:calForm.src,status:"confirmed",color}}}));
    setCalModal(null);
  }

  useEffect(()=>{
    async function loadBookings(){
      try{
        const {data,error}=await supabase.from("appointments").select("*").eq("salon_id",user.id);
        console.log("Bookings loaded:", data?.length, error);
        if(data&&data.length>0){
          const bk={};
          data.forEach(a=>{
            if(!bk[a.date])bk[a.date]={};
            // ✅ time_slot format check — "12:30" ya "12:30 PM" dono handle karo
            const slot = a.time_slot?.includes(" ") ? a.time_slot.split(" ")[0] : a.time_slot;
            if(slot){
              bk[a.date][slot]={
                name:a.customer_name||a.customer_phone||"WhatsApp Customer",
                service:a.service,
                price:a.amount||0,
                src:"wa",
                status:a.status||"confirmed",
                color:COLORS[Math.floor(Math.random()*COLORS.length)]
              };
            }
          });
          console.log("Bookings data:", JSON.stringify(bk).slice(0,200));
          setBookings(bk); // ✅ prev spread nahi — fresh set karo
        }
      }catch(e){console.error("loadBookings error:",e);}
    }
    loadBookings();
  },[user.id]);

  const BOT={welcome:{text:`🙏 *Namaste! Welcome to ${user.salon}*\n\nHow can I help?`,options:[{label:"📅 Book Appointment",next:"askName"},{label:"💰 Services & Prices",next:"showSvc"},{label:"📋 My Bookings",next:"myBook"}]},showSvc:{text:"Our Services:\n\n✂️ *Haircut* — ₹250\n✂️ *Haircut + Beard* — ₹450\n🎨 *Hair Colour* — ₹1,200\n💆 *Facial* — ₹600\n💄 *Bridal Makeup* — ₹2,000",options:[{label:"📅 Book Now",next:"askName"},{label:"🏠 Main Menu",next:"welcome"}]},myBook:{text:"*1 upcoming appointment:*\n\n📅 26 Mar, 2:30 PM\n✂️ Haircut + Beard — ₹450\n✓ Confirmed",options:[{label:"🏠 Main Menu",next:"welcome"},{label:"📅 Book Another",next:"askName"}]},askName:{text:"Great! What's your *name*?",inputType:"text",inputPlaceholder:"Type your name…",next:"askSvc"},askSvc:{text:"Nice to meet you, *{name}*! 🙌\n\nWhich service?",options:[{label:"✂️ Haircut — ₹250",next:"askSlot"},{label:"✂️ Haircut + Beard — ₹450",next:"askSlot"},{label:"🎨 Hair Colour — ₹1,200",next:"askSlot"},{label:"💆 Facial — ₹600",next:"askSlot"}]},askSlot:{text:"*Available slots:*",options:[{label:"🟢 9:30 AM",next:"booked"},{label:"🟢 11:00 AM",next:"booked"},{label:"🟢 2:30 PM",next:"booked"},{label:"🟢 5:00 PM",next:"booked"}]},booked:{text:"🎉 *Booking Confirmed!*\n\n✅ {name} — {service}\n🕐 {slot}\n\nReminder 1 hour before. See you! 💈",options:[{label:"🏠 Main Menu",next:"welcome"}]}};
  const [botMsgs,setBotMsgs]=useState([]);
  const [botStep,setBotStep]=useState("welcome");
  const [botTyping,setBotTyping]=useState(false);
  const [botInput,setBotInput]=useState("");
  const [botUser,setBotUser]=useState({name:"",service:"",slot:""});
  const botBottom=useRef(null);
  function bNow(){const d=new Date();return `${d.getHours()}:${pad(d.getMinutes())}`;}
  function fillB(t){return t.replace("{name}",botUser.name||"Friend").replace("{service}",botUser.service||"").replace("{slot}",botUser.slot||"");}
  function pushBot(sk){const s=BOT[sk];if(!s)return;setBotTyping(true);setTimeout(()=>{setBotTyping(false);setBotMsgs(prev=>[...prev,{from:"bot",text:fillB(s.text),time:bNow(),stepKey:sk,options:s.options,inputType:s.inputType,inputPlaceholder:s.inputPlaceholder}]);setBotStep(sk);setTimeout(()=>botBottom.current?.scrollIntoView({behavior:"smooth"}),100);},800);}
  function botOpt(opt,ms){if(ms==="askSvc"){const m=opt.label.match(/[✂️🎨💆💄]\s(.+?)\s—/);if(m)setBotUser(p=>({...p,service:m[1]}));}if(ms==="askSlot"){setBotUser(p=>({...p,slot:opt.label.replace("🟢 ","")}));}setBotMsgs(prev=>[...prev.map((m,i)=>i===prev.length-1?{...m,options:null,inputType:null}:m),{from:"user",text:opt.label,time:bNow()}]);setTimeout(()=>pushBot(opt.next),300);}
  function botSend(){if(!botInput.trim())return;if(botStep==="askName")setBotUser(p=>({...p,name:botInput.trim()}));setBotMsgs(prev=>[...prev.map(m=>({...m,inputType:null})),{from:"user",text:botInput.trim(),time:bNow()}]);setBotInput("");const s=BOT[botStep];if(s?.next)setTimeout(()=>pushBot(s.next),300);}
  useState(()=>{setTimeout(()=>pushBot("welcome"),400);},[]);

  const [clients,setClients]=useState(user?.id==="demo" ? CLIENTS_DATA : []);
  const [selClient,setSelClient]=useState(null);
  const [cSearch,setCSearch]=useState("");
  const [cFilter,setCFilter]=useState("All");
  const [showAddClient,setShowAddClient]=useState(false);
  const [newClient,setNewClient]=useState({name:"",phone:"",city:"",dob:"",tag:"Regular"});
  const [editClient,setEditClient]=useState(null); // editing client data
  const [showEditClient,setShowEditClient]=useState(false);

  useEffect(()=>{
    async function loadClients(){
      const {data}=await supabase.from("customers").select("*").eq("salon_id",user.id);
      if(data&&data.length>0){
        setClients(data.map(c=>({
          ...c,
          src:c.source||"walk",
          avatar:c.name.split(" ").map(w=>w[0]).join("").slice(0,2).toUpperCase(),
          color:["#22c55e","#3b82f6","#a855f7","#f59e0b","#14b8a6","#ec4899"][Math.floor(Math.random()*6)],
          joined:new Date(c.created_at).toLocaleDateString("en-IN",{month:"short",year:"numeric"}),
          visits:0,totalSpent:0,lastVisit:"—",history:[]
        })));
      }
    }
    if(screen==="clients") loadClients();
  },[user.id, screen]);

  const TAG={VIP:{bg:"#fef9c3",color:"#a16207",border:"#fde68a"},Regular:{bg:"#e8fdf0",color:"#16a34a",border:"#86efac"},New:{bg:"#eff6ff",color:"#2563eb",border:"#93c5fd"}};
  const filtC=clients.filter(c=>{const q=cSearch.toLowerCase();const ms=!q||c.name.toLowerCase().includes(q)||c.phone.includes(q);const mf=cFilter==="All"?true:cFilter==="VIP"?c.tag==="VIP":cFilter==="Regular"?c.tag==="Regular":cFilter==="New"?c.tag==="New":cFilter==="WhatsApp"?c.src==="wa":c.src==="walk";return ms&&mf;});

  return(
    <div style={{height:"100vh",display:"flex",flexDirection:"column",fontFamily:"system-ui,sans-serif",color:"#1a1a2e",background:"#f0f4f8",overflow:"hidden"}}>
      <SalonHeader user={user} screen={screen} onSettings={()=>setScreen("settings")} unreadCount={unreadCount} onBell={handleBell}/>
      <div style={{flex:1,overflow:"hidden",display:"flex",flexDirection:"column"}}>

        {screen==="dashboard"&&(
          <div style={{padding:"14px 16px",overflowY:"auto",flex:1}}>
            <div style={{marginBottom:14}}>
              <div style={{fontWeight:900,fontSize:19}}>Good Morning, {user.name.split(" ")[0]} 👋</div>
              <div style={{fontSize:12,color:"#888",marginTop:2}}>{new Date().toLocaleDateString("en-IN",{day:"numeric",month:"long",year:"numeric"})} · {user.salon}</div>
            </div>
            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10,marginBottom:14}}>
              {[{icon:"📅",val:booked,label:"Bookings",bg:"#e8fdf0",color:"#16a34a"},{icon:"💸",val:`₹${revenue.toLocaleString()}`,label:"Revenue",bg:"#e8fdf0",color:"#16a34a"},{icon:"⏳",val:pending,label:"Pending",bg:"#fff8e6",color:"#d97706"},{icon:"💬",val:Object.values(dayData).filter(b=>b.src==="wa").length,label:"Via WhatsApp",bg:"#eff6ff",color:"#2563eb"}].map(s=>(<div key={s.label} style={{background:s.bg,borderRadius:14,padding:"14px",border:`2px solid ${s.color}22`}}><div style={{fontSize:20,marginBottom:5}}>{s.icon}</div><div style={{fontWeight:900,fontSize:22,color:s.color,lineHeight:1}}>{s.val}</div><div style={{fontSize:11,color:"#888",fontWeight:700,marginTop:3}}>{s.label}</div></div>))}
            </div>
            <div style={{marginBottom:14}}>
              <div style={{fontWeight:800,fontSize:13,marginBottom:8}}>⚡ Quick Actions</div>
              <div style={{display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:8}}>
                {[{icon:"📅",label:"Calendar",s:"calendar"},{icon:"👨‍💼",label:"Staff",s:"staff"},{icon:"📋",label:"History",s:"history"},{icon:"💫",label:"Engage",s:"engage"}].map(a=>(<div key={a.label} onClick={()=>setScreen(a.s)} style={{background:"#fff",border:"2px solid #e8edf3",borderRadius:12,padding:"11px 6px",textAlign:"center",cursor:"pointer"}} onMouseOver={e=>{e.currentTarget.style.borderColor="#22c55e";e.currentTarget.style.background="#f0fdf4";}} onMouseOut={e=>{e.currentTarget.style.borderColor="#e8edf3";e.currentTarget.style.background="#fff";}}><div style={{fontSize:20,marginBottom:4}}>{a.icon}</div><div style={{fontSize:11,fontWeight:800,color:"#555"}}>{a.label}</div></div>))}
              </div>
            </div>
            <div style={{background:"#fff",border:"2px solid #e8edf3",borderRadius:14,overflow:"hidden"}}>
              <div style={{padding:"12px 14px",borderBottom:"2px solid #f0f4f8",display:"flex",justifyContent:"space-between",alignItems:"center"}}><div style={{fontWeight:800,fontSize:13}}>📋 Today's Appointments</div><div onClick={()=>setScreen("calendar")} style={{fontSize:12,fontWeight:700,color:"#22c55e",cursor:"pointer"}}>See all →</div></div>
              {Object.entries(dayData).filter(([,b])=>b.status!=="break").slice(0,4).map(([slot,b],i)=>{const c=COLOR_MAP[b.color]||COLOR_MAP.green;const st=STATUS_MAP[b.status]||STATUS_MAP.confirmed;return(<div key={i} style={{display:"flex",alignItems:"center",gap:10,padding:"11px 14px",borderBottom:"2px solid #f4f6fa"}}><div style={{width:36,height:36,borderRadius:10,background:c.bg,display:"flex",alignItems:"center",justifyContent:"center",fontWeight:900,fontSize:12,color:c.dot,flexShrink:0}}>{b.name.split(" ").map(w=>w[0]).join("").slice(0,2)}</div><div style={{flex:1}}><div style={{fontWeight:800,fontSize:13}}>{b.name}</div><div style={{fontSize:11,color:"#888"}}>{b.service} · {b.src==="wa"?"💬":"🚶"}</div></div><div style={{textAlign:"right"}}><div style={{fontWeight:800,fontSize:12}}>{fmt12(slot)}</div><div style={{background:st.bg,color:st.color,fontSize:9,fontWeight:800,padding:"2px 6px",borderRadius:20,marginTop:2}}>{st.label}</div></div></div>);})}
            </div>
          </div>
        )}

        {screen==="calendar"&&(
          <div style={{flex:1,display:"flex",flexDirection:"column",overflow:"hidden"}}>
            <div style={{background:"#fff",borderBottom:"2px solid #e8edf3",padding:"10px 12px"}}>
              <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:8}}>
                <div style={{fontWeight:900,fontSize:14}}>{MONTHS[selDate.getMonth()]} {selDate.getFullYear()}</div>
                <div style={{display:"flex",gap:6}}><button onClick={prevDay} style={nb}>←</button><button onClick={()=>{setSelDate(today);const ws=new Date(today);ws.setDate(ws.getDate()-ws.getDay());setWeekStart(ws);}} style={{...nb,padding:"4px 10px",fontSize:11,color:"#22c55e",borderColor:"#bbf7d0",background:"#f0fdf4"}}>Today</button><button onClick={nextDay} style={nb}>→</button></div>
              </div>
              <div style={{display:"flex",gap:5}}>
                {Array.from({length:7}).map((_,i)=>{const d=addDays(weekStart,i);const key=dateKey(d);const isSel=dateKey(d)===selKey;const isToday=dateKey(d)===dateKey(today);const cnt=Object.values(bookings[key]||{}).filter(b=>b.status!=="break").length;return(<div key={i} onClick={()=>setSelDate(d)} style={{flex:1,display:"flex",flexDirection:"column",alignItems:"center",gap:3,padding:"7px 2px",borderRadius:11,cursor:"pointer",background:isSel?"#1a1a2e":isToday?"#f0fdf4":"#fff",border:`2px solid ${isSel?"#22c55e":isToday?"#86efac":"#e8edf3"}`}}><div style={{fontSize:9,fontWeight:800,color:isSel?"#22c55e":"#aaa"}}>{DAYS_S[d.getDay()]}</div><div style={{fontSize:15,fontWeight:900,color:isSel?"#fff":isToday?"#22c55e":"#1a1a2e"}}>{d.getDate()}</div><div style={{width:5,height:5,borderRadius:"50%",background:cnt>0?(isSel?"#22c55e":"#86efac"):"#e8edf3"}}/></div>);})}
              </div>
            </div>
            <div style={{padding:"8px 12px",background:"#f8fafc",borderBottom:"2px solid #e8edf3",display:"flex",gap:8,alignItems:"center"}}>
              <div style={{fontWeight:800,fontSize:13,flex:1}}>{DAYS_S[selDate.getDay()]}, {selDate.getDate()} {SHORT_M[selDate.getMonth()]}</div>
              <div style={{fontSize:12,fontWeight:700,color:"#16a34a"}}>{Object.values(sDayData).filter(b=>b.status!=="break").length} booked</div>
              <div style={{fontSize:12,fontWeight:700,color:"#16a34a"}}>₹{Object.values(sDayData).reduce((s,b)=>s+(b.price||0),0).toLocaleString()}</div>
            </div>
            <div style={{flex:1,overflowY:"auto",padding:"10px 12px"}} onTouchStart={e=>{touchStart.current=e.touches[0].clientX;}} onTouchEnd={e=>{if(touchStart.current===null)return;const diff=touchStart.current-e.changedTouches[0].clientX;if(Math.abs(diff)>50){diff>0?nextDay():prevDay();}touchStart.current=null;}}>
              <div style={{display:"flex",flexDirection:"column",gap:5}}>
                {slots.map(key=>{const b=sDayData[key];const isHour=key.endsWith(":00");if(b?.status==="break")return(<div key={key} style={{display:"flex",gap:8,alignItems:"center"}}><div style={{width:50,flexShrink:0,fontSize:11,fontWeight:800,color:"#ccc",textAlign:"right"}}>{fmt12(key)}</div><div style={{flex:1,background:"repeating-linear-gradient(45deg,#f8fafc,#f8fafc 5px,#f0f4f8 5px,#f0f4f8 10px)",border:"2px dashed #d1d5db",borderRadius:10,padding:"9px 12px",color:"#bbb",fontSize:12,fontWeight:700}}>☕ Break</div></div>);if(b){const c=COLOR_MAP[b.color]||COLOR_MAP.green;const st=STATUS_MAP[b.status]||STATUS_MAP.confirmed;return(<div key={key} style={{display:"flex",gap:8,alignItems:"center"}}><div style={{width:50,flexShrink:0,fontSize:11,fontWeight:800,color:isHour?"#1a1a2e":"#ccc",textAlign:"right"}}>{fmt12(key)}</div><div style={{flex:1,background:c.bg,border:`2px solid ${c.border}`,borderRadius:12,padding:"10px 12px",display:"flex",alignItems:"center",gap:10}}><div style={{width:8,height:8,borderRadius:"50%",background:c.dot,flexShrink:0}}/><div style={{flex:1,minWidth:0}}><div style={{fontWeight:800,fontSize:13}}>{b.name}</div><div style={{fontSize:11,color:"#666"}}>{b.service} · {b.src==="wa"?"💬":"🚶"}</div></div><div style={{textAlign:"right",flexShrink:0}}><div style={{fontWeight:800,fontSize:12,color:"#16a34a"}}>₹{b.price}</div><div style={{background:st.bg,color:st.color,fontSize:9,fontWeight:800,padding:"2px 6px",borderRadius:20,marginTop:3}}>{st.label}</div></div></div></div>);}return(<div key={key} style={{display:"flex",gap:8,alignItems:"center"}}><div style={{width:50,flexShrink:0,fontSize:11,fontWeight:800,color:isHour?"#1a1a2e":"#ccc",textAlign:"right"}}>{fmt12(key)}</div><button onClick={()=>{setCalForm({name:"",service:SERVICES_LIST[0],price:"",src:"wa"});setCalModal({slot:key});}} style={{flex:1,border:"2px dashed #dde2e8",borderRadius:10,background:"#fff",padding:"9px 12px",color:"#ccc",fontSize:12,fontWeight:700,cursor:"pointer",textAlign:"left",fontFamily:"inherit"}} onMouseOver={e=>{e.currentTarget.style.borderColor="#22c55e";e.currentTarget.style.color="#22c55e";}} onMouseOut={e=>{e.currentTarget.style.borderColor="#dde2e8";e.currentTarget.style.color="#ccc";}}>+ {fmt12(key)}</button></div>);})}
              </div>
            </div>
            {calModal&&(<div onClick={()=>setCalModal(null)} style={{position:"fixed",inset:0,background:"rgba(0,0,0,0.4)",zIndex:500,display:"flex",alignItems:"flex-end"}}><div onClick={e=>e.stopPropagation()} style={{background:"#fff",borderRadius:"20px 20px 0 0",padding:"20px 18px 32px",width:"100%",boxShadow:"0 -8px 40px rgba(0,0,0,0.12)"}}><div style={{width:36,height:4,background:"#e8edf3",borderRadius:2,margin:"0 auto 16px"}}/><div style={{fontWeight:900,fontSize:15,marginBottom:4}}>New Booking</div><div style={{fontSize:12,color:"#888",marginBottom:14}}>📅 {fmt12(calModal.slot)}</div>{[{label:"Client Name",el:<input value={calForm.name} onChange={e=>setCalForm(f=>({...f,name:e.target.value}))} placeholder="e.g. Priya Sharma" style={obIs}/>},{label:"Service",el:<select value={calForm.service} onChange={e=>setCalForm(f=>({...f,service:e.target.value}))} style={{...is,marginTop:5,cursor:"pointer"}}>{SERVICES_LIST.map(s=><option key={s}>{s}</option>)}</select>},{label:"Price (₹)",el:<input type="number" value={calForm.price} onChange={e=>setCalForm(f=>({...f,price:e.target.value}))} placeholder="450" style={{...is,marginTop:5}}/>},{label:"Source",el:<select value={calForm.src} onChange={e=>setCalForm(f=>({...f,src:e.target.value}))} style={{...is,marginTop:5,cursor:"pointer"}}><option value="wa">💬 WhatsApp</option><option value="walk">🚶 Walk-in</option></select>}].map(({label,el})=>(<div key={label} style={{marginBottom:10}}><div style={{fontSize:12,fontWeight:800,color:"#555"}}>{label}</div>{el}</div>))}<div style={{display:"flex",gap:10,marginTop:14}}><button onClick={()=>setCalModal(null)} style={{flex:1,padding:11,border:"2px solid #e8edf3",borderRadius:12,background:"#fff",fontFamily:"inherit",fontSize:13,fontWeight:700,cursor:"pointer"}}>Cancel</button><button onClick={saveCal} style={{flex:2,padding:11,border:"none",borderRadius:12,background:calForm.name.trim()?"#22c55e":"#ccc",color:"#fff",fontFamily:"inherit",fontSize:13,fontWeight:800,cursor:"pointer"}}>✓ Save</button></div></div></div>)}
          </div>
        )}

        {screen==="clients"&&(
          <div style={{flex:1,display:"flex",flexDirection:"column",overflow:"hidden"}}>
            <div style={{background:"#fff",padding:"10px 14px",borderBottom:"2px solid #e8edf3"}}>
              <button onClick={()=>setShowAddClient(true)} style={{width:"100%",padding:"11px",background:"#22c55e",border:"none",borderRadius:12,color:"#fff",fontFamily:"inherit",fontSize:14,fontWeight:800,cursor:"pointer",marginBottom:10,boxShadow:"0 3px 10px rgba(34,197,94,0.3)"}}>➕ Add New Customer</button>
              <div style={{position:"relative",marginBottom:9}}><span style={{position:"absolute",left:10,top:"50%",transform:"translateY(-50%)",fontSize:14,color:"#aaa"}}>🔍</span><input value={cSearch} onChange={e=>setCSearch(e.target.value)} placeholder="Search clients..." style={{width:"100%",padding:"9px 12px 9px 32px",border:"2px solid #e8edf3",borderRadius:11,fontSize:13,fontFamily:"inherit",outline:"none",boxSizing:"border-box"}} onFocus={e=>e.target.style.borderColor="#22c55e"} onBlur={e=>e.target.style.borderColor="#e8edf3"}/></div>
              <div style={{display:"flex",gap:6,overflowX:"auto"}}>{["All","VIP","Regular","New","WhatsApp","Walk-in"].map(f=>(<button key={f} onClick={()=>setCFilter(f)} style={{padding:"4px 12px",borderRadius:20,border:`2px solid ${cFilter===f?"#22c55e":"#e8edf3"}`,background:cFilter===f?"#22c55e":"#fff",color:cFilter===f?"#fff":"#888",fontSize:11,fontWeight:800,cursor:"pointer",whiteSpace:"nowrap",fontFamily:"inherit",flexShrink:0}}>{f}</button>))}</div>
            </div>
            <div style={{flex:1,overflowY:"auto",padding:"12px 14px"}}>
              {filtC.map(c=>{const tag=TAG[c.tag]||TAG.New;return(<div key={c.id} onClick={()=>setSelClient(c)} style={{background:"#fff",border:"2px solid #e8edf3",borderRadius:14,padding:"13px",cursor:"pointer",marginBottom:9}} onMouseOver={e=>e.currentTarget.style.borderColor="#22c55e"} onMouseOut={e=>e.currentTarget.style.borderColor="#e8edf3"}><div style={{display:"flex",alignItems:"center",gap:10,marginBottom:9}}><div style={{width:40,height:40,borderRadius:12,background:c.color+"22",display:"flex",alignItems:"center",justifyContent:"center",fontWeight:900,fontSize:14,color:c.color,flexShrink:0}}>{c.avatar}</div><div style={{flex:1,minWidth:0}}><div style={{fontWeight:800,fontSize:14}}>{c.name}</div><div style={{fontSize:11,color:"#888",marginTop:2}}>📍 {c.city||"—"} · {c.src==="wa"?"💬 WA":"🚶 Walk-in"}</div></div><div style={{background:tag.bg,color:tag.color,border:`1.5px solid ${tag.border}`,fontSize:10,fontWeight:800,padding:"2px 8px",borderRadius:20}}>{c.tag==="VIP"?"⭐ VIP":c.tag}</div></div><div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:6}}>{[{label:"Visits",val:c.visits||0},{label:"Spent",val:`₹${(c.totalSpent||0).toLocaleString()}`},{label:"Last Visit",val:c.lastVisit||"—"}].map(s=>(<div key={s.label} style={{background:"#f8fafc",borderRadius:9,padding:"7px",textAlign:"center"}}><div style={{fontWeight:900,fontSize:13}}>{s.val}</div><div style={{fontSize:9,color:"#aaa",fontWeight:700,marginTop:1}}>{s.label}</div></div>))}</div></div>);})}
            </div>
            {selClient&&(<div onClick={()=>setSelClient(null)} style={{position:"fixed",inset:0,background:"rgba(0,0,0,0.4)",zIndex:500,display:"flex",alignItems:"flex-end"}}><div onClick={e=>e.stopPropagation()} style={{background:"#fff",borderRadius:"20px 20px 0 0",padding:"18px 18px 32px",width:"100%",maxHeight:"80vh",overflowY:"auto"}}><div style={{width:36,height:4,background:"#e8edf3",borderRadius:2,margin:"0 auto 14px"}}/><div style={{display:"flex",gap:12,alignItems:"center",marginBottom:14}}><div style={{width:48,height:48,borderRadius:14,background:selClient.color+"22",display:"flex",alignItems:"center",justifyContent:"center",fontWeight:900,fontSize:17,color:selClient.color}}>{selClient.avatar}</div><div><div style={{fontWeight:900,fontSize:16}}>{selClient.name}</div><div style={{fontSize:12,color:"#888"}}>📱 {selClient.phone} · {selClient.city||"—"}</div></div></div><div style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:8,marginBottom:12}}>{[{icon:"🔁",val:selClient.visits||0,label:"Visits"},{icon:"💸",val:`₹${(selClient.totalSpent||0).toLocaleString()}`,label:"Total"},{icon:"📅",val:selClient.lastVisit||"—",label:"Last Visit"}].map(s=>(<div key={s.label} style={{background:"#f8fafc",borderRadius:11,padding:"10px",textAlign:"center"}}><div style={{fontSize:16,marginBottom:3}}>{s.icon}</div><div style={{fontWeight:900,fontSize:13}}>{s.val}</div><div style={{fontSize:10,color:"#aaa",fontWeight:700}}>{s.label}</div></div>))}</div><div style={{display:"flex",gap:8,marginBottom:12}}><button onClick={()=>{setScreen("calendar");setSelClient(null);}} style={{flex:1,padding:"11px",background:"#22c55e",border:"none",borderRadius:12,color:"#fff",fontFamily:"inherit",fontSize:13,fontWeight:800,cursor:"pointer"}}>📅 Book Now</button><button style={{flex:1,padding:"11px",background:"#e8fdf0",border:"2px solid #bbf7d0",borderRadius:12,color:"#16a34a",fontFamily:"inherit",fontSize:13,fontWeight:800,cursor:"pointer"}}>💬 WhatsApp</button></div>
                  <button onClick={()=>{setEditClient({...selClient});setShowEditClient(true);}} style={{width:"100%",padding:"11px",background:"#fff",border:"2px solid #e8edf3",borderRadius:12,color:"#555",fontFamily:"inherit",fontSize:13,fontWeight:700,cursor:"pointer",marginBottom:8}}>✏️ Edit Profile</button><div style={{fontWeight:800,fontSize:13,color:"#555",marginBottom:9}}>📋 Visit History</div>{(selClient.history||[]).map((h,i)=>(<div key={i} style={{display:"flex",alignItems:"center",gap:10,padding:"9px 11px",background:"#f8fafc",borderRadius:10,marginBottom:6,border:"2px solid #f0f4f8"}}><div style={{width:7,height:7,borderRadius:"50%",background:selClient.color,flexShrink:0}}/><div style={{flex:1}}><div style={{fontWeight:800,fontSize:13}}>{h.service}</div><div style={{fontSize:11,color:"#aaa"}}>{h.date}</div></div><div style={{fontWeight:800,fontSize:13,color:"#16a34a"}}>₹{h.price}</div></div>))}</div></div>)}
            {/* ✅ Edit Client Modal */}
            {showEditClient&&editClient&&(
              <div onClick={()=>setShowEditClient(false)} style={{position:"fixed",inset:0,background:"rgba(0,0,0,0.4)",zIndex:600,display:"flex",alignItems:"flex-end"}}>
                <div onClick={e=>e.stopPropagation()} style={{background:"#fff",borderRadius:"20px 20px 0 0",padding:"18px 18px 32px",width:"100%",maxHeight:"90vh",overflowY:"auto"}}>
                  <div style={{width:36,height:4,background:"#e8edf3",borderRadius:2,margin:"0 auto 14px"}}/>
                  <div style={{fontWeight:900,fontSize:16,marginBottom:16}}>✏️ Edit Customer</div>
                  {[{label:"Full Name *",key:"name",ph:"e.g. Priya Sharma",type:"text"},{label:"Phone Number",key:"phone",ph:"98765 43210",type:"tel"},{label:"City",key:"city",ph:"Delhi",type:"text"},{label:"Date of Birth",key:"dob",ph:"",type:"date"}].map(f=>(<div key={f.key} style={{marginBottom:12}}><div style={{fontSize:13,fontWeight:800,color:"#555",marginBottom:4}}>{f.label}</div><input type={f.type} value={editClient[f.key]||""} onChange={e=>setEditClient(p=>({...p,[f.key]:e.target.value}))} placeholder={f.ph} style={{...is}} onFocus={e=>e.target.style.borderColor="#22c55e"} onBlur={e=>e.target.style.borderColor="#e8edf3"}/></div>))}
                  <div style={{marginBottom:16}}><div style={{fontSize:13,fontWeight:800,color:"#555",marginBottom:8}}>Tag</div><div style={{display:"flex",gap:8}}>{["New","Regular","VIP"].map(t=>(<button key={t} onClick={()=>setEditClient(p=>({...p,tag:t}))} style={{flex:1,padding:"9px",borderRadius:10,border:`2px solid ${editClient.tag===t?"#22c55e":"#e8edf3"}`,background:editClient.tag===t?"#e8fdf0":"#fff",color:editClient.tag===t?"#16a34a":"#888",fontFamily:"inherit",fontSize:13,fontWeight:800,cursor:"pointer"}}>{t==="VIP"?"⭐ VIP":t}</button>))}</div></div>
                  <div style={{display:"flex",gap:10}}>
                    <button onClick={()=>setShowEditClient(false)} style={{flex:1,padding:"12px",border:"2px solid #e8edf3",borderRadius:12,background:"#fff",fontFamily:"inherit",fontSize:13,fontWeight:700,cursor:"pointer"}}>Cancel</button>
                    <button onClick={async()=>{
                      if(!editClient.name.trim())return;
                      await supabase.from("customers").update({
                        name:editClient.name.trim(),
                        phone:editClient.phone||"",
                        city:editClient.city||"",
                        birthday:editClient.dob||null,
                        tag:editClient.tag||"Regular",
                      }).eq("id",editClient.id);
                      setClients(prev=>prev.map(c=>c.id===editClient.id?{...c,...editClient,name:editClient.name.trim()}:c));
                      setSelClient(prev=>prev?{...prev,...editClient,name:editClient.name.trim()}:null);
                      setShowEditClient(false);
                    }} style={{flex:2,padding:"12px",border:"none",borderRadius:12,background:editClient.name.trim()?"#22c55e":"#ccc",color:"#fff",fontFamily:"inherit",fontSize:13,fontWeight:800,cursor:"pointer"}}>✓ Save Changes</button>
                  </div>
                </div>
              </div>
            )}

            {showAddClient&&(
              <div onClick={()=>setShowAddClient(false)} style={{position:"fixed",inset:0,background:"rgba(0,0,0,0.4)",zIndex:600,display:"flex",alignItems:"flex-end"}}>
                <div onClick={e=>e.stopPropagation()} style={{background:"#fff",borderRadius:"20px 20px 0 0",padding:"18px 18px 32px",width:"100%",maxHeight:"90vh",overflowY:"auto"}}>
                  <div style={{width:36,height:4,background:"#e8edf3",borderRadius:2,margin:"0 auto 14px"}}/>
                  <div style={{fontWeight:900,fontSize:16,marginBottom:16}}>➕ Add New Customer</div>
                  {[{label:"Full Name *",key:"name",ph:"e.g. Priya Sharma",type:"text"},{label:"Phone Number *",key:"phone",ph:"98765 43210",type:"tel"},{label:"City",key:"city",ph:"Delhi",type:"text"},{label:"Date of Birth",key:"dob",ph:"",type:"date"}].map(f=>(<div key={f.key} style={{marginBottom:12}}><div style={{fontSize:13,fontWeight:800,color:"#555",marginBottom:4}}>{f.label}</div><input type={f.type} value={newClient[f.key]} onChange={e=>setNewClient(p=>({...p,[f.key]:e.target.value}))} placeholder={f.ph} style={{...is}} onFocus={e=>e.target.style.borderColor="#22c55e"} onBlur={e=>e.target.style.borderColor="#e8edf3"}/></div>))}
                  <div style={{marginBottom:16}}><div style={{fontSize:13,fontWeight:800,color:"#555",marginBottom:8}}>Tag</div><div style={{display:"flex",gap:8}}>{["New","Regular","VIP"].map(t=>(<button key={t} onClick={()=>setNewClient(p=>({...p,tag:t}))} style={{flex:1,padding:"9px",borderRadius:10,border:`2px solid ${newClient.tag===t?"#22c55e":"#e8edf3"}`,background:newClient.tag===t?"#e8fdf0":"#fff",color:newClient.tag===t?"#16a34a":"#888",fontFamily:"inherit",fontSize:13,fontWeight:800,cursor:"pointer"}}>{t==="VIP"?"⭐ VIP":t}</button>))}</div></div>
                  <div style={{display:"flex",gap:10}}>
                    <button onClick={()=>setShowAddClient(false)} style={{flex:1,padding:"12px",border:"2px solid #e8edf3",borderRadius:12,background:"#fff",fontFamily:"inherit",fontSize:13,fontWeight:700,cursor:"pointer"}}>Cancel</button>
                    <button onClick={async()=>{
                      if(!newClient.name.trim()||!newClient.phone.trim()||!newClient.dob)return;
                      if(!/^\d{10}$/.test(newClient.phone.replace(/\s/g,"")))return;
                      await supabase.from("customers").insert({salon_id:user.id,name:newClient.name.trim(),phone:newClient.phone.trim(),city:newClient.city||"",tag:newClient.tag,source:"walk",birthday:newClient.dob});
                      const ini=newClient.name.split(" ").map(w=>w[0]).join("").slice(0,2).toUpperCase();
                      const cols=["#22c55e","#3b82f6","#a855f7","#f59e0b","#14b8a6","#ec4899"];
                      const col=cols[Math.floor(Math.random()*cols.length)];
                      setClients(prev=>[{id:Date.now(),name:newClient.name.trim(),phone:newClient.phone.trim(),city:newClient.city||"—",src:"walk",avatar:ini,color:col,joined:new Date().toLocaleDateString("en-IN",{month:"short",year:"numeric"}),visits:0,totalSpent:0,lastVisit:"—",tag:newClient.tag,dob:newClient.dob||"",history:[]},...prev]);
                      setNewClient({name:"",phone:"",city:"",dob:"",tag:"Regular"});
                      setShowAddClient(false);
                    }} style={{flex:2,padding:"12px",border:"none",borderRadius:12,background:newClient.name.trim()&&/^\d{10}$/.test(newClient.phone.replace(/\s/g,""))&&newClient.dob?"#22c55e":"#ccc",color:"#fff",fontFamily:"inherit",fontSize:13,fontWeight:800,cursor:"pointer"}}>✓ Save Customer</button>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {screen==="staff"&&(
          <div style={{flex:1,overflow:"hidden",display:"flex",flexDirection:"column"}}>
            <div style={{flex:1,overflowY:"auto"}}><StaffManagement role="owner" currentUser={user} showRevenue={showRevenue} setShowRevenue={setShowRevenue}/></div>
          </div>
        )}

        {screen==="history"&&(
          <div style={{flex:1,overflow:"hidden",display:"flex",flexDirection:"column"}}>
            <CustomerHistory key={screen} currentUser={{...user,role:"owner"}} onBookAppointment={()=>setScreen("calendar")}/>
          </div>
        )}

        {screen==="engage"&&(
          <div style={{flex:1,overflow:"hidden",display:"flex",flexDirection:"column"}}>
            <EngagementCenter currentUser={user}/>
          </div>
        )}

        {screen==="settings"&&(
          <div style={{flex:1,overflow:"hidden",display:"flex",flexDirection:"column"}}>
            <Settings
              user={user}
              onLogout={onLogout}
              onSalonUpdate={(newName, newLogoUrl)=>setUser(prev=>({...prev,salon:newName,logo_url:newLogoUrl||prev.logo_url}))}
              showRevenue={showRevenue}
              setShowRevenue={setShowRevenue}
            />
          </div>
        )}
      </div>

      <div style={{background:"#fff",borderTop:"2px solid #e8edf3",padding:"6px 0 8px",display:"flex",flexShrink:0,boxShadow:"0 -2px 8px rgba(0,0,0,0.05)",overflowX:"auto"}}>
        {NAV.map(item=>{const active=screen===item.id;return(
          <div key={item.id} onClick={()=>setScreen(item.id)} style={{flex:1,minWidth:44,display:"flex",flexDirection:"column",alignItems:"center",gap:2,cursor:"pointer",padding:"4px 0"}}>
            <div style={{width:34,height:26,display:"flex",alignItems:"center",justifyContent:"center",borderRadius:9,background:active?"#e8fdf0":"transparent",transition:"all 0.15s"}}><span style={{fontSize:15}}>{item.icon}</span></div>
            <span style={{fontSize:9,fontWeight:800,color:active?"#22c55e":"#aaa"}}>{item.label}</span>
          </div>
        );})}
      </div>
      {/* ✅ Notification Drawer */}
      {showNotifs&&(
        <div onClick={()=>setShowNotifs(false)} style={{position:"fixed",inset:0,background:"rgba(0,0,0,0.4)",zIndex:600,display:"flex",alignItems:"flex-start",justifyContent:"flex-end"}}>
          <div onClick={e=>e.stopPropagation()} style={{background:"#fff",width:"90%",maxWidth:360,height:"100vh",overflowY:"auto",boxShadow:"-4px 0 20px rgba(0,0,0,0.15)"}}>
            <div style={{padding:"16px",borderBottom:"2px solid #f0f4f8",display:"flex",alignItems:"center",justifyContent:"space-between",background:"#fff",position:"sticky",top:0}}>
              <div style={{fontWeight:900,fontSize:16}}>🔔 Notifications</div>
              <button onClick={()=>setShowNotifs(false)} style={{background:"none",border:"none",fontSize:18,cursor:"pointer",color:"#888"}}>✕</button>
            </div>
            {notifications.length===0?(
              <div style={{padding:32,textAlign:"center",color:"#aaa",fontSize:14}}>Koi notification nahi</div>
            ):(
              notifications.map((n,i)=>(
                <div key={i} onClick={()=>{setScreen("calendar");setSelDate(new Date(n.date));setShowNotifs(false);}} style={{padding:"14px 16px",borderBottom:"2px solid #f0f4f8",cursor:"pointer",background:"#fff"}} onMouseOver={e=>e.currentTarget.style.background="#f8fafc"} onMouseOut={e=>e.currentTarget.style.background="#fff"}>
                  <div style={{display:"flex",alignItems:"center",gap:10}}>
                    <div style={{width:38,height:38,borderRadius:12,background:"#e8fdf0",display:"flex",alignItems:"center",justifyContent:"center",fontSize:18,flexShrink:0}}>📅</div>
                    <div style={{flex:1}}>
                      <div style={{fontWeight:800,fontSize:13,color:"#1a1a2e"}}>{n.customer_name||"WhatsApp Customer"}</div>
                      <div style={{fontSize:11,color:"#888",marginTop:2}}>{n.service} · ₹{n.amount||0}</div>
                      <div style={{fontSize:11,color:"#22c55e",marginTop:2,fontWeight:700}}>{n.date} at {n.time_slot}</div>
                    </div>
                    <div style={{fontSize:10,color:"#ccc",fontWeight:700,flexShrink:0}}>{new Date(n.created_at).toLocaleDateString("en-IN",{day:"numeric",month:"short"})}</div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}
      <style>{`@keyframes bounce{0%,100%{transform:translateY(0)}50%{transform:translateY(-4px)}}`}</style>
    </div>
  );
}

// ─── ROOT ─────────────────────────────────────────────────────────────────────
export default function SnipBook(){
  const [page,setPage]=useState("loading");
  const [user,setUser]=useState(null);
  const [staffUser,setStaffUser]=useState(null);
  const [showRevenue,setShowRevenue]=useState(DEFAULT_SHOW_REVENUE);

  useEffect(()=>{
    // ✅ Check staff session first
    const savedStaff = localStorage.getItem("snipbook_staff");
    if(savedStaff){
      try{
        const staffData = JSON.parse(savedStaff);
        setStaffUser(staffData);
        setPage("staffApp");
        return;
      }catch(e){ localStorage.removeItem("snipbook_staff"); }
    }

    supabase.auth.getSession().then(async({data:{session}})=>{
      if(session){
        const {data:salon}=await supabase.from("salons").select("*").eq("id",session.user.id).single();
        setUser({
          id:session.user.id,
          email:session.user.email,
          name:salon?.owner_name||session.user.email,
          salon:salon?.salon_name||"Mera Salon",
          city:salon?.city||"",
          plan:salon?.plan||"free",
          logo_url:salon?.logo_url||null,
        });
        setPage("app");
      } else {
        setPage("landing");
      }
    });

    const {data:{subscription}}=supabase.auth.onAuthStateChange(async(event,session)=>{
      if(event==="SIGNED_OUT"){setUser(null);setPage("landing");}
    });
    return()=>subscription.unsubscribe();
  },[]);

  function ownerLogout(){supabase.auth.signOut();setUser(null);setPage("landing");}
  function staffLogout(){
    setStaffUser(null);
    localStorage.removeItem("snipbook_staff");
    setPage("login");
  }

  if(page==="loading"){
    return(
      <div style={{height:"100vh",display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",background:"linear-gradient(135deg,#f0fdf4,#f0f4f8)",fontFamily:"system-ui,sans-serif"}}>
        <Logo size={20} iconSize={48}/>
        <div style={{marginTop:20,fontSize:13,color:"#888",fontWeight:700}}>Loading...</div>
        <style>{`@keyframes load{0%{width:0%}100%{width:100%}}`}</style>
      </div>
    );
  }

  return(
    <>
      {page==="landing"&&<Landing onStart={()=>setPage("onboarding")} onLogin={()=>setPage("login")}/>}
      {page==="login"&&<LoginPage onOwnerLogin={u=>{setUser(u);setPage("app");}} onStaffLogin={async()=>{
        setPage("staffSalonEntry");
      }} onSignup={()=>setPage("onboarding")} onBack={()=>setPage("landing")}/>}
      {page==="staffSalonEntry"&&<StaffSalonEntry onFound={(staffData)=>{
        const sd = {...staffData,salon_id:staffData.salon_id};
        setStaffUser(sd);
        localStorage.setItem("snipbook_staff", JSON.stringify(sd));
        setPage("staffApp");
      }} onBack={()=>setPage("login")}/>}
      {page==="staffApp"&&staffUser&&<StaffDashboard staff={staffUser} showRevenue={showRevenue} onLogout={staffLogout}/>}
      {page==="onboarding"&&<Onboarding onComplete={u=>{setUser(u);setPage("app");}} onBack={()=>setPage("landing")}/>}
      {page==="app"&&user&&<MainApp user={user} setUser={setUser} onLogout={ownerLogout} showRevenue={showRevenue} setShowRevenue={setShowRevenue}/>}
    </>
  );
}
