import fs from "node:fs";
import { getMedia, mediaPath } from "@/lib/media";

export async function GET(_request: Request, context: { params: Promise<{ id: string }> }) {
  const media = getMedia((await context.params).id);
  if (!media) return new Response("غير موجود", { status: 404 });
  const file = mediaPath(media);
  if (!fs.existsSync(file)) return new Response("غير موجود", { status: 404 });
  const body = fs.readFileSync(file);
  return new Response(body, {
    headers: {
      "Content-Type": media.mime,
      "Content-Length": String(body.byteLength),
      "Cache-Control": "public, max-age=31536000, immutable",
      "X-Content-Type-Options": "nosniff",
    },
  });
}
