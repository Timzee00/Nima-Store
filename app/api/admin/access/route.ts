import { NextResponse } from "next/server";
import { z } from "zod";
import bcrypt from "bcryptjs";
import { getAdminSession, getAdminEmail, verifyOwnerPassword } from "@/lib/auth";
import { sql } from "@/lib/db";
import { apiError } from "@/lib/api-response";

export const runtime = "nodejs";
const credentials=z.object({
 email:z.string().trim().email().max(254),
 password:z.string().min(12).max(200)
});
const update=z.discriminatedUnion("action",[
 z.object({action:z.literal("toggle"),id:z.string().uuid(),active:z.boolean()}),
 z.object({action:z.literal("managerCredentials"),id:z.string().uuid(),email:z.string().trim().email().max(254),password:z.union([z.literal(""),z.string().min(12).max(200)]).optional()}),
 z.object({action:z.literal("ownerPassword"),currentPassword:z.string().min(8).max(200),newPassword:z.string().min(12).max(200)})
]);
type StaffRow={id:string;email:string;is_active:boolean;created_at:string};
async function isOwner(){return(await getAdminSession())?.role==="owner"}
const hidden=()=>apiError("NOT_FOUND","Not found.",404);
const conflict=()=>apiError("EMAIL_ALREADY_USED","That email is already used by another staff account.",409);
async function listStaff():Promise<StaffRow[]>{
 return await sql.query("SELECT id,email,is_active,created_at FROM nima_staff_accounts ORDER BY created_at ASC,id ASC",[]) as StaffRow[];
}
export async function GET(){
 if(!await isOwner())return hidden();
 try{return NextResponse.json({managers:await listStaff()},{headers:{"Cache-Control":"no-store"}})}
 catch(error){console.error("Staff access listing failed",error instanceof Error?error.message:"Unknown error");return apiError("ACCESS_LOAD_FAILED","Could not load account settings.",500)}
}
export async function POST(request:Request){
 if(!await isOwner())return hidden();
 try{
  const parsed=credentials.safeParse(await request.json());
  if(!parsed.success)return apiError("INVALID_ACCOUNT","Enter a valid email and a password of at least 12 characters.",400);
  const email=parsed.data.email.toLowerCase();
  if(email===getAdminEmail())return conflict();
  const passwordHash=await bcrypt.hash(parsed.data.password,12);
  const rows=await sql.query("INSERT INTO nima_staff_accounts(email,password_hash) VALUES ($1,$2) ON CONFLICT(email) DO NOTHING RETURNING id,email,is_active,created_at",[email,passwordHash]);
  if(!rows.length)return conflict();
  return NextResponse.json({manager:rows[0]},{status:201,headers:{"Cache-Control":"no-store"}});
 }catch(error){
  console.error("Staff account creation failed",error instanceof Error?error.message:"Unknown error");
  return apiError("STAFF_CREATE_FAILED","Could not create the account. Please try again.",500);
 }
}
export async function PATCH(request:Request){
 if(!await isOwner())return hidden();
 let parsed;
 try{parsed=update.safeParse(await request.json())}
 catch{return apiError("INVALID_REQUEST","Check the information provided.",400)}
 if(!parsed.success)return apiError("INVALID_REQUEST",parsed.error.issues[0]?.message||"Check the information provided.",400);
 const data=parsed.data;
 try{
  if(data.action==="ownerPassword"){
   if(!await verifyOwnerPassword(data.currentPassword))return apiError("INVALID_PASSWORD","The current password is incorrect.",400);
   if(data.currentPassword===data.newPassword)return apiError("PASSWORD_UNCHANGED","Choose a different new password.",400);
   const hash=await bcrypt.hash(data.newPassword,12);
   await sql.query("INSERT INTO nima_owner_access(id,password_hash,credential_version) VALUES(1,$1,1) ON CONFLICT(id) DO UPDATE SET password_hash=EXCLUDED.password_hash,credential_version=nima_owner_access.credential_version+1,updated_at=now()",[hash]);
   return NextResponse.json({ok:true,signInAgain:true});
  }
  if(data.action==="toggle"){
   const rows=await sql.query("UPDATE nima_staff_accounts SET is_active=$1,credential_version=credential_version+1,updated_at=now() WHERE id=$2 RETURNING id,email,is_active,created_at",[data.active,data.id]);
   if(!rows.length)return apiError("STAFF_NOT_FOUND","Account not found.",404);
   return NextResponse.json({manager:rows[0]});
  }
  const email=data.email.toLowerCase();
  if(email===getAdminEmail())return conflict();
  const existing=await sql.query("SELECT id FROM nima_staff_accounts WHERE email=$1 AND id<>$2 LIMIT 1",[email,data.id]);
  if(existing.length)return conflict();
  const passwordProvided=!!data.password;
  const passwordHash=passwordProvided?await bcrypt.hash(data.password!,12):null;
  const rows=await sql.query(
   "UPDATE nima_staff_accounts SET email=$1,password_hash=COALESCE($2,password_hash),credential_version=credential_version+CASE WHEN email<>$1 OR $2::text IS NOT NULL THEN 1 ELSE 0 END,updated_at=now() WHERE id=$3 RETURNING id,email,is_active,created_at",
   [email,passwordHash,data.id]
  );
  if(!rows.length)return apiError("STAFF_NOT_FOUND","Account not found.",404);
  return NextResponse.json({manager:rows[0]});
 }catch(error){
  const code=(error as {code?:string}|null)?.code;
  if(code==="23505")return conflict();
  console.error("Staff access update failed",error instanceof Error?error.message:"Unknown error");
  return apiError("ACCESS_UPDATE_FAILED","Could not update account settings.",500);
 }
}
