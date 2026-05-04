import { useState, useEffect } from "react";
import { supabase } from "../lib/supabase";

const T={bg:"#f0f4f8",surface:"#fff",border:"#e8edf3",green:"#22c55e",gl:"#e8fdf0",gm:"#bbf7d0",gd:"#16a34a",text:"#1a1a2e",tm:"#555",ts:"#888",tf:"#aaa",tg:"#ccc",yellow:"#fef9c3",yb:"#fde68a",yt:"#a16207",blue:"#eff6ff",bb:"#93c5fd",bt:"#2563eb",red:"#fff0f0",rb:"#fca5a5",rt:"#dc2626",orange:"#fff7ed",ob:"#fed7aa",ot:"#ea580c",purple:"#faf5ff",pb:"#d8b4fe",pt:"#7c3aed",sub:"#f8fafc",inp:"#fafbfc",wa:"#25d366"};
const IS={width:"100%",padding:"11px 13px",border:`2px solid ${T.border}`,borderRadius:11,fontSize:14,fontFamily:"inherit",outline:"none",background:T.inp,boxSizing:"border-box",color:T.text};

const CAMPAIGNS=[
  {id:"diwali",icon:"🪔",name:"Diwali Special",category:"Festival",color:"#f59e0b",colorLight:"#fff7ed",colorBorder:"#fed7aa",desc:"Diwali se pehle salon full rehta hai",template:`🪔 *Diwali Mubarak, {name}!*\n\n✨ *Diwali Special*\n💇 Haircut + Blowdry — ₹299\n💄 Bridal Makeup — 20% OFF\n\n📅 Reply *BOOK*\n\n_Happy Diwali! 💈_`},
  {id:"eid",icon:"🌙",name:"Eid Mubarak",category:"Festival",color:"#7c3aed",colorLight:"#faf5ff",colorBorder:"#d8b4fe",desc:"Eid pe special grooming offer",template:`🌙 *Eid Mubarak, {name}!*\n\n✨ *Eid Special*\n✂️ Haircut + Beard — ₹349\n\nReply *EID*\n\n_Eid Mubarak! 💈_`},
  {id:"newyear",icon:"🎆",name:"New Year Offer",category:"Festival",color:"#2563eb",colorLight:"#eff6ff",colorBorder:"#93c5fd",desc:"Naye saal mein naya look",template:`🎆 *Happy New Year, {name}!*\n\n🎁 Any Haircut — 25% OFF!\n\n_Naya Saal, Naya Look! 💈_`},
  {id:"monsoon",icon:"🌧️",name:"Monsoon Hair Care",category:"Seasonal",color:"#0891b2",colorLight:"#ecfeff",colorBorder:"#a5f3fc",desc:"Monsoon mein hair care tips + offer",template:`🌧️ *Monsoon Alert, {name}!*\n\n✨ Anti-Dandruff Treatment — ₹299\n💆 Deep Conditioning — ₹499\n\nReply *MONSOON*\n\n_Take care! 💈_`},
  {id:"referral",icon:"🤝",name:"Refer & Earn",category:"Growth",color:"#16a34a",colorLight:"#e8fdf0",colorBorder:"#bbf7d0",desc:"Existing customers se referral",template:`🤝 *{name} bhai/didi, ek kaam karo!*\n\nApne dost ko refer karo → Dono ko ₹100 OFF!\n\n_Thank you! 💈_`},
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

const US={today:{bg:"#fff0f0",border:T.rb,color:T.rt,badge:"🔴 Aaj!"},soon:{bg:T.yellow,border:T.yb,color:T.yt,badge:"🟡 Jaldi!"},week:{bg:T.gl,border:T.gm,color:T.gd,badge:"🟢 Is Hafte"},month:{bg:T.sub,border:T.border,color:T.ts,badge:"📅 Is Mahine"},passed:{bg:T.sub,border:T.border,color:T.tf,badge:"✓ Gaya"}};

const SL=({children,color})=><div style={{fontSize:10,fontWeight:800,color:color||T.tf,letterSpacing:1.2,textTransform:"uppercase",marginBottom:10}}>{children}</div>;

function GenderFilter({value,onChange,counts}){
  return(<div style={{display:"flex",gap:6,marginBottom:10}}>{[{id:"all",label:"👥 All",count:counts.all},{id:"male",label:"👨 Male",count:counts.male},{id:"female",label:"👩 Female",count:counts.female}].map(o=>(<button key={o.id} onClick={()=>onChange(o.id)} style={{flex:1,padding:"8px 4px",borderRadius:20,border:`2px solid ${value===o.id?T.green:T.border}`,background:value===o.id?T.green:T.surface,color:value===o.id?"#fff":T.ts,fontSize:11,fontWeight:800,cursor:"pointer",fontFamily:"inherit",textAlign:"center"}}>{o.label}<br/><span style={{fontSize:10,opacity:0.85}}>({o.count})</span></button>))}</div>);
}

function LVFilter({value,onChange,total,match}){
  return(<div style={{background:T.sub,border:"2px solid #e8edf3",borderRadius:12,padding:"12px 14px",marginBottom:12}}>
    <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:10}}><div style={{fontSize:12,fontWeight:800,color:"#555"}}>📅 Last Visit Filter</div><div style={{fontSize:10,color:"#888"}}>{value===0?`Sabko (${total})`:`${match}/${total}`}</div></div>
    <div style={{display:"flex",alignItems:"center",gap:10,marginBottom:value>0?10:0}}>
      <div style={{flex:1,position:"relative"}}><input type="number" min={0} max={365} value={value===0?"":value} onChange={e=>onChange(parseInt(e.target.value)||0)} placeholder="0 = sabko" style={{width:"100%",padding:"10px 44px 10px 13px",border:"2px solid #e8edf3",borderRadius:10,fontSize:15,fontWeight:800,fontFamily:"inherit",outline:"none",boxSizing:"border-box",background:"#fff",color:"#1a1a2e"}} onFocus={e=>e.target.style.borderColor="#22c55e"} onBlur={e=>e.target.style.borderColor="#e8edf3"}/><div style={{position:"absolute",right:12,top:"50%",transform:"translateY(-50%)",fontSize:12,fontWeight:700,color:"#888"}}>din</div></div>
      {value>0&&<button onClick={()=>onChange(0)} style={{padding:"10px 14px",background:"#fff",border:"2px solid #e8edf3",borderRadius:10,fontSize:12,fontWeight:700,color:"#888",cursor:"pointer",fontFamily:"inherit",flexShrink:0}}>✕</button>}
    </div>
    {value>0&&<div style={{background:match>0?"#e8fdf0":"#fff0f0",border:`1.5px solid ${match>0?"#bbf7d0":"#fca5a5"}`,borderRadius:8,padding:"7px 10px",fontSize:11,fontWeight:700,color:match>0?"#16a34a":"#dc2626"}}>{match>0?`✅ ${match} customers — ${value}+ din absent`:`❌ Koi nahi mila`}</div>}
  </div>);
}

function WAModal({title,message,phone,name,onClose}){
  const [sent,setSent]=useState(false);
  const [edit,setEdit]=useState(false);
  const [msg,setMsg]=useState(message.replace(/{name}/g,name));
  return(<div onClick={onClose} style={{position:"fixed",inset:0,background:"rgba(0,0,0,0.5)",zIndex:800,display:"flex",alignItems:"flex-end"}}><div onClick={e=>e.stopPropagation()} style={{background:T.surface,borderRadius:"20px 20px 0 0",padding:"20px 18px 36px",width:"100%",maxHeight:"90vh",overflowY:"auto"}}>
    <div style={{width:36,height:4,background:T.border,borderRadius:2,margin:"0 auto 18px"}}/>
    <div style={{display:"flex",alignItems:"center",gap:10,marginBottom:16}}><div style={{width:42,height:42,borderRadius:12,background:"#e7fce8",border:"2px solid #a7f3c0",display:"flex",alignItems:"center",justifyContent:"center",fontSize:20}}>💬</div><div style={{flex:1}}><div style={{fontWeight:900,fontSize:15}}>{title}</div><div style={{fontSize:12,color:T.ts}}>+91 {phone}</div></div>{!sent&&<button onClick={()=>setEdit(e=>!e)} style={{padding:"6px 12px",background:edit?T.green:T.sub,border:`1.5px solid ${edit?T.gm:T.border}`,borderRadius:20,fontSize:11,fontWeight:800,color:edit?"#fff":T.ts,cursor:"pointer",fontFamily:"inherit"}}>{edit?"✓ Done":"✏️ Edit"}</button>}</div>
    {edit?(<div style={{marginBottom:16}}><textarea value={msg} onChange={e=>setMsg(e.target.value)} rows={10} autoFocus style={{...IS,resize:"vertical",lineHeight:1.7,fontSize:13,padding:"12px",borderColor:T.green,marginBottom:8}}/><button onClick={()=>setEdit(false)} style={{padding:"6px 14px",background:T.green,border:"none",borderRadius:9,fontSize:11,fontWeight:800,color:"#fff",cursor:"pointer",fontFamily:"inherit"}}>✓ Done</button></div>):(<div style={{background:"#e5ddd5",borderRadius:14,padding:14,marginBottom:16}}><div style={{background:"#fff",borderRadius:"12px 12px 12px 3px",padding:"12px 14px",maxWidth:"90%"}}><pre style={{margin:0,fontFamily:"inherit",fontSize:12,lineHeight:1.7,color:T.text,whiteSpace:"pre-wrap",wordBreak:"break-word"}}>{msg}</pre></div></div>)}
    {!sent?(<div style={{display:"flex",gap:10}}><button onClick={onClose} style={{flex:1,padding:13,border:`2px solid ${T.border}`,borderRadius:12,background:T.surface,fontFamily:"inherit",fontSize:13,fontWeight:700,cursor:"pointer"}}>Cancel</button><a href={`https://wa.me/${phone}?text=${encodeURIComponent(msg)}`} target="_blank" rel="noreferrer" onClick={()=>setSent(true)} style={{flex:2,padding:13,background:T.wa,border:"none",borderRadius:12,color:"#fff",fontFamily:"inherit",fontSize:14,fontWeight:800,cursor:"pointer",textDecoration:"none",display:"flex",alignItems:"center",justifyContent:"center",gap:8}}>💬 Send on WhatsApp</a></div>):(<div style={{background:T.gl,border:`2px solid ${T.gm}`,borderRadius:12,padding:14,textAlign:"center",fontWeight:800,color:T.gd}}>✅ WhatsApp opened!</div>)}
  </div></div>);
}

function BulkSendModal({customers,template,title,onClose}){
  const [phase,setPhase]=useState("select");
  const [sel,setSel]=useState(customers.map(c=>c.id));
  const [sent,setSent]=useState([]);
  const [cur,setCur]=useState(0);
  const [tpl,setTpl]=useState(template);
  const [edit,setEdit]=useState(false);
  const sc=customers.filter(c=>sel.includes(c.id));
  const allSel=sel.length===customers.length;
  const done=phase==="sending"&&sent.length===sc.length&&sc.length>0;
  function sendNext(){if(cur>=sc.length)return;const c=sc[cur];window.open(`https://wa.me/${c.phone}?text=${encodeURIComponent(tpl.replace(/{name}/g,c.name))}`,"_blank");setSent(p=>[...p,c.id]);setCur(p=>p+1);}
  return(<div onClick={onClose} style={{position:"fixed",inset:0,background:"rgba(0,0,0,0.5)",zIndex:800,display:"flex",alignItems:"flex-end"}}><div onClick={e=>e.stopPropagation()} style={{background:T.surface,borderRadius:"20px 20px 0 0",padding:"20px 18px 36px",width:"100%",maxHeight:"92vh",overflowY:"auto"}}>
    <div style={{width:36,height:4,background:T.border,borderRadius:2,margin:"0 auto 18px"}}/>
    <div style={{fontWeight:900,fontSize:16,marginBottom:2}}>📤 {title}</div>
    <div style={{fontSize:12,color:T.ts,marginBottom:16}}>{phase==="select"?`${customers.length} customers`:sc.length+" ko bhej rahe hain"}</div>
    {phase==="select"&&(<>
      <div style={{background:T.sub,border:`2px solid ${T.border}`,borderRadius:14,marginBottom:14,overflow:"hidden"}}>
        <div style={{padding:"11px 14px",display:"flex",alignItems:"center",justifyContent:"space-between",borderBottom:`1px solid ${T.border}`}}><div style={{fontSize:12,fontWeight:800}}>💬 Message</div><button onClick={()=>setEdit(e=>!e)} style={{padding:"4px 10px",background:edit?T.green:T.surface,border:`1.5px solid ${edit?T.gm:T.border}`,borderRadius:20,fontSize:11,fontWeight:700,color:edit?"#fff":T.ts,cursor:"pointer",fontFamily:"inherit"}}>{edit?"✓ Done":"✏️ Edit"}</button></div>
        {edit?(<div style={{padding:"12px 14px"}}><textarea value={tpl} onChange={e=>setTpl(e.target.value)} rows={8} autoFocus style={{...IS,resize:"vertical",lineHeight:1.7,fontSize:12,padding:"10px",borderColor:T.green,marginBottom:8}}/><button onClick={()=>setEdit(false)} style={{padding:"6px 12px",background:T.green,border:"none",borderRadius:9,fontSize:11,fontWeight:800,color:"#fff",cursor:"pointer",fontFamily:"inherit"}}>✓ Save</button></div>)
        :(<div style={{padding:"9px 14px",fontSize:11,color:T.ts,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{tpl.split("\n")[0].replace(/{name}/g,customers[0]?.name||"Customer")}…</div>)}
      </div>
      <div style={{background:T.sub,border:`2px solid ${T.border}`,borderRadius:12,padding:"10px 14px",marginBottom:12,display:"flex",alignItems:"center",justifyContent:"space-between"}}><div style={{fontSize:13,fontWeight:800}}>{sel.length===0?"Koi select nahi":`${sel.length} selected`}</div><button onClick={()=>setSel(allSel?[]:customers.map(c=>c.id))} style={{padding:"6px 14px",background:allSel?T.red:T.green,border:"none",borderRadius:20,color:"#fff",fontSize:11,fontWeight:800,cursor:"pointer",fontFamily:"inherit"}}>{allSel?"✕ Deselect":"✓ Select All"}</button></div>
      <div style={{marginBottom:16,background:T.surface,border:`2px solid ${T.border}`,borderRadius:14,overflow:"hidden"}}>
        {customers.map((c,i)=>{const isSel=sel.includes(c.id);const av=c.avatar||(c.name?.slice(0,2)||"??").toUpperCase();const col=c.color||"#22c55e";return(<div key={c.id} onClick={()=>setSel(p=>p.includes(c.id)?p.filter(x=>x!==c.id):[...p,c.id])} style={{display:"flex",alignItems:"center",gap:12,padding:"12px 14px",borderBottom:i<customers.length-1?`1px solid ${T.border}`:"none",background:isSel?T.gl:T.surface,cursor:"pointer"}}><div style={{width:22,height:22,borderRadius:7,flexShrink:0,background:isSel?T.green:T.surface,border:`2px solid ${isSel?T.green:T.border}`,display:"flex",alignItems:"center",justifyContent:"center",fontSize:12,color:"#fff",fontWeight:900}}>{isSel?"✓":""}</div><div style={{width:38,height:38,borderRadius:11,background:col+"22",display:"flex",alignItems:"center",justifyContent:"center",fontSize:13,fontWeight:900,color:col,flexShrink:0}}>{av}</div><div style={{flex:1}}><div style={{fontSize:13,fontWeight:800}}>{c.name}</div><div style={{fontSize:11,color:T.ts}}>+91 {c.phone}</div></div><div style={{fontSize:10,fontWeight:700,color:T.ts,background:T.sub,padding:"2px 8px",borderRadius:20,border:`1px solid ${T.border}`,flexShrink:0}}>{c.tag}</div></div>);})}
      </div>
      <div style={{display:"flex",gap:10}}><button onClick={onClose} style={{flex:1,padding:12,border:`2px solid ${T.border}`,borderRadius:12,background:T.surface,fontFamily:"inherit",fontSize:13,fontWeight:700,cursor:"pointer"}}>Cancel</button><button onClick={()=>{if(sel.length>0)setPhase("sending");}} style={{flex:2,padding:12,background:sel.length>0?T.wa:"#d1d5db",border:"none",borderRadius:12,color:"#fff",fontFamily:"inherit",fontSize:14,fontWeight:800,cursor:sel.length>0?"pointer":"not-allowed"}}>💬 Send to {sel.length} →</button></div>
    </>)}
    {phase==="sending"&&!done&&(<>
      <div style={{background:T.sub,border:`2px solid ${T.border}`,borderRadius:12,padding:"12px 14px",marginBottom:16}}><div style={{display:"flex",justifyContent:"space-between",marginBottom:8}}><span style={{fontSize:13,fontWeight:700,color:T.tm}}>Progress</span><span style={{fontSize:13,fontWeight:800,color:T.gd}}>{sent.length}/{sc.length}</span></div><div style={{height:8,borderRadius:20,background:T.border,overflow:"hidden"}}><div style={{width:`${sc.length>0?(sent.length/sc.length)*100:0}%`,height:"100%",background:T.green,borderRadius:20,transition:"width 0.3s"}}/></div></div>
      <div style={{marginBottom:16,background:T.surface,border:`2px solid ${T.border}`,borderRadius:14,overflow:"hidden"}}>{sc.map((c,i)=>{const av=c.avatar||(c.name?.slice(0,2)||"??").toUpperCase();const col=c.color||"#22c55e";return(<div key={c.id} style={{display:"flex",alignItems:"center",gap:12,padding:"12px 14px",borderBottom:i<sc.length-1?`1px solid ${T.border}`:"none",background:sent.includes(c.id)?T.gl:T.surface}}><div style={{width:38,height:38,borderRadius:11,background:col+"22",display:"flex",alignItems:"center",justifyContent:"center",fontSize:13,fontWeight:900,color:col,flexShrink:0}}>{av}</div><div style={{flex:1}}><div style={{fontSize:13,fontWeight:800}}>{c.name}</div></div>{sent.includes(c.id)?<div style={{fontSize:11,fontWeight:800,color:T.gd,background:T.gl,border:`1.5px solid ${T.gm}`,padding:"3px 10px",borderRadius:20}}>✓ Sent</div>:i===cur?<div style={{fontSize:11,fontWeight:800,color:T.yt,background:T.yellow,border:`1.5px solid ${T.yb}`,padding:"3px 10px",borderRadius:20}}>⏳ Next</div>:<div style={{fontSize:11,color:T.tf}}>Pending</div>}</div>);})}
      </div>
      <div style={{display:"flex",gap:10}}><button onClick={()=>setPhase("select")} style={{flex:1,padding:12,border:`2px solid ${T.border}`,borderRadius:12,background:T.surface,fontFamily:"inherit",fontSize:12,fontWeight:700,cursor:"pointer"}}>← Back</button><button onClick={sendNext} style={{flex:2,padding:12,background:T.wa,border:"none",borderRadius:12,color:"#fff",fontFamily:"inherit",fontSize:14,fontWeight:800,cursor:"pointer"}}>💬 Send to {sc[cur]?.name}</button></div>
    </>)}
    {done&&(<div style={{background:T.gl,border:`2px solid ${T.gm}`,borderRadius:14,padding:24,textAlign:"center"}}><div style={{fontSize:42,marginBottom:10}}>🎉</div><div style={{fontWeight:900,fontSize:16,color:T.gd,marginBottom:4}}>Sab ko bhej diya!</div><button onClick={onClose} style={{padding:"11px 32px",background:T.green,border:"none",borderRadius:12,color:"#fff",fontFamily:"inherit",fontSize:14,fontWeight:800,cursor:"pointer"}}>Done ✓</button></div>)}
  </div></div>);
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

  return(<div style={{padding:"16px 16px 80px"}}>
    <div style={{display:"flex",gap:8,marginBottom:16}}>{[{id:"inactive",label:"💤 Inactive",desc:"Jo nahi aaye"},{id:"all",label:"👥 All Clients",desc:"Broadcast karo"}].map(t=>(<div key={t.id} onClick={()=>setSub(t.id)} style={{flex:1,padding:"12px 10px",borderRadius:12,border:`2px solid ${sub===t.id?T.green:T.border}`,background:sub===t.id?T.gl:T.surface,cursor:"pointer",textAlign:"center"}}><div style={{fontSize:13,fontWeight:800,color:sub===t.id?T.gd:T.tm}}>{t.label}</div><div style={{fontSize:10,color:sub===t.id?T.gd:T.ts,marginTop:2}}>{t.desc}</div></div>))}</div>

    {sub==="inactive"&&(<>
      <GenderFilter value={gFilter} onChange={(g)=>{setGFilter(g);setSelInactive([]);}} counts={iGC}/>
      <LVFilter value={filter} onChange={(v)=>{setFilter(v);setSelInactive([]);}} total={customers.filter(c=>gFilter==="all"?true:c.gender===gFilter).length} match={customers.filter(c=>(gFilter==="all"?true:c.gender===gFilter)&&getLV(c)>=filter).length}/>
      {lost.length>0&&<div style={{background:T.sub,border:`2px solid ${T.border}`,borderRadius:12,padding:"10px 14px",marginBottom:12,display:"flex",alignItems:"center",justifyContent:"space-between"}}><div style={{fontSize:13,fontWeight:800}}>{selInactive.length===0?`${lost.length} customers`:`${selInactive.length} selected`}</div><div style={{display:"flex",gap:7}}><button onClick={()=>setSelInactive(allISel?[]:lost.map(c=>c.id))} style={{padding:"5px 12px",background:allISel?T.red:T.green,border:"none",borderRadius:20,color:"#fff",fontSize:11,fontWeight:800,cursor:"pointer",fontFamily:"inherit"}}>{allISel?"✕":"✓ Select All"}</button>{selInactive.length>0&&<button onClick={()=>setBulkModal(true)} style={{padding:"5px 12px",background:T.wa,border:"none",borderRadius:20,color:"#fff",fontSize:11,fontWeight:800,cursor:"pointer",fontFamily:"inherit"}}>💬 ({selInactive.length})</button>}</div></div>}
      {lost.length===0?(<div style={{background:T.surface,border:`2px dashed ${T.border}`,borderRadius:14,padding:"40px 20px",textAlign:"center"}}><div style={{fontSize:36,marginBottom:10}}>🎉</div><div style={{fontWeight:800,fontSize:15,color:T.tm}}>Sab active hain!</div></div>):(
        <div style={{display:"flex",flexDirection:"column",gap:10}}>
          {lost.map(c=>{
            const isSent=sentIds.includes(c.id);const isSel=selInactive.includes(c.id);
            const uC=c.days>=90?T.rt:c.days>=60?T.ot:T.yt;const uB=c.days>=90?T.red:c.days>=60?T.orange:T.yellow;
            const av=c.avatar||(c.name?.slice(0,2)||"??").toUpperCase();const col=c.color||"#22c55e";
            const reMsg=`🙏 *Namaste ${c.name}!*\n\nAapko yaad kar rahe hain hum! 😊\n\nKaafi dino se aap nahi aaye — ${c.days} din ho gaye. 💇\n\n✨ Next visit pe *15% OFF*!\n\n_Miss you! 💈_`;
            return(<div key={c.id} style={{background:T.surface,border:`2px solid ${isSel?T.green:isSent?T.gm:T.border}`,borderRadius:14,padding:"14px"}}>
              <div style={{display:"flex",alignItems:"center",gap:12,marginBottom:12}}>
                <div onClick={()=>setSelInactive(p=>p.includes(c.id)?p.filter(x=>x!==c.id):[...p,c.id])} style={{width:22,height:22,borderRadius:7,flexShrink:0,background:isSel?T.green:T.surface,border:`2px solid ${isSel?T.green:T.border}`,display:"flex",alignItems:"center",justifyContent:"center",fontSize:12,color:"#fff",fontWeight:900,cursor:"pointer"}}>{isSel?"✓":""}</div>
                <div style={{width:44,height:44,borderRadius:14,background:col+"22",border:`2px solid ${col}44`,display:"flex",alignItems:"center",justifyContent:"center",fontSize:15,fontWeight:900,color:col,flexShrink:0}}>{av}</div>
                <div style={{flex:1}}><div style={{fontWeight:800,fontSize:14}}>{c.name}</div><div style={{fontSize:11,color:T.ts}}>📱 {c.phone}</div></div>
                <div style={{background:uB,color:uC,fontSize:11,fontWeight:800,padding:"4px 10px",borderRadius:20,flexShrink:0}}>{c.days} din</div>
              </div>
              <div style={{background:T.sub,borderRadius:9,padding:"8px 12px",marginBottom:12,fontSize:12,color:T.tm}}>📅 Last visit: <strong>{c.last_visit||c.lastVisit||"—"}</strong></div>
              {isSent?(<div style={{background:T.gl,border:`1.5px solid ${T.gm}`,borderRadius:10,padding:"10px",textAlign:"center",fontSize:12,fontWeight:800,color:T.gd}}>✅ Message bhej diya!</div>):(<button onClick={()=>setWaModal({customer:c,message:reMsg})} style={{width:"100%",padding:"11px",background:T.wa,border:"none",borderRadius:11,color:"#fff",fontFamily:"inherit",fontSize:13,fontWeight:800,cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",gap:8}}>💬 Wapas bulao</button>)}
            </div>);
          })}
        </div>
      )}
    </>)}

    {sub==="all"&&(<>
      <div style={{background:T.surface,border:`2px solid ${editMsg?T.green:T.border}`,borderRadius:14,marginBottom:14,overflow:"hidden"}}>
        <div style={{padding:"11px 14px",display:"flex",alignItems:"center",justifyContent:"space-between",borderBottom:`1px solid ${T.border}`,background:T.sub}}><div style={{fontSize:12,fontWeight:800}}>📝 Broadcast Message</div><button onClick={()=>setEditMsg(e=>!e)} style={{padding:"5px 12px",background:editMsg?T.green:T.surface,border:`1.5px solid ${editMsg?T.gm:T.border}`,borderRadius:20,fontSize:11,fontWeight:800,color:editMsg?"#fff":T.ts,cursor:"pointer",fontFamily:"inherit"}}>{editMsg?"✓ Done":"✏️ Edit"}</button></div>
        {editMsg?(<div style={{padding:"12px 14px"}}><textarea value={msg} onChange={e=>setMsg(e.target.value)} rows={8} autoFocus style={{...IS,resize:"vertical",lineHeight:1.7,fontSize:12,padding:"10px",borderColor:T.green,marginBottom:8}}/><button onClick={()=>setEditMsg(false)} style={{padding:"6px 14px",background:T.green,border:"none",borderRadius:9,fontSize:11,fontWeight:800,color:"#fff",cursor:"pointer",fontFamily:"inherit"}}>✓ Save</button></div>)
        :(<div style={{padding:"9px 14px"}}><pre style={{margin:0,fontFamily:"inherit",fontSize:11,lineHeight:1.7,color:T.tm,whiteSpace:"pre-wrap",wordBreak:"break-word",maxHeight:70,overflow:"hidden"}}>{msg.replace(/{name}/g,customers[0]?.name||"Customer")}</pre></div>)}
      </div>
      <GenderFilter value={aGender} onChange={(g)=>{setAGender(g);setSelAll([]);}} counts={aGC}/>
      <LVFilter value={lvFilter} onChange={(v)=>{setLvFilter(v);setSelAll([]);}} total={customers.filter(c=>(tagFilter==="All"?true:c.tag===tagFilter)&&(aGender==="all"?true:c.gender===aGender)).length} match={filtAll.length}/>
      <div style={{display:"flex",gap:6,marginBottom:8}}>{["All","VIP","Regular","New"].map(f=>(<button key={f} onClick={()=>{setTagFilter(f);setSelAll([]);}} style={{padding:"5px 10px",borderRadius:20,border:`2px solid ${tagFilter===f?T.green:T.border}`,background:tagFilter===f?T.green:T.surface,color:tagFilter===f?"#fff":T.ts,fontSize:11,fontWeight:800,cursor:"pointer",fontFamily:"inherit",flexShrink:0}}>{f}</button>))}</div>
      <div style={{position:"relative",marginBottom:10}}><span style={{position:"absolute",left:11,top:"50%",transform:"translateY(-50%)",fontSize:13,color:T.tf}}>🔍</span><input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Search…" style={{...IS,padding:"9px 12px 9px 32px",fontSize:13}} onFocus={e=>e.target.style.borderColor=T.green} onBlur={e=>e.target.style.borderColor=T.border}/></div>
      <div style={{background:T.sub,border:`2px solid ${T.border}`,borderRadius:12,padding:"10px 14px",marginBottom:12,display:"flex",alignItems:"center",justifyContent:"space-between"}}><div style={{fontSize:13,fontWeight:800}}>{selAll.length===0?`${filtAll.length} customers`:`${selAll.length} selected`}</div><div style={{display:"flex",gap:7}}><button onClick={()=>setSelAll(allASel?[]:filtAll.map(c=>c.id))} style={{padding:"5px 12px",background:allASel?T.red:T.green,border:"none",borderRadius:20,color:"#fff",fontSize:11,fontWeight:800,cursor:"pointer",fontFamily:"inherit"}}>{allASel?"✕":"✓ Select All"}</button>{selAll.length>0&&<button onClick={()=>setAllBulk(true)} style={{padding:"5px 12px",background:T.wa,border:"none",borderRadius:20,color:"#fff",fontSize:11,fontWeight:800,cursor:"pointer",fontFamily:"inherit"}}>💬 ({selAll.length})</button>}</div></div>
      <div style={{background:T.surface,border:`2px solid ${T.border}`,borderRadius:14,overflow:"hidden"}}>
        {filtAll.map((c,i)=>{const isSel=selAll.includes(c.id);const av=c.avatar||(c.name?.slice(0,2)||"??").toUpperCase();const col=c.color||"#22c55e";return(<div key={c.id} onClick={()=>setSelAll(p=>p.includes(c.id)?p.filter(x=>x!==c.id):[...p,c.id])} style={{display:"flex",alignItems:"center",gap:12,padding:"12px 14px",borderBottom:i<filtAll.length-1?`1px solid ${T.border}`:"none",background:isSel?T.gl:T.surface,cursor:"pointer"}}>
          <div style={{width:22,height:22,borderRadius:7,flexShrink:0,background:isSel?T.green:T.surface,border:`2px solid ${isSel?T.green:T.border}`,display:"flex",alignItems:"center",justifyContent:"center",fontSize:12,color:"#fff",fontWeight:900}}>{isSel?"✓":""}</div>
          <div style={{width:40,height:40,borderRadius:12,background:col+"22",display:"flex",alignItems:"center",justifyContent:"center",fontSize:14,fontWeight:900,color:col,flexShrink:0}}>{av}</div>
          <div style={{flex:1}}><div style={{fontSize:13,fontWeight:800}}>{c.name}</div><div style={{fontSize:11,color:T.ts}}>📅 {c.last_visit||c.lastVisit||"—"}</div></div>
          <div style={{display:"flex",alignItems:"center",gap:6}}>
            <div style={{fontSize:10,fontWeight:700,color:T.ts,background:T.sub,padding:"2px 7px",borderRadius:20,border:`1px solid ${T.border}`,flexShrink:0}}>{c.tag}</div>
            <div onClick={e=>{e.stopPropagation();setWaModal({customer:c,message:msg.replace(/{name}/g,c.name)});}} style={{width:32,height:32,background:T.wa,borderRadius:9,display:"flex",alignItems:"center",justifyContent:"center",fontSize:14,cursor:"pointer",flexShrink:0}}>💬</div>
          </div>
        </div>);})}
      </div>
    </>)}

    {waModal&&<WAModal title={waModal.customer.name} message={waModal.message} phone={waModal.customer.phone} name={waModal.customer.name} onClose={()=>{setSentIds(p=>[...p,waModal.customer.id]);setWaModal(null);}}/>}
    {bulkModal&&<BulkSendModal customers={lost.filter(c=>selInactive.includes(c.id))} template={bulkTpl} title="Re-engagement" onClose={()=>setBulkModal(null)}/>}
    {allBulk&&<BulkSendModal customers={filtAll.filter(c=>selAll.includes(c.id))} template={msg} title="Broadcast" onClose={()=>setAllBulk(false)}/>}
  </div>);
}

function BirthdayTab({customers}){
  const [waModal,setWaModal]=useState(null);
  const [sentIds,setSentIds]=useState([]);
  const [gf,setGf]=useState("all");
  const wb=customers.map(c=>({...c,bdayInfo:getBirthdayInfo(c.dob||c.birthday)})).filter(c=>c.bdayInfo).filter(c=>gf==="all"?true:c.gender===gf).sort((a,b)=>a.bdayInfo.diff-b.bdayInfo.diff);
  const bc={all:customers.filter(c=>getBirthdayInfo(c.dob||c.birthday)).length,male:customers.filter(c=>getBirthdayInfo(c.dob||c.birthday)&&c.gender==="male").length,female:customers.filter(c=>getBirthdayInfo(c.dob||c.birthday)&&c.gender==="female").length};
  function bdayMsg(c){if(c.bdayInfo.urgency==="passed")return `🎂 *Belated Birthday, ${c.name}!*\n\nThodi der se sahi, par dil se! 🙏\n\n🎁 Next visit pe *20% OFF*!\n\n_With love! 💈_`;return `🎂 *Happy Birthday, ${c.name}!* 🎉\n\nAaj ka din aapka hai! 🥳\n\n🎁 Free Haircut OR 25% OFF!\nSirf birthday month mein!\n\nReply *BDAY*\n\n_Khush raho! 💈_`;}
  return(<div style={{padding:"16px 16px 80px"}}>
    <GenderFilter value={gf} onChange={setGf} counts={bc}/>
    <div style={{background:"linear-gradient(135deg,#fef9c3,#fef3c7)",border:`2px solid ${T.yb}`,borderRadius:14,padding:"16px",marginBottom:16}}>
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:10}}><div style={{fontWeight:900,fontSize:15,color:T.yt}}>🎂 Birthday Calendar</div><div style={{background:T.yt,color:"#fff",fontSize:11,fontWeight:800,padding:"3px 10px",borderRadius:20}}>{wb.length} upcoming</div></div>
      <div style={{display:"flex",gap:8}}>{[{l:"Aaj",u:"today",c:T.rt},{l:"3 Din",u:"soon",c:T.ot},{l:"Is Hafte",u:"week",c:T.gd},{l:"Is Mahine",u:"month",c:T.bt}].map(s=>(<div key={s.l} style={{flex:1,background:"rgba(255,255,255,0.7)",borderRadius:10,padding:"8px 4px",textAlign:"center"}}><div style={{fontWeight:900,fontSize:18,color:s.c}}>{wb.filter(c=>c.bdayInfo.urgency===s.u).length}</div><div style={{fontSize:9,color:T.yt,fontWeight:700,marginTop:2}}>{s.l}</div></div>))}</div>
    </div>
    {wb.length===0?(<div style={{background:T.surface,border:`2px dashed ${T.border}`,borderRadius:14,padding:"40px 20px",textAlign:"center"}}><div style={{fontSize:36,marginBottom:10}}>🎂</div><div style={{fontWeight:800,fontSize:15,color:T.tm}}>Abhi koi birthday nahi</div><div style={{fontSize:12,color:T.ts,marginTop:4}}>Customers ka DOB add karo</div></div>):(
      <div style={{display:"flex",flexDirection:"column",gap:10}}>
        {wb.map(c=>{const us=US[c.bdayInfo.urgency];const isSent=sentIds.includes(c.id);const av=c.avatar||(c.name?.slice(0,2)||"??").toUpperCase();const col=c.color||"#22c55e";return(<div key={c.id} style={{background:T.surface,border:`2px solid ${isSent?T.gm:us.border}`,borderRadius:14,padding:"14px"}}>
          <div style={{display:"flex",alignItems:"center",gap:12,marginBottom:12}}>
            <div style={{position:"relative"}}><div style={{width:46,height:46,borderRadius:14,background:col+"22",border:`2px solid ${col}44`,display:"flex",alignItems:"center",justifyContent:"center",fontSize:15,fontWeight:900,color:col}}>{av}</div><div style={{position:"absolute",bottom:-4,right:-4,fontSize:14}}>🎂</div></div>
            <div style={{flex:1}}><div style={{fontWeight:800,fontSize:14}}>{c.name}</div><div style={{fontSize:11,color:T.ts}}>{c.bdayInfo.label}</div></div>
            <div style={{background:us.bg,color:us.color,border:`1.5px solid ${us.border}`,fontSize:10,fontWeight:800,padding:"3px 9px",borderRadius:20,flexShrink:0}}>{us.badge}</div>
          </div>
          {isSent?(<div style={{background:T.gl,border:`1.5px solid ${T.gm}`,borderRadius:10,padding:"10px",textAlign:"center",fontSize:12,fontWeight:800,color:T.gd}}>✅ Birthday wish bhej diya!</div>):(<button onClick={()=>setWaModal({customer:c,message:bdayMsg(c)})} style={{width:"100%",padding:"11px",background:c.bdayInfo.urgency==="today"?"linear-gradient(135deg,#f59e0b,#ef4444)":T.wa,border:"none",borderRadius:11,color:"#fff",fontFamily:"inherit",fontSize:13,fontWeight:800,cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",gap:8}}>{c.bdayInfo.urgency==="today"?"🎂 Aaj ZAROOR Wish Karo!":"💬 Birthday Wish + Offer Bhejo"}</button>)}
        </div>);})}
      </div>
    )}
    {waModal&&<WAModal title={`Birthday — ${waModal.customer.name}`} message={waModal.message} phone={waModal.customer.phone} name={waModal.customer.name} onClose={()=>{setSentIds(p=>[...p,waModal.customer.id]);setWaModal(null);}}/>}
  </div>);
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
  return(<div style={{padding:"16px 16px 80px"}}>
    {!sel?(<>
      <div style={{fontWeight:800,fontSize:14,color:T.tm,marginBottom:4}}>Ready-made Templates</div>
      <div style={{fontSize:12,color:T.ts,marginBottom:16}}>Ek tap mein festival offers bhejo</div>
      {cats.map(cat=>(<div key={cat} style={{marginBottom:20}}><SL>{cat}</SL><div style={{display:"flex",flexDirection:"column",gap:8}}>{CAMPAIGNS.filter(c=>c.category===cat).map(camp=>(<div key={camp.id} onClick={()=>{setSel(camp);setCMsg(camp.template);}} style={{background:T.surface,border:`2px solid ${T.border}`,borderRadius:14,padding:"14px",cursor:"pointer",display:"flex",alignItems:"center",gap:12}} onMouseOver={e=>e.currentTarget.style.borderColor=camp.color} onMouseOut={e=>e.currentTarget.style.borderColor=T.border}><div style={{width:48,height:48,borderRadius:14,background:camp.colorLight,border:`2px solid ${camp.colorBorder}`,display:"flex",alignItems:"center",justifyContent:"center",fontSize:22,flexShrink:0}}>{camp.icon}</div><div style={{flex:1}}><div style={{fontWeight:800,fontSize:14}}>{camp.name}</div><div style={{fontSize:12,color:T.ts,marginTop:2}}>{camp.desc}</div></div><div style={{color:T.tg,fontSize:18}}>›</div></div>))}</div></div>))}
      <SL>Custom</SL>
      <div style={{background:T.surface,border:`2px dashed ${T.border}`,borderRadius:14,padding:"20px",textAlign:"center"}}><div style={{fontSize:28,marginBottom:8}}>✍️</div><div style={{fontWeight:800,fontSize:14,color:T.tm,marginBottom:4}}>Apna message likho</div><button onClick={()=>{const d=`🙏 *Namaste {name}!*\n\n[Message yahan]\n\n📅 Reply *BOOK*\n\n_💈_`;setSel({id:"custom",name:"Custom Campaign",icon:"✍️",color:T.green,colorLight:T.gl,colorBorder:T.gm,template:d,desc:"Custom"});setCMsg(d);}} style={{padding:"10px 24px",background:T.green,border:"none",borderRadius:12,color:"#fff",fontFamily:"inherit",fontSize:13,fontWeight:800,cursor:"pointer"}}>✍️ Custom Message Likho</button></div>
    </>):(
      <>
        <button onClick={()=>setSel(null)} style={{display:"flex",alignItems:"center",gap:6,background:"none",border:`1.5px solid ${T.border}`,borderRadius:10,padding:"7px 12px",fontFamily:"inherit",fontSize:12,fontWeight:700,color:T.ts,cursor:"pointer",marginBottom:16}}>← Back</button>
        <div style={{background:sel.colorLight,border:`2px solid ${sel.colorBorder}`,borderRadius:14,padding:"14px",marginBottom:16,display:"flex",alignItems:"center",gap:12}}><div style={{fontSize:28}}>{sel.icon}</div><div><div style={{fontWeight:900,fontSize:15}}>{sel.name}</div><div style={{fontSize:12,color:T.ts,marginTop:2}}>{sel.desc}</div></div></div>
        <div style={{marginBottom:16}}><SL>Target Audience</SL><div style={{display:"flex",gap:7,marginBottom:8}}>{["All","VIP","Regular","New"].map(opt=>(<button key={opt} onClick={()=>setTTag(opt)} style={{flex:1,padding:"9px 4px",borderRadius:10,border:`2px solid ${tTag===opt?T.green:T.border}`,background:tTag===opt?T.gl:T.surface,color:tTag===opt?T.gd:T.ts,fontSize:12,fontWeight:800,cursor:"pointer",fontFamily:"inherit"}}>{opt}<br/><span style={{fontSize:10}}>{opt==="All"?customers.length:customers.filter(c=>c.tag===opt).length} log</span></button>))}</div><GenderFilter value={tGender} onChange={setTGender} counts={gC}/></div>
        <LVFilter value={lvF} onChange={setLvF} total={customers.filter(c=>(tTag==="All"?true:c.tag===tTag)&&(tGender==="all"?true:c.gender===tGender)).length} match={filtered.length}/>
        {sel.id==="custom"&&<div style={{marginBottom:16}}><SL>Campaign Name</SL><input value={sel.name==="Custom Campaign"?"":sel.name} onChange={e=>setSel(s=>({...s,name:e.target.value||"Custom Campaign"}))} placeholder="e.g. Holi Offer…" style={IS} onFocus={e=>e.target.style.borderColor=T.green} onBlur={e=>e.target.style.borderColor=T.border}/></div>}
        <div style={{marginBottom:16}}><div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:8}}><SL>Message</SL><div style={{fontSize:11,color:T.ts}}><span style={{color:T.bt,fontWeight:700}}>{"{name}"}</span> → replace</div></div><textarea value={cMsg||sel.template} onChange={e=>setCMsg(e.target.value)} rows={10} style={{...IS,resize:"vertical",lineHeight:1.7,fontSize:13,padding:"12px"}} onFocus={e=>e.target.style.borderColor=T.green} onBlur={e=>e.target.style.borderColor=T.border}/></div>
        <div style={{marginBottom:16}}><SL>Preview</SL><div style={{background:"#e5ddd5",borderRadius:14,padding:14}}><div style={{background:"#fff",borderRadius:"10px 10px 10px 3px",padding:"10px 12px",maxWidth:"90%"}}><pre style={{margin:0,fontFamily:"inherit",fontSize:11,lineHeight:1.7,color:T.text,whiteSpace:"pre-wrap",wordBreak:"break-word"}}>{(cMsg||sel.template).replace(/{name}/g,customers[0]?.name||"Customer")}</pre></div></div></div>
        <div style={{background:T.surface,border:`2px solid ${T.border}`,borderRadius:14,padding:"14px"}}><div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:12}}><div style={{fontWeight:800,fontSize:13}}>{filtered.length} customers</div><div style={{fontSize:11,color:T.ts}}>{tTag}</div></div><button onClick={()=>setBulk(true)} style={{width:"100%",padding:"13px",background:T.wa,border:"none",borderRadius:12,color:"#fff",fontFamily:"inherit",fontSize:14,fontWeight:800,cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",gap:8}}>💬 Send — {filtered.length} customers</button></div>
      </>
    )}
    {bulk&&<BulkSendModal customers={filtered} template={cMsg||sel?.template||""} title={sel?.name||"Campaign"} onClose={()=>setBulk(null)}/>}
  </div>);
}

export default function EngagementCenter({currentUser}){
  const [tab,setTab]=useState("reengagement");
  const [customers,setCustomers]=useState([]);
  const [loading,setLoading]=useState(true);

  useEffect(()=>{
    async function load(){
      if(!currentUser?.id){setLoading(false);return;}
      const salonId=currentUser.salon_id||currentUser.id;
      const {data}=await supabase.from("customers").select("*").eq("salon_id",salonId).order("created_at",{ascending:false});
      if(data){setCustomers(data.map(c=>({...c,avatar:(c.name?.slice(0,2)||"??").toUpperCase(),color:["#22c55e","#3b82f6","#a855f7","#f59e0b","#14b8a6","#ec4899"][Math.floor(Math.random()*6)]})));}
      setLoading(false);
    }
    load();
  },[currentUser?.id]);

  const lostCount=customers.filter(c=>daysSince(c.last_visit||c.lastVisit)>=30).length;
  const bdayCount=customers.filter(c=>getBirthdayInfo(c.dob||c.birthday)).length;
  const TABS=[{id:"reengagement",label:"Re-engage",icon:"💫"},{id:"birthday",label:"Birthdays",icon:"🎂"},{id:"campaigns",label:"Campaigns",icon:"📢"}];

  if(loading)return(<div style={{height:"100%",display:"flex",alignItems:"center",justifyContent:"center",background:T.bg,fontFamily:"system-ui,sans-serif"}}><div style={{textAlign:"center"}}><div style={{fontSize:32,marginBottom:12}}>💫</div><div style={{fontSize:14,color:T.ts,fontWeight:700}}>Loading...</div></div></div>);

  return(<div style={{height:"100%",display:"flex",flexDirection:"column",fontFamily:"system-ui,-apple-system,sans-serif",color:T.text,background:T.bg,overflow:"hidden"}}>
    <div style={{background:T.surface,borderBottom:`2px solid ${T.border}`,display:"flex",flexShrink:0}}>
      {TABS.map(t=>(<div key={t.id} onClick={()=>setTab(t.id)} style={{flex:1,padding:"11px 4px",display:"flex",flexDirection:"column",alignItems:"center",gap:3,cursor:"pointer",borderBottom:`3px solid ${tab===t.id?T.green:"transparent"}`}}>
        <span style={{fontSize:18}}>{t.icon}</span>
        <span style={{fontSize:11,fontWeight:800,color:tab===t.id?T.green:T.tf}}>{t.label}</span>
        {t.id==="reengagement"&&lostCount>0&&<span style={{fontSize:9,background:T.yellow,color:T.yt,padding:"1px 6px",borderRadius:20,fontWeight:800}}>{lostCount}</span>}
        {t.id==="birthday"&&bdayCount>0&&<span style={{fontSize:9,background:T.red,color:T.rt,padding:"1px 6px",borderRadius:20,fontWeight:800}}>{bdayCount}</span>}
      </div>))}
    </div>
    <div style={{flex:1,overflowY:"auto"}}>
      {tab==="reengagement"&&<ReengagementTab customers={customers}/>}
      {tab==="birthday"&&<BirthdayTab customers={customers}/>}
      {tab==="campaigns"&&<CampaignsTab customers={customers}/>}
    </div>
  </div>);
}
