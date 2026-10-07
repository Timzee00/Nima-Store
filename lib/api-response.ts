import { NextResponse } from "next/server";

export function apiError(
  code:string,
  message:string,
  status:number,
  options:{field?:string|null;retryable?:boolean}={}
){
  return NextResponse.json(
    {
      ok:false,
      error:message,
      code,
      field:options.field??null,
      retryable:options.retryable??status>=500,
    },
    {status}
  );
}
