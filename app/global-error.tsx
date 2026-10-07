"use client";
import"./globals.css";
import{AlertTriangle,RefreshCw,Home}from"lucide-react";
import{useEffect}from"react";
export default function GlobalError({error,reset}:{error:Error&{digest?:string};reset:()=>void}){
 useEffect(()=>{console.error("NIMA global error",error)},[error]);
 const reference=error.digest?.slice(0,16);
 return <html lang="en"><body><main className="state-page"><div className="state-card"><div className="state-mark"><AlertTriangle size={26}/></div><div className="eyebrow">NIMA COLLECTION · SYSTEM ERROR</div><h1>NIMA needs a quick refresh.</h1><p>The store hit a system-level problem. Refreshing is safe, and your shopping bag is stored on this device.</p>{reference&&<p className="helper-text">Reference: {reference}</p>}<div className="state-actions"><button className="btn" onClick={()=>reset()}><RefreshCw size={16}/> Refresh NIMA</button><a className="btn secondary" href="/"><Home size={16}/> Back home</a></div></div></main></body></html>
}
