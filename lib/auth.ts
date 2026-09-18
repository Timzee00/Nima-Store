import bcrypt from "bcryptjs";
import { SignJWT,jwtVerify } from "jose";
import { cookies } from "next/headers";
const COOKIE="nima_admin_session";
function secret(){const raw=process.env.SESSION_SECRET;if(!raw||raw.length<32)throw new Error("SESSION_SECRET must be at least 32 characters");return new TextEncoder().encode(raw);}
export async function createAdminSession(email:string){
  const token=await new SignJWT({sub:email,role:"admin"}).setProtectedHeader({alg:"HS256"}).setIssuedAt().setExpirationTime("7d").sign(secret());
  const jar=await cookies();jar.set(COOKIE,token,{httpOnly:true,secure:process.env.NODE_ENV==="production",sameSite:"lax",path:"/",maxAge:604800});
}
export async function getAdminSession(){
  const jar=await cookies(),token=jar.get(COOKIE)?.value;if(!token)return null;
  try{const {payload}=await jwtVerify(token,secret());if(payload.role!=="admin"||typeof payload.sub!=="string")return null;return {email:payload.sub};}catch{return null;}
}
export async function clearAdminSession(){const jar=await cookies();jar.delete(COOKIE);}
export async function verifyAdminPassword(password:string){
  const configured=process.env.ADMIN_PASSWORD;if(!configured)return false;
  const hash=await bcrypt.hash(configured,12);
  return bcrypt.compare(password,hash);
}
export function getAdminEmail(){return process.env.ADMIN_EMAIL??"";}