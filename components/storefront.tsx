import Link from"next/link";
import{Search,Sparkles}from"lucide-react";
import{Product}from"@/lib/store";
import{ProductCard}from"./product-card";

function hrefFor(page:number,search:string,category:string){
 const params=new URLSearchParams();
 if(search)params.set("search",search);
 if(category)params.set("category",category);
 if(page>1)params.set("page",String(page));
 const query=params.toString();
 return "/shop"+(query?"?"+query:"");
}

export function Storefront({products,categories,search="",category="All",page=1,total=0,pageSize=24}:{products:Product[];categories:string[];search?:string;category?:string;page?:number;total?:number;pageSize?:number}){
 const activeCategory=category||"All";
 const pages=Math.max(1,Math.ceil(total/pageSize));

 return <section id="shop" className="section storefront-section">
  <div className="container">
   <div className="section-head"><div><div className="eyebrow">The full edit</div><h2>Find your next favourite.</h2><p className="storefront-count">{total.toLocaleString()} pieces in the catalogue</p></div><form className="searchbar" method="get" action="/shop"><Search size={16}/><input aria-label="Search products" name="search" value={search} placeholder="Search the collection"/>{activeCategory!=="All"&&<input type="hidden" name="category" value={activeCategory}/>}<button type="submit" className="search-submit">Search</button></form></div>
   <div className="category-row" style={{marginBottom:24}}>
    <Link className={"pill "+(activeCategory==="All"?"active":"")} href={hrefFor(1,search,"")}>All</Link>
    {categories.map(x=><Link key={x} className={"pill "+(activeCategory===x?"active":"")} href={hrefFor(1,search,x)}>{x}</Link>)}
   </div>

   {products.length?<div className="product-grid">{products.map(product=><ProductCard key={product.id} product={product}/>)}</div>:<div className="card" style={{padding:48,textAlign:"center"}}><Sparkles size={28} style={{margin:"0 auto 12px"}}/><strong>No pieces match that search.</strong><p style={{color:"var(--muted)"}}>Try another word or switch categories.</p><Link className="btn secondary" href="/shop" style={{marginTop:12}}>Reset filters</Link></div>}

   {pages>1&&<nav className="store-pagination" aria-label="Product pages"><span>Page {page.toLocaleString()} of {pages.toLocaleString()}</span><div><Link className={"btn secondary "+(page<=1?"disabled-link":"")} aria-disabled={page<=1} href={page<=1?hrefFor(1,search,activeCategory==="All"?"":activeCategory):hrefFor(page-1,search,activeCategory==="All"?"":activeCategory)}>Previous</Link><Link className={"btn "+(page>=pages?"disabled-link":"")} aria-disabled={page>=pages} href={page>=pages?hrefFor(page,search,activeCategory==="All"?"":activeCategory):hrefFor(page+1,search,activeCategory==="All"?"":activeCategory)}>Next</Link></div></nav>}
  </div>
 </section>;
}