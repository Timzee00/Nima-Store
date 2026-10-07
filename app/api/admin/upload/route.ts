import { NextResponse } from "next/server";
import { handleUpload, type HandleUploadBody } from "@vercel/blob/client";
import { getAdminSession } from "@/lib/auth";
import { apiError } from "@/lib/api-response";

const MAX_SIZE = 4 * 1024 * 1024;
const TYPES = ["image/jpeg", "image/png", "image/webp"];

function hasBlobAuth(request:Request){
  return Boolean(process.env.BLOB_READ_WRITE_TOKEN || request.headers.get("x-vercel-oidc-token"));
}

export async function GET(request:Request){
  if(!(await getAdminSession()))return apiError("SESSION_EXPIRED","Your admin session has expired. Sign in again.",401);
  if(!hasBlobAuth(request))return apiError("IMAGE_STORAGE_NOT_CONFIGURED","Product image storage is not connected to this production deployment.",503,{retryable:false});
  return NextResponse.json({ok:true});
}

export async function POST(request: Request) {
  let body: HandleUploadBody;
  try {
    body = (await request.json()) as HandleUploadBody;
  } catch {
    return apiError("INVALID_UPLOAD_REQUEST","The image upload request was not valid. Choose the image again and retry.",400);
  }

  try {
    const jsonResponse = await handleUpload({
      body,
      request,
      onBeforeGenerateToken: async (pathname) => {
        if (!(await getAdminSession())) throw new Error("SESSION_EXPIRED");
        if (!pathname.startsWith("nima/products/")) throw new Error("INVALID_UPLOAD_PATH");
        return {
          allowedContentTypes: TYPES,
          maximumSizeInBytes: MAX_SIZE,
          addRandomSuffix: true,
          tokenPayload: "nima-admin-product",
        };
      },
      onUploadCompleted: async () => {},
    });
    return NextResponse.json(jsonResponse);
  } catch (error) {
    console.error("Product image upload authorization failed",error);
    const message=error instanceof Error?error.message:"";
    if(message==="SESSION_EXPIRED")return apiError("SESSION_EXPIRED","Your admin session has expired. Sign in again.",401);
    if(message==="INVALID_UPLOAD_PATH")return apiError("INVALID_UPLOAD_PATH","The image destination was not valid. Choose the image again and retry.",400);
    if(/token|blob|store|access denied|not configured|oidc/i.test(message)){
      return apiError("IMAGE_STORAGE_UNAVAILABLE","Product image storage could not authorize this upload. Check the Vercel Blob connection and try again.",503,{retryable:true});
    }
    return apiError("UPLOAD_AUTH_FAILED","We could not prepare the image upload. Please try again.",500,{retryable:true});
  }
}
