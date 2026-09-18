"use client";
import { ArrowDown, Play } from "lucide-react";
import { useEffect, useRef, useState } from "react";

export function ScrollHero() {
  const sectionRef=useRef<HTMLElement>(null);
  const videoRef=useRef<HTMLVideoElement>(null);
  const [videoReady,setVideoReady]=useState(false);

  useEffect(()=>{
    let raf=0;
    const update=()=>{
      const s=sectionRef.current,v=videoRef.current;
      if(!s||!v||!videoReady||!Number.isFinite(v.duration)||v.duration<=0)return;
      const total=s.offsetHeight-window.innerHeight;
      const p=Math.max(0,Math.min(1,(window.scrollY-s.offsetTop)/Math.max(total,1)));
      v.currentTime=p*v.duration;
    };
    const onScroll=()=>{cancelAnimationFrame(raf);raf=requestAnimationFrame(update)};
    window.addEventListener("scroll",onScroll,{passive:true});
    window.addEventListener("resize",onScroll);
    return()=>{cancelAnimationFrame(raf);window.removeEventListener("scroll",onScroll);window.removeEventListener("resize",onScroll)};
  },[videoReady]);

  return <section ref={sectionRef} className={"hero "+(videoReady?"hero-video-enabled":"hero-static")} style={{height:videoReady?"145vh":"92vh"}}>
    <div className="hero-stage">
      <div className="hero-poster" aria-hidden="true"/>
      <video ref={videoRef} className="hero-video" src="/hero.mp4" poster="/hero-poster.svg" muted playsInline preload="metadata" onLoadedMetadata={()=>setVideoReady(true)} onError={()=>setVideoReady(false)} aria-hidden="true"/>
      <div className="hero-shade"/>
      <div className="hero-content">
        <div className="hero-kicker">Nima Collection</div>
        <h1>Little things. Big energy.</h1>
        <p className="hero-copy">A curated mix of everyday accessories, statement pieces and useful little upgrades — chosen to make your space and your style feel more like you.</p>
        <div className="hero-actions">
          <a className="btn" href="/shop">Shop the collection</a>
          <a className="btn secondary hero-secondary" href="/about">Our point of view</a>
        </div>
        <div className="hero-scroll">{videoReady?<><ArrowDown size={15}/> Scroll to explore</>:<><Play size={14}/> Explore the collection</>}</div>
      </div>
    </div>
  </section>;
}
