"use client";

import Link from "next/link";
import Image from "next/image";
import{ChevronLeft,ChevronRight,Plus}from"lucide-react";
import{useRef}from"react";
import{Product}from"@/lib/store";
import{useCart}from"./cart";

export function HomeHighlights({products,categories}:{products:Product[];categories:string[]}){
 const ref=useRef<HTMLDivElement>(null);
 const{add}=useCart();

 function move(direction:number){
  ref.current?.scrollBy({left:direction*Math.max(280,ref.current.clientWidth*.72),behavior:"smooth"});
 }

 return <section className="home-highlights section">
  <div className="container">
   <div className="home-highlight-head">
    <div><div className="eyebrow">Fresh from the edit</div><h2>Good things, without the endless scroll.</h2><p>We surface a small, current selection here. The full catalogue lives on Shop.</p></div>
    <div className="home-highlight-controls">
     <button className="icon-btn" onClick={()=>move(-1)} aria-label="Previous products"><ChevronLeft size={18}/></button>
     <button className="icon-btn" onClick={()=>move(1)} aria-label="Next products"><ChevronRight size={18}/></button>
     <Link className="btn secondary" href="/shop">Shop all</Link>
    </div>
   </div>

   <div className="home-carousel" ref={ref} aria-label="Featured NIMA products">
    {products.map(product=>{
      const image=product.images[0];
      const price=Number(product.salePrice??product.price);
      return <article className="home-carousel-card" key={product.id}>
       <Link href={"/products/"+product.slug} className="home-carousel-image">
        {image&&<Image src={image} alt={product.name} fill sizes="(max-width:680px) 76vw, 28vw" unoptimized style={{objectFit:"cover"}}/>}
        {product.featured&&<span className="badge">Featured</span>}
       </Link>
       <div className="home-carousel-info">
        <div className="product-meta">{product.category}</div>
        <div className="home-carousel-row">
         <div><Link href={"/products/"+product.slug}><h3>{product.name}</h3></Link><strong>₦{price.toLocaleString()}</strong></div>
         <button className="small-add" onClick={()=>add({productId:product.id,name:product.name,price,image:image||""})} aria-label={"Add "+product.name+" to bag"}><Plus size={17}/></button>
        </div>
       </div>
      </article>
    })}
   </div>

   {categories.length>0&&<div className="home-category-strip">
    <div className="eyebrow">Shop by category</div>
    <div className="home-category-links">
     {categories.map(category=><Link className="pill" key={category} href={"/shop?category="+encodeURIComponent(category)}>{category}</Link>)}
    </div>
   </div>}
  </div>
 </section>;
}