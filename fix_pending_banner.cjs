// Run: node fix_pending_banner.cjs
// Location: C:\Users\Om\snipbook\
const fs = require("fs");

const filePath = "src/screens/StaffManagement.jsx";
let code = fs.readFileSync(filePath, "utf8");

// ── FIX: Pending banner hamesha dikhao, even when pendingCount === 0 ──
// Old: {pendingCount>0&&(  <div onClick...  )}
// New: Always show, but different style when 0

const old1 = `      {/* Pending Banner */}
      {pendingCount>0&&(
        <div onClick={()=>setShowPending(true)} style={{background:"#fef9c3",borderBottom:"1.5px solid #fde68a",padding:"12px 18px",display:"flex",alignItems:"center",justifyContent:"space-between",cursor:"pointer",flexShrink:0}}>
          <div style={{display:"flex",alignItems:"center",gap:10}}>
            <span style={{fontSize:20}}>⏳</span>
            <div>
              <div style={{fontSize:14,fontWeight:800,color:"#a16207"}}>{pendingCount} Pending Log{pendingCount>1?"s":""} — Approval Chahiye</div>
              <div style={{fontSize:11,color:"#a16207",marginTop:2}}>Tap karke approve/reject karo</div>
            </div>
          </div>
          <span style={{fontSize:16,color:"#a16207"}}>›</span>
        </div>
      )}`;

const new1 = `      {/* Pending Banner — always visible */}
      <div onClick={()=>setShowPending(true)} style={{background:pendingCount>0?"#fef9c3":"#f5f3ff",borderBottom:`1.5px solid ${pendingCount>0?"#fde68a":"#e0d8ff"}`,padding:"11px 18px",display:"flex",alignItems:"center",justifyContent:"space-between",cursor:"pointer",flexShrink:0}}>
        <div style={{display:"flex",alignItems:"center",gap:10}}>
          <span style={{fontSize:18}}>{pendingCount>0?"⏳":"✅"}</span>
          <div>
            <div style={{fontSize:13,fontWeight:800,color:pendingCount>0?"#a16207":"#5b3fc4"}}>
              {pendingCount>0?`${pendingCount} Pending Log${pendingCount>1?"s":""} — Approval Chahiye`:"Sab Approve Ho Gaya"}
            </div>
            <div style={{fontSize:11,color:pendingCount>0?"#a16207":"#9b8ec4",marginTop:1}}>
              {pendingCount>0?"Tap karke approve/reject karo":"Approval settings manage karo →"}
            </div>
          </div>
        </div>
        <span style={{fontSize:16,color:pendingCount>0?"#a16207":"#9b8ec4"}}>›</span>
      </div>`;

if (code.includes(old1)) {
  code = code.replace(old1, new1);
  console.log("✅ Patch 1 applied: Banner always visible");
} else {
  // Try without the comment
  const old1b = `      {pendingCount>0&&(
        <div onClick={()=>setShowPending(true)} style={{background:"#fef9c3",borderBottom:"1.5px solid #fde68a",padding:"12px 18px",display:"flex",alignItems:"center",justifyContent:"space-between",cursor:"pointer",flexShrink:0}}>
          <div style={{display:"flex",alignItems:"center",gap:10}}>
            <span style={{fontSize:20}}>⏳</span>
            <div>
              <div style={{fontSize:14,fontWeight:800,color:"#a16207"}}>{pendingCount} Pending Log{pendingCount>1?"s":""} — Approval Chahiye</div>
              <div style={{fontSize:11,color:"#a16207",marginTop:2}}>Tap karke approve/reject karo</div>
            </div>
          </div>
          <span style={{fontSize:16,color:"#a16207"}}>›</span>
        </div>
      )}`;
  if (code.includes(old1b)) {
    code = code.replace(old1b, new1);
    console.log("✅ Patch 1b applied: Banner always visible");
  } else {
    // Find the banner section by searching for key parts
    const bannerIdx = code.indexOf("Approval Chahiye");
    if (bannerIdx !== -1) {
      console.log("Found 'Approval Chahiye' at index:", bannerIdx);
      console.log("Context (200 chars before):", code.slice(Math.max(0, bannerIdx-200), bannerIdx+100));
    } else {
      console.log("❌ Could not find pending banner section");
    }
  }
}

// ── Verify ──
if (code.includes("Approval settings manage karo")) {
  fs.writeFileSync(filePath, code);
  console.log(`\n✅ StaffManagement.jsx fixed! Lines: ${code.split("\n").length}`);
  console.log("\nNow run:");
  console.log("git add -A && git commit -m \"fix: pending banner always visible + approval toggle accessible\" && git push origin dev");
  console.log("git checkout master && git merge dev && git push origin master && git checkout dev");
} else {
  console.log("\n❌ Fix not applied — check the context above");
}
