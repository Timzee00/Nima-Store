"use client";
import { createContext, useContext, useEffect, useState } from "react";

type Theme="light"|"dark";
type ThemeContextValue={theme:Theme;toggle:()=>void};
const ThemeContext=createContext<ThemeContextValue|null>(null);

function hasPreferenceConsent(){
  return document.cookie.split("; ").some(x=>x==="nima_cookie_consent=accepted");
}
function readThemeCookie(){
  const item=document.cookie.split("; ").find(x=>x.startsWith("nima_theme="));
  const value=item?.split("=")[1];
  return value==="light"||value==="dark"?value:undefined;
}
function applyTheme(theme:Theme){
  document.documentElement.dataset.theme=theme;
  document.documentElement.style.colorScheme=theme;
}

export function ThemeProvider({children}:{children:React.ReactNode}){
  const [theme,setTheme]=useState<Theme>("light");

  useEffect(()=>{
    let next:Theme|undefined;
    if(hasPreferenceConsent()){
      next=readThemeCookie();
      if(!next){
        try{
          const stored=localStorage.getItem("nima-theme");
          if(stored==="light"||stored==="dark")next=stored;
        }catch{}
      }
    }
    if(!next)next=window.matchMedia?.("(prefers-color-scheme: dark)").matches?"dark":"light";
    setTheme(next);
    applyTheme(next);

    const sync=()=>{
      if(!hasPreferenceConsent()){
        const fallback=window.matchMedia?.("(prefers-color-scheme: dark)").matches?"dark":"light";
        setTheme(fallback);
        applyTheme(fallback);
        return;
      }
      const saved=readThemeCookie();
      if(saved){setTheme(saved);applyTheme(saved);}
    };
    window.addEventListener("nima-consent-change",sync);
    return()=>window.removeEventListener("nima-consent-change",sync);
  },[]);

  function toggle(){
    const next:Theme=theme==="light"?"dark":"light";
    setTheme(next);
    applyTheme(next);
    if(hasPreferenceConsent()){
      try{localStorage.setItem("nima-theme",next)}catch{}
      document.cookie=`nima_theme=${next}; Path=/; Max-Age=31536000; SameSite=Lax${location.protocol==="https:"?"; Secure":""}`;
    }
  }

  return <ThemeContext.Provider value={{theme,toggle}}>{children}</ThemeContext.Provider>;
}
export function useTheme(){
  const value=useContext(ThemeContext);
  if(!value)throw new Error("useTheme must be used inside ThemeProvider");
  return value;
}
