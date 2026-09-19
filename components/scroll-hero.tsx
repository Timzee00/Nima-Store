"use client";
import{ArrowDown,Play}from"lucide-react";
import{useEffect,useRef,useState}from"react";

export function ScrollHero(){
 const sectionRef=useRef<HTMLElement>(null);
 const videoRef=useRef<HTMLVideoElement>(null);
 const[videoReady,setVideoReady]=useState(false);
 const[compact,setCompact]=useState(false);

 useEffect(()=>{
  const media=window.matchMedia("(max-width: 900px)");
  const sync=()=>setCompact(media.matches);
  sync();
  media.addEventListener?.("change",sync);
  return()=>media.removeEventListener?.("change",sync);
 },[]);

 useEffect(()=>{
  const video=videoRef.current;
  if(!video||!videoReady)return;

  if(compact){
   video.currentTime=0;
   void video.play().catch(()=>{});
   return;
  }

  video.pause();
  let raf=0;
  const update=()=>{
   const section=sectionRef.current;
   if(!section||!Number.isFinite(video.duration)||video.duration<=0)return;
   const total=section.offsetHeight-window.innerHeight;
   const progress=Math.max(0,Math.min(1,(window.scrollY-section.offsetTop)/Math.max(total,1)));
   video.currentTime=progress*video.duration;
  };
  const onScroll=()=>{cancelAnimationFrame(raf);raf=requestAnimationFrame(update)};
  window.addEventListener("scroll",onScroll,{passive:true});
  window.addEventListener("resize",onScroll);
  onScroll();
  return()=>{cancelAnimationFrame(raf);window.removeEventListener("scroll",onScroll);window.removeEventListener("resize",onScroll)};
 },[videoReady,compact]);

 return <section ref={sectionRef} className={"hero "+(videoReady?"hero-video-enabled":"hero-static")+(compact?" hero-mobile":"")} style={{height:videoReady&&!compact?"145vh":"92vh"}}>
  <div className="hero-stage">
   <div className="hero-poster" aria-hidden="true"/>
   <video ref={videoRef} className="hero-video" src="/nima-hero-6.mp4" poster="/hero-poster.svg" muted playsInline autoPlay={compact} loop={compact} preload="auto" onLoadedMetadata={()=>setVideoReady(true)} onError={()=>setVideoReady(false)} aria-hidden="true"/>
   <div className="hero-shade"/>
   <div className="hero-content">
    <div className="hero-kicker">Nima Collection</div>
    <h1>Little things. Big energy.</h1>
    <p className="hero-copy">A curated mix of everyday accessories, statement pieces and useful little upgrades — chosen to make your space and your style feel more like you.</p>
    <div className="hero-actions"><a className="btn" href="/shop">Shop the collection</a><a className="btn secondary hero-secondary" href="/about">Our point of view</a></div>
    <div className="hero-scroll">{videoReady&&!compact?<><ArrowDown size={15}/> Scroll to explore</>:<><Play size={14}/> Explore the collection</>}</div>
   </div>
  </div>
 </section>;
}