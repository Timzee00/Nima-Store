"use client";
import { useEffect, useState } from "react";
import { requestJson, userMessage } from "@/lib/client-request";
type Staff={id:string;email:string;is_active:boolean;created_at:string};
type StaffResult={manager:Staff|null};
export function StoreAccess(){
 const [staff,setStaff]=useState<Staff|null>(null);
 const [loaded,setLoaded]=useState(false);
 const [email,setEmail]=useState("");
 const [password,setPassword]=useState("");
 const [currentPassword,setCurrentPassword]=useState("");
 const [newPassword,setNewPassword]=useState("");
 const [busy,setBusy]=useState(false);
 const [message,setMessage]=useState("");
 const [error,setError]=useState("");
 useEffect(()=>{
  let valid=true;
  requestJson<StaffResult>("/api/admin/access",{cache:"no-store"},{timeoutMs:12000})
   .then(x=>{if(valid){setStaff(x.manager);setEmail(x.manager?.email||"")}})
   .catch(e=>{if(valid)setError(userMessage(e,"Could not load account settings."))})
   .finally(()=>{if(valid)setLoaded(true)});
  return()=>{valid=false};
 },[]);
 async function saveStaff(e:React.FormEvent){
  e.preventDefault();setBusy(true);setError("");setMessage("");
  try{
   const result=await requestJson<StaffResult>("/api/admin/access",{
    method:staff?"PATCH":"POST",headers:{"Content-Type":"application/json"},
    body:JSON.stringify(staff?{action:"managerCredentials",email,password}:{email,password})
   },{timeoutMs:20000});
   setStaff(result.manager);setEmail(result.manager?.email||"");setPassword("");
   setMessage("Account credentials saved.");
  }catch(e){setError(userMessage(e,"Could not save account."))}
  finally{setBusy(false)}
 }
 async function toggle(){
  if(!staff)return;
  setBusy(true);setError("");setMessage("");
  try{
   const result=await requestJson<StaffResult>("/api/admin/access",{method:"PATCH",headers:{"Content-Type":"application/json"},body:JSON.stringify({action:"toggle",active:!staff.is_active})},{timeoutMs:12000});
   setStaff(result.manager);setMessage("Access updated.");
  }catch(e){setError(userMessage(e,"Could not update access."))}
  finally{setBusy(false)}
 }
 async function changeOwner(e:React.FormEvent){
  e.preventDefault();setBusy(true);setError("");setMessage("");
  try{
   await requestJson("/api/admin/access",{method:"PATCH",headers:{"Content-Type":"application/json"},body:JSON.stringify({action:"ownerPassword",currentPassword,newPassword})},{timeoutMs:20000});
   window.location.replace("/admin/login");
  }catch(e){setError(userMessage(e,"Could not change your password."))}
  finally{setBusy(false)}
 }
 return <div style={{display:"grid",gap:20,maxWidth:650}}>
  {error&&<div className="site-notice" role="alert"><strong>NIMA.</strong><span>{error}</span></div>}
  {message&&<div className="site-notice" role="status"><strong>NIMA.</strong><span>{message}</span></div>}
  <section className="admin-card" style={{padding:22}}>
   <h2 style={{marginBottom:10}}>Your sign-in</h2>
   <form onSubmit={changeOwner} className="form-grid">
    <div className="field full"><label>Current password</label><input type="password" autoComplete="current-password" required minLength={8} value={currentPassword} onChange={e=>setCurrentPassword(e.target.value)}/></div>
    <div className="field full"><label>New password</label><input type="password" autoComplete="new-password" required minLength={12} maxLength={200} value={newPassword} onChange={e=>setNewPassword(e.target.value)}/></div>
    <div className="field full"><button className="btn" disabled={busy}>Change password</button></div>
   </form>
  </section>
  <section className="admin-card" style={{padding:22}}>
   <h2 style={{marginBottom:10}}>Additional staff account</h2>
   {!loaded?<p>Loading…</p>:<>
    {staff&&<p style={{marginBottom:14}}>Access: <strong>{staff.is_active?"Enabled":"Disabled"}</strong></p>}
    <form onSubmit={saveStaff} className="form-grid">
     <div className="field full"><label>Email</label><input type="email" required autoComplete="off" maxLength={254} value={email} onChange={e=>setEmail(e.target.value)}/></div>
     <div className="field full"><label>{staff?"New password":"Password"}</label><input type="password" autoComplete="new-password" minLength={12} maxLength={200} required value={password} onChange={e=>setPassword(e.target.value)}/></div>
     <div className="field full"><button className="btn" disabled={busy}>{staff?"Update account":"Create account"}</button></div>
    </form>
    {staff&&<div style={{marginTop:16}}><button className="btn secondary" type="button" disabled={busy} onClick={toggle}>{staff.is_active?"Disable account":"Enable account"}</button></div>}
   </>}
  </section>
 </div>;
}
