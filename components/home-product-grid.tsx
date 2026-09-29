import{Product}from"@/lib/store";
import{ProductCard}from"./product-card";
export function HomeProductGrid({products,eyebrow,title,description}:{products:Product[];eyebrow:string;title:string;description?:string}){
 if(!products.length)return null;
 return <section className="home-product-grid-section section"><div className="container"><div className="section-head home-grid-head"><div><div className="eyebrow">{eyebrow}</div><h2>{title}</h2>{description&&<p>{description}</p>}</div><a className="btn secondary" href="/shop">View all</a></div><div className="product-grid home-product-grid">{products.map(product=><ProductCard key={product.id} product={product}/>)}</div></div></section>;
}
