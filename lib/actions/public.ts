"use server";

import { cookies } from "next/headers";
import { revalidatePath } from "next/cache";
import { execute, queryAll, queryOne, transaction } from "@/lib/db";
import { clearSession, getSession, setSession } from "@/lib/auth";
import { nowIso } from "@/lib/format";
import { recountFavorite } from "@/lib/stories";

const recentViews = new Map<string, number>();

export async function toggleFavorite(storyId: string) {
  const story = queryOne<{ id: string }>(
    "SELECT id FROM stories WHERE id = ? AND published = 1 AND (publish_at IS NULL OR publish_at <= ?)",
    storyId,
    nowIso(),
  );
  if (!story) return { ok: false as const, error: "القصة غير متاحة." };
  const user = await ensureViewer();
  const existing = queryOne(
    "SELECT story_id FROM favorites WHERE user_id = ? AND story_id = ?",
    user.sub,
    storyId,
  );
  if (existing) {
    execute("DELETE FROM favorites WHERE user_id = ? AND story_id = ?", user.sub, storyId);
  } else {
    execute(
      "INSERT INTO favorites (user_id, story_id, created_at) VALUES (?, ?, ?)",
      user.sub,
      storyId,
      nowIso(),
    );
  }
  recountFavorite(storyId);
  revalidatePath("/", "layout");
  return { ok: true as const, saved: !existing };
}

export async function recordView(storyId: string) {
  const story = queryOne<{ id: string }>(
    "SELECT id FROM stories WHERE id = ? AND published = 1 AND (publish_at IS NULL OR publish_at <= ?)",
    storyId,
    nowIso(),
  );
  if (!story) return;
  const jar = await cookies();
  const seen = new Set((jar.get("yaraa_seen")?.value ?? "").split(",").filter(Boolean));
  if (seen.has(storyId)) return;
  const session = await getSession();
  const key = `${session?.sub ?? "anon"}:${storyId}`;
  const last = recentViews.get(key) ?? 0;
  if (Date.now() - last < 8000) return;
  recentViews.set(key, Date.now());
  seen.add(storyId);
  const next = [...seen].slice(-40).join(",");
  jar.set("yaraa_seen", next, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 24 * 30,
  });
  execute("UPDATE stories SET view_count = view_count + 1 WHERE id = ?", storyId);
  execute(
    "INSERT INTO view_events (id, story_id, user_id, created_at) VALUES (?, ?, ?, ?)",
    crypto.randomUUID(),
    storyId,
    session?.sub ?? null,
    nowIso(),
  );
}

export async function saveReaderProfile(formData: FormData) {
  const name = String(formData.get("name") || "").trim();
  const email = String(formData.get("email") || "").trim().toLowerCase();
  if (name.length < 2) return { error: "اكتب اسمك." };
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return { error: "البريد غير واضح." };
  const existing = queryOne<{ id: string; role: string }>(
    "SELECT id, role FROM users WHERE email = ?",
    email,
  );
  if (existing?.role === "admin") return { error: "تعذّر استخدام هذا البريد." };
  const session = await getSession();
  let targetId = existing?.id ?? null;

  transaction(() => {
    if (!targetId) {
      if (session?.role === "reader") {
        const current = queryOne<{ email: string | null }>("SELECT email FROM users WHERE id = ?", session.sub);
        if (!current?.email) {
          execute("UPDATE users SET name = ?, email = ? WHERE id = ?", name, email, session.sub);
          targetId = session.sub;
          return;
        }
      }
      targetId = crypto.randomUUID();
      execute(
        "INSERT INTO users (id, name, email, password_hash, role, created_at) VALUES (?, ?, ?, NULL, 'reader', ?)",
        targetId,
        name,
        email,
        nowIso(),
      );
      return;
    }
    execute("UPDATE users SET name = ? WHERE id = ?", name, targetId);
  });

  if (session?.role === "reader" && session.sub !== targetId && targetId) {
    transaction(() => {
      const rows = queryAll<{ story_id: string }>("SELECT story_id FROM favorites WHERE user_id = ?", session.sub);
      rows.forEach((row) => {
        execute(
          "INSERT OR IGNORE INTO favorites (user_id, story_id, created_at) VALUES (?, ?, ?)",
          targetId,
          row.story_id,
          nowIso(),
        );
      });
      execute("DELETE FROM favorites WHERE user_id = ?", session.sub);
      const current = queryOne<{ email: string | null }>("SELECT email FROM users WHERE id = ?", session.sub);
      if (!current?.email) execute("DELETE FROM users WHERE id = ?", session.sub);
      rows.forEach((row) => recountFavorite(row.story_id));
    });
  }

  await setSession({ sub: targetId!, role: "reader", name }, "reader");
  revalidatePath("/", "layout");
  return { ok: true as const };
}

export async function logoutReader() {
  const session = await getSession();
  if (session?.role === "admin") return;
  await clearSession();
  revalidatePath("/", "layout");
}

async function ensureViewer() {
  const session = await getSession();
  if (session) return session;
  const id = crypto.randomUUID();
  execute(
    "INSERT INTO users (id, name, email, password_hash, role, created_at) VALUES (?, 'قارئ', NULL, NULL, 'reader', ?)",
    id,
    nowIso(),
  );
  const payload = { sub: id, role: "reader" as const, name: "قارئ" };
  await setSession(payload, "reader");
  return payload;
}
