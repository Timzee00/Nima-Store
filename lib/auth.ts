import bcrypt from "bcryptjs";
import { SignJWT, jwtVerify } from "jose";
import { cookies } from "next/headers";
import { sql } from "./db";
const COOKIE="nima_admin_session";
export type AdminRole="owner"|"manager";
export type AdminAccount={id:string;email:string;role:AdminRole;version:number};
function secret(){const raw=process.env.SESSION_SECRET;if(!raw||raw.length<32)throw new Error("SESSION_SECRET must be at least 32 characters");return new TextEncoder().encode(raw)}
export function getAdminEmail(){return(process.env.ADMIN_EMAIL||"").trim().toLowerCase()}
async function ownerOverride(){
 const rows=await sql.query("SELECT password_hash,credential_version FROM nima_owner_access WHERE id=1",[]);
 return rows[0] as {password_hash:string;credential_version:number}|undefined;
}
export async function verifyOwnerPassword(password:string){
 const current=await ownerOverride();
 if(current)return bcrypt.compare(password,current.password_hash);
 const configured=process.env.ADMIN_PASSWORD;
 if(!configured)return false;
 return bcrypt.compare(password,await bcrypt.hash(configured,12));
}
export async function authenticateAdmin(email:string,password:string):Promise<AdminAccount|null>{
 const normalized=email.trim().toLowerCase();
 if(normalized===getAdminEmail()&&normalized){
  if(!await verifyOwnerPassword(password))return null;
  const settings=await ownerOverride();
  return{id:"owner",email:normalized,role:"owner",version:Number(settings?.credential_version||0)};
 }
 const rows=await sql.query("SELECT id,email,password_hash,is_active,credential_version FROM nima_staff_users WHERE email=$1 LIMIT 1",[normalized]);
 const staff=rows[0];
 if(!staff||!staff.is_active||!await bcrypt.compare(password,String(staff.password_hash)))return null;
 return{id:String(staff.id),email:String(staff.email),role:"manager",version:Number(staff.credential_version)};
}
export async function createAdminSession(account:AdminAccount){
 const token=await new SignJWT({sub:account.id,email:account.email,role:account.role,version:account.version})
 .setProtectedHeader({alg:"HS256"}).setIssuedAt().setExpirationTime("7d").sign(secret());
 const jar=await cookies();
 jar.set(COOKIE,token,{httpOnly:true,secure:process.env.NODE_ENV==="production",sameSite:"lax",path:"/",maxAge:604800});
}
export async function getAdminSession():Promise<AdminAccount|null>{
 const jar=await cookies(),token=jar.get(COOKIE)?.value;if(!token)return null;
 try{
  const {payload}=await jwtVerify(token,secret());
  if(typeof payload.sub!=="string"||typeof payload.email!=="string"||typeof payload.version!=="number"||(payload.role!=="owner"&&payload.role!=="manager"))return null;
  if(payload.role==="owner"){
   if(payload.sub!=="owner"||payload.email.toLowerCase()!==getAdminEmail())return null;
   const state=await ownerOverride();
   if(payload.version!==Number(state?.credential_version||0))return null;
   return{id:"owner",email:payload.email,role:"owner",version:payload.version};
  }
  const rows=await sql.query("SELECT id,email,is_active,credential_version FROM nima_staff_users WHERE id=$1 LIMIT 1",[payload.sub]);
  const staff=rows[0];
  if(!staff||!staff.is_active||Number(staff.credential_version)!==payload.version||String(staff.email).toLowerCase()!==payload.email.toLowerCase())return null;
  return{id:String(staff.id),email:String(staff.email),role:"manager",version:Number(staff.credential_version)};
 }catch{return null}
}
export async function clearAdminSession(){const jar=await cookies();jar.delete(COOKIE)}
