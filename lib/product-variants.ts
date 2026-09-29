import{sql}from"./db";

export type ProductVariant={
 id:string;
 productId:string;
 optionKey:string;
 options:Record<string,string>;
 price:string;
 stock:number;
 sku:string|null;
};

function missing(error:unknown){
 const value=error as {code?:string;message?:string}|null;
 return value?.code==="42P01"||String(value?.message||"").includes("product_variants");
}
function parseOptions(value:unknown):Record<string,string>{
 if(!value||typeof value!=="object"||Array.isArray(value))return {};
 return Object.fromEntries(Object.entries(value as Record<string,unknown>).map(([name,item])=>[String(name),String(item)] as const).filter(([name,item])=>name.trim()&&item.trim()));
}
function mapVariant(row:any):ProductVariant{
 return {id:String(row.id),productId:String(row.product_id),optionKey:String(row.option_key),options:parseOptions(row.options),price:String(row.price),stock:Number(row.stock),sku:row.sku==null?null:String(row.sku)};
}
export async function ensureProductVariantsTable(){
 await sql.query("CREATE TABLE IF NOT EXISTS product_variants (id uuid PRIMARY KEY DEFAULT gen_random_uuid(),product_id uuid NOT NULL REFERENCES products(id) ON DELETE CASCADE,option_key varchar(500) NOT NULL,options jsonb NOT NULL DEFAULT '{}'::jsonb,price numeric(12,2) NOT NULL CHECK(price>=0),stock integer NOT NULL DEFAULT 0 CHECK(stock>=0),sku varchar(120),created_at timestamptz NOT NULL DEFAULT now(),updated_at timestamptz NOT NULL DEFAULT now())",[]);
 await sql.query("CREATE UNIQUE INDEX IF NOT EXISTS product_variants_product_key_idx ON product_variants(product_id,option_key)",[]);
 await sql.query("CREATE INDEX IF NOT EXISTS product_variants_product_idx ON product_variants(product_id)",[]);
 await sql.query("CREATE INDEX IF NOT EXISTS product_variants_stock_idx ON product_variants(product_id,stock)",[]);
}
export async function getProductVariants(productId:string):Promise<ProductVariant[]>{
 try{
  const rows=await sql.query("SELECT id,product_id,option_key,options,price,stock,sku FROM product_variants WHERE product_id=$1 ORDER BY created_at ASC,id ASC",[productId]);
  return rows.map(mapVariant);
 }catch(error){if(missing(error))return [];throw error;}
}
export async function getProductVariantsMap(productIds:string[]){
 const map=new Map<string,ProductVariant[]>();
 if(!productIds.length)return map;
 try{
  const rows=await sql.query("SELECT id,product_id,option_key,options,price,stock,sku FROM product_variants WHERE product_id=ANY($1::uuid[]) ORDER BY created_at ASC,id ASC",[productIds]);
  for(const row of rows){const item=mapVariant(row);map.set(item.productId,[...(map.get(item.productId)||[]),item]);}
 }catch(error){if(!missing(error))throw error;}
 return map;
}
