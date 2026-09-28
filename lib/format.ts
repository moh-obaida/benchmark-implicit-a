export function decodeParam(value: string) {
  let current = value;
  for (let attempt = 0; attempt < 2; attempt += 1) {
    if (!current.includes("%")) return current;
    try {
      const next = decodeURIComponent(current);
      if (next === current) return current;
      current = next;
    } catch {
      return current;
    }
  }
  return current;
}

export function nowIso() {
  return new Date().toISOString();
}

export function slugify(input: string) {
  return input
    .trim()
    .replace(/\s+/g, "-")
    .replace(/[^\p{L}\p{N}-]+/gu, "")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 80);
}

export function formatNumber(value: number) {
  return new Intl.NumberFormat("ar", { numberingSystem: "latn" }).format(value);
}

export function storyCountLabel(count: number) {
  if (count === 0) return "لا توجد قصص";
  if (count === 1) return "قصة واحدة";
  if (count === 2) return "قصتان";
  if (count >= 3 && count <= 10) return `${formatNumber(count)} قصص`;
  return `${formatNumber(count)} قصة`;
}

export function readingLabel(minutes: number | null | undefined) {
  if (!minutes || minutes <= 0) return null;
  if (minutes === 1) return "دقيقة واحدة";
  if (minutes === 2) return "دقيقتان";
  if (minutes >= 3 && minutes <= 10) return `${formatNumber(minutes)} دقائق`;
  return `${formatNumber(minutes)} دقيقة`;
}

export function ageLabel(min: number | null | undefined, max: number | null | undefined) {
  if (min == null && max == null) return null;
  if (min != null && max != null && max >= 90) return `${formatNumber(min)} فأكثر`;
  if (min != null && max != null) return `${formatNumber(min)}–${formatNumber(max)} سنوات`;
  if (min != null) return `من ${formatNumber(min)} سنوات`;
  return `حتى ${formatNumber(max as number)} سنوات`;
}

export function formatDate(iso: string | null | undefined) {
  if (!iso) return "";
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "";
  return new Intl.DateTimeFormat("ar", {
    dateStyle: "medium",
    numberingSystem: "latn",
  }).format(date);
}

export function toLocalInput(iso: string | null | undefined) {
  if (!iso) return "";
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "";
  const pad = (value: number) => String(value).padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

export function fromLocalInput(value: string) {
  const trimmed = value.trim();
  if (!trimmed) return null;
  const date = new Date(trimmed);
  if (Number.isNaN(date.getTime())) return null;
  return date.toISOString();
}

export function safeHttpUrl(value: string | null | undefined) {
  if (!value) return null;
  try {
    const url = new URL(value);
    if (url.protocol === "https:" || url.protocol === "http:") return url.toString();
  } catch {
    return null;
  }
  return null;
}

export function clip(value: string, max: number) {
  return value.trim().slice(0, max);
}

export function likeTerm(value: string) {
  return `%${value.trim().slice(0, 80).replace(/[%_]/g, "")}%`;
}

export function paragraphs(value: string | null | undefined) {
  if (!value) return [];
  return value
    .split(/\n\n+/)
    .map((part) => part.trim())
    .filter(Boolean);
}

export function splitTags(value: string) {
  return [
    ...new Set(
      value
        .split(/[,،]/)
        .map((tag) => tag.trim())
        .filter((tag) => tag.length > 0 && tag.length <= 40),
    ),
  ];
}
