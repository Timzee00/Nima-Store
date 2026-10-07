"use client";
import Link from"next/link";
import{AlertTriangle,RefreshCw,Home}from"lucide-react";
export default function Error({error,reset}:{error:Error&{digest?:string};reset:()=>void}){
 const reference=error.digest?.slice(0,16);
 return <main className="state-page"><div className="state-card"><div className="state-mark"><AlertTriangle size={26}/></div><div className="eyebrow">NIMA COLLECTION · ERROR</div><h1>Something interrupted the store.</h1><p>We could not finish loading this page. Your shopping bag remains on this device, so it is safe to try again.</p>{reference&&<p className="helper-text">Reference: {reference}</p>}<div className="state-actions"><button className="btn" onClick={()=>reset()}><RefreshCw size={16}/> Try again</button><Link className="btn secondary" href="/"><Home size={16}/> Back home</Link></div></div></main>
}
