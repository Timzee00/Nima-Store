"use client";
import Image from "next/image";
import { Minus, Plus, ShoppingBag, X, ArrowRight } from "lucide-react";
import { createContext, useContext, useEffect, useMemo, useState } from "react";
import Link from "next/link";

export type CartItem = { productId:string; name:string; price:number; image:string; quantity:number };
type Ctx = { items:CartItem[]; count:number; subtotal:number; add:(i:Omit<CartItem,"quantity">,q?:number)=>void; change:(id:string,d:number)=>void; remove:(id:string)=>void; clear:()=>void; open:()=>void };
const CartContext=createContext<Ctx|null>(null);

export function CartProvider({children}:{children:React.ReactNode}) {
  const [items,setItems]=useState<CartItem[]>([]);
  const [isOpen,setOpen]=useState(false);

  useEffect(()=>{try{const x=localStorage.getItem("nima-cart");if(x)setItems(JSON.parse(x))}catch{}},[]);
  useEffect(()=>{try{localStorage.setItem("nima-cart",JSON.stringify(items))}catch{}},[items]);

  const value=useMemo<Ctx>(() => {
    const count=items.reduce((a,x)=>a+x.quantity,0);
    const subtotal=items.reduce((a,x)=>a+x.price*x.quantity,0);
    return {
      items,count,subtotal,
      add:(i,q=1)=>setItems(cur=>{const f=cur.find(x=>x.productId===i.productId);return f?cur.map(x=>x.productId===i.productId?{...x,quantity:x.quantity+q}:x):[...cur,{...i,quantity:q}]}),
      change:(id,d)=>setItems(cur=>cur.flatMap(x=>x.productId===id?(x.quantity+d>0?[{...x,quantity:x.quantity+d}]:[]):[x])),
      remove:id=>setItems(cur=>cur.filter(x=>x.productId!==id)),
      clear:()=>setItems([]),open:()=>setOpen(true)
    };
  },[items]);

  return <CartContext.Provider value={value}>
    {children}
    <div className={"cart-drawer-wrap "+(isOpen?"open":"")} aria-hidden={!isOpen}>
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
        {items.length>0&&<div className="cart-foot">
          <div className="cart-total"><span>Subtotal</span><span>₦{value.subtotal.toLocaleString()}</span></div>
          <div className="drawer-actions">
            <Link className="btn secondary" href="/cart" onClick={()=>setOpen(false)}>View bag</Link>
            <Link className="btn" href="/checkout" onClick={()=>setOpen(false)}>Checkout <ArrowRight size={16}/></Link>
          </div>
        </div>}
      </aside>
    </div>
  </CartContext.Provider>;
}

export function CheckoutForm() {
  const {items,subtotal,clear}=useCart();
  const [busy,setBusy]=useState(false),[consent,setConsent]=useState(false),[notice,setNotice]=useState("");
  const [form,setForm]=useState({name:"",phone:"",address:"",note:""});

  async function submit(e:React.FormEvent){
    e.preventDefault();
    if(!consent)return;
    const number=process.env.NEXT_PUBLIC_WHATSAPP_NUMBER?.replace(/\D/g,"");
    if(!number){setNotice("WhatsApp ordering is not configured yet. Please contact the store.");return}
    setBusy(true);setNotice("");
    try{
      const res=await fetch("/api/orders",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({customerName:form.name,phone:form.phone,deliveryAddress:form.address,note:form.note,items:items.map(x=>({productId:x.productId,name:x.name,quantity:x.quantity,price:x.price}))})});
      const d=await res.json();
      if(!res.ok)throw new Error(d.error||"We couldn't place your order.");
      const lines=["Hello NIMA COLLECTION,","I'd like to place an order:","",...d.items.map((x:{quantity:number;name:string;price:number})=>x.quantity+" × "+x.name+" — ₦"+(x.price*x.quantity).toLocaleString()),"","Subtotal: ₦"+Number(d.subtotal??subtotal).toLocaleString(),"Order reference: "+d.orderId,"Customer: "+form.name,"Phone: "+form.phone,"Delivery address: "+form.address,...(form.note?["Note: "+form.note]:[])];
      clear();
      window.location.href="https://wa.me/"+number+"?text="+encodeURIComponent(lines.join("\n"));
    }catch(err){setNotice(err instanceof Error?err.message:"We couldn't place your order. Please try again.")}
    finally{setBusy(false)}
  }

  if(!items.length)return <div className="checkout-empty card"><div className="eyebrow">Your bag</div><h2>Your bag is empty.</h2><p>Add products before checking out.</p><Link className="btn" href="/shop">Browse the collection</Link></div>;

  return <div className="checkout-layout">
    <div className="card checkout-summary">
      <div className="eyebrow">Order summary</div>
      <div className="checkout-products">{items.map(i=><div className="checkout-product" key={i.productId}><div className="checkout-product-image">{i.image&&<Image src={i.image} alt={i.name} fill sizes="72px" unoptimized style={{objectFit:"cover"}}/>}</div><div><strong>{i.name}</strong><div className="checkout-product-meta">Qty {i.quantity} · ₦{(i.price*i.quantity).toLocaleString()}</div></div></div>)}</div>
      <div className="cart-total"><span>Subtotal</span><span>₦{subtotal.toLocaleString()}</span></div>
      <p className="checkout-note">Delivery fees, where applicable, are confirmed by the store before fulfilment.</p>
    </div>
    <form className="card checkout-card" onSubmit={submit}>
      <div><div className="eyebrow">Customer details</div><h2>Complete your order.</h2></div>
      <div className="checkout-form">
        <div className="field"><label htmlFor="checkout-name">Name</label><input id="checkout-name" required value={form.name} onChange={e=>setForm({...form,name:e.target.value})} placeholder="Full name" autoComplete="name"/></div>
        <div className="field"><label htmlFor="checkout-phone">Phone</label><input id="checkout-phone" required value={form.phone} onChange={e=>setForm({...form,phone:e.target.value})} placeholder="080..." autoComplete="tel"/></div>
        <div className="field"><label htmlFor="checkout-address">Delivery address</label><textarea id="checkout-address" required value={form.address} onChange={e=>setForm({...form,address:e.target.value})} rows={3} placeholder="Where should we deliver?" autoComplete="street-address"/></div>
        <div className="field"><label htmlFor="checkout-note">Note <span style={{fontWeight:400,color:"var(--muted)"}}>optional</span></label><input id="checkout-note" value={form.note} onChange={e=>setForm({...form,note:e.target.value})} placeholder="Size, colour, special instruction..."/></div>
        <label className="consent-check"><input type="checkbox" checked={consent} onChange={e=>setConsent(e.target.checked)} required/><span>I agree that NIMA COLLECTION may use these details to process this order and provide order support. <a href="/privacy">Privacy policy</a></span></label>
        {notice&&<div className="site-notice" role="alert"><div><strong>NIMA.</strong><span>{notice}</span></div><button type="button" onClick={()=>setNotice("")} aria-label="Dismiss message"><X size={15}/></button></div>}
        <button className="btn" disabled={busy||!consent}>{busy?"Preparing WhatsApp...":"Send order to WhatsApp"}</button>
      </div>
    </form>
  </div>;
}

export function useCart(){const x=useContext(CartContext);if(!x)throw new Error("useCart must be used inside CartProvider");return x}
