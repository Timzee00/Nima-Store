import { NextResponse } from "next/server";
import { z } from "zod";
import { authenticateAdmin, createAdminSession } from "@/lib/auth";
import { apiError } from "@/lib/api-response";
const schema=z.object({email:z.string().email(),password:z.string().min(8).max(200)});
export async function POST(req:Request){
 try{
  const p=schema.safeParse(await req.json());
  if(!p.success)return apiError("LOGIN_DETAILS_INVALID","Enter a valid email address and password.",400);
  const account=await authenticateAdmin(p.data.email,p.data.password);
  if(!account)return apiError("INVALID_CREDENTIALS","The email or password is incorrect.",401);
  await createAdminSession(account);
  return NextResponse.json({ok:true});
 }catch(error){
  console.error("Admin sign-in failed",error instanceof Error?error.message:"Unknown error");
  return apiError("LOGIN_UNAVAILABLE","Sign-in is temporarily unavailable. Please try again.",500,{retryable:true});
 }
}
