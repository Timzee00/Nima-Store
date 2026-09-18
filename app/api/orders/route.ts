import{NextResponse}from"next/server";import{z}from"zod";import{sql}from"@/lib/db";
const schema=z.object({customerName:z.string().trim().min(2,"Please enter your name.").max(120,"Name is too long."),phone:z.string().trim().min(7,"Please enter a valid phone number.").max(30,"Phone number is too long."),deliveryAddress:z.string().trim().min(5,"Please enter a fuller delivery address.").max(500,"Delivery address is too long."),note:z.string().max(500,"Note is too long.").optional(),items:z.array(z.object({productId:z.string().uuid(),name:z.string(),quantity:z.number().int().min(1).max(99),price:z.number().nonnegative()})).min(1,"Your bag is empty.").max(30)});
export async function POST(req:Request){
 try{
  const parsed=schema.safeParse(await req.json());
  if(!parsed.success){
   const issue=parsed.error.issues[0];
   return NextResponse.json({error:issue?.message||"Please check your checkout details.",field:issue?.path?.[0]||null},{status:400});
  }
  const d=parsed.data,ids=d.items.map(x=>x.productId);
  if(new Set(ids).size!==ids.length)return NextResponse.json({error:"Duplicate products are not allowed in one order."},{status:400});
  const result=await sql.query(`
WITH input AS (
 SELECT * FROM jsonb_to_recordset($1::jsonb) AS x(product_id uuid,quantity int)
),
matched AS (
 SELECT i.product_id,i.quantity,p.name,p.active,p.stock,COALESCE(p.sale_price,p.price)::numeric AS unit
 FROM input i LEFT JOIN products p ON p.id=i.product_id
),
bad AS (
 SELECT COALESCE(name,'Product') AS name, CASE
   WHEN name IS NULL THEN 'is no longer available'
   WHEN active IS NOT TRUE THEN 'is no longer available'
   WHEN stock < quantity THEN 'only '||stock||' left'
   ELSE 'is unavailable'
 END AS reason
 FROM matched
 WHERE name IS NULL OR active IS NOT TRUE OR stock < quantity
),
ok AS (
 SELECT NOT EXISTS(SELECT 1 FROM bad) AS value
),
updated AS (
 UPDATE products p
 SET stock=p.stock-m.quantity,updated_at=now()
 FROM matched m,ok
 WHERE ok.value AND p.id=m.product_id AND p.stock>=m.quantity AND p.active=true
 RETURNING p.id
),
ins AS (
 INSERT INTO orders(customer_name,phone,delivery_address,note,subtotal,delivery_fee,total,status,items)
 SELECT $2,$3,$4,$5,
   COALESCE((SELECT SUM(unit*quantity) FROM matched),0),
   0,
   COALESCE((SELECT SUM(unit*quantity) FROM matched),0),
   'pending',
   COALESCE((SELECT jsonb_agg(jsonb_build_object('productId',product_id,'name',name,'quantity',quantity,'price',unit)) FROM matched),'[]'::jsonb)
 WHERE (SELECT value FROM ok)
 AND (SELECT count(*) FROM updated)=(SELECT count(*) FROM input)
 RETURNING id,subtotal,items
)
SELECT
 (SELECT id FROM ins) AS id,
 (SELECT subtotal FROM ins) AS subtotal,
 (SELECT items FROM ins) AS items,
 (SELECT jsonb_agg(jsonb_build_object('name',name,'reason',reason)) FROM bad) AS problems
`,[JSON.stringify(d.items),d.customerName,d.phone,d.deliveryAddress,d.note?.trim()||null]);
  const row=result[0];
  if(!row?.id){
   const problems=Array.isArray(row?.problems)?row.problems:[];
   const detail=problems.length
    ? problems.map((x:{name:string;reason:string})=>x.name+" "+x.reason).join("; ")+"."
    : "We couldn't confirm the current availability of your bag. Refresh the bag and try again.";
   return NextResponse.json({error:detail},{status:409});
  }
  return NextResponse.json({orderId:String(row.id),subtotal:Number(row.subtotal??0),items:Array.isArray(row.items)?row.items:[]});
 }catch(e){
  console.error("Order creation failed",e);
  return NextResponse.json({error:"We couldn't place the order right now. Please try again."},{status:500});
 }
}