import{NextResponse}from"next/server";import{z}from"zod";import{sql}from"@/lib/db";import{createCustomerSession,normalizePhone}from"@/lib/customer-session";
const schema=z.object({orderNumber:z.string().trim().min(4).max(40),phone:z.string().trim().min(7).max(30)});
export async function POST(req:Request){
 try{
  const p=schema.safeParse(await req.json());
  if(!p.success)return NextResponse.json({error:"Enter your order reference and phone number."},{status:400});
  const orderNumber=p.data.orderNumber.toUpperCase();
  const phone=normalizePhone(p.data.phone);
  const rows=await sql.query("SELECT id FROM orders WHERE upper(order_number)=$1 AND regexp_replace(phone,'\\D','','g')=$2 LIMIT 1",[orderNumber,phone]);
  if(!rows[0])return NextResponse.json({error:"We couldn't verify that order reference and phone number."},{status:404});
  await createCustomerSession(phone);
  const orders=await sql.query("SELECT id,order_number,customer_name,phone,delivery_address,note,subtotal,delivery_fee,total,status,items,created_at,updated_at FROM orders WHERE regexp_replace(phone,'\\D','','g')=$1 ORDER BY created_at DESC LIMIT 50",[phone]);
  return NextResponse.json({orders});
 }catch(e){
  console.error("Order lookup failed",e);
  return NextResponse.json({error:"We couldn't look up your orders right now."},{status:500});
 }
}