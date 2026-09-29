import{NextResponse}from"next/server";
import{z}from"zod";
import{sql}from"@/lib/db";
import{ensureProductVariantsTable}from"@/lib/product-variants";

const schema=z.object({
 customerName:z.string().trim().min(2,"Please enter your name.").max(120,"Name is too long."),
 phone:z.string().trim().min(7,"Please enter a valid phone number.").max(30,"Phone number is too long."),
 deliveryAddress:z.string().trim().min(5,"Please enter a fuller delivery address.").max(500,"Delivery address is too long."),
 note:z.string().max(500,"Note is too long.").optional(),
 items:z.array(z.object({
  productId:z.string().uuid("Invalid product reference."),
  name:z.string().trim().min(1,"Product name is missing.").max(120),
  quantity:z.number().int().min(1).max(99),
  price:z.number().nonnegative(),
  variantId:z.string().uuid().optional(),
  options:z.record(z.string(),z.string()).optional()
 })).min(1,"Your bag is empty.").max(30)
});

export async function POST(req:Request){
 try{
  const parsed=schema.safeParse(await req.json());
  if(!parsed.success){const issue=parsed.error.issues[0];return NextResponse.json({error:issue?.message||"Please check your checkout details.",field:issue?.path?.[0]||null},{status:400})}
  const d=parsed.data;
  const duplicateKeys=d.items.map(item=>item.productId+"::"+(item.variantId||"base"));
  if(new Set(duplicateKeys).size!==duplicateKeys.length)return NextResponse.json({error:"The same product option cannot appear twice in one order."},{status:400});

  const hasVariants=d.items.some(item=>!!item.variantId);
  if(hasVariants)await ensureProductVariantsTable();

  const productIds=[...new Set(d.items.map(item=>item.productId))];
  const lockQuery="SELECT id FROM products WHERE id=ANY($1::uuid[]) FOR UPDATE";
  
  const payload=JSON.stringify(d.items.map(item=>({requested_id:item.productId,requested_name:item.name,requested_variant_id:item.variantId||null,quantity:item.quantity})));
  const writeQuery=[
     "WITH input AS (SELECT * FROM jsonb_to_recordset($1::jsonb) AS x(requested_id uuid,requested_name text,requested_variant_id uuid,quantity int)),",
     "resolved AS (SELECT i.requested_id,i.requested_name,i.quantity,p.id current_id,p.name current_name,p.stock current_stock,COALESCE(p.sale_price,p.price)::numeric base_unit,pv.id resolved_variant_id,pv.options resolved_options,pv.price resolved_price,pv.stock resolved_stock,EXISTS(SELECT 1 FROM product_variants vx WHERE vx.product_id=p.id) has_variants FROM input i LEFT JOIN LATERAL (SELECT p.id,p.name,p.active,p.stock,p.price,p.sale_price,pv.id,pv.options,pv.price,pv.stock FROM products p LEFT JOIN product_variants pv ON pv.product_id=p.id AND pv.id=i.requested_variant_id WHERE p.active=true AND (p.id=i.requested_id OR lower(trim(p.name))=lower(trim(i.requested_name))) ORDER BY CASE WHEN p.id=i.requested_id THEN 0 ELSE 1 END LIMIT 1) p ON true),",
     "bad AS (SELECT requested_name name,CASE WHEN current_id IS NULL THEN 'is no longer available' WHEN has_variants AND requested_variant_id IS NULL THEN 'requires an option selection' WHEN requested_variant_id IS NOT NULL AND resolved_variant_id IS NULL THEN 'the selected option is no longer available' WHEN resolved_variant_id IS NOT NULL AND resolved_stock<quantity THEN 'only '||resolved_stock||' left' WHEN resolved_variant_id IS NULL AND current_stock<quantity THEN 'only '||current_stock||' left' ELSE 'is unavailable' END reason FROM resolved WHERE current_id IS NULL OR (has_variants AND requested_variant_id IS NULL) OR (requested_variant_id IS NOT NULL AND resolved_variant_id IS NULL) OR (resolved_variant_id IS NOT NULL AND resolved_stock<quantity) OR (resolved_variant_id IS NULL AND current_stock<quantity)),",
     "ok AS (SELECT NOT EXISTS(SELECT 1 FROM bad) value),",
     "updated_variants AS (UPDATE product_variants pv SET stock=pv.stock-r.quantity,updated_at=now() FROM resolved r,ok WHERE ok.value AND r.resolved_variant_id=pv.id AND pv.stock>=r.quantity RETURNING pv.id),",
     "updated_products AS (UPDATE products p SET stock=p.stock-r.total_quantity,updated_at=now() FROM (SELECT current_id,SUM(quantity)::int total_quantity FROM resolved GROUP BY current_id) r,ok WHERE ok.value AND p.id=r.current_id AND p.stock>=r.total_quantity AND p.active=true RETURNING p.id),",
     "ins AS (INSERT INTO orders(customer_name,phone,delivery_address,note,subtotal,delivery_fee,total,status,items) SELECT $2,$3,$4,$5,COALESCE((SELECT SUM(CASE WHEN resolved_variant_id IS NOT NULL THEN resolved_price ELSE base_unit END*quantity) FROM resolved),0),0,COALESCE((SELECT SUM(CASE WHEN resolved_variant_id IS NOT NULL THEN resolved_price ELSE base_unit END*quantity) FROM resolved),0),'pending',COALESCE((SELECT jsonb_agg(jsonb_build_object('productId',current_id,'name',current_name,'quantity',quantity,'price',CASE WHEN resolved_variant_id IS NOT NULL THEN resolved_price ELSE base_unit END,'variantId',resolved_variant_id,'options',COALESCE(resolved_options,'{}'::jsonb))) FROM resolved),'[]'::jsonb) WHERE (SELECT value FROM ok) AND (SELECT count(*) FROM updated_products)=(SELECT count(DISTINCT current_id) FROM resolved) AND (SELECT count(*) FROM updated_variants)=(SELECT count(*) FROM resolved WHERE resolved_variant_id IS NOT NULL) RETURNING id,order_number,subtotal,items)",
     "SELECT id,order_number,subtotal,items,(SELECT jsonb_agg(jsonb_build_object('name',name,'reason',reason)) FROM bad) problems FROM ins"
   ].join(" ");
  const writeResult=hasVariants
   ?await sql.transaction([
      sql.query(lockQuery,[productIds]),
      sql.query(writeQuery,[payload,d.customerName,d.phone,d.deliveryAddress,d.note?.trim()||null])
    ])
   :await sql.transaction([
      sql.query(lockQuery,[productIds]),
      sql.query(
       "WITH input AS (SELECT * FROM jsonb_to_recordset($1::jsonb) AS x(requested_id uuid,requested_name text,quantity int)),resolved AS (SELECT i.requested_id,i.requested_name,i.quantity,p.id current_id,p.name current_name,p.stock,COALESCE(p.sale_price,p.price)::numeric unit FROM input i LEFT JOIN LATERAL (SELECT p.* FROM products p WHERE p.active=true AND (p.id=i.requested_id OR lower(trim(p.name))=lower(trim(i.requested_name))) ORDER BY CASE WHEN p.id=i.requested_id THEN 0 ELSE 1 END LIMIT 1) p ON true),bad AS (SELECT requested_name name,CASE WHEN current_id IS NULL THEN 'is no longer available' WHEN stock<quantity THEN 'only '||stock||' left' ELSE 'is unavailable' END reason FROM resolved WHERE current_id IS NULL OR stock<quantity),ok AS (SELECT NOT EXISTS(SELECT 1 FROM bad) value),updated AS (UPDATE products p SET stock=p.stock-r.quantity,updated_at=now() FROM resolved r,ok WHERE ok.value AND p.id=r.current_id AND p.stock>=r.quantity AND p.active=true RETURNING p.id),ins AS (INSERT INTO orders(customer_name,phone,delivery_address,note,subtotal,delivery_fee,total,status,items) SELECT $2,$3,$4,$5,COALESCE((SELECT SUM(unit*quantity) FROM resolved),0),0,COALESCE((SELECT SUM(unit*quantity) FROM resolved),0),'pending',COALESCE((SELECT jsonb_agg(jsonb_build_object('productId',current_id,'name',current_name,'quantity',quantity,'price',unit,'options','{}'::jsonb)) FROM resolved),'[]'::jsonb) WHERE (SELECT value FROM ok) AND (SELECT count(*) FROM updated)=(SELECT count(*) FROM input) RETURNING id,order_number,subtotal,items) SELECT id,order_number,subtotal,items,(SELECT jsonb_agg(jsonb_build_object('name',name,'reason',reason)) FROM bad) problems FROM ins",
       [JSON.stringify(d.items.map(item=>({requested_id:item.productId,requested_name:item.name,quantity:item.quantity}))),d.customerName,d.phone,d.deliveryAddress,d.note?.trim()||null]
      )
    ]);

  const result=hasVariants?writeResult[1]:writeResult[1];
  const row=result?.[0];
  if(!row?.id){
   const problems=Array.isArray(row?.problems)?row.problems:[];
   const detail=problems.length?problems.map((item:{name:string;reason:string})=>item.name+" "+item.reason).join("; ")+".":"We couldn't confirm the current availability of your bag. Refresh the bag and try again.";
   return NextResponse.json({error:detail,problems},{status:409});
  }
  return NextResponse.json({orderId:String(row.id),orderNumber:String(row.order_number),subtotal:Number(row.subtotal??0),items:Array.isArray(row.items)?row.items:[]});
 }catch(error){
  console.error("Order creation failed",error);
  return NextResponse.json({error:"We couldn't place the order right now. Please try again."},{status:500});
 }
}
