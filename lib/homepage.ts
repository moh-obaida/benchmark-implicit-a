import { isPaletteHex, STORY_SECTION_TYPES } from "@/lib/constants";
import { queryAll, queryOne } from "@/lib/db";
import { nowIso } from "@/lib/format";
import { recommendStories } from "@/lib/recommendations";
import { getSettings } from "@/lib/settings";
import {
  getCardsByIds,
  listCategories,
  mapCard,
  publishedClause,
  type StoryCard,
} from "@/lib/stories";

export type SectionConfig = {
  kicker?: string;
  heroTitle?: string;
  heroText?: string;
  heroStoryId?: string;
  bannerTitle?: string;
  bannerBody?: string;
  announcementBody?: string;
  mediaId?: string;
  linkType?: "none" | "story" | "category" | "explore";
  linkId?: string;
  categoryIds?: string[];
  authorIds?: string[];
};

export type HomeSectionRecord = {
  id: string;
  type: string;
  title: string;
  subtitle: string;
  enabled: boolean;
  sortOrder: number;
  mode: "automatic" | "manual";
  itemCount: number;
  layout: "grid" | "carousel" | "spotlight";
  accent: string | null;
  categoryId: string | null;
  config: SectionConfig;
  visibleFrom: string | null;
  visibleUntil: string | null;
};

export type AuthorCard = {
  id: string;
  name: string;
  slug: string;
  bio: string;
  imageId: string | null;
  storyCount: number;
};

export type CategoryCard = {
  id: string;
  name: string;
  slug: string;
  description: string;
  icon: string;
  color: string;
  imageId: string | null;
  storyCount: number;
};

export type ResolvedSection =
  | {
      kind: "hero";
      id: string;
      kicker: string;
      title: string;
      text: string;
      story: StoryCard | null;
    }
  | { kind: "categories"; id: string; title: string; subtitle: string; accent: string | null; categories: CategoryCard[] }
  | { kind: "stories"; id: string; title: string; subtitle: string; accent: string | null; layout: HomeSectionRecord["layout"]; stories: StoryCard[] }
  | { kind: "banner"; id: string; title: string; body: string; accent: string | null; mediaId: string | null; href: string | null }
  | { kind: "announcement"; id: string; title: string; body: string; accent: string | null }
  | { kind: "authors"; id: string; title: string; subtitle: string; accent: string | null; authors: AuthorCard[] };

export function parseConfig(value: string | null): SectionConfig {
  if (!value) return {};
  try {
    const raw = JSON.parse(value) as SectionConfig;
    const linkType = raw.linkType === "story" || raw.linkType === "category" || raw.linkType === "explore" ? raw.linkType : "none";
    return {
      kicker: clean(raw.kicker, 80),
      heroTitle: clean(raw.heroTitle, 140),
      heroText: clean(raw.heroText, 300),
      heroStoryId: clean(raw.heroStoryId, 80),
      bannerTitle: clean(raw.bannerTitle, 120),
      bannerBody: clean(raw.bannerBody, 400),
      announcementBody: clean(raw.announcementBody, 240),
      mediaId: clean(raw.mediaId, 80),
      linkType,
      linkId: clean(raw.linkId, 80),
      categoryIds: arrayOf(raw.categoryIds),
      authorIds: arrayOf(raw.authorIds),
    };
  } catch {
    return {};
  }
}

function clean(value: unknown, max: number) {
  return typeof value === "string" ? value.trim().slice(0, max) : "";
}

function arrayOf(value: unknown) {
  if (!Array.isArray(value)) return [];
  return value.filter((item): item is string => typeof item === "string").slice(0, 40);
}

function mapSection(row: {
  id: string;
  type: string;
  title: string;
  subtitle: string | null;
  enabled: number;
  sort_order: number;
  mode: string;
  item_count: number;
  layout: string;
  accent: string | null;
  category_id: string | null;
  config_json: string;
  visible_from: string | null;
  visible_until: string | null;
}): HomeSectionRecord {
  const layout = row.layout === "carousel" || row.layout === "spotlight" ? row.layout : "grid";
  return {
    id: row.id,
    type: row.type,
    title: row.title,
    subtitle: row.subtitle ?? "",
    enabled: row.enabled === 1,
    sortOrder: row.sort_order,
    mode: row.mode === "manual" ? "manual" : "automatic",
    itemCount: Math.min(24, Math.max(1, row.item_count || 8)),
    layout: row.type === "story_carousel" ? "carousel" : layout,
    accent: row.accent && isPaletteHex(row.accent) ? row.accent : null,
    categoryId: row.category_id,
    config: parseConfig(row.config_json),
    visibleFrom: row.visible_from,
    visibleUntil: row.visible_until,
  };
}

export function listHomeSections(includeHidden = false) {
  const rows = queryAll<{
    id: string;
    type: string;
    title: string;
    subtitle: string | null;
    enabled: number;
    sort_order: number;
    mode: string;
    item_count: number;
    layout: string;
    accent: string | null;
    category_id: string | null;
    config_json: string;
    visible_from: string | null;
    visible_until: string | null;
  }>("SELECT * FROM homepage_sections ORDER BY sort_order ASC, title ASC");
  return rows.map(mapSection).filter((section) => includeHidden || sectionIsLive(section));
}

export function getHomeSection(id: string) {
  const row = queryOne<{
    id: string;
    type: string;
    title: string;
    subtitle: string | null;
    enabled: number;
    sort_order: number;
    mode: string;
    item_count: number;
    layout: string;
    accent: string | null;
    category_id: string | null;
    config_json: string;
    visible_from: string | null;
    visible_until: string | null;
  }>("SELECT * FROM homepage_sections WHERE id = ?", id);
  return row ? mapSection(row) : null;
}

function sectionIsLive(section: HomeSectionRecord, now = nowIso()) {
  if (!section.enabled) return false;
  if (section.visibleFrom && section.visibleFrom > now) return false;
  if (section.visibleUntil && section.visibleUntil < now) return false;
  return true;
}

function activeItems(sectionId: string) {
  const now = nowIso();
  return queryAll<{ story_id: string | null; author_id: string | null; pinned: number; excluded: number; sort_order: number }>(
    `SELECT story_id, author_id, pinned, excluded, sort_order
     FROM section_items
     WHERE section_id = ?
       AND (starts_at IS NULL OR starts_at <= ?)
       AND (ends_at IS NULL OR ends_at >= ?)
     ORDER BY sort_order ASC`,
    sectionId,
    now,
    now,
  );
}

export function resolveHomepage(input: { userId?: string | null; seenIds?: string[] }) {
  return listHomeSections(false).map((section) => resolveSection(section, input));
}

export function resolveSection(
  section: HomeSectionRecord,
  input: { userId?: string | null; seenIds?: string[] },
): ResolvedSection {
  if (section.type === "hero") {
    const configured = section.config.heroStoryId ? getCardsByIds([section.config.heroStoryId])[0] : null;
    const fallback = configured ?? recommendStories({ limit: 1, userId: input.userId, seenIds: input.seenIds })[0] ?? null;
    return {
      kind: "hero",
      id: section.id,
      kicker: section.config.kicker || "منصة اكتشاف القصص",
      title: section.config.heroTitle || section.title || "يراع",
      text: section.config.heroText || section.subtitle,
      story: fallback,
    };
  }
  if (section.type === "categories") {
    return {
      kind: "categories",
      id: section.id,
      title: section.title,
      subtitle: section.subtitle,
      accent: section.accent,
      categories: resolveCategories(section),
    };
  }
  if (section.type === "banner") {
    return {
      kind: "banner",
      id: section.id,
      title: section.config.bannerTitle || section.title,
      body: section.config.bannerBody || section.subtitle,
      accent: section.accent,
      mediaId: section.config.mediaId || null,
      href: bannerHref(section.config),
    };
  }
  if (section.type === "announcement") {
    return {
      kind: "announcement",
      id: section.id,
      title: section.title,
      body: section.config.announcementBody || section.subtitle,
      accent: section.accent ?? "#EEDCEE",
    };
  }
  if (section.type === "authors") {
    return {
      kind: "authors",
      id: section.id,
      title: section.title,
      subtitle: section.subtitle,
      accent: section.accent,
      authors: resolveAuthors(section),
    };
  }
  return {
    kind: "stories",
    id: section.id,
    title: section.title,
    subtitle: section.subtitle,
    accent: section.accent,
    layout: section.layout,
    stories: resolveStories(section, input),
  };
}

function resolveCategories(section: HomeSectionRecord): CategoryCard[] {
  if (section.mode === "manual" && section.config.categoryIds?.length) {
    const allowed = new Set(section.config.categoryIds);
    const all = listCategories().filter((category) => allowed.has(category.id));
    const order = new Map(section.config.categoryIds.map((id, index) => [id, index]));
    return all
      .sort((a, b) => (order.get(a.id) ?? 0) - (order.get(b.id) ?? 0))
      .slice(0, section.itemCount)
      .map(mapCategory);
  }
  return listCategories({ home: true }).slice(0, section.itemCount).map(mapCategory);
}

function mapCategory(category: {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  icon: string;
  color: string;
  image_id: string | null;
  story_count: number;
}): CategoryCard {
  return {
    id: category.id,
    name: category.name,
    slug: category.slug,
    description: category.description ?? "",
    icon: category.icon,
    color: isPaletteHex(category.color) ? category.color : "#EEDCEE",
    imageId: category.image_id,
    storyCount: Number(category.story_count ?? 0),
  };
}

function resolveAuthors(section: HomeSectionRecord): AuthorCard[] {
  const now = nowIso();
  if (section.mode === "manual" && section.config.authorIds?.length) {
    const ids = section.config.authorIds.slice(0, section.itemCount);
    const marks = ids.map(() => "?").join(", ");
    const rows = queryAll<{ id: string; name: string; slug: string; bio: string | null; image_id: string | null; story_count: number }>(
      `SELECT a.id, a.name, a.slug, a.bio, a.image_id,
              (SELECT COUNT(*) FROM stories s WHERE s.author_id = a.id AND ${publishedClause("s")}) AS story_count
       FROM authors a WHERE a.id IN (${marks})`,
      now,
      ...ids,
    );
    const byId = new Map(rows.map((row) => [row.id, row]));
    return ids
      .map((id) => byId.get(id))
      .filter((row): row is NonNullable<typeof row> => Boolean(row))
      .map(mapAuthor);
  }
  const rows = queryAll<{ id: string; name: string; slug: string; bio: string | null; image_id: string | null; story_count: number }>(
    `SELECT a.id, a.name, a.slug, a.bio, a.image_id,
            (SELECT COUNT(*) FROM stories s WHERE s.author_id = a.id AND ${publishedClause("s")}) AS story_count
     FROM authors a
     WHERE (? = 0 OR a.featured = 1)
     ORDER BY a.featured DESC, a.name ASC
     LIMIT ?`,
    now,
    0,
    section.itemCount,
  );
  const featured = rows.filter((row) => row.story_count >= 0);
  if (featured.length) {
    const onlyFeatured = queryAll<{ id: string; name: string; slug: string; bio: string | null; image_id: string | null; story_count: number }>(
      `SELECT a.id, a.name, a.slug, a.bio, a.image_id,
              (SELECT COUNT(*) FROM stories s WHERE s.author_id = a.id AND ${publishedClause("s")}) AS story_count
       FROM authors a
       WHERE a.featured = 1
       ORDER BY a.name ASC
       LIMIT ?`,
      now,
      section.itemCount,
    );
    if (onlyFeatured.length) return onlyFeatured.map(mapAuthor);
  }
  return featured.map(mapAuthor);
}

function mapAuthor(row: { id: string; name: string; slug: string; bio: string | null; image_id: string | null; story_count: number }): AuthorCard {
  return {
    id: row.id,
    name: row.name,
    slug: row.slug,
    bio: row.bio ?? "",
    imageId: row.image_id,
    storyCount: Number(row.story_count ?? 0),
  };
}

function resolveStories(
  section: HomeSectionRecord,
  input: { userId?: string | null; seenIds?: string[] },
): StoryCard[] {
  const items = activeItems(section.id);
  const excluded = new Set(items.filter((item) => item.excluded === 1 && item.story_id).map((item) => item.story_id as string));
  const pinned = items.filter((item) => item.pinned === 1 && item.story_id && !excluded.has(item.story_id)).map((item) => item.story_id as string);
  if (section.mode === "manual") {
    const manual = items.filter((item) => item.story_id && item.excluded !== 1).map((item) => item.story_id as string);
    return getCardsByIds(manual).slice(0, section.itemCount);
  }
  const pinnedCards = getCardsByIds(pinned);
  const settings = getSettings();
  const automatic = automaticStories(section, input, [...excluded, ...pinned], Math.max(0, section.itemCount - pinnedCards.length), settings.recentDays);
  const merged = [...pinnedCards, ...automatic];
  const seen = new Set<string>();
  return merged.filter((story) => {
    if (seen.has(story.id)) return false;
    seen.add(story.id);
    return true;
  }).slice(0, section.itemCount);
}

function automaticStories(
  section: HomeSectionRecord,
  input: { userId?: string | null; seenIds?: string[] },
  excludeIds: string[],
  limit: number,
  recentDays: number,
) {
  if (limit <= 0) return [];
  if (section.type === "recommended" || section.type === "story_grid" || section.type === "collection" || section.type === "story_carousel" || section.type === "featured_story") {
    if (section.type === "featured_story") {
      return recommendStories({
        limit: 1,
        excludeIds,
        categoryId: section.categoryId,
        userId: input.userId,
        seenIds: input.seenIds,
      }).filter((story) => story.featured).slice(0, 1).concat(
        recommendStories({ limit: 1, excludeIds, categoryId: section.categoryId }).filter((story) => !excludeIds.includes(story.id)).slice(0, 1),
      ).slice(0, 1);
    }
    if (section.type !== "recommended") {
      return rankedStories(section, excludeIds, limit, "newest");
    }
    return recommendStories({
      userId: input.userId,
      seenIds: input.seenIds,
      limit,
      excludeIds,
      categoryId: section.categoryId,
    });
  }
  if (section.type === "popular") return rankedStories(section, excludeIds, limit, "popular");
  if (section.type === "recent") return rankedStories(section, excludeIds, limit, "recent", recentDays);
  if (section.type === "picks") return rankedStories(section, excludeIds, limit, "picks");
  if (section.type === "featured") return rankedStories(section, excludeIds, limit, "featured");
  if (STORY_SECTION_TYPES.has(section.type)) return rankedStories(section, excludeIds, limit, "newest");
  return [];
}

function rankedStories(
  section: HomeSectionRecord,
  excludeIds: string[],
  limit: number,
  mode: "popular" | "recent" | "picks" | "featured" | "newest",
  recentDays = 45,
) {
  const settings = getSettings();
  const now = nowIso();
  const where = [publishedClause("s")];
  const params: unknown[] = [now];
  if (section.categoryId) {
    where.push("EXISTS (SELECT 1 FROM story_categories sc WHERE sc.story_id = s.id AND sc.category_id = ?)");
    params.push(section.categoryId);
  }
  if (mode === "picks") where.push("s.editor_pick = 1");
  if (mode === "featured") where.push("s.featured = 1");
  if (mode === "recent") {
    const since = new Date(Date.now() - recentDays * 86400000).toISOString();
    where.push("COALESCE(s.publish_at, s.created_at) >= ?");
    params.push(since);
  }
  if (excludeIds.length) {
    where.push(`s.id NOT IN (${excludeIds.map(() => "?").join(", ")})`);
    params.push(...excludeIds);
  }
  let order = "COALESCE(s.publish_at, s.created_at) DESC";
  if (mode === "popular") {
    order = `(s.view_count * ? + s.favorite_count * ? + s.priority * ?) DESC, COALESCE(s.publish_at, s.created_at) DESC`;
    params.push(settings.viewWeight, settings.favoriteWeight, settings.priorityWeight);
  } else if (mode === "picks" || mode === "featured") {
    order = "s.priority DESC, COALESCE(s.publish_at, s.created_at) DESC";
  }
  const rows = queryAll<Parameters<typeof mapCard>[0]>(
    `SELECT s.id, s.slug, s.title, s.short_description, s.cover_id, s.author_id,
            a.name AS author_name, a.slug AS author_slug,
            (
              SELECT c.name FROM story_categories sc JOIN categories c ON c.id = sc.category_id
              WHERE sc.story_id = s.id AND c.published = 1
              ORDER BY sc.is_primary DESC, c.sort_order ASC LIMIT 1
            ) AS category_name,
            (
              SELECT c.slug FROM story_categories sc JOIN categories c ON c.id = sc.category_id
              WHERE sc.story_id = s.id AND c.published = 1
              ORDER BY sc.is_primary DESC, c.sort_order ASC LIMIT 1
            ) AS category_slug,
            (
              SELECT c.color FROM story_categories sc JOIN categories c ON c.id = sc.category_id
              WHERE sc.story_id = s.id AND c.published = 1
              ORDER BY sc.is_primary DESC, c.sort_order ASC LIMIT 1
            ) AS category_color,
            s.reading_minutes, s.age_min, s.age_max, s.story_type, s.genre,
            s.featured, s.editor_pick, s.priority, s.view_count, s.favorite_count,
            s.publish_at, s.created_at, s.display_order
     FROM stories s
     LEFT JOIN authors a ON a.id = s.author_id
     WHERE ${where.join(" AND ")}
     ORDER BY ${order}
     LIMIT ?`,
    ...params,
    limit,
  );
  const stories = rows.map(mapCard);
  if (mode === "recent" && stories.length < limit) {
    return rankedStories({ ...section }, excludeIds, limit, "newest");
  }
  return stories;
}

function bannerHref(config: SectionConfig) {
  if (config.linkType === "explore") return "/explore";
  if (config.linkType === "story" && config.linkId) {
    const story = queryOne<{ slug: string }>(
      `SELECT slug FROM stories WHERE id = ? AND ${publishedClause("stories")}`,
      config.linkId,
      nowIso(),
    );
    return story ? `/stories/${story.slug}` : null;
  }
  if (config.linkType === "category" && config.linkId) {
    const category = queryOne<{ slug: string }>(
      "SELECT slug FROM categories WHERE id = ? AND published = 1",
      config.linkId,
    );
    return category ? `/categories/${category.slug}` : null;
  }
  return null;
}
