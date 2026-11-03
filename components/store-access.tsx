"use client";
import { useEffect, useState } from "react";
import { requestJson, userMessage } from "@/lib/client-request";

type Staff={id:string;email:string;is_active:boolean;created_at:string};
type ListResponse={managers:Staff[]};
type SingleResponse={manager:Staff};
export function StoreAccess(){
 const [staff,setStaff]=useState<Staff[]>([]);
 const [loaded,setLoaded]=useState(false);
 const [email,setEmail]=useState("");
 const [password,setPassword]=useState("");
 const [editingId,setEditingId]=useState<string|null>(null);
 const [editEmail,setEditEmail]=useState("");
 const [editPassword,setEditPassword]=useState("");
 const [currentPassword,setCurrentPassword]=useState("");
 const [newPassword,setNewPassword]=useState("");
 const [busy,setBusy]=useState(false);
 const [error,setError]=useState("");
 const [message,setMessage]=useState("");
 useEffect(()=>{
  let mounted=true;
  requestJson<ListResponse>("/api/admin/access",{cache:"no-store"},{timeoutMs:15000})
   .then(result=>{if(mounted)setStaff(result.managers||[])})
   .catch(cause=>{if(mounted)setError(userMessage(cause,"Could not load account settings."))})
   .finally(()=>{if(mounted)setLoaded(true)});
  return()=>{mounted=false};
 },[]);
 function clearNotices(){setError("");setMessage("")}
 function replaceManager(next:Staff){setStaff(current=>current.map(s=>s.id===next.id?next:s))}
 async function addStaff(event:React.FormEvent){
  event.preventDefault();setBusy(true);clearNotices();
  try{
   const result=await requestJson<SingleResponse>("/api/admin/access",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({email,password})},{timeoutMs:25000});
   setStaff(current=>[...current,result.manager]);setEmail("");setPassword("");
   setMessage("Staff account created. They can sign in using the store login page.");
  }catch(cause){setError(userMessage(cause,"Could not create this account."))}
  finally{setBusy(false)}
 }
 async function changeStaff(event:React.FormEvent){
  event.preventDefault();if(!editingId)return;
  setBusy(true);clearNotices();
  try{
   const result=await requestJson<SingleResponse>("/api/admin/access",{
    method:"PATCH",headers:{"Content-Type":"application/json"},
    body:JSON.stringify({action:"managerCredentials",id:editingId,email:editEmail,password:editPassword})
   },{timeoutMs:25000});
   replaceManager(result.manager);setEditingId(null);setEditPassword("");
   setMessage("Staff account updated.");
  }catch(cause){setError(userMessage(cause,"Could not update this account."))}
  finally{setBusy(false)}
 }
 async function toggleStaff(manager:Staff){
  setBusy(true);clearNotices();
  try{
   const result=await requestJson<SingleResponse>("/api/admin/access",{method:"PATCH",headers:{"Content-Type":"application/json"},body:JSON.stringify({action:"toggle",id:manager.id,active:!manager.is_active})},{timeoutMs:15000});
   replaceManager(result.manager);
   setMessage(result.manager.is_active?"Staff account enabled.":"Staff account disabled.");
  }catch(cause){setError(userMessage(cause,"Could not update this account."))}
  finally{setBusy(false)}
 }
 async function changeOwner(event:React.FormEvent){
  event.preventDefault();setBusy(true);clearNotices();
  try{
   await requestJson("/api/admin/access",{method:"PATCH",headers:{"Content-Type":"application/json"},body:JSON.stringify({action:"ownerPassword",currentPassword,newPassword})},{timeoutMs:25000});
   window.location.replace("/admin/login");
  }catch(cause){setError(userMessage(cause,"Could not change your password."));setBusy(false)}
 }
 function beginEdit(manager:Staff){
  setEditingId(manager.id);setEditEmail(manager.email);setEditPassword("");clearNotices();
 }
 return <div style={{display:"grid",gap:20,maxWidth:760}}>
  {error&&<div className="site-notice" role="alert"><div><strong>NIMA.</strong><span>{error}</span></div></div>}
  {message&&<div className="site-notice" role="status"><div><strong>NIMA.</strong><span>{message}</span></div></div>}
  <section className="admin-card" style={{padding:22}}>
   <h2 style={{marginBottom:10}}>Change your password</h2>
   <form className="form-grid" onSubmit={changeOwner}>
    <div className="field full"><label htmlFor="owner-current">Current password</label><input id="owner-current" type="password" autoComplete="current-password" required minLength={8} value={currentPassword} onChange={e=>setCurrentPassword(e.target.value)}/></div>
    <div className="field full"><label htmlFor="owner-new">New password</label><input id="owner-new" type="password" autoComplete="new-password" required minLength={12} maxLength={200} value={newPassword} onChange={e=>setNewPassword(e.target.value)}/></div>
    <div className="field full"><button className="btn" disabled={busy}>Change password</button></div>
   </form>
  </section>
  <section className="admin-card" style={{padding:22}}>
   <h2 style={{marginBottom:10}}>Add staff account</h2>
   <form className="form-grid" onSubmit={addStaff}>
    <div className="field full"><label htmlFor="staff-new-email">Email address</label><input id="staff-new-email" type="email" autoComplete="off" required maxLength={254} value={email} onChange={e=>setEmail(e.target.value)}/></div>
    <div className="field full"><label htmlFor="staff-new-password">Password</label><input id="staff-new-password" type="password" autoComplete="new-password" required minLength={12} maxLength={200} value={password} onChange={e=>setPassword(e.target.value)}/><span className="helper-text">At least 12 characters. Each staff member should have a different login.</span></div>
    <div className="field full"><button className="btn" disabled={busy}>Create staff account</button></div>
   </form>
  </section>
  <section className="admin-card" style={{padding:22}}>
   <h2 style={{marginBottom:10}}>Manage staff accounts</h2>
   {!loaded?<p>Loading accounts…</p>:staff.length===0?<p>No additional staff accounts yet.</p>:<div style={{display:"grid",gap:12}}>
    {staff.map(manager=><div key={manager.id} style={{padding:14,border:"1px solid var(--line, rgba(128,128,128,.3))",borderRadius:14,overflowWrap:"anywhere"}}>
     <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",gap:12,flexWrap:"wrap"}}>
      <div><strong>{manager.email}</strong><div className="helper-text">{manager.is_active?"Active":"Disabled"}</div></div>
      <div style={{display:"flex",gap:8,flexWrap:"wrap"}}>
       <button type="button" className="btn secondary" disabled={busy} onClick={()=>editingId===manager.id?setEditingId(null):beginEdit(manager)}>{editingId===manager.id?"Cancel edit":"Edit login"}</button>
       <button type="button" className="btn secondary" disabled={busy} onClick={()=>toggleStaff(manager)}>{manager.is_active?"Disable":"Enable"}</button>
      </div>
     </div>
     {editingId===manager.id&&<form className="form-grid" onSubmit={changeStaff} style={{marginTop:14}}>
      <div className="field full"><label htmlFor={"staff-email-"+manager.id}>Email address</label><input id={"staff-email-"+manager.id} type="email" required maxLength={254} value={editEmail} onChange={e=>setEditEmail(e.target.value)}/></div>
      <div className="field full"><label htmlFor={"staff-password-"+manager.id}>New password (optional)</label><input id={"staff-password-"+manager.id} type="password" autoComplete="new-password" minLength={12} maxLength={200} value={editPassword} onChange={e=>setEditPassword(e.target.value)}/></div>
      <div className="field full"><button className="btn" disabled={busy}>Save changes</button></div>
     </form>}
    </div>)}
   </div>}
  </section>
 </div>;
}
