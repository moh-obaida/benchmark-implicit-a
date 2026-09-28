export const BRAND_COLOR = "#EEDCEE";
export const FONT_FAMILY = "Tajawal";

export const PALETTE = [
  { key: "lavender", hex: "#EEDCEE", label: "لافندر" },
  { key: "blush", hex: "#F3E4E1", label: "وردي هادئ" },
  { key: "sage", hex: "#D7E3D4", label: "أخضر رمادي" },
  { key: "dust", hex: "#D5E0E8", label: "أزرق غباري" },
  { key: "cream", hex: "#F4EFE6", label: "كريمي" },
  { key: "mist", hex: "#E6E2DE", label: "رمادي هادئ" },
  { key: "sand", hex: "#E8E0D4", label: "رملي" },
] as const;

export const PALETTE_HEX = new Set<string>(PALETTE.map((color) => color.hex));

export const ICONS = [
  { key: "quill", label: "يراع" },
  { key: "book", label: "كتاب" },
  { key: "moon", label: "قمر" },
  { key: "leaf", label: "ورقة" },
  { key: "compass", label: "بوصلة" },
  { key: "home", label: "بيت" },
  { key: "spark", label: "وميض" },
  { key: "family", label: "عائلة" },
  { key: "star", label: "نجمة" },
] as const;

export const ICON_KEYS = new Set<string>(ICONS.map((icon) => icon.key));

export const SECTION_TYPES = [
  { id: "hero", label: "ترحيب" },
  { id: "categories", label: "التصنيفات" },
  { id: "recommended", label: "مقترحة لك" },
  { id: "popular", label: "الأكثر رواجًا" },
  { id: "recent", label: "وصل حديثًا" },
  { id: "picks", label: "اختيارات يراع" },
  { id: "featured", label: "قصص مميزة" },
  { id: "story_grid", label: "شبكة قصص" },
  { id: "story_carousel", label: "صف قصص" },
  { id: "featured_story", label: "قصة بارزة" },
  { id: "banner", label: "لافتة" },
  { id: "announcement", label: "تنبيه" },
  { id: "authors", label: "المؤلفون" },
  { id: "collection", label: "مجموعة" },
] as const;

export const SECTION_TYPE_IDS = new Set<string>(SECTION_TYPES.map((type) => type.id));

export const LAYOUTS = [
  { id: "grid", label: "شبكة" },
  { id: "carousel", label: "صف أفقي" },
  { id: "spotlight", label: "قصة بارزة مع قائمة" },
] as const;

export const LAYOUT_IDS = new Set<string>(LAYOUTS.map((layout) => layout.id));

export const STORY_SECTION_TYPES = new Set([
  "recommended",
  "popular",
  "recent",
  "picks",
  "featured",
  "story_grid",
  "story_carousel",
  "featured_story",
  "collection",
]);

export const AGE_BUCKETS = [
  { id: "3-5", label: "٣–٥ سنوات", min: 3, max: 5 },
  { id: "6-8", label: "٦–٨ سنوات", min: 6, max: 8 },
  { id: "9-12", label: "٩–١٢ سنة", min: 9, max: 12 },
  { id: "13+", label: "١٣ فأكثر", min: 13, max: 120 },
] as const;

export const SORTS = [
  { id: "newest", label: "الأحدث" },
  { id: "popular", label: "الأكثر رواجًا" },
  { id: "views", label: "الأكثر مشاهدة" },
  { id: "picks", label: "اختيارات يراع" },
] as const;

export const MAX_UPLOAD_BYTES = 5 * 1024 * 1024;
export const MIN_IMAGE_EDGE = 200;
export const MAX_IMAGE_EDGE = 8000;

export function sectionTypeLabel(id: string) {
  return SECTION_TYPES.find((type) => type.id === id)?.label ?? id;
}

export function isPaletteHex(value: string) {
  return PALETTE_HEX.has(value);
}
