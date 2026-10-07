import{NextResponse}from"next/server";
import{z}from"zod";
import{getAdminSession}from"@/lib/auth";
import{sql}from"@/lib/db";
import{getRecentOrders}from"@/lib/store";
import{apiError}from"@/lib/api-response";

const schema=z.object({id:z.string().uuid(),status:z.enum(["pending","confirmed","fulfilled","cancelled"])});

export async function GET(req:Request){
 if(!await getAdminSession())return apiError("SESSION_EXPIRED","Your admin session has expired. Sign in again.",401);
 try{
  const q=new URL(req.url).searchParams,page=Math.max(1,Number(q.get("page")||"1")||1),pageSize=Math.min(50,Math.max(1,Number(q.get("limit")||"20")||20));
  return NextResponse.json(await getRecentOrders({search:(q.get("search")||"").trim(),status:(q.get("status")||"").trim(),page,pageSize}));
 }catch(error){
  console.error("Admin orders load failed",error);
  return apiError("ORDERS_LOAD_FAILED","We could not load orders right now. Please try again.",500,{retryable:true});
 }
}

export async function PATCH(req:Request){
 if(!await getAdminSession())return apiError("SESSION_EXPIRED","Your admin session has expired. Sign in again.",401);
 try{
  const p=schema.safeParse(await req.json());
  if(!p.success)return apiError("ORDER_STATUS_INVALID","Choose a valid order status.",400,{field:"status"});
  const rows=await sql.query("UPDATE orders SET status=$1,updated_at=now() WHERE id=$2 RETURNING id,order_number,status,updated_at",[p.data.status,p.data.id]);
  if(!rows[0])return apiError("ORDER_NOT_FOUND","Order not found.",404);
  return NextResponse.json(rows[0]);
 }catch(error){
  console.error("Admin order update failed",error);
  return apiError("ORDER_UPDATE_FAILED","We could not update that order right now. Please try again.",500,{retryable:true});
 }
}
