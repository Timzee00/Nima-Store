import { NextResponse } from "next/server";
import { z } from "zod";

const schema=z.object({choice:z.enum(["essential","accepted"])});

export async function POST(req:Request){
  try{
    const parsed=schema.safeParse(await req.json());
    if(!parsed.success)return NextResponse.json({error:"Invalid privacy choice."},{status:400});
    const response=NextResponse.json({ok:true,choice:parsed.data.choice});
    response.cookies.set("nima_cookie_consent",parsed.data.choice,{
      httpOnly:false,
      secure:process.env.NODE_ENV==="production",
      sameSite:"lax",
      path:"/",
      maxAge:31536000
    });
    return response;
  }catch{
    return NextResponse.json({error:"Could not save privacy choice."},{status:400});
  }
}
