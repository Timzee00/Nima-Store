import{NextResponse}from"next/server";
import{z}from"zod";
import{getAdminSession}from"@/lib/auth";
import{sql}from"@/lib/db";
import{apiError}from"@/lib/api-response";
const patchSchema=z.object({id:z.string().uuid(),status:z.enum(["open","in_progress","resolved","closed"]).optional(),priority:z.enum(["low","normal","high","urgent"]).optional(),staffNote:z.string().max(2000).optional()});

export async function GET(){
 if(!await getAdminSession())return apiError("SESSION_EXPIRED","Your admin session has expired. Sign in again.",401);
 try{
  const rows=await sql.query("SELECT id,ticket_number,order_id,customer_name,phone,category,message,status,priority,staff_note,created_at,updated_at FROM support_tickets ORDER BY created_at DESC LIMIT 100",[]);
  return NextResponse.json({tickets:rows});
 }catch(error){
  console.error("Admin support load failed",error);
  return apiError("SUPPORT_LOAD_FAILED","We could not load support tickets right now. Please try again.",500,{retryable:true});
 }
}

export async function PATCH(req:Request){
 if(!await getAdminSession())return apiError("SESSION_EXPIRED","Your admin session has expired. Sign in again.",401);
 try{
  const p=patchSchema.safeParse(await req.json());
  if(!p.success)return apiError("SUPPORT_UPDATE_INVALID","Check the support status, priority or staff note.",400);
  const x=p.data;
  const rows=await sql.query("UPDATE support_tickets SET status=COALESCE($1,status),priority=COALESCE($2,priority),staff_note=COALESCE($3,staff_note),updated_at=now() WHERE id=$4 RETURNING id,ticket_number,status,priority,staff_note,updated_at",[x.status??null,x.priority??null,x.staffNote??null,x.id]);
  if(!rows[0])return apiError("SUPPORT_TICKET_NOT_FOUND","Support ticket not found.",404);
  return NextResponse.json(rows[0]);
 }catch(error){
  console.error("Admin support update failed",error);
  return apiError("SUPPORT_UPDATE_FAILED","We could not update that support ticket right now. Please try again.",500,{retryable:true});
 }
}
