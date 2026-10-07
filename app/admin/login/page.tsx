"use client";
import{LockKeyhole}from"lucide-react";
import{useState}from"react";
import{ThemeToggle}from"@/components/theme-toggle";
import{requestJson,userMessage}from"@/lib/client-request";

export default function LoginPage(){
 const[email,setEmail]=useState(""),[password,setPassword]=useState(""),[busy,setBusy]=useState(false),[error,setError]=useState("");
 async function submit(e:React.FormEvent){
  e.preventDefault();setBusy(true);setError("");
  if(!email.trim()){setError("Enter the admin email address.");setBusy(false);return}
  if(password.length<8){setError("Password must be at least 8 characters.");setBusy(false);return}
  try{
   await requestJson("/api/admin/login",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({email,password})},{timeoutMs:15000,fallback:"Could not sign in."});
   location.href="/admin";
  }catch(cause){setError(userMessage(cause,"Could not sign in. Please try again."))}
  finally{setBusy(false)}
 }
 return <main className="login-page"><div className="login-theme"><ThemeToggle/></div><form className="login-card" onSubmit={submit}><div className="eyebrow">Nima Collection</div><h1>Control room.</h1><p>Private admin access for inventory, products and orders.</p><div className="field" style={{marginTop:22}}><label>Email</label><input type="email" required value={email} onChange={e=>setEmail(e.target.value)} autoComplete="username"/></div><div className="field"><label>Password</label><input type="password" required value={password} onChange={e=>setPassword(e.target.value)} autoComplete="current-password"/></div>{error&&<div className="site-notice" role="alert"><div><strong>NIMA.</strong><span>{error}</span></div></div>}<button className="btn" style={{width:"100%",marginTop:14}} disabled={busy}><LockKeyhole size={16}/>{busy?"Checking access…":"Sign in"}</button><a href="/" style={{display:"block",textAlign:"center",marginTop:16,color:"var(--muted)",fontSize:13}}>Back to store</a></form></main>
}
