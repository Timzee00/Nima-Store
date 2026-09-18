"use client";
export function PrivacySettings(){
  function reset(){
    document.cookie="nima_cookie_consent=; Path=/; Max-Age=0; SameSite=Lax";
    document.cookie="nima_theme=; Path=/; Max-Age=0; SameSite=Lax";
    try{localStorage.removeItem("nima-cookie-choice");localStorage.removeItem("nima-theme")}catch{}
    window.dispatchEvent(new Event("nima-consent-change"));
    window.location.reload();
  }
  return <button className="btn secondary" onClick={reset}>Manage privacy choices</button>;
}
