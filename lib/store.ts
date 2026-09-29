import{sql}from"./db";
import{getProductVariants,getProductVariantsMap,ProductVariant}from"./product-variants";

export type Product={id:string;name:string;slug:string;category:string;description:string;price:string;salePrice:string|null;stock:number;images:string[];featured:boolean;active:boolean;hasVariants:boolean;variants?:ProductVariant[]};
export type Order={id:string;orderNumber:string;customerName:string;phone:string;deliveryAddress:string;note:string|null;subtotal:string;deliveryFee:string;total:string;status:string;items:{productId:string;name:string;quantity:number;price:number;variantId?:string;options?:Record<string,string>}[];createdAt:string};
export type SupportTicket={id:string;ticket_number:string;order_id:string|null;order_number:string|null;customer_name:string;phone:string;category:string;message:string;status:"open"|"in_progress"|"resolved"|"closed";priority:"low"|"normal"|"high"|"urgent";staff_note:string|null;created_at:string;updated_at:string};

const mapProduct=(r:any):Product=>({id:String(r.id),name:r.name,slug:r.slug,category:r.category,description:r.description,price:String(r.price),salePrice:r.sale_price==null?null:String(r.sale_price),stock:Number(r.stock),images:Array.isArray(r.images)?r.images:[],featured:Boolean(r.featured),active:Boolean(r.active),hasVariants:false});

async function enrichProducts(products:Product[],includeVariants=false){
 const map=await getProductVariantsMap(products.map(p=>p.id));
 return products.map(p=>{
  const variants=map.get(p.id)||[];
  if(!variants.length)return {...p,hasVariants:false};
  const minPrice=Math.min(...variants.map(v=>Number(v.price)));
  return {...p,hasVariants:true,price:String(minPrice),salePrice:null,...(includeVariants?{variants}:{})};
 });
}

export async function getProducts(options?:{category?:string;search?:string;featured?:boolean}){
 const category=options?.category??"",search=options?.search?.trim()??"",featured=options?.featured??null;
 const rows=await sql.query("SELECT id,name,slug,category,description,price,sale_price,stock,images,featured,active FROM products WHERE active=true AND ($1='' OR category=$1) AND ($2='' OR name ILIKE $3 OR description ILIKE $3) AND ($4::boolean IS NULL OR featured=$4) ORDER BY featured DESC,created_at DESC",[category,search,"%"+search+"%",featured]);
 return enrichProducts(rows.map(mapProduct));
}

export async function getProductBySlug(slug:string){
 const rows=await sql.query("SELECT id,name,slug,category,description,price,sale_price,stock,images,featured,active FROM products WHERE slug=$1 AND active=true LIMIT 1",[slug]);
 if(!rows[0])return null;
 const base=mapProduct(rows[0]),variants=await getProductVariants(base.id);
 if(!variants.length)return base;
 return {...base,hasVariants:true,price:String(Math.min(...variants.map(v=>Number(v.price)))),salePrice:null,variants};
}

export async function getCategories(){
 const rows=await sql.query("SELECT DISTINCT category FROM products WHERE active=true ORDER BY category",[]);
 return rows.map((r:any)=>String(r.category));
}

export async function getAdminStats(){
 const[a,b,c,d]=await Promise.all([
  sql.query("SELECT COUNT(*)::int count FROM products",[]),
  sql.query("SELECT COUNT(*)::int count FROM orders",[]),
  sql.query("SELECT COALESCE(SUM(total),0)::numeric total FROM orders WHERE status<>'cancelled'",[]),
  sql.query("SELECT COUNT(*)::int count FROM products WHERE active=true AND stock<=5",[])
 ]);
 return {products:Number(a[0]?.count??0),orders:Number(b[0]?.count??0),sales:Number(c[0]?.total??0),lowStock:Number(d[0]?.count??0)};
}

export async function getAdminProducts(options:{search?:string;page?:number;pageSize?:number;lowStock?:boolean}={}){
 const search=options.search?.trim()??"",page=Math.max(1,Math.floor(options.page??1)),pageSize=Math.min(50,Math.max(1,Math.floor(options.pageSize??24))),lowStock=Boolean(options.lowStock),like="%"+search+"%";
 const[countRows,rows]=await Promise.all([
  sql.query("SELECT COUNT(*)::int count FROM products WHERE active=true AND ($1='' OR name ILIKE $2 OR category ILIKE $2 OR slug ILIKE $2) AND ($3::boolean=false OR stock<=5)",[search,like,lowStock]),
  sql.query("SELECT id,name,slug,category,description,price,sale_price,stock,images,featured,active FROM products WHERE active=true AND ($1='' OR name ILIKE $2 OR category ILIKE $2 OR slug ILIKE $2) AND ($3::boolean=false OR stock<=5) ORDER BY CASE WHEN $3::boolean THEN stock END ASC,CASE WHEN $3::boolean THEN updated_at END DESC,CASE WHEN $3::boolean=false THEN created_at END DESC,id DESC LIMIT $4 OFFSET $5",[search,like,lowStock,pageSize,(page-1)*pageSize])
 ]);
 return {products:await enrichProducts(rows.map(mapProduct),true),total:Number(countRows[0]?.count??0),page,pageSize};
}

export async function getSupportTickets():Promise<SupportTicket[]>{
 const rows=await sql.query("SELECT st.id,st.ticket_number,st.order_id,o.order_number,st.customer_name,st.phone,st.category,st.message,st.status,st.priority,st.staff_note,st.created_at,st.updated_at FROM support_tickets st LEFT JOIN orders o ON o.id=st.order_id ORDER BY st.created_at DESC,st.id DESC LIMIT 100",[]);
 return rows.map((r:any):SupportTicket=>({id:String(r.id),ticket_number:String(r.ticket_number),order_id:r.order_id?String(r.order_id):null,order_number:r.order_number?String(r.order_number):null,customer_name:String(r.customer_name),phone:String(r.phone),category:String(r.category),message:String(r.message),status:r.status,priority:r.priority,staff_note:r.staff_note==null?null:String(r.staff_note),created_at:new Date(r.created_at).toISOString(),updated_at:new Date(r.updated_at).toISOString()}));
}

export async function getRecentOrders(options:{search?:string;status?:string;page?:number;pageSize?:number}={}){
 const search=options.search?.trim()??"",status=options.status?.trim()??"",page=Math.max(1,Math.floor(options.page??1)),pageSize=Math.min(50,Math.max(1,Math.floor(options.pageSize??20))),like="%"+search+"%";
 const[countRows,rows]=await Promise.all([
  sql.query("SELECT COUNT(*)::int count FROM orders WHERE ($1='' OR order_number ILIKE $2 OR customer_name ILIKE $2 OR phone ILIKE $2) AND ($3='' OR status=$3)",[search,like,status]),
  sql.query("SELECT id,order_number,customer_name,phone,delivery_address,note,subtotal,delivery_fee,total,status,items,created_at FROM orders WHERE ($1='' OR order_number ILIKE $2 OR customer_name ILIKE $2 OR phone ILIKE $2) AND ($3='' OR status=$3) ORDER BY created_at DESC,id DESC LIMIT $4 OFFSET $5",[search,like,status,pageSize,(page-1)*pageSize])
 ]);
 return {orders:rows.map((r:any):Order=>({id:String(r.id),orderNumber:String(r.order_number),customerName:r.customer_name,phone:r.phone,deliveryAddress:r.delivery_address,note:r.note,subtotal:String(r.subtotal),deliveryFee:String(r.delivery_fee),total:String(r.total),status:r.status,items:Array.isArray(r.items)?r.items:[],createdAt:new Date(r.created_at).toISOString()})),total:Number(countRows[0]?.count??0),page,pageSize};
}

export async function getHomepageProducts(limit=20){
 const safeLimit=Math.min(32,Math.max(8,Math.floor(limit)||20));
 const rows=await sql.query("SELECT id,name,slug,category,description,price,sale_price,stock,images,featured,active FROM products WHERE active=true AND stock>0 ORDER BY featured DESC,updated_at DESC,created_at DESC,id DESC LIMIT $1",[safeLimit]);
 return enrichProducts(rows.map(mapProduct),true);
}

export async function getHomepageFeaturedProducts(limit=12){
 const safeLimit=Math.min(24,Math.max(4,Math.floor(limit)||12));
 const rows=await sql.query("SELECT id,name,slug,category,description,price,sale_price,stock,images,featured,active FROM products WHERE active=true AND stock>0 AND featured=true ORDER BY updated_at DESC,created_at DESC,id DESC LIMIT $1",[safeLimit]);
 return enrichProducts(rows.map(mapProduct),true);
}

export async function getHomepageCategories(limit=6){
 const safeLimit=Math.min(8,Math.max(3,Math.floor(limit)||6));
 const rows=await sql.query("WITH counts AS (SELECT category,COUNT(*)::int count FROM products WHERE active=true GROUP BY category),hero AS (SELECT DISTINCT ON(category) category,images->>0 image FROM products WHERE active=true AND jsonb_array_length(images)>0 ORDER BY category,featured DESC,updated_at DESC,created_at DESC) SELECT counts.category,counts.count,hero.image FROM counts LEFT JOIN hero ON hero.category=counts.category ORDER BY counts.count DESC,counts.category ASC LIMIT $1",[safeLimit]);
 return rows.map((r:any)=>({category:String(r.category),count:Number(r.count||0),image:r.image?String(r.image):""}));
}

export async function getHomepageGalleryImages(limit=20){
 const safeLimit=Math.min(30,Math.max(8,Math.floor(limit)||20));
 const rows=await sql.query("SELECT images FROM products WHERE active=true AND jsonb_array_length(images)>0 ORDER BY featured DESC,updated_at DESC,created_at DESC LIMIT $1",[safeLimit]);
 const images:string[]=[],seen=new Set<string>();
 for(const row of rows){
  for(const image of Array.isArray(row.images)?row.images:[]){
   const value=String(image||"").trim();
   if(!value||seen.has(value))continue;
   seen.add(value);images.push(value);
   if(images.length>=24)return images;
  }
 }
 return images;
}

export async function getStoreProducts(options:{search?:string;category?:string;page?:number;pageSize?:number}={}){
 const search=options.search?.trim()??"",category=options.category?.trim()??"",page=Math.max(1,Math.floor(options.page??1)),pageSize=Math.min(48,Math.max(12,Math.floor(options.pageSize??24))),like="%"+search+"%";
 const[countRows,rows]=await Promise.all([
  sql.query("SELECT COUNT(*)::int count FROM products WHERE active=true AND ($1='' OR category=$1) AND ($2='' OR name ILIKE $3)",[category,search,like]),
  sql.query("SELECT id,name,slug,category,description,price,sale_price,stock,images,featured,active FROM products WHERE active=true AND ($1='' OR category=$1) AND ($2='' OR name ILIKE $3 OR category ILIKE $3) ORDER BY CASE WHEN stock>0 THEN 0 ELSE 1 END,featured DESC,created_at DESC,id DESC LIMIT $4 OFFSET $5",[category,search,like,pageSize,(page-1)*pageSize])
 ]);
 return {products:await enrichProducts(rows.map(mapProduct)),total:Number(countRows[0]?.count??0),page,pageSize,category,search};
}

export async function getCategoryMergeSuggestions(){
 const rows=await sql.query("SELECT category,COUNT(*)::int count FROM products WHERE active=true GROUP BY category ORDER BY category ASC",[]);
 const groups=new Map<string,{labels:string[];products:number}>();
 for(const row of rows){
  const label=String(row.category).trim(),key=label.toLowerCase().replace(/[^a-z0-9]+/g,"");
  if(!key)continue;
  const current=groups.get(key)||{labels:[],products:0};
  current.labels.push(label);current.products+=Number(row.count||0);groups.set(key,current);
 }
 return [...groups.values()].filter(group=>group.labels.length>1).sort((a,b)=>b.products-a.products||a.labels[0].localeCompare(b.labels[0])).slice(0,6);
}
