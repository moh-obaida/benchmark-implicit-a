import { execute, queryAll, queryOne } from "@/lib/db";

export type PublicSettings = {
  siteName: string;
  siteDescription: string;
  contactEmail: string;
  contactNote: string;
  logoId: string;
  seoTitle: string;
  seoDescription: string;
  socialImageId: string;
  instagram: string;
  socialLinks: { label: string; url: string }[];
  defaultItemCount: number;
  density: "comfortable" | "compact";
  viewWeight: number;
  favoriteWeight: number;
  priorityWeight: number;
  weights: {
    category: number;
    tag: number;
    author: number;
    genre: number;
    age: number;
    popularity: number;
    recency: number;
    featured: number;
    priority: number;
  };
  recentDays: number;
};

const DEFAULTS: Record<string, string> = {
  site_name: "يراع",
  site_description: "مكان مريح تكتشف فيه قصتك القادمة.",
  contact_email: "",
  contact_note: "",
  logo_id: "",
  seo_title: "يراع — اكتشاف القصص والروايات",
  seo_description: "منصة عربية لاكتشاف القصص والروايات.",
  social_image_id: "",
  instagram: "",
  social_links: "[]",
  default_item_count: "12",
  density: "comfortable",
  view_weight: "1",
  favorite_weight: "4",
  priority_weight: "10",
  rec_w_category: "5",
  rec_w_tag: "3",
  rec_w_author: "4",
  rec_w_genre: "3",
  rec_w_age: "2",
  rec_w_popularity: "3",
  rec_w_recency: "2",
  rec_w_featured: "4",
  rec_w_priority: "3",
  recent_days: "45",
};

function clamp(value: number, min: number, max: number, fallback: number) {
  if (Number.isNaN(value)) return fallback;
  return Math.min(max, Math.max(min, value));
}

export function getSettings(): PublicSettings {
  const rows = queryAll<{ key: string; value: string }>("SELECT key, value FROM settings");
  const bag = { ...DEFAULTS };
  rows.forEach((row) => {
    bag[row.key] = row.value;
  });
  let socialLinks: { label: string; url: string }[] = [];
  try {
    const parsed = JSON.parse(bag.social_links || "[]") as { label?: string; url?: string }[];
    if (Array.isArray(parsed)) {
      socialLinks = parsed
        .filter((item) => item && item.label && item.url)
        .slice(0, 6)
        .map((item) => ({ label: String(item.label), url: String(item.url) }));
    }
  } catch {
    socialLinks = [];
  }
  return {
    siteName: bag.site_name || "يراع",
    siteDescription: bag.site_description || "",
    contactEmail: bag.contact_email || "",
    contactNote: bag.contact_note || "",
    logoId: bag.logo_id || "",
    seoTitle: bag.seo_title || "يراع",
    seoDescription: bag.seo_description || "",
    socialImageId: bag.social_image_id || "",
    instagram: bag.instagram || "",
    socialLinks,
    defaultItemCount: clamp(Number(bag.default_item_count), 4, 24, 12),
    density: bag.density === "compact" ? "compact" : "comfortable",
    viewWeight: clamp(Number(bag.view_weight), 0, 20, 1),
    favoriteWeight: clamp(Number(bag.favorite_weight), 0, 20, 4),
    priorityWeight: clamp(Number(bag.priority_weight), 0, 20, 10),
    weights: {
      category: clamp(Number(bag.rec_w_category), 0, 20, 5),
      tag: clamp(Number(bag.rec_w_tag), 0, 20, 3),
      author: clamp(Number(bag.rec_w_author), 0, 20, 4),
      genre: clamp(Number(bag.rec_w_genre), 0, 20, 3),
      age: clamp(Number(bag.rec_w_age), 0, 20, 2),
      popularity: clamp(Number(bag.rec_w_popularity), 0, 20, 3),
      recency: clamp(Number(bag.rec_w_recency), 0, 20, 2),
      featured: clamp(Number(bag.rec_w_featured), 0, 20, 4),
      priority: clamp(Number(bag.rec_w_priority), 0, 20, 3),
    },
    recentDays: clamp(Number(bag.recent_days), 7, 180, 45),
  };
}

export function saveSettings(entries: Record<string, string>) {
  const allowed = new Set(Object.keys(DEFAULTS));
  Object.entries(entries).forEach(([key, value]) => {
    if (!allowed.has(key) || key === "seeded") return;
    execute(
      `INSERT INTO settings (key, value) VALUES (?, ?)
       ON CONFLICT(key) DO UPDATE SET value = excluded.value`,
      key,
      value,
    );
  });
}

export function settingValue(key: string) {
  return queryOne<{ value: string }>("SELECT value FROM settings WHERE key = ?", key)?.value ?? "";
}
