import{NextResponse}from"next/server";import{z}from"zod";import{sql}from"@/lib/db";
const schema=z.object({items:z.array(z.object({id:z.string().uuid(),name:z.string().trim().min(1).max(120)})).min(1).max(30)});
export async function POST(req:Request){
 try{
  const parsed=schema.safeParse(await req.json());
  if(!parsed.success)return NextResponse.json({error:"Invalid bag contents."},{status:400});
  const input=parsed.data.items;
  const ids=input.map(x=>x.id);
  const names=input.map(x=>x.name.trim().toLowerCase());
  const rows=await sql.query("SELECT id,name,active,stock,price,sale_price,images FROM products WHERE id=ANY($1::uuid[]) OR (active=true AND lower(trim(name))=ANY($2::text[]))",[ids,names]);
  const byId=new Map<string,any>();
  const byName=new Map<string,any[]>();
  for(const row of rows){
   const product={id:String(row.id),name:String(row.name),active:Boolean(row.active),stock:Number(row.stock),price:Number(row.price),salePrice:row.sale_price==null?null:Number(row.sale_price),image:Array.isArray(row.images)&&row.images[0]?String(row.images[0]):""};
   byId.set(product.id,product);
   const key=product.name.trim().toLowerCase();
   byName.set(key,[...(byName.get(key)||[]),product]);
  }
  const replacements:any[]=[];
  const missingIds:string[]=[];
  const unavailable:any[]=[];
  const products:any[]=[];
  for(const item of input){
   const direct=byId.get(item.id);
   if(direct?.active){
    products.push(direct);
    continue;
   }
   const matches=(byName.get(item.name.trim().toLowerCase())||[]).filter(p=>p.active);
   if(matches.length===1){
    replacements.push({fromId:item.id,product:matches[0]});
    products.push(matches[0]);
   }else if(!direct){
    missingIds.push(item.id);
   }else{
    unavailable.push({id:item.id,name:direct.name,reason:"is no longer available"});
   }
  }
  return NextResponse.json({products,replacements,missingIds,unavailable});
 }catch(e){
  console.error("Cart validation failed",e);
  return NextResponse.json({error:"We couldn't refresh your bag right now."},{status:500});
 }
}