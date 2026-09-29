"use client";
import Image from"next/image";
import{Pause,Play}from"lucide-react";
import{useState}from"react";

export function HomeGallery({images}:{images:string[]}){
 const[paused,setPaused]=useState(false);
 if(!images.length)return null;
 const first=[...images,...images],second=[...images.slice().reverse(),...images.slice().reverse()];
 return <section className="home-gallery-section section" aria-label="NIMA product gallery"><div className="container">
  <div className="home-gallery-head"><div><div className="eyebrow">Gallery</div><h2>A living look at NIMA.</h2><p>The gallery updates automatically from product photography in the catalogue.</p></div><button className="icon-btn" type="button" onClick={()=>setPaused(value=>!value)} aria-label={paused?"Resume gallery":"Pause gallery"}>{paused?<Play size={17}/>:<Pause size={17}/>}</button></div>
  <div className={"home-gallery-marquee "+(paused?"paused":"")}><div className="home-gallery-track home-gallery-track-left">{first.map((image,index)=><div className="home-gallery-image" key={"a"+index}><Image src={image} alt="" fill sizes="(max-width:680px) 56vw,24vw" unoptimized style={{objectFit:"cover"}}/></div>)}</div><div className="home-gallery-track home-gallery-track-right">{second.map((image,index)=><div className="home-gallery-image" key={"b"+index}><Image src={image} alt="" fill sizes="(max-width:680px) 56vw,24vw" unoptimized style={{objectFit:"cover"}}/></div>)}</div></div>
 </div></section>;
}
