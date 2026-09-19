"use client";
import{useRef,useState}from"react";
import type{Order}from"@/lib/store";
import{Download,FileImage,FileText}from"lucide-react";

const money=(n:string|number)=>"₦"+Number(n).toLocaleString();

function safeName(value:string){return value.replace(/[^a-z0-9-_]+/gi,"-").replace(/^-+|-+$/g,"").slice(0,60)||"nima-order";}

export function OrderReceiptTools({order}:{order:Order}){
 const receiptRef=useRef<HTMLDivElement>(null);
 const[busy,setBusy]=useState("");
 const[error,setError]=useState("");

 async function renderReceipt(){
  if(!receiptRef.current)throw new Error("Receipt is not ready.");
  const html2canvas=(await import("html2canvas")).default;
  return html2canvas(receiptRef.current,{scale:2,backgroundColor:"#fff",useCORS:true,logging:false});
 }

 async function downloadImage(){
  setBusy("image");setError("");
  try{
   const canvas=await renderReceipt();
   const blob=await new Promise<Blob|null>(resolve=>canvas.toBlob(resolve,"image/png"));
   if(!blob)throw new Error("Could not create the receipt image.");
   const url=URL.createObjectURL(blob);
   const a=document.createElement("a");a.href=url;a.download=safeName(order.orderNumber)+"-receipt.png";a.click();
   URL.revokeObjectURL(url);
  }catch(e){setError(e instanceof Error?e.message:"Could not create the receipt image.");}
  finally{setBusy("");}
 }

 async function downloadPdf(){
  setBusy("pdf");setError("");
  try{
   const canvas=await renderReceipt();
   const{jsPDF}=await import("jspdf");
   const pdf=new jsPDF({orientation:"portrait",unit:"mm",format:"a4"});
   const margin=10,usable=210-margin*2;
   const pxPerMm=canvas.width/usable;
   const pageHeightPx=(297-margin*2)*pxPerMm;
   let offset=0;
   let page=0;
   while(offset<canvas.height){
    if(page>0)pdf.addPage();
    const slice=document.createElement("canvas");
    slice.width=canvas.width;
    slice.height=Math.min(pageHeightPx,canvas.height-offset);
    const ctx=slice.getContext("2d");
    if(!ctx)throw new Error("Could not prepare the PDF.");
    ctx.fillStyle="#fff";ctx.fillRect(0,0,slice.width,slice.height);
    ctx.drawImage(canvas,0,offset,canvas.width,slice.height,0,0,canvas.width,slice.height);
    const heightMm=slice.height/pxPerMm;
    pdf.addImage(slice.toDataURL("image/png"),"PNG",margin,margin,usable,heightMm);
    offset+=slice.height;page++;
   }
   pdf.save(safeName(order.orderNumber)+"-receipt.pdf");
  }catch(e){setError(e instanceof Error?e.message:"Could not create the PDF receipt.");}
  finally{setBusy("");}
 }

 const items=Array.isArray(order.items)?order.items:[];
 return <>
  <div className="receipt-actions">
   <button className="btn" onClick={downloadPdf} disabled={!!busy}><FileText size={15}/>{busy==="pdf"?"Creating PDF...":"PDF receipt"}</button>
   <button className="btn secondary" onClick={downloadImage} disabled={!!busy}><FileImage size={15}/>{busy==="image"?"Creating image...":"Image receipt"}</button>
  </div>
  {error&&<div className="site-notice" role="alert"><div><strong>NIMA.</strong><span>{error}</span></div></div>}
  <div className="receipt-render-target" aria-hidden="true">
   <div ref={receiptRef} className="receipt-sheet">
    <div className="receipt-brand">NIMA COLLECTION</div>
    <div className="receipt-title">Order receipt</div>
    <div className="receipt-meta"><span>{order.orderNumber}</span><span>{new Date(order.createdAt).toLocaleString()}</span></div>
    <div className="receipt-rule"/>
    <div className="receipt-grid">
     <section><div className="receipt-label">Customer</div><strong>{order.customerName}</strong><span>{order.phone}</span></section>
     <section><div className="receipt-label">Delivery address</div><span>{order.deliveryAddress}</span></section>
    </div>
    <div className="receipt-label receipt-items-label">Purchased items</div>
    <div className="receipt-items">{items.map((item,i)=><div className="receipt-item" key={(item.productId||"item")+i}><div><strong>{item.name}</strong><span>Qty {item.quantity} · {money(item.price)} each</span></div><strong>{money(Number(item.price)*item.quantity)}</strong></div>)}</div>
    <div className="receipt-total"><span>Subtotal</span><strong>{money(order.subtotal)}</strong></div>
    <div className="receipt-total"><span>Delivery</span><strong>{money(order.deliveryFee)}</strong></div>
    <div className="receipt-total receipt-grand"><span>Total</span><strong>{money(order.total)}</strong></div>
    <div className="receipt-status">Status: {order.status.replace("_"," ")}</div>
    {order.note&&<div className="receipt-note"><div className="receipt-label">Customer note</div><span>{order.note}</span></div>}
    <div className="receipt-footer">NIMA COLLECTION · Powered by Timzee Corp</div>
   </div>
  </div>
 </>;
}