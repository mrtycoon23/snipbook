import { useState, useMemo, useEffect, useRef } from "react";
import { supabase } from "../lib/supabase";
import CustomerHistory from "./CustomerHistoryApp";

// ─── Design Tokens ────────────────────────────────────────────────────────────
const T = {
  bg:"#f0f4f8", surface:"#ffffff", border:"#e8edf3",
  green:"#22c55e", gl:"#e8fdf0", gm:"#bbf7d0", gd:"#16a34a",
  text:"#1a1a2e", tm:"#555", ts:"#888", tf:"#aaa", tg:"#ccc",
  yellow:"#fef9c3", yb:"#fde68a", yt:"#a16207",
  blue:"#eff6ff", bb:"#93c5fd", bt:"#2563eb",
  red:"#fff0f0", rb:"#fca5a5", rt:"#dc2626",
  sub:"#f8fafc", inp:"#fafbfc", wa:"#25d366",
  dark:"#1a1a2e",
};

const IS = {
  width:"100%", padding:"11px 13px", border:`2px solid ${T.border}`,
  borderRadius:11, fontSize:14, fontFamily:"inherit", outline:"none",
  background:T.inp, boxSizing:"border-box", color:T.text,
};

const SERVICES = ["Haircut","Haircut + Beard","Hair Colour","Facial + Cleanup","Bridal Makeup","Hair Spa","Manicure/Pedicure","Beard Trim","Blow Dry","Head Massage","Waxing","Threading","Keratin","Blowdry"];
const AVATAR_COLORS = [
  {bg:"#fce7f3",text:"#9d174d"},{bg:"#dbeafe",text:"#1e40af"},
  {bg:"#d1fae5",text:"#065f46"},{bg:"#fef3c7",text:"#92400e"},{bg:"#ede9fe",text:"#4c1d95"},
];

const BUCKET = "visit photos";

const today = new Date().toISOString().slice(0,10);
const thisWeekStart = (()=>{const d=new Date();d.setDate(d.getDate()-d.getDay());return d.toISOString().slice(0,10);})();
const thisMonthStart = new Date().toISOString().slice(0,8)+"01";

function initials(name){return name.split(" ").map(w=>w[0]).join("").substring(0,2).toUpperCase();}
function avc(id){const n=typeof id==="string"?id.charCodeAt(0):(id||1);return AVATAR_COLORS[Math.abs(n-1)%AVATAR_COLORS.length];}
function fc(n){return "₹"+Number(n).toLocaleString("en-IN");}
function fd(d){return new Date(d+"T00:00:00").toLocaleDateString("en-IN",{day:"numeric",month:"short"});}

// ─── Staged photo helpers (upload happens immediately, visit row created on final save) ──
function StagedPhotoItem({photo,onRemove}){
  const [removing,setRemoving]=useState(false);
  async function handleRemove(){
    if(photo?.path){
      setRemoving(true);
      await supabase.storage.from(BUCKET).remove([photo.path]);
      setRemoving(false);
    }
    onRemove();
  }
  return(
    <div style={{position:"relative",flexShrink:0,width:80,height:80}}>
      <img src={photo.url} alt="visit" style={{width:80,height:80,borderRadius:12,objectFit:"cover",border:`2px solid ${T.border}`,display:"block"}}/>
      {removing
        ?<div style={{position:"absolute",inset:0,background:"rgba(0,0,0,0.5)",borderRadius:12,display:"flex",alignItems:"center",justifyContent:"center"}}><div style={{fontSize:10,color:"white",fontWeight:800}}>...</div></div>
        :<button onClick={handleRemove} style={{position:"absolute",top:-6,left:-6,width:20,height:20,borderRadius:"50%",background:T.rt,border:"2px solid white",color:"white",fontSize:11,cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",fontWeight:900,zIndex:10,padding:0}}>✕</button>}
    </div>
  );
}

function StagedAddPhotoBtn({tempId,onAdd}){
  const fileRef=useRef();
  const [uploading,setUploading]=useState(false);
  async function handleFileChange(e){
    const file=e.target.files[0];
    if(!file)return;
    setUploading(true);
    try{
      const ext=file.name.split(".").pop()||"jpg";
      const path=`${tempId}/photo_${Date.now()}.${ext}`;
      const {error}=await supabase.storage.from(BUCKET).upload(path,file,{upsert:true});
      if(error){setUploading(false);return;}
      const {data:urlData}=supabase.storage.from(BUCKET).getPublicUrl(path);
      onAdd({url:urlData.publicUrl,path});
    }catch(err){}
    setUploading(false);
    e.target.value="";
  }
  return(
    <div style={{flexShrink:0}}>
      <input ref={fileRef} type="file" accept="image/*" style={{display:"none"}} onChange={handleFileChange}/>
      <div onClick={()=>!uploading&&fileRef.current?.click()} style={{width:80,height:80,borderRadius:12,cursor:uploading?"wait":"pointer",background:T.sub,border:`2px dashed ${T.border}`,display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",gap:4}}>
        {uploading
          ?<div style={{fontSize:10,color:T.ts,fontWeight:700}}>Uploading...</div>
          :<><div style={{fontSize:26,color:"#5b3fc4",fontWeight:900,lineHeight:1}}>+</div><div style={{fontSize:9,color:T.ts,fontWeight:700}}>Add Photo</div></>}
      </div>
    </div>
  );
}

// ─── Add Work Log Modal ────────────────────────────────────────────────────────
function AddLogModal({staffId,salonId,isPresent,onSave,onClose}){
  const [clientName,setClientName]=useState("");
  const [clientPhone,setClientPhone]=useState("");
  const [service,setService]=useState(SERVICES[0]);
  const [amount,setAmount]=useState("");
  const [date,setDate]=useState(today);
  const [saving,setSaving]=useState(false);
  const [showNewCustomer,setShowNewCustomer]=useState(false);
  const [newCustPhone,setNewCustPhone]=useState("");
  const [newCustDob,setNewCustDob]=useState("");
  const [newCustGender,setNewCustGender]=useState("male");
  const [savingCustomer,setSavingCustomer]=useState(false);
  const [pendingLogData,setPendingLogData]=useState(null);
  const [ambiguousCustomers,setAmbiguousCustomers]=useState([]);
  const [showPickCustomer,setShowPickCustomer]=useState(false);
  const [notes,setNotes]=useState("");
  const [photos,setPhotos]=useState([]);
  const [tempVisitId]=useState(()=>`temp_${Date.now()}_${Math.random().toString(36).slice(2,8)}`);

  useEffect(()=>{
    const prevOverflow=document.body.style.overflow;
    document.body.style.overflow="hidden";
    return()=>{document.body.style.overflow=prevOverflow;};
  },[]);

  async function handleCancel(){
    if(photos.length>0){
      const paths=photos.map(p=>p.path).filter(Boolean);
      if(paths.length>0){
        try{await supabase.storage.from(BUCKET).remove(paths);}catch(e){}
      }
    }
    onClose();
  }

  if(!isPresent){
    return(
      <div onClick={e=>e.target===e.currentTarget&&onClose()} style={{position:"fixed",inset:0,background:"rgba(0,0,0,0.5)",zIndex:200,display:"flex",alignItems:"flex-end"}}>
        <div style={{background:T.surface,borderRadius:"20px 20px 0 0",padding:"20px 18px 36px",width:"100%"}}>
          <div style={{width:36,height:4,background:T.border,borderRadius:2,margin:"0 auto 16px"}}/>
          <div style={{textAlign:"center",padding:"20px 0"}}>
            <div style={{fontSize:48,marginBottom:12}}>⚠️</div>
            <div style={{fontWeight:900,fontSize:18,color:T.rt,marginBottom:8}}>Pehle Present Mark Karo!</div>
            <div style={{fontSize:13,color:T.ts,marginBottom:24}}>Aap abhi absent hain. Work log add karne se pehle attendance mark karo.</div>
            <button onClick={onClose} style={{padding:"12px 32px",background:T.green,border:"none",borderRadius:12,color:"#fff",fontFamily:"inherit",fontSize:14,fontWeight:800,cursor:"pointer"}}>Okay, Mark Karta Hoon</button>
          </div>
        </div>
      </div>
    );
  }

  async function save(){
    if(!clientName.trim()||!amount||isNaN(amount))return;
    setSaving(true);
    const base={staffId,clientName:clientName.trim(),service,amount:Number(amount),date,notes,photos};
    try{
      if(salonId){
        const phone10=clientPhone.replace(/\D/g,"").slice(0,10);
        if(phone10.length===10){
          // Phone diya hai — sabse reliable match, naam-clash ka risk hi nahi
          const{data:byPhone}=await supabase.from("customers").select("id").eq("salon_id",salonId).ilike("phone",`%${phone10}%`);
          if(byPhone&&byPhone.length>0){
            await saveLog({...base,customerId:byPhone[0].id});
          }else{
            const{data:newCust}=await supabase.from("customers").insert({salon_id:salonId,name:base.clientName,phone:phone10,gender:"male"}).select().single();
            await saveLog({...base,customerId:newCust?.id||null});
          }
          return;
        }
        // Phone nahi diya — naam se match karo
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
        return;
      }
      await saveLog(base);
    }catch(e){
      setPendingLogData(base);
      setSaving(false);
      setShowNewCustomer(true);
    }
  }

  async function saveLog(logData){
    try{
      if(salonId){
        const {data:res}=await supabase.from("work_logs").insert({
          salon_id:salonId, staff_id:logData.staffId,
          client_name:logData.clientName, service:logData.service,
          amount:logData.amount, date:logData.date
        }).select().single();
        let customerId=logData.customerId||null;
        if(!customerId){
          const{data:custMatches}=await supabase.from("customers").select("id").eq("salon_id",salonId).eq("name",logData.clientName).limit(1);
          customerId=custMatches?.[0]?.id||null;
        }
        if(customerId){
          await supabase.from("visit_history").insert({
            salon_id: salonId,
            customer_id: customerId,
            date: logData.date,
            services: [logData.service],
            stylist: logData.staffId,
            amount: logData.amount,
            notes: logData.notes||"",
            photos: logData.photos||[]
          });
        }
        if(res){
          onSave({id:res.id,staffId:res.staff_id,clientName:res.client_name,service:res.service,amount:res.amount,date:res.date});
          onClose();return;
        }
      }
      onSave({id:Date.now(),...logData});
      onClose();
    }catch(e){console.error(e);}
  }

  async function saveNewCustomer(skipDetails=false){
    setSavingCustomer(true);
    try{
      let newCustomerId=null;
      if(salonId&&!skipDetails){
        const{data:created}=await supabase.from("customers").insert({
          salon_id:salonId,
          name:pendingLogData.clientName,
          phone:newCustPhone||"",
          birthday:newCustDob||null,
          gender:newCustGender||"male",
        }).select().single();
        newCustomerId=created?.id||null;
      }
      await saveLog({...pendingLogData,customerId:newCustomerId});
    }catch(e){
      console.error(e);
      await saveLog(pendingLogData);
    }
    setSavingCustomer(false);
  }

  if(showPickCustomer&&pendingLogData){
    return(
      <div onClick={e=>e.target===e.currentTarget&&handleCancel()} style={{position:"fixed",inset:0,background:"rgba(0,0,0,0.5)",zIndex:200,display:"flex",alignItems:"flex-end"}}>
        <div style={{background:T.surface,borderRadius:"20px 20px 0 0",padding:"20px 18px 36px",width:"100%",maxHeight:"85vh",overflowY:"auto"}}>
          <div style={{width:36,height:4,background:T.border,borderRadius:2,margin:"0 auto 16px"}}/>
          <div style={{display:"flex",alignItems:"center",gap:12,marginBottom:14}}>
            <div style={{width:44,height:44,borderRadius:14,background:T.yellow,border:`2px solid ${T.yb}`,display:"flex",alignItems:"center",justifyContent:"center",fontSize:22,flexShrink:0}}>🤔</div>
            <div>
              <div style={{fontWeight:900,fontSize:15,color:T.text}}>"{pendingLogData.clientName}" naam ke {ambiguousCustomers.length} customers hain</div>
              <div style={{fontSize:12,color:T.ts,marginTop:2}}>Konsa hai? Niche se select karo</div>
            </div>
          </div>
          <div style={{display:"flex",flexDirection:"column",gap:8,marginBottom:14}}>
            {ambiguousCustomers.map(c=>(
              <button key={c.id} disabled={saving} onClick={async()=>{setShowPickCustomer(false);setSaving(true);await saveLog({...pendingLogData,customerId:c.id});}} style={{textAlign:"left",padding:"12px 14px",border:`2px solid ${T.border}`,borderRadius:12,background:T.sub,cursor:"pointer",fontFamily:"inherit"}}>
                <div style={{fontWeight:800,fontSize:14,color:T.text}}>{c.name}</div>
                <div style={{fontSize:12,color:T.ts,marginTop:2}}>{c.phone?`📱 ${c.phone}`:"📱 Phone nahi hai"}{c.last_visit?` · Last visit: ${c.last_visit}`:""}</div>
              </button>
            ))}
          </div>
          <button onClick={()=>{setShowPickCustomer(false);setShowNewCustomer(true);}} style={{width:"100%",padding:13,border:`2px solid ${T.green}`,borderRadius:12,background:T.gl,color:T.gd,fontFamily:"inherit",fontSize:14,fontWeight:800,cursor:"pointer",marginBottom:8}}>
            ➕ Yeh Bilkul Naya Customer Hai
          </button>
          <button onClick={handleCancel} style={{width:"100%",padding:12,border:`2px solid ${T.border}`,borderRadius:12,background:T.surface,fontFamily:"inherit",fontSize:13,fontWeight:700,cursor:"pointer",color:T.tm}}>Cancel</button>
        </div>
      </div>
    );
  }

  if(showNewCustomer&&pendingLogData){
    return(
      <div onClick={e=>e.target===e.currentTarget&&handleCancel()} style={{position:"fixed",inset:0,background:"rgba(0,0,0,0.5)",zIndex:200,display:"flex",alignItems:"flex-end"}}>
        <div style={{background:T.surface,borderRadius:"20px 20px 0 0",padding:"20px 18px 36px",width:"100%",maxHeight:"90vh",overflowY:"auto"}}>
          <div style={{width:36,height:4,background:T.border,borderRadius:2,margin:"0 auto 16px"}}/>
          <div style={{display:"flex",alignItems:"center",gap:12,marginBottom:16}}>
            <div style={{width:44,height:44,borderRadius:14,background:T.blue,border:`2px solid ${T.bb}`,display:"flex",alignItems:"center",justifyContent:"center",fontSize:22,flexShrink:0}}>🆕</div>
            <div>
              <div style={{fontWeight:900,fontSize:16,color:T.text}}>Naya Customer!</div>
              <div style={{fontSize:12,color:T.ts,marginTop:2}}>{pendingLogData.clientName} pehle kabhi nahi aaya</div>
            </div>
          </div>
          <div style={{background:T.gl,border:`1.5px solid ${T.gm}`,borderRadius:10,padding:"10px 13px",marginBottom:16,fontSize:12,color:T.gd,fontWeight:700}}>
            💡 Iska data save karo — owner ke dashboard mein bhi dikh jaayega!
          </div>
          <div style={{marginBottom:12}}>
            <div style={{fontSize:12,fontWeight:800,color:T.tm,marginBottom:5}}>Phone Number *</div>
            <input style={IS} type="tel" placeholder="e.g. 9876543210" value={newCustPhone} onChange={e=>setNewCustPhone(e.target.value.replace(/\D/g,"").slice(0,10))} onFocus={e=>e.target.style.borderColor=T.green} onBlur={e=>e.target.style.borderColor=T.border} autoFocus/>
          </div>
          <div style={{marginBottom:12}}>
            <div style={{fontSize:12,fontWeight:800,color:T.tm,marginBottom:5}}>Date of Birth (optional)</div>
            <input style={IS} type="date" value={newCustDob} onChange={e=>setNewCustDob(e.target.value)}/>
          </div>
          <div style={{marginBottom:16}}>
            <div style={{fontSize:12,fontWeight:800,color:T.tm,marginBottom:8}}>Gender</div>
            <div style={{display:"flex",gap:8}}>{[{id:"male",label:"👨 Male"},{id:"female",label:"👩 Female"}].map(g=>(<button key={g.id} onClick={()=>setNewCustGender(g.id)} style={{flex:1,padding:"9px",borderRadius:10,border:`2px solid ${newCustGender===g.id?T.green:T.border}`,background:newCustGender===g.id?T.gl:"#fff",color:newCustGender===g.id?T.gd:T.ts,fontFamily:"inherit",fontSize:13,fontWeight:800,cursor:"pointer"}}>{g.label}</button>))}</div>
          </div>
          <button onClick={()=>saveNewCustomer(false)} disabled={savingCustomer||!newCustPhone||newCustPhone.length<10} style={{width:"100%",padding:13,background:savingCustomer||!newCustPhone||newCustPhone.length<10?"#d1d5db":T.green,border:"none",borderRadius:12,color:"#fff",fontFamily:"inherit",fontSize:14,fontWeight:800,cursor:newCustPhone.length===10?"pointer":"not-allowed"}}>
            {savingCustomer?"Saving...":"✓ Customer + Log Save Karo"}
          </button>
        </div>
      </div>
    );
  }

  return(
    <div onClick={e=>e.target===e.currentTarget&&handleCancel()} style={{position:"fixed",inset:0,background:"rgba(0,0,0,0.5)",zIndex:200,display:"flex",alignItems:"flex-end"}}>
      <div style={{background:T.surface,borderRadius:"20px 20px 0 0",padding:"20px 18px 36px",width:"100%",maxHeight:"80vh",overflowY:"auto",WebkitOverflowScrolling:"touch"}}>
        <div style={{width:36,height:4,background:T.border,borderRadius:2,margin:"0 auto 16px"}}/>
        <div style={{fontWeight:900,fontSize:16,marginBottom:16}}>➕ Work Log Add Karo</div>
        <div style={{marginBottom:12}}>
          <div style={{fontSize:12,fontWeight:800,color:T.tm,marginBottom:5}}>Client Naam *</div>
          <input style={IS} placeholder="e.g. Anjali Mehta" value={clientName} onChange={e=>setClientName(e.target.value)} onFocus={e=>e.target.style.borderColor=T.green} onBlur={e=>e.target.style.borderColor=T.border} autoFocus/>
        </div>
        <div style={{marginBottom:12}}>
          <div style={{fontSize:12,fontWeight:800,color:T.tm,marginBottom:5}}>Phone Number <span style={{color:T.tf,fontWeight:600}}>(optional, recommended)</span></div>
          <input style={IS} type="tel" placeholder="e.g. 9876543210" value={clientPhone} onChange={e=>setClientPhone(e.target.value.replace(/\D/g,"").slice(0,10))} onFocus={e=>e.target.style.borderColor=T.green} onBlur={e=>e.target.style.borderColor=T.border}/>
          <div style={{fontSize:10,color:T.tf,marginTop:4}}>Same naam ke customers ko differentiate karne ke liye</div>
        </div>
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10,marginBottom:12}}>
          <div>
            <div style={{fontSize:12,fontWeight:800,color:T.tm,marginBottom:5}}>Service</div>
            <select style={{...IS,cursor:"pointer"}} value={service} onChange={e=>setService(e.target.value)}>
              {SERVICES.map(s=><option key={s}>{s}</option>)}
            </select>
          </div>
          <div>
            <div style={{fontSize:12,fontWeight:800,color:T.tm,marginBottom:5}}>Date</div>
            <input style={IS} type="date" value={date} onChange={e=>setDate(e.target.value)}/>
          </div>
        </div>
        <div style={{marginBottom:18}}>
          <div style={{fontSize:12,fontWeight:800,color:T.tm,marginBottom:5}}>Amount (₹) *</div>
          <input style={IS} type="number" placeholder="500" value={amount} onChange={e=>setAmount(e.target.value)} onFocus={e=>e.target.style.borderColor=T.green} onBlur={e=>e.target.style.borderColor=T.border}/>
        </div>
        <div style={{marginBottom:14}}>
          <div style={{fontSize:12,fontWeight:800,color:T.tm,marginBottom:5}}>📝 Stylist Notes</div>
          <textarea style={{...IS,resize:"vertical",lineHeight:1.6,minHeight:64,fontFamily:"inherit"}} placeholder="e.g. Shampoo + conditioning kiya, keratin ke baare mein pucha..." value={notes} onChange={e=>setNotes(e.target.value)} onFocus={e=>e.target.style.borderColor=T.green} onBlur={e=>e.target.style.borderColor=T.border}/>
        </div>
        <div style={{marginBottom:18}}>
          <div style={{fontSize:12,fontWeight:800,color:T.tm,marginBottom:8}}>📸 Visit Photos ({photos.length})</div>
          <div style={{display:"flex",gap:10,flexWrap:"wrap"}}>
            {photos.map((ph,i)=><StagedPhotoItem key={i} photo={ph} onRemove={()=>setPhotos(prev=>prev.filter((_,idx)=>idx!==i))}/>)}
            <StagedAddPhotoBtn tempId={tempVisitId} onAdd={ph=>setPhotos(prev=>[...prev,ph])}/>
          </div>
        </div>
        <div style={{display:"flex",gap:10}}>
          <button onClick={handleCancel} style={{flex:1,padding:12,border:`2px solid ${T.border}`,borderRadius:12,background:T.surface,fontFamily:"inherit",fontSize:13,fontWeight:700,cursor:"pointer"}}>Cancel</button>
          <button onClick={save} disabled={saving} style={{flex:2,padding:12,border:"none",borderRadius:12,background:clientName.trim()&&amount?T.green:"#d1d5db",color:"#fff",fontFamily:"inherit",fontSize:13,fontWeight:800,cursor:"pointer"}}>
            {saving?"Saving...":"✓ Save Karo"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Tab 1: Attendance & Work Log ─────────────────────────────────────────────
function EntryDetailModal({log,onClose}){
  function si(svc){const s=(svc||"").toLowerCase();
    if(s.includes("color")||s.includes("colour"))return{icon:"🎨",bg:"#fff7ed",border:"#fed7aa",color:"#ea580c"};
    if(s.includes("beard")||s.includes("shave"))return{icon:"🪒",bg:"#f0fdf4",border:"#bbf7d0",color:"#16a34a"};
    if(s.includes("facial")||s.includes("face"))return{icon:"💆",bg:"#fdf4ff",border:"#e9d5ff",color:"#9333ea"};
    return{icon:"✂️",bg:"#f0eeff",border:"#ddd6fe",color:"#5b3fc4"};}
  const ic=si(log.service);
  return(
    <div style={{position:"fixed",inset:0,background:"rgba(0,0,0,0.5)",display:"flex",alignItems:"flex-end",zIndex:999}} onClick={onClose}>
      <div style={{background:"#fff",borderRadius:"20px 20px 0 0",width:"100%",paddingBottom:28}} onClick={e=>e.stopPropagation()}>
        <div style={{width:34,height:4,background:"#e5e7eb",borderRadius:2,margin:"12px auto 0"}}/>
        <div style={{background:"linear-gradient(135deg,#3d2490,#5b3fc4)",padding:"14px 18px",margin:"10px 0 0"}}>
          <div style={{display:"flex",alignItems:"center",justifyContent:"space-between"}}>
            <div style={{fontSize:15,fontWeight:800,color:"#fff"}}>Service Details</div>
            <div onClick={onClose} style={{width:28,height:28,borderRadius:"50%",background:"rgba(255,255,255,0.2)",display:"flex",alignItems:"center",justifyContent:"center",cursor:"pointer",color:"#fff",fontSize:13}}>✕</div>
          </div>
        </div>
        <div style={{padding:"16px 18px"}}>
          <div style={{display:"flex",alignItems:"center",gap:12,padding:"11px",background:"#f8f7ff",borderRadius:12,marginBottom:12}}>
            <div style={{width:40,height:40,borderRadius:12,background:"linear-gradient(135deg,#5b3fc4,#2d1b69)",display:"flex",alignItems:"center",justifyContent:"center",fontSize:13,fontWeight:800,color:"#fff"}}>{(log.clientName||"?").slice(0,2).toUpperCase()}</div>
            <div><div style={{fontSize:14,fontWeight:800,color:"#0f0a2e"}}>{log.clientName}</div><div style={{fontSize:11,color:"#9b8ec4",marginTop:1}}>Client</div></div>
          </div>
          {[{bg:ic.bg,border:ic.border,icon:ic.icon,label:"Service",val:log.service,color:ic.color},
            {bg:"#f0fdf4",border:"#bbf7d0",icon:"💰",label:"Amount",val:"₹"+Number(log.amount||0).toLocaleString("en-IN"),color:"#16a34a"},
            {bg:"#f8f7ff",border:"#e5e7eb",icon:"📅",label:"Date",val:new Date(log.date+"T00:00:00").toLocaleDateString("en-IN",{day:"numeric",month:"short",year:"numeric"}),color:"#0f0a2e"}
          ].map(r=>(
            <div key={r.label} style={{display:"flex",alignItems:"center",justifyContent:"space-between",padding:"10px 12px",background:r.bg,borderRadius:10,border:`1px solid ${r.border}`,marginBottom:8}}>
              <div style={{display:"flex",alignItems:"center",gap:8}}><span style={{fontSize:15}}>{r.icon}</span><span style={{fontSize:13,color:"#374151"}}>{r.label}</span></div>
              <span style={{fontSize:13,fontWeight:700,color:r.color}}>{r.val}</span>
            </div>
          ))}
          <button onClick={onClose} style={{width:"100%",padding:"12px",background:"linear-gradient(135deg,#5b3fc4,#2d1b69)",border:"none",borderRadius:12,color:"#fff",fontFamily:"inherit",fontSize:14,fontWeight:700,cursor:"pointer",marginTop:4}}>Done</button>
        </div>
      </div>
    </div>
  );
}

function AttendanceTab({staff, logs, setLogs, attendance, setAttendance, showRevenue, absentNotes, setAbsentNotes, salonId}){
  const [workTab,setWorkTab]=useState("today");
  const [showAddLog,setShowAddLog]=useState(false);
  const [selectedLog,setSelectedLog]=useState(null);

  const isPresent=!!(attendance[today]||{})[staff.id];

  async function toggleAttendance(){
    const newVal=!isPresent;
    setAttendance(prev=>{const dm={...(prev[today]||{})};dm[staff.id]=newVal;return{...prev,[today]:dm};});
    if(salonId){
      await supabase.from("attendance").upsert({
        salon_id:salonId, staff_id:staff.id, date:today, is_present:newVal,
        absent_reason: newVal ? null : ((absentNotes||{})[today]||null)
      },{onConflict:"salon_id,staff_id,date"});
    }
  }

  function addLog(data){setLogs(prev=>[...prev,data]);}

  const filtered=useMemo(()=>{
    const cutoff=workTab==="today"?today:workTab==="week"?thisWeekStart:thisMonthStart;
    return logs.filter(l=>l.staffId===staff.id&&l.date>=cutoff).sort((a,b)=>b.date.localeCompare(a.date));
  },[logs,workTab,staff.id]);

  const monthPresent=Object.entries(attendance).filter(([d,m])=>d>=thisMonthStart&&m[staff.id]).length;
  const monthAbsent=new Date().getDate()-monthPresent;

  const monthPresent2=Object.entries(attendance).filter(([d,m])=>d>=thisMonthStart&&m[staff.id]).length;
  const monthAbsent2=new Date().getDate()-monthPresent2;
  const attRate=monthPresent2+monthAbsent2>0?Math.round((monthPresent2/(monthPresent2+monthAbsent2))*100):0;
  const mClients=useMemo(()=>new Set(logs.filter(l=>l.staffId===staff.id&&l.date>=thisMonthStart).map(l=>l.clientName)).size,[logs,staff.id]);
  const mLogs=logs.filter(l=>l.staffId===staff.id&&l.date>=thisMonthStart).length;
  const mRev=logs.filter(l=>l.staffId===staff.id&&l.date>=thisMonthStart).reduce((s,l)=>s+l.amount,0);
  const heat=[];
  for(let i=13;i>=0;i--){const d=new Date();d.setDate(d.getDate()-i);const ds=d.toISOString().slice(0,10);heat.push({ds,p:!!(attendance[ds]||{})[staff.id],f:ds>today});}
  let streak=0;
  for(let i=0;i<30;i++){const dd=new Date();dd.setDate(dd.getDate()-i);const ds=dd.toISOString().slice(0,10);if((attendance[ds]||{})[staff.id])streak++;else if(i>0)break;}
  function svc(s){const t=(s||"").toLowerCase();
    if(t.includes("color")||t.includes("colour"))return{icon:"🎨",bg:"#fff7ed",bd:"#fed7aa",c:"#ea580c"};
    if(t.includes("beard")||t.includes("shave"))return{icon:"🪒",bg:"#f0fdf4",bd:"#bbf7d0",c:"#16a34a"};
    if(t.includes("facial")||t.includes("face"))return{icon:"💆",bg:"#fdf4ff",bd:"#e9d5ff",c:"#9333ea"};
    return{icon:"✂️",bg:"#f0eeff",bd:"#ddd6fe",c:"#5b3fc4"};}
  const N={w:"#fff",bg:"#f8f7ff",br:"#f1f0f5",t:"#0f0a2e",m:"#6b7280",p:"#5b3fc4"};

  return(
    <div style={{padding:"12px 14px 80px",background:N.bg}}>

      {/* Hero Card */}
      <div style={{background:N.w,borderRadius:18,padding:"14px",border:"1px solid #e5e7eb",boxShadow:"0 2px 12px rgba(0,0,0,0.05)",marginBottom:10}}>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:12}}>
          <div>
            <div style={{fontSize:10,color:"#9b8ec4",letterSpacing:"0.5px"}}>{new Date().toLocaleDateString("en-IN",{month:"long",year:"numeric"}).toUpperCase()}</div>
            <div style={{fontSize:15,fontWeight:800,color:N.t,marginTop:2}}>Attendance Overview</div>
          </div>
          <div style={{textAlign:"right"}}>
            <div style={{fontSize:24,fontWeight:800,color:attRate>=80?"#16a34a":attRate>=60?"#d97706":"#dc2626",lineHeight:1}}>{attRate}%</div>
            <div style={{fontSize:9,color:"#9ca3af",marginTop:1}}>att. rate</div>
          </div>
        </div>
        <div style={{display:"flex",gap:10,alignItems:"flex-start"}}>
          {/* Donut + pills */}
          <div style={{display:"flex",flexDirection:"column",alignItems:"center",gap:6,flexShrink:0,width:90}}>
            <svg width="74" height="74" viewBox="0 0 74 74">
              <circle cx="37" cy="37" r="27" fill="none" stroke="#f1f0f5" strokeWidth="9"/>
              <circle cx="37" cy="37" r="27" fill="none" stroke="#22c55e" strokeWidth="9"
                strokeDasharray={`${(monthPresent2/Math.max(monthPresent2+monthAbsent2,1))*170} 170`}
                strokeLinecap="round" transform="rotate(-90 37 37)"/>
              <circle cx="37" cy="37" r="27" fill="none" stroke="#f87171" strokeWidth="9"
                strokeDasharray={`${(monthAbsent2/Math.max(monthPresent2+monthAbsent2,1))*170} 170`}
                strokeDashoffset={`-${(monthPresent2/Math.max(monthPresent2+monthAbsent2,1))*170}`}
                strokeLinecap="round" transform="rotate(-90 37 37)"/>
              <text x="37" y="33" textAnchor="middle" fill={N.t} fontSize="10" fontWeight="800" fontFamily="system-ui">{monthPresent2}/{monthAbsent2}</text>
              <text x="37" y="45" textAnchor="middle" fill="#9ca3af" fontSize="7" fontFamily="system-ui">P / A</text>
            </svg>
            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:4,width:"100%"}}>
              {[{bg:"#f0fdf4",c:"#16a34a",v:monthPresent2,l:"Present"},{bg:"#fff5f5",c:"#dc2626",v:monthAbsent2,l:"Absent"},{bg:"#eff6ff",c:"#2563eb",v:mClients,l:"Clients"},{bg:"#f5f3ff",c:N.p,v:mLogs,l:"Logs"}].map(s=>(
                <div key={s.l} style={{background:s.bg,borderRadius:7,padding:"5px 3px",textAlign:"center"}}>
                  <div style={{fontSize:12,fontWeight:800,color:s.c,lineHeight:1}}>{s.v}</div>
                  <div style={{fontSize:7,color:"#6b7280",marginTop:2}}>{s.l}</div>
                </div>
              ))}
            </div>
          </div>
          {/* Heatmap + revenue */}
          <div style={{flex:1,display:"flex",flexDirection:"column",gap:7}}>
            <div>
              <div style={{display:"grid",gridTemplateColumns:"repeat(7,1fr)",gap:3,marginBottom:3}}>
                {["M","T","W","T","F","S","S"].map((l,i)=><div key={i} style={{fontSize:7,color:"#9ca3af",textAlign:"center"}}>{l}</div>)}
              </div>
              <div style={{display:"grid",gridTemplateColumns:"repeat(7,1fr)",gap:3}}>
                {heat.map((d,i)=><div key={i} style={{height:15,borderRadius:4,background:d.f?"#f1f0f5":d.p?"#bbf7d0":"#fca5a5"}}/>)}
              </div>
            </div>
            <div style={{height:1,background:"#f1f0f5"}}/>
            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:5}}>
              <div style={{background:"#f0fdf4",border:"1px solid #bbf7d0",borderRadius:9,padding:"8px"}}>
                <div style={{fontSize:13,fontWeight:800,color:"#16a34a",lineHeight:1}}>{fc(mRev)}</div>
                <div style={{fontSize:9,color:"#6b7280",marginTop:2}}>Revenue</div>
              </div>
              <div style={{background:"#f5f3ff",border:"1px solid #ddd6fe",borderRadius:9,padding:"8px"}}>
                <div style={{fontSize:13,fontWeight:800,color:N.p,lineHeight:1}}>{mLogs} logs</div>
                <div style={{fontSize:9,color:"#6b7280",marginTop:2}}>Work Entries</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Streak */}
      {streak>=3&&(
        <div style={{background:"linear-gradient(135deg,#fff7ed,#fef3c7)",border:"1px solid #fde68a",borderRadius:14,padding:"10px 14px",display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:10}}>
          <div style={{display:"flex",alignItems:"center",gap:10}}>
            <div style={{fontSize:22}}>🔥</div>
            <div>
              <div style={{fontSize:13,fontWeight:800,color:"#78350f"}}>{streak} Day Streak!</div>
              <div style={{fontSize:10,color:"#a16207",marginTop:1}}>Keep it up!</div>
            </div>
          </div>
          <div style={{display:"flex",gap:4}}>{["M","T","W","T","F"].slice(0,Math.min(streak,5)).map((l,i)=>(<div key={i} style={{width:22,height:22,borderRadius:"50%",background:"#22c55e",display:"flex",alignItems:"center",justifyContent:"center",fontSize:8,color:"#fff",fontWeight:700}}>{l}</div>))}</div>
        </div>
      )}

      {/* Present/Absent toggle */}
      <div style={{background:isPresent?"#f0fdf4":"#fff5f5",border:`1px solid ${isPresent?"#bbf7d0":"#fca5a5"}`,borderRadius:12,padding:"10px 14px",marginBottom:10,display:"flex",alignItems:"center",justifyContent:"space-between"}}>
        <div style={{display:"flex",alignItems:"center",gap:9}}>
          <div style={{width:28,height:28,borderRadius:"50%",background:isPresent?"#22c55e":"#f87171",display:"flex",alignItems:"center",justifyContent:"center",fontSize:12,color:"#fff",flexShrink:0}}>{isPresent?"✓":"✗"}</div>
          <div>
            <div style={{fontSize:12,fontWeight:800,color:isPresent?"#15803d":"#b91c1c"}}>{isPresent?"Present Today 🎉":"Absent Today"}</div>
            <div style={{fontSize:9,color:isPresent?"#16a34a":"#dc2626",marginTop:1}}>{new Date().toLocaleDateString("en-IN",{day:"numeric",month:"long",year:"numeric"})}</div>
          </div>
        </div>
        <div style={{display:"flex",alignItems:"center",gap:6}}>
          <span style={{fontSize:9,color:"#6b7280"}}>Mark Absent</span>
          <div onClick={toggleAttendance} style={{width:34,height:19,borderRadius:10,background:isPresent?"#22c55e":"#d1d5db",position:"relative",cursor:"pointer",flexShrink:0}}>
            <div style={{width:13,height:13,borderRadius:"50%",background:"#fff",position:"absolute",top:3,left:isPresent?18:3,transition:"left 0.2s",boxShadow:"0 1px 2px rgba(0,0,0,0.15)"}}/>
          </div>
        </div>
      </div>

      {!isPresent&&(
        <div style={{background:N.w,border:"1px solid #f1f0f5",borderRadius:12,padding:"12px 14px",marginBottom:10}}>
          <div style={{fontSize:11,fontWeight:700,color:"#6b7280",marginBottom:6}}>🔒 Reason for absence (only you can see):</div>
          <input style={{...IS,background:"#f8f7ff",borderColor:"#e0d8ff"}} placeholder="Add reason — owner won't see this..." value={(absentNotes||{})[today]||""} onChange={async e=>{setAbsentNotes(prev=>({...prev,[today]:e.target.value}));if(salonId)await supabase.from("attendance").upsert({salon_id:salonId,staff_id:staff.id,date:today,is_present:false,absent_reason:e.target.value},{onConflict:"salon_id,staff_id,date"});}}/>
        </div>
      )}

      {/* Work Entries */}
      <div style={{background:N.w,borderRadius:12,border:"1px solid #f1f0f5",overflow:"hidden"}}>
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",background:"#f8f7ff",borderBottom:"1px solid #f1f0f5"}}>
          {[{k:"today",l:"Today"},{k:"week",l:"This Week"},{k:"month",l:"This Month"}].map(t=>(
            <button key={t.k} onClick={()=>setWorkTab(t.k)} style={{padding:"7px 0",border:"none",background:workTab===t.k?"#5b3fc4":"transparent",color:workTab===t.k?"#fff":"#9ca3af",fontSize:11,fontWeight:700,cursor:"pointer",fontFamily:"inherit"}}>{t.l}</button>
          ))}
        </div>
        <div style={{padding:"9px 12px",borderBottom:"1px solid #f1f0f5"}}>
          <div style={{fontSize:12,fontWeight:800,color:N.t}}>Work Entries</div>
        </div>
        <div>
          {filtered.length===0
            ?<div style={{textAlign:"center",padding:"22px 16px"}}>
              <div style={{width:44,height:44,borderRadius:14,background:"linear-gradient(135deg,#f0eeff,#e4dcff)",display:"flex",alignItems:"center",justifyContent:"center",fontSize:20,margin:"0 auto 10px"}}>✂️</div>
              <div style={{fontSize:13,fontWeight:800,color:N.t,marginBottom:3}}>Start your day!</div>
              <div style={{fontSize:11,color:"#9b8ec4"}}>No work entries yet.</div>
            </div>
            :filtered.map((log,i)=>{
              const ic=svc(log.service);
              return(
                <div key={log.id} onClick={()=>setSelectedLog(log)} style={{display:"flex",alignItems:"center",gap:10,padding:"10px 12px",borderBottom:"1px solid #f9f9f9",cursor:"pointer"}}>
                  <div style={{width:32,height:32,borderRadius:9,background:ic.bg,border:`1px solid ${ic.bd}`,display:"flex",alignItems:"center",justifyContent:"center",fontSize:15,flexShrink:0}}>{ic.icon}</div>
                  <div style={{flex:1,minWidth:0}}>
                    <div style={{fontSize:13,fontWeight:700,color:N.t}}>{log.clientName}</div>
                    <div style={{fontSize:10,color:ic.c,fontWeight:600,marginTop:1}}>{log.service} · {fd(log.date)}</div>
                  </div>
                  {showRevenue&&<div style={{fontSize:12,fontWeight:700,color:"#16a34a",flexShrink:0}}>{fc(log.amount)}</div>}
                  <span style={{color:"#9ca3af",fontSize:14,flexShrink:0}}>›</span>
                </div>
              );
            })
          }
        </div>
      </div>
      {showAddLog&&<AddLogModal staffId={staff.id} salonId={salonId} isPresent={isPresent} onSave={addLog} onClose={()=>setShowAddLog(false)}/>}
      {selectedLog&&<EntryDetailModal log={selectedLog} onClose={()=>setSelectedLog(null)}/>}
    </div>
  );
}
// ─── Main Staff Dashboard ─────────────────────────────────────────────────────
export default function StaffDashboard({staff, showRevenue=false, onLogout}){
  const [tab,setTab]=useState("attendance");
  const [showAddLogFab,setShowAddLogFab]=useState(false);
  const [logs,setLogs]=useState([]);
  const [attendance,setAttendance]=useState({});
  const [absentNotes,setAbsentNotes]=useState({});
  const [loading,setLoading]=useState(true);

  const salonId = staff?.salon_id || null;

  useEffect(()=>{
    async function loadData(){
      if(!salonId){setLoading(false);return;}
      setLoading(true);

      const {data:logsData}=await supabase.from("work_logs").select("*").eq("salon_id",salonId).eq("staff_id",staff.id);
      if(logsData){
        setLogs(logsData.map(l=>({id:l.id,staffId:l.staff_id,clientName:l.client_name,service:l.service,amount:l.amount,date:l.date})));
      }

      const {data:attData}=await supabase.from("attendance").select("*").eq("salon_id",salonId).eq("staff_id",staff.id);
      if(attData){
        const attMap={};
        attData.forEach(row=>{
          if(!attMap[row.date])attMap[row.date]={};
          attMap[row.date][row.staff_id]=row.is_present;
        });
        setAttendance(attMap);
      }

      setLoading(false);
    }
    loadData();
  },[salonId, staff?.id]);

  const c=avc(staff?.id||1);

  const TABS=[
    {id:"attendance",icon:"📋",label:"Attendance"},
    {id:"customers",icon:"👥",label:"Customers"},
  ];

  if(loading){
    return(<div style={{height:"100vh",display:"flex",alignItems:"center",justifyContent:"center",background:T.bg,fontFamily:"system-ui,sans-serif"}}><div style={{textAlign:"center"}}><div style={{fontSize:32,marginBottom:12}}>✂️</div><div style={{fontSize:14,color:T.ts,fontWeight:700}}>Loading...</div></div></div>);
  }

  return(
    <div style={{height:"100vh",display:"flex",flexDirection:"column",fontFamily:"-apple-system,system-ui,sans-serif",background:"#f8f7ff",overflow:"hidden"}}>
      <div style={{background:"#fff",padding:"12px 16px 10px",display:"flex",alignItems:"center",justifyContent:"space-between",borderBottom:"1px solid #f1f0f5",flexShrink:0}}>
        <div style={{display:"flex",alignItems:"center",gap:10}}>
          <div style={{width:38,height:38,borderRadius:12,background:c.bg,display:"flex",alignItems:"center",justifyContent:"center",fontWeight:800,fontSize:14,color:c.text,flexShrink:0}}>{initials(staff?.name||"ST")}</div>
          <div>
            <div style={{fontWeight:800,fontSize:14,color:"#0f0a2e"}}>{staff?.name}</div>
            <div style={{fontSize:10,color:"#9b8ec4",marginTop:1}}>{staff?.role} · Staff Portal</div>
          </div>
        </div>
        <button onClick={onLogout} style={{display:"flex",alignItems:"center",gap:5,padding:"7px 12px",background:"#fff5f5",border:"1.5px solid #fca5a5",borderRadius:9,fontSize:11,fontWeight:700,color:"#dc2626",cursor:"pointer",fontFamily:"inherit"}}>🚪 Logout</button>
      </div>
      <div style={{flex:1,overflow:"hidden",display:"flex",flexDirection:"column",position:"relative"}}>
        {tab==="attendance"&&(<div style={{flex:1,overflowY:"auto",WebkitOverflowScrolling:"touch"}}><AttendanceTab staff={staff} logs={logs} setLogs={setLogs} attendance={attendance} setAttendance={setAttendance} showRevenue={showRevenue} absentNotes={absentNotes} setAbsentNotes={setAbsentNotes} salonId={salonId}/></div>)}
        {tab==="customers"&&salonId&&(<CustomerHistory key={salonId} currentUser={{id:salonId,salon_id:salonId,role:"staff",name:staff?.name||"Staff"}}/>)}
        {tab==="attendance"&&(
          <div style={{position:"absolute",right:14,bottom:14,display:"flex",flexDirection:"column",alignItems:"center",gap:3,zIndex:10}}>
            <div onClick={()=>setShowAddLogFab(true)} style={{width:54,height:54,borderRadius:"50%",background:"linear-gradient(135deg,#5b3fc4,#2d1b69)",display:"flex",alignItems:"center",justifyContent:"center",fontSize:24,color:"#fff",boxShadow:"0 4px 18px rgba(91,63,196,0.45)",cursor:"pointer"}}>+</div>
            <span style={{fontSize:9,fontWeight:700,color:"#5b3fc4",background:"#fff",padding:"1px 5px",borderRadius:4}}>Add Log</span>
          </div>
        )}
      </div>
      {showAddLogFab&&<AddLogModal staffId={staff.id} salonId={salonId} isPresent={!!(attendance[today]||{})[staff.id]} onSave={log=>{setLogs(prev=>[...prev,log]);setShowAddLogFab(false);}} onClose={()=>setShowAddLogFab(false)}/>}
      <div style={{background:"#fff",borderTop:"1px solid #f1f0f5",display:"flex",flexShrink:0,padding:"6px 0 8px"}}>
        {[{id:"attendance",icon:"📅",label:"Attendance"},{id:"customers",icon:"👥",label:"Customers"}].map(t=>(
          <div key={t.id} onClick={()=>setTab(t.id)} style={{flex:1,display:"flex",flexDirection:"column",alignItems:"center",gap:3,cursor:"pointer",paddingBottom:4,borderBottom:`2.5px solid ${tab===t.id?"#5b3fc4":"transparent"}`}}>
            <span style={{fontSize:17}}>{t.icon}</span>
            <span style={{fontSize:10,fontWeight:tab===t.id?800:600,color:tab===t.id?"#5b3fc4":"#9ca3af"}}>{t.label}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

export function StaffLoginPage({salonId, onLogin, onBack}){
  const [staffList,setStaffList]=useState([]);
  const [selectedId,setSelectedId]=useState("");
  const [pin,setPin]=useState("");
  const [error,setError]=useState("");
  const [loading,setLoading]=useState(false);
  const [loadingStaff,setLoadingStaff]=useState(true);

  useEffect(()=>{
    async function loadStaff(){
      if(!salonId){setLoadingStaff(false);return;}
      const {data}=await supabase.from("staff").select("*").eq("salon_id",salonId);
      if(data&&data.length>0){
        setStaffList(data);
        setSelectedId(data[0].id);
      }
      setLoadingStaff(false);
    }
    loadStaff();
  },[salonId]);

  function handleLogin(){
    if(!selectedId){setError("Staff select karo!");return;}
    setLoading(true);setError("");
    setTimeout(()=>{
      const staff=staffList.find(s=>String(s.id)===String(selectedId));
      if(staff&&staff.pin===pin){
        onLogin({...staff,salon_id:salonId});
      }else{
        setError("PIN galat hai! Dobara try karo.");
        setPin("");setLoading(false);
      }
    },800);
  }

  if(loadingStaff){
    return(<div style={{minHeight:"100vh",background:"linear-gradient(135deg,#1a1a2e,#16213e)",display:"flex",alignItems:"center",justifyContent:"center",fontFamily:"system-ui,sans-serif"}}><div style={{textAlign:"center",color:"#fff"}}><div style={{fontSize:32,marginBottom:12}}>✂️</div><div style={{fontSize:14,color:"#a0a0c0"}}>Staff load ho raha hai...</div></div></div>);
  }

  if(!salonId||staffList.length===0){
    return(
      <div style={{minHeight:"100vh",background:"linear-gradient(135deg,#1a1a2e,#16213e)",display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",padding:"24px 20px",fontFamily:"system-ui,sans-serif"}}>
        <div style={{fontSize:28,fontWeight:900,color:"#fff",marginBottom:4}}>✂️ SnipBook</div>
        <div style={{background:"#fff",borderRadius:20,padding:"26px 22px",width:"100%",maxWidth:360,marginTop:24}}>
          <div style={{fontWeight:900,fontSize:17,marginBottom:8,color:T.text}}>Koi staff nahi mila</div>
          <div style={{fontSize:13,color:T.ts,marginBottom:20}}>Is salon mein koi staff registered nahi hai.</div>
          <button onClick={onBack} style={{width:"100%",padding:"13px",background:T.dark,border:"none",borderRadius:12,color:"#fff",fontFamily:"inherit",fontSize:14,fontWeight:800,cursor:"pointer"}}>← Back to Login</button>
        </div>
      </div>
    );
  }

  return(
    <div style={{minHeight:"100vh",background:"linear-gradient(135deg,#1a1a2e,#16213e)",display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",padding:"24px 20px",fontFamily:"system-ui,sans-serif"}}>
      <div style={{fontSize:28,fontWeight:900,color:"#fff",marginBottom:4}}>✂️ SnipBook</div>
      <div style={{fontSize:13,color:"#a0a0c0",marginBottom:32}}>Staff Portal</div>

      <div style={{background:"#fff",borderRadius:20,padding:"26px 22px",width:"100%",maxWidth:360,boxShadow:"0 16px 48px rgba(0,0,0,0.3)"}}>
        <div style={{fontWeight:900,fontSize:17,marginBottom:3,color:T.text}}>Staff Login</div>
        <div style={{fontSize:13,color:T.ts,marginBottom:20}}>Apna naam aur PIN daalo</div>

        <div style={{marginBottom:14}}>
          <div style={{fontSize:13,fontWeight:800,color:T.tm,marginBottom:6}}>Apna Naam</div>
          <select style={{...IS,cursor:"pointer"}} value={selectedId} onChange={e=>{setSelectedId(e.target.value);setError("");}}>
            {staffList.map(s=><option key={s.id} value={s.id}>{s.name} — {s.role}</option>)}
          </select>
        </div>

        <div style={{marginBottom:18}}>
          <div style={{fontSize:13,fontWeight:800,color:T.tm,marginBottom:6}}>4-digit PIN</div>
          <input style={IS} type="password" placeholder="••••" maxLength={4} value={pin} onChange={e=>{setPin(e.target.value);setError("");}} onKeyDown={e=>e.key==="Enter"&&handleLogin()} onFocus={e=>e.target.style.borderColor=T.green} onBlur={e=>e.target.style.borderColor=T.border}/>
        </div>

        {error&&<div style={{background:T.red,border:`1.5px solid ${T.rb}`,borderRadius:9,padding:"9px 12px",marginBottom:14,fontSize:12,color:T.rt,fontWeight:600}}>⚠️ {error}</div>}

        <button onClick={handleLogin} disabled={loading} style={{width:"100%",padding:"13px",background:loading?"#86efac":T.green,border:"none",borderRadius:12,color:"#fff",fontFamily:"inherit",fontSize:15,fontWeight:800,cursor:"pointer",marginBottom:12}}>
          {loading?"Logging in...":"Login →"}
        </button>

        <button onClick={onBack} style={{width:"100%",background:"none",border:"none",color:T.ts,fontSize:13,fontWeight:700,cursor:"pointer",fontFamily:"inherit"}}>← Back to Login</button>
      </div>
    </div>
  );
}
