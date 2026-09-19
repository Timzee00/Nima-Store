import { sql } from "./db";

export type Product={id:string;name:string;slug:string;category:string;description:string;price:string;salePrice:string|null;stock:number;images:string[];featured:boolean;active:boolean};
export type Order={id:string;customerName:string;phone:string;deliveryAddress:string;note:string|null;subtotal:string;deliveryFee:string;total:string;status:string;items:{productId:string;name:string;quantity:number;price:number}[];createdAt:string};

const mapProduct=(r:any):Product=>({id:String(r.id),name:r.name,slug:r.slug,category:r.category,description:r.description,price:String(r.price),salePrice:r.sale_price==null?null:String(r.sale_price),stock:Number(r.stock),images:Array.isArray(r.images)?r.images:[],featured:Boolean(r.featured),active:Boolean(r.active)});

export async function getProducts(options?:{category?:string;search?:string;featured?:boolean}){
  const category=options?.category??"", search=options?.search?.trim()??"", featured=options?.featured??null;
  const rows=await sql.query(
    "SELECT id,name,slug,category,description,price,sale_price,stock,images,featured,active FROM products WHERE active=true AND ($1='' OR category=$1) AND ($2='' OR name ILIKE $3 OR description ILIKE $3) AND ($4::boolean IS NULL OR featured=$4) ORDER BY featured DESC,created_at DESC",
    [category,search,"%"+search+"%",featured]
  );
  return rows.map(mapProduct);
}
export async function getProductBySlug(slug:string){
  const rows=await sql.query("SELECT id,name,slug,category,description,price,sale_price,stock,images,featured,active FROM products WHERE slug=$1 AND active=true LIMIT 1",[slug]);
  return rows[0]?mapProduct(rows[0]):null;
}
export async function getCategories(){
  const rows=await sql.query("SELECT DISTINCT category FROM products WHERE active=true ORDER BY category",[]);
  return rows.map((r:any)=>String(r.category));
}
export async function getAdminStats(){
  const [a,b,c,d]=await Promise.all([
    sql.query("SELECT COUNT(*)::int count FROM products",[]),
    sql.query("SELECT COUNT(*)::int count FROM orders",[]),
    sql.query("SELECT COALESCE(SUM(total),0)::numeric total FROM orders WHERE status<>'cancelled'",[]),
    sql.query("SELECT COUNT(*)::int count FROM products WHERE active=true AND stock<=5",[])
  ]);
  return {products:Number(a[0]?.count??0),orders:Number(b[0]?.count??0),sales:Number(c[0]?.total??0),lowStock:Number(d[0]?.count??0)};
}
export async function getAdminProducts(){
  const rows=await sql.query("SELECT id,name,slug,category,description,price,sale_price,stock,images,featured,active FROM products ORDER BY created_at DESC",[]);
  return rows.map(mapProduct);
}
export async function getSupportTickets(){ const rows=await sql.query("SELECT st.id,st.ticket_number,st.order_id,o.order_number,st.customer_name,st.phone,st.category,st.message,st.status,st.priority,st.staff_note,st.created_at,st.updated_at FROM support_tickets st LEFT JOIN orders o ON o.id=st.order_id ORDER BY created_at DESC LIMIT 100",[]); return rows; }
export async function getRecentOrders(){
  const rows=await sql.query("SELECT id,customer_name,phone,delivery_address,note,subtotal,delivery_fee,total,status,items,created_at FROM orders ORDER BY created_at DESC LIMIT 40",[]);
  return rows.map((r:any):Order=>({id:String(r.id),customerName:r.customer_name,phone:r.phone,deliveryAddress:r.delivery_address,note:r.note,subtotal:String(r.subtotal),deliveryFee:String(r.delivery_fee),total:String(r.total),status:r.status,items:Array.isArray(r.items)?r.items:[],createdAt:new Date(r.created_at).toISOString()}));
}