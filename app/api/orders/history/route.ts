import{NextResponse}from"next/server";import{sql}from"@/lib/db";import{getCustomerSession}from"@/lib/customer-session";
export async function GET(){
 try{
  const session=await getCustomerSession();
  if(!session)return NextResponse.json({error:"Please verify an order first."},{status:401});
  const orders=await sql.query("SELECT id,order_number,customer_name,phone,delivery_address,note,subtotal,delivery_fee,total,status,items,created_at,updated_at FROM orders WHERE regexp_replace(phone,'\\D','','g')=$1 ORDER BY created_at DESC LIMIT 50",[session.phone]);
  return NextResponse.json({orders});
 }catch(e){
  console.error("Order history failed",e);
  return NextResponse.json({error:"We couldn't load your order history right now."},{status:500});
 }
}