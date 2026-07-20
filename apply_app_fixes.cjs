const fs = require("fs");
const file = "src/App.jsx";
let c = fs.readFileSync(file, "utf8");

// FIX 1: Remove 2 duplicate New Client boxes
// Find the pattern after the closing }) of the isNewClient block
const dupMark1 = "        )}\n       \n          <div style={{background:\"#eff6ff\",border:\"1.5px solid #93c5fd\"";
const dupEnd = "           )} ";

if(c.includes(dupMark1)){
  // Find position of first dup
  const pos = c.indexOf(dupMark1);
  // Find end position
  const endPos = c.indexOf(dupEnd, pos);
  if(endPos !== -1){
    const removed = c.slice(pos + 9, endPos + dupEnd.length);
    c = c.slice(0, pos + 9) + "\n        " + c.slice(endPos + dupEnd.length);
    console.log("✅ Fix 1: Duplicate boxes removed");
  } else {
    console.log("❌ Fix 1: Could not find end marker");
  }
} else {
  // Try alternative - just count occurrences of the duplicate block signature
  const sig = "New Client Detected! Add details:";
  const count = (c.match(new RegExp(sig, 'g')) || []).length;
  console.log("Found '" + sig + "' " + count + " times");
  if(count === 3){
    // Find 2nd and 3rd occurrence and remove their parent divs
    let idx = c.indexOf(sig);
    idx = c.indexOf(sig, idx + 1); // 2nd occurrence
    // Walk back to find opening <div
    let divStart = c.lastIndexOf('<div style={{background:"#eff6ff"', idx);
    let idx3 = c.indexOf(sig, idx + 1); // 3rd occurrence
    let divEnd = c.indexOf(')} ', idx3);
    if(divStart !== -1 && divEnd !== -1){
      c = c.slice(0, divStart) + c.slice(divEnd + 3);
      console.log("✅ Fix 1b: Duplicates removed");
    }
  }
}

// FIX 2: Add pending notification system
const botLine = "  const [botChatUnread,setBotChatUnread]=useState(0);";
if(c.includes(botLine)){
  const notifCode = `  const pendingQueueRef=useRef([]);
  const showingPopupRef=useRef(false);
  const [activePendingPopup,setActivePendingPopup]=useState(null);
  const [pendingNotifs,setPendingNotifs]=useState([]);
  const [pendingNotifsUnread,setPendingNotifsUnread]=useState(0);

  function showNextPendingPopup(){
    if(showingPopupRef.current||pendingQueueRef.current.length===0)return;
    showingPopupRef.current=true;
    const next=pendingQueueRef.current.shift();
    setActivePendingPopup(next);
  }

  useEffect(()=>{
    async function checkPendingLogs(){
      try{
        const{data}=await supabase.from("work_logs").select("id,client_name,service,amount,created_at").eq("salon_id",user.id).eq("status","pending").order("created_at",{ascending:false}).limit(20);
        if(!data||data.length===0){setPendingNotifs([]);setPendingNotifsUnread(0);return;}
        let seenIds=[];
        try{seenIds=JSON.parse(localStorage.getItem("snipbook_pending_seen_"+user.id)||"[]");}catch(e){seenIds=[];}
        const newLogs=data.filter(l=>!seenIds.includes(l.id));
        setPendingNotifs(data);
        setPendingNotifsUnread(newLogs.length);
        if(newLogs.length>0){
          const queuedIds=pendingQueueRef.current.map(x=>x.id);
          const toQueue=newLogs.filter(l=>!queuedIds.includes(l.id));
          if(toQueue.length>0){
            pendingQueueRef.current=[...pendingQueueRef.current,...toQueue];
            showNextPendingPopup();
          }
        }
      }catch(e){}
    }
    checkPendingLogs();
    const interval=setInterval(checkPendingLogs,30000);
    return()=>clearInterval(interval);
  },[user.id]);

  function closePendingPopup(log){
    let seenIds=[];
    try{seenIds=JSON.parse(localStorage.getItem("snipbook_pending_seen_"+user.id)||"[]");}catch(e){seenIds=[];}
    if(!seenIds.includes(log.id))seenIds.push(log.id);
    localStorage.setItem("snipbook_pending_seen_"+user.id,JSON.stringify(seenIds));
    setActivePendingPopup(null);
    showingPopupRef.current=false;
    setTimeout(()=>showNextPendingPopup(),400);
  }

  const [botChatUnread,setBotChatUnread]=useState(0);`;
  c = c.replace(botLine, notifCode);
  console.log("✅ Fix 2: Pending notification system added");
} else {
  console.log("❌ Fix 2: botChatUnread not found");
}

// FIX 3: Bell badge - update to show pending count too
const badge1 = '{unreadCount>0&&<div style={{position:"absolute",top:0,right:0,width:13,height:13,borderRadius:"50%",background:"#ef4444",display:"flex",alignItems:"center",justifyContent:"center",fontSize:7,fontWeight:900,color:"#fff",border:"2px solid #fff"}}>{unreadCount>9?"9+":unreadCount}</div>}';
const badge2 = '{(unreadCount+pendingNotifsUnread)>0&&<div style={{position:"absolute",top:0,right:0,width:13,height:13,borderRadius:"50%",background:"#ef4444",display:"flex",alignItems:"center",justifyContent:"center",fontSize:7,fontWeight:900,color:"#fff",border:"2px solid #fff"}}>{(unreadCount+pendingNotifsUnread)>9?"9+":(unreadCount+pendingNotifsUnread)}</div>}';
if(c.includes(badge1)){
  c = c.replace(badge1, badge2);
  console.log("✅ Fix 3: Bell badge updated");
} else {
  console.log("❌ Fix 3: Bell badge not found");
}

// FIX 4: handleBell - also clear pending seen
const hb1 = "function handleBell(){setShowNotifs(v=>!v);try{localStorage.setItem(`notif_seen_ids_${user.id}`,JSON.stringify(notifications.map(n=>n.id)));}catch(e){}setUnreadCount(0);prevUnreadRef.current=0;}";
const hb2 = `function handleBell(){
    setShowNotifs(v=>!v);
    try{localStorage.setItem("notif_seen_ids_"+user.id,JSON.stringify(notifications.map(n=>n.id)));}catch(e){}
    setUnreadCount(0);prevUnreadRef.current=0;
    try{localStorage.setItem("snipbook_pending_seen_"+user.id,JSON.stringify(pendingNotifs.map(l=>l.id)));}catch(e){}
    setPendingNotifsUnread(0);
  }`;
if(c.includes(hb1)){
  c = c.replace(hb1, hb2);
  console.log("✅ Fix 4: handleBell updated");
} else {
  console.log("❌ Fix 4: handleBell exact match failed");
}

// FIX 5: Add pending section in notif panel
const notifEmpty = "notifications.length===0?(<div style={{padding:32,textAlign:\"center\",color:TP.ts}}>No notifications</div>):notifications.map";
const notifNew = `pendingNotifs.length>0&&<div>
              <div style={{padding:"10px 16px 4px",fontSize:11,fontWeight:800,color:"#a16207"}}>PENDING APPROVALS</div>
              {pendingNotifs.map((l,i)=>{
                let seenIds=[];try{seenIds=JSON.parse(localStorage.getItem("snipbook_pending_seen_"+user.id)||"[]");}catch(e){}
                const isUnread=!seenIds.includes(l.id);
                return(<div key={i} onClick={()=>{setScreen("staff");setShowNotifs(false);window.__openStaffPending=true;}} style={{padding:"12px 16px",borderBottom:"2px solid "+TP.bg,background:isUnread?"#fefce8":"#fff",cursor:"pointer",display:"flex",alignItems:"center",gap:10}}>
                  <div style={{width:38,height:38,borderRadius:12,background:"#fef3c7",border:"1.5px solid #fde68a",display:"flex",alignItems:"center",justifyContent:"center",fontSize:18,flexShrink:0}}>⏳</div>
                  <div style={{flex:1}}><div style={{fontWeight:800,fontSize:13,color:TP.text}}>{l.client_name} — {l.service}</div><div style={{fontSize:11,color:"#a16207",marginTop:2}}>₹{(l.amount||0).toLocaleString("en-IN")} · Pending</div></div>
                  {isUnread&&<div style={{width:8,height:8,borderRadius:"50%",background:"#f59e0b",flexShrink:0}}/>}
                </div>);
              })}
            </div>}
            {pendingNotifs.length>0&&notifications.length>0&&<div style={{padding:"8px 16px 4px",fontSize:11,fontWeight:800,color:TP.ts}}>BOOKINGS</div>}
            {notifications.length===0&&pendingNotifs.length===0?(<div style={{padding:32,textAlign:"center",color:TP.ts}}>No notifications</div>):notifications.map`;
if(c.includes(notifEmpty)){
  c = c.replace(notifEmpty, notifNew);
  console.log("✅ Fix 5: Pending notif section added");
} else {
  console.log("❌ Fix 5: Notif empty state not found");
}

// FIX 6: Green popup at end
const endMark = "{showRevenueDetail&&<RevenueDetailModal rows={todayWorkLogs} staffMap={staffMap} onClose={()=>setShowRevenueDetail(false)}/>";
const popupCode = `{showRevenueDetail&&<RevenueDetailModal rows={todayWorkLogs} staffMap={staffMap} onClose={()=>setShowRevenueDetail(false)}/>}
      {activePendingPopup&&(
        <div style={{position:"fixed",top:"calc(70px + env(safe-area-inset-top,0px))",left:12,right:12,zIndex:998,background:"#f0fdf4",border:"1.5px solid #86efac",borderRadius:14,padding:"13px 14px",boxShadow:"0 4px 20px rgba(0,0,0,0.15)",display:"flex",alignItems:"flex-start",gap:12}}>
          <div style={{width:38,height:38,borderRadius:11,background:"#d1fae5",border:"1.5px solid #6ee7b7",display:"flex",alignItems:"center",justifyContent:"center",fontSize:18,flexShrink:0}}>✅</div>
          <div style={{flex:1,minWidth:0}}>
            <div style={{fontWeight:800,fontSize:13,color:"#065f46"}}>Naya work log added!</div>
            <div style={{fontSize:12,color:"#047857",marginTop:2,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{activePendingPopup.client_name} · {activePendingPopup.service} · ₹{(activePendingPopup.amount||0).toLocaleString("en-IN")}</div>
            <div style={{fontSize:11,color:"#059669",marginTop:1}}>Approval chahiye ⏳</div>
          </div>
          <button onClick={()=>closePendingPopup(activePendingPopup)} style={{background:"none",border:"none",cursor:"pointer",color:"#059669",fontSize:18,padding:0,lineHeight:1,flexShrink:0,fontWeight:700}}>✕</button>
        </div>
      )}`;
// Replace only first occurrence (the closing one)
const endPos = c.lastIndexOf(endMark);
if(endPos !== -1){
  c = c.slice(0, endPos) + popupCode + c.slice(endPos + endMark.length);
  console.log("✅ Fix 6: Green popup added");
} else {
  console.log("❌ Fix 6: End marker not found");
}

// Final check
const checks = ["pendingQueueRef","checkPendingLogs","closePendingPopup","pendingNotifsUnread","PENDING APPROVALS","activePendingPopup&&","Naya work log added"];
let allOk = true;
console.log("\n── Verification ──");
checks.forEach(s=>{
  if(c.includes(s)) console.log("✓ "+s);
  else{console.log("✗ MISSING: "+s);allOk=false;}
});

fs.writeFileSync(file, c);
console.log("\n✅ App.jsx written! Lines: "+c.split("\n").length);
