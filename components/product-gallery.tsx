"use client";
import Image from"next/image";
import{ChevronLeft,ChevronRight,Maximize2,X}from"lucide-react";
import{useEffect,useState}from"react";

export function ProductGallery({images,name}:{images:string[];name:string}){
 const list=images.length?images:["https://placehold.co/1200x1500/F0ECE5/171513?text=NIMA"];
 const [active,setActive]=useState(0),[full,setFull]=useState(false);
 const prev=()=>setActive(i=>(i-1+list.length)%list.length);
 const next=()=>setActive(i=>(i+1)%list.length);
 useEffect(()=>{const onKey=(e:KeyboardEvent)=>{if(e.key==="Escape")setFull(false);if(e.key==="ArrowLeft")prev();if(e.key==="ArrowRight")next()};window.addEventListener("keydown",onKey);return()=>window.removeEventListener("keydown",onKey)},[list.length]);
 return <div className="product-gallery-shell">
   <div className="product-main-image">
     <Image src={list[active]} alt={name+" — product image "+(active+1)+" of "+list.length} fill priority sizes="(max-width:900px) 100vw, 58vw" unoptimized style={{objectFit:"cover"}}/>
     {list.length>1&&<><button className="gallery-arrow gallery-arrow-left" onClick={prev} aria-label="Previous product image"><ChevronLeft size={22}/></button><button className="gallery-arrow gallery-arrow-right" onClick={next} aria-label="Next product image"><ChevronRight size={22}/></button></>}
     <button className="gallery-expand" onClick={()=>setFull(true)} aria-label="Open product image fullscreen"><Maximize2 size={18}/></button>
     {list.length>1&&<span className="gallery-counter">{active+1}/{list.length}</span>}
   </div>
   {list.length>1&&<div className="product-thumbnails" aria-label="Product images">{list.map((img,i)=><button key={img+i} className={"product-thumb "+(i===active?"active":"")} onClick={()=>setActive(i)} aria-label={"View product image "+(i+1)} aria-current={i===active}><Image src={img} alt="" fill sizes="92px" unoptimized style={{objectFit:"cover"}}/></button>)}</div>}
   {full&&<div className="gallery-lightbox" role="dialog" aria-modal="true" aria-label={name+" image viewer"} onClick={()=>setFull(false)}>
      <button className="gallery-lightbox-close" onClick={()=>setFull(false)} aria-label="Close fullscreen image"><X size={22}/></button>
      {list.length>1&&<button className="gallery-arrow gallery-lightbox-left" onClick={e=>{e.stopPropagation();prev()}} aria-label="Previous product image"><ChevronLeft size={26}/></button>}
      <div className="gallery-lightbox-image" onClick={e=>e.stopPropagation()}><Image src={list[active]} alt={name+" — enlarged product image"} fill sizes="100vw" unoptimized style={{objectFit:"contain"}}/></div>
      {list.length>1&&<button className="gallery-arrow gallery-lightbox-right" onClick={e=>{e.stopPropagation();next()}} aria-label="Next product image"><ChevronRight size={26}/></button>}
   </div>}
 </div>
}