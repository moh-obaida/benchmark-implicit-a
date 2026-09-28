import { AGE_BUCKETS } from "@/lib/constants";
import { execute, queryAll, queryOne } from "@/lib/db";
import { likeTerm, nowIso } from "@/lib/format";
import { getSettings } from "@/lib/settings";

export type StoryCard = {
  id: string;
  slug: string;
  title: string;
  shortDescription: string;
  coverId: string | null;
  authorId: string | null;
  authorName: string | null;
  authorSlug: string | null;
  categoryName: string | null;
  categorySlug: string | null;
  categoryColor: string | null;
  readingMinutes: number | null;
  ageMin: number | null;
  ageMax: number | null;
  storyType: string | null;
  genre: string | null;
  featured: boolean;
  editorPick: boolean;
  priority: number;
  viewCount: number;
  favoriteCount: number;
  publishAt: string | null;
  createdAt: string;
  displayOrder: number;
};

export type PublicStory = StoryCard & {
  fullDescription: string;
  narrator: string | null;
  seriesName: string | null;
  episodeNumber: number | null;
  externalSource: string | null;
  audioUrl: string | null;
  videoUrl: string | null;
  authorBio: string | null;
  authorImageId: string | null;
  categories: { name: string; slug: string; color: string }[];
  tags: { name: string; slug: string }[];
  images: { id: string; alt: string | null }[];
};

type StoryRow = {
  id: string;
  slug: string;
  title: string;
  short_description: string | null;
  cover_id: string | null;
  author_id: string | null;
  author_name: string | null;
  author_slug: string | null;
  category_name: string | null;
  category_slug: string | null;
  category_color: string | null;
  reading_minutes: number | null;
  age_min: number | null;
  age_max: number | null;
  story_type: string | null;
  genre: string | null;
  featured: number;
  editor_pick: number;
  priority: number;
  view_count: number;
  favorite_count: number;
  publish_at: string | null;
  created_at: string;
  display_order: number;
};

const CARD_SELECT = `
  s.id, s.slug, s.title, s.short_description, s.cover_id, s.author_id,
  a.name AS author_name, a.slug AS author_slug,
  (
    SELECT c.name FROM story_categories sc
    JOIN categories c ON c.id = sc.category_id
    WHERE sc.story_id = s.id AND c.published = 1
    ORDER BY sc.is_primary DESC, c.sort_order ASC LIMIT 1
  ) AS category_name,
  (
    SELECT c.slug FROM story_categories sc
    JOIN categories c ON c.id = sc.category_id
    WHERE sc.story_id = s.id AND c.published = 1
    ORDER BY sc.is_primary DESC, c.sort_order ASC LIMIT 1
  ) AS category_slug,
  (
    SELECT c.color FROM story_categories sc
    JOIN categories c ON c.id = sc.category_id
    WHERE sc.story_id = s.id AND c.published = 1
    ORDER BY sc.is_primary DESC, c.sort_order ASC LIMIT 1
  ) AS category_color,
  s.reading_minutes, s.age_min, s.age_max, s.story_type, s.genre,
  s.featured, s.editor_pick, s.priority, s.view_count, s.favorite_count,
  s.publish_at, s.created_at, s.display_order
`;

export function mapCard(row: StoryRow): StoryCard {
  return {
    id: row.id,
    slug: row.slug,
    title: row.title,
    shortDescription: row.short_description ?? "",
    coverId: row.cover_id,
    authorId: row.author_id,
    authorName: row.author_name,
    authorSlug: row.author_slug,
    categoryName: row.category_name,
    categorySlug: row.category_slug,
    categoryColor: row.category_color,
    readingMinutes: row.reading_minutes,
    ageMin: row.age_min,
    ageMax: row.age_max,
    storyType: row.story_type,
    genre: row.genre,
    featured: row.featured === 1,
    editorPick: row.editor_pick === 1,
    priority: row.priority,
    viewCount: row.view_count,
    favoriteCount: row.favorite_count,
    publishAt: row.publish_at,
    createdAt: row.created_at,
    displayOrder: row.display_order,
  };
}

export function publishedClause(alias = "s") {
  return `${alias}.published = 1 AND (${alias}.publish_at IS NULL OR ${alias}.publish_at <= ?)`;
}

export function getCardsByIds(ids: string[]) {
  if (!ids.length) return [];
  const now = nowIso();
  const marks = ids.map(() => "?").join(", ");
  const rows = queryAll<StoryRow>(
    `SELECT ${CARD_SELECT}
     FROM stories s
     LEFT JOIN authors a ON a.id = s.author_id
     WHERE s.id IN (${marks}) AND ${publishedClause("s")}`,
    ...ids,
    now,
  );
  const byId = new Map(rows.map((row) => [row.id, mapCard(row)]));
  return ids.map((id) => byId.get(id)).filter((story): story is StoryCard => Boolean(story));
}

export type StoryQuery = {
  q?: string;
  category?: string;
  genre?: string;
  age?: string;
  type?: string;
  author?: string;
  tag?: string;
  sort?: string;
  page?: number;
  pageSize?: number;
};

export function queryStories(input: StoryQuery) {
  const settings = getSettings();
  const pageSize = input.pageSize ?? settings.defaultItemCount;
  const page = Math.max(1, input.page ?? 1);
  const where = [publishedClause("s")];
  const params: unknown[] = [nowIso()];
  const q = input.q?.trim() ?? "";

  if (q) {
    const like = likeTerm(q);
    where.push(
      `(s.title LIKE ? OR a.name LIKE ? OR IFNULL(s.genre, '') LIKE ? OR IFNULL(s.story_type, '') LIKE ?
        OR EXISTS (
          SELECT 1 FROM story_categories sc
          JOIN categories c ON c.id = sc.category_id
          WHERE sc.story_id = s.id AND c.published = 1 AND c.name LIKE ?
        )
        OR EXISTS (
          SELECT 1 FROM story_tags st
          JOIN tags t ON t.id = st.tag_id
          WHERE st.story_id = s.id AND t.name LIKE ?
        ))`,
    );
    params.push(like, like, like, like, like, like);
  }
  if (input.category) {
    where.push(
      `EXISTS (
        SELECT 1 FROM story_categories sc
        JOIN categories c ON c.id = sc.category_id
        WHERE sc.story_id = s.id AND c.published = 1 AND c.slug = ?
      )`,
    );
    params.push(input.category);
  }
  if (input.genre) {
    where.push("s.genre = ?");
    params.push(input.genre);
  }
  if (input.type) {
    where.push("s.story_type = ?");
    params.push(input.type);
  }
  if (input.author) {
    where.push("a.slug = ?");
    params.push(input.author);
  }
  if (input.tag) {
    where.push(
      `EXISTS (
        SELECT 1 FROM story_tags st
        JOIN tags t ON t.id = st.tag_id
        WHERE st.story_id = s.id AND (t.slug = ? OR t.name = ?)
      )`,
    );
    params.push(input.tag, input.tag);
  }
  const bucket = AGE_BUCKETS.find((item) => item.id === input.age);
  if (bucket) {
    where.push("s.age_min IS NOT NULL AND s.age_max IS NOT NULL AND s.age_min <= ? AND s.age_max >= ?");
    params.push(bucket.max, bucket.min);
  }

  const sort = input.sort ?? "newest";
  let order = "COALESCE(s.publish_at, s.created_at) DESC, s.display_order ASC, s.title ASC";
  const orderParams: unknown[] = [];
  if (sort === "popular") {
    order = "(s.view_count * ? + s.favorite_count * ? + s.priority * ?) DESC, s.display_order ASC, s.title ASC";
    orderParams.push(settings.viewWeight, settings.favoriteWeight, settings.priorityWeight);
  } else if (sort === "views") {
    order = "s.view_count DESC, s.priority DESC, s.title ASC";
  } else if (sort === "picks") {
    order = "s.editor_pick DESC, s.featured DESC, s.priority DESC, COALESCE(s.publish_at, s.created_at) DESC";
  }

  const whereSql = where.join(" AND ");
  const totalRow = queryOne<{ total: number }>(
    `SELECT COUNT(DISTINCT s.id) AS total
     FROM stories s
     LEFT JOIN authors a ON a.id = s.author_id
     WHERE ${whereSql}`,
    ...params,
  );
  const total = Number(totalRow?.total ?? 0);
  const rows = queryAll<StoryRow>(
    `SELECT ${CARD_SELECT}
     FROM stories s
     LEFT JOIN authors a ON a.id = s.author_id
     WHERE ${whereSql}
     ORDER BY ${order}
     LIMIT ? OFFSET ?`,
    ...params,
    ...orderParams,
    pageSize,
    (page - 1) * pageSize,
  );

  return {
    items: rows.map(mapCard),
    total,
    page,
    pages: Math.max(1, Math.ceil(total / pageSize)),
    pageSize,
  };
}

export function getFilterOptions() {
  const now = nowIso();
  const categories = queryAll<{ slug: string; name: string }>(
    `SELECT slug, name FROM categories
     WHERE published = 1
     ORDER BY featured DESC, sort_order ASC, name ASC`,
  );
  const genres = queryAll<{ genre: string }>(
    `SELECT DISTINCT genre AS genre FROM stories
     WHERE genre IS NOT NULL AND genre != '' AND ${publishedClause("stories")}`,
    now,
  )
    .map((row) => row.genre)
    .sort((a, b) => a.localeCompare(b, "ar"));
  const types = queryAll<{ story_type: string }>(
    `SELECT DISTINCT story_type AS story_type FROM stories
     WHERE story_type IS NOT NULL AND story_type != '' AND ${publishedClause("stories")}`,
    now,
  )
    .map((row) => row.story_type)
    .sort((a, b) => a.localeCompare(b, "ar"));
  const authors = queryAll<{ slug: string; name: string }>(
    `SELECT DISTINCT a.slug, a.name
     FROM authors a
     JOIN stories s ON s.author_id = a.id
     WHERE ${publishedClause("s")}
     ORDER BY a.name ASC`,
    now,
  );
  return { categories, genres, types, authors };
}

export function getPublicStory(slug: string, allowDraft = false): PublicStory | null {
  const now = nowIso();
  const row = queryOne<
    StoryRow & {
      full_description: string | null;
      narrator: string | null;
      series_name: string | null;
      episode_number: number | null;
      external_source: string | null;
      audio_url: string | null;
      video_url: string | null;
      author_bio: string | null;
      author_image_id: string | null;
      published: number;
    }
  >(
    `SELECT ${CARD_SELECT}, s.full_description, s.narrator, s.series_name, s.episode_number,
            s.external_source, s.audio_url, s.video_url, s.published,
            a.bio AS author_bio, a.image_id AS author_image_id
     FROM stories s
     LEFT JOIN authors a ON a.id = s.author_id
     WHERE s.slug = ?`,
    slug,
  );
  if (!row) return null;
  const live = row.published === 1 && (!row.publish_at || row.publish_at <= now);
  if (!live && !allowDraft) return null;
  const categories = queryAll<{ name: string; slug: string; color: string }>(
    `SELECT c.name, c.slug, c.color
     FROM story_categories sc
     JOIN categories c ON c.id = sc.category_id
     WHERE sc.story_id = ? AND c.published = 1
     ORDER BY sc.is_primary DESC, c.sort_order ASC`,
    row.id,
  );
  const tags = queryAll<{ name: string; slug: string }>(
    `SELECT t.name, t.slug
     FROM story_tags st JOIN tags t ON t.id = st.tag_id
     WHERE st.story_id = ?
     ORDER BY t.name ASC`,
    row.id,
  );
  const images = queryAll<{ id: string; alt: string | null }>(
    `SELECT m.id, m.alt
     FROM story_images si JOIN media m ON m.id = si.media_id
     WHERE si.story_id = ?
     ORDER BY si.sort_order ASC`,
    row.id,
  );
  return {
    ...mapCard(row),
    fullDescription: row.full_description ?? "",
    narrator: row.narrator,
    seriesName: row.series_name,
    episodeNumber: row.episode_number,
    externalSource: row.external_source,
    audioUrl: row.audio_url,
    videoUrl: row.video_url,
    authorBio: row.author_bio,
    authorImageId: row.author_image_id,
    categories,
    tags,
    images,
  };
}

export function getRelatedStories(storyId: string, limit = 4) {
  const now = nowIso();
  const rows = queryAll<StoryRow>(
    `SELECT ${CARD_SELECT}
     FROM story_related r
     JOIN stories s ON s.id = r.related_id
     LEFT JOIN authors a ON a.id = s.author_id
     WHERE r.story_id = ? AND ${publishedClause("s")}
     LIMIT ?`,
    storyId,
    now,
    limit,
  );
  return rows.map(mapCard);
}

export function getAuthorStories(authorId: string, excludeId?: string, limit = 4) {
  const now = nowIso();
  const rows = queryAll<StoryRow>(
    `SELECT ${CARD_SELECT}
     FROM stories s
     LEFT JOIN authors a ON a.id = s.author_id
     WHERE s.author_id = ? AND ${publishedClause("s")} AND (? IS NULL OR s.id != ?)
     ORDER BY COALESCE(s.publish_at, s.created_at) DESC
     LIMIT ?`,
    authorId,
    now,
    excludeId ?? null,
    excludeId ?? null,
    limit,
  );
  return rows.map(mapCard);
}

export function suggestStories(q: string) {
  const term = q.trim();
  if (term.length < 1) return [];
  const like = likeTerm(term);
  const now = nowIso();
  return queryAll<{ title: string; slug: string; author_name: string | null }>(
    `SELECT s.title, s.slug, a.name AS author_name
     FROM stories s
     LEFT JOIN authors a ON a.id = s.author_id
     WHERE ${publishedClause("s")}
       AND (
         s.title LIKE ? OR a.name LIKE ? OR IFNULL(s.genre, '') LIKE ?
         OR EXISTS (
           SELECT 1 FROM story_categories sc
           JOIN categories c ON c.id = sc.category_id
           WHERE sc.story_id = s.id AND c.published = 1 AND c.name LIKE ?
         )
         OR EXISTS (
           SELECT 1 FROM story_tags st
           JOIN tags t ON t.id = st.tag_id
           WHERE st.story_id = s.id AND t.name LIKE ?
         )
       )
     ORDER BY CASE WHEN s.title LIKE ? THEN 0 ELSE 1 END, s.title ASC
     LIMIT 6`,
    now,
    like,
    like,
    like,
    like,
    like,
    `${term.replace(/[%_]/g, "")}%`,
  );
}

export function listCategories(options?: { home?: boolean; nav?: boolean }) {
  const where = ["published = 1"];
  if (options?.home) where.push("show_on_home = 1");
  if (options?.nav) where.push("show_in_nav = 1");
  return queryAll<{
    id: string;
    name: string;
    slug: string;
    description: string | null;
    icon: string;
    color: string;
    featured: number;
    image_id: string | null;
    story_count: number;
  }>(
    `SELECT c.id, c.name, c.slug, c.description, c.icon, c.color, c.featured, c.image_id,
            (
              SELECT COUNT(DISTINCT s.id)
              FROM story_categories sc
              JOIN stories s ON s.id = sc.story_id
              WHERE sc.category_id = c.id AND ${publishedClause("s")}
            ) AS story_count
     FROM categories c
     WHERE ${where.join(" AND ")}
     ORDER BY c.featured DESC, c.sort_order ASC, c.name ASC`,
    nowIso(),
  );
}

export function getCategory(slug: string) {
  return queryOne<{
    id: string;
    name: string;
    slug: string;
    description: string | null;
    icon: string;
    color: string;
    image_id: string | null;
  }>(
    `SELECT id, name, slug, description, icon, color, image_id
     FROM categories WHERE slug = ? AND published = 1`,
    slug,
  );
}

export function getAuthor(slug: string) {
  const now = nowIso();
  return queryOne<{
    id: string;
    name: string;
    slug: string;
    bio: string | null;
    image_id: string | null;
    story_count: number;
  }>(
    `SELECT a.id, a.name, a.slug, a.bio, a.image_id,
            (SELECT COUNT(*) FROM stories s WHERE s.author_id = a.id AND ${publishedClause("s")}) AS story_count
     FROM authors a WHERE a.slug = ?`,
    now,
    slug,
  );
}

export function favoriteIds(userId: string | null) {
  if (!userId) return new Set<string>();
  const rows = queryAll<{ story_id: string }>("SELECT story_id FROM favorites WHERE user_id = ?", userId);
  return new Set(rows.map((row) => row.story_id));
}

export function recountFavorite(storyId: string) {
  execute(
    `UPDATE stories SET favorite_count = (SELECT COUNT(*) FROM favorites WHERE story_id = ?) WHERE id = ?`,
    storyId,
    storyId,
  );
}
