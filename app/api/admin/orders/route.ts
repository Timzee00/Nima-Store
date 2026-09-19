import{NextResponse}from"next/server";import{z}from"zod";import{getAdminSession}from"@/lib/auth";import{getRecentOrders}from"@/lib/store";import{sql}from"@/lib/db";
const schema=z.object({id:z.string().uuid(),status:z.enum(["pending","confirmed","fulfilled","cancelled"])});

export async function GET(req:Request){
 if(!await getAdminSession())return NextResponse.json({error:"Unauthorized"},{status:401});
 const q=new URL(req.url).searchParams;
 const page=Math.max(1,Number(q.get("page")||"1")||1);
 const pageSize=Math.min(50,Math.max(1,Number(q.get("limit")||"20")||20));
 return NextResponse.json(await getRecentOrders({search:(q.get("search")||"").trim(),status:(q.get("status")||"").trim(),page,pageSize}));
}

export async function PATCH(req:Request){
 if(!await getAdminSession())return NextResponse.json({error:"Unauthorized"},{status:401});
 const p=schema.safeParse(await req.json());
 if(!p.success)return NextResponse.json({error:"Invalid status"},{status:400});
 const rows=await sql.query("UPDATE orders SET status=$1,updated_at=now() WHERE id=$2 RETURNING id,order_number,status,updated_at",[p.data.status,p.data.id]);
 if(!rows[0])return NextResponse.json({error:"Order not found."},{status:404});
 return NextResponse.json(rows[0]);
}