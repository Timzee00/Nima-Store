import{NextResponse}from"next/server";import{z}from"zod";import{sql}from"@/lib/db";
const schema=z.object({ids:z.array(z.string().uuid()).min(1).max(30)});
export async function POST(req:Request){
 try{
  const parsed=schema.safeParse(await req.json());
  if(!parsed.success)return NextResponse.json({error:"Invalid bag contents."},{status:400});
  const rows=await sql.query("SELECT id,name,active,stock,price,sale_price,images FROM products WHERE id=ANY($1::uuid[])",[parsed.data.ids]);
  const products=rows.map((r:any)=>({id:String(r.id),name:String(r.name),active:Boolean(r.active),stock:Number(r.stock),price:Number(r.price),salePrice:r.sale_price==null?null:Number(r.sale_price),image:Array.isArray(r.images)&&r.images[0]?String(r.images[0]):""}));
  const found=new Set(products.filter((p:any)=>p.active).map((p:any)=>p.id));
  const missingIds=parsed.data.ids.filter(id=>!found.has(id));
  const unavailable=products.filter((p:any)=>!p.active).map((p:any)=>({id:p.id,name:p.name,reason:"is no longer available"}));
  return NextResponse.json({products,missingIds,unavailable});
 }catch(e){
  console.error("Cart validation failed",e);
  return NextResponse.json({error:"We couldn't refresh your bag right now."},{status:500});
 }
}