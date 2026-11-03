"use client";
import { upload } from "@vercel/blob/client";
import { NimaRequestError } from "./client-request";

export type ProductImageUploadPhase = "uploading" | "saving" | "retrying";
type ProgressCallback = (percent: number, phase: ProductImageUploadPhase) => void;

function uploadThroughNima(file: File, onProgress: ProgressCallback): Promise<string> {
  return new Promise((resolve, reject) => {
    const form = new FormData();
    form.append("file", file, file.name);
    const xhr = new XMLHttpRequest();
    xhr.open("POST", "/api/admin/upload/server");
    xhr.timeout = 45000;
    xhr.upload.onprogress = (event) => {
      if (event.lengthComputable && event.total > 0) {
        onProgress(Math.min(95, Math.round((event.loaded / event.total) * 95)), "uploading");
      }
    };
    xhr.upload.onload = () => onProgress(95, "saving");
    xhr.onerror = () => reject(new NimaRequestError("UPLOAD_NETWORK_ERROR", "The connection to NIMA was interrupted during upload.", 0, { retryable: true }));
    xhr.ontimeout = () => reject(new NimaRequestError("UPLOAD_TIMEOUT", "The image upload took too long.", 0, { retryable: true }));
    xhr.onload = () => {
      let data: { url?: string; code?: string; error?: string; retryable?: boolean } = {};
      try { data = JSON.parse(xhr.responseText || "{}"); } catch {}
      if (xhr.status >= 200 && xhr.status < 300 && typeof data.url === "string" && data.url.startsWith("https://")) {
        onProgress(100, "saving");
        resolve(data.url);
        return;
      }
      const message = typeof data.error === "string" && data.error.trim()
        ? data.error
        : xhr.status === 413
          ? "This image exceeds the site's upload limit."
          : "NIMA could not store this image. Please try again.";
      reject(new NimaRequestError(data.code || "IMAGE_UPLOAD_FAILED", message, xhr.status, { retryable: data.retryable ?? xhr.status >= 500 }));
    };
    xhr.send(form);
  });
}

export async function uploadProductImage(file: File, pathname: string, onProgress: ProgressCallback): Promise<string> {
  onProgress(0, "uploading");
  try {
    // Same-origin upload is friendlier to mobile networks that block direct storage endpoints.
    return await uploadThroughNima(file, onProgress);
  } catch (primaryError) {
    // Authentication, configuration, and quota errors must be shown, not hidden by another retry.
    if (primaryError instanceof NimaRequestError && ![0, 413, 502, 504].includes(primaryError.status)) {
      throw primaryError;
    }
    onProgress(0, "retrying");
    const controller = new AbortController();
    let lastProgress = Date.now();
    let abortedForStall = false;
    const watch = window.setInterval(() => {
      if (Date.now() - lastProgress > 45000) {
        abortedForStall = true;
        controller.abort();
      }
    }, 3000);
    try {
      const blob = await upload(pathname, file, {
        access: "public",
        handleUploadUrl: "/api/admin/upload",
        abortSignal: controller.signal,
        onUploadProgress: ({ loaded, percentage }) => {
          if (loaded > 0) lastProgress = Date.now();
          onProgress(Math.max(0, Math.min(100, Math.round(percentage))), "retrying");
        },
      });
      return blob.url;
    } catch (fallbackError) {
      if (abortedForStall) throw new Error("Both upload connections stalled. Try a different network, then retry the remaining images.");
      if (primaryError instanceof NimaRequestError && primaryError.status === 413) throw primaryError;
      throw fallbackError;
    } finally {
      window.clearInterval(watch);
    }
  }
}
