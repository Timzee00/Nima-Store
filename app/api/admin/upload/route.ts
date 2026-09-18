import { NextResponse } from "next/server";
import { put } from "@vercel/blob";
import { getAdminSession } from "@/lib/auth";

const MAX_FILES = 6;
const MAX_SIZE = 4 * 1024 * 1024;
const TYPES = ["image/jpeg", "image/png", "image/webp"];

export async function POST(req: Request) {
  if (!(await getAdminSession())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const form = await req.formData();
  const incoming = form.getAll("files");
  const legacy = form.get("file");
  const files = incoming.length ? incoming : legacy ? [legacy] : [];

  if (!files.length || files.some((file) => !(file instanceof File))) {
    return NextResponse.json({ error: "Choose at least one image file." }, { status: 400 });
  }

  if (files.length > MAX_FILES) {
    return NextResponse.json({ error: "You can upload up to 6 images at a time." }, { status: 400 });
  }

  for (const file of files) {
    if (!(file instanceof File)) continue;
    if (file.size > MAX_SIZE) {
      return NextResponse.json({ error: "Each image must be 4MB or smaller." }, { status: 400 });
    }
    if (!TYPES.includes(file.type)) {
      return NextResponse.json({ error: "Use JPG, PNG or WebP images." }, { status: 400 });
    }
  }

  try {
    const urls: string[] = [];
    for (const file of files as File[]) {
      const safe = file.name.replace(/[^a-zA-Z0-9._-]/g, "-");
      const blob = await put(
        "nima/products/" + Date.now() + "-" + Math.random().toString(36).slice(2, 8) + "-" + safe,
        file,
        { access: "public" }
      );
      urls.push(blob.url);
    }

    return NextResponse.json({ urls, url: urls[0] });
  } catch {
    return NextResponse.json(
      { error: "Image upload needs Vercel Blob to be connected." },
      { status: 500 }
    );
  }
}
