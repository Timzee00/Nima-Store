"use client";
import Image from"next/image";
import Link from"next/link";
import{ChevronLeft,ChevronRight,Plus,ArrowRight}from"lucide-react";
import{useRef}from"react";
import{Product}from"@/lib/store";
import{useCart}from"./cart";

export function HomeHighlights({products}:{products:Product[]}){
 const ref=useRef<HTMLDivElement>(null),{add}=useCart();
 const move=(direction:number)=>ref.current?.scrollBy({left:direction*Math.max(280,ref.current.clientWidth*.78),behavior:"smooth"});
 if(!products.length)return null;
 return <section className="home-highlights section">
  <div className="container">
   <div className="home-highlight-head"><div><div className="eyebrow">The edit</div><h2>Picked for right now.</h2><p>A smaller selection sits here so the homepage stays useful while the full catalogue keeps growing.</p></div><div className="home-highlight-controls"><button className="icon-btn" onClick={()=>move(-1)} aria-label="Previous picks"><ChevronLeft size={18}/></button><button className="icon-btn" onClick={()=>move(1)} aria-label="Next picks"><ChevronRight size={18}/></button><Link className="btn secondary" href="/shop">Shop all <ArrowRight size={15}/></Link></div></div>
   <div className="home-carousel" ref={ref} aria-label="Curated NIMA products">
    {products.map(product=>{
      const image=product.images[0]||"https://placehold.co/900x1125/F0ECE5/171513?text=NIMA",price=Number(product.price);
      return <article className="home-carousel-card" key={product.id}>
       <Link href={"/products/"+product.slug} className="home-carousel-image"><Image src={image} alt={product.name} fill sizes="(max-width:680px) 76vw,(max-width:980px) 36vw,26vw" unoptimized style={{objectFit:"cover"}}/>{product.featured&&<span className="badge">Featured</span>}</Link>
       <div className="home-carousel-info"><div className="product-meta">{product.category}</div><div className="home-carousel-row"><div><Link href={"/products/"+product.slug}><h3>{product.name}</h3></Link><strong>{product.hasVariants?"From ":""}₦{price.toLocaleString()}</strong></div>{product.hasVariants?<Link className="small-add" href={"/products/"+product.slug} aria-label={"Choose options for "+product.name}><ArrowRight size={17}/></Link>:<button className="small-add" disabled={product.stock<1} onClick={()=>add({productId:product.id,name:product.name,price,image})} aria-label={product.stock<1?"Out of stock":"Add "+product.name+" to bag"}><Plus size={17}/></button>}</div></div>
      </article>
    })}
   </div>
  </div>
 </section>;
}
