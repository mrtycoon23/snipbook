import { useState, useEffect } from "react";
import { supabase } from "../lib/supabase";

const TP={
  bg:"#f8f9ff",surface:"#ffffff",border:"#e5e7eb",
  purple:"#2d1b69",purpleLight:"#f0eeff",purpleMid:"#5b3fc4",
  text:"#0f0a2e",tm:"#374151",ts:"#6b7280",tf:"#9ca3af",tg:"#e5e7eb",
  green:"#22c55e",gl:"#f0fdf4",gm:"#bbf7d0",gd:"#16a34a",
  yellow:"#fef9c3",yb:"#fde68a",yt:"#a16207",
  blue:"#eff6ff",bb:"#93c5fd",bt:"#2563eb",
  red:"#fff5f5",rb:"#fca5a5",rt:"#dc2626",
  orange:"#fff7ed",ob:"#fed7aa",ot:"#ea580c",
  sub:"#f8f9ff",inp:"#ffffff",wa:"#25d366",
};

const IS={
  width:"100%",padding:"11px 13px",border:`2px solid ${TP.border}`,
  borderRadius:11,fontSize:14,fontFamily:"inherit",outline:"none",
  background:TP.inp,boxSizing:"border-box",color:TP.text,
};

const CAMPAIGNS=[
  {id:"diwali",icon:"🪔",name:"Diwali Special",category:"Festival",color:"#f59e0b",colorLight:"#fff7ed",colorBorder:"#fed7aa",desc:"Diwali se pehle salon full rehta hai",template:`🪔 *Diwali Mubarak, {name}!*\n\n✨ *Diwali Special*\n💇 Haircut + Blowdry — ₹299\n💄 Bridal Makeup — 20% OFF\n\n📅 Reply *BOOK*\n\n_Happy Diwali! 💈_`},
  {id:"eid",icon:"🌙",name:"Eid Mubarak",category:"Festival",color:TP.purpleMid,colorLight:TP.purpleLight,colorBorder:TP.border,desc:"Eid pe special grooming offer",template:`🌙 *Eid Mubarak, {name}!*\n\n✨ *Eid Special*\n✂️ Haircut + Beard — ₹349\n\nReply *EID*\n\n_Eid Mubarak! 💈_`},
  {id:"newyear",icon:"🎆",name:"New Year Offer",category:"Festival",color:"#2563eb",colorLight:"#eff6ff",colorBorder:"#93c5fd",desc:"Naye saal mein naya look",template:`🎆 *Happy New Year, {name}!*\n\n🎁 Any Haircut — 25% OFF!\n\n_Naya Saal, Naya Look! 💈_`},
  {id:"monsoon",icon:"🌧️",name:"Monsoon Hair Care",category:"Seasonal",color:"#0891b2",colorLight:"#ecfeff",colorBorder:"#a5f3fc",desc:"Monsoon mein hair care tips + offer",template:`🌧️ *Monsoon Alert, {name}!*\n\n✨ Anti-Dandruff Treatment — ₹299\n💆 Deep Conditioning — ₹499\n\nReply *MONSOON*\n\n_Take care! 💈_`},
  {id:"referral",icon:"🤝",name:"Refer & Earn",category:"Growth",color:"#16a34a",colorLight:"#e8fdf0",colorBorder:"#bbf7d0",desc:"Existing customers se referral",template:`🤝 *{name} bhai/didi, ek kaam karo!*\n\nApne dost ko refer karo — Dono ko ₹100 OFF!\n\n_Thank you! 💈_`},
  {id:"review",icon:"⭐",name:"Review Request",category:"Growth",color:"#f59e0b",colorLight:"#fef9c3",colorBorder:"#fde68a",desc:"Google/social review maango",template:`⭐ *{name}, 2 minute ka kaam hai!*\n\nKya aap humara Google review de sakte hain? 🙏\n\n_Aap hain toh hum hain! 💈_`},
];

function daysSince(dateStr){if(!dateStr)return 0;const d=new Date(dateStr);if(isNaN(d))return 0;return Math.floor((new Date()-d)/(1000*60*60*24));}

function getBirthdayInfo(dob){
  if(!dob)return null;
  const today=new Date();const bday=new Date(dob);if(isNaN(bday))return null;
  bday.setFullYear(today.getFullYear());
  const diff=Math.ceil((bday-today)/(1000*60*60*24));
  if(diff===0)return{label:"🎂 Aaj Birthday!",urgency:"today",diff:0};
  if(diff>0&&diff<=3)return{label:`🎂 ${diff} din mein`,urgency:"soon",diff};
  if(diff>3&&diff<=7)return{label:"🎂 Is hafte",urgency:"week",diff};
  if(diff>7&&diff<=30)return{label:`🎂 ${diff} din mein`,urgency:"month",diff};
  if(diff<0&&diff>=-3)return{label:`🎂 ${Math.abs(diff)} din pehle tha`,urgency:"passed",diff};
  return null;
}

const US={today:{bg:"#fff0f0",border:TP.rb,color:TP.rt,badge:"🔴 Aaj!"},soon:{bg:TP.yellow,border:TP.yb,color:TP.yt,badge:"🟡 Jaldi!"},week:{bg:TP.gl,border:TP.gm,color:TP.gd,badge:"🟢 Is Hafte"},month:{bg:TP.sub,border:TP.border,color:TP.ts,badge:"📅 Is Mahine"},passed:{bg:TP.sub,border:TP.border,color:TP.tf,badge:"✓ Gaya"}};
const SL=({children,color})=><div style={{fontSize:10,fontWeight:800,color:color||TP.tf,letterSpacing:1.2,textTransform:"uppercase",marginBottom:10}}>{children}</div>;

async function sendViaAPI(messages){
  const res=await fetch("/api/send-engagement",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({messages})});
  return await res.json();
}

function GenderFilter({value,onChange,counts}){
  return(
    <div style={{display:"flex",gap:6,marginBottom:10}}>
      {[{id:"all",label:"👥 All",count:counts.all},{id:"male",label:"👨 Male",count:counts.male},{id:"female",label:"👩 Female",count:counts.female}].map(o=>(
        <button key={o.id} onClick={()=>onChange(o.id)} style={{flex:1,padding:"8px 4px",borderRadius:20,border:`2px solid ${value===o.id?TP.purpleMid:TP.border}`,background:value===o.id?TP.purpleLight:TP.surface,color:value===o.id?TP.purpleMid:TP.ts,fontSize:11,fontWeight:800,cursor:"pointer",fontFamily:"inherit",textAlign:"center"}}>
          {o.label}<br/><span style={{fontSize:10,opacity:0.85}}>({o.count})</span>
        </button>
      ))}
    </div>
  );
}

function LVFilter({value,onChange,total,match}){
  return(
    <div style={{background:TP.surface,border:`2px solid ${TP.border}`,borderRadius:12,padding:"12px 14px",marginBottom:12}}>
      <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:10}}>
        <div style={{fontSize:12,fontWeight:800,color:TP.tm}}>📅 Last Visit Filter</div>
        <div style={{fontSize:10,color:TP.ts}}>{value===0?`All (${total})`:`${match}/${total}`}</div>
      </div>
      <div style={{display:"flex",alignItems:"center",gap:10,marginBottom:value>0?10:0}}>
        <div style={{flex:1,position:"relative"}}>
          <input type="number" min={0} max={365} value={value===0?"":value} onChange={e=>onChange(parseInt(e.target.value)||0)} placeholder="0 = show all"
            style={{width:"100%",padding:"10px 44px 10px 13px",border:`2px solid ${TP.border}`,borderRadius:10,fontSize:15,fontWeight:800,fontFamily:"inherit",outline:"none",boxSizing:"border-box",background:"#fff",color:TP.text}}
            onFocus={e=>e.target.style.borderColor=TP.purpleMid} onBlur={e=>e.target.style.borderColor=TP.border}/>
          <div style={{position:"absolute",right:12,top:"50%",transform:"translateY(-50%)",fontSize:12,fontWeight:700,color:TP.ts}}>din</div>
        </div>
        {value>0&&<button onClick={()=>onChange(0)} style={{padding:"10px 14px",background:"#fff",border:`2px solid ${TP.border}`,borderRadius:10,fontSize:12,fontWeight:700,color:TP.ts,cursor:"pointer",fontFamily:"inherit",flexShrink:0}}>✕</button>}
      </div>
      {value>0&&<div style={{background:match>0?TP.gl:TP.red,border:`1.5px solid ${match>0?TP.gm:TP.rb}`,borderRadius:8,padding:"7px 10px",fontSize:11,fontWeight:700,color:match>0?TP.gd:TP.rt}}>{match>0?`✅ ${match} customers — ${value}+ din absent`:`❌ No clients found`}</div>}
    </div>
  );
}

function WAModal({title,message,phone,name,onClose}){
  const [status,setStatus]=useState("idle");
  const [edit,setEdit]=useState(false);
  const [msg,setMsg]=useState(message.replace(/{name}/g,name));
  async function sendDirect(){
    setStatus("sending");
    try{const result=await sendViaAPI([{phone,name,message:msg}]);if(result.sent>0)setStatus("sent");else setStatus("error");}
    catch(e){setStatus("error");}
  }
  return(
    <div onClick={onClose} style={{position:"fixed",inset:0,background:"rgba(45,27,105,0.4)",zIndex:800,display:"flex",alignItems:"flex-end"}}>
      <div onClick={e=>e.stopPropagation()} style={{background:TP.surface,borderRadius:"20px 20px 0 0",padding:"20px 18px 36px",width:"100%",maxHeight:"90vh",overflowY:"auto"}}>
        <div style={{width:36,height:4,background:TP.border,borderRadius:2,margin:"0 auto 18px"}}/>
        <div style={{display:"flex",alignItems:"center",gap:10,marginBottom:16}}>
          <div style={{width:42,height:42,borderRadius:12,background:TP.purpleLight,border:`2px solid ${TP.border}`,display:"flex",alignItems:"center",justifyContent:"center",fontSize:20}}>💬</div>
          <div style={{flex:1}}>
            <div style={{fontWeight:900,fontSize:15,color:TP.text}}>{title}</div>
            <div style={{fontSize:12,color:TP.ts}}>+91 {phone}</div>
          </div>
          {status==="idle"&&<button onClick={()=>setEdit(e=>!e)} style={{padding:"6px 12px",background:edit?TP.purpleMid:TP.sub,border:`1.5px solid ${edit?TP.purpleMid:TP.border}`,borderRadius:20,fontSize:11,fontWeight:800,color:edit?"#fff":TP.ts,cursor:"pointer",fontFamily:"inherit"}}>{edit?"✓ Done":"✏️ Edit"}</button>}
        </div>
        {edit
          ?<div style={{marginBottom:16}}><textarea value={msg} onChange={e=>setMsg(e.target.value)} rows={10} autoFocus style={{...IS,resize:"vertical",lineHeight:1.7,fontSize:13,padding:"12px",borderColor:TP.purpleMid,marginBottom:8}}/><button onClick={()=>setEdit(false)} style={{padding:"6px 14px",background:`linear-gradient(135deg,${TP.purple},${TP.purpleMid})`,border:"none",borderRadius:9,fontSize:11,fontWeight:800,color:"#fff",cursor:"pointer",fontFamily:"inherit"}}>✓ Done</button></div>
          :<div style={{background:"#e5ddd5",borderRadius:14,padding:14,marginBottom:16}}><div style={{background:"#fff",borderRadius:"12px 12px 12px 3px",padding:"12px 14px",maxWidth:"90%"}}><pre style={{margin:0,fontFamily:"inherit",fontSize:12,lineHeight:1.7,color:TP.text,whiteSpace:"pre-wrap",wordBreak:"break-word"}}>{msg}</pre></div></div>
        }
        {status==="idle"&&<div style={{display:"flex",gap:10}}><button onClick={onClose} style={{flex:1,padding:13,border:`2px solid ${TP.border}`,borderRadius:12,background:TP.surface,fontFamily:"inherit",fontSize:13,fontWeight:700,cursor:"pointer",color:TP.tm}}>Cancel</button><button onClick={sendDirect} style={{flex:2,padding:13,background:TP.wa,border:"none",borderRadius:12,color:"#fff",fontFamily:"inherit",fontSize:14,fontWeight:800,cursor:"pointer"}}>💬 Send Directly</button></div>}
        {status==="sending"&&<div style={{background:TP.purpleLight,border:`2px solid ${TP.border}`,borderRadius:12,padding:14,textAlign:"center",fontWeight:800,color:TP.purpleMid}}>📤 Sending...</div>}
        {status==="sent"&&<div style={{background:TP.gl,border:`2px solid ${TP.gm}`,borderRadius:12,padding:14,textAlign:"center",fontWeight:800,color:TP.gd}}>✅ Message bhej diya!</div>}
        {status==="error"&&<div style={{display:"flex",flexDirection:"column",gap:8}}><div style={{background:TP.red,border:`2px solid ${TP.rb}`,borderRadius:12,padding:10,textAlign:"center",fontSize:12,color:TP.rt,fontWeight:700}}>⚠️ Send nahi hua</div><div style={{display:"flex",gap:10}}><button onClick={onClose} style={{flex:1,padding:12,border:`2px solid ${TP.border}`,borderRadius:12,background:TP.surface,fontFamily:"inherit",fontSize:13,fontWeight:700,cursor:"pointer"}}>Close</button><button onClick={sendDirect} style={{flex:1,padding:12,background:TP.wa,border:"none",borderRadius:12,color:"#fff",fontFamily:"inherit",fontSize:13,fontWeight:800,cursor:"pointer"}}>🔄 Retry</button></div></div>}
      </div>
    </div>
  );
}

function BulkSendModal({customers,template,title,onClose}){
  const [phase,setPhase]=useState("select");
  const [sel,setSel]=useState(customers.map(c=>c.id));
  const [tpl,setTpl]=useState(template);
  const [edit,setEdit]=useState(false);
  const [status,setStatus]=useState("idle");
  const [results,setResults]=useState(null);
  const sc=customers.filter(c=>sel.includes(c.id));
  const allSel=sel.length===customers.length;
  async function sendAll(){
    setPhase("sending");setStatus("sending");
    try{
      const messages=sc.map(c=>({phone:c.phone,name:c.name,message:tpl.replace(/{name}/g,c.name)}));
      const result=await sendViaAPI(messages);
      setResults(result);setStatus("done");
    }catch(e){setStatus("error");}
  }
  return(
    <div onClick={onClose} style={{position:"fixed",inset:0,background:"rgba(45,27,105,0.4)",zIndex:800,display:"flex",alignItems:"flex-end"}}>
      <div onClick={e=>e.stopPropagation()} style={{background:TP.surface,borderRadius:"20px 20px 0 0",padding:"20px 18px 36px",width:"100%",maxHeight:"92vh",overflowY:"auto"}}>
        <div style={{width:36,height:4,background:TP.border,borderRadius:2,margin:"0 auto 18px"}}/>
        <div style={{fontWeight:900,fontSize:16,marginBottom:2,color:TP.text}}>📤 {title}</div>
        <div style={{fontSize:12,color:TP.ts,marginBottom:16}}>{sc.length} customers ko bhejenge</div>
        {phase==="select"&&(<>
          <div style={{background:TP.sub,border:`2px solid ${TP.border}`,borderRadius:14,marginBottom:14,overflow:"hidden"}}>
            <div style={{padding:"11px 14px",display:"flex",alignItems:"center",justifyContent:"space-between",borderBottom:`1px solid ${TP.border}`}}>
              <div style={{fontSize:12,fontWeight:800,color:TP.text}}>💬 Message</div>
              <button onClick={()=>setEdit(e=>!e)} style={{padding:"4px 10px",background:edit?TP.purpleMid:TP.surface,border:`1.5px solid ${edit?TP.purpleMid:TP.border}`,borderRadius:20,fontSize:11,fontWeight:700,color:edit?"#fff":TP.ts,cursor:"pointer",fontFamily:"inherit"}}>{edit?"✓ Done":"✏️ Edit"}</button>
            </div>
            {edit
              ?<div style={{padding:"12px 14px"}}><textarea value={tpl} onChange={e=>setTpl(e.target.value)} rows={8} autoFocus style={{...IS,resize:"vertical",lineHeight:1.7,fontSize:12,padding:"10px",borderColor:TP.purpleMid,marginBottom:8}}/><button onClick={()=>setEdit(false)} style={{padding:"6px 12px",background:`linear-gradient(135deg,${TP.purple},${TP.purpleMid})`,border:"none",borderRadius:9,fontSize:11,fontWeight:800,color:"#fff",cursor:"pointer",fontFamily:"inherit"}}>✓ Save</button></div>
              :<div style={{padding:"9px 14px",fontSize:11,color:TP.ts,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{tpl.split("\n")[0].replace(/{name}/g,customers[0]?.name||"Customer")}…</div>
            }
          </div>
          <div style={{background:TP.sub,border:`2px solid ${TP.border}`,borderRadius:12,padding:"10px 14px",marginBottom:12,display:"flex",alignItems:"center",justifyContent:"space-between"}}>
            <div style={{fontSize:13,fontWeight:800,color:TP.text}}>{sel.length===0?"Koi select nahi":`${sel.length} selected`}</div>
            <button onClick={()=>setSel(allSel?[]:customers.map(c=>c.id))} style={{padding:"6px 14px",background:allSel?TP.rt:`linear-gradient(135deg,${TP.purple},${TP.purpleMid})`,border:"none",borderRadius:20,color:"#fff",fontSize:11,fontWeight:800,cursor:"pointer",fontFamily:"inherit"}}>{allSel?"✕ Deselect":"✓ Select All"}</button>
          </div>
          <div style={{marginBottom:16,background:TP.surface,border:`2px solid ${TP.border}`,borderRadius:14,overflow:"hidden"}}>
            {customers.map((c,i)=>{const isSel=sel.includes(c.id);const av=c.avatar||(c.name?.slice(0,2)||"??").toUpperCase();const col=c.color||TP.purpleMid;return(
              <div key={c.id} onClick={()=>setSel(p=>p.includes(c.id)?p.filter(x=>x!==c.id):[...p,c.id])} style={{display:"flex",alignItems:"center",gap:12,padding:"12px 14px",borderBottom:i<customers.length-1?`1px solid ${TP.border}`:"none",background:isSel?TP.purpleLight:TP.surface,cursor:"pointer"}}>
                <div style={{width:22,height:22,borderRadius:7,flexShrink:0,background:isSel?TP.purpleMid:TP.surface,border:`2px solid ${isSel?TP.purpleMid:TP.border}`,display:"flex",alignItems:"center",justifyContent:"center",fontSize:12,color:"#fff",fontWeight:900}}>{isSel?"✓":""}</div>
                <div style={{width:38,height:38,borderRadius:11,background:col+"22",display:"flex",alignItems:"center",justifyContent:"center",fontSize:13,fontWeight:900,color:col,flexShrink:0}}>{av}</div>
                <div style={{flex:1}}><div style={{fontSize:13,fontWeight:800,color:TP.text}}>{c.name}</div><div style={{fontSize:11,color:TP.ts}}>📱 {c.phone}</div></div>
                <div style={{fontSize:10,fontWeight:700,color:TP.ts,background:TP.sub,padding:"2px 8px",borderRadius:20,border:`1px solid ${TP.border}`,flexShrink:0}}>{c.tag}</div>
              </div>
            );})}
          </div>
          <div style={{display:"flex",gap:10}}>
            <button onClick={onClose} style={{flex:1,padding:12,border:`2px solid ${TP.border}`,borderRadius:12,background:TP.surface,fontFamily:"inherit",fontSize:13,fontWeight:700,cursor:"pointer",color:TP.tm}}>Cancel</button>
            <button onClick={()=>{if(sel.length>0)sendAll();}} style={{flex:2,padding:12,background:sel.length>0?TP.wa:"#d1d5db",border:"none",borderRadius:12,color:"#fff",fontFamily:"inherit",fontSize:14,fontWeight:800,cursor:sel.length>0?"pointer":"not-allowed"}}>💬 Send to {sel.length} →</button>
          </div>
        </>)}
        {phase==="sending"&&status==="sending"&&<div style={{background:TP.purpleLight,border:`2px solid ${TP.border}`,borderRadius:14,padding:24,textAlign:"center"}}><div style={{fontSize:36,marginBottom:10}}>📤</div><div style={{fontWeight:900,fontSize:16,color:TP.purpleMid,marginBottom:4}}>Sending {sc.length} messages...</div><div style={{fontSize:12,color:TP.ts}}>Thoda wait karo</div></div>}
        {status==="done"&&results&&<div style={{background:TP.gl,border:`2px solid ${TP.gm}`,borderRadius:14,padding:24,textAlign:"center"}}><div style={{fontSize:42,marginBottom:10}}>🎉</div><div style={{fontWeight:900,fontSize:16,color:TP.gd,marginBottom:4}}>Done!</div><div style={{fontSize:13,color:TP.gd,marginBottom:4}}>✅ {results.sent} sent · ❌ {results.failed} failed</div><button onClick={onClose} style={{padding:"11px 32px",background:TP.green,border:"none",borderRadius:12,color:"#fff",fontFamily:"inherit",fontSize:14,fontWeight:800,cursor:"pointer",marginTop:8}}>Done ✓</button></div>}
        {status==="error"&&<div style={{display:"flex",flexDirection:"column",gap:8}}><div style={{background:TP.red,border:`2px solid ${TP.rb}`,borderRadius:12,padding:14,textAlign:"center",fontSize:13,color:TP.rt,fontWeight:700}}>⚠️ Error hua</div><div style={{display:"flex",gap:10}}><button onClick={onClose} style={{flex:1,padding:12,border:`2px solid ${TP.border}`,borderRadius:12,background:TP.surface,fontFamily:"inherit",fontSize:13,fontWeight:700,cursor:"pointer"}}>Close</button><button onClick={()=>{setStatus("idle");setPhase("select");}} style={{flex:1,padding:12,background:TP.green,border:"none",borderRadius:12,color:"#fff",fontFamily:"inherit",fontSize:13,fontWeight:800,cursor:"pointer"}}>🔄 Retry</button></div></div>}
      </div>
    </div>
  );
}

function ReengagementTab({customers}){
  const [sub,setSub]=useState("inactive");
  const [filter,setFilter]=useState(30);
  const [gFilter,setGFilter]=useState("all");
  const [waModal,setWaModal]=useState(null);
  const [bulkModal,setBulkModal]=useState(null);
  const [sentIds,setSentIds]=useState([]);
  const [selInactive,setSelInactive]=useState([]);
  const [search,setSearch]=useState("");
  const [lvFilter,setLvFilter]=useState(0);
  const [tagFilter,setTagFilter]=useState("All");
  const [aGender,setAGender]=useState("all");
  const [allBulk,setAllBulk]=useState(false);
  const [selAll,setSelAll]=useState([]);
  const [msg,setMsg]=useState(`🙏 *Namaste {name}!*\n\nAapko yaad kar rahe hain hum! 😊\n\nAapki next visit pe *10% OFF*!\n\n📅 Reply *BOOK*\n\n_Milte hain jald! 💈_`);
  const [editMsg,setEditMsg]=useState(false);

  const getLV=c=>daysSince(c.last_visit||c.lastVisit);
  const lost=customers.map(c=>({...c,days:getLV(c)})).filter(c=>c.days>=filter).filter(c=>gFilter==="all"?true:c.gender===gFilter).sort((a,b)=>b.days-a.days);
  const filtAll=customers.filter(c=>tagFilter==="All"?true:c.tag===tagFilter).filter(c=>aGender==="all"?true:c.gender===aGender).filter(c=>lvFilter===0?true:getLV(c)>=lvFilter).filter(c=>{const q=search.toLowerCase();return !q||c.name.toLowerCase().includes(q)||(c.phone||"").includes(q);});
  const bulkTpl=`🙏 *Namaste {name}!*\n\nKaafi dino se aap nahi aaye. Kya sab theek hai? 💇\n\n✨ Next visit pe *15% OFF*!\n\n_Miss you! 💈_`;
  const iGC={all:customers.filter(c=>getLV(c)>=filter).length,male:customers.filter(c=>getLV(c)>=filter&&c.gender==="male").length,female:customers.filter(c=>getLV(c)>=filter&&c.gender==="female").length};
  const aGC={all:customers.length,male:customers.filter(c=>c.gender==="male").length,female:customers.filter(c=>c.gender==="female").length};
  const allISel=selInactive.length===lost.length&&lost.length>0;
  const allASel=selAll.length===filtAll.length&&filtAll.length>0;

  const lostCount=customers.map(c=>({...c,days:getLV(c)})).filter(c=>c.days>=30).length;
  const potentialRevenue=lostCount*350;

  return(
    <div style={{padding:"16px 16px 80px",background:TP.bg}}>
      {/* Hero Banner */}
      <div style={{background:"linear-gradient(135deg,#3d2490 0%,#5b3fc4 60%,#7c5fe6 100%)",borderRadius:20,padding:"20px",marginBottom:18,position:"relative",overflow:"hidden"}}>
        <div style={{position:"absolute",right:-10,top:"50%",transform:"translateY(-50%)",fontSize:80,opacity:0.15,pointerEvents:"none"}}>🧲</div>
        <div style={{fontSize:18,fontWeight:800,color:"#fff",letterSpacing:"-0.4px",marginBottom:5}}>Re-engagement Center</div>
        <div style={{fontSize:12,color:"rgba(255,255,255,0.75)",lineHeight:1.6,marginBottom:16}}>Bring inactive clients back{"
"}and grow your business.</div>
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10}}>
          <div style={{background:"rgba(255,255,255,0.12)",borderRadius:14,padding:"12px 14px",display:"flex",alignItems:"center",gap:10}}>
            <span style={{fontSize:20}}>👥</span>
            <div><div style={{fontSize:20,fontWeight:800,color:"#fff",lineHeight:1}}>{lostCount}</div><div style={{fontSize:10,color:"rgba(255,255,255,0.65)",marginTop:2,fontWeight:500}}>Inactive Clients</div></div>
          </div>
          <div style={{background:"rgba(255,255,255,0.12)",borderRadius:14,padding:"12px 14px",display:"flex",alignItems:"center",gap:10}}>
            <span style={{fontSize:20}}>📈</span>
            <div><div style={{fontSize:18,fontWeight:800,color:"#4ade80",lineHeight:1}}>₹{potentialRevenue>=1000?(potentialRevenue/1000).toFixed(0)+"k":potentialRevenue}</div><div style={{fontSize:10,color:"rgba(255,255,255,0.65)",marginTop:2,fontWeight:500}}>Potential Revenue</div></div>
          </div>
        </div>
      </div>

      {/* Sub tabs */}
      <div style={{display:"flex",gap:8,marginBottom:16}}>
        {[{id:"inactive",label:"💤 Inactive",desc:"Not visited recently"},{id:"all",label:"👥 All Clients",desc:"Broadcast to all"}].map(t=>(
          <div key={t.id} onClick={()=>setSub(t.id)} style={{flex:1,padding:"11px 10px",borderRadius:14,border:`1.5px solid ${sub===t.id?TP.purpleMid:TP.border}`,background:sub===t.id?TP.purpleLight:TP.surface,cursor:"pointer",textAlign:"center",boxShadow:sub===t.id?"0 2px 8px rgba(91,63,196,0.15)":"0 1px 3px rgba(0,0,0,0.04)"}}>
            <div style={{fontSize:13,fontWeight:800,color:sub===t.id?TP.purpleMid:TP.tm}}>{t.label}</div>
            <div style={{fontSize:10,color:sub===t.id?TP.purpleMid:TP.ts,marginTop:2}}>{t.desc}</div>
          </div>
        ))}
      </div>

      {sub==="inactive"&&(<>
        <GenderFilter value={gFilter} onChange={(g)=>{setGFilter(g);setSelInactive([]);}} counts={iGC}/>
        <LVFilter value={filter} onChange={(v)=>{setFilter(v);setSelInactive([]);}} total={customers.filter(c=>gFilter==="all"?true:c.gender===gFilter).length} match={customers.filter(c=>(gFilter==="all"?true:c.gender===gFilter)&&getLV(c)>=filter).length}/>
        {lost.length>0&&(
          <div style={{background:TP.sub,border:`2px solid ${TP.border}`,borderRadius:12,padding:"10px 14px",marginBottom:12,display:"flex",alignItems:"center",justifyContent:"space-between"}}>
            <div style={{fontSize:13,fontWeight:800,color:TP.text}}>{selInactive.length===0?`${lost.length} customers`:`${selInactive.length} selected`}</div>
            <div style={{display:"flex",gap:7}}>
              <button onClick={()=>setSelInactive(allISel?[]:lost.map(c=>c.id))} style={{padding:"5px 12px",background:allISel?TP.rt:`linear-gradient(135deg,${TP.purple},${TP.purpleMid})`,border:"none",borderRadius:20,color:"#fff",fontSize:11,fontWeight:800,cursor:"pointer",fontFamily:"inherit"}}>{allISel?"✕":"✓ Select All"}</button>
              {selInactive.length>0&&<button onClick={()=>setBulkModal(true)} style={{padding:"5px 12px",background:TP.wa,border:"none",borderRadius:20,color:"#fff",fontSize:11,fontWeight:800,cursor:"pointer",fontFamily:"inherit"}}>💬 ({selInactive.length})</button>}
            </div>
          </div>
        )}
        {lost.length===0
          ?<div style={{background:"#fff",border:"1.5px dashed #ddd6fe",borderRadius:20,padding:"36px 20px",textAlign:"center"}}>
          <div style={{fontSize:52,marginBottom:12}}>🎉</div>
          <div style={{fontSize:15,fontWeight:800,color:TP.text,marginBottom:4,letterSpacing:"-0.2px"}}>Great News!</div>
          <div style={{fontSize:12,color:TP.ts,lineHeight:1.6}}>No inactive clients found.<br/>Your client retention is excellent.</div>
        </div>
          :<div style={{display:"flex",flexDirection:"column",gap:10}}>
            {lost.map(c=>{
              const isSent=sentIds.includes(c.id);const isSel=selInactive.includes(c.id);
              const uC=c.days>=90?TP.rt:c.days>=60?TP.ot:TP.yt;const uB=c.days>=90?TP.red:c.days>=60?TP.orange:TP.yellow;
              const av=c.avatar||(c.name?.slice(0,2)||"??").toUpperCase();const col=c.color||TP.purpleMid;
              const reMsg=`🙏 *Namaste ${c.name}!*\n\nAapko yaad kar rahe hain hum! 😊\n\nKaafi dino se aap nahi aaye — ${c.days} din ho gaye. 💇\n\n✨ Next visit pe *15% OFF*!\n\n_Miss you! 💈_`;
              return(
                <div key={c.id} style={{background:TP.surface,border:`2px solid ${isSel?TP.purpleMid:isSent?TP.gm:TP.border}`,borderRadius:14,padding:"14px"}}>
                  <div style={{display:"flex",alignItems:"center",gap:12,marginBottom:12}}>
                    <div onClick={()=>setSelInactive(p=>p.includes(c.id)?p.filter(x=>x!==c.id):[...p,c.id])} style={{width:22,height:22,borderRadius:7,flexShrink:0,background:isSel?TP.purpleMid:TP.surface,border:`2px solid ${isSel?TP.purpleMid:TP.border}`,display:"flex",alignItems:"center",justifyContent:"center",fontSize:12,color:"#fff",fontWeight:900,cursor:"pointer"}}>{isSel?"✓":""}</div>
                    <div style={{width:44,height:44,borderRadius:14,background:col+"22",border:`2px solid ${col}44`,display:"flex",alignItems:"center",justifyContent:"center",fontSize:15,fontWeight:900,color:col,flexShrink:0}}>{av}</div>
                    <div style={{flex:1}}><div style={{fontWeight:800,fontSize:14,color:TP.text}}>{c.name}</div><div style={{fontSize:11,color:TP.ts}}>📱 {c.phone}</div></div>
                    <div style={{background:uB,color:uC,fontSize:11,fontWeight:800,padding:"4px 10px",borderRadius:20,flexShrink:0}}>{c.days} din</div>
                  </div>
                  <div style={{background:TP.sub,borderRadius:9,padding:"8px 12px",marginBottom:12,fontSize:12,color:TP.tm}}>📅 Last visit: <strong>{c.last_visit||c.lastVisit||"—"}</strong></div>
                  {isSent
                    ?<div style={{background:TP.gl,border:`1.5px solid ${TP.gm}`,borderRadius:10,padding:"10px",textAlign:"center",fontSize:12,fontWeight:800,color:TP.gd}}>✅ Message bhej diya!</div>
                    :<button onClick={()=>setWaModal({customer:c,message:reMsg})} style={{width:"100%",padding:"11px",background:TP.wa,border:"none",borderRadius:11,color:"#fff",fontFamily:"inherit",fontSize:13,fontWeight:800,cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",gap:8}}>💬 Wapas bulao</button>
                  }
                </div>
              );
            })}
          </div>
        }
      </>)}

      {sub==="all"&&(<>
        <div style={{background:TP.surface,border:`2px solid ${editMsg?TP.purpleMid:TP.border}`,borderRadius:14,marginBottom:14,overflow:"hidden"}}>
          <div style={{padding:"11px 14px",display:"flex",alignItems:"center",justifyContent:"space-between",borderBottom:`1px solid ${TP.border}`,background:TP.sub}}>
            <div style={{fontSize:12,fontWeight:800,color:TP.text}}>📝 Broadcast Message</div>
            <button onClick={()=>setEditMsg(e=>!e)} style={{padding:"5px 12px",background:editMsg?TP.purpleMid:TP.surface,border:`1.5px solid ${editMsg?TP.purpleMid:TP.border}`,borderRadius:20,fontSize:11,fontWeight:800,color:editMsg?"#fff":TP.ts,cursor:"pointer",fontFamily:"inherit"}}>{editMsg?"✓ Done":"✏️ Edit"}</button>
          </div>
          {editMsg
            ?<div style={{padding:"12px 14px"}}><textarea value={msg} onChange={e=>setMsg(e.target.value)} rows={8} autoFocus style={{...IS,resize:"vertical",lineHeight:1.7,fontSize:12,padding:"10px",borderColor:TP.purpleMid,marginBottom:8}}/><button onClick={()=>setEditMsg(false)} style={{padding:"6px 14px",background:`linear-gradient(135deg,${TP.purple},${TP.purpleMid})`,border:"none",borderRadius:9,fontSize:11,fontWeight:800,color:"#fff",cursor:"pointer",fontFamily:"inherit"}}>✓ Save</button></div>
            :<div style={{padding:"9px 14px"}}><pre style={{margin:0,fontFamily:"inherit",fontSize:11,lineHeight:1.7,color:TP.tm,whiteSpace:"pre-wrap",wordBreak:"break-word",maxHeight:70,overflow:"hidden"}}>{msg.replace(/{name}/g,customers[0]?.name||"Customer")}</pre></div>
          }
        </div>
        <GenderFilter value={aGender} onChange={(g)=>{setAGender(g);setSelAll([]);}} counts={aGC}/>
        <LVFilter value={lvFilter} onChange={(v)=>{setLvFilter(v);setSelAll([]);}} total={customers.filter(c=>(tagFilter==="All"?true:c.tag===tagFilter)&&(aGender==="all"?true:c.gender===aGender)).length} match={filtAll.length}/>
        <div style={{display:"flex",gap:6,marginBottom:8}}>
          {["All","VIP","Regular","New"].map(f=>(
            <button key={f} onClick={()=>{setTagFilter(f);setSelAll([]);}} style={{padding:"5px 10px",borderRadius:20,border:`2px solid ${tagFilter===f?TP.purpleMid:TP.border}`,background:tagFilter===f?TP.purpleLight:TP.surface,color:tagFilter===f?TP.purpleMid:TP.ts,fontSize:11,fontWeight:800,cursor:"pointer",fontFamily:"inherit",flexShrink:0}}>{f}</button>
          ))}
        </div>
        <div style={{position:"relative",marginBottom:10}}>
          <span style={{position:"absolute",left:11,top:"50%",transform:"translateY(-50%)",fontSize:13,color:TP.tf}}>🔍</span>
          <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Search…" style={{...IS,padding:"9px 12px 9px 32px",fontSize:13}} onFocus={e=>e.target.style.borderColor=TP.purpleMid} onBlur={e=>e.target.style.borderColor=TP.border}/>
        </div>
        <div style={{background:TP.sub,border:`2px solid ${TP.border}`,borderRadius:12,padding:"10px 14px",marginBottom:12,display:"flex",alignItems:"center",justifyContent:"space-between"}}>
          <div style={{fontSize:13,fontWeight:800,color:TP.text}}>{selAll.length===0?`${filtAll.length} customers`:`${selAll.length} selected`}</div>
          <div style={{display:"flex",gap:7}}>
            <button onClick={()=>setSelAll(allASel?[]:filtAll.map(c=>c.id))} style={{padding:"5px 12px",background:allASel?TP.rt:`linear-gradient(135deg,${TP.purple},${TP.purpleMid})`,border:"none",borderRadius:20,color:"#fff",fontSize:11,fontWeight:800,cursor:"pointer",fontFamily:"inherit"}}>{allASel?"✕":"✓ Select All"}</button>
            {selAll.length>0&&<button onClick={()=>setAllBulk(true)} style={{padding:"5px 12px",background:TP.wa,border:"none",borderRadius:20,color:"#fff",fontSize:11,fontWeight:800,cursor:"pointer",fontFamily:"inherit"}}>💬 ({selAll.length})</button>}
          </div>
        </div>
        <div style={{background:TP.surface,border:`2px solid ${TP.border}`,borderRadius:14,overflow:"hidden"}}>
          {filtAll.map((c,i)=>{const isSel=selAll.includes(c.id);const av=c.avatar||(c.name?.slice(0,2)||"??").toUpperCase();const col=c.color||TP.purpleMid;return(
            <div key={c.id} onClick={()=>setSelAll(p=>p.includes(c.id)?p.filter(x=>x!==c.id):[...p,c.id])} style={{display:"flex",alignItems:"center",gap:12,padding:"12px 14px",borderBottom:i<filtAll.length-1?`1px solid ${TP.border}`:"none",background:isSel?TP.purpleLight:TP.surface,cursor:"pointer"}}>
              <div style={{width:22,height:22,borderRadius:7,flexShrink:0,background:isSel?TP.purpleMid:TP.surface,border:`2px solid ${isSel?TP.purpleMid:TP.border}`,display:"flex",alignItems:"center",justifyContent:"center",fontSize:12,color:"#fff",fontWeight:900}}>{isSel?"✓":""}</div>
              <div style={{width:40,height:40,borderRadius:12,background:col+"22",display:"flex",alignItems:"center",justifyContent:"center",fontSize:14,fontWeight:900,color:col,flexShrink:0}}>{av}</div>
              <div style={{flex:1}}><div style={{fontSize:13,fontWeight:800,color:TP.text}}>{c.name}</div><div style={{fontSize:11,color:TP.ts}}>📅 {c.last_visit||c.lastVisit||"—"}</div></div>
              <div style={{display:"flex",alignItems:"center",gap:6}}>
                <div style={{fontSize:10,fontWeight:700,color:TP.ts,background:TP.sub,padding:"2px 7px",borderRadius:20,border:`1px solid ${TP.border}`,flexShrink:0}}>{c.tag}</div>
                <div onClick={e=>{e.stopPropagation();setWaModal({customer:c,message:msg});}} style={{width:32,height:32,background:TP.wa,borderRadius:9,display:"flex",alignItems:"center",justifyContent:"center",fontSize:14,cursor:"pointer",flexShrink:0}}>💬</div>
              </div>
            </div>
          );})}
        </div>
      </>)}

      {waModal&&<WAModal title={waModal.customer.name} message={waModal.message} phone={waModal.customer.phone} name={waModal.customer.name} onClose={()=>{setSentIds(p=>[...p,waModal.customer.id]);setWaModal(null);}}/>}
      {bulkModal&&<BulkSendModal customers={lost.filter(c=>selInactive.includes(c.id))} template={bulkTpl} title="Re-engagement" onClose={()=>setBulkModal(null)}/>}
      {allBulk&&<BulkSendModal customers={filtAll.filter(c=>selAll.includes(c.id))} template={msg} title="Broadcast" onClose={()=>setAllBulk(false)}/>}
    </div>
  );
}

function BirthdayTab({customers}){
  const [waModal,setWaModal]=useState(null);
  const [sentIds,setSentIds]=useState([]);
  const [gf,setGf]=useState("all");
  const wb=customers.map(c=>({...c,bdayInfo:getBirthdayInfo(c.dob||c.birthday)})).filter(c=>c.bdayInfo).filter(c=>gf==="all"?true:c.gender===gf).sort((a,b)=>a.bdayInfo.diff-b.bdayInfo.diff);
  const bc={all:customers.filter(c=>getBirthdayInfo(c.dob||c.birthday)).length,male:customers.filter(c=>getBirthdayInfo(c.dob||c.birthday)&&c.gender==="male").length,female:customers.filter(c=>getBirthdayInfo(c.dob||c.birthday)&&c.gender==="female").length};
  function bdayMsg(c){if(c.bdayInfo.urgency==="passed")return `🎂 *Belated Birthday, ${c.name}!*\n\nThodi der se sahi, par dil se! 🙏\n\n🎁 Next visit pe *20% OFF*!\n\n_With love! 💈_`;return `🎂 *Happy Birthday, ${c.name}!* 🎉\n\nAaj ka din aapka hai! 🥳\n\n🎁 Free Haircut OR 25% OFF!\nSirf birthday month mein!\n\nReply *BDAY*\n\n_Khush raho! 💈_`;}
  return(
    <div style={{padding:"16px 16px 80px",background:TP.bg}}>
      {/* Hero Banner */}
      <div style={{background:"linear-gradient(135deg,#f0eeff,#e4dcff)",border:"1px solid #ddd6fe",borderRadius:20,padding:"18px",marginBottom:18,position:"relative",overflow:"hidden"}}>
        <div style={{position:"absolute",right:-4,top:"50%",transform:"translateY(-50%)",fontSize:80,opacity:0.25,pointerEvents:"none"}}>🎂</div>
        <div style={{fontSize:17,fontWeight:800,color:"#2d1b69",letterSpacing:"-0.3px",marginBottom:5}}>Birthday Campaigns</div>
        <div style={{fontSize:12,color:"#6b5fa0",lineHeight:1.6,marginBottom:14}}>Celebrate your clients' special days{"
"}and build stronger relationships.</div>
        <div onClick={()=>{}} style={{background:"#5b3fc4",color:"#fff",borderRadius:24,padding:"9px 20px",fontSize:12,fontWeight:700,display:"inline-flex",alignItems:"center",gap:6,cursor:"pointer"}}>Create Birthday Offer ›</div>
      </div>

      {/* Upcoming header */}
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:10}}>
        <div style={{fontSize:14,fontWeight:800,color:TP.text,letterSpacing:"-0.2px"}}>Upcoming Birthdays</div>
        <div style={{fontSize:12,color:TP.purpleMid,fontWeight:600,cursor:"pointer"}}>View All</div>
      </div>

      {/* 4 stat boxes */}
      <div style={{display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:7,marginBottom:16}}>
        {[
          {l:"Today",u:"today",bg:"#f0fdf4",border:"#bbf7d0",icon:"🎁"},
          {l:"Next 3 Days",u:"soon",bg:"#fff7ed",border:"#fed7aa",icon:"📅"},
          {l:"This Week",u:"week",bg:"#eff6ff",border:"#bfdbfe",icon:"📅"},
          {l:"This Month",u:"month",bg:"#f5f3ff",border:"#ddd6fe",icon:"📅"},
        ].map(s=>(
          <div key={s.l} style={{background:s.bg,borderRadius:12,padding:"10px 4px",textAlign:"center",border:`1px solid ${s.border}`}}>
            <div style={{fontSize:16,marginBottom:5}}>{s.icon}</div>
            <div style={{fontSize:18,fontWeight:800,color:TP.text,lineHeight:1}}>{wb.filter(c=>c.bdayInfo.urgency===s.u).length}</div>
            <div style={{fontSize:8,color:TP.ts,marginTop:4,fontWeight:600,lineHeight:1.2}}>{s.l}</div>
          </div>
        ))}
      </div>

      <GenderFilter value={gf} onChange={setGf} counts={bc}/>
      {wb.length===0
        ?<div style={{background:TP.surface,border:"1.5px dashed #ddd6fe",borderRadius:20,padding:"36px 20px",textAlign:"center"}}>
          <div style={{fontSize:52,marginBottom:12}}>🎁</div>
          <div style={{fontSize:15,fontWeight:800,color:TP.text,marginBottom:6,letterSpacing:"-0.2px"}}>No Upcoming Birthdays</div>
          <div style={{fontSize:12,color:TP.ts,lineHeight:1.6,marginBottom:16}}>Add customer birth dates to start<br/>automatic birthday campaigns.</div>
          <div style={{display:"inline-flex",alignItems:"center",gap:6,border:"1.5px solid #ddd6fe",borderRadius:24,padding:"10px 22px",fontSize:13,fontWeight:700,color:TP.purpleMid,cursor:"pointer",background:"#fff"}}>➕ Add Birthday</div>
        </div>
        :<div style={{display:"flex",flexDirection:"column",gap:10}}>
          {wb.map(c=>{const us=US[c.bdayInfo.urgency];const isSent=sentIds.includes(c.id);const av=c.avatar||(c.name?.slice(0,2)||"??").toUpperCase();const col=c.color||TP.purpleMid;return(
            <div key={c.id} style={{background:TP.surface,border:`2px solid ${isSent?TP.gm:us.border}`,borderRadius:14,padding:"14px"}}>
              <div style={{display:"flex",alignItems:"center",gap:12,marginBottom:12}}>
                <div style={{position:"relative"}}>
                  <div style={{width:46,height:46,borderRadius:14,background:col+"22",border:`2px solid ${col}44`,display:"flex",alignItems:"center",justifyContent:"center",fontSize:15,fontWeight:900,color:col}}>{av}</div>
                  <div style={{position:"absolute",bottom:-4,right:-4,fontSize:14}}>🎂</div>
                </div>
                <div style={{flex:1}}><div style={{fontWeight:800,fontSize:14,color:TP.text}}>{c.name}</div><div style={{fontSize:11,color:TP.ts}}>{c.bdayInfo.label}</div></div>
                <div style={{background:us.bg,color:us.color,border:`1.5px solid ${us.border}`,fontSize:10,fontWeight:800,padding:"3px 9px",borderRadius:20,flexShrink:0}}>{us.badge}</div>
              </div>
              {isSent
                ?<div style={{background:TP.gl,border:`1.5px solid ${TP.gm}`,borderRadius:10,padding:"10px",textAlign:"center",fontSize:12,fontWeight:800,color:TP.gd}}>✅ Birthday wish bhej diya!</div>
                :<button onClick={()=>setWaModal({customer:c,message:bdayMsg(c)})} style={{width:"100%",padding:"11px",background:c.bdayInfo.urgency==="today"?"linear-gradient(135deg,#f59e0b,#ef4444)":TP.wa,border:"none",borderRadius:11,color:"#fff",fontFamily:"inherit",fontSize:13,fontWeight:800,cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",gap:8}}>{c.bdayInfo.urgency==="today"?"🎂 Wish Today!":"💬 Send Birthday Wish + Offer"}</button>
              }
            </div>
          );})}
        </div>
      }
      {waModal&&<WAModal title={`Birthday — ${waModal.customer.name}`} message={waModal.message} phone={waModal.customer.phone} name={waModal.customer.name} onClose={()=>{setSentIds(p=>[...p,waModal.customer.id]);setWaModal(null);}}/>}
    </div>
  );
}

function CampaignsTab({customers}){
  const [sel,setSel]=useState(null);
  const [cMsg,setCMsg]=useState("");
  const [tTag,setTTag]=useState("All");
  const [tGender,setTGender]=useState("all");
  const [lvF,setLvF]=useState(0);
  const [bulk,setBulk]=useState(null);
  const getLV=c=>daysSince(c.last_visit||c.lastVisit);
  const filtered=customers.filter(c=>tTag==="All"?true:c.tag===tTag).filter(c=>tGender==="all"?true:c.gender===tGender).filter(c=>lvF===0?true:getLV(c)>=lvF);
  const gC={all:customers.filter(c=>(tTag==="All"?true:c.tag===tTag)&&(lvF===0?true:getLV(c)>=lvF)).length,male:customers.filter(c=>(tTag==="All"?true:c.tag===tTag)&&c.gender==="male"&&(lvF===0?true:getLV(c)>=lvF)).length,female:customers.filter(c=>(tTag==="All"?true:c.tag===tTag)&&c.gender==="female"&&(lvF===0?true:getLV(c)>=lvF)).length};
  const cats=[...new Set(CAMPAIGNS.map(c=>c.category))];
  const [catFilter,setCatFilter]=useState("All");
  const allCats=["All",...new Set(CAMPAIGNS.map(c=>c.category))];
  const filteredCamps=catFilter==="All"?CAMPAIGNS:CAMPAIGNS.filter(c=>c.category===catFilter);

  return(
    <div style={{padding:"16px 16px 80px",background:TP.bg}}>
      {!sel
        ?(<>
          {/* Hero Banner */}
          <div style={{background:"linear-gradient(135deg,#f0fdf4,#d1fae5)",border:"1px solid #a7f3d0",borderRadius:20,padding:"18px",marginBottom:18,position:"relative",overflow:"hidden"}}>
            <div style={{position:"absolute",right:-4,top:"50%",transform:"translateY(-50%)",fontSize:80,opacity:0.2,pointerEvents:"none"}}>📣</div>
            <div style={{fontSize:17,fontWeight:800,color:"#064e3b",letterSpacing:"-0.3px",marginBottom:5}}>Campaign Center</div>
            <div style={{fontSize:12,color:"#065f46",lineHeight:1.6,marginBottom:14}}>Create and send WhatsApp campaigns<br/>to engage clients and boost bookings.</div>
            <div style={{background:"#5b3fc4",color:"#fff",borderRadius:24,padding:"9px 20px",fontSize:12,fontWeight:700,display:"inline-flex",alignItems:"center",gap:6,cursor:"pointer",boxShadow:"0 4px 12px rgba(91,63,196,0.3)"}}>New Campaign +</div>
          </div>

          {/* Category filter */}
          <div style={{fontSize:14,fontWeight:800,color:TP.text,marginBottom:10,letterSpacing:"-0.2px"}}>Campaign Categories</div>
          <div style={{display:"flex",gap:6,overflowX:"auto",paddingBottom:6,marginBottom:16,WebkitOverflowScrolling:"touch"}}>
            {allCats.map(c=>(
              <button key={c} onClick={()=>setCatFilter(c)} style={{background:catFilter===c?"#5b3fc4":"#fff",color:catFilter===c?"#fff":"#374151",border:`1.5px solid ${catFilter===c?"#5b3fc4":"#e5e7eb"}`,borderRadius:20,padding:"7px 14px",fontSize:11,fontWeight:700,cursor:"pointer",fontFamily:"inherit",whiteSpace:"nowrap",flexShrink:0}}>{c}</button>
            ))}
          </div>

          {/* Templates */}
          <div style={{fontSize:14,fontWeight:800,color:TP.text,marginBottom:10,letterSpacing:"-0.2px"}}>Ready-made Templates</div>
          <div style={{display:"flex",flexDirection:"column",gap:8}}>
            {filteredCamps.map(camp=>(
              <div key={camp.id} onClick={()=>{setSel(camp);setCMsg(camp.template);}} style={{background:TP.surface,border:"1.5px solid #f1f0f5",borderRadius:16,padding:"14px",cursor:"pointer",display:"flex",alignItems:"center",gap:12,boxShadow:"0 1px 4px rgba(0,0,0,0.04)"}}>
                <div style={{width:48,height:48,borderRadius:14,background:camp.colorLight,border:`1px solid ${camp.colorBorder}`,display:"flex",alignItems:"center",justifyContent:"center",fontSize:22,flexShrink:0}}>{camp.icon}</div>
                <div style={{flex:1,minWidth:0}}>
                  <div style={{fontWeight:800,fontSize:13,color:TP.text,letterSpacing:"-0.2px"}}>{camp.name}</div>
                  <div style={{fontSize:11,color:TP.ts,marginTop:3,lineHeight:1.4}}>{camp.desc}</div>
                  <div style={{fontSize:10,color:TP.purpleMid,fontWeight:700,marginTop:5}}>Reach: {customers.length} Clients</div>
                </div>
                <div style={{background:"#f5f3ff",border:"1.5px solid #ddd6fe",borderRadius:10,padding:"7px 10px",fontSize:11,fontWeight:700,color:"#5b3fc4",flexShrink:0}}>Use ›</div>
              </div>
            ))}
          </div>

          {/* Custom */}
          <div style={{background:TP.surface,border:"2px dashed #ddd6fe",borderRadius:18,padding:"24px 20px",textAlign:"center",marginTop:12}}>
            <div style={{width:48,height:48,borderRadius:14,background:"#f5f3ff",display:"flex",alignItems:"center",justifyContent:"center",fontSize:22,margin:"0 auto 12px"}}>✍️</div>
            <div style={{fontSize:14,fontWeight:800,color:TP.text,marginBottom:4,letterSpacing:"-0.2px"}}>Write Your Own</div>
            <div style={{fontSize:11,color:TP.ts,marginBottom:16,lineHeight:1.5}}>Create a custom message for any occasion</div>
            <button onClick={()=>{const d=`🙏 *Hello {name}!*\n\n[Your message here]\n\n📅 Reply *BOOK*\n\n_See you soon! 💈_`;setSel({id:"custom",name:"Custom Campaign",icon:"✍️",color:TP.purpleMid,colorLight:TP.purpleLight,colorBorder:TP.border,template:d,desc:"Custom"});setCMsg(d);}} style={{background:"linear-gradient(135deg,#3d2490,#5b3fc4)",color:"#fff",border:"none",borderRadius:14,padding:"12px 28px",fontSize:13,fontWeight:700,cursor:"pointer",fontFamily:"inherit",letterSpacing:"-0.1px"}}>✍️ Write Custom Message</button>
          </div>
        </>)
        :(<>
          <button onClick={()=>setSel(null)} style={{display:"flex",alignItems:"center",gap:6,background:"none",border:`1.5px solid ${TP.border}`,borderRadius:10,padding:"7px 12px",fontFamily:"inherit",fontSize:12,fontWeight:700,color:TP.ts,cursor:"pointer",marginBottom:16}}>← Back</button>
          <div style={{background:sel.colorLight,border:`2px solid ${sel.colorBorder}`,borderRadius:14,padding:"14px",marginBottom:16,display:"flex",alignItems:"center",gap:12}}>
            <div style={{fontSize:28}}>{sel.icon}</div>
            <div><div style={{fontWeight:900,fontSize:15,color:TP.text}}>{sel.name}</div><div style={{fontSize:12,color:TP.ts,marginTop:2}}>{sel.desc}</div></div>
          </div>
          <div style={{marginBottom:16}}>
            <div style={{fontSize:10,fontWeight:800,color:TP.tf,letterSpacing:1.2,textTransform:"uppercase",marginBottom:10}}>Target Audience</div>
            <div style={{display:"flex",gap:7,marginBottom:8}}>
              {["All","VIP","Regular","New"].map(opt=>(
                <button key={opt} onClick={()=>setTTag(opt)} style={{flex:1,padding:"9px 4px",borderRadius:10,border:`2px solid ${tTag===opt?TP.purpleMid:TP.border}`,background:tTag===opt?TP.purpleLight:TP.surface,color:tTag===opt?TP.purpleMid:TP.ts,fontSize:12,fontWeight:800,cursor:"pointer",fontFamily:"inherit"}}>
                  {opt}<br/><span style={{fontSize:10}}>{opt==="All"?customers.length:customers.filter(c=>c.tag===opt).length} log</span>
                </button>
              ))}
            </div>
            <GenderFilter value={tGender} onChange={setTGender} counts={gC}/>
          </div>
          <LVFilter value={lvF} onChange={setLvF} total={customers.filter(c=>(tTag==="All"?true:c.tag===tTag)&&(tGender==="all"?true:c.gender===tGender)).length} match={filtered.length}/>
          {sel.id==="custom"&&<div style={{marginBottom:16}}><div style={{fontSize:10,fontWeight:800,color:TP.tf,letterSpacing:1.2,textTransform:"uppercase",marginBottom:10}}>Campaign Name</div><input value={sel.name==="Custom Campaign"?"":sel.name} onChange={e=>setSel(s=>({...s,name:e.target.value||"Custom Campaign"}))} placeholder="e.g. Holi Offer…" style={IS} onFocus={e=>e.target.style.borderColor=TP.purpleMid} onBlur={e=>e.target.style.borderColor=TP.border}/></div>}
          <div style={{marginBottom:16}}>
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:8}}>
              <div style={{fontSize:10,fontWeight:800,color:TP.tf,letterSpacing:1.2,textTransform:"uppercase"}}>Message</div>
              <div style={{fontSize:11,color:TP.ts}}><span style={{color:TP.purpleMid,fontWeight:700}}>{"{name}"}</span> → replace</div>
            </div>
            <textarea value={cMsg||sel.template} onChange={e=>setCMsg(e.target.value)} rows={10} style={{...IS,resize:"vertical",lineHeight:1.7,fontSize:13,padding:"12px"}} onFocus={e=>e.target.style.borderColor=TP.purpleMid} onBlur={e=>e.target.style.borderColor=TP.border}/>
          </div>
          <div style={{marginBottom:16}}>
            <div style={{fontSize:10,fontWeight:800,color:TP.tf,letterSpacing:1.2,textTransform:"uppercase",marginBottom:10}}>Preview</div>
            <div style={{background:"#e5ddd5",borderRadius:14,padding:14}}>
              <div style={{background:"#fff",borderRadius:"10px 10px 10px 3px",padding:"10px 12px",maxWidth:"90%"}}>
                <pre style={{margin:0,fontFamily:"inherit",fontSize:11,lineHeight:1.7,color:TP.text,whiteSpace:"pre-wrap",wordBreak:"break-word"}}>{(cMsg||sel.template).replace(/{name}/g,customers[0]?.name||"Customer")}</pre>
              </div>
            </div>
          </div>
          <div style={{background:TP.surface,border:`2px solid ${TP.border}`,borderRadius:14,padding:"14px"}}>
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:12}}>
              <div style={{fontWeight:800,fontSize:13,color:TP.text}}>{filtered.length} customers milenge</div>
              <div style={{fontSize:11,color:TP.ts}}>{tTag}</div>
            </div>
            <button onClick={()=>setBulk(true)} style={{width:"100%",padding:"13px",background:TP.wa,border:"none",borderRadius:12,color:"#fff",fontFamily:"inherit",fontSize:14,fontWeight:800,cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",gap:8}}>💬 Directly Send — {filtered.length} customers</button>
          </div>
        </>)
      }
      {bulk&&<BulkSendModal customers={filtered} template={cMsg||sel?.template||""} title={sel?.name||"Campaign"} onClose={()=>setBulk(null)}/>}
    </div>
  );
}

// ─── Main Export ──────────────────────────────────────────────────────────────
export default function EngagementCenter({currentUser}){
  const [tab,setTab]=useState("reengagement");
  const [customers,setCustomers]=useState([]);
  const [loading,setLoading]=useState(true);

  useEffect(()=>{
    async function load(){
      if(!currentUser?.id){setLoading(false);return;}
      const salonId=currentUser.salon_id||currentUser.id;
      const{data}=await supabase.from("customers").select("*").eq("salon_id",salonId).order("created_at",{ascending:false});
      if(data){setCustomers(data.map(c=>({...c,avatar:(c.name?.slice(0,2)||"??").toUpperCase(),color:[TP.purpleMid,"#3b82f6","#16a34a","#f59e0b","#14b8a6","#ec4899"][Math.floor(Math.random()*6)]})));}
      setLoading(false);
    }
    load();
  },[currentUser?.id]);

  const lostCount=customers.filter(c=>daysSince(c.last_visit||c.lastVisit)>=30).length;
  const bdayCount=customers.filter(c=>getBirthdayInfo(c.dob||c.birthday)).length;

  const TABS=[
    {id:"reengagement",label:"Re-engage",icon:"💫"},
    {id:"birthday",label:"Birthdays",icon:"🎂"},
    {id:"campaigns",label:"Campaigns",icon:"📢"},
  ];

  if(loading){
    return(
      <div style={{height:"100%",display:"flex",alignItems:"center",justifyContent:"center",background:TP.bg}}>
        <div style={{textAlign:"center"}}>
          <div style={{fontSize:32,marginBottom:12}}>💫</div>
          <div style={{fontSize:14,color:TP.ts,fontWeight:700}}>Loading...</div>
        </div>
      </div>
    );
  }

  return(
    <div style={{height:"100%",display:"flex",flexDirection:"column",fontFamily:"-apple-system,'SF Pro Display',system-ui,sans-serif",color:TP.text,background:TP.bg,overflow:"hidden"}}>
      {/* Header */}
      <div style={{background:"#fff",padding:"14px 18px 12px",display:"flex",alignItems:"center",justifyContent:"space-between",borderBottom:"1px solid #f1f0f5",flexShrink:0}}>
        <div>
          <div style={{fontWeight:800,fontSize:16,color:"#0f0a2e",letterSpacing:"-0.3px"}}>Engagement</div>
          <div style={{fontSize:11,color:"#9b8ec4",marginTop:2,fontWeight:500}}>Campaigns & Re-engage</div>
        </div>
        <div style={{display:"flex",gap:6,alignItems:"center"}}>
          {lostCount>0&&<div style={{background:"#fef9c3",color:"#a16207",fontSize:10,fontWeight:700,padding:"4px 10px",borderRadius:20,border:"1px solid #fde68a"}}>{lostCount} inactive</div>}
          {bdayCount>0&&<div style={{background:"#fff5f5",color:"#dc2626",fontSize:10,fontWeight:700,padding:"4px 10px",borderRadius:20,border:"1px solid #fca5a5"}}>{bdayCount} bdays</div>}
        </div>
      </div>

      {/* Premium Tab bar */}
      <div style={{background:"#fff",borderBottom:"1px solid #f1f0f5",display:"flex",padding:"0 8px",flexShrink:0}}>
        {TABS.map(t=>(
          <div key={t.id} onClick={()=>setTab(t.id)} style={{flex:1,padding:"11px 4px 9px",display:"flex",flexDirection:"column",alignItems:"center",gap:4,cursor:"pointer",borderBottom:`2.5px solid ${tab===t.id?"#5b3fc4":"transparent"}`,transition:"all 0.2s"}}>
            <span style={{fontSize:18}}>{t.icon}</span>
            <span style={{fontSize:11,fontWeight:tab===t.id?800:600,color:tab===t.id?"#5b3fc4":"#9ca3af",letterSpacing:"-0.1px"}}>{t.label}</span>
            {t.id==="reengagement"&&lostCount>0&&<span style={{fontSize:8,background:"#fef9c3",color:"#a16207",padding:"1px 6px",borderRadius:20,fontWeight:800,marginTop:-2}}>{lostCount}</span>}
            {t.id==="birthday"&&bdayCount>0&&<span style={{fontSize:8,background:"#fff5f5",color:"#dc2626",padding:"1px 6px",borderRadius:20,fontWeight:800,marginTop:-2}}>{bdayCount}</span>}
          </div>
        ))}
      </div>

      {/* Content */}
      <div style={{flex:1,overflowY:"auto",WebkitOverflowScrolling:"touch"}}>
        {tab==="reengagement"&&<ReengagementTab customers={customers}/>}
        {tab==="birthday"&&<BirthdayTab customers={customers}/>}
        {tab==="campaigns"&&<CampaignsTab customers={customers}/>}
      </div>
    </div>
  );
}
 