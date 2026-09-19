import{NextResponse}from"next/server";import{z}from"zod";import{getAdminSession}from"@/lib/auth";import{sql}from"@/lib/db";import{getAdminProducts}from"@/lib/store";

const imagesSchema=z.array(z.string().url("Each product image must be a valid URL.")).max(6,"A product can have up to 6 images.").default([]);
const moneySchema=z.union([z.literal(""),z.coerce.number().finite().nonnegative()]);
const base=z.object({
 name:z.string().trim().min(2,"Product name must be at least 2 characters.").max(120,"Product name is too long."),
 category:z.string().trim().min(2,"Category must be at least 2 characters.").max(80,"Category is too long."),
 description:z.string().trim().min(5,"Description must be at least 5 characters.").max(2000,"Description is too long."),
 price:z.coerce.number().finite().nonnegative("Price cannot be negative."),
 salePrice:moneySchema,
 stock:z.coerce.number().int("Stock must be a whole number.").min(0,"Stock cannot be negative.").max(100000,"Stock is too high."),
 featured:z.boolean().default(false),
 images:imagesSchema,
 image:z.string().url("Image URL must be valid.").optional().or(z.literal(""))
});
const edit=base.extend({id:z.string().uuid("Invalid product reference.")});
function slugify(x:string){return x.toLowerCase().trim().replace(/[^a-z0-9]+/g,"-").replace(/(^-|-$)/g,"")}
function validationResponse(error:any){const issue=error.issues?.[0];return NextResponse.json({error:issue?.message||"Check the product fields.",field:issue?.path?.join(".")||null},{status:400})}

export async function GET(req:Request){
 if(!await getAdminSession())return NextResponse.json({error:"Unauthorized"},{status:401});
 const q=new URL(req.url).searchParams;
 const page=Math.max(1,Number(q.get("page")||"1")||1);
 const pageSize=Math.min(50,Math.max(1,Number(q.get("limit")||"24")||24));
 const search=(q.get("search")||"").trim();
 const lowStock=q.get("lowStock")==="true";
 return NextResponse.json(await getAdminProducts({search,page,pageSize,lowStock}));
}

export async function POST(req:Request){
 if(!await getAdminSession())return NextResponse.json({error:"Unauthorized"},{status:401});
 try{
  const parsed=base.safeParse(await req.json());
  if(!parsed.success)return validationResponse(parsed.error);
  const x=parsed.data,slug=slugify(x.name)+"-"+Date.now().toString(36);
  const productImages=x.images.length?x.images:x.image?[x.image]:[];
  if(!productImages.length)return NextResponse.json({error:"Add at least one product image.",field:"images"},{status:400});
  const salePrice=x.salePrice===""?null:x.salePrice??null;
  const rows=await sql.query("INSERT INTO products(name,slug,category,description,price,sale_price,stock,images,featured,active) VALUES($1,$2,$3,$4,$5,$6,$7,$8::jsonb,$9,true) RETURNING id,name,slug,category,description,price,sale_price,stock,images,featured,active",[x.name,slug,x.category,x.description,x.price,salePrice,x.stock,JSON.stringify(productImages),x.featured]);
  return NextResponse.json(rows[0]);
 }catch(e){console.error("Product create failed",e);return NextResponse.json({error:"Could not create product."},{status:500})}
}

export async function PUT(req:Request){
 if(!await getAdminSession())return NextResponse.json({error:"Unauthorized"},{status:401});
 try{
  const parsed=edit.safeParse(await req.json());
  if(!parsed.success)return validationResponse(parsed.error);
  const x=parsed.data,hasImages=Array.isArray(x.images),imageValue=hasImages?JSON.stringify(x.images):x.image?JSON.stringify([x.image]):"";
  const salePrice=x.salePrice===""?null:x.salePrice??null;
  const rows=await sql.query("UPDATE products SET name=$1,category=$2,description=$3,price=$4,sale_price=$5,stock=$6,featured=$7,images=CASE WHEN $8='' THEN images ELSE $8::jsonb END,updated_at=now() WHERE id=$9 RETURNING id,name,slug,category,description,price,sale_price,stock,images,featured,active",[x.name,x.category,x.description,x.price,salePrice,x.stock,x.featured,imageValue,x.id]);
  if(!rows[0])return NextResponse.json({error:"Product not found."},{status:404});
  return NextResponse.json(rows[0]);
 }catch(e){console.error("Product update failed",e);return NextResponse.json({error:"Could not update product."},{status:500})}
}

export async function DELETE(req:Request){
 if(!await getAdminSession())return NextResponse.json({error:"Unauthorized"},{status:401});
 const id=new URL(req.url).searchParams.get("id");
 if(!id)return NextResponse.json({error:"Missing id"},{status:400});
 await sql.query("UPDATE products SET active=false,updated_at=now() WHERE id=$1",[id]);
 return NextResponse.json({ok:true});
}