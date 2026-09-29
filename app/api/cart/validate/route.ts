import{NextResponse}from"next/server";
import{z}from"zod";
import{sql}from"@/lib/db";
import{ensureProductVariantsTable}from"@/lib/product-variants";

const schema=z.object({items:z.array(z.object({
 id:z.string().uuid(),
 name:z.string().trim().min(1).max(120),
 variantId:z.string().uuid().optional(),
 options:z.record(z.string(),z.string()).optional()
})).min(1).max(30)});

function key(id:string,variantId?:string){return id+"::"+(variantId||"base")}

export async function POST(req:Request){
 try{
  const parsed=schema.safeParse(await req.json());
  if(!parsed.success)return NextResponse.json({error:"Invalid bag contents."},{status:400});
  const input=parsed.data,ids=input.map(item=>item.id),names=input.map(item=>item.name.trim().toLowerCase()),hasVariants=input.some(item=>!!item.variantId);
  if(hasVariants)await ensureProductVariantsTable();

  const rows=hasVariants
   ?await sql.query("SELECT p.id,p.name,p.active,p.stock,p.price,p.sale_price,p.images,pv.id variant_id,pv.options variant_options,pv.price variant_price,pv.stock variant_stock FROM products p LEFT JOIN product_variants pv ON pv.product_id=p.id WHERE p.id=ANY($1::uuid[]) OR (p.active=true AND lower(trim(p.name))=ANY($2::text[]))",[ids,names])
   :await sql.query("SELECT id,name,active,stock,price,sale_price,images FROM products WHERE id=ANY($1::uuid[]) OR (active=true AND lower(trim(name))=ANY($2::text[]))",[ids,names]);

  const byId=new Map<string,any>(),byName=new Map<string,any[]>();
  for(const row of rows){
   const id=String(row.id);
   let item=byId.get(id);
   if(!item)item={id,name:String(row.name),active:Boolean(row.active),stock:Number(row.stock),price:Number(row.price),salePrice:row.sale_price==null?null:Number(row.sale_price),image:Array.isArray(row.images)&&row.images[0]?String(row.images[0]):"",variants:[]};
   if(hasVariants&&row.variant_id)item.variants.push({variantId:String(row.variant_id),options:row.variant_options&&typeof row.variant_options==="object"?row.variant_options:{},price:Number(row.variant_price),stock:Number(row.variant_stock)});
   byId.set(id,item);
   const nameKey=String(row.name).trim().toLowerCase(),list=byName.get(nameKey)||[];
   if(!list.some(entry=>entry.id===id))list.push(item);
   byName.set(nameKey,list);
  }

  const updates:any[]=[],missingIds:string[]=[],unavailable:any[]=[];
  for(const item of input){
   let product=byId.get(item.id);
   if(!product){
    const matches=byName.get(item.name.trim().toLowerCase())||[];
    if(matches.length===1)product=matches[0];
   }
   const itemKey=key(item.id,item.variantId);
   if(!product){missingIds.push(item.id);continue}
   if(!product.active){unavailable.push({id:item.id,variantId:item.variantId,key:itemKey,name:product.name,reason:"is no longer available"});continue}
   if(item.variantId){
    const variant=product.variants.find((entry:any)=>entry.variantId===item.variantId);
    if(!variant){unavailable.push({id:item.id,variantId:item.variantId,key:itemKey,name:product.name,reason:"that option is no longer available"});continue}
    if(variant.stock<1){unavailable.push({id:item.id,variantId:item.variantId,key:itemKey,name:product.name,reason:"that option is out of stock"});continue}
    updates.push({fromId:item.id,fromVariantId:item.variantId,product:{id:product.id,name:product.name,price:variant.price,image:product.image,variantId:variant.variantId,options:variant.options}});
   }else if(hasVariants&&product.variants.length){
    unavailable.push({id:item.id,key:itemKey,name:product.name,reason:"please choose an available option"});continue
   }else if(product.stock<1){
    unavailable.push({id:item.id,key:itemKey,name:product.name,reason:"is out of stock"});continue
   }else{
    updates.push({fromId:item.id,product:{id:product.id,name:product.name,price:product.salePrice??product.price,image:product.image}});
   }
  }
  return NextResponse.json({updates,replacements:updates.filter(update=>!update.fromVariantId),missingIds,unavailable});
 }catch(error){
  console.error("Cart validation failed",error);
  return NextResponse.json({error:"We couldn't refresh your bag right now."},{status:500});
 }
}
