import{createHash,randomBytes}from"crypto";import{cookies}from"next/headers";import{sql}from"./db";
const COOKIE="nima_customer_session";
const MAX_AGE=60*60*24*30;
export function normalizePhone(value:string){return value.replace(/\D/g,"");}
function hashToken(token:string){return createHash("sha256").update(token).digest("hex");}
export async function createCustomerSession(phone:string){
 const normalized=normalizePhone(phone);
 const token=randomBytes(32).toString("hex");
 await sql.query("DELETE FROM customer_sessions WHERE expires_at<=now()",[]);
 await sql.query("INSERT INTO customer_sessions(token_hash,phone,expires_at) VALUES($1,$2,now()+interval '30 days')",[hashToken(token),normalized]);
 const jar=await cookies();
 jar.set(COOKIE,token,{httpOnly:true,secure:process.env.NODE_ENV==="production",sameSite:"lax",path:"/",maxAge:MAX_AGE});
}
export async function getCustomerSession(){
 const token=(await cookies()).get(COOKIE)?.value;
 if(!token)return null;
 const rows=await sql.query("SELECT phone FROM customer_sessions WHERE token_hash=$1 AND expires_at>now() LIMIT 1",[hashToken(token)]);
 return rows[0]?{phone:String(rows[0].phone)}:null;
}
export async function clearCustomerSession(){
 const jar=await cookies();
 const token=jar.get(COOKIE)?.value;
 if(token)await sql.query("DELETE FROM customer_sessions WHERE token_hash=$1",[hashToken(token)]);
 jar.delete(COOKIE);
}