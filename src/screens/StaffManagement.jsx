import { useState, useEffect } from "react";
import { supabase } from "../lib/supabase";

const TP={purple:"#2d1b69",purpleMid:"#5b3fc4",purpleLight:"#ede9fe",border:"#e0d8ff",bg:"#f4f2ff",text:"#1a0a4a",tm:"#4a3580",ts:"#9b8ec4",tf:"#c4b8f0",green:"#22c55e",gl:"#e8fdf0",gm:"#bbf7d0",gd:"#16a34a",red:"#fff0f0",rb:"#fca5a5",rt:"#dc2626",yellow:"#fef9c3",yb:"#fde68a",yt:"#a16207",inp:"#fafbff",surface:"#ffffff"};
const IS={width:"100%",padding:"10px 12px",border:`1.5px solid ${TP.border}`,borderRadius:10,fontSize:13,fontFamily:"inherit",outline:"none",background:TP.inp,boxSizing:"border-box",color:TP.text};
const CARD_COLORS=[{cardBg:"#ede9fe",cardColor:"#5b3fc4",avBg:"#c4b8f0",avColor:"#2d1b69"},{cardBg:"#fef9c3",cardColor:"#a16207",avBg:"#fde68a",avColor:"#a16207"},{cardBg:"#f0fdf4",cardColor:"#16a34a",avBg:"#bbf7d0",avColor:"#16a34a"},{cardBg:"#fff0f6",cardColor:"#db2777",avBg:"#fbcfe8",avColor:"#db2777"},{cardBg:"#eff6ff",cardColor:"#2563eb",avBg:"#bfdbfe",avColor:"#1d4ed8"},{cardBg:"#fff7ed",cardColor:"#ea580c",avBg:"#fed7aa",avColor:"#ea580c"},{cardBg:"#f0fdfa",cardColor:"#0d9488",avBg:"#99f6e4",avColor:"#0f766e"}];
const today=new Date().toISOString().slice(0,10);
const thisMonthStart=new Date().toISOString().slice(0,8)+"01";

function initials(n){return(n||"").split(" ").map(w=>w[0]).join("").substring(0,2).toUpperCase();}
function fc(n){return"₹"+Number(n||0).toLocaleString("en-IN");}

function PageHeader({title,subtitle,onBack,rightAction}){
  return(
    <div style={{background:"#fff",borderBottom:`1.5px solid ${TP.border}`,padding:"12px 16px",display:"flex",alignItems:"center",gap:12,flexShrink:0}}>
      {onBack&&<button onClick={onBack} style={{width:32,height:32,borderRadius:9,border:`1.5px solid ${TP.border}`,background:TP.bg,display:"flex",alignItems:"center",justifyContent:"center",cursor:"pointer",fontSize:14,color:TP.purpleMid}}>←</button>}
      <div style={{flex:1,minWidth:0}}>
        <div style={{fontSize:15,fontWeight:900,color:TP.purple}}>{title}</div>
        {subtitle&&<div style={{fontSize:11,color:TP.ts,marginTop:1}}>{subtitle}</div>}
      </div>
      {rightAction}
    </div>
  );
}

// ─── Add/Edit Staff Modal ──────────────────────────────────────────────────────
function StaffModal({staff,salonId,onSave,onClose}){
  const [name,setName]=useState(staff?.name||"");
  const [role,setRole]=useState(staff?.role||"Hairstylist");
  const [pin,setPin]=useState(staff?.pin||"");
  const [saving,setSaving]=useState(false);
  const [error,setError]=useState("");
  const roles=["Hairstylist","Beautician","Nail Artist","Makeup Artist","Receptionist","Manager","Other"];

  async function save(){
    if(!name.trim()||!pin||pin.length!==4){setError("Name aur 4-digit PIN zaroori hai!");return;}
    setSaving(true);setError("");
    try{
      if(staff?.id){
        await supabase.from("staff").update({name:name.trim(),role,pin}).eq("id",staff.id);
        onSave({...staff,name:name.trim(),role,pin});
      }else{
        const{data,error:e}=await supabase.from("staff").insert({salon_id:salonId,name:name.trim(),role,pin}).select().single();
        if(e)throw e;
        onSave(data);
      }
      onClose();
    }catch(e){setError(e.message||"Error aayi");setSaving(false);}
  }

  return(
    <div onClick={e=>e.target===e.currentTarget&&onClose()} style={{position:"fixed",inset:0,background:"rgba(0,0,0,0.5)",zIndex:200,display:"flex",alignItems:"flex-end"}}>
      <div style={{background:"#fff",borderRadius:"20px 20px 0 0",padding:"20px 18px 36px",width:"100%",maxHeight:"90vh",overflowY:"auto"}}>
        <div style={{width:36,height:4,background:TP.border,borderRadius:2,margin:"0 auto 16px"}}/>
        <div style={{fontWeight:900,fontSize:16,color:TP.purple,marginBottom:16}}>{staff?.id?"✏️ Edit Staff":"➕ Add Staff"}</div>
        <div style={{marginBottom:12}}>
          <div style={{fontSize:12,fontWeight:800,color:TP.tm,marginBottom:5}}>Name *</div>
          <input style={IS} placeholder="e.g. Priya Sharma" value={name} onChange={e=>setName(e.target.value)} autoFocus/>
        </div>
        <div style={{marginBottom:12}}>
          <div style={{fontSize:12,fontWeight:800,color:TP.tm,marginBottom:5}}>Role</div>
          <select style={{...IS,cursor:"pointer"}} value={role} onChange={e=>setRole(e.target.value)}>
            {roles.map(r=><option key={r}>{r}</option>)}
          </select>
        </div>
        <div style={{marginBottom:16}}>
          <div style={{fontSize:12,fontWeight:800,color:TP.tm,marginBottom:5}}>4-digit PIN *</div>
          <input style={IS} type="password" placeholder="••••" maxLength={4} value={pin} onChange={e=>setPin(e.target.value.replace(/\D/g,"").slice(0,4))}/>
        </div>
        {error&&<div style={{background:TP.red,border:`1.5px solid ${TP.rb}`,borderRadius:9,padding:"9px 12px",marginBottom:12,fontSize:12,color:TP.rt,fontWeight:600}}>⚠️ {error}</div>}
        <div style={{display:"flex",gap:10}}>
          <button onClick={onClose} style={{flex:1,padding:12,border:`2px solid ${TP.border}`,borderRadius:12,background:"#fff",fontFamily:"inherit",fontSize:13,fontWeight:700,cursor:"pointer",color:TP.tm}}>Cancel</button>
          <button onClick={save} disabled={saving} style={{flex:2,padding:12,border:"none",borderRadius:12,background:TP.purpleMid,color:"#fff",fontFamily:"inherit",fontSize:13,fontWeight:800,cursor:"pointer"}}>{saving?"Saving...":"✓ Save"}</button>
        </div>
      </div>
    </div>
  );
}

// ─── Staff Card ────────────────────────────────────────────────────────────────
function StaffCard({member,idx,salonId,onEdit,attendance,onAttendanceChange}){
  const cc=CARD_COLORS[idx%CARD_COLORS.length];
  const [monthStats,setMonthStats]=useState({present:0,absent:0,services:0,pending:0,revenue:0});
  const isOnline=member.is_online||false;
  const todayAtt=!!(attendance[today]||{})[member.id];
  const [toggling,setToggling]=useState(false);

  useEffect(()=>{
    async function load(){
      if(!salonId)return;
      const[{data:logs},{data:att}]=await Promise.all([
        supabase.from("work_logs").select("amount,status").eq("salon_id",salonId).eq("staff_id",member.id).gte("date",thisMonthStart),
        supabase.from("attendance").select("is_present,date").eq("salon_id",salonId).eq("staff_id",member.id).gte("date",thisMonthStart)
      ]);
      const present=(att||[]).filter(a=>a.is_present).length;
      const daysGone=new Date().getDate();
      const services=(logs||[]).filter(l=>l.status!=="pending").length;
      const pending=(logs||[]).filter(l=>l.status==="pending").length;
      const revenue=(logs||[]).filter(l=>l.status==="approved"||!l.status).reduce((s,l)=>s+(l.amount||0),0);
      setMonthStats({present,absent:daysGone-present,services,pending,revenue});
    }
    load();
  },[salonId,member.id]);

  async function toggleAttendance(){
    if(toggling)return;
    setToggling(true);
    const newVal=!todayAtt;
    try{
      await supabase.from("attendance").upsert({salon_id:salonId,staff_id:member.id,date:today,is_present:newVal},{onConflict:"salon_id,staff_id,date"});
      onAttendanceChange(member.id,newVal);
    }catch(e){console.error(e);}
    setToggling(false);
  }

  return(
    <div style={{background:"#fff",borderRadius:14,border:`1.5px solid ${TP.border}`,marginBottom:10,overflow:"hidden"}}>
      {/* Header */}
      <div style={{background:cc.cardBg,padding:"10px 12px",display:"flex",alignItems:"center",gap:10}}>
        <div style={{position:"relative",flexShrink:0}}>
          <div style={{width:36,height:36,borderRadius:11,background:cc.avBg,display:"flex",alignItems:"center",justifyContent:"center",fontWeight:900,fontSize:13,color:cc.avColor}}>{initials(member.name)}</div>
          {isOnline&&<div style={{position:"absolute",bottom:-1,right:-1,width:9,height:9,borderRadius:"50%",background:"#22c55e",border:"1.5px solid #fff"}}/>}
        </div>
        <div style={{flex:1,minWidth:0}}>
          <div style={{fontSize:13,fontWeight:900,color:cc.cardColor}}>{member.name}</div>
          <div style={{fontSize:10,color:TP.ts,marginTop:1}}>{member.role}</div>
        </div>
        {/* Attendance Toggle */}
        <div style={{display:"flex",alignItems:"center",gap:6,marginRight:6}}>
          <span style={{fontSize:9,color:todayAtt?"#16a34a":"#dc2626",fontWeight:700}}>{todayAtt?"Present":"Absent"}</span>
          <div onClick={toggleAttendance} style={{width:30,height:17,borderRadius:9,background:todayAtt?"#22c55e":"#d1d5db",position:"relative",cursor:toggling?"wait":"pointer",flexShrink:0,opacity:toggling?0.6:1}}>
            <div style={{width:11,height:11,borderRadius:"50%",background:"#fff",position:"absolute",top:3,left:todayAtt?16:3,transition:"left 0.2s",boxShadow:"0 1px 2px rgba(0,0,0,0.15)"}}/>
          </div>
        </div>
        <button onClick={()=>onEdit(member)} style={{padding:"5px 10px",background:"#fff",border:`1.5px solid ${TP.border}`,borderRadius:8,fontSize:11,fontWeight:700,cursor:"pointer",color:TP.purpleMid,fontFamily:"inherit",flexShrink:0}}>✏️ Edit</button>
      </div>
      {/* Compact Stats */}
      <div style={{padding:"8px 12px",display:"flex",gap:0}}>
        {[
          {icon:"✅",val:monthStats.present,label:"Present",c:"#16a34a",bg:"#f0fdf4"},
          {icon:"❌",val:monthStats.absent,label:"Absent",c:"#dc2626",bg:"#fff5f5"},
          {icon:"✂️",val:monthStats.services,label:"Services",c:"#5b3fc4",bg:"#f5f3ff"},
          {icon:"⏳",val:monthStats.pending,label:"Pending",c:"#a16207",bg:"#fef9c3"},
        ].map((s,i)=>(
          <div key={s.label} style={{flex:1,textAlign:"center",padding:"6px 4px",background:s.bg,borderRadius:8,margin:i<3?"0 3px 0 0":"0"}}>
            <div style={{fontSize:13,fontWeight:900,color:s.c,lineHeight:1}}>{s.val}</div>
            <div style={{fontSize:8,color:TP.ts,marginTop:2}}>{s.label}</div>
          </div>
        ))}
      </div>
      {/* Revenue row */}
      <div style={{padding:"0 12px 10px"}}>
        <div style={{background:"#f0fdf4",border:"1px solid #bbf7d0",borderRadius:8,padding:"6px 10px",display:"flex",alignItems:"center",justifyContent:"space-between"}}>
          <span style={{fontSize:10,color:"#6b7280"}}>Monthly Revenue</span>
          <span style={{fontSize:13,fontWeight:900,color:"#16a34a"}}>{fc(monthStats.revenue)}</span>
        </div>
      </div>
    </div>
  );
}

// ─── Pending Logs Tab ──────────────────────────────────────────────────────────
function PendingTab({salonId,staffList,onApprove,onReject}){
  const [pending,setPending]=useState([]);
  const [loading,setLoading]=useState(true);
  const [processing,setProcessing]=useState(null);
  const [rejectModal,setRejectModal]=useState(null);
  const [reason,setReason]=useState("");

  useEffect(()=>{
    async function load(){
      const{data}=await supabase.from("work_logs").select("*").eq("salon_id",salonId).eq("status","pending").order("date",{ascending:false});
      setPending(data||[]);setLoading(false);
    }
    if(salonId)load();
  },[salonId]);

  async function approve(log){
    setProcessing(log.id);
    await supabase.from("work_logs").update({status:"approved"}).eq("id",log.id);
    setPending(prev=>prev.filter(l=>l.id!==log.id));
    if(onApprove)onApprove(log);
    setProcessing(null);
  }

  async function reject(log,rej_reason){
    setProcessing(log.id);
    await supabase.from("work_logs").update({status:"rejected",rejection_reason:rej_reason}).eq("id",log.id);
    setPending(prev=>prev.filter(l=>l.id!==log.id));
    if(onReject)onReject(log);
    setProcessing(null);setRejectModal(null);setReason("");
  }

  function getStaffName(staffId){return staffList.find(s=>String(s.id)===String(staffId))?.name||"Staff";}

  if(loading)return<div style={{textAlign:"center",padding:"40px 0",color:TP.ts}}>Loading...</div>;
  if(pending.length===0)return(
    <div style={{textAlign:"center",padding:"48px 24px"}}>
      <div style={{fontSize:40,marginBottom:12}}>✅</div>
      <div style={{fontSize:15,fontWeight:800,color:TP.purple,marginBottom:6}}>Sab approved hai!</div>
      <div style={{fontSize:12,color:TP.ts}}>Koi pending log nahi hai abhi</div>
    </div>
  );

  return(
    <div style={{padding:"12px 16px"}}>
      {rejectModal&&(
        <div style={{position:"fixed",inset:0,background:"rgba(0,0,0,0.5)",zIndex:300,display:"flex",alignItems:"flex-end"}}>
          <div style={{background:"#fff",borderRadius:"20px 20px 0 0",padding:"20px 18px 36px",width:"100%"}}>
            <div style={{width:36,height:4,background:TP.border,borderRadius:2,margin:"0 auto 16px"}}/>
            <div style={{fontWeight:900,fontSize:15,color:TP.rt,marginBottom:12}}>❌ Reject Log?</div>
            <div style={{fontSize:12,color:TP.ts,marginBottom:12}}>{rejectModal.client_name} · {rejectModal.service} · {fc(rejectModal.amount)}</div>
            <textarea style={{...IS,resize:"none",minHeight:80,fontFamily:"inherit"}} placeholder="Reason (optional)..." value={reason} onChange={e=>setReason(e.target.value)}/>
            <div style={{display:"flex",gap:10,marginTop:12}}>
              <button onClick={()=>{setRejectModal(null);setReason("");}} style={{flex:1,padding:12,border:`2px solid ${TP.border}`,borderRadius:12,background:"#fff",fontFamily:"inherit",fontSize:13,fontWeight:700,cursor:"pointer"}}>Cancel</button>
              <button onClick={()=>reject(rejectModal,reason)} style={{flex:1,padding:12,border:"none",borderRadius:12,background:TP.rt,color:"#fff",fontFamily:"inherit",fontSize:13,fontWeight:800,cursor:"pointer"}}>Reject</button>
            </div>
          </div>
        </div>
      )}
      {pending.map(log=>(
        <div key={log.id} style={{background:"#fff",border:`1.5px solid ${TP.yb}`,borderRadius:12,padding:"11px 12px",marginBottom:10}}>
          <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:8}}>
            <div style={{flex:1}}>
              <div style={{fontSize:13,fontWeight:800,color:TP.text}}>{log.client_name}</div>
              <div style={{fontSize:11,color:TP.ts,marginTop:2}}>{log.service} · {new Date(log.date+"T00:00:00").toLocaleDateString("en-IN",{day:"numeric",month:"short"})} · {getStaffName(log.staff_id)}</div>
            </div>
            <div style={{fontSize:14,fontWeight:900,color:TP.yt}}>{fc(log.amount)}</div>
          </div>
          <div style={{display:"flex",gap:8}}>
            <button onClick={()=>approve(log)} disabled={processing===log.id} style={{flex:1,padding:"7px",background:TP.gl,border:`1.5px solid ${TP.gm}`,borderRadius:9,color:TP.gd,fontFamily:"inherit",fontSize:12,fontWeight:800,cursor:"pointer"}}>✓ Approve</button>
            <button onClick={()=>setRejectModal(log)} disabled={processing===log.id} style={{flex:1,padding:"7px",background:TP.red,border:`1.5px solid ${TP.rb}`,borderRadius:9,color:TP.rt,fontFamily:"inherit",fontSize:12,fontWeight:800,cursor:"pointer"}}>✕ Reject</button>
          </div>
        </div>
      ))}
    </div>
  );
}

// ─── Settings Tab ──────────────────────────────────────────────────────────────
function SettingsTab({salonId,approvalRequired,setApprovalRequired}){
  async function toggle(){
    const newVal=!approvalRequired;
    setApprovalRequired(newVal);
    await supabase.from("salons").update({approval_required:newVal}).eq("id",salonId);
  }
  return(
    <div style={{padding:"16px"}}>
      <div style={{background:"#fff",borderRadius:14,border:`1.5px solid ${TP.border}`,padding:"14px 16px"}}>
        <div style={{display:"flex",alignItems:"center",justifyContent:"space-between"}}>
          <div>
            <div style={{fontSize:13,fontWeight:800,color:TP.text}}>Work Log Approval</div>
            <div style={{fontSize:11,color:TP.ts,marginTop:3}}>Staff ke logs owner approve kare tabhi count hon</div>
          </div>
          <div onClick={toggle} style={{width:40,height:22,borderRadius:11,background:approvalRequired?TP.purpleMid:"#d1d5db",position:"relative",cursor:"pointer",flexShrink:0}}>
            <div style={{width:16,height:16,borderRadius:"50%",background:"#fff",position:"absolute",top:3,left:approvalRequired?21:3,transition:"left 0.2s",boxShadow:"0 1px 3px rgba(0,0,0,0.2)"}}/>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Main StaffManagement ──────────────────────────────────────────────────────
export default function StaffManagement({salonId,onBack}){
  const [tab,setTab]=useState("staff");
  const [staffList,setStaffList]=useState([]);
  const [loading,setLoading]=useState(true);
  const [showModal,setShowModal]=useState(false);
  const [editingStaff,setEditingStaff]=useState(null);
  const [approvalRequired,setApprovalRequired]=useState(false);
  const [pendingCount,setPendingCount]=useState(0);
  const [attendance,setAttendance]=useState({});

  useEffect(()=>{
    async function load(){
      if(!salonId)return;
      const[{data:staff},{data:salon},{data:pending},{data:att}]=await Promise.all([
        supabase.from("staff").select("*").eq("salon_id",salonId),
        supabase.from("salons").select("approval_required").eq("id",salonId).single(),
        supabase.from("work_logs").select("id",{count:"exact"}).eq("salon_id",salonId).eq("status","pending"),
        supabase.from("attendance").select("*").eq("salon_id",salonId).eq("date",today)
      ]);
      setStaffList(staff||[]);
      setApprovalRequired(salon?.approval_required||false);
      setPendingCount(pending?.length||0);
      const attMap={[today]:{}};
      (att||[]).forEach(a=>{attMap[today][a.staff_id]=a.is_present;});
      setAttendance(attMap);
      setLoading(false);
    }
    load();
  },[salonId]);

  function handleAttendanceChange(staffId,val){
    setAttendance(prev=>({...prev,[today]:{...(prev[today]||{}),[staffId]:val}}));
  }

  function handleSaveStaff(s){
    setStaffList(prev=>{
      const idx=prev.findIndex(x=>x.id===s.id);
      if(idx>=0){const n=[...prev];n[idx]=s;return n;}
      return[...prev,s];
    });
  }

  if(loading)return<div style={{flex:1,display:"flex",alignItems:"center",justifyContent:"center",color:TP.ts}}>Loading...</div>;

  return(
    <div style={{height:"100%",display:"flex",flexDirection:"column",background:TP.bg,fontFamily:"-apple-system,system-ui,sans-serif"}}>
      <PageHeader
        title="Staff Management"
        subtitle="Manage your team"
        onBack={onBack}
        rightAction={<button onClick={()=>{setEditingStaff(null);setShowModal(true);}} style={{padding:"7px 14px",background:TP.purpleMid,border:"none",borderRadius:10,color:"#fff",fontFamily:"inherit",fontSize:12,fontWeight:800,cursor:"pointer"}}>+ Add Staff</button>}
      />

      {/* Tabs */}
      <div style={{background:"#fff",borderBottom:`1.5px solid ${TP.border}`,display:"flex",flexShrink:0}}>
        {[{id:"staff",icon:"👥",label:"Staff"},{id:"pending",icon:"⏳",label:`Pending${pendingCount>0?` (${pendingCount})`:""}`},{id:"settings",icon:"⚙️",label:"Settings"}].map(t=>(
          <div key={t.id} onClick={()=>setTab(t.id)} style={{flex:1,padding:"10px 4px",textAlign:"center",cursor:"pointer",borderBottom:`2.5px solid ${tab===t.id?TP.purpleMid:"transparent"}`,display:"flex",flexDirection:"column",alignItems:"center",gap:2}}>
            <span style={{fontSize:15}}>{t.icon}</span>
            <span style={{fontSize:10,fontWeight:tab===t.id?800:600,color:tab===t.id?TP.purpleMid:TP.ts}}>{t.label}</span>
          </div>
        ))}
      </div>

      <div style={{flex:1,overflowY:"auto",WebkitOverflowScrolling:"touch"}}>
        {tab==="staff"&&(
          <div style={{padding:"12px 14px"}}>
            {staffList.length===0
              ?<div style={{textAlign:"center",padding:"48px 24px"}}>
                <div style={{fontSize:40,marginBottom:12}}>👥</div>
                <div style={{fontSize:15,fontWeight:800,color:TP.purple,marginBottom:6}}>Koi staff nahi</div>
                <button onClick={()=>{setEditingStaff(null);setShowModal(true);}} style={{padding:"10px 24px",background:TP.purpleMid,border:"none",borderRadius:12,color:"#fff",fontFamily:"inherit",fontSize:13,fontWeight:800,cursor:"pointer"}}>+ Add First Staff</button>
              </div>
              :staffList.map((s,i)=>(
                <StaffCard key={s.id} member={s} idx={i} salonId={salonId}
                  onEdit={m=>{setEditingStaff(m);setShowModal(true);}}
                  attendance={attendance}
                  onAttendanceChange={handleAttendanceChange}
                />
              ))
            }
          </div>
        )}
        {tab==="pending"&&<PendingTab salonId={salonId} staffList={staffList} onApprove={()=>setPendingCount(p=>Math.max(0,p-1))} onReject={()=>setPendingCount(p=>Math.max(0,p-1))}/>}
        {tab==="settings"&&<SettingsTab salonId={salonId} approvalRequired={approvalRequired} setApprovalRequired={setApprovalRequired}/>}
      </div>

      {showModal&&<StaffModal staff={editingStaff} salonId={salonId} onSave={handleSaveStaff} onClose={()=>{setShowModal(false);setEditingStaff(null);}}/>}
    </div>
  );
}
