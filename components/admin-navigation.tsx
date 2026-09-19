"use client";
import Link from "next/link";
import{Box,ClipboardList,LayoutDashboard,MessageSquare,Menu,Store,X}from"lucide-react";
import{useEffect,useState}from"react";

export function AdminNavigation(){
 const[open,setOpen]=useState(false);
 useEffect(()=>{
  const onKey=(event:KeyboardEvent)=>{if(event.key==="Escape")setOpen(false)};
  window.addEventListener("keydown",onKey);
  document.body.style.overflow=open?"hidden":"";
  return()=>{window.removeEventListener("keydown",onKey);document.body.style.overflow=""};
 },[open]);

 return <>
  <button className="admin-mobile-menu-trigger" onClick={()=>setOpen(true)} aria-label="Open admin menu" aria-expanded={open}><Menu size={19}/></button>
  <div className={"admin-nav-shell "+(open?"open":"")}>
   <button className="admin-nav-backdrop" onClick={()=>setOpen(false)} aria-label="Close admin menu"/>
   <aside className="admin-sidebar" aria-label="Admin navigation">
    <div className="admin-sidebar-head">
     <div><strong>NIMA.</strong><span>Control room</span></div>
     <button className="icon-btn admin-sidebar-close" onClick={()=>setOpen(false)} aria-label="Close admin menu"><X size={17}/></button>
    </div>
    <nav className="admin-sidebar-nav">
     <div className="eyebrow">Workspace</div>
     <Link href="/admin" onClick={()=>setOpen(false)}><LayoutDashboard size={17}/> Dashboard</Link>
     <Link href="/admin#inventory" onClick={()=>setOpen(false)}><Box size={17}/> Inventory</Link>
     <Link href="/admin#orders" onClick={()=>setOpen(false)}><ClipboardList size={17}/> Orders</Link>
     <Link href="/admin#low-stock" onClick={()=>setOpen(false)}><Box size={17}/> Low stock</Link>
     <Link href="/admin/support" onClick={()=>setOpen(false)}><MessageSquare size={17}/> Support</Link>
     <div className="eyebrow admin-sidebar-rule">Store</div>
     <Link href="/" target="_blank" rel="noreferrer" onClick={()=>setOpen(false)}><Store size={17}/> View storefront</Link>
    </nav>
    <div className="admin-sidebar-foot"><span>Private staff area</span><a href="/admin/login" onClick={async()=>{await fetch("/api/admin/logout",{method:"POST"});setOpen(false)}}>Sign out</a></div>
   </aside>
  </div>
 </>;
}