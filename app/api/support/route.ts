import{NextResponse}from"next/server";import{z}from"zod";import{sql}from"@/lib/db";import{getCustomerSession}from"@/lib/customer-session";
const schema=z.object({orderNumber:z.string().trim().min(4).max(40),category:z.enum(["order_support","delivery","product","return_refund"]),message:z.string().trim().min(5).max(2000)});
export async function POST(req:Request){
 try{
  const session=await getCustomerSession();
  if(!session)return NextResponse.json({error:"Please verify an order first."},{status:401});
  const p=schema.safeParse(await req.json());
  if(!p.success)return NextResponse.json({error:p.error.issues[0]?.message||"Please complete the support request."},{status:400});
  const order=await sql.query("SELECT id,customer_name,phone FROM orders WHERE upper(order_number)=$1 AND regexp_replace(phone,'\\D','','g')=$2 LIMIT 1",[p.data.orderNumber.toUpperCase(),session.phone]);
  if(!order[0])return NextResponse.json({error:"That order could not be verified."},{status:404});
  const rows=await sql.query("INSERT INTO support_tickets(order_id,customer_name,phone,category,message) VALUES($1,$2,$3,$4,$5) RETURNING ticket_number",[order[0].id,order[0].customer_name,order[0].phone,p.data.category,p.data.message]);
  return NextResponse.json({ticketNumber:String(rows[0].ticket_number)});
 }catch(e){
  console.error("Support ticket failed",e);
  return NextResponse.json({error:"We couldn't create the support ticket right now."},{status:500});
 }
}