import fs from "node:fs";
import path from "node:path";
import { DatabaseSync } from "node:sqlite";
import bcrypt from "bcryptjs";
import { nowIso } from "@/lib/format";
import { seedContent } from "@/lib/seed";

const dataDir = path.join(process.cwd(), "data");
const mediaDir = path.join(dataDir, "media");
const dbPath = path.join(dataDir, "yaraa.db");

type SqlStatement = {
  get(...params: unknown[]): unknown;
  all(...params: unknown[]): unknown[];
  run(...params: unknown[]): { changes: number; lastInsertRowid: number | bigint };
};

export type SqlRow = Record<string, unknown>;

const globalDb = globalThis as unknown as { yaraaDb?: DatabaseSync };

function createDatabase() {
  fs.mkdirSync(mediaDir, { recursive: true });
  const db = new DatabaseSync(dbPath);
  db.exec("PRAGMA journal_mode = WAL");
  db.exec("PRAGMA foreign_keys = ON");
  db.exec("PRAGMA busy_timeout = 4000");
  db.exec(SCHEMA);
  return db;
}

export function getDb() {
  if (!globalDb.yaraaDb) {
    globalDb.yaraaDb = createDatabase();
    ensureAdmin(globalDb.yaraaDb);
    const seeded = globalDb.yaraaDb.prepare("SELECT value FROM settings WHERE key = 'seeded'").get() as
      | { value?: string }
      | undefined;
    if (!seeded) seedContent(globalDb.yaraaDb);
  }
  return globalDb.yaraaDb;
}

export function mediaDirectory() {
  return mediaDir;
}

type SqlParam = string | number | bigint | null | Uint8Array;

export function queryAll<T extends SqlRow>(sql: string, ...params: unknown[]): T[] {
  const rows = getDb().prepare(sql).all(...(params as SqlParam[]));
  return rows.map((row) => ({ ...(row as object) }) as T);
}

export function queryOne<T extends SqlRow>(sql: string, ...params: unknown[]): T | null {
  const row = getDb().prepare(sql).get(...(params as SqlParam[]));
  if (!row) return null;
  return { ...(row as object) } as T;
}

export function execute(sql: string, ...params: unknown[]) {
  return getDb().prepare(sql).run(...(params as SqlParam[]));
}

export function transaction(work: () => void) {
  const db = getDb();
  db.exec("BEGIN");
  try {
    work();
    db.exec("COMMIT");
  } catch (error) {
    db.exec("ROLLBACK");
    throw error;
  }
}

export function uniqueSlug(
  table: "stories" | "categories" | "authors",
  base: string,
  exceptId?: string,
) {
  const root = base || "عنصر";
  let slug = root;
  let count = 2;
  while (true) {
    const row = queryOne<{ id: string }>(`SELECT id FROM ${table} WHERE slug = ?`, slug);
    if (!row || row.id === exceptId) return slug;
    slug = `${root}-${count++}`;
  }
}

function ensureAdmin(db: DatabaseSync) {
  const existing = db.prepare("SELECT id FROM users WHERE role = 'admin' LIMIT 1").get() as
    | { id?: string }
    | undefined;
  if (existing?.id) return;
  const email = (process.env.ADMIN_EMAIL || "admin@yaraa.local").trim().toLowerCase();
  const password = process.env.ADMIN_PASSWORD || "YaraaAdmin2026";
  const hash = bcrypt.hashSync(password, 10);
  db.prepare(
    `INSERT INTO users (id, name, email, password_hash, role, created_at)
     VALUES (?, ?, ?, ?, 'admin', ?)`,
  ).run(crypto.randomUUID(), "مدير يراع", email, hash, nowIso());
}

const SCHEMA = `
CREATE TABLE IF NOT EXISTS users (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  email TEXT UNIQUE,
  password_hash TEXT,
  role TEXT NOT NULL CHECK(role IN ('reader', 'admin')),
  created_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS media (
  id TEXT PRIMARY KEY,
  filename TEXT NOT NULL,
  mime TEXT NOT NULL,
  bytes INTEGER NOT NULL,
  width INTEGER,
  height INTEGER,
  alt TEXT,
  created_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS authors (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  bio TEXT,
  image_id TEXT REFERENCES media(id) ON DELETE SET NULL,
  featured INTEGER NOT NULL DEFAULT 0,
  is_demo INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS categories (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  description TEXT,
  image_id TEXT REFERENCES media(id) ON DELETE SET NULL,
  icon TEXT NOT NULL DEFAULT 'quill',
  color TEXT NOT NULL,
  sort_order INTEGER NOT NULL DEFAULT 0,
  published INTEGER NOT NULL DEFAULT 1,
  show_on_home INTEGER NOT NULL DEFAULT 1,
  show_in_nav INTEGER NOT NULL DEFAULT 0,
  featured INTEGER NOT NULL DEFAULT 0,
  is_demo INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS stories (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  short_description TEXT,
  full_description TEXT,
  author_id TEXT REFERENCES authors(id) ON DELETE SET NULL,
  cover_id TEXT REFERENCES media(id) ON DELETE SET NULL,
  age_min INTEGER,
  age_max INTEGER,
  story_type TEXT,
  genre TEXT,
  reading_minutes INTEGER,
  featured INTEGER NOT NULL DEFAULT 0,
  editor_pick INTEGER NOT NULL DEFAULT 0,
  published INTEGER NOT NULL DEFAULT 0,
  publish_at TEXT,
  priority INTEGER NOT NULL DEFAULT 0,
  view_count INTEGER NOT NULL DEFAULT 0,
  favorite_count INTEGER NOT NULL DEFAULT 0,
  admin_notes TEXT,
  display_order INTEGER NOT NULL DEFAULT 0,
  narrator TEXT,
  series_name TEXT,
  episode_number INTEGER,
  external_source TEXT,
  audio_url TEXT,
  video_url TEXT,
  is_demo INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS story_categories (
  story_id TEXT NOT NULL REFERENCES stories(id) ON DELETE CASCADE,
  category_id TEXT NOT NULL REFERENCES categories(id) ON DELETE CASCADE,
  is_primary INTEGER NOT NULL DEFAULT 0,
  PRIMARY KEY (story_id, category_id)
);

CREATE TABLE IF NOT EXISTS tags (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  slug TEXT NOT NULL UNIQUE
);

CREATE TABLE IF NOT EXISTS story_tags (
  story_id TEXT NOT NULL REFERENCES stories(id) ON DELETE CASCADE,
  tag_id TEXT NOT NULL REFERENCES tags(id) ON DELETE CASCADE,
  PRIMARY KEY (story_id, tag_id)
);

CREATE TABLE IF NOT EXISTS story_related (
  story_id TEXT NOT NULL REFERENCES stories(id) ON DELETE CASCADE,
  related_id TEXT NOT NULL REFERENCES stories(id) ON DELETE CASCADE,
  PRIMARY KEY (story_id, related_id)
);

CREATE TABLE IF NOT EXISTS story_images (
  story_id TEXT NOT NULL REFERENCES stories(id) ON DELETE CASCADE,
  media_id TEXT NOT NULL REFERENCES media(id) ON DELETE CASCADE,
  sort_order INTEGER NOT NULL DEFAULT 0,
  PRIMARY KEY (story_id, media_id)
);

CREATE TABLE IF NOT EXISTS favorites (
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  story_id TEXT NOT NULL REFERENCES stories(id) ON DELETE CASCADE,
  created_at TEXT NOT NULL,
  PRIMARY KEY (user_id, story_id)
);

CREATE TABLE IF NOT EXISTS view_events (
  id TEXT PRIMARY KEY,
  story_id TEXT NOT NULL REFERENCES stories(id) ON DELETE CASCADE,
  user_id TEXT,
  created_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS homepage_sections (
  id TEXT PRIMARY KEY,
  type TEXT NOT NULL,
  title TEXT NOT NULL,
  subtitle TEXT,
  enabled INTEGER NOT NULL DEFAULT 1,
  sort_order INTEGER NOT NULL,
  mode TEXT NOT NULL DEFAULT 'automatic',
  item_count INTEGER NOT NULL DEFAULT 8,
  layout TEXT NOT NULL DEFAULT 'grid',
  accent TEXT,
  category_id TEXT REFERENCES categories(id) ON DELETE SET NULL,
  config_json TEXT NOT NULL DEFAULT '{}',
  visible_from TEXT,
  visible_until TEXT,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS section_items (
  id TEXT PRIMARY KEY,
  section_id TEXT NOT NULL REFERENCES homepage_sections(id) ON DELETE CASCADE,
  story_id TEXT REFERENCES stories(id) ON DELETE CASCADE,
  author_id TEXT REFERENCES authors(id) ON DELETE CASCADE,
  pinned INTEGER NOT NULL DEFAULT 0,
  excluded INTEGER NOT NULL DEFAULT 0,
  sort_order INTEGER NOT NULL DEFAULT 0,
  starts_at TEXT,
  ends_at TEXT
);

CREATE TABLE IF NOT EXISTS settings (
  key TEXT PRIMARY KEY,
  value TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS activity (
  id TEXT PRIMARY KEY,
  actor_id TEXT,
  action TEXT NOT NULL,
  entity_type TEXT,
  entity_id TEXT,
  summary TEXT NOT NULL,
  created_at TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_stories_pub ON stories(published, publish_at);
CREATE INDEX IF NOT EXISTS idx_stories_author ON stories(author_id);
CREATE INDEX IF NOT EXISTS idx_section_order ON homepage_sections(sort_order);
CREATE INDEX IF NOT EXISTS idx_activity_created ON activity(created_at);
`;

export function logActivity(
  actorId: string | null,
  action: string,
  entityType: string,
  entityId: string,
  summary: string,
) {
  execute(
    `INSERT INTO activity (id, actor_id, action, entity_type, entity_id, summary, created_at)
     VALUES (?, ?, ?, ?, ?, ?, ?)`,
    crypto.randomUUID(),
    actorId,
    action,
    entityType,
    entityId,
    summary,
    nowIso(),
  );
}

export type { SqlStatement };
