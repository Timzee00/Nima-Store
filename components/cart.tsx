"use client";
import Image from "next/image";
import { Minus, Plus, ShoppingBag, X } from "lucide-react";
import { createContext, useContext, useEffect, useMemo, useState } from "react";

export type CartItem = { productId:string; name:string; price:number; image:string; quantity:number };
type Ctx = { items:CartItem[]; count:number; subtotal:number; add:(i:Omit<CartItem,"quantity">,q?:number)=>void; change:(id:string,d:number)=>void; remove:(id:string)=>void; open:()=>void };
const CartContext=createContext<Ctx|null>(null);

export function CartProvider({children}:{children:React.ReactNode}) {
  const [items,setItems]=useState<CartItem[]>([]);
  const [isOpen,setOpen]=useState(false);

  useEffect(()=>{try{const x=localStorage.getItem("nima-cart");if(x)setItems(JSON.parse(x))}catch{}},[]);
  useEffect(()=>{localStorage.setItem("nima-cart",JSON.stringify(items))},[items]);

  const value=useMemo<Ctx>(() => {
    const count=items.reduce((a,x)=>a+x.quantity,0);
    const subtotal=items.reduce((a,x)=>a+x.price*x.quantity,0);
    return {
      items,count,subtotal,
      add:(i,q=1)=>{setItems(cur=>{const f=cur.find(x=>x.productId===i.productId);return f?cur.map(x=>x.productId===i.productId?{...x,quantity:x.quantity+q}:x):[...cur,{...i,quantity:q}]});setOpen(true)},
      change:(id,d)=>setItems(cur=>cur.flatMap(x=>x.productId===id?(x.quantity+d>0?[{...x,quantity:x.quantity+d}]:[]):[x])),
      remove:id=>setItems(cur=>cur.filter(x=>x.productId!==id)),
      open:()=>setOpen(true)
    };
  },[items]);

  return <CartContext.Provider value={value}>
    {children}
    <div className={"cart-drawer-wrap "+(isOpen?"open":"")}>
      <div className="cart-backdrop" onClick={()=>setOpen(false)}/>
      <aside className="cart-drawer" aria-label="Shopping bag">
        <div className="cart-head">
          <div><div className="eyebrow">Your bag</div><strong>{value.count} {value.count===1?"item":"items"}</strong></div>
          <button className="icon-btn" onClick={()=>setOpen(false)} aria-label="Close shopping bag"><X size={18}/></button>
        </div>
        <div className="cart-items">
          {items.length===0?<div style={{margin:"auto",textAlign:"center",color:"var(--muted)"}}><ShoppingBag size={34} style={{margin:"0 auto 10px"}}/><div>Your bag is waiting.</div></div>:
          items.map(i=><div className="cart-item" key={i.productId}>
            <div className="cart-thumb">{i.image&&<Image src={i.image} alt={i.name} fill sizes="74px" unoptimized style={{objectFit:"cover"}}/>}</div>
            <div><strong style={{fontSize:14}}>{i.name}</strong><div className="price">₦{i.price.toLocaleString()}</div><div className="qty"><button onClick={()=>value.change(i.productId,-1)} aria-label={"Decrease quantity of "+i.name}><Minus size={13}/></button><span aria-label={"Quantity "+i.quantity}>{i.quantity}</span><button onClick={()=>value.change(i.productId,1)} aria-label={"Increase quantity of "+i.name}><Plus size={13}/></button></div></div>
            <button className="icon-btn" style={{width:34,height:34}} onClick={()=>value.remove(i.productId)} aria-label={"Remove "+i.name+" from shopping bag"}><X size={15}/></button>
          </div>)}
        </div>
        {items.length>0&&<div className="cart-foot"><div className="cart-total"><span>Subtotal</span><span>₦{value.subtotal.toLocaleString()}</span></div><CheckoutForm items={items} subtotal={value.subtotal} clear={()=>setItems([])} close={()=>setOpen(false)}/></div>}
      </aside>
    </div>
  </CartContext.Provider>;
}

function CheckoutForm({items,subtotal,clear,close}:{items:CartItem[];subtotal:number;clear:()=>void;close:()=>void}) {
  const [busy,setBusy]=useState(false),[done,setDone]=useState(false),[consent,setConsent]=useState(false);
  const [form,setForm]=useState({name:"",phone:"",address:"",note:""});

  async function submit(e:React.FormEvent){
    e.preventDefault();
    if(!consent)return;
    const number=process.env.NEXT_PUBLIC_WHATSAPP_NUMBER?.replace(/\D/g,"");
    if(!number){alert("WhatsApp ordering is not configured yet.");return}
    setBusy(true);
    try{
      const res=await fetch("/api/orders",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({customerName:form.name,phone:form.phone,deliveryAddress:form.address,note:form.note,items:items.map(x=>({productId:x.productId,name:x.name,quantity:x.quantity,price:x.price}))})});
      const d=await res.json();
      if(!res.ok)throw new Error(d.error||"Order failed");
      const lines=["Hello NIMA COLLECTION,","I'd like to place an order:","",...items.map(x=>x.quantity+" × "+x.name+" — ₦"+(x.price*x.quantity).toLocaleString()),"","Subtotal: ₦"+subtotal.toLocaleString(),"Order reference: "+d.orderId,"Customer: "+form.name,"Phone: "+form.phone,"Delivery address: "+form.address,...(form.note?["Note: "+form.note]:[])];
      clear();setDone(true);window.location.href="https://wa.me/"+number+"?text="+encodeURIComponent(lines.join("\n"));
    }catch(err){alert(err instanceof Error?err.message:"Could not place order")}finally{setBusy(false)}
  }

  if(done)return <div style={{padding:"18px 0"}}><strong>Opening WhatsApp...</strong><p style={{color:"var(--muted)",lineHeight:1.6}}>Your order details are prepared in the message. Send it to complete the request.</p><button className="btn" onClick={close}>Continue shopping</button></div>;

  return <form className="checkout-form" onSubmit={submit}>
    <div className="field"><label htmlFor="checkout-name">Name</label><input id="checkout-name" required value={form.name} onChange={e=>setForm({...form,name:e.target.value})} placeholder="Full name" autoComplete="name"/></div>
    <div className="field"><label htmlFor="checkout-phone">Phone</label><input id="checkout-phone" required value={form.phone} onChange={e=>setForm({...form,phone:e.target.value})} placeholder="080..." autoComplete="tel"/></div>
    <div className="field"><label htmlFor="checkout-address">Delivery address</label><textarea id="checkout-address" required value={form.address} onChange={e=>setForm({...form,address:e.target.value})} rows={2} placeholder="Where should we deliver?" autoComplete="street-address"/></div>
    <div className="field"><label htmlFor="checkout-note">Note <span style={{fontWeight:400,color:"var(--muted)"}}>optional</span></label><input id="checkout-note" value={form.note} onChange={e=>setForm({...form,note:e.target.value})} placeholder="Size, colour, special instruction..."/></div>
    <label className="consent-check"><input type="checkbox" checked={consent} onChange={e=>setConsent(e.target.checked)} required/><span>I agree that NIMA COLLECTION may use these details to process this order and provide order support. <a href="/privacy">Privacy policy</a></span></label>
    <button className="btn" disabled={busy||!consent}>{busy?"Preparing WhatsApp...":"Order via WhatsApp"}</button>
  </form>;
}

export function useCart(){const x=useContext(CartContext);if(!x)throw new Error("useCart must be used inside CartProvider");return x}
