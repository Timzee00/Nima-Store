import{NextResponse}from"next/server";
import{z}from"zod";
import{createAdminSession,getAdminEmail,verifyAdminPassword}from"@/lib/auth";
import{apiError}from"@/lib/api-response";
const schema=z.object({email:z.string().email(),password:z.string().min(8).max(200)});
export async function POST(req:Request){
 try{
  const p=schema.safeParse(await req.json());
  if(!p.success)return apiError("LOGIN_DETAILS_INVALID","Enter a valid email address and a password of at least 8 characters.",400);
  const email=getAdminEmail(),ok=p.data.email.toLowerCase()===email.toLowerCase()&&await verifyAdminPassword(p.data.password);
  if(!ok)return apiError("INVALID_CREDENTIALS","The email or password is incorrect.",401);
  await createAdminSession(email);
  return NextResponse.json({ok:true});
 }catch(error){
  console.error("Admin sign-in failed",error);
  return apiError("LOGIN_UNAVAILABLE","Admin sign-in is temporarily unavailable. Please try again.",500,{retryable:true});
 }
}
