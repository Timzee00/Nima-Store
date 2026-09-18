"use client";
import Link from "next/link";
import { useEffect, useState } from "react";

type Choice="essential"|"accepted";

export function CookieConsent(){
  const [visible,setVisible]=useState(false);
  const [busy,setBusy]=useState(false);

  useEffect(()=>{
    const exists=document.cookie.split("; ").some(x=>x.startsWith("nima_cookie_consent="));
    if(!exists)setVisible(true);
  },[]);

  async function choose(choice:Choice){
    if(busy)return;
    setBusy(true);
    try{
      const r=await fetch("/api/consent",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({choice})});
      if(!r.ok)throw new Error("Could not save privacy choice.");
      if(choice==="essential"){
        try{localStorage.removeItem("nima-theme")}catch{}
        document.cookie="nima_theme=; Path=/; Max-Age=0; SameSite=Lax";
      }
      setVisible(false);
      window.dispatchEvent(new Event("nima-consent-change"));
    }catch{
      alert("Could not save privacy choice. Please try again.");
    }finally{setBusy(false)}
  }

  if(!visible)return null;

  return <div className="consent-banner" role="dialog" aria-modal="true" aria-labelledby="cookie-title" aria-describedby="cookie-copy">
    <div>
      <div className="eyebrow">Privacy choices</div>
      <strong id="cookie-title">Choose how NIMA uses browser storage.</strong>
      <p id="cookie-copy">Essential storage keeps the shopping bag and core site functions working. Allow preferences to remember your dark or light theme between visits. No optional advertising or analytics is enabled by this banner.</p>
      <p className="consent-links"><Link href="/privacy">Privacy policy</Link> · <Link href="/cookies">Cookies & storage</Link></p>
    </div>
    <div className="consent-actions">
      <button className="btn secondary" onClick={()=>choose("essential")} disabled={busy}>Essential only</button>
      <button className="btn" onClick={()=>choose("accepted")} disabled={busy}>{busy?"Saving...":"Allow preferences"}</button>
    </div>
  </div>;
}
