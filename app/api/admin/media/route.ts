import fs from "node:fs";
import path from "node:path";
import sharp from "sharp";
import { NextResponse } from "next/server";
import { MAX_IMAGE_EDGE, MAX_UPLOAD_BYTES, MIN_IMAGE_EDGE } from "@/lib/constants";
import { getSession } from "@/lib/auth";
import { logActivity, mediaDirectory } from "@/lib/db";
import { insertMedia, listMedia } from "@/lib/media";

export async function GET() {
  const session = await getSession();
  if (!session || session.role !== "admin") return NextResponse.json({ error: "غير مصرح" }, { status: 401 });
  return NextResponse.json({
    items: listMedia().map((item) => ({ id: item.id, alt: item.alt, width: item.width, height: item.height })),
  });
}

export async function POST(request: Request) {
  const session = await getSession();
  if (!session || session.role !== "admin") return NextResponse.json({ error: "غير مصرح" }, { status: 401 });
  const form = await request.formData();
  const file = form.get("file");
  if (!(file instanceof File)) return NextResponse.json({ error: "اختر صورة." }, { status: 400 });
  if (!["image/jpeg", "image/png", "image/webp"].includes(file.type)) {
    return NextResponse.json({ error: "الملف ليس صورة. استخدم JPG أو PNG أو WEBP." }, { status: 400 });
  }
  if (file.size > MAX_UPLOAD_BYTES) {
    return NextResponse.json({ error: "حجم الصورة أكبر من ٥ ميغابايت." }, { status: 400 });
  }
  const source = Buffer.from(await file.arrayBuffer());
  try {
    const image = sharp(source).rotate();
    const meta = await image.metadata();
    if (!meta.width || !meta.height || meta.width < MIN_IMAGE_EDGE || meta.height < MIN_IMAGE_EDGE) {
      return NextResponse.json({ error: "الصورة صغيرة جدًا. الحد الأدنى ٢٠٠ بكسل." }, { status: 400 });
    }
    if (meta.width > MAX_IMAGE_EDGE || meta.height > MAX_IMAGE_EDGE) {
      return NextResponse.json({ error: "أبعاد الصورة أكبر من الحد المسموح." }, { status: 400 });
    }
    const output = await image.resize({ width: 1600, height: 1600, fit: "inside", withoutEnlargement: true }).webp({ quality: 82 }).toBuffer();
    const info = await sharp(output).metadata();
    const id = crypto.randomUUID();
    const filename = `${id}.webp`;
    fs.mkdirSync(mediaDirectory(), { recursive: true });
    fs.writeFileSync(path.join(mediaDirectory(), filename), output);
    const alt = String(form.get("alt") || file.name).slice(0, 160);
    insertMedia({
      id,
      filename,
      mime: "image/webp",
      bytes: output.byteLength,
      width: info.width ?? null,
      height: info.height ?? null,
      alt,
    });
    logActivity(session.sub, "upload", "media", id, alt);
    return NextResponse.json({ id, url: `/media/${id}` });
  } catch {
    return NextResponse.json({ error: "تعذّر قراءة الصورة." }, { status: 400 });
  }
}
