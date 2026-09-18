"use client";
import Link from "next/link";
import { useEffect, useState } from "react";

export function CookieConsent() {
  const [visible,setVisible]=useState(false);

  useEffect(()=>{
    try {
      if (!localStorage.getItem("nima-cookie-choice")) setVisible(true);
    } catch {}
  },[]);

  function choose(value:"accepted"|"essential") {
    try { localStorage.setItem("nima-cookie-choice",value); } catch {}
    setVisible(false);
  }

  if (!visible) return null;

  return <div className="consent-banner" role="dialog" aria-labelledby="cookie-title" aria-describedby="cookie-copy">
    <div>
      <div className="eyebrow">Privacy choices</div>
      <strong id="cookie-title">A quick note about browser storage.</strong>
      <p id="cookie-copy">NIMA uses essential browser storage for the shopping bag and site preferences. Read the <Link href="/cookies">Cookie & Storage Policy</Link> for details.</p>
    </div>
    <div className="consent-actions">
      <button className="btn secondary" onClick={()=>choose("essential")}>Essential only</button>
      <button className="btn" onClick={()=>choose("accepted")}>Accept</button>
    </div>
  </div>;
}
