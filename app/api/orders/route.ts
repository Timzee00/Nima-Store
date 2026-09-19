import{NextResponse}from"next/server";import{z}from"zod";import{sql}from"@/lib/db";

const schema=z.object({
 customerName:z.string().trim().min(2,"Please enter your name.").max(120,"Name is too long."),
 phone:z.string().trim().min(7,"Please enter a valid phone number.").max(30,"Phone number is too long."),
 deliveryAddress:z.string().trim().min(5,"Please enter a fuller delivery address.").max(500,"Delivery address is too long."),
 note:z.string().max(500,"Note is too long.").optional(),
 items:z.array(z.object({
   productId:z.string().uuid("Invalid product reference."),
   name:z.string().trim().min(1,"Product name is missing.").max(120),
   quantity:z.number().int().min(1).max(99),
   price:z.number().nonnegative()
 })).min(1,"Your bag is empty.").max(30)
});

export async function POST(req:Request){
 try{
  const parsed=schema.safeParse(await req.json());
  if(!parsed.success){
   const issue=parsed.error.issues[0];
   return NextResponse.json({error:issue?.message||"Please check your checkout details.",field:issue?.path?.[0]||null},{status:400});
  }

  const d=parsed.data;
  if(new Set(d.items.map(x=>x.productId)).size!==d.items.length){
   return NextResponse.json({error:"Duplicate products are not allowed in one order."},{status:400});
  }

  const result=await sql.query(`
WITH input AS (
 SELECT *
 FROM jsonb_to_recordset($1::jsonb)
 AS x(requested_id uuid,requested_name text,quantity int)
),
resolved AS (
 SELECT
   i.requested_id,
   i.requested_name,
   i.quantity,
   p.id AS current_id,
   p.name AS current_name,
   p.stock,
   COALESCE(p.sale_price,p.price)::numeric AS unit
 FROM input i
 LEFT JOIN LATERAL (
   SELECT p.*
   FROM products p
   WHERE p.active=true
     AND (
       p.id=i.requested_id
       OR lower(trim(p.name))=lower(trim(i.requested_name))
     )
   ORDER BY CASE WHEN p.id=i.requested_id THEN 0 ELSE 1 END
   LIMIT 1
 ) p ON true
),
bad AS (
 SELECT
   requested_name AS name,
   CASE
     WHEN current_id IS NULL THEN 'is no longer available'
     WHEN stock < quantity THEN 'only '||stock||' left'
     ELSE 'is unavailable'
   END AS reason
 FROM resolved
 WHERE current_id IS NULL OR stock < quantity
),
ok AS (
 SELECT NOT EXISTS(SELECT 1 FROM bad) AS value
),
updated AS (
 UPDATE products p
 SET stock=p.stock-r.quantity,
     updated_at=now()
 FROM resolved r,ok
 WHERE ok.value
   AND p.id=r.current_id
   AND p.stock>=r.quantity
   AND p.active=true
 RETURNING p.id
),
ins AS (
 INSERT INTO orders(
   customer_name,phone,delivery_address,note,
   subtotal,delivery_fee,total,status,items
 )
 SELECT
   $2,$3,$4,$5,
   COALESCE((SELECT SUM(unit*quantity) FROM resolved),0),
   0,
   COALESCE((SELECT SUM(unit*quantity) FROM resolved),0),
   'pending',
   COALESCE(
     (SELECT jsonb_agg(
       jsonb_build_object(
         'productId',current_id,
         'name',current_name,
         'quantity',quantity,
         'price',unit
       )
     ) FROM resolved),
     '[]'::jsonb
   )
 WHERE (SELECT value FROM ok)
   AND (SELECT count(*) FROM updated)=(SELECT count(*) FROM input)
 RETURNING id,order_number,subtotal,items
)
SELECT
 (SELECT id FROM ins) AS id,
 (SELECT subtotal FROM ins) AS subtotal,
 (SELECT items FROM ins) AS items,
 (SELECT jsonb_agg(
   jsonb_build_object('name',name,'reason',reason)
 ) FROM bad) AS problems
`,[
   JSON.stringify(d.items.map(x=>({
     requested_id:x.productId,
     requested_name:x.name,
     quantity:x.quantity
   }))),
   d.customerName,
   d.phone,
   d.deliveryAddress,
   d.note?.trim()||null
 ]);

  const row=result[0];

  if(!row?.id){
   const problems=Array.isArray(row?.problems)?row.problems:[];
   const detail=problems.length
    ? problems.map((x:{name:string;reason:string})=>x.name+" "+x.reason).join("; ")+"."
    : "We couldn't confirm the current availability of your bag. Refresh the bag and try again.";
   return NextResponse.json({error:detail,problems},{status:409});
  }

  return NextResponse.json({
   orderId:String(row.id),
   orderNumber:String(row.order_number),
   subtotal:Number(row.subtotal??0),
   items:Array.isArray(row.items)?row.items:[]
  });
 }catch(e){
  console.error("Order creation failed",e);
  return NextResponse.json({error:"We couldn't place the order right now. Please try again."},{status:500});
 }
}