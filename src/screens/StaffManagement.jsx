import { useState, useEffect } from "react";
import { supabase } from "../lib/supabase";

const N = {
  purple:"#2d1b69", mid:"#5b3fc4", light:"#ede9fe",
  bg:"#f8f7ff", white:"#fff", text:"#0f0a2e",
  muted:"#6b7280", border:"#e5e7eb", green:"#16a34a",
  gl:"#f0fdf4", gm:"#bbf7d0", red:"#fff0f0", rb:"#fca5a5", rt:"#dc2626",
  yellow:"#fef9c3", yb:"#fde68a", yt:"#a16207",
};

const today = new Date().toISOString().slice(0,10);
const thisMonthStart = new Date().toISOString().slice(0,8)+"01";

function fc(n){return "₹"+Number(n||0).toLocaleString("en-IN");}
function fd(d){if(!d)return "";if(d.length===10&&d.includes("-")){return new Date(d+"T00:00:00").toLocaleDateString("en-IN",{day:"numeric",month:"short",year:"numeric"});}return d;}

// ─── Pending Logs Approval Panel ─────────────────────────────────────────────
function PendingLogsPanel({salonId, staffMap, onUpdate}){
  const[logs,setLogs]=useState([]);
  const[loading,setLoading]=useState(true);
  const[rejectModal,setRejectModal]=useState(null);
  const[rejectReason,setRejectReason]=useState("");

  async function loadPending(){
    setLoading(true);
    const{data}=await supabase.from("work_logs").select("*").eq("salon_id",salonId).eq("status","pending").order("created_at",{ascending:false});
    setLogs(data||[]);
    setLoading(false);
  }

  useEffect(()=>{loadPending();},[salonId]);

  async function approve(log){
    await supabase.from("work_logs").update({status:"approved"}).eq("id",log.id);
    setLogs(prev=>prev.filter(l=>l.id!==log.id));
    onUpdate&&onUpdate();
  }

  async function reject(log, reason){
    await supabase.from("work_logs").update({status:"rejected",rejection_reason:reason||""}).eq("id",log.id);
    setLogs(prev=>prev.filter(l=>l.id!==log.id));
    setRejectModal(null);
    setRejectReason("");
    onUpdate&&onUpdate();
  }

  if(loading)return(<div style={{padding:24,textAlign:"center",color:N.muted,fontSize:13}}>Loading...</div>);

  return(
    <div style={{padding:"0 0 24px"}}>
      {logs.length===0
        ?<div style={{background:N.white,border:`1px dashed ${N.border}`,borderRadius:14,padding:32,textAlign:"center",margin:"12px 16px"}}>
          <div style={{fontSize:32,marginBottom:8}}>✅</div>
          <div style={{fontWeight:700,fontSize:14,color:N.muted}}>No pending logs!</div>
          <div style={{fontSize:12,color:N.muted,marginTop:4}}>All work logs are approved</div>
        </div>
        :logs.map(log=>(
          <div key={log.id} style={{background:N.white,borderRadius:14,margin:"8px 16px 0",border:`1.5px solid ${N.yb}`,overflow:"hidden"}}>
            <div style={{background:N.yellow,padding:"10px 14px",display:"flex",alignItems:"center",justifyContent:"space-between"}}>
              <div style={{fontSize:12,fontWeight:800,color:N.yt}}>⏳ Pending Approval</div>
              <div style={{fontSize:11,color:N.yt}}>{fd(log.date)}</div>
            </div>
            <div style={{padding:"10px 14px",display:"flex",alignItems:"center",justifyContent:"space-between",gap:10}}>
              <div style={{flex:1,minWidth:0}}>
                <div style={{fontWeight:800,fontSize:13,color:N.text}}>{log.client_name}</div>
                <div style={{fontSize:11,color:N.muted,marginTop:2}}>✂️ {log.service} · {fc(log.amount)} · 👤 {staffMap?.[log.staff_id]||"Staff"}</div>
              </div>
              <div style={{display:"flex",gap:6,flexShrink:0}}>
                <button onClick={()=>approve(log)} style={{width:36,height:36,borderRadius:10,background:N.green,border:"none",color:"#fff",fontSize:18,cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center"}}>✓</button>
                <button onClick={()=>setRejectModal(log)} style={{width:36,height:36,borderRadius:10,background:N.red,border:"1.5px solid "+N.rb,color:N.rt,fontSize:18,cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center"}}>✕</button>
              </div>
            </div>
          </div>
        ))
      }
      {rejectModal&&(
        <div onClick={()=>setRejectModal(null)} style={{position:"fixed",inset:0,background:"rgba(0,0,0,0.5)",zIndex:900,display:"flex",alignItems:"flex-end"}}>
          <div onClick={e=>e.stopPropagation()} style={{background:N.white,borderRadius:"20px 20px 0 0",padding:"20px 18px 36px",width:"100%"}}>
            <div style={{width:36,height:4,background:N.border,borderRadius:2,margin:"0 auto 16px"}}/>
            <div style={{fontWeight:900,fontSize:16,color:N.text,marginBottom:4}}>❌ Reject Log</div>
            <div style={{fontSize:12,color:N.muted,marginBottom:16}}>{rejectModal.client_name} · {rejectModal.service}</div>
            <div style={{marginBottom:16}}>
              <div style={{fontSize:12,fontWeight:700,color:N.muted,marginBottom:6}}>Reason (optional)</div>
              <textarea value={rejectReason} onChange={e=>setRejectReason(e.target.value)} rows={3} placeholder="e.g. Wrong amount entered..." style={{width:"100%",padding:"11px 13px",border:`2px solid ${N.border}`,borderRadius:11,fontSize:13,fontFamily:"inherit",outline:"none",resize:"vertical",boxSizing:"border-box"}}/>
            </div>
            <div style={{display:"flex",gap:10}}>
              <button onClick={()=>setRejectModal(null)} style={{flex:1,padding:12,border:`2px solid ${N.border}`,borderRadius:12,background:N.white,fontFamily:"inherit",fontSize:13,fontWeight:700,cursor:"pointer",color:N.muted}}>Cancel</button>
              <button onClick={()=>reject(rejectModal,rejectReason)} style={{flex:1,padding:12,background:N.rt,border:"none",borderRadius:12,color:"#fff",fontFamily:"inherit",fontSize:13,fontWeight:800,cursor:"pointer"}}>Reject</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Staff Card ───────────────────────────────────────────────────────────────
function StaffCard({staff,idx,salonId,onEdit,showRevenue}){
  const[logs,setLogs]=useState([]);
  const[att,setAtt]=useState({present:0,absent:0});
  const[loading,setLoading]=useState(true);

  const COLORS=[
    {bg:"#ede9fe",color:"#5b3fc4",av:"#c4b8f0"},{bg:"#fef9c3",color:"#a16207",av:"#fde68a"},
    {bg:"#f0fdf4",color:"#16a34a",av:"#bbf7d0"},{bg:"#fff0f6",color:"#db2777",av:"#fbcfe8"},
    {bg:"#eff6ff",color:"#2563eb",av:"#bfdbfe"},{bg:"#fff7ed",color:"#ea580c",av:"#fed7aa"},
  ];
  const c=COLORS[idx%COLORS.length];

  useEffect(()=>{
    async function load(){
      setLoading(true);
      const[logsRes,attRes]=await Promise.all([
        supabase.from("work_logs").select("amount,date,status").eq("salon_id",salonId).eq("staff_id",staff.id).gte("date",thisMonthStart),
        supabase.from("attendance").select("is_present").eq("salon_id",salonId).eq("staff_id",staff.id).gte("date",thisMonthStart)
      ]);
      setLogs(logsRes.data||[]);
      const attData=attRes.data||[];
      setAtt({present:attData.filter(a=>a.is_present).length,absent:attData.filter(a=>!a.is_present).length});
      setLoading(false);
    }
    load();
  },[staff.id,salonId]);

  const monthRev=logs.reduce((s,l)=>s+(l.amount||0),0);
  const monthLogs=logs.length;
  const pendingCount=logs.filter(l=>l.status==="pending").length;

  const isPresent=true; // simplified for display

  return(
    <div style={{background:N.white,borderRadius:16,margin:"0 16px 12px",border:`1px solid ${N.border}`,overflow:"hidden",boxShadow:"0 1px 4px rgba(0,0,0,0.05)"}}>
      <div style={{background:`linear-gradient(135deg,${c.bg},${c.av}20)`,padding:"14px 16px",display:"flex",alignItems:"center",justifyContent:"space-between"}}>
        <div style={{display:"flex",alignItems:"center",gap:12}}>
          <div style={{width:44,height:44,borderRadius:14,background:c.av,display:"flex",alignItems:"center",justifyContent:"center",fontSize:15,fontWeight:800,color:c.color,flexShrink:0,position:"relative"}}>
            {(staff.name||"?").slice(0,2).toUpperCase()}
            <div style={{position:"absolute",bottom:-2,right:-2,width:12,height:12,borderRadius:"50%",background:N.green,border:"2px solid #fff"}}/>
          </div>
          <div>
            <div style={{fontSize:15,fontWeight:800,color:N.text}}>{staff.name}</div>
            <div style={{fontSize:11,color:N.muted,marginTop:1}}>{staff.role}</div>
          </div>
        </div>
        <div style={{display:"flex",gap:8,alignItems:"center"}}>
          {pendingCount>0&&<div style={{background:N.yellow,border:`1px solid ${N.yb}`,borderRadius:20,padding:"3px 10px",fontSize:11,fontWeight:800,color:N.yt}}>⏳ {pendingCount}</div>}
          <button onClick={()=>onEdit(staff)} style={{background:"#fff",border:`1px solid ${N.border}`,borderRadius:8,padding:"5px 10px",fontSize:11,fontWeight:700,color:N.muted,cursor:"pointer",fontFamily:"inherit"}}>✏️ Edit</button>
        </div>
      </div>
      {loading
        ?<div style={{padding:16,textAlign:"center",color:N.muted,fontSize:12}}>Loading...</div>
        :<div style={{padding:"12px 16px"}}>
          <div style={{display:"flex",gap:6,marginBottom:8}}>
            {[
              {icon:"✅",val:att.present,label:"Present",color:N.green},
              {icon:"❌",val:att.absent,label:"Absent",color:N.rt},
              {icon:"✂️",val:monthLogs,label:"Services",color:N.mid},
              showRevenue?{icon:"💰",val:fc(monthRev),label:"Rev",color:N.green}:{icon:"⏳",val:pendingCount,label:"Pending",color:N.yt},
            ].map(s=>(
              <div key={s.label} style={{flex:1,background:N.bg,borderRadius:8,padding:"5px 2px",textAlign:"center"}}>
                <div style={{fontSize:11}}>{s.icon}</div>
                <div style={{fontSize:11,fontWeight:800,color:s.color,marginTop:1}}>{s.val}</div>
                <div style={{fontSize:8,color:N.muted,marginTop:1}}>{s.label}</div>
              </div>
            ))}
          </div>
        </div>}
    </div>
  );
}

// ─── Edit Staff Modal ─────────────────────────────────────────────────────────
function EditStaffModal({staff,onSave,onClose}){
  const[form,setForm]=useState({name:staff.name||"",role:staff.role||"Hairstylist",phone:staff.phone||"",pin:staff.pin||"",salary:String(staff.salary||""),gender_capability:staff.gender_capability||"both"});
  const[saving,setSaving]=useState(false);

  async function save(){
    if(!form.name.trim()||form.pin.length!==4)return;
    setSaving(true);
    await supabase.from("staff").update({name:form.name.trim(),role:form.role,phone:form.phone,pin:form.pin,salary:Number(form.salary)||0,gender_capability:form.gender_capability}).eq("id",staff.id);
    onSave({...staff,...form,salary:Number(form.salary)||0});
    setSaving(false);
  }

  const inp={width:"100%",padding:"11px 13px",border:`2px solid ${N.border}`,borderRadius:11,fontSize:14,fontFamily:"inherit",outline:"none",background:"#fafbff",boxSizing:"border-box",color:N.text};

  return(
    <div onClick={onClose} style={{position:"fixed",inset:0,background:"rgba(0,0,0,0.5)",zIndex:800,display:"flex",alignItems:"flex-end"}}>
      <div onClick={e=>e.stopPropagation()} style={{background:N.white,borderRadius:"20px 20px 0 0",padding:"20px 18px 36px",width:"100%",maxHeight:"90vh",overflowY:"auto"}}>
        <div style={{width:36,height:4,background:N.border,borderRadius:2,margin:"0 auto 16px"}}/>
        <div style={{fontWeight:900,fontSize:16,color:N.text,marginBottom:16}}>✏️ Edit Staff</div>
        {[{label:"Full Name *",key:"name",type:"text",ph:"e.g. Rahul Sharma"},{label:"Role",key:"role",type:"text",ph:"e.g. Hairstylist"},{label:"Phone",key:"phone",type:"tel",ph:"9876543210"},{label:"4-digit PIN *",key:"pin",type:"password",ph:"••••"},{label:"Monthly Salary (₹)",key:"salary",type:"number",ph:"e.g. 15000"}].map(f=>(
          <div key={f.key} style={{marginBottom:12}}>
            <div style={{fontSize:12,fontWeight:800,color:N.muted,marginBottom:5}}>{f.label}</div>
            <input type={f.type} value={form[f.key]} onChange={e=>setForm(p=>({...p,[f.key]:f.key==="phone"?e.target.value.replace(/\D/g,"").slice(0,10):f.key==="pin"?e.target.value.replace(/\D/g,"").slice(0,4):e.target.value}))} placeholder={f.ph} style={inp} maxLength={f.key==="pin"?4:undefined}/>
          </div>
        ))}
        <div style={{marginBottom:18}}>
          <div style={{fontSize:12,fontWeight:800,color:N.muted,marginBottom:8}}>Gender Capability</div>
          <div style={{display:"flex",gap:8}}>
            {[{id:"male",label:"👨 Male"},{id:"female",label:"👩 Female"},{id:"both",label:"👥 Both"}].map(g=>(
              <button key={g.id} onClick={()=>setForm(p=>({...p,gender_capability:g.id}))} style={{flex:1,padding:"9px 4px",borderRadius:10,border:`2px solid ${form.gender_capability===g.id?N.mid:N.border}`,background:form.gender_capability===g.id?N.light:"#fff",color:form.gender_capability===g.id?N.mid:N.muted,fontFamily:"inherit",fontSize:12,fontWeight:700,cursor:"pointer"}}>{g.label}</button>
            ))}
          </div>
        </div>
        <div style={{display:"flex",gap:10}}>
          <button onClick={onClose} style={{flex:1,padding:12,border:`2px solid ${N.border}`,borderRadius:12,background:N.white,fontFamily:"inherit",fontSize:13,fontWeight:700,cursor:"pointer",color:N.muted}}>Cancel</button>
          <button onClick={save} disabled={saving||!form.name.trim()||form.pin.length!==4} style={{flex:2,padding:12,background:form.name.trim()&&form.pin.length===4?N.mid:"#d1d5db",border:"none",borderRadius:12,color:"#fff",fontFamily:"inherit",fontSize:13,fontWeight:800,cursor:"pointer"}}>{saving?"Saving...":"✓ Save Changes"}</button>
        </div>
      </div>
    </div>
  );
}

// ─── Add Staff Modal ──────────────────────────────────────────────────────────
function AddStaffModal({salonId,onSave,onClose}){
  const[form,setForm]=useState({name:"",role:"Hairstylist",phone:"",pin:"",salary:"",gender_capability:"both"});
  const[saving,setSaving]=useState(false);
  const[error,setError]=useState("");

  async function save(){
    if(!form.name.trim()||form.pin.length!==4){setError("Name and 4-digit PIN required");return;}
    setSaving(true);
    const{data,error:err}=await supabase.from("staff").insert({salon_id:salonId,name:form.name.trim(),role:form.role,phone:form.phone,pin:form.pin,salary:Number(form.salary)||0,gender_capability:form.gender_capability}).select().single();
    if(err){setError(err.message);setSaving(false);return;}
    onSave(data);
    setSaving(false);
  }

  const inp={width:"100%",padding:"11px 13px",border:`2px solid ${N.border}`,borderRadius:11,fontSize:14,fontFamily:"inherit",outline:"none",background:"#fafbff",boxSizing:"border-box",color:N.text};

  return(
    <div onClick={onClose} style={{position:"fixed",inset:0,background:"rgba(0,0,0,0.5)",zIndex:800,display:"flex",alignItems:"flex-end"}}>
      <div onClick={e=>e.stopPropagation()} style={{background:N.white,borderRadius:"20px 20px 0 0",padding:"20px 18px 36px",width:"100%",maxHeight:"90vh",overflowY:"auto"}}>
        <div style={{width:36,height:4,background:N.border,borderRadius:2,margin:"0 auto 16px"}}/>
        <div style={{fontWeight:900,fontSize:16,color:N.text,marginBottom:16}}>➕ Add Staff Member</div>
        {error&&<div style={{background:N.red,border:`1.5px solid ${N.rb}`,borderRadius:10,padding:"10px 13px",marginBottom:14,fontSize:12,color:N.rt,fontWeight:700}}>⚠️ {error}</div>}
        {[{label:"Full Name *",key:"name",type:"text",ph:"e.g. Rahul Sharma"},{label:"Role",key:"role",type:"text",ph:"e.g. Hairstylist"},{label:"Phone",key:"phone",type:"tel",ph:"9876543210"},{label:"4-digit PIN *",key:"pin",type:"password",ph:"••••"},{label:"Monthly Salary (₹)",key:"salary",type:"number",ph:"e.g. 15000"}].map(f=>(
          <div key={f.key} style={{marginBottom:12}}>
            <div style={{fontSize:12,fontWeight:800,color:N.muted,marginBottom:5}}>{f.label}</div>
            <input type={f.type} value={form[f.key]} onChange={e=>setForm(p=>({...p,[f.key]:f.key==="phone"?e.target.value.replace(/\D/g,"").slice(0,10):f.key==="pin"?e.target.value.replace(/\D/g,"").slice(0,4):e.target.value}))} placeholder={f.ph} style={inp} maxLength={f.key==="pin"?4:undefined} autoFocus={f.key==="name"}/>
          </div>
        ))}
        <div style={{marginBottom:18}}>
          <div style={{fontSize:12,fontWeight:800,color:N.muted,marginBottom:8}}>Gender Capability</div>
          <div style={{display:"flex",gap:8}}>
            {[{id:"male",label:"👨 Male"},{id:"female",label:"👩 Female"},{id:"both",label:"👥 Both"}].map(g=>(
              <button key={g.id} onClick={()=>setForm(p=>({...p,gender_capability:g.id}))} style={{flex:1,padding:"9px 4px",borderRadius:10,border:`2px solid ${form.gender_capability===g.id?N.mid:N.border}`,background:form.gender_capability===g.id?N.light:"#fff",color:form.gender_capability===g.id?N.mid:N.muted,fontFamily:"inherit",fontSize:12,fontWeight:700,cursor:"pointer"}}>{g.label}</button>
            ))}
          </div>
        </div>
        <div style={{display:"flex",gap:10}}>
          <button onClick={onClose} style={{flex:1,padding:12,border:`2px solid ${N.border}`,borderRadius:12,background:N.white,fontFamily:"inherit",fontSize:13,fontWeight:700,cursor:"pointer",color:N.muted}}>Cancel</button>
          <button onClick={save} disabled={saving} style={{flex:2,padding:12,background:N.mid,border:"none",borderRadius:12,color:"#fff",fontFamily:"inherit",fontSize:13,fontWeight:800,cursor:"pointer"}}>{saving?"Adding...":"✓ Add Staff"}</button>
        </div>
      </div>
    </div>
  );
}

// ─── Main StaffManagement ─────────────────────────────────────────────────────
export default function StaffManagement({user,currentUser,showRevenue=true,onBack}){
  const[staff,setStaff]=useState([]);
  const[loading,setLoading]=useState(true);
  const[tab,setTab]=useState("staff");
  const[editStaff,setEditStaff]=useState(null);
  const[showAdd,setShowAdd]=useState(false);
  const[approvalRequired,setApprovalRequired]=useState(false);
  const[pendingCount,setPendingCount]=useState(0);
  const activeUser=user||currentUser;
  const salonId=activeUser?.id||activeUser?.salon_id;

  const staffMap={};
  staff.forEach(s=>{staffMap[s.id]=s.name;});

  async function loadData(){
    setLoading(true);
    const[staffRes,salonRes,pendingRes]=await Promise.all([
      supabase.from("staff").select("*").eq("salon_id",salonId).order("name"),
      supabase.from("salons").select("approval_required").eq("id",salonId).single(),
      supabase.from("work_logs").select("id",{count:"exact"}).eq("salon_id",salonId).eq("status","pending")
    ]);
    setStaff(staffRes.data||[]);
    setApprovalRequired(salonRes.data?.approval_required||false);
    setPendingCount(pendingRes.count||0);
    setLoading(false);
  }

  useEffect(()=>{if(salonId)loadData();},[salonId]);

  async function toggleApproval(){
    const newVal=!approvalRequired;
    setApprovalRequired(newVal);
    await supabase.from("salons").update({approval_required:newVal}).eq("id",salonId);
  }

  const TABS=[
    {id:"staff",label:"Staff",icon:"👥"},
    {id:"pending",label:`Pending${pendingCount>0?` (${pendingCount})`:""}`,icon:"⏳"},
    {id:"settings",label:"Settings",icon:"⚙️"},
  ];

  return(
    <div style={{height:"100%",display:"flex",flexDirection:"column",background:N.bg,fontFamily:"system-ui,-apple-system,sans-serif"}}>
      {/* Header */}
      <div style={{background:N.white,padding:"12px 16px 10px",display:"flex",alignItems:"center",justifyContent:"space-between",borderBottom:`1px solid ${N.border}`,flexShrink:0}}>
        <div style={{display:"flex",alignItems:"center",gap:10}}>
          {onBack&&<button onClick={onBack} style={{width:30,height:30,borderRadius:8,border:`1px solid ${N.border}`,background:N.bg,fontSize:14,cursor:"pointer",color:N.mid,display:"flex",alignItems:"center",justifyContent:"center"}}>←</button>}
          <div>
            <div style={{fontWeight:800,fontSize:16,color:N.text}}>Staff Management</div>
            <div style={{fontSize:11,color:N.muted,marginTop:1}}>Manage your team performance</div>
          </div>
        </div>
        <button onClick={()=>setShowAdd(true)} style={{background:N.mid,color:"#fff",border:"none",borderRadius:10,padding:"8px 14px",fontSize:12,fontWeight:700,cursor:"pointer",fontFamily:"inherit"}}>+ Add Staff</button>
      </div>

      {/* Tabs */}
      <div style={{background:N.white,borderBottom:`1px solid ${N.border}`,display:"flex",flexShrink:0}}>
        {TABS.map(t=>(
          <div key={t.id} onClick={()=>setTab(t.id)} style={{flex:1,padding:"10px 4px 8px",display:"flex",flexDirection:"column",alignItems:"center",gap:2,cursor:"pointer",borderBottom:`2.5px solid ${tab===t.id?N.mid:"transparent"}`}}>
            <span style={{fontSize:16}}>{t.icon}</span>
            <span style={{fontSize:10,fontWeight:tab===t.id?800:500,color:tab===t.id?N.mid:N.muted}}>{t.label}</span>
          </div>
        ))}
      </div>

      {/* Content */}
      <div style={{flex:1,overflowY:"auto",paddingTop:8}}>
        {loading
          ?<div style={{padding:32,textAlign:"center",color:N.muted}}>Loading...</div>
          :tab==="staff"
          ?<>
            {/* Summary */}
            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:10,padding:"8px 16px 4px"}}>
              {[{icon:"👥",val:staff.length,label:"Total Staff",color:N.mid},{icon:"✅",val:staff.length,label:"Active",color:N.green},{icon:"⏳",val:pendingCount,label:"Pending",color:N.yt}].map(s=>(
                <div key={s.label} style={{background:N.white,borderRadius:12,padding:"12px 8px",textAlign:"center",border:`1px solid ${N.border}`}}>
                  <div style={{fontSize:18}}>{s.icon}</div>
                  <div style={{fontSize:18,fontWeight:800,color:s.color,marginTop:4}}>{s.val}</div>
                  <div style={{fontSize:10,color:N.muted,marginTop:2}}>{s.label}</div>
                </div>
              ))}
            </div>
            {staff.map((s,i)=>(
              <StaffCard key={s.id} staff={s} idx={i} salonId={salonId} onEdit={setEditStaff} showRevenue={showRevenue}/>
            ))}
            {staff.length===0&&<div style={{padding:32,textAlign:"center",color:N.muted}}><div style={{fontSize:32,marginBottom:8}}>👥</div><div style={{fontWeight:700}}>No staff yet</div><div style={{fontSize:12,marginTop:4}}>Add your first team member!</div></div>}
          </>
          :tab==="pending"
          ?<PendingLogsPanel salonId={salonId} staffMap={staffMap} onUpdate={loadData}/>
          :<div style={{padding:"12px 16px"}}>
            <div style={{background:N.white,borderRadius:14,border:`1px solid ${N.border}`,overflow:"hidden"}}>
              <div style={{padding:"14px 16px",borderBottom:`1px solid ${N.border}`}}>
                <div style={{fontSize:14,fontWeight:800,color:N.text,marginBottom:2}}>⚙️ Approval Settings</div>
                <div style={{fontSize:12,color:N.muted}}>Require owner approval for staff work logs</div>
              </div>
              <div style={{padding:"14px 16px",display:"flex",alignItems:"center",justifyContent:"space-between"}}>
                <div>
                  <div style={{fontSize:13,fontWeight:700,color:N.text}}>Work Log Approval</div>
                  <div style={{fontSize:11,color:N.muted,marginTop:2}}>{approvalRequired?"Staff logs need your approval":"Staff logs auto-approved"}</div>
                </div>
                <div onClick={toggleApproval} style={{width:44,height:24,borderRadius:12,background:approvalRequired?N.mid:"#d1d5db",position:"relative",cursor:"pointer",transition:"background 0.2s",flexShrink:0}}>
                  <div style={{width:18,height:18,borderRadius:"50%",background:"#fff",position:"absolute",top:3,left:approvalRequired?23:3,transition:"left 0.2s",boxShadow:"0 1px 3px rgba(0,0,0,0.2)"}}/>
                </div>
              </div>
              {approvalRequired&&<div style={{padding:"0 16px 14px",fontSize:12,color:N.yt,background:N.yellow,margin:"0 16px 14px",borderRadius:10,padding:"10px 12px"}}>⚠️ Staff work logs will require your approval before they appear in reports</div>}
            </div>
          </div>
        }
      </div>

      {editStaff&&<EditStaffModal staff={editStaff} onSave={updated=>{setStaff(prev=>prev.map(s=>s.id===updated.id?updated:s));setEditStaff(null);}} onClose={()=>setEditStaff(null)}/>}
      {showAdd&&<AddStaffModal salonId={salonId} onSave={newStaff=>{setStaff(prev=>[...prev,newStaff]);setShowAdd(false);}} onClose={()=>setShowAdd(false)}/>}
    </div>
  );
}
 