import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { logActivity } from "@/lib/db";
import { deleteMedia } from "@/lib/media";

export async function DELETE(_request: Request, context: { params: Promise<{ id: string }> }) {
  const session = await getSession();
  if (!session || session.role !== "admin") return NextResponse.json({ error: "غير مصرح" }, { status: 401 });
  const result = deleteMedia((await context.params).id);
  if (!result.ok) return NextResponse.json({ error: result.error }, { status: 409 });
  logActivity(session.sub, "delete", "media", (await context.params).id, "حذف وسيط");
  return NextResponse.json({ ok: true });
}
