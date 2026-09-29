import{NextResponse}from"next/server";
import{z}from"zod";
import{getAdminSession}from"@/lib/auth";
import{sql}from"@/lib/db";
import{ensureProductVariantsTable}from"@/lib/product-variants";
import{getAdminProducts}from"@/lib/store";

const imagesSchema=z.array(z.string().url("Each product image must be a valid URL.")).max(6).default([]);
const moneySchema=z.union([z.literal(""),z.coerce.number().finite().nonnegative()]);
const variantSchema=z.object({
 options:z.record(z.string(),z.string()),
 price:z.coerce.number().finite().nonnegative("Variant price cannot be negative."),
 stock:z.coerce.number().int().min(0).max(100000),
 sku:z.string().trim().max(120).optional().or(z.literal(""))
});
const base=z.object({
 name:z.string().trim().min(2).max(120),
 category:z.string().trim().min(2).max(80),
 description:z.string().trim().min(5).max(2000),
 price:z.coerce.number().finite().nonnegative(),
 salePrice:moneySchema,
 stock:z.coerce.number().int().min(0).max(100000),
 featured:z.boolean().default(false),
 images:imagesSchema,
 image:z.string().url().optional().or(z.literal("")),
 variants:z.array(variantSchema).max(200).default([])
});
const edit=base.extend({id:z.string().uuid()});

function responseError(error:any){
 const issue=error.issues?.[0];
 return NextResponse.json({error:issue?.message||"Check the product fields.",field:issue?.path?.join(".")||null},{status:400});
}
function slugify(value:string){return value.toLowerCase().trim().replace(/[^a-z0-9]+/g,"-").replace(/(^-|-$)/g,"")}
function normalizeVariants(value:any[]){
 const groups=new Set<string>(),seen=new Set<string>(),result:any[]=[];
 for(const item of value){
  const options=Object.fromEntries(Object.entries(item.options||{}).map(([key,val])=>[String(key).trim(),String(val).trim()]).filter(([key,val])=>key&&val));
  const names=Object.keys(options);
  if(names.length<1||names.length>2)throw new Error("Each variant must use one or two option groups.");
  names.forEach(name=>groups.add(name.toLowerCase()));
  const key=names.sort().map(name=>name.toLowerCase()+"="+options[name].toLowerCase()).join("|");
  if(seen.has(key))throw new Error("Duplicate option combinations are not allowed.");
  seen.add(key);
  result.push({options,price:Number(item.price),stock:Number(item.stock),sku:String(item.sku||"").trim()||null});
 }
 if(groups.size>2)throw new Error("A product can use at most two option groups.");
 return result;
}
function variantPayload(variants:any[]){return JSON.stringify(variants.map(v=>({optionKey:Object.keys(v.options).sort().map(name=>name.toLowerCase()+"="+v.options[name].toLowerCase()).join("|"),options:v.options,price:v.price,stock:v.stock,sku:v.sku})))}

export async function GET(req:Request){
 if(!await getAdminSession())return NextResponse.json({error:"Unauthorized"},{status:401});
 const q=new URL(req.url).searchParams;
 const page=Math.max(1,Number(q.get("page")||"1")||1);
 const limit=Math.min(50,Math.max(1,Number(q.get("limit")||"24")||24));
 return NextResponse.json(await getAdminProducts({search:(q.get("search")||"").trim(),page,pageSize:limit,lowStock:q.get("lowStock")==="true"}));
}

export async function POST(req:Request){
 if(!await getAdminSession())return NextResponse.json({error:"Unauthorized"},{status:401});
 try{
  const parsed=base.safeParse(await req.json());if(!parsed.success)return responseError(parsed.error);
  const x=parsed.data,variants=normalizeVariants(x.variants),images=x.images.length?x.images:x.image?[x.image]:[];
  if(!images.length)return NextResponse.json({error:"Add at least one product image.",field:"images"},{status:400});
  await ensureProductVariantsTable();
  const slug=slugify(x.name)+"-"+Date.now().toString(36),payload=variantPayload(variants),sale=x.salePrice===""?null:x.salePrice;
  const[result]=await sql.transaction([
   sql.query(
    "INSERT INTO products(name,slug,category,description,price,sale_price,stock,images,featured,active) "+
    "VALUES($1,$2,$3,$4,CASE WHEN jsonb_array_length($8::jsonb)>0 THEN (SELECT MIN((v->>'price')::numeric) FROM jsonb_array_elements($8::jsonb) v) ELSE $5 END,CASE WHEN jsonb_array_length($8::jsonb)>0 THEN NULL::numeric ELSE $6::numeric END,CASE WHEN jsonb_array_length($8::jsonb)>0 THEN (SELECT COALESCE(SUM((v->>'stock')::int),0) FROM jsonb_array_elements($8::jsonb) v) ELSE $7 END,$9::jsonb,$10,true) "+
    "RETURNING id,name,slug,category,description,price,sale_price,stock,images,featured,active",
    [x.name,slug,x.category,x.description,x.price,sale,x.stock,payload,JSON.stringify(images),x.featured]
   ),
   sql.query(
    "INSERT INTO product_variants(product_id,option_key,options,price,stock,sku) "+
    "SELECT p.id,v.option_key,v.options,v.price,v.stock,v.sku FROM products p CROSS JOIN LATERAL jsonb_to_recordset($1::jsonb) v(option_key text,options jsonb,price numeric,stock int,sku text) WHERE p.slug=$2",
    [payload,slug]
   )
  ]);
  return NextResponse.json(result[0]);
 }catch(error){console.error("Product create failed",error);return NextResponse.json({error:error instanceof Error?error.message:"Could not create product."},{status:500})}
}

export async function PUT(req:Request){
 if(!await getAdminSession())return NextResponse.json({error:"Unauthorized"},{status:401});
 try{
  const parsed=edit.safeParse(await req.json());if(!parsed.success)return responseError(parsed.error);
  const x=parsed.data,variants=normalizeVariants(x.variants),payload=variantPayload(variants),images=Array.isArray(x.images)?JSON.stringify(x.images):x.image?JSON.stringify([x.image]):"",sale=x.salePrice===""?null:x.salePrice;
  await ensureProductVariantsTable();
  const[result]=await sql.transaction([
   sql.query(
    "UPDATE products SET name=$1,category=$2,description=$3,price=CASE WHEN jsonb_array_length($8::jsonb)>0 THEN (SELECT MIN((v->>'price')::numeric) FROM jsonb_array_elements($8::jsonb) v) ELSE $4 END,sale_price=CASE WHEN jsonb_array_length($8::jsonb)>0 THEN NULL::numeric ELSE $5::numeric END,stock=CASE WHEN jsonb_array_length($8::jsonb)>0 THEN (SELECT COALESCE(SUM((v->>'stock')::int),0) FROM jsonb_array_elements($8::jsonb) v) ELSE $6 END,featured=$7,images=CASE WHEN $9='' THEN images ELSE $9::jsonb END,updated_at=now() WHERE id=$10 RETURNING id,name,slug,category,description,price,sale_price,stock,images,featured,active",
    [x.name,x.category,x.description,x.price,sale,x.stock,x.featured,payload,images,x.id]
   ),
   sql.query("DELETE FROM product_variants WHERE product_id=$1",[x.id]),
   sql.query("INSERT INTO product_variants(product_id,option_key,options,price,stock,sku) SELECT $1,v.option_key,v.options,v.price,v.stock,v.sku FROM jsonb_to_recordset($2::jsonb) v(option_key text,options jsonb,price numeric,stock int,sku text)",[x.id,payload])
  ]);
  if(!result[0])return NextResponse.json({error:"Product not found."},{status:404});
  return NextResponse.json(result[0]);
 }catch(error){console.error("Product update failed",error);return NextResponse.json({error:error instanceof Error?error.message:"Could not update product."},{status:500})}
}

export async function DELETE(req:Request){
 if(!await getAdminSession())return NextResponse.json({error:"Unauthorized"},{status:401});
 const id=new URL(req.url).searchParams.get("id");if(!id)return NextResponse.json({error:"Missing id"},{status:400});
 await sql.query("UPDATE products SET active=false,updated_at=now() WHERE id=$1",[id]);
 return NextResponse.json({ok:true});
}
