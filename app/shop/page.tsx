export const dynamic="force-dynamic";
import{StoreHeader}from"@/components/store-header";
import{Storefront}from"@/components/storefront";
import{getCategories,getStoreProducts}from"@/lib/store";

export default async function Shop({searchParams}:{searchParams:Promise<{search?:string;category?:string;page?:string}>}){
 const params=await searchParams;
 const search=typeof params.search==="string"?params.search:"";
 const category=typeof params.category==="string"?params.category:"";
 const page=Math.max(1,Number(params.page||"1")||1);
 const[p,c]=await Promise.all([getStoreProducts({search,category,page,pageSize:24}),getCategories()]);
 return <><StoreHeader/><main className="container"><div className="section" style={{paddingBottom:30}}><div className="eyebrow">Nima Collection</div><h1 style={{fontSize:"clamp(52px,9vw,110px)",letterSpacing:"-.07em",lineHeight:.86,margin:"12px 0"}}>The full edit.</h1><p style={{maxWidth:520,color:"var(--muted)",lineHeight:1.6}}>Browse the catalogue with server-side search and pagination, so the page stays light even as the collection grows.</p></div></main><Storefront products={p.products} categories={c} search={p.search} category={p.category||"All"} page={p.page} total={p.total} pageSize={p.pageSize}/></>