import { queryAll } from "@/lib/db";
import { nowIso } from "@/lib/format";
import { getSettings } from "@/lib/settings";
import { getCardsByIds, publishedClause, type StoryCard } from "@/lib/stories";

export type RecommendationInput = {
  userId?: string | null;
  seenIds?: string[];
  limit: number;
  excludeIds?: string[];
  focusStoryId?: string | null;
  categoryId?: string | null;
};

type Candidate = {
  id: string;
  author_id: string | null;
  genre: string | null;
  age_min: number | null;
  age_max: number | null;
  featured: number;
  editor_pick: number;
  priority: number;
  view_count: number;
  favorite_count: number;
  publish_at: string | null;
  created_at: string;
  display_order: number;
  title: string;
};

/**
 * Metadata recommender. A later AI provider can replace `recommendStories`
 * as long as it returns published story cards for the same input.
 */
export function recommendStories(input: RecommendationInput): StoryCard[] {
  const settings = getSettings();
  const now = nowIso();
  const limit = Math.max(1, Math.min(24, input.limit));
  const exclude = new Set(input.excludeIds ?? []);
  const profile = buildProfile(input.userId, input.seenIds ?? [], input.focusStoryId);

  const candidates = queryAll<Candidate>(
    `SELECT s.id, s.author_id, s.genre, s.age_min, s.age_max, s.featured, s.editor_pick,
            s.priority, s.view_count, s.favorite_count, s.publish_at, s.created_at,
            s.display_order, s.title
     FROM stories s
     WHERE ${publishedClause("s")}
       AND (? IS NULL OR EXISTS (
         SELECT 1 FROM story_categories sc
         WHERE sc.story_id = s.id AND sc.category_id = ?
       ))`,
    now,
    input.categoryId ?? null,
    input.categoryId ?? null,
  );

  const categories = groupIds(
    queryAll<{ story_id: string; category_id: string }>(
      `SELECT sc.story_id, sc.category_id
       FROM story_categories sc
       JOIN categories c ON c.id = sc.category_id
       WHERE c.published = 1`,
    ),
  );
  const tags = groupIds(
    queryAll<{ story_id: string; tag_id: string }>("SELECT story_id, tag_id FROM story_tags").map((row) => ({
      story_id: row.story_id,
      category_id: row.tag_id,
    })),
  );

  const recentWindow = settings.recentDays * 86400000;
  const scored = candidates
    .filter((story) => !exclude.has(story.id))
    .map((story) => {
      let score = 0;
      const storyCategories = categories.get(story.id) ?? [];
      const storyTags = tags.get(story.id) ?? [];
      if (profile) {
        storyCategories.forEach((id) => {
          score += (profile.categories.get(id) ?? 0) * settings.weights.category;
        });
        storyTags.forEach((id) => {
          score += (profile.tags.get(id) ?? 0) * settings.weights.tag;
        });
        if (story.author_id && profile.authors.get(story.author_id)) {
          score += profile.authors.get(story.author_id)! * settings.weights.author;
        }
        if (story.genre && profile.genres.get(story.genre)) {
          score += profile.genres.get(story.genre)! * settings.weights.genre;
        }
        if (
          profile.age &&
          story.age_min != null &&
          story.age_max != null &&
          story.age_min <= profile.age.max &&
          story.age_max >= profile.age.min
        ) {
          score += settings.weights.age;
        }
      } else {
        if (story.featured) score += settings.weights.featured * 2;
        if (story.editor_pick) score += settings.weights.featured;
        score += Math.min(story.priority, 100) / 10 * settings.weights.priority;
      }
      const popularity =
        story.view_count * settings.viewWeight +
        story.favorite_count * settings.favoriteWeight +
        story.priority * settings.priorityWeight;
      score += popularity / 20 * settings.weights.popularity;
      const publishedAt = new Date(story.publish_at || story.created_at).getTime();
      const ageMs = Math.max(0, Date.now() - publishedAt);
      const recency = Math.max(0, 1 - ageMs / recentWindow);
      score += recency * settings.weights.recency * 8;
      if (story.featured) score += settings.weights.featured;
      if (story.editor_pick) score += settings.weights.priority;
      return { id: story.id, score, priority: story.priority, publishedAt, title: story.title, display: story.display_order };
    })
    .sort((a, b) => b.score - a.score || b.priority - a.priority || b.publishedAt - a.publishedAt || a.display - b.display || a.title.localeCompare(b.title, "ar"));

  const chosen = scored.slice(0, limit).map((item) => item.id);
  if (chosen.length < limit) {
    scored.forEach((item) => {
      if (chosen.length >= limit) return;
      if (!chosen.includes(item.id)) chosen.push(item.id);
    });
  }
  return getCardsByIds(chosen);
}

function groupIds(rows: { story_id: string; category_id: string }[]) {
  const map = new Map<string, string[]>();
  rows.forEach((row) => {
    const list = map.get(row.story_id) ?? [];
    list.push(row.category_id);
    map.set(row.story_id, list);
  });
  return map;
}

function buildProfile(userId: string | null | undefined, seenIds: string[], focusStoryId?: string | null) {
  const weights = new Map<string, number>();
  if (focusStoryId) weights.set(focusStoryId, (weights.get(focusStoryId) ?? 0) + 4);
  seenIds.forEach((id) => weights.set(id, (weights.get(id) ?? 0) + 1));
  if (userId) {
    queryAll<{ story_id: string }>(
      "SELECT story_id FROM favorites WHERE user_id = ?",
      userId,
    ).forEach((row) => weights.set(row.story_id, (weights.get(row.story_id) ?? 0) + 3));
    queryAll<{ story_id: string }>(
      `SELECT story_id FROM view_events
       WHERE user_id = ?
       ORDER BY created_at DESC LIMIT 40`,
      userId,
    ).forEach((row) => weights.set(row.story_id, (weights.get(row.story_id) ?? 0) + 1));
  }
  if (!weights.size) return null;

  const categories = new Map<string, number>();
  const tags = new Map<string, number>();
  const authors = new Map<string, number>();
  const genres = new Map<string, number>();
  let ageMin = 120;
  let ageMax = 0;
  let hasAge = false;

  weights.forEach((weight, storyId) => {
    queryAll<{ category_id: string }>(
      `SELECT sc.category_id FROM story_categories sc
       JOIN categories c ON c.id = sc.category_id
       WHERE sc.story_id = ? AND c.published = 1`,
      storyId,
    ).forEach((row) => categories.set(row.category_id, (categories.get(row.category_id) ?? 0) + weight));
    queryAll<{ tag_id: string }>("SELECT tag_id FROM story_tags WHERE story_id = ?", storyId).forEach((row) =>
      tags.set(row.tag_id, (tags.get(row.tag_id) ?? 0) + weight),
    );
    const story = queryAll<{ author_id: string | null; genre: string | null; age_min: number | null; age_max: number | null }>(
      "SELECT author_id, genre, age_min, age_max FROM stories WHERE id = ?",
      storyId,
    )[0];
    if (!story) return;
    if (story.author_id) authors.set(story.author_id, (authors.get(story.author_id) ?? 0) + weight);
    if (story.genre) genres.set(story.genre, (genres.get(story.genre) ?? 0) + weight);
    if (story.age_min != null && story.age_max != null) {
      hasAge = true;
      ageMin = Math.min(ageMin, story.age_min);
      ageMax = Math.max(ageMax, story.age_max);
    }
  });

  return {
    categories,
    tags,
    authors,
    genres,
    age: hasAge ? { min: ageMin, max: ageMax } : null,
  };
}
