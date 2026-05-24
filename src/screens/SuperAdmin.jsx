import { useState, useEffect } from "react";
import { supabase } from "../lib/supabase";

const ADMIN_PASSWORD = "snipbook@admin2026";

const T = {
  bg:"#f0f4f8", surface:"#ffffff", border:"#e8edf3",
  green:"#22c55e", gl:"#e8fdf0", gm:"#bbf7d0", gd:"#16a34a",
  text:"#1a1a2e", tm:"#555", ts:"#888", tf:"#aaa",
  dark:"#1a1a2e", red:"#fff0f0", rb:"#fca5a5", rt:"#dc2626",
  yellow:"#fef9c3", yb:"#fde68a", yt:"#a16207",
  blue:"#eff6ff", bb:"#93c5fd", bt:"#2563eb",
  sub:"#f8fafc",
};

function StatBox({icon, val, label, color}){
  return(
    <div style={{background:T.surface,border:`2px solid ${T.border}`,borderRadius:12,padding:"14px",textAlign:"center",flex:1}}>
      <div style={{fontSize:20,marginBottom:4}}>{icon}</div>
      <div style={{fontWeight:900,fontSize:18,color:color||T.green}}>{val}</div>
      <div style={{fontSize:10,color:T.tf,fontWeight:700,marginTop:2}}>{label}</div>
    </div>
  );
}

function LoginScreen({onLogin}){
  const [pass, setPass] = useState("");
  const [error, setError] = useState("");
  function handleLogin(){
    if(pass === ADMIN_PASSWORD){ onLogin(); }
    else{ setError("Wrong password!"); setPass(""); }
  }
  return(
    <div style={{minHeight:"100vh",background:"linear-gradient(135deg,#1a1a2e,#16213e)",display:"flex",alignItems:"center",justifyContent:"center",padding:"24px",fontFamily:"system-ui,sans-serif"}}>
      <div style={{background:"#fff",borderRadius:20,padding:"28px 24px",width:"100%",maxWidth:360,boxShadow:"0 16px 48px rgba(0,0,0,0.3)"}}>
        <div style={{textAlign:"center",marginBottom:24}}>
          <div style={{fontSize:40,marginBottom:8}}>🛡️</div>
          <div style={{fontWeight:900,fontSize:20,color:T.text}}>SnipBook Admin</div>
          <div style={{fontSize:12,color:T.ts,marginTop:4}}>Super Admin Panel</div>
        </div>
        {error&&<div style={{background:T.red,border:`1.5px solid ${T.rb}`,borderRadius:10,padding:"9px 12px",fontSize:12,color:T.rt,fontWeight:700,marginBottom:14}}>⚠️ {error}</div>}
        <input
          type="password"
          value={pass}
          onChange={e=>{setPass(e.target.value);setError("");}}
          placeholder="Admin password"
          onKeyDown={e=>e.key==="Enter"&&handleLogin()}
          style={{width:"100%",padding:"12px",border:"2px solid #e8edf3",borderRadius:12,fontSize:14,fontFamily:"inherit",outline:"none",boxSizing:"border-box",marginBottom:14}}
          autoFocus
        />
        <button onClick={handleLogin} style={{width:"100%",padding:13,background:T.dark,border:"none",borderRadius:12,color:"#fff",fontFamily:"inherit",fontSize:15,fontWeight:800,cursor:"pointer"}}>
          🔐 Login
        </button>
      </div>
    </div>
  );
}

function SalonDetail({salon, onBack}){
  const [stats, setStats] = useState({customers:0, appointments:0, staff:0, revenue:0, lastBooking:null});
  const [loading, setLoading] = useState(true);

  useEffect(()=>{
    async function loadStats(){
      const [cRes, aRes, sRes] = await Promise.all([
        supabase.from("customers").select("id", {count:"exact"}).eq("salon_id", salon.id),
        supabase.from("appointments").select("id,amount,created_at", {count:"exact"}).eq("salon_id", salon.id).order("created_at",{ascending:false}),
        supabase.from("staff").select("id", {count:"exact"}).eq("salon_id", salon.id),
      ]);
      const revenue = (aRes.data||[]).reduce((s,a)=>s+(a.amount||0),0);
      const lastBooking = (aRes.data||[])[0]?.created_at || null;
      setStats({
        customers: cRes.count||0,
        appointments: aRes.count||0,
        staff: sRes.count||0,
        revenue,
        lastBooking,
      });
      setLoading(false);
    }
    loadStats();
  },[salon.id]);

  function fmtDate(d){ if(!d) return "Never"; return new Date(d).toLocaleDateString("en-IN",{day:"numeric",month:"short",year:"numeric"}); }

  const daysSinceActive = stats.lastBooking
    ? Math.floor((new Date() - new Date(stats.lastBooking))/(1000*60*60*24))
    : 999;
  const isActive = daysSinceActive <= 7;

  return(
    <div style={{minHeight:"100vh",background:T.bg,fontFamily:"system-ui,sans-serif"}}>
      {/* Header */}
      <div style={{background:T.dark,padding:"14px 16px",display:"flex",alignItems:"center",gap:12}}>
        <button onClick={onBack} style={{background:"transparent",border:"1px solid rgba(255,255,255,0.3)",color:"#fff",borderRadius:8,padding:"6px 12px",fontSize:13,cursor:"pointer",fontFamily:"inherit"}}>← Back</button>
        <div>
          <div style={{fontWeight:900,fontSize:15,color:"#fff"}}>{salon.salon_name||"Unknown Salon"}</div>
          <div style={{fontSize:11,color:"#a0a0c0"}}>{salon.owner_name} · {salon.city}</div>
        </div>
        <div style={{marginLeft:"auto"}}>
          <div style={{background:isActive?"#22c55e":"#ef4444",color:"#fff",fontSize:10,fontWeight:800,padding:"3px 10px",borderRadius:20}}>
            {isActive?"🟢 Active":"🔴 Inactive"}
          </div>
        </div>
      </div>

      <div style={{padding:"16px"}}>
        {loading
          ?<div style={{textAlign:"center",padding:40,color:T.ts}}>Loading...</div>
          :<>
            {/* Stats */}
            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10,marginBottom:14}}>
              <StatBox icon="👥" val={stats.customers} label="Customers" color={T.bt}/>
              <StatBox icon="📅" val={stats.appointments} label="Bookings" color={T.gd}/>
              <StatBox icon="👨‍💼" val={stats.staff} label="Staff" color="#a855f7"/>
              <StatBox icon="💰" val={`₹${stats.revenue.toLocaleString()}`} label="Revenue" color="#f59e0b"/>
            </div>

            {/* Salon Info */}
            <div style={{background:T.surface,border:`2px solid ${T.border}`,borderRadius:14,padding:14,marginBottom:12}}>
              <div style={{fontWeight:800,fontSize:13,marginBottom:12,color:T.ts}}>📋 SALON INFO</div>
              {[
                {label:"Owner",val:salon.owner_name||"—"},
                {label:"Email",val:salon.notification_email||salon.id||"—"},
                {label:"Phone",val:salon.phone||"—"},
                {label:"City",val:salon.city||"—"},
                {label:"WhatsApp",val:salon.whatsapp_number||"—"},
                {label:"Bot Keyword",val:salon.bot_keyword||"—"},
                {label:"Plan",val:salon.plan||"free"},
                {label:"Joined",val:fmtDate(salon.created_at)},
                {label:"Last Booking",val:fmtDate(stats.lastBooking)},
              ].map(r=>(
                <div key={r.label} style={{display:"flex",justifyContent:"space-between",padding:"7px 0",borderBottom:`1px solid ${T.border}`}}>
                  <div style={{fontSize:12,color:T.ts}}>{r.label}</div>
                  <div style={{fontSize:12,fontWeight:700,color:T.text,maxWidth:"60%",textAlign:"right",wordBreak:"break-all"}}>{r.val}</div>
                </div>
              ))}
            </div>

            {/* Services */}
            {(salon.services||[]).length>0&&(
              <div style={{background:T.surface,border:`2px solid ${T.border}`,borderRadius:14,padding:14}}>
                <div style={{fontWeight:800,fontSize:13,marginBottom:10,color:T.ts}}>✂️ SERVICES ({salon.services.length})</div>
                {salon.services.map((s,i)=>(
                  <div key={i} style={{display:"flex",justifyContent:"space-between",padding:"6px 0",borderBottom:`1px solid ${T.border}`}}>
                    <div style={{fontSize:12,color:T.tm}}>{s.emoji||"✂️"} {s.name}</div>
                    <div style={{fontSize:12,fontWeight:700,color:T.gd}}>₹{s.price}</div>
                  </div>
                ))}
              </div>
            )}
          </>
        }
      </div>
    </div>
  );
}

export default function SuperAdmin(){
  const [authed, setAuthed] = useState(false);
  const [salons, setSalons] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState(null);
  const [stats, setStats] = useState({});

  useEffect(()=>{
    if(!authed) return;
    async function loadSalons(){
      setLoading(true);
      const {data} = await supabase.from("salons").select("*").order("created_at",{ascending:false});
      setSalons(data||[]);

      // Load quick stats for each salon
      if(data&&data.length>0){
        const statsMap = {};
        await Promise.all(data.map(async s=>{
          const [cRes, aRes] = await Promise.all([
            supabase.from("customers").select("id",{count:"exact"}).eq("salon_id",s.id),
            supabase.from("appointments").select("id,created_at").eq("salon_id",s.id).order("created_at",{ascending:false}).limit(1),
          ]);
          statsMap[s.id] = {
            customers: cRes.count||0,
            lastBooking: (aRes.data||[])[0]?.created_at||null,
          };
        }));
        setStats(statsMap);
      }
      setLoading(false);
    }
    loadSalons();
  },[authed]);

  if(!authed) return <LoginScreen onLogin={()=>setAuthed(true)}/>;
  if(selected) return <SalonDetail salon={selected} onBack={()=>setSelected(null)}/>;

  const filtered = salons.filter(s=>
    !search ||
    (s.salon_name||"").toLowerCase().includes(search.toLowerCase()) ||
    (s.owner_name||"").toLowerCase().includes(search.toLowerCase()) ||
    (s.city||"").toLowerCase().includes(search.toLowerCase())
  );

  function fmtDate(d){ if(!d) return "—"; return new Date(d).toLocaleDateString("en-IN",{day:"numeric",month:"short"}); }

  const activeCount = salons.filter(s=>{
    const last = stats[s.id]?.lastBooking;
    if(!last) return false;
    return Math.floor((new Date()-new Date(last))/(1000*60*60*24)) <= 7;
  }).length;

  return(
    <div style={{minHeight:"100vh",background:T.bg,fontFamily:"system-ui,sans-serif"}}>
      {/* Header */}
      <div style={{background:T.dark,padding:"14px 16px"}}>
        <div style={{display:"flex",alignItems:"center",justifyContent:"space-between"}}>
          <div>
            <div style={{fontWeight:900,fontSize:16,color:"#fff"}}>🛡️ SnipBook Admin</div>
            <div style={{fontSize:11,color:"#a0a0c0",marginTop:2}}>Super Admin Panel</div>
          </div>
          <button onClick={()=>setAuthed(false)} style={{background:"transparent",border:"1px solid rgba(255,255,255,0.3)",color:"#fff",borderRadius:8,padding:"6px 12px",fontSize:12,cursor:"pointer",fontFamily:"inherit"}}>Logout</button>
        </div>
      </div>

      <div style={{padding:"14px"}}>
        {/* Summary Stats */}
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:8,marginBottom:14}}>
          <StatBox icon="✂️" val={salons.length} label="Total Salons" color={T.bt}/>
          <StatBox icon="🟢" val={activeCount} label="Active (7d)" color={T.gd}/>
          <StatBox icon="💤" val={salons.length-activeCount} label="Inactive" color="#f59e0b"/>
        </div>

        {/* Search */}
        <div style={{position:"relative",marginBottom:12}}>
          <span style={{position:"absolute",left:12,top:"50%",transform:"translateY(-50%)",fontSize:14,color:T.tf}}>🔍</span>
          <input
            value={search}
            onChange={e=>setSearch(e.target.value)}
            placeholder="Search salon, owner, city..."
            style={{width:"100%",padding:"10px 12px 10px 36px",border:`2px solid ${T.border}`,borderRadius:11,fontSize:13,fontFamily:"inherit",outline:"none",background:"#fff",boxSizing:"border-box"}}
          />
        </div>

        {/* Salon List */}
        {loading
          ?<div style={{textAlign:"center",padding:40}}><div style={{fontSize:32,marginBottom:8}}>✂️</div><div style={{color:T.ts}}>Loading salons...</div></div>
          :filtered.length===0
            ?<div style={{textAlign:"center",padding:40,color:T.ts}}>Koi salon nahi mila</div>
            :filtered.map(s=>{
              const sStats = stats[s.id]||{};
              const daysSince = sStats.lastBooking ? Math.floor((new Date()-new Date(sStats.lastBooking))/(1000*60*60*24)) : 999;
              const isActive = daysSince <= 7;
              return(
                <div key={s.id} onClick={()=>setSelected(s)} style={{background:T.surface,border:`2px solid ${T.border}`,borderRadius:14,padding:14,marginBottom:10,cursor:"pointer"}}
                  onMouseOver={e=>e.currentTarget.style.borderColor=T.green}
                  onMouseOut={e=>e.currentTarget.style.borderColor=T.border}
                >
                  <div style={{display:"flex",alignItems:"center",gap:12,marginBottom:10}}>
                    <div style={{width:44,height:44,borderRadius:12,background:isActive?T.gl:T.sub,border:`2px solid ${isActive?T.gm:T.border}`,display:"flex",alignItems:"center",justifyContent:"center",fontSize:18,flexShrink:0}}>
                      {s.logo_url?<img src={s.logo_url} style={{width:40,height:40,borderRadius:10,objectFit:"cover"}} alt="logo"/>:"✂️"}
                    </div>
                    <div style={{flex:1,minWidth:0}}>
                      <div style={{fontWeight:800,fontSize:14,color:T.text}}>{s.salon_name||"Unknown"}</div>
                      <div style={{fontSize:11,color:T.ts,marginTop:2}}>👤 {s.owner_name||"—"} · 📍 {s.city||"—"}</div>
                    </div>
                    <div style={{display:"flex",flexDirection:"column",alignItems:"flex-end",gap:4}}>
                      <div style={{background:isActive?"#dcfce7":"#fee2e2",color:isActive?T.gd:T.rt,fontSize:9,fontWeight:800,padding:"2px 8px",borderRadius:20}}>
                        {isActive?"🟢 Active":"🔴 Inactive"}
                      </div>
                      <div style={{fontSize:10,color:T.tf}}>{s.plan||"free"}</div>
                    </div>
                  </div>
                  <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:6}}>
                    {[
                      {label:"Customers",val:sStats.customers||0},
                      {label:"Last Booking",val:fmtDate(sStats.lastBooking)},
                      {label:"Joined",val:fmtDate(s.created_at)},
                    ].map(st=>(
                      <div key={st.label} style={{background:T.sub,borderRadius:8,padding:"6px",textAlign:"center",border:`1px solid ${T.border}`}}>
                        <div style={{fontWeight:800,fontSize:12,color:T.text}}>{st.val}</div>
                        <div style={{fontSize:9,color:T.tf,marginTop:1}}>{st.label}</div>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })
        }
      </div>
    </div>
  );
}
