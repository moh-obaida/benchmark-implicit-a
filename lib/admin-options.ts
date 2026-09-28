import { queryAll } from "@/lib/db";
import { listMedia } from "@/lib/media";

export function formOptions() {
  return {
    authors: queryAll<{ id: string; name: string }>("SELECT id, name FROM authors ORDER BY name ASC"),
    categories: queryAll<{ id: string; name: string }>("SELECT id, name FROM categories ORDER BY sort_order ASC, name ASC"),
    stories: queryAll<{ id: string; title: string }>("SELECT id, title FROM stories ORDER BY title ASC"),
    library: listMedia().map((item) => ({ id: item.id, alt: item.alt })),
  };
}

export function storyRelations(id: string) {
  const categories = queryAll<{ category_id: string; is_primary: number }>(
    "SELECT category_id, is_primary FROM story_categories WHERE story_id = ?",
    id,
  );
  const tags = queryAll<{ name: string }>(
    `SELECT t.name FROM story_tags st JOIN tags t ON t.id = st.tag_id WHERE st.story_id = ? ORDER BY t.name`,
    id,
  );
  const related = queryAll<{ related_id: string }>("SELECT related_id FROM story_related WHERE story_id = ?", id);
  const images = queryAll<{ media_id: string }>(
    "SELECT media_id FROM story_images WHERE story_id = ? ORDER BY sort_order ASC",
    id,
  );
  return {
    primaryCategoryId: categories.find((item) => item.is_primary === 1)?.category_id ?? categories[0]?.category_id ?? "",
    categoryIds: categories.map((item) => item.category_id),
    tags: tags.map((tag) => tag.name).join("، "),
    relatedIds: related.map((item) => item.related_id),
    extraImageIds: images.map((item) => item.media_id).join(","),
  };
}
