import fs from "node:fs";
import path from "node:path";
import { execute, mediaDirectory, queryAll, queryOne } from "@/lib/db";
import { nowIso } from "@/lib/format";

export type MediaRecord = {
  id: string;
  filename: string;
  mime: string;
  bytes: number;
  width: number | null;
  height: number | null;
  alt: string | null;
  createdAt: string;
};

export function listMedia() {
  return queryAll<{
    id: string;
    filename: string;
    mime: string;
    bytes: number;
    width: number | null;
    height: number | null;
    alt: string | null;
    created_at: string;
  }>("SELECT * FROM media ORDER BY created_at DESC").map(mapMedia);
}

export function getMedia(id: string) {
  const row = queryOne<{
    id: string;
    filename: string;
    mime: string;
    bytes: number;
    width: number | null;
    height: number | null;
    alt: string | null;
    created_at: string;
  }>("SELECT * FROM media WHERE id = ?", id);
  return row ? mapMedia(row) : null;
}

export function mediaPath(record: MediaRecord) {
  const filename = path.basename(record.filename);
  return path.join(mediaDirectory(), filename);
}

export function insertMedia(input: {
  id: string;
  filename: string;
  mime: string;
  bytes: number;
  width: number | null;
  height: number | null;
  alt: string;
}) {
  execute(
    `INSERT INTO media (id, filename, mime, bytes, width, height, alt, created_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
    input.id,
    input.filename,
    input.mime,
    input.bytes,
    input.width,
    input.height,
    input.alt,
    nowIso(),
  );
}

export function mediaUsage(id: string) {
  const reasons: string[] = [];
  const cover = queryOne("SELECT id FROM stories WHERE cover_id = ? LIMIT 1", id);
  if (cover) reasons.push("غلاف قصة");
  const extra = queryOne("SELECT story_id FROM story_images WHERE media_id = ? LIMIT 1", id);
  if (extra) reasons.push("صورة إضافية لقصة");
  const author = queryOne("SELECT id FROM authors WHERE image_id = ? LIMIT 1", id);
  if (author) reasons.push("صورة مؤلف");
  const category = queryOne("SELECT id FROM categories WHERE image_id = ? LIMIT 1", id);
  if (category) reasons.push("صورة تصنيف");
  const setting = queryOne(
    "SELECT key FROM settings WHERE value = ? AND key IN ('logo_id', 'social_image_id') LIMIT 1",
    id,
  );
  if (setting) reasons.push("إعدادات الموقع");
  const sections = queryAll<{ config_json: string }>("SELECT config_json FROM homepage_sections");
  if (sections.some((section) => section.config_json.includes(id))) reasons.push("قسم في الصفحة الرئيسية");
  return reasons;
}

export function deleteMedia(id: string) {
  const record = getMedia(id);
  if (!record) return { ok: false as const, error: "الصورة غير موجودة." };
  const usage = mediaUsage(id);
  if (usage.length) return { ok: false as const, error: `الصورة مستخدمة في: ${usage.join("، ")}.` };
  const file = mediaPath(record);
  execute("DELETE FROM media WHERE id = ?", id);
  if (fs.existsSync(file)) fs.unlinkSync(file);
  return { ok: true as const };
}

function mapMedia(row: {
  id: string;
  filename: string;
  mime: string;
  bytes: number;
  width: number | null;
  height: number | null;
  alt: string | null;
  created_at: string;
}): MediaRecord {
  return {
    id: row.id,
    filename: row.filename,
    mime: row.mime,
    bytes: row.bytes,
    width: row.width,
    height: row.height,
    alt: row.alt,
    createdAt: row.created_at,
  };
}
