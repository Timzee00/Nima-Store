export class NimaRequestError extends Error {
  code: string;
  status: number;
  field?: string | null;
  retryable: boolean;

  constructor(code:string,message:string,status=0,options:{field?:string|null;retryable?:boolean}={}){
    super(message);
    this.name="NimaRequestError";
    this.code=code;
    this.status=status;
    this.field=options.field;
    this.retryable=options.retryable??false;
  }
}

type FailurePayload={error?:string;code?:string;field?:string|null;retryable?:boolean};

function statusMessage(status:number,fallback:string){
  if(status===401)return "Your session has expired or is no longer valid. Please sign in again.";
  if(status===403)return "You do not have permission to perform that action.";
  if(status===404)return "We could not find what you requested.";
  if(status===409)return "That action conflicts with the latest store data. Refresh and try again.";
  if(status===413)return "That upload is too large. Choose a smaller file and try again.";
  if(status===429)return "Too many requests were sent. Wait a moment and try again.";
  if(status>=500)return "NIMA is having trouble completing that request right now. Please try again.";
  return fallback;
}

export function userMessage(error:unknown,fallback="Something went wrong. Please try again."){
  if(error instanceof NimaRequestError)return error.message;
  if(error instanceof DOMException&&(error.name==="AbortError"||error.name==="TimeoutError")){
    return "This is taking longer than expected. Check your connection and try again.";
  }
  if(error instanceof Error){
    const message=error.message||"";
    if(/failed to fetch|networkerror|load failed|network request failed/i.test(message)){
      return "We could not reach NIMA. Check your internet connection and try again.";
    }
    if(/blob|client token|read.?write token|access denied|storage.*token|store.*token/i.test(message)){
      return "Image storage could not authorize the upload. Please try again later.";
    }
    if(message&&message.length<220&&!/stack|sql|postgres|database_url|syntaxerror|typeerror:/i.test(message)){
      return message;
    }
  }
  return fallback;
}

export async function requestJson<T>(
  input:RequestInfo|URL,
  init:RequestInit={},
  options:{timeoutMs?:number;fallback?:string}={}
):Promise<T>{
  const timeoutMs=options.timeoutMs??20000;
  const fallback=options.fallback??"We could not complete that request.";
  const controller=new AbortController();
  let timedOut=false;
  const upstream=init.signal;
  const forwardAbort=()=>controller.abort(upstream?.reason);
  if(upstream){
    if(upstream.aborted)forwardAbort();
    else upstream.addEventListener("abort",forwardAbort,{once:true});
  }
  const timer=setTimeout(()=>{timedOut=true;controller.abort();},timeoutMs);
  try{
    const response=await fetch(input,{...init,signal:controller.signal});
    const raw=await response.text();
    let data:any={};
    if(raw){
      try{data=JSON.parse(raw)}catch{data={}}
    }
    if(!response.ok){
      const payload=data as FailurePayload;
      const message=typeof payload.error==="string"&&payload.error.trim()
        ? payload.error
        : statusMessage(response.status,fallback);
      throw new NimaRequestError(
        payload.code||("HTTP_"+response.status),
        message,
        response.status,
        {field:payload.field??null,retryable:payload.retryable??response.status>=500}
      );
    }
    return data as T;
  }catch(error){
    if(error instanceof NimaRequestError)throw error;
    if(timedOut)throw new NimaRequestError("REQUEST_TIMEOUT","This is taking longer than expected. Check your connection and try again.",0,{retryable:true});
    if(error instanceof TypeError)throw new NimaRequestError("NETWORK_ERROR","We could not reach NIMA. Check your internet connection and try again.",0,{retryable:true});
    throw error;
  }finally{
    clearTimeout(timer);
    upstream?.removeEventListener("abort",forwardAbort);
  }
}
