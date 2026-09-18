import{NextResponse}from"next/server";import{z}from"zod";import{sql}from"@/lib/db";
const schema=z.object({customerName:z.string().min(2).max(120),phone:z.string().min(7).max(30),deliveryAddress:z.string().min(5).max(500),note:z.string().max(500).optional(),items:z.array(z.object({productId:z.string().uuid(),name:z.string(),quantity:z.number().int().min(1).max(99),price:z.number().nonnegative()})).min(1).max(30)});
export async function POST(req:Request){try{const p=schema.safeParse(await req.json());if(!p.success)return NextResponse.json({error:"Please complete the checkout details."},{status:400});const d=p.data,ids=d.items.map(x=>x.productId);if(new Set(ids).size!==ids.length)return NextResponse.json({error:"Duplicate products are not allowed in one order."},{status:400});
const result=await sql.query(`
WITH input AS (SELECT * FROM jsonb_to_recordset($1::jsonb) AS x(product_id uuid,quantity int)),
checked AS (SELECT p.id,p.name,(COALESCE(p.sale_price,p.price))::numeric AS unit,i.quantity FROM products p JOIN input i ON i.product_id=p.id WHERE p.active=true AND p.stock>=i.quantity),
ok AS (SELECT (SELECT count(*) FROM checked)=(SELECT count(*) FROM input) AND (SELECT count(*) FROM checked)>0 AS value),
updated AS (UPDATE products p SET stock=p.stock-c.quantity,updated_at=now() FROM checked c,ok WHERE ok.value AND p.id=c.id RETURNING p.id),
verified AS (SELECT jsonb_agg(jsonb_build_object('productId',id,'name',name,'quantity',quantity,'price',unit)) AS items,COALESCE(SUM(unit*quantity),0)::numeric AS subtotal FROM checked,ok WHERE ok.value),
ins AS (INSERT INTO orders(customer_name,phone,delivery_address,note,subtotal,delivery_fee,total,status,items)
SELECT $2,$3,$4,$5,verified.subtotal,0,verified.subtotal,'pending',verified.items FROM verified WHERE EXISTS(SELECT 1 FROM updated) AND (SELECT count(*) FROM updated)=(SELECT count(*) FROM input) RETURNING id)
SELECT id FROM ins`,[JSON.stringify(d.items),d.customerName,d.phone,d.deliveryAddress,d.note??null]);
if(!result[0])return NextResponse.json({error:"One of the selected products sold out while you were checking out."},{status:409});
return NextResponse.json({orderId:String(result[0].id)})}catch(e){return NextResponse.json({error:e instanceof Error?e.message:"Could not create order."},{status:400})}}