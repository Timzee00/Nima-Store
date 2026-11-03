import { NextResponse } from "next/server";
import { z } from "zod";
import bcrypt from "bcryptjs";
import { getAdminSession, getAdminEmail, verifyOwnerPassword } from "@/lib/auth";
import { sql } from "@/lib/db";
import { apiError } from "@/lib/api-response";
export const runtime="nodejs";
const credentials=z.object({email:z.string().trim().email().max(254),password:z.string().min(12).max(200)});
const patch=z.discriminatedUnion("action",[
 z.object({action:z.literal("toggle"),active:z.boolean()}),
 z.object({action:z.literal("managerCredentials"),email:z.string().trim().email().max(254),password:z.string().min(12).max(200)}),
 z.object({action:z.literal("ownerPassword"),currentPassword:z.string().min(8).max(200),newPassword:z.string().min(12).max(200)})
]);
async function requireOwner(){return(await getAdminSession())?.role==="owner"}
async function manager(){const rows=await sql.query("SELECT id,email,is_active,created_at FROM nima_staff_users WHERE slot=1 LIMIT 1",[]);return rows[0]??null}
function missing(){return apiError("NOT_FOUND","Not found.",404)}
export async function GET(){
 if(!await requireOwner())return missing();
 try{return NextResponse.json({manager:await manager()})}
 catch(error){console.error("Access settings failed",error);return apiError("ACCESS_SETTINGS_FAILED","Could not load access settings.",500)}
}
export async function POST(req:Request){
 if(!await requireOwner())return missing();
 try{
  const parsed=credentials.safeParse(await req.json());
  if(!parsed.success)return apiError("INVALID_ACCOUNT","Enter an email address and a password of at least 12 characters.",400);
  const email=parsed.data.email.toLowerCase();
  if(email===getAdminEmail())return apiError("INVALID_ACCOUNT","Choose a different email address.",400);
  if(await manager())return apiError("STAFF_EXISTS","An additional staff account already exists. Update it instead.",409);
  const hash=await bcrypt.hash(parsed.data.password,12);
  const rows=await sql.query("INSERT INTO nima_staff_users(slot,email,password_hash) VALUES(1,$1,$2) RETURNING id,email,is_active,created_at",[email,hash]);
  return NextResponse.json({manager:rows[0]},{status:201});
 }catch(error){console.error("Staff account creation failed",error instanceof Error?error.message:"Unknown error");return apiError("STAFF_SAVE_FAILED","Could not save staff access.",500)}
}
export async function PATCH(req:Request){
 if(!await requireOwner())return missing();
 let parsed;
 try{parsed=patch.safeParse(await req.json())}
 catch{return apiError("INVALID_REQUEST","Check the supplied information.",400)}
 if(!parsed.success)return apiError("INVALID_REQUEST",parsed.error.issues[0]?.message||"Check the supplied information.",400);
 const input=parsed.data;
 try{
  if(input.action==="ownerPassword"){
   if(!await verifyOwnerPassword(input.currentPassword))return apiError("INVALID_PASSWORD","Current password is incorrect.",400);
   if(input.currentPassword===input.newPassword)return apiError("PASSWORD_UNCHANGED","Choose a new password different from the current one.",400);
   const hash=await bcrypt.hash(input.newPassword,12);
   await sql.query("INSERT INTO nima_owner_access(id,password_hash,credential_version) VALUES(1,$1,1) ON CONFLICT(id) DO UPDATE SET password_hash=EXCLUDED.password_hash,credential_version=nima_owner_access.credential_version+1,updated_at=now()",[hash]);
   return NextResponse.json({ok:true,signInAgain:true});
  }
  const current=await manager();
  if(!current)return apiError("STAFF_NOT_FOUND","No additional account exists yet.",404);
  if(input.action==="toggle"){
   const rows=await sql.query("UPDATE nima_staff_users SET is_active=$1,credential_version=credential_version+1,updated_at=now() WHERE slot=1 RETURNING id,email,is_active,created_at",[input.active]);
   return NextResponse.json({manager:rows[0]});
  }
  const email=input.email.toLowerCase();
  if(email===getAdminEmail())return apiError("INVALID_ACCOUNT","Choose a different email address.",400);
  const hash=await bcrypt.hash(input.password,12);
  const rows=await sql.query("UPDATE nima_staff_users SET email=$1,password_hash=$2,credential_version=credential_version+1,updated_at=now() WHERE slot=1 RETURNING id,email,is_active,created_at",[email,hash]);
  return NextResponse.json({manager:rows[0]});
 }catch(error){
  console.error("Staff access update failed",error instanceof Error?error.message:"Unknown error");
  return apiError("ACCESS_UPDATE_FAILED","Could not update access settings.",500);
 }
}
