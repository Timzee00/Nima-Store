import { NextResponse } from "next/server";
import { put } from "@vercel/blob";
import { getAdminSession } from "@/lib/auth";
import { apiError } from "@/lib/api-response";

export const runtime = "nodejs";
const MAX_IMAGE_SIZE = 4 * 1024 * 1024;
const CONTENT_TYPES = new Set(["image/jpeg", "image/png", "image/webp"]);

export async function POST(request: Request) {
  if (!(await getAdminSession())) {
    return apiError("SESSION_EXPIRED", "Your admin session has expired. Sign in again.", 401);
  }

  // Vercel Functions have a 4.5 MB request-body ceiling. Reject before parsing if possible.
  const length = Number(request.headers.get("content-length") || 0);
  if (length > MAX_IMAGE_SIZE + 65536) {
    return apiError("IMAGE_TOO_LARGE", "Choose an image no larger than 4 MB.", 413);
  }

  let image: FormDataEntryValue | null;
  try {
    const data = await request.formData();
    image = data.get("file");
  } catch {
    return apiError("INVALID_IMAGE_UPLOAD", "The image could not be read. Choose it again.", 400);
  }
  if (!(image instanceof File) || !CONTENT_TYPES.has(image.type)) {
    return apiError("UNSUPPORTED_IMAGE", "Choose a JPG, PNG or WebP image.", 400);
  }
  if (!image.size || image.size > MAX_IMAGE_SIZE) {
    return apiError("IMAGE_TOO_LARGE", "Choose an image between 1 byte and 4 MB.", 413);
  }

  const safeName = image.name.replace(/[^a-zA-Z0-9._-]/g, "-").slice(-100) || "product-image";
  try {
    const result = await put("nima/products/" + Date.now() + "-" + safeName, image, {
      access: "public",
      addRandomSuffix: true,
      contentType: image.type,
    });
    return NextResponse.json({ url: result.url });
  } catch (error) {
    console.error("NIMA server image upload failed", error instanceof Error ? error.message : "Unknown storage error");
    const message = error instanceof Error ? error.message : "";
    if (/token|unauthorized|access denied|not configured|store not found/i.test(message)) {
      return apiError("IMAGE_STORAGE_NOT_CONFIGURED", "The image store is not authorized in Vercel. Check the Blob storage connection.", 503, { retryable: false });
    }
    if (/quota|limit exceeded|insufficient storage|payment|billing/i.test(message)) {
      return apiError("IMAGE_STORAGE_LIMIT", "Image storage has reached a limit. Check Vercel Blob usage before retrying.", 503, { retryable: false });
    }
    return apiError("IMAGE_STORAGE_UNAVAILABLE", "Image storage could not save this file. Please try again.", 503, { retryable: true });
  }
}
