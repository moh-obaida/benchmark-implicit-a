"use server";

import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { ICON_KEYS, isPaletteHex, LAYOUT_IDS, SECTION_TYPE_IDS } from "@/lib/constants";
import { clearSession, hashPassword, requireAdmin, setSession, verifyAdminPassword } from "@/lib/auth";
import { execute, logActivity, queryAll, queryOne, transaction, uniqueSlug } from "@/lib/db";
import { clip, fromLocalInput, nowIso, slugify, splitTags } from "@/lib/format";
import { parseConfig, type SectionConfig } from "@/lib/homepage";
import { safeAdminPath } from "@/lib/session";
import { saveSettings } from "@/lib/settings";

const loginAttempts = new Map<string, { count: number; at: number }>();

export async function loginAdmin(formData: FormData) {
  const headerList = await headers();
  const ip = headerList.get("x-forwarded-for")?.split(",")[0]?.trim() || "local";
  const attempt = loginAttempts.get(ip);
  if (attempt && attempt.count >= 6 && Date.now() - attempt.at < 60_000) {
    return { error: "محاولات كثيرة. انتظر دقيقة ثم أعد المحاولة." };
  }
  const email = String(formData.get("email") || "");
  const password = String(formData.get("password") || "");
  const user = await verifyAdminPassword(email, password);
  if (!user) {
    const current = loginAttempts.get(ip);
    loginAttempts.set(ip, {
      count: current && Date.now() - current.at < 60_000 ? current.count + 1 : 1,
      at: Date.now(),
    });
    return { error: "بيانات الدخول غير صحيحة." };
  }
  loginAttempts.delete(ip);
  await setSession({ sub: user.id, role: "admin", name: user.name }, "admin");
  redirect(safeAdminPath(String(formData.get("next") || "/admin")));
}

export async function logoutAdmin() {
  await clearSession();
  redirect("/admin/login");
}

function refresh() {
  revalidatePath("/", "layout");
}

export async function saveStory(formData: FormData) {
  const session = await requireAdmin();
  const id = String(formData.get("id") || "") || crypto.randomUUID();
  const existing = queryOne<{ id: string }>("SELECT id FROM stories WHERE id = ?", id);
  const title = clip(String(formData.get("title") || ""), 160);
  if (title.length < 2) return { error: "اكتب عنوان القصة." };
  const slugInput = clip(String(formData.get("slug") || ""), 80);
  const slug = uniqueSlug("stories", slugify(slugInput || title) || "قصة", existing ? id : undefined);
  const ageMin = numberOrNull(formData.get("age_min"));
  const ageMax = numberOrNull(formData.get("age_max"));
  if (ageMin != null && ageMax != null && ageMin > ageMax) return { error: "بداية العمر أكبر من نهايته." };
  const reading = numberOrNull(formData.get("reading_minutes"));
  if (reading != null && (reading < 1 || reading > 600)) return { error: "مدة القراءة غير مناسبة." };
  const now = nowIso();
  const published = formData.get("published") === "on" ? 1 : 0;
  let publishAt = fromLocalInput(String(formData.get("publish_at") || ""));
  if (published && !publishAt) publishAt = existing ? publishAt : now;
  if (published && !publishAt) publishAt = now;

  const payload = {
    title,
    slug,
    short: clip(String(formData.get("short_description") || ""), 400),
    full: clip(String(formData.get("full_description") || ""), 8000),
    authorId: optionalId(formData.get("author_id")),
    coverId: optionalId(formData.get("cover_id")),
    ageMin,
    ageMax,
    storyType: clip(String(formData.get("story_type") || ""), 80),
    genre: clip(String(formData.get("genre") || ""), 80),
    reading,
    featured: formData.get("featured") === "on" ? 1 : 0,
    editorPick: formData.get("editor_pick") === "on" ? 1 : 0,
    published,
    publishAt,
    priority: clampNumber(formData.get("priority"), 0, 1000, 0),
    adminNotes: clip(String(formData.get("admin_notes") || ""), 2000),
    displayOrder: clampNumber(formData.get("display_order"), 0, 9999, 0),
    narrator: clip(String(formData.get("narrator") || ""), 120),
    series: clip(String(formData.get("series_name") || ""), 120),
    episode: numberOrNull(formData.get("episode_number")),
    source: clip(String(formData.get("external_source") || ""), 200),
    audio: clip(String(formData.get("audio_url") || ""), 400),
    video: clip(String(formData.get("video_url") || ""), 400),
  };

  transaction(() => {
    if (existing) {
      execute(
        `UPDATE stories SET
          title = ?, slug = ?, short_description = ?, full_description = ?, author_id = ?, cover_id = ?,
          age_min = ?, age_max = ?, story_type = ?, genre = ?, reading_minutes = ?, featured = ?, editor_pick = ?,
          published = ?, publish_at = ?, priority = ?, admin_notes = ?, display_order = ?, narrator = ?,
          series_name = ?, episode_number = ?, external_source = ?, audio_url = ?, video_url = ?, updated_at = ?
         WHERE id = ?`,
        payload.title,
        payload.slug,
        emptyToNull(payload.short),
        emptyToNull(payload.full),
        payload.authorId,
        payload.coverId,
        payload.ageMin,
        payload.ageMax,
        emptyToNull(payload.storyType),
        emptyToNull(payload.genre),
        payload.reading,
        payload.featured,
        payload.editorPick,
        payload.published,
        payload.publishAt,
        payload.priority,
        emptyToNull(payload.adminNotes),
        payload.displayOrder,
        emptyToNull(payload.narrator),
        emptyToNull(payload.series),
        payload.episode,
        emptyToNull(payload.source),
        emptyToNull(payload.audio),
        emptyToNull(payload.video),
        now,
        id,
      );
    } else {
      execute(
        `INSERT INTO stories (
          id, title, slug, short_description, full_description, author_id, cover_id, age_min, age_max,
          story_type, genre, reading_minutes, featured, editor_pick, published, publish_at, priority,
          view_count, favorite_count, admin_notes, display_order, narrator, series_name, episode_number,
          external_source, audio_url, video_url, is_demo, created_at, updated_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 0, 0, ?, ?, ?, ?, ?, ?, ?, ?, 0, ?, ?)`,
        id,
        payload.title,
        payload.slug,
        emptyToNull(payload.short),
        emptyToNull(payload.full),
        payload.authorId,
        payload.coverId,
        payload.ageMin,
        payload.ageMax,
        emptyToNull(payload.storyType),
        emptyToNull(payload.genre),
        payload.reading,
        payload.featured,
        payload.editorPick,
        payload.published,
        payload.publishAt,
        payload.priority,
        emptyToNull(payload.adminNotes),
        payload.displayOrder,
        emptyToNull(payload.narrator),
        emptyToNull(payload.series),
        payload.episode,
        emptyToNull(payload.source),
        emptyToNull(payload.audio),
        emptyToNull(payload.video),
        now,
        now,
      );
    }
    syncCategories(id, formData);
    syncTags(id, String(formData.get("tags") || ""));
    syncRelated(id, formData.getAll("related_ids").map(String));
    syncImages(id, String(formData.get("extra_image_ids") || ""));
  });
  logActivity(session.sub, existing ? "update" : "create", "story", id, payload.title);
  refresh();
  redirect(`/admin/stories/${id}?saved=1`);
}

export async function deleteStory(formData: FormData) {
  const session = await requireAdmin();
  const id = String(formData.get("id") || "");
  const story = queryOne<{ title: string }>("SELECT title FROM stories WHERE id = ?", id);
  if (!story) redirect("/admin/stories");
  execute("DELETE FROM stories WHERE id = ?", id);
  logActivity(session.sub, "delete", "story", id, story.title);
  refresh();
  redirect("/admin/stories");
}

export async function toggleStoryPublished(formData: FormData) {
  const session = await requireAdmin();
  const id = String(formData.get("id") || "");
  const story = queryOne<{ published: number; title: string; publish_at: string | null }>(
    "SELECT published, title, publish_at FROM stories WHERE id = ?",
    id,
  );
  if (!story) return;
  const next = story.published === 1 ? 0 : 1;
  execute(
    "UPDATE stories SET published = ?, publish_at = ?, updated_at = ? WHERE id = ?",
    next,
    next && !story.publish_at ? nowIso() : story.publish_at,
    nowIso(),
    id,
  );
  logActivity(session.sub, next ? "publish" : "unpublish", "story", id, story.title);
  refresh();
}

export async function deleteDemoContent() {
  const session = await requireAdmin();
  transaction(() => {
    execute("DELETE FROM stories WHERE is_demo = 1");
    execute(
      `DELETE FROM categories WHERE is_demo = 1 AND id NOT IN (SELECT category_id FROM story_categories)`,
    );
    execute(`DELETE FROM authors WHERE is_demo = 1 AND id NOT IN (SELECT author_id FROM stories WHERE author_id IS NOT NULL)`);
    execute(`DELETE FROM tags WHERE id NOT IN (SELECT tag_id FROM story_tags)`);
  });
  logActivity(session.sub, "delete", "demo", "demo", "حُذف المحتوى التجريبي");
  refresh();
  redirect("/admin/stories");
}

export async function saveCategory(formData: FormData) {
  const session = await requireAdmin();
  const id = String(formData.get("id") || "") || crypto.randomUUID();
  const existing = queryOne("SELECT id FROM categories WHERE id = ?", id);
  const name = clip(String(formData.get("name") || ""), 80);
  if (name.length < 2) return { error: "اكتب اسم التصنيف." };
  const color = String(formData.get("color") || "");
  if (!isPaletteHex(color)) return { error: "اختر لونًا من الألوان المعتمدة." };
  const icon = String(formData.get("icon") || "quill");
  if (!ICON_KEYS.has(icon)) return { error: "الأيقونة غير معتمدة." };
  const slug = uniqueSlug("categories", slugify(clip(String(formData.get("slug") || name), 80)) || "تصنيف", existing ? id : undefined);
  const now = nowIso();
  const values = [
    name,
    slug,
    emptyToNull(clip(String(formData.get("description") || ""), 300)),
    optionalId(formData.get("image_id")),
    icon,
    color,
    clampNumber(formData.get("sort_order"), 0, 999, 0),
    formData.get("published") === "on" ? 1 : 0,
    formData.get("show_on_home") === "on" ? 1 : 0,
    formData.get("show_in_nav") === "on" ? 1 : 0,
    formData.get("featured") === "on" ? 1 : 0,
    now,
  ];
  if (existing) {
    execute(
      `UPDATE categories SET name = ?, slug = ?, description = ?, image_id = ?, icon = ?, color = ?, sort_order = ?,
       published = ?, show_on_home = ?, show_in_nav = ?, featured = ?, updated_at = ? WHERE id = ?`,
      ...values,
      id,
    );
  } else {
    execute(
      `INSERT INTO categories
       (id, name, slug, description, image_id, icon, color, sort_order, published, show_on_home, show_in_nav, featured, is_demo, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 0, ?, ?)`,
      id,
      ...values,
      now,
    );
  }
  const storyIds = formData.getAll("story_ids").map(String);
  if (formData.get("sync_stories") === "on") {
    transaction(() => {
      execute("DELETE FROM story_categories WHERE category_id = ?", id);
      storyIds.forEach((storyId) => {
        const hasPrimary = queryOne(
          "SELECT story_id FROM story_categories WHERE story_id = ? AND is_primary = 1",
          storyId,
        );
        execute(
          "INSERT OR IGNORE INTO story_categories (story_id, category_id, is_primary) VALUES (?, ?, ?)",
          storyId,
          id,
          hasPrimary ? 0 : 1,
        );
      });
    });
  }
  logActivity(session.sub, existing ? "update" : "create", "category", id, name);
  refresh();
  redirect(`/admin/categories/${id}?saved=1`);
}

export async function deleteCategory(formData: FormData) {
  const session = await requireAdmin();
  const id = String(formData.get("id") || "");
  const category = queryOne<{ name: string }>("SELECT name FROM categories WHERE id = ?", id);
  if (!category) redirect("/admin/categories");
  execute("DELETE FROM categories WHERE id = ?", id);
  logActivity(session.sub, "delete", "category", id, category.name);
  refresh();
  redirect("/admin/categories");
}

export async function saveAuthor(formData: FormData) {
  const session = await requireAdmin();
  const id = String(formData.get("id") || "") || crypto.randomUUID();
  const existing = queryOne("SELECT id FROM authors WHERE id = ?", id);
  const name = clip(String(formData.get("name") || ""), 120);
  if (name.length < 2) return { error: "اكتب اسم المؤلف." };
  const slug = uniqueSlug("authors", slugify(clip(String(formData.get("slug") || name), 80)) || "مؤلف", existing ? id : undefined);
  const now = nowIso();
  const bio = emptyToNull(clip(String(formData.get("bio") || ""), 1200));
  const imageId = optionalId(formData.get("image_id"));
  const featured = formData.get("featured") === "on" ? 1 : 0;
  if (existing) {
    execute(
      "UPDATE authors SET name = ?, slug = ?, bio = ?, image_id = ?, featured = ?, updated_at = ? WHERE id = ?",
      name,
      slug,
      bio,
      imageId,
      featured,
      now,
      id,
    );
  } else {
    execute(
      "INSERT INTO authors (id, name, slug, bio, image_id, featured, is_demo, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, 0, ?, ?)",
      id,
      name,
      slug,
      bio,
      imageId,
      featured,
      now,
      now,
    );
  }
  logActivity(session.sub, existing ? "update" : "create", "author", id, name);
  refresh();
  redirect(`/admin/authors/${id}?saved=1`);
}

export async function deleteAuthor(formData: FormData) {
  const session = await requireAdmin();
  const id = String(formData.get("id") || "");
  const author = queryOne<{ name: string }>("SELECT name FROM authors WHERE id = ?", id);
  if (!author) redirect("/admin/authors");
  execute("UPDATE stories SET author_id = NULL WHERE author_id = ?", id);
  execute("DELETE FROM authors WHERE id = ?", id);
  logActivity(session.sub, "delete", "author", id, author.name);
  refresh();
  redirect("/admin/authors");
}

export async function saveHomepageSection(formData: FormData) {
  const session = await requireAdmin();
  const id = String(formData.get("id") || "");
  const section = queryOne<{ type: string; title: string }>("SELECT type, title FROM homepage_sections WHERE id = ?", id);
  if (!section) return { error: "القسم غير موجود." };
  const title = clip(String(formData.get("title") || ""), 120);
  if (title.length < 2) return { error: "اكتب عنوان القسم." };
  const layout = String(formData.get("layout") || "grid");
  if (!LAYOUT_IDS.has(layout)) return { error: "نمط العرض غير معتمد." };
  const accent = String(formData.get("accent") || "");
  if (accent && !isPaletteHex(accent)) return { error: "لون القسم غير معتمد." };
  const mode = formData.get("mode") === "manual" ? "manual" : "automatic";
  const config: SectionConfig = {
    kicker: clip(String(formData.get("kicker") || ""), 80),
    heroTitle: clip(String(formData.get("hero_title") || ""), 140),
    heroText: clip(String(formData.get("hero_text") || ""), 300),
    heroStoryId: optionalId(formData.get("hero_story_id")) ?? "",
    bannerTitle: clip(String(formData.get("banner_title") || ""), 120),
    bannerBody: clip(String(formData.get("banner_body") || ""), 400),
    announcementBody: clip(String(formData.get("announcement_body") || ""), 240),
    mediaId: optionalId(formData.get("media_id")) ?? "",
    linkType: (["story", "category", "explore"].includes(String(formData.get("link_type")))
      ? String(formData.get("link_type"))
      : "none") as SectionConfig["linkType"],
    linkId: optionalId(formData.get("link_id")) ?? "",
    categoryIds: formData.getAll("category_ids").map(String).slice(0, 40),
    authorIds: formData.getAll("author_ids").map(String).slice(0, 40),
  };
  const manualIds = String(formData.get("manual_ids") || "")
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
  const pinned = new Set(formData.getAll("pinned_ids").map(String));
  const excluded = new Set(formData.getAll("excluded_ids").map(String));
  const now = nowIso();
  transaction(() => {
    execute(
      `UPDATE homepage_sections
       SET title = ?, subtitle = ?, mode = ?, item_count = ?, layout = ?, accent = ?, category_id = ?,
           config_json = ?, visible_from = ?, visible_until = ?, updated_at = ?
       WHERE id = ?`,
      title,
      clip(String(formData.get("subtitle") || ""), 180),
      mode,
      clampNumber(formData.get("item_count"), 1, 24, 8),
      section.type === "story_carousel" ? "carousel" : layout,
      accent || null,
      optionalId(formData.get("category_id")),
      JSON.stringify(parseConfig(JSON.stringify(config))),
      fromLocalInput(String(formData.get("visible_from") || "")),
      fromLocalInput(String(formData.get("visible_until") || "")),
      now,
      id,
    );
    execute("DELETE FROM section_items WHERE section_id = ?", id);
    if (mode === "manual") {
      manualIds.forEach((storyId, index) => {
        execute(
          `INSERT INTO section_items (id, section_id, story_id, author_id, pinned, excluded, sort_order, starts_at, ends_at)
           VALUES (?, ?, ?, NULL, 0, 0, ?, ?, ?)`,
          crypto.randomUUID(),
          id,
          storyId,
          index,
          fromLocalInput(String(formData.get(`start_${storyId}`) || "")),
          fromLocalInput(String(formData.get(`end_${storyId}`) || "")),
        );
      });
    } else {
      [...pinned].forEach((storyId, index) => {
        if (excluded.has(storyId)) return;
        execute(
          `INSERT INTO section_items (id, section_id, story_id, author_id, pinned, excluded, sort_order, starts_at, ends_at)
           VALUES (?, ?, ?, NULL, 1, 0, ?, NULL, NULL)`,
          crypto.randomUUID(),
          id,
          storyId,
          index,
        );
      });
      [...excluded].forEach((storyId) => {
        execute(
          `INSERT INTO section_items (id, section_id, story_id, author_id, pinned, excluded, sort_order, starts_at, ends_at)
           VALUES (?, ?, ?, NULL, 0, 1, 0, NULL, NULL)`,
          crypto.randomUUID(),
          id,
          storyId,
        );
      });
    }
  });
  logActivity(session.sub, "update", "section", id, title);
  refresh();
  redirect(`/admin/homepage/${id}?saved=1`);
}

export async function createHomepageSection(formData: FormData) {
  const session = await requireAdmin();
  const type = String(formData.get("type") || "");
  if (!SECTION_TYPE_IDS.has(type)) return { error: "نوع القسم غير معتمد." };
  const count = queryOne<{ total: number }>("SELECT COUNT(*) AS total FROM homepage_sections");
  const id = crypto.randomUUID();
  const label = clip(String(formData.get("title") || "قسم جديد"), 120);
  const now = nowIso();
  execute(
    `INSERT INTO homepage_sections
     (id, type, title, subtitle, enabled, sort_order, mode, item_count, layout, accent, category_id, config_json, visible_from, visible_until, created_at, updated_at)
     VALUES (?, ?, ?, '', 1, ?, 'automatic', 8, ?, NULL, NULL, '{}', NULL, NULL, ?, ?)`,
    id,
    type,
    label,
    Number(count?.total ?? 0) + 1,
    type === "story_carousel" ? "carousel" : "grid",
    now,
    now,
  );
  logActivity(session.sub, "create", "section", id, label);
  refresh();
  redirect(`/admin/homepage/${id}`);
}

export async function moveSection(formData: FormData) {
  const session = await requireAdmin();
  const id = String(formData.get("id") || "");
  const direction = formData.get("dir") === "down" ? 1 : -1;
  const sections = queryAll<{ id: string; sort_order: number }>(
    "SELECT id, sort_order FROM homepage_sections ORDER BY sort_order ASC, title ASC",
  );
  const index = sections.findIndex((section) => section.id === id);
  const target = index + direction;
  if (index < 0 || target < 0 || target >= sections.length) return;
  const current = sections[index];
  const other = sections[target];
  execute("UPDATE homepage_sections SET sort_order = ? WHERE id = ?", other.sort_order, current.id);
  execute("UPDATE homepage_sections SET sort_order = ? WHERE id = ?", current.sort_order, other.id);
  logActivity(session.sub, "reorder", "section", id, direction === 1 ? "أسفل" : "أعلى");
  refresh();
}

export async function reorderSections(ids: string[]) {
  const session = await requireAdmin();
  const existing = queryAll<{ id: string }>("SELECT id FROM homepage_sections");
  if (ids.length !== existing.length || new Set(ids).size !== ids.length) return;
  const known = new Set(existing.map((item) => item.id));
  if (ids.some((id) => !known.has(id))) return;
  transaction(() => {
    ids.forEach((id, index) => {
      execute("UPDATE homepage_sections SET sort_order = ? WHERE id = ?", index + 1, id);
    });
  });
  logActivity(session.sub, "reorder", "section", "homepage", "ترتيب الأقسام");
  refresh();
}

export async function toggleSection(formData: FormData) {
  const session = await requireAdmin();
  const id = String(formData.get("id") || "");
  const section = queryOne<{ enabled: number; title: string }>(
    "SELECT enabled, title FROM homepage_sections WHERE id = ?",
    id,
  );
  if (!section) return;
  execute("UPDATE homepage_sections SET enabled = ?, updated_at = ? WHERE id = ?", section.enabled === 1 ? 0 : 1, nowIso(), id);
  logActivity(session.sub, "visibility", "section", id, section.title);
  refresh();
}

export async function deleteSection(formData: FormData) {
  const session = await requireAdmin();
  const id = String(formData.get("id") || "");
  const section = queryOne<{ title: string }>("SELECT title FROM homepage_sections WHERE id = ?", id);
  if (!section) redirect("/admin/homepage");
  execute("DELETE FROM homepage_sections WHERE id = ?", id);
  logActivity(session.sub, "delete", "section", id, section.title);
  refresh();
  redirect("/admin/homepage");
}

export async function saveSiteSettings(formData: FormData) {
  const session = await requireAdmin();
  const density = formData.get("density") === "compact" ? "compact" : "comfortable";
  const links = [0, 1, 2, 3]
    .map((index) => ({
      label: clip(String(formData.get(`social_label_${index}`) || ""), 40),
      url: clip(String(formData.get(`social_url_${index}`) || ""), 200),
    }))
    .filter((item) => item.label && /^https?:\/\//.test(item.url));
  saveSettings({
    site_name: clip(String(formData.get("site_name") || "يراع"), 40) || "يراع",
    site_description: clip(String(formData.get("site_description") || ""), 240),
    contact_email: clip(String(formData.get("contact_email") || ""), 120),
    contact_note: clip(String(formData.get("contact_note") || ""), 160),
    logo_id: optionalId(formData.get("logo_id")) ?? "",
    seo_title: clip(String(formData.get("seo_title") || ""), 120),
    seo_description: clip(String(formData.get("seo_description") || ""), 240),
    social_image_id: optionalId(formData.get("social_image_id")) ?? "",
    instagram: clip(String(formData.get("instagram") || ""), 200),
    social_links: JSON.stringify(links),
    default_item_count: String(clampNumber(formData.get("default_item_count"), 4, 24, 12)),
    density,
    view_weight: String(clampNumber(formData.get("view_weight"), 0, 20, 1)),
    favorite_weight: String(clampNumber(formData.get("favorite_weight"), 0, 20, 4)),
    priority_weight: String(clampNumber(formData.get("priority_weight"), 0, 20, 10)),
    rec_w_category: String(clampNumber(formData.get("rec_w_category"), 0, 20, 5)),
    rec_w_tag: String(clampNumber(formData.get("rec_w_tag"), 0, 20, 3)),
    rec_w_author: String(clampNumber(formData.get("rec_w_author"), 0, 20, 4)),
    rec_w_genre: String(clampNumber(formData.get("rec_w_genre"), 0, 20, 3)),
    rec_w_age: String(clampNumber(formData.get("rec_w_age"), 0, 20, 2)),
    rec_w_popularity: String(clampNumber(formData.get("rec_w_popularity"), 0, 20, 3)),
    rec_w_recency: String(clampNumber(formData.get("rec_w_recency"), 0, 20, 2)),
    rec_w_featured: String(clampNumber(formData.get("rec_w_featured"), 0, 20, 4)),
    rec_w_priority: String(clampNumber(formData.get("rec_w_priority"), 0, 20, 3)),
    recent_days: String(clampNumber(formData.get("recent_days"), 7, 180, 45)),
  });
  const nextPassword = String(formData.get("new_password") || "");
  const currentPassword = String(formData.get("current_password") || "");
  if (nextPassword || currentPassword) {
    if (nextPassword.length < 8) return { error: "كلمة المرور الجديدة أقصر من ٨ أحرف." };
    const admin = queryOne<{ email: string }>("SELECT email FROM users WHERE id = ?", session.sub);
    const verified = admin?.email ? await verifyAdminPassword(admin.email, currentPassword) : null;
    if (!verified) return { error: "كلمة المرور الحالية غير صحيحة." };
    execute("UPDATE users SET password_hash = ? WHERE id = ?", hashPassword(nextPassword), session.sub);
  }
  const nextName = clip(String(formData.get("admin_name") || ""), 80);
  if (nextName.length >= 2) execute("UPDATE users SET name = ? WHERE id = ?", nextName, session.sub);
  logActivity(session.sub, "update", "settings", "site", "تحديث الإعدادات");
  refresh();
  redirect("/admin/settings?saved=1");
}

function syncCategories(storyId: string, formData: FormData) {
  const primary = optionalId(formData.get("primary_category_id"));
  const ids = new Set(formData.getAll("category_ids").map(String).filter(Boolean));
  if (primary) ids.add(primary);
  execute("DELETE FROM story_categories WHERE story_id = ?", storyId);
  ids.forEach((categoryId) => {
    execute(
      "INSERT INTO story_categories (story_id, category_id, is_primary) VALUES (?, ?, ?)",
      storyId,
      categoryId,
      categoryId === primary ? 1 : 0,
    );
  });
}

function syncTags(storyId: string, raw: string) {
  execute("DELETE FROM story_tags WHERE story_id = ?", storyId);
  splitTags(raw).forEach((tag) => {
    const slug = slugify(tag) || tag;
    let row = queryOne<{ id: string }>("SELECT id FROM tags WHERE name = ?", tag);
    if (!row) {
      const id = crypto.randomUUID();
      execute("INSERT INTO tags (id, name, slug) VALUES (?, ?, ?)", id, tag, uniqueTagSlug(slug));
      row = { id };
    }
    execute("INSERT OR IGNORE INTO story_tags (story_id, tag_id) VALUES (?, ?)", storyId, row.id);
  });
  execute("DELETE FROM tags WHERE id NOT IN (SELECT tag_id FROM story_tags)");
}

function uniqueTagSlug(base: string) {
  let slug = base || "وسم";
  let count = 2;
  while (queryOne("SELECT id FROM tags WHERE slug = ?", slug)) slug = `${base}-${count++}`;
  return slug;
}

function syncRelated(storyId: string, ids: string[]) {
  execute("DELETE FROM story_related WHERE story_id = ?", storyId);
  ids.filter((id) => id && id !== storyId).forEach((relatedId) => {
    const exists = queryOne("SELECT id FROM stories WHERE id = ?", relatedId);
    if (!exists) return;
    execute("INSERT OR IGNORE INTO story_related (story_id, related_id) VALUES (?, ?)", storyId, relatedId);
  });
}

function syncImages(storyId: string, raw: string) {
  execute("DELETE FROM story_images WHERE story_id = ?", storyId);
  raw
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean)
    .forEach((mediaId, index) => {
      const media = queryOne("SELECT id FROM media WHERE id = ?", mediaId);
      if (!media) return;
      execute(
        "INSERT OR IGNORE INTO story_images (story_id, media_id, sort_order) VALUES (?, ?, ?)",
        storyId,
        mediaId,
        index,
      );
    });
}

function optionalId(value: FormDataEntryValue | null) {
  const text = String(value || "").trim();
  return text ? text : null;
}

function emptyToNull(value: string) {
  return value.trim() ? value.trim() : null;
}

function numberOrNull(value: FormDataEntryValue | null) {
  const text = String(value ?? "").trim();
  if (!text) return null;
  const number = Number(text);
  if (!Number.isFinite(number)) return null;
  return Math.round(number);
}

function clampNumber(value: FormDataEntryValue | null, min: number, max: number, fallback: number) {
  const number = numberOrNull(value);
  if (number == null) return fallback;
  return Math.min(max, Math.max(min, number));
}
