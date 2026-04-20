import { useState } from "react";

const T = {
  bg:"#f0f4f8",surface:"#ffffff",border:"#e8edf3",
  green:"#22c55e",gl:"#e8fdf0",gm:"#bbf7d0",gd:"#16a34a",
  text:"#1a1a2e",tm:"#555",ts:"#888",tf:"#aaa",tg:"#ccc",
  yellow:"#fef9c3",yb:"#fde68a",yt:"#a16207",
  blue:"#eff6ff",bb:"#93c5fd",bt:"#2563eb",
  red:"#fff0f0",rb:"#fca5a5",rt:"#dc2626",
  orange:"#fff7ed",ob:"#fed7aa",ot:"#ea580c",
  purple:"#faf5ff",pb:"#d8b4fe",pt:"#7c3aed",
  sub:"#f8fafc",inp:"#fafbfc",
  wa:"#25d366",
};

const IS = {
  width:"100%",padding:"11px 13px",border:`2px solid ${T.border}`,
  borderRadius:11,fontSize:14,fontFamily:"inherit",outline:"none",
  background:T.inp,boxSizing:"border-box",color:T.text,
};

// ─── Mock Data ────────────────────────────────────────────────────────────────
const CUSTOMERS = [
  {id:1,name:"Arjun Mehta",   phone:"9876543210",avatar:"AM",color:"#22c55e",tag:"VIP",    lastVisit:"12 Apr 2026",lastVisitDate:new Date(2026,3,12),dob:"1990-04-18",totalVisits:8, favService:"Haircut",        gender:"male"},
  {id:2,name:"Priya Kapoor",  phone:"9123456789",avatar:"PK",color:"#3b82f6",tag:"Regular",lastVisit:"08 Apr 2026",lastVisitDate:new Date(2026,3,8), dob:"1995-04-20",totalVisits:4, favService:"Facial",          gender:"female"},
  {id:3,name:"Rohan Singh",   phone:"8877665544",avatar:"RS",color:"#f59e0b",tag:"Regular",lastVisit:"24 Mar 2026",lastVisitDate:new Date(2026,2,24),dob:"1988-12-05",totalVisits:6, favService:"Haircut",         gender:"male"},
  {id:4,name:"Sneha Reddy",   phone:"9955443322",avatar:"SR",color:"#14b8a6",tag:"New",    lastVisit:"01 Apr 2026",lastVisitDate:new Date(2026,3,1), dob:"1998-04-22",totalVisits:2, favService:"Hair Spa",        gender:"female"},
  {id:5,name:"Vikram Tiwari", phone:"9812345670",avatar:"VT",color:"#a855f7",tag:"VIP",    lastVisit:"10 Feb 2026",lastVisitDate:new Date(2026,1,10),dob:"1985-04-19",totalVisits:12,favService:"Haircut + Beard", gender:"male"},
  {id:6,name:"Meera Joshi",   phone:"9765432109",avatar:"MJ",color:"#ec4899",tag:"Regular",lastVisit:"15 Jan 2026",lastVisitDate:new Date(2026,0,15),dob:"1992-05-03",totalVisits:5, favService:"Bridal Makeup",   gender:"female"},
  {id:7,name:"Karan Malhotra",phone:"9654321098",avatar:"KM",color:"#f97316",tag:"Regular",lastVisit:"20 Dec 2025",lastVisitDate:new Date(2025,11,20),dob:"1993-04-25",totalVisits:3,favService:"Hair Colour",     gender:"male"},
];

const CAMPAIGNS = [
  {id:"diwali",icon:"🪔",name:"Diwali Special",category:"Festival",color:"#f59e0b",colorLight:"#fff7ed",colorBorder:"#fed7aa",desc:"Diwali se pehle salon full rehta hai",
   template:`🪔 *Diwali Mubarak, {name}!* 🪔\n\nSnipBook Salon ki taraf se Diwali ki shubhkamnayein! 🎆\n\n✨ *Diwali Special*\n💇 Haircut + Blowdry — ₹299\n💄 Bridal Makeup — 20% OFF\n\n📅 Limited slots! Reply *BOOK*\n\n_Happy Diwali! 💈 - Sharma's Salon_`},
  {id:"eid",icon:"🌙",name:"Eid Mubarak",category:"Festival",color:"#7c3aed",colorLight:"#faf5ff",colorBorder:"#d8b4fe",desc:"Eid pe special grooming offer",
   template:`🌙 *Eid Mubarak, {name}!*\n\nAap aur aapke parivaar ko Eid Mubarak! 🤲\n\n✨ *Eid Special*\n✂️ Haircut + Beard — ₹349\n💆 Facial Package — ₹499\n\nReply *EID* ya call karo 📞\n\n_Eid Mubarak! 💈 - Sharma's Salon_`},
  {id:"newyear",icon:"🎆",name:"New Year Offer",category:"Festival",color:"#2563eb",colorLight:"#eff6ff",colorBorder:"#93c5fd",desc:"Naye saal mein naya look",
   template:`🎆 *Happy New Year, {name}!*\n\nNaye saal mein naya look lao! ✨\n\n🎁 *New Year Special*\n✂️ Any Haircut — 25% OFF\n💆 Hair Spa + Massage — ₹599\n\nOffer sirf January mein!\nReply *NY2027*\n\n_Naya Saal, Naya Look! 💈 - Sharma's Salon_`},
  {id:"monsoon",icon:"🌧️",name:"Monsoon Hair Care",category:"Seasonal",color:"#0891b2",colorLight:"#ecfeff",colorBorder:"#a5f3fc",desc:"Monsoon mein hair care tips + offer",
   template:`🌧️ *Monsoon Alert, {name}!*\n\nBaarish mein baalon ka khayal rakhna zaroori hai! 💇\n\n✨ *Monsoon Special*\n🧴 Anti-Dandruff Treatment — ₹299\n💆 Deep Conditioning — ₹499\n\nReply *MONSOON*\n\n_Take care! 💈 - Sharma's Salon_`},
  {id:"referral",icon:"🤝",name:"Refer & Earn",category:"Growth",color:"#16a34a",colorLight:"#e8fdf0",colorBorder:"#bbf7d0",desc:"Existing customers se referral",
   template:`🤝 *{name} bhai/didi, ek kaam karo!*\n\nApne dost ko refer karo → Dono ko ₹100 OFF!\n\n✂️ Referral code: *{name}REF*\n\n_Thank you! 💈 - Sharma's Salon_`},
  {id:"review",icon:"⭐",name:"Review Request",category:"Growth",color:"#f59e0b",colorLight:"#fef9c3",colorBorder:"#fde68a",desc:"Google/social review maango",
   template:`⭐ *{name}, 2 minute ka kaam hai!*\n\nKya aap humara Google review de sakte hain? 🙏\n\n📝 *Review karo:*\n[Google Review Link]\n\n_Aap hain toh hum hain! 💈 - Sharma's Salon_`},
];

// ─── Helpers ──────────────────────────────────────────────────────────────────
function daysSince(date){
  const today=new Date(2026,3,16);
  return Math.floor((today-date)/(1000*60*60*24));
}

function getBirthdayInfo(dob){
  if(!dob)return null;
  const today=new Date(2026,3,16);
  const bday=new Date(dob);
  bday.setFullYear(today.getFullYear());
  const diff=Math.ceil((bday-today)/(1000*60*60*24));
  if(diff===0)return{label:"🎂 Aaj Birthday!",urgency:"today",diff:0};
  if(diff>0&&diff<=3)return{label:`🎂 ${diff} din mein`,urgency:"soon",diff};
  if(diff>3&&diff<=7)return{label:"🎂 Is hafte",urgency:"week",diff};
  if(diff>7&&diff<=30)return{label:`🎂 ${diff} din mein`,urgency:"month",diff};
  if(diff<0&&diff>=-3)return{label:`🎂 ${Math.abs(diff)} din pehle tha`,urgency:"passed",diff};
  return null;
}

const URGENCY_STYLE={
  today:{bg:"#fff0f0",border:T.rb,color:T.rt,badge:"🔴 Aaj!"},
  soon: {bg:T.yellow, border:T.yb,color:T.yt,badge:"🟡 Jaldi!"},
  week: {bg:T.gl,    border:T.gm,color:T.gd,badge:"🟢 Is Hafte"},
  month:{bg:T.sub,   border:T.border,color:T.ts,badge:"📅 Is Mahine"},
  passed:{bg:T.sub,  border:T.border,color:T.tf,badge:"✓ Gaya"},
};

// ─── Gender Filter ────────────────────────────────────────────────────────────
function GenderFilter({value,onChange,counts}){
  return(
    <div style={{display:"flex",gap:6,marginBottom:10}}>
      {[{id:"all",label:"👥 All",count:counts.all},{id:"male",label:"👨 Male",count:counts.male},{id:"female",label:"👩 Female",count:counts.female}].map(o=>(
        <button key={o.id} onClick={()=>onChange(o.id)} style={{flex:1,padding:"8px 4px",borderRadius:20,border:`2px solid ${value===o.id?T.green:T.border}`,background:value===o.id?T.green:T.surface,color:value===o.id?"#fff":T.ts,fontSize:11,fontWeight:800,cursor:"pointer",fontFamily:"inherit",textAlign:"center"}}>
          {o.label}<br/><span style={{fontSize:10,fontWeight:600,opacity:0.85}}>({o.count})</span>
        </button>
      ))}
    </div>
  );
}

// ─── SL atom ─────────────────────────────────────────────────────────────────
function SL({children,color}){
  return <div style={{fontSize:10,fontWeight:800,color:color||T.tf,letterSpacing:1.2,textTransform:"uppercase",marginBottom:10}}>{children}</div>;
}

// ─── Last Visit Filter Input ─────────────────────────────────────────────────
function LastVisitInput({value, onChange, totalCount, matchCount}){
  return(
    <div style={{background:"#f8fafc",border:"2px solid #e8edf3",borderRadius:12,padding:"12px 14px",marginBottom:12}}>
      <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:10}}>
        <div style={{fontSize:12,fontWeight:800,color:"#555"}}>📅 Last Visit Filter</div>
        <div style={{fontSize:10,color:"#888",fontWeight:600}}>
          {value===0?`Sabko include (${totalCount})`:`${matchCount} / ${totalCount} customers`}
        </div>
      </div>
      <div style={{display:"flex",alignItems:"center",gap:10,marginBottom:value>0?10:0}}>
        <div style={{flex:1,position:"relative"}}>
          <input
            type="number"
            min={0}
            max={365}
            value={value===0?"":value}
            onChange={e=>{
              const v=parseInt(e.target.value)||0;
              onChange(v);
            }}
            placeholder="0 = sabko"
            style={{width:"100%",padding:"10px 44px 10px 13px",border:"2px solid #e8edf3",borderRadius:10,fontSize:15,fontWeight:800,fontFamily:"inherit",outline:"none",boxSizing:"border-box",background:"#fff",color:"#1a1a2e"}}
            onFocus={e=>e.target.style.borderColor="#22c55e"}
            onBlur={e=>e.target.style.borderColor="#e8edf3"}
          />
          <div style={{position:"absolute",right:12,top:"50%",transform:"translateY(-50%)",fontSize:12,fontWeight:700,color:"#888"}}>din</div>
        </div>
        {value>0&&(
          <button onClick={()=>onChange(0)} style={{padding:"10px 14px",background:"#fff",border:"2px solid #e8edf3",borderRadius:10,fontSize:12,fontWeight:700,color:"#888",cursor:"pointer",fontFamily:"inherit",flexShrink:0}}>✕ Clear</button>
        )}
      </div>
      {value>0&&(
        <div style={{background:matchCount>0?"#e8fdf0":"#fff0f0",border:`1.5px solid ${matchCount>0?"#bbf7d0":"#fca5a5"}`,borderRadius:8,padding:"7px 10px",fontSize:11,fontWeight:700,color:matchCount>0?"#16a34a":"#dc2626"}}>
          {matchCount>0
            ? `✅ ${matchCount} customers jinki last visit ${value}+ din pehle thi`
            : `❌ Koi customer nahi mila ${value}+ din ke filter mein`
          }
        </div>
      )}
    </div>
  );
}

// ─── Gender Badge ─────────────────────────────────────────────────────────────
function GBadge({gender}){
  return(
    <div style={{fontSize:10,color:gender==="male"?T.bt:T.pt,background:gender==="male"?T.blue:T.purple,border:`1px solid ${gender==="male"?T.bb:T.pb}`,padding:"1px 6px",borderRadius:20,fontWeight:700,flexShrink:0}}>
      {gender==="male"?"👨 M":"👩 F"}
    </div>
  );
}

// ─── WAModal ──────────────────────────────────────────────────────────────────
function WAModal({title,message,phone,name,onClose}){
  const [sent,setSent]=useState(false);
  const [editMode,setEditMode]=useState(false);
  const [editedMsg,setEditedMsg]=useState(message.replace(/{name}/g,name));
  const waUrl=`https://wa.me/${phone}?text=${encodeURIComponent(editedMsg)}`;
  return(
    <div onClick={onClose} style={{position:"fixed",inset:0,background:"rgba(0,0,0,0.5)",zIndex:800,display:"flex",alignItems:"flex-end"}}>
      <div onClick={e=>e.stopPropagation()} style={{background:T.surface,borderRadius:"20px 20px 0 0",padding:"20px 18px 36px",width:"100%",maxHeight:"90vh",overflowY:"auto",boxShadow:"0 -8px 40px rgba(0,0,0,0.15)"}}>
        <div style={{width:36,height:4,background:T.border,borderRadius:2,margin:"0 auto 18px"}}/>
        <div style={{display:"flex",alignItems:"center",gap:10,marginBottom:16}}>
          <div style={{width:42,height:42,borderRadius:12,background:"#e7fce8",border:"2px solid #a7f3c0",display:"flex",alignItems:"center",justifyContent:"center",fontSize:20}}>💬</div>
          <div style={{flex:1}}>
            <div style={{fontWeight:900,fontSize:15,color:T.text}}>{title}</div>
            <div style={{fontSize:12,color:T.ts}}>+91 {phone}</div>
          </div>
          {!sent&&<button onClick={()=>setEditMode(e=>!e)} style={{padding:"6px 12px",background:editMode?T.green:T.sub,border:`1.5px solid ${editMode?T.gm:T.border}`,borderRadius:20,fontSize:11,fontWeight:800,color:editMode?"#fff":T.ts,cursor:"pointer",fontFamily:"inherit"}}>{editMode?"✓ Done":"✏️ Edit"}</button>}
        </div>
        {editMode?(
          <div style={{marginBottom:16}}>
            <textarea value={editedMsg} onChange={e=>setEditedMsg(e.target.value)} rows={10} autoFocus style={{...IS,resize:"vertical",lineHeight:1.7,fontSize:13,padding:"12px",borderColor:T.green,marginBottom:8}}/>
            <div style={{display:"flex",gap:8}}>
              <button onClick={()=>setEditedMsg(message.replace(/{name}/g,name))} style={{padding:"6px 14px",background:T.sub,border:`1.5px solid ${T.border}`,borderRadius:9,fontSize:11,fontWeight:700,color:T.ts,cursor:"pointer",fontFamily:"inherit"}}>🔄 Reset</button>
              <button onClick={()=>setEditMode(false)} style={{padding:"6px 14px",background:T.green,border:"none",borderRadius:9,fontSize:11,fontWeight:800,color:"#fff",cursor:"pointer",fontFamily:"inherit"}}>✓ Done Editing</button>
            </div>
          </div>
        ):(
          <div style={{background:"#e5ddd5",borderRadius:14,padding:14,marginBottom:16}}>
            <div style={{background:"#fff",borderRadius:"12px 12px 12px 3px",padding:"12px 14px",maxWidth:"90%",boxShadow:"0 1px 4px rgba(0,0,0,0.08)"}}>
              <pre style={{margin:0,fontFamily:"inherit",fontSize:12,lineHeight:1.7,color:T.text,whiteSpace:"pre-wrap",wordBreak:"break-word"}}>{editedMsg}</pre>
              <div style={{fontSize:10,color:T.tf,textAlign:"right",marginTop:6}}>just now ✓✓</div>
            </div>
          </div>
        )}
        {!editMode&&<div style={{background:T.gl,border:`1.5px solid ${T.gm}`,borderRadius:10,padding:"10px 13px",marginBottom:16,fontSize:12,color:T.gd}}>💡 WhatsApp khulega pre-filled message ke saath</div>}
        {!sent?(
          <div style={{display:"flex",gap:10}}>
            <button onClick={onClose} style={{flex:1,padding:13,border:`2px solid ${T.border}`,borderRadius:12,background:T.surface,fontFamily:"inherit",fontSize:13,fontWeight:700,cursor:"pointer"}}>Cancel</button>
            <a href={waUrl} target="_blank" rel="noreferrer" onClick={()=>setSent(true)} style={{flex:2,padding:13,background:T.wa,border:"none",borderRadius:12,color:"#fff",fontFamily:"inherit",fontSize:14,fontWeight:800,cursor:"pointer",textDecoration:"none",display:"flex",alignItems:"center",justifyContent:"center",gap:8,boxShadow:"0 4px 14px rgba(37,211,102,0.35)"}}>💬 Send on WhatsApp</a>
          </div>
        ):(
          <div style={{background:T.gl,border:`2px solid ${T.gm}`,borderRadius:12,padding:14,textAlign:"center",fontWeight:800,color:T.gd}}>✅ WhatsApp opened!</div>
        )}
      </div>
    </div>
  );
}

// ─── BulkSendModal ────────────────────────────────────────────────────────────
function BulkSendModal({customers,template,title,onClose}){
  const [phase,setPhase]=useState("select");
  const [selected,setSelected]=useState(customers.map(c=>c.id));
  const [sent,setSent]=useState([]);
  const [current,setCurrent]=useState(0);
  const [editingMsg,setEditingMsg]=useState(false);
  const [msgTemplate,setMsgTemplate]=useState(template);
  const [showPreview,setShowPreview]=useState(false);
  const selectedCustomers=customers.filter(c=>selected.includes(c.id));
  const allSelected=selected.length===customers.length;
  const previewMsg=msgTemplate.replace(/{name}/g,customers[0]?.name||"Customer");
  function toggleAll(){setSelected(allSelected?[]:customers.map(c=>c.id));}
  function toggleOne(id){setSelected(p=>p.includes(id)?p.filter(x=>x!==id):[...p,id]);}
  function sendNext(){
    if(current>=selectedCustomers.length)return;
    const c=selectedCustomers[current];
    const msg=msgTemplate.replace(/{name}/g,c.name);
    window.open(`https://wa.me/${c.phone}?text=${encodeURIComponent(msg)}`,"_blank");
    setSent(p=>[...p,c.id]);
    setCurrent(p=>p+1);
  }
  const allDone=phase==="sending"&&sent.length===selectedCustomers.length&&selectedCustomers.length>0;
  return(
    <div onClick={onClose} style={{position:"fixed",inset:0,background:"rgba(0,0,0,0.5)",zIndex:800,display:"flex",alignItems:"flex-end"}}>
      <div onClick={e=>e.stopPropagation()} style={{background:T.surface,borderRadius:"20px 20px 0 0",padding:"20px 18px 36px",width:"100%",maxHeight:"92vh",overflowY:"auto",boxShadow:"0 -8px 40px rgba(0,0,0,0.15)"}}>
        <div style={{width:36,height:4,background:T.border,borderRadius:2,margin:"0 auto 18px"}}/>
        <div style={{fontWeight:900,fontSize:16,marginBottom:2}}>📤 Bulk Send — {title}</div>
        <div style={{fontSize:12,color:T.ts,marginBottom:16}}>{phase==="select"?`${customers.length} customers mein se select karo`:`${selectedCustomers.length} customers ko bhej rahe hain`}</div>

        {phase==="select"&&(
          <>
            {/* Message preview/edit */}
            <div style={{background:T.sub,border:`2px solid ${T.border}`,borderRadius:14,marginBottom:14,overflow:"hidden"}}>
              <div style={{padding:"11px 14px",display:"flex",alignItems:"center",justifyContent:"space-between",borderBottom:`1px solid ${T.border}`}}>
                <div style={{display:"flex",alignItems:"center",gap:8}}>
                  <span style={{fontSize:15}}>💬</span>
                  <div><div style={{fontSize:12,fontWeight:800,color:T.text}}>Message</div><div style={{fontSize:10,color:T.ts}}>{"{name}"} auto replace hoga</div></div>
                </div>
                <div style={{display:"flex",gap:6}}>
                  <button onClick={()=>{setShowPreview(p=>!p);setEditingMsg(false);}} style={{padding:"4px 10px",background:showPreview?T.blue:T.surface,border:`1.5px solid ${showPreview?T.bb:T.border}`,borderRadius:20,fontSize:11,fontWeight:700,color:showPreview?T.bt:T.ts,cursor:"pointer",fontFamily:"inherit"}}>{showPreview?"✕ Hide":"👁 Preview"}</button>
                  <button onClick={()=>{setEditingMsg(p=>!p);setShowPreview(false);}} style={{padding:"4px 10px",background:editingMsg?T.green:T.surface,border:`1.5px solid ${editingMsg?T.gm:T.border}`,borderRadius:20,fontSize:11,fontWeight:700,color:editingMsg?"#fff":T.ts,cursor:"pointer",fontFamily:"inherit"}}>{editingMsg?"✓ Done":"✏️ Edit"}</button>
                </div>
              </div>
              {showPreview&&!editingMsg&&(
                <div style={{padding:"12px 14px",background:"#e5ddd5"}}>
                  <div style={{background:"#fff",borderRadius:"10px 10px 10px 3px",padding:"10px 12px",maxWidth:"90%"}}>
                    <pre style={{margin:0,fontFamily:"inherit",fontSize:11,lineHeight:1.7,color:T.text,whiteSpace:"pre-wrap",wordBreak:"break-word"}}>{previewMsg}</pre>
                    <div style={{fontSize:9,color:T.tf,textAlign:"right",marginTop:4}}>Preview · {customers[0]?.name}</div>
                  </div>
                </div>
              )}
              {editingMsg&&(
                <div style={{padding:"12px 14px"}}>
                  <textarea value={msgTemplate} onChange={e=>setMsgTemplate(e.target.value)} rows={8} autoFocus style={{...IS,resize:"vertical",lineHeight:1.7,fontSize:12,padding:"10px",borderColor:T.green,marginBottom:8}}/>
                  <div style={{display:"flex",gap:7}}>
                    <button onClick={()=>setMsgTemplate(template)} style={{padding:"6px 12px",background:T.sub,border:`1.5px solid ${T.border}`,borderRadius:9,fontSize:11,fontWeight:700,color:T.ts,cursor:"pointer",fontFamily:"inherit"}}>🔄 Reset</button>
                    <button onClick={()=>setEditingMsg(false)} style={{padding:"6px 12px",background:T.green,border:"none",borderRadius:9,fontSize:11,fontWeight:800,color:"#fff",cursor:"pointer",fontFamily:"inherit"}}>✓ Save</button>
                  </div>
                </div>
              )}
              {!showPreview&&!editingMsg&&(
                <div style={{padding:"9px 14px",fontSize:11,color:T.ts,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>
                  {msgTemplate.split("\n")[0].replace(/{name}/g,customers[0]?.name||"Customer")}…
                </div>
              )}
            </div>
            {/* Select all */}
            <div style={{background:T.sub,border:`2px solid ${T.border}`,borderRadius:12,padding:"10px 14px",marginBottom:12,display:"flex",alignItems:"center",justifyContent:"space-between"}}>
              <div style={{fontSize:13,fontWeight:800,color:T.text}}>{selected.length===0?"Koi select nahi":`${selected.length} selected`}</div>
              <button onClick={toggleAll} style={{padding:"6px 14px",background:allSelected?T.red:T.green,border:"none",borderRadius:20,color:"#fff",fontSize:11,fontWeight:800,cursor:"pointer",fontFamily:"inherit"}}>{allSelected?"✕ Deselect All":"✓ Select All"}</button>
            </div>
            {/* List */}
            <div style={{marginBottom:16,background:T.surface,border:`2px solid ${T.border}`,borderRadius:14,overflow:"hidden"}}>
              {customers.map((c,i)=>{
                const isSel=selected.includes(c.id);
                return(
                  <div key={c.id} onClick={()=>toggleOne(c.id)} style={{display:"flex",alignItems:"center",gap:12,padding:"12px 14px",borderBottom:i<customers.length-1?`1px solid ${T.border}`:"none",background:isSel?T.gl:T.surface,cursor:"pointer",transition:"background 0.15s"}}>
                    <div style={{width:22,height:22,borderRadius:7,flexShrink:0,background:isSel?T.green:T.surface,border:`2px solid ${isSel?T.green:T.border}`,display:"flex",alignItems:"center",justifyContent:"center",fontSize:12,color:"#fff",fontWeight:900,transition:"all 0.15s"}}>{isSel?"✓":""}</div>
                    <div style={{width:38,height:38,borderRadius:11,background:c.color+"22",border:`1.5px solid ${c.color}44`,display:"flex",alignItems:"center",justifyContent:"center",fontSize:13,fontWeight:900,color:c.color,flexShrink:0}}>{c.avatar}</div>
                    <div style={{flex:1}}>
                      <div style={{fontSize:13,fontWeight:800,color:T.text}}>{c.name}</div>
                      <div style={{fontSize:11,color:T.ts,marginTop:2}}>+91 {c.phone}</div>
                    </div>
                    {c.gender&&<GBadge gender={c.gender}/>}
                    <div style={{fontSize:10,fontWeight:700,color:T.ts,background:T.sub,padding:"2px 8px",borderRadius:20,border:`1px solid ${T.border}`,flexShrink:0}}>{c.tag}</div>
                  </div>
                );
              })}
            </div>
            <div style={{display:"flex",gap:10}}>
              <button onClick={onClose} style={{flex:1,padding:12,border:`2px solid ${T.border}`,borderRadius:12,background:T.surface,fontFamily:"inherit",fontSize:13,fontWeight:700,cursor:"pointer"}}>Cancel</button>
              <button onClick={()=>{if(selected.length>0)setPhase("sending");}} style={{flex:2,padding:12,background:selected.length>0?T.wa:"#d1d5db",border:"none",borderRadius:12,color:"#fff",fontFamily:"inherit",fontSize:14,fontWeight:800,cursor:selected.length>0?"pointer":"not-allowed",boxShadow:selected.length>0?"0 4px 14px rgba(37,211,102,0.3)":"none"}}>
                💬 Send to {selected.length} customers →
              </button>
            </div>
          </>
        )}

        {phase==="sending"&&!allDone&&(
          <>
            <div style={{background:T.sub,border:`2px solid ${T.border}`,borderRadius:12,padding:"12px 14px",marginBottom:16}}>
              <div style={{display:"flex",justifyContent:"space-between",marginBottom:8}}><span style={{fontSize:13,fontWeight:700,color:T.tm}}>Progress</span><span style={{fontSize:13,fontWeight:800,color:T.gd}}>{sent.length}/{selectedCustomers.length}</span></div>
              <div style={{height:8,borderRadius:20,background:T.border,overflow:"hidden"}}><div style={{width:`${selectedCustomers.length>0?(sent.length/selectedCustomers.length)*100:0}%`,height:"100%",background:T.green,borderRadius:20,transition:"width 0.3s"}}/></div>
            </div>
            <div style={{marginBottom:16,background:T.surface,border:`2px solid ${T.border}`,borderRadius:14,overflow:"hidden"}}>
              {selectedCustomers.map((c,i)=>(
                <div key={c.id} style={{display:"flex",alignItems:"center",gap:12,padding:"12px 14px",borderBottom:i<selectedCustomers.length-1?`1px solid ${T.border}`:"none",background:sent.includes(c.id)?T.gl:T.surface}}>
                  <div style={{width:38,height:38,borderRadius:11,background:c.color+"22",border:`1.5px solid ${c.color}44`,display:"flex",alignItems:"center",justifyContent:"center",fontSize:13,fontWeight:900,color:c.color,flexShrink:0}}>{c.avatar}</div>
                  <div style={{flex:1}}><div style={{fontSize:13,fontWeight:800,color:T.text}}>{c.name}</div><div style={{fontSize:11,color:T.ts}}>+91 {c.phone}</div></div>
                  {sent.includes(c.id)?<div style={{fontSize:11,fontWeight:800,color:T.gd,background:T.gl,border:`1.5px solid ${T.gm}`,padding:"3px 10px",borderRadius:20}}>✓ Sent</div>
                  :i===current?<div style={{fontSize:11,fontWeight:800,color:T.yt,background:T.yellow,border:`1.5px solid ${T.yb}`,padding:"3px 10px",borderRadius:20}}>⏳ Next</div>
                  :<div style={{fontSize:11,color:T.tf}}>Pending</div>}
                </div>
              ))}
            </div>
            <div style={{display:"flex",gap:10}}>
              <button onClick={()=>setPhase("select")} style={{flex:1,padding:12,border:`2px solid ${T.border}`,borderRadius:12,background:T.surface,fontFamily:"inherit",fontSize:12,fontWeight:700,cursor:"pointer"}}>← Back</button>
              <button onClick={sendNext} style={{flex:2,padding:12,background:T.wa,border:"none",borderRadius:12,color:"#fff",fontFamily:"inherit",fontSize:14,fontWeight:800,cursor:"pointer",boxShadow:"0 4px 14px rgba(37,211,102,0.3)"}}>💬 Send to {selectedCustomers[current]?.name}</button>
            </div>
          </>
        )}

        {allDone&&(
          <div style={{background:T.gl,border:`2px solid ${T.gm}`,borderRadius:14,padding:24,textAlign:"center"}}>
            <div style={{fontSize:42,marginBottom:10}}>🎉</div>
            <div style={{fontWeight:900,fontSize:16,color:T.gd,marginBottom:4}}>Sab ko message bhej diya!</div>
            <div style={{fontSize:13,color:T.ts,marginBottom:16}}>{selectedCustomers.length} customers contacted</div>
            <button onClick={onClose} style={{padding:"11px 32px",background:T.green,border:"none",borderRadius:12,color:"#fff",fontFamily:"inherit",fontSize:14,fontWeight:800,cursor:"pointer"}}>Done ✓</button>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Re-engagement Tab ────────────────────────────────────────────────────────
function ReengagementTab(){
  const [subTab,setSubTab]=useState("inactive");
  const [filter,setFilter]=useState(30);
  const [genderFilter,setGenderFilter]=useState("all");
  const [waModal,setWaModal]=useState(null);
  const [bulkModal,setBulkModal]=useState(null);
  const [sentIds,setSentIds]=useState([]);
  const [selectedInactive,setSelectedInactive]=useState([]);
  const [allSearch,setAllSearch]=useState("");
  const [allLastVisitFilter,setAllLastVisitFilter]=useState(0);
  const [allTagFilter,setAllTagFilter]=useState("All");
  const [allGender,setAllGender]=useState("all");
  const [allBulkModal,setAllBulkModal]=useState(false);
  const [selectedAll,setSelectedAll]=useState([]);
  const [customMsg,setCustomMsg]=useState(`🙏 *Namaste {name}!*\n\nAapko yaad kar rahe hain hum! 😊\n\nHumara salon kuch dino ke liye band tha — ab hum wapas aa gaye hain! 💈\n\nAapki next visit pe *10% OFF*!\n\n📅 Reply *BOOK*\n\n_Milte hain jald! 💈 - Sharma's Salon_`);
  const [editingMsg,setEditingMsg]=useState(false);

  const lostCustomers=CUSTOMERS
    .map(c=>({...c,days:daysSince(c.lastVisitDate)}))
    .filter(c=>c.days>=filter)
    .filter(c=>genderFilter==="all"?true:c.gender===genderFilter)
    .sort((a,b)=>b.days-a.days);

  const filteredAll=CUSTOMERS
    .filter(c=>allTagFilter==="All"?true:c.tag===allTagFilter)
    .filter(c=>allGender==="all"?true:c.gender===allGender)
    .filter(c=>allLastVisitFilter===0?true:daysSince(c.lastVisitDate)>=allLastVisitFilter)
    .filter(c=>{const q=allSearch.toLowerCase();return !q||c.name.toLowerCase().includes(q)||c.phone.includes(q);});

  // No static FILTERS array needed — using custom input

  function getReengageMsg(c){return `🙏 *Namaste ${c.name}!*\n\nAapko yaad kar rahe hain hum! 😊\n\nKaafi dino se aap nahi aaye — ${c.days} din ho gaye. Kya sab theek hai? 💇\n\n✨ *Wapas aao offer:*\nApni next visit pe *15% OFF*!\n\nReply karo ya call karo 📞\n\n_Miss you! 💈 - Sharma's Salon_`;}
  const bulkTemplate=`🙏 *Namaste {name}!*\n\nAapko yaad kar rahe hain hum! 😊\n\nKaafi dino se aap nahi aaye. Kya sab theek hai? 💇\n\n✨ *Wapas aao offer:*\nApni next visit pe *15% OFF*!\n\nReply karo ya call karo 📞\n\n_Miss you! 💈 - Sharma's Salon_`;

  const allInactiveSel=selectedInactive.length===lostCustomers.length&&lostCustomers.length>0;
  const allClientsSel=selectedAll.length===filteredAll.length&&filteredAll.length>0;

  const iGenderCounts={all:CUSTOMERS.filter(c=>daysSince(c.lastVisitDate)>=filter&&(genderFilter==="all"?true:c.gender===genderFilter)).length,male:CUSTOMERS.filter(c=>daysSince(c.lastVisitDate)>=filter&&c.gender==="male").length,female:CUSTOMERS.filter(c=>daysSince(c.lastVisitDate)>=filter&&c.gender==="female").length};
  const aGenderCounts={all:CUSTOMERS.length,male:CUSTOMERS.filter(c=>c.gender==="male").length,female:CUSTOMERS.filter(c=>c.gender==="female").length};

  return(
    <div style={{padding:"16px 16px 80px"}}>
      {/* Sub tabs */}
      <div style={{display:"flex",gap:8,marginBottom:16}}>
        {[{id:"inactive",label:"💤 Inactive",desc:"Jo nahi aaye"},{id:"all",label:"👥 All Clients",desc:"Broadcast karo"}].map(t=>(
          <div key={t.id} onClick={()=>setSubTab(t.id)} style={{flex:1,padding:"12px 10px",borderRadius:12,border:`2px solid ${subTab===t.id?T.green:T.border}`,background:subTab===t.id?T.gl:T.surface,cursor:"pointer",textAlign:"center",transition:"all 0.15s"}}>
            <div style={{fontSize:13,fontWeight:800,color:subTab===t.id?T.gd:T.tm}}>{t.label}</div>
            <div style={{fontSize:10,color:subTab===t.id?T.gd:T.ts,marginTop:2}}>{t.desc}</div>
          </div>
        ))}
      </div>

      {/* ── INACTIVE ── */}
      {subTab==="inactive"&&(
        <>
          <GenderFilter value={genderFilter} onChange={(g)=>{setGenderFilter(g);setSelectedInactive([]);}} counts={iGenderCounts}/>
          <LastVisitInput
            value={filter}
            onChange={(v)=>{setFilter(v);setSelectedInactive([]);}}
            totalCount={CUSTOMERS.filter(c=>genderFilter==="all"?true:c.gender===genderFilter).length}
            matchCount={CUSTOMERS.filter(c=>(genderFilter==="all"?true:c.gender===genderFilter)&&(filter===0?true:daysSince(c.lastVisitDate)>=filter)).length}
          />
          {lostCustomers.length>0&&(
            <div style={{background:T.sub,border:`2px solid ${T.border}`,borderRadius:12,padding:"10px 14px",marginBottom:12,display:"flex",alignItems:"center",justifyContent:"space-between"}}>
              <div style={{fontSize:13,fontWeight:800,color:T.text}}>{selectedInactive.length===0?`${lostCustomers.length} customers`:`${selectedInactive.length} selected`}</div>
              <div style={{display:"flex",gap:7}}>
                <button onClick={()=>setSelectedInactive(allInactiveSel?[]:lostCustomers.map(c=>c.id))} style={{padding:"5px 12px",background:allInactiveSel?T.red:T.green,border:"none",borderRadius:20,color:"#fff",fontSize:11,fontWeight:800,cursor:"pointer",fontFamily:"inherit"}}>{allInactiveSel?"✕ Deselect All":"✓ Select All"}</button>
                {selectedInactive.length>0&&<button onClick={()=>setBulkModal(true)} style={{padding:"5px 12px",background:T.wa,border:"none",borderRadius:20,color:"#fff",fontSize:11,fontWeight:800,cursor:"pointer",fontFamily:"inherit"}}>💬 Send ({selectedInactive.length})</button>}
              </div>
            </div>
          )}
          {lostCustomers.length===0?(
            <div style={{background:T.surface,border:`2px dashed ${T.border}`,borderRadius:14,padding:"40px 20px",textAlign:"center"}}>
              <div style={{fontSize:36,marginBottom:10}}>🎉</div>
              <div style={{fontWeight:800,fontSize:15,color:T.tm,marginBottom:6}}>Sab active hain!</div>
              <div style={{fontSize:13,color:T.ts}}>Koi customer {filter}+ din se absent nahi</div>
            </div>
          ):(
            <div style={{display:"flex",flexDirection:"column",gap:10}}>
              {lostCustomers.map(c=>{
                const isSent=sentIds.includes(c.id);
                const isSel=selectedInactive.includes(c.id);
                const urgencyColor=c.days>=90?T.rt:c.days>=60?T.ot:T.yt;
                const urgencyBg=c.days>=90?T.red:c.days>=60?T.orange:T.yellow;
                return(
                  <div key={c.id} style={{background:T.surface,border:`2px solid ${isSel?T.green:isSent?T.gm:T.border}`,borderRadius:14,padding:"14px",transition:"all 0.15s"}}>
                    <div style={{display:"flex",alignItems:"center",gap:12,marginBottom:12}}>
                      <div onClick={()=>setSelectedInactive(p=>p.includes(c.id)?p.filter(x=>x!==c.id):[...p,c.id])} style={{width:22,height:22,borderRadius:7,flexShrink:0,background:isSel?T.green:T.surface,border:`2px solid ${isSel?T.green:T.border}`,display:"flex",alignItems:"center",justifyContent:"center",fontSize:12,color:"#fff",fontWeight:900,cursor:"pointer",transition:"all 0.15s"}}>{isSel?"✓":""}</div>
                      <div style={{width:44,height:44,borderRadius:14,background:c.color+"22",border:`2px solid ${c.color}44`,display:"flex",alignItems:"center",justifyContent:"center",fontSize:15,fontWeight:900,color:c.color,flexShrink:0}}>{c.avatar}</div>
                      <div style={{flex:1}}>
                        <div style={{display:"flex",alignItems:"center",gap:6,marginBottom:2}}><div style={{fontWeight:800,fontSize:14,color:T.text}}>{c.name}</div><GBadge gender={c.gender}/></div>
                        <div style={{fontSize:11,color:T.ts}}>⭐ {c.favService} · {c.totalVisits} visits</div>
                      </div>
                      <div style={{background:urgencyBg,color:urgencyColor,border:`1.5px solid ${urgencyColor}44`,fontSize:11,fontWeight:800,padding:"4px 10px",borderRadius:20,flexShrink:0}}>{c.days} din</div>
                    </div>
                    <div style={{background:T.sub,borderRadius:9,padding:"8px 12px",marginBottom:12,fontSize:12,color:T.tm}}>📅 Last visit: <strong>{c.lastVisit}</strong></div>
                    {isSent?(
                      <div style={{background:T.gl,border:`1.5px solid ${T.gm}`,borderRadius:10,padding:"10px",textAlign:"center",fontSize:12,fontWeight:800,color:T.gd}}>✅ Message bhej diya!</div>
                    ):(
                      <button onClick={()=>setWaModal({customer:c,message:getReengageMsg(c)})} style={{width:"100%",padding:"11px",background:T.wa,border:"none",borderRadius:11,color:"#fff",fontFamily:"inherit",fontSize:13,fontWeight:800,cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",gap:8}}>💬 Wapas bulao — WhatsApp bhejo</button>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </>
      )}

      {/* ── ALL CLIENTS ── */}
      {subTab==="all"&&(
        <>
          {/* Broadcast message */}
          <div style={{background:T.surface,border:`2px solid ${editingMsg?T.green:T.border}`,borderRadius:14,marginBottom:14,overflow:"hidden"}}>
            <div style={{padding:"11px 14px",display:"flex",alignItems:"center",justifyContent:"space-between",borderBottom:`1px solid ${T.border}`,background:T.sub}}>
              <div style={{display:"flex",alignItems:"center",gap:8}}><span style={{fontSize:15}}>📝</span><div><div style={{fontSize:12,fontWeight:800,color:T.text}}>Broadcast Message</div><div style={{fontSize:10,color:T.ts}}>{"{name}"} auto replace hoga</div></div></div>
              <button onClick={()=>setEditingMsg(e=>!e)} style={{padding:"5px 12px",background:editingMsg?T.green:T.surface,border:`1.5px solid ${editingMsg?T.gm:T.border}`,borderRadius:20,fontSize:11,fontWeight:800,color:editingMsg?"#fff":T.ts,cursor:"pointer",fontFamily:"inherit"}}>{editingMsg?"✓ Done":"✏️ Edit"}</button>
            </div>
            {editingMsg?(
              <div style={{padding:"12px 14px"}}>
                <textarea value={customMsg} onChange={e=>setCustomMsg(e.target.value)} rows={8} autoFocus style={{...IS,resize:"vertical",lineHeight:1.7,fontSize:12,padding:"10px",borderColor:T.green,marginBottom:8}}/>
                <button onClick={()=>setEditingMsg(false)} style={{padding:"6px 14px",background:T.green,border:"none",borderRadius:9,fontSize:11,fontWeight:800,color:"#fff",cursor:"pointer",fontFamily:"inherit"}}>✓ Save</button>
              </div>
            ):(
              <div style={{padding:"9px 14px"}}>
                <pre style={{margin:0,fontFamily:"inherit",fontSize:11,lineHeight:1.7,color:T.tm,whiteSpace:"pre-wrap",wordBreak:"break-word",maxHeight:70,overflow:"hidden"}}>{customMsg.replace(/{name}/g,CUSTOMERS[0].name)}</pre>
                <div style={{fontSize:10,color:T.tf,marginTop:2}}>tap Edit to modify</div>
              </div>
            )}
          </div>

          <GenderFilter value={allGender} onChange={(g)=>{setAllGender(g);setSelectedAll([]);}} counts={aGenderCounts}/>
          <LastVisitInput
            value={allLastVisitFilter}
            onChange={(v)=>{setAllLastVisitFilter(v);setSelectedAll([]);}}
            totalCount={CUSTOMERS.filter(c=>(allTagFilter==="All"?true:c.tag===allTagFilter)&&(allGender==="all"?true:c.gender===allGender)).length}
            matchCount={CUSTOMERS.filter(c=>(allTagFilter==="All"?true:c.tag===allTagFilter)&&(allGender==="all"?true:c.gender===allGender)&&(allLastVisitFilter===0?true:daysSince(c.lastVisitDate)>=allLastVisitFilter)).length}
          />
          <div style={{display:"flex",gap:6,marginBottom:8}}>
            {["All","VIP","Regular","New"].map(f=>(
              <button key={f} onClick={()=>{setAllTagFilter(f);setSelectedAll([]);}} style={{padding:"5px 10px",borderRadius:20,border:`2px solid ${allTagFilter===f?T.green:T.border}`,background:allTagFilter===f?T.green:T.surface,color:allTagFilter===f?"#fff":T.ts,fontSize:11,fontWeight:800,cursor:"pointer",fontFamily:"inherit",flexShrink:0}}>{f}</button>
            ))}
          </div>
          <div style={{position:"relative",marginBottom:10}}>
            <span style={{position:"absolute",left:11,top:"50%",transform:"translateY(-50%)",fontSize:13,color:T.tf}}>🔍</span>
            <input value={allSearch} onChange={e=>setAllSearch(e.target.value)} placeholder="Search…" style={{...IS,padding:"9px 12px 9px 32px",fontSize:13}} onFocus={e=>e.target.style.borderColor=T.green} onBlur={e=>e.target.style.borderColor=T.border}/>
          </div>
          {/* Select all bar */}
          <div style={{background:T.sub,border:`2px solid ${T.border}`,borderRadius:12,padding:"10px 14px",marginBottom:12,display:"flex",alignItems:"center",justifyContent:"space-between"}}>
            <div style={{fontSize:13,fontWeight:800,color:T.text}}>{selectedAll.length===0?`${filteredAll.length} customers`:`${selectedAll.length} selected`}</div>
            <div style={{display:"flex",gap:7}}>
              <button onClick={()=>setSelectedAll(allClientsSel?[]:filteredAll.map(c=>c.id))} style={{padding:"5px 12px",background:allClientsSel?T.red:T.green,border:"none",borderRadius:20,color:"#fff",fontSize:11,fontWeight:800,cursor:"pointer",fontFamily:"inherit"}}>{allClientsSel?"✕ Deselect All":"✓ Select All"}</button>
              {selectedAll.length>0&&<button onClick={()=>setAllBulkModal(true)} style={{padding:"5px 12px",background:T.wa,border:"none",borderRadius:20,color:"#fff",fontSize:11,fontWeight:800,cursor:"pointer",fontFamily:"inherit"}}>💬 Send ({selectedAll.length})</button>}
            </div>
          </div>
          {/* List */}
          <div style={{background:T.surface,border:`2px solid ${T.border}`,borderRadius:14,overflow:"hidden"}}>
            {filteredAll.map((c,i)=>{
              const isSel=selectedAll.includes(c.id);
              return(
                <div key={c.id} onClick={()=>setSelectedAll(p=>p.includes(c.id)?p.filter(x=>x!==c.id):[...p,c.id])} style={{display:"flex",alignItems:"center",gap:12,padding:"12px 14px",borderBottom:i<filteredAll.length-1?`1px solid ${T.border}`:"none",background:isSel?T.gl:T.surface,cursor:"pointer",transition:"background 0.15s"}}>
                  <div style={{width:22,height:22,borderRadius:7,flexShrink:0,background:isSel?T.green:T.surface,border:`2px solid ${isSel?T.green:T.border}`,display:"flex",alignItems:"center",justifyContent:"center",fontSize:12,color:"#fff",fontWeight:900,transition:"all 0.15s"}}>{isSel?"✓":""}</div>
                  <div style={{width:40,height:40,borderRadius:12,background:c.color+"22",border:`1.5px solid ${c.color}44`,display:"flex",alignItems:"center",justifyContent:"center",fontSize:14,fontWeight:900,color:c.color,flexShrink:0}}>{c.avatar}</div>
                  <div style={{flex:1}}>
                    <div style={{display:"flex",alignItems:"center",gap:5,marginBottom:1}}><div style={{fontSize:13,fontWeight:800,color:T.text}}>{c.name}</div><GBadge gender={c.gender}/></div>
                    <div style={{fontSize:11,color:T.ts}}>📅 {c.lastVisit} · {c.totalVisits} visits</div>
                  </div>
                  <div style={{display:"flex",alignItems:"center",gap:6}}>
                    <div style={{fontSize:10,fontWeight:700,color:T.ts,background:T.sub,padding:"2px 7px",borderRadius:20,border:`1px solid ${T.border}`,flexShrink:0}}>{c.tag}</div>
                    <div onClick={e=>{e.stopPropagation();setWaModal({customer:c,message:customMsg.replace(/{name}/g,c.name)});}} style={{width:32,height:32,background:T.wa,borderRadius:9,display:"flex",alignItems:"center",justifyContent:"center",fontSize:14,cursor:"pointer",flexShrink:0}}>💬</div>
                  </div>
                </div>
              );
            })}
          </div>
        </>
      )}

      {waModal&&<WAModal title={subTab==="all"?`Broadcast — ${waModal.customer.name}`:`Re-engage — ${waModal.customer.name}`} message={waModal.message} phone={waModal.customer.phone} name={waModal.customer.name} onClose={()=>{setSentIds(p=>[...p,waModal.customer.id]);setWaModal(null);}}/>}
      {bulkModal&&<BulkSendModal customers={lostCustomers.filter(c=>selectedInactive.includes(c.id))} template={bulkTemplate} title="Re-engagement" onClose={()=>setBulkModal(null)}/>}
      {allBulkModal&&<BulkSendModal customers={filteredAll.filter(c=>selectedAll.includes(c.id))} template={customMsg} title="Broadcast" onClose={()=>setAllBulkModal(false)}/>}
    </div>
  );
}

// ─── Birthday Tab ─────────────────────────────────────────────────────────────
function BirthdayTab(){
  const [waModal,setWaModal]=useState(null);
  const [sentIds,setSentIds]=useState([]);
  const [genderFilter,setGenderFilter]=useState("all");

  const withBirthdays=CUSTOMERS
    .map(c=>({...c,bdayInfo:getBirthdayInfo(c.dob)}))
    .filter(c=>c.bdayInfo)
    .filter(c=>genderFilter==="all"?true:c.gender===genderFilter)
    .sort((a,b)=>a.bdayInfo.diff-b.bdayInfo.diff);

  const bdayCounts={
    all:CUSTOMERS.filter(c=>getBirthdayInfo(c.dob)).length,
    male:CUSTOMERS.filter(c=>getBirthdayInfo(c.dob)&&c.gender==="male").length,
    female:CUSTOMERS.filter(c=>getBirthdayInfo(c.dob)&&c.gender==="female").length,
  };

  function getBdayMsg(c){
    if(c.bdayInfo.urgency==="passed")return `🎂 *Belated Birthday, ${c.name}!*\n\nThodi der se sahi, par dil se! 🙏\n\n🎁 *Birthday Gift:*\nNext visit pe *20% OFF*!\n\n_With love! 💈 - Sharma's Salon_`;
    return `🎂 *Happy Birthday, ${c.name}!* 🎉\n\nAaj ka din aapka hai! 🥳\n\n🎁 *Birthday Special:*\n✂️ Free Haircut OR 25% OFF any service!\nSirf birthday month mein valid!\n\nReply *BDAY* to book!\n\n_Khush raho! 💈 - Sharma's Salon_`;
  }

  return(
    <div style={{padding:"16px 16px 80px"}}>
      <GenderFilter value={genderFilter} onChange={setGenderFilter} counts={bdayCounts}/>

      <div style={{background:"linear-gradient(135deg,#fef9c3,#fef3c7)",border:`2px solid ${T.yb}`,borderRadius:14,padding:"16px",marginBottom:16}}>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:10}}>
          <div style={{fontWeight:900,fontSize:15,color:T.yt}}>🎂 Birthday Calendar</div>
          <div style={{background:T.yt,color:"#fff",fontSize:11,fontWeight:800,padding:"3px 10px",borderRadius:20}}>{withBirthdays.length} upcoming</div>
        </div>
        <div style={{display:"flex",gap:8}}>
          {[{label:"Aaj",count:withBirthdays.filter(c=>c.bdayInfo.urgency==="today").length,color:T.rt},{label:"3 Din",count:withBirthdays.filter(c=>c.bdayInfo.urgency==="soon").length,color:T.ot},{label:"Is Hafte",count:withBirthdays.filter(c=>c.bdayInfo.urgency==="week").length,color:T.gd},{label:"Is Mahine",count:withBirthdays.filter(c=>c.bdayInfo.urgency==="month").length,color:T.bt}].map(s=>(
            <div key={s.label} style={{flex:1,background:"rgba(255,255,255,0.7)",borderRadius:10,padding:"8px 4px",textAlign:"center"}}>
              <div style={{fontWeight:900,fontSize:18,color:s.color}}>{s.count}</div>
              <div style={{fontSize:9,color:T.yt,fontWeight:700,marginTop:2}}>{s.label}</div>
            </div>
          ))}
        </div>
      </div>

      {withBirthdays.length===0?(
        <div style={{background:T.surface,border:`2px dashed ${T.border}`,borderRadius:14,padding:"40px 20px",textAlign:"center"}}>
          <div style={{fontSize:36,marginBottom:10}}>🎂</div>
          <div style={{fontWeight:800,fontSize:15,color:T.tm}}>Abhi koi birthday nahi</div>
        </div>
      ):(
        <div style={{display:"flex",flexDirection:"column",gap:10}}>
          {withBirthdays.map(c=>{
            const us=URGENCY_STYLE[c.bdayInfo.urgency];
            const isSent=sentIds.includes(c.id);
            return(
              <div key={c.id} style={{background:T.surface,border:`2px solid ${isSent?T.gm:us.border}`,borderRadius:14,padding:"14px"}}>
                <div style={{display:"flex",alignItems:"center",gap:12,marginBottom:12}}>
                  <div style={{position:"relative"}}>
                    <div style={{width:46,height:46,borderRadius:14,background:c.color+"22",border:`2px solid ${c.color}44`,display:"flex",alignItems:"center",justifyContent:"center",fontSize:15,fontWeight:900,color:c.color}}>{c.avatar}</div>
                    <div style={{position:"absolute",bottom:-4,right:-4,fontSize:14}}>🎂</div>
                  </div>
                  <div style={{flex:1}}>
                    <div style={{display:"flex",alignItems:"center",gap:6,marginBottom:2}}><div style={{fontWeight:800,fontSize:14,color:T.text}}>{c.name}</div><GBadge gender={c.gender}/></div>
                    <div style={{fontSize:11,color:T.ts}}>{c.bdayInfo.label}</div>
                  </div>
                  <div style={{background:us.bg,color:us.color,border:`1.5px solid ${us.border}`,fontSize:10,fontWeight:800,padding:"3px 9px",borderRadius:20,flexShrink:0}}>{us.badge}</div>
                </div>
                {isSent?(
                  <div style={{background:T.gl,border:`1.5px solid ${T.gm}`,borderRadius:10,padding:"10px",textAlign:"center",fontSize:12,fontWeight:800,color:T.gd}}>✅ Birthday wish bhej diya!</div>
                ):(
                  <button onClick={()=>setWaModal({customer:c,message:getBdayMsg(c)})} style={{width:"100%",padding:"11px",background:c.bdayInfo.urgency==="today"?"linear-gradient(135deg,#f59e0b,#ef4444)":T.wa,border:"none",borderRadius:11,color:"#fff",fontFamily:"inherit",fontSize:13,fontWeight:800,cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",gap:8}}>
                    {c.bdayInfo.urgency==="today"?"🎂 Aaj ZAROOR Wish Karo!":"💬 Birthday Wish + Offer Bhejo"}
                  </button>
                )}
              </div>
            );
          })}
        </div>
      )}

      {waModal&&<WAModal title={`Birthday — ${waModal.customer.name}`} message={waModal.message} phone={waModal.customer.phone} name={waModal.customer.name} onClose={()=>{setSentIds(p=>[...p,waModal.customer.id]);setWaModal(null);}}/>}
    </div>
  );
}

// ─── Campaigns Tab ────────────────────────────────────────────────────────────
function CampaignsTab(){
  const [selected,setSelected]=useState(null);
  const [customMsg,setCustomMsg]=useState("");
  const [targetTag,setTargetTag]=useState("All");
  const [targetGender,setTargetGender]=useState("all");
  const [lastVisitFilter,setLastVisitFilter]=useState(0); // 0 = sabko, 7, 15, 30, 60, 90
  const [bulkModal,setBulkModal]=useState(null);

  const filteredCustomers=CUSTOMERS
    .filter(c=>targetTag==="All"?true:c.tag===targetTag)
    .filter(c=>targetGender==="all"?true:c.gender===targetGender)
    .filter(c=>lastVisitFilter===0?true:daysSince(c.lastVisitDate)>=lastVisitFilter);

  const genderCounts={
    all:CUSTOMERS.filter(c=>(targetTag==="All"?true:c.tag===targetTag)&&(lastVisitFilter===0?true:daysSince(c.lastVisitDate)>=lastVisitFilter)).length,
    male:CUSTOMERS.filter(c=>(targetTag==="All"?true:c.tag===targetTag)&&c.gender==="male"&&(lastVisitFilter===0?true:daysSince(c.lastVisitDate)>=lastVisitFilter)).length,
    female:CUSTOMERS.filter(c=>(targetTag==="All"?true:c.tag===targetTag)&&c.gender==="female"&&(lastVisitFilter===0?true:daysSince(c.lastVisitDate)>=lastVisitFilter)).length,
  };

  const categories=[...new Set(CAMPAIGNS.map(c=>c.category))];

  return(
    <div style={{padding:"16px 16px 80px"}}>
      {!selected?(
        <>
          <div style={{fontWeight:800,fontSize:14,color:T.tm,marginBottom:4}}>Ready-made Templates</div>
          <div style={{fontSize:12,color:T.ts,marginBottom:16}}>Ek tap mein festival offers, seasonal campaigns bhejo</div>
          {categories.map(cat=>(
            <div key={cat} style={{marginBottom:20}}>
              <SL>{cat}</SL>
              <div style={{display:"flex",flexDirection:"column",gap:8}}>
                {CAMPAIGNS.filter(c=>c.category===cat).map(camp=>(
                  <div key={camp.id} onClick={()=>{setSelected(camp);setCustomMsg(camp.template);}} style={{background:T.surface,border:`2px solid ${T.border}`,borderRadius:14,padding:"14px",cursor:"pointer",display:"flex",alignItems:"center",gap:12,transition:"all 0.15s"}} onMouseOver={e=>{e.currentTarget.style.borderColor=camp.color;}} onMouseOut={e=>{e.currentTarget.style.borderColor=T.border;}}>
                    <div style={{width:48,height:48,borderRadius:14,background:camp.colorLight,border:`2px solid ${camp.colorBorder}`,display:"flex",alignItems:"center",justifyContent:"center",fontSize:22,flexShrink:0}}>{camp.icon}</div>
                    <div style={{flex:1}}>
                      <div style={{fontWeight:800,fontSize:14,color:T.text}}>{camp.name}</div>
                      <div style={{fontSize:12,color:T.ts,marginTop:2}}>{camp.desc}</div>
                    </div>
                    <div style={{color:T.tg,fontSize:18}}>›</div>
                  </div>
                ))}
              </div>
            </div>
          ))}
          <SL>Custom</SL>
          <div style={{background:T.surface,border:`2px dashed ${T.border}`,borderRadius:14,padding:"20px",textAlign:"center"}}>
            <div style={{fontSize:28,marginBottom:8}}>✍️</div>
            <div style={{fontWeight:800,fontSize:14,color:T.tm,marginBottom:4}}>Apna message likho</div>
            <div style={{fontSize:12,color:T.ts,marginBottom:12}}>Custom campaign banaao</div>
            <button onClick={()=>{
              const defaultMsg=`🙏 *Namaste {name}!*\n\n[Apna message yahan likho]\n\n✨ *Offer:*\n[Offer details yahan]\n\n📅 Abhi book karo: Reply *BOOK*\n\n_💈 - Sharma's Salon_`;
              setSelected({id:"custom",name:"Custom Campaign",icon:"✍️",color:T.green,colorLight:T.gl,colorBorder:T.gm,template:defaultMsg,desc:"Apna custom message"});
              setCustomMsg(defaultMsg);
            }} style={{padding:"10px 24px",background:T.green,border:"none",borderRadius:12,color:"#fff",fontFamily:"inherit",fontSize:13,fontWeight:800,cursor:"pointer"}}>✍️ Custom Message Likho</button>
          </div>
        </>
      ):(
        <>
          <button onClick={()=>setSelected(null)} style={{display:"flex",alignItems:"center",gap:6,background:"none",border:`1.5px solid ${T.border}`,borderRadius:10,padding:"7px 12px",fontFamily:"inherit",fontSize:12,fontWeight:700,color:T.ts,cursor:"pointer",marginBottom:16}}>← Back to Templates</button>
          <div style={{background:selected.colorLight,border:`2px solid ${selected.colorBorder}`,borderRadius:14,padding:"14px",marginBottom:16,display:"flex",alignItems:"center",gap:12}}>
            <div style={{fontSize:28}}>{selected.icon}</div>
            <div><div style={{fontWeight:900,fontSize:15,color:T.text}}>{selected.name}</div><div style={{fontSize:12,color:T.ts,marginTop:2}}>{selected.desc}</div></div>
          </div>

          {/* Target */}
          <div style={{marginBottom:16}}>
            <SL>Target Audience</SL>
            <div style={{display:"flex",gap:7,marginBottom:8}}>
              {["All","VIP","Regular","New"].map(opt=>(
                <button key={opt} onClick={()=>setTargetTag(opt)} style={{flex:1,padding:"9px 4px",borderRadius:10,border:`2px solid ${targetTag===opt?T.green:T.border}`,background:targetTag===opt?T.gl:T.surface,color:targetTag===opt?T.gd:T.ts,fontSize:12,fontWeight:800,cursor:"pointer",fontFamily:"inherit"}}>
                  {opt}<br/><span style={{fontSize:10,fontWeight:600}}>{opt==="All"?CUSTOMERS.length:CUSTOMERS.filter(c=>c.tag===opt).length} log</span>
                </button>
              ))}
            </div>
            <GenderFilter value={targetGender} onChange={setTargetGender} counts={genderCounts}/>
          </div>

          <LastVisitInput
            value={lastVisitFilter}
            onChange={(v)=>setLastVisitFilter(v)}
            totalCount={CUSTOMERS.filter(c=>(targetTag==="All"?true:c.tag===targetTag)&&(targetGender==="all"?true:c.gender===targetGender)).length}
            matchCount={filteredCustomers.length}
          />

          {/* Campaign name — only for custom */}
          {selected.id==="custom"&&(
            <div style={{marginBottom:16}}>
              <SL>Campaign Name</SL>
              <input
                value={selected.name==="Custom Campaign"?"":selected.name}
                onChange={e=>setSelected(s=>({...s,name:e.target.value||"Custom Campaign"}))}
                placeholder="e.g. Holi Offer, Summer Sale, Vacation Closing…"
                style={IS}
                onFocus={e=>e.target.style.borderColor=T.green}
                onBlur={e=>e.target.style.borderColor=T.border}
              />
            </div>
          )}

          {/* Message editor */}
          <div style={{marginBottom:16}}>
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:8}}>
              <SL>Message</SL>
              <div style={{fontSize:11,color:T.ts}}><span style={{color:T.bt,fontWeight:700}}>{"{name}"}</span> → auto replace</div>
            </div>
            <textarea value={customMsg||selected.template} onChange={e=>setCustomMsg(e.target.value)} rows={10} style={{...IS,resize:"vertical",lineHeight:1.7,fontSize:13,padding:"12px"}} onFocus={e=>e.target.style.borderColor=T.green} onBlur={e=>e.target.style.borderColor=T.border}/>
          </div>

          {/* Preview */}
          <div style={{marginBottom:16}}>
            <SL>Preview</SL>
            <div style={{background:"#e5ddd5",borderRadius:14,padding:14}}>
              <div style={{background:"#fff",borderRadius:"10px 10px 10px 3px",padding:"10px 12px",maxWidth:"90%"}}>
                <pre style={{margin:0,fontFamily:"inherit",fontSize:11,lineHeight:1.7,color:T.text,whiteSpace:"pre-wrap",wordBreak:"break-word"}}>{(customMsg||selected.template).replace(/{name}/g,CUSTOMERS[0].name)}</pre>
              </div>
            </div>
          </div>

          {/* Send */}
          <div style={{background:T.surface,border:`2px solid ${T.border}`,borderRadius:14,padding:"14px"}}>
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:12}}>
              <div style={{fontWeight:800,fontSize:13,color:T.text}}>{filteredCustomers.length} customers</div>
              <div style={{fontSize:11,color:T.ts}}>{targetTag} · {targetGender==="all"?"All":targetGender==="male"?"👨 Male":"👩 Female"}</div>
            </div>
            <div style={{display:"flex",gap:8,marginBottom:10}}>
              {filteredCustomers.slice(0,5).map(c=>(
                <div key={c.id} style={{width:32,height:32,borderRadius:10,background:c.color+"22",border:`1.5px solid ${c.color}44`,display:"flex",alignItems:"center",justifyContent:"center",fontSize:11,fontWeight:900,color:c.color}}>{c.avatar}</div>
              ))}
              {filteredCustomers.length>5&&<div style={{width:32,height:32,borderRadius:10,background:T.sub,border:`1.5px solid ${T.border}`,display:"flex",alignItems:"center",justifyContent:"center",fontSize:10,fontWeight:800,color:T.ts}}>+{filteredCustomers.length-5}</div>}
            </div>
            <button onClick={()=>setBulkModal(true)} style={{width:"100%",padding:"13px",background:T.wa,border:"none",borderRadius:12,color:"#fff",fontFamily:"inherit",fontSize:14,fontWeight:800,cursor:"pointer",boxShadow:"0 4px 14px rgba(37,211,102,0.3)",display:"flex",alignItems:"center",justifyContent:"center",gap:8}}>
              💬 Send Campaign — {filteredCustomers.length} customers
            </button>
          </div>
        </>
      )}
      {bulkModal&&<BulkSendModal customers={filteredCustomers} template={customMsg||selected?.template||""} title={selected?.name||"Custom"} onClose={()=>setBulkModal(null)}/>}
    </div>
  );
}

// ─── Main Export ──────────────────────────────────────────────────────────────
export default function EngagementCenter(){
  const [tab,setTab]=useState("reengagement");
  const lostCount=CUSTOMERS.filter(c=>daysSince(c.lastVisitDate)>=30).length;
  const bdayCount=CUSTOMERS.filter(c=>getBirthdayInfo(c.dob)).length;
  const TABS=[{id:"reengagement",label:"Re-engage",icon:"💫"},{id:"birthday",label:"Birthdays",icon:"🎂"},{id:"campaigns",label:"Campaigns",icon:"📢"}];
  return(
    <div style={{height:"100vh",display:"flex",flexDirection:"column",fontFamily:"system-ui,-apple-system,sans-serif",color:T.text,background:T.bg,overflow:"hidden"}}>
      <div style={{background:T.surface,borderBottom:`2px solid ${T.border}`,padding:"10px 16px",display:"flex",alignItems:"center",justifyContent:"space-between",flexShrink:0,boxShadow:"0 2px 8px rgba(0,0,0,0.05)"}}>
        <div style={{display:"flex",alignItems:"center",gap:8}}><div style={{width:30,height:30,background:T.green,borderRadius:8,display:"flex",alignItems:"center",justifyContent:"center",fontSize:15}}>✂️</div><span style={{fontWeight:900,fontSize:14}}>Snip<span style={{color:T.green}}>Book</span></span></div>
        <div style={{fontWeight:800,fontSize:12,color:T.ts}}>Engagement Center</div>
        <div style={{display:"flex",gap:6}}>
          {lostCount>0&&<div style={{background:T.yellow,border:`1.5px solid ${T.yb}`,borderRadius:20,padding:"3px 8px",fontSize:10,fontWeight:800,color:T.yt}}>{lostCount} inactive</div>}
          {bdayCount>0&&<div style={{background:T.red,border:`1.5px solid ${T.rb}`,borderRadius:20,padding:"3px 8px",fontSize:10,fontWeight:800,color:T.rt}}>🎂 {bdayCount}</div>}
        </div>
      </div>
      <div style={{background:T.surface,borderBottom:`2px solid ${T.border}`,display:"flex",flexShrink:0}}>
        {TABS.map(t=>(
          <div key={t.id} onClick={()=>setTab(t.id)} style={{flex:1,padding:"11px 4px",display:"flex",flexDirection:"column",alignItems:"center",gap:3,cursor:"pointer",borderBottom:`3px solid ${tab===t.id?T.green:"transparent"}`,transition:"all 0.15s"}}>
            <span style={{fontSize:18}}>{t.icon}</span>
            <span style={{fontSize:11,fontWeight:800,color:tab===t.id?T.green:T.tf}}>{t.label}</span>
          </div>
        ))}
      </div>
      <div style={{flex:1,overflowY:"auto"}}>
        {tab==="reengagement"&&<ReengagementTab/>}
        {tab==="birthday"&&<BirthdayTab/>}
        {tab==="campaigns"&&<CampaignsTab/>}
      </div>
    </div>
  );
}
