import { NextResponse } from "next/server";
import { put } from "@vercel/blob";
import { getAdminSession } from "@/lib/auth";

export async function POST(req: Request) {
  if (!(await getAdminSession())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const form = await req.formData();
  const file = form.get("file");

  if (!(file instanceof File)) {
    return NextResponse.json({ error: "Choose an image file." }, { status: 400 });
  }

  if (file.size > 4 * 1024 * 1024) {
    return NextResponse.json({ error: "Image must be 4MB or smaller." }, { status: 400 });
  }

  if (!["image/jpeg", "image/png", "image/webp"].includes(file.type)) {
    return NextResponse.json({ error: "Use JPG, PNG or WebP." }, { status: 400 });
  }

  try {
    const safe = file.name.replace(/[^a-zA-Z0-9._-]/g, "-");
    const blob = await put(
      "nima/products/" + Date.now() + "-" + safe,
      file,
      { access: "public" }
    );

    return NextResponse.json({ url: blob.url });
  } catch {
    return NextResponse.json(
      { error: "Image upload needs Vercel Blob to be connected." },
      { status: 500 }
    );
  }
}
