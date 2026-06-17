import crypto from 'crypto';

const D1_URL = (process.env.D1_REST_URL || process.env.D1_REST_ENDPOINT || process.env.D1_URL || '').trim().replace(/^["']|["']$/g, '').replace(/\/$/, '');
const D1_TOKEN = (process.env.D1_REST_TOKEN || process.env.D1_SECRET || process.env.token || process.env.TOKEN || '').trim().replace(/^["']|["']$/g, '');

let schemaPromise;

function assertConfig() {
  if (!D1_URL || !D1_TOKEN) throw new Error('D1_REST_URL and D1_REST_TOKEN are required');
}

export async function d1Query(query, params = []) {
  assertConfig();
  const response = await fetch(`${D1_URL}/query`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${D1_TOKEN}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ query, params }),
  });
  const json = await response.json().catch(() => ({}));
  if (!response.ok || json.success === false) throw new Error(json.error || response.statusText || 'D1 query failed');
  return json.results || [];
}

export function id() {
  return crypto.randomUUID();
}

export function now() {
  return new Date().toISOString();
}

export function toJson(value) {
  return JSON.stringify(value ?? []);
}

export function fromJson(value, fallback = []) {
  try {
    return value ? JSON.parse(value) : fallback;
  } catch {
    return fallback;
  }
}

export function bool(value) {
  return value ? 1 : 0;
}

export function like(value) {
  return `%${String(value || '').trim()}%`;
}

export function mapBase(row) {
  if (!row) return row;
  return {
    ...row,
    _id: row.id,
    isFavorite: Boolean(row.isFavorite),
    isPinned: Boolean(row.isPinned),
    isSolved: Boolean(row.isSolved),
    repeatWeekly: row.repeatWeekly === undefined ? undefined : Boolean(row.repeatWeekly),
    emailVerified: row.emailVerified === undefined ? undefined : Boolean(row.emailVerified),
    multimodalEnabled: row.multimodalEnabled === undefined ? undefined : Boolean(row.multimodalEnabled),
    tags: row.tags === undefined ? undefined : fromJson(row.tags),
    models: row.models === undefined ? undefined : fromJson(row.models),
    messages: row.messages === undefined ? undefined : fromJson(row.messages),
  };
}

export function mapRows(rows) {
  return rows.map(mapBase);
}

export async function ensureSchema() {
  if (schemaPromise) return schemaPromise;
  if (process.env.SKIP_SCHEMA_ENSURE === 'true') {
    schemaPromise = Promise.resolve();
    return schemaPromise;
  }
  schemaPromise = (async () => {
    await Promise.all([
      d1Query(`CREATE TABLE IF NOT EXISTS app_users (
        id TEXT PRIMARY KEY,
        name TEXT DEFAULT '',
        email TEXT NOT NULL UNIQUE,
        passwordHash TEXT NOT NULL,
        salt TEXT NOT NULL,
        emailVerified INTEGER DEFAULT 0,
        verificationCodeHash TEXT DEFAULT '',
        verificationExpires TEXT,
        resetCodeHash TEXT DEFAULT '',
        resetExpires TEXT,
        createdAt TEXT NOT NULL,
        updatedAt TEXT NOT NULL
      );`),
      d1Query(`CREATE TABLE IF NOT EXISTS bookmarks (
        id TEXT PRIMARY KEY, userId TEXT NOT NULL, url TEXT NOT NULL, title TEXT NOT NULL,
        description TEXT DEFAULT '', favicon TEXT DEFAULT '', tags TEXT DEFAULT '[]',
        category TEXT DEFAULT 'general', isFavorite INTEGER DEFAULT 0,
        createdAt TEXT NOT NULL, updatedAt TEXT NOT NULL
      );`),
      d1Query(`CREATE TABLE IF NOT EXISTS notebooks (
        id TEXT PRIMARY KEY, userId TEXT NOT NULL, title TEXT NOT NULL, content TEXT DEFAULT '',
        tags TEXT DEFAULT '[]', category TEXT DEFAULT 'general', isPinned INTEGER DEFAULT 0,
        createdAt TEXT NOT NULL, updatedAt TEXT NOT NULL
      );`),
      d1Query(`CREATE TABLE IF NOT EXISTS codes (
        id TEXT PRIMARY KEY, userId TEXT NOT NULL, title TEXT NOT NULL, code TEXT NOT NULL,
        language TEXT DEFAULT 'cpp', description TEXT DEFAULT '', category TEXT DEFAULT 'general',
        tags TEXT DEFAULT '[]', isFavorite INTEGER DEFAULT 0, createdAt TEXT NOT NULL, updatedAt TEXT NOT NULL
      );`),
      d1Query(`CREATE TABLE IF NOT EXISTS questions (
        id TEXT PRIMARY KEY, userId TEXT NOT NULL, title TEXT NOT NULL, problem TEXT DEFAULT '',
        solution TEXT DEFAULT '', code TEXT DEFAULT '', language TEXT DEFAULT 'cpp',
        difficulty TEXT DEFAULT 'medium', platform TEXT DEFAULT 'codeforces', category TEXT DEFAULT 'general',
        tags TEXT DEFAULT '[]', isSolved INTEGER DEFAULT 0, link TEXT DEFAULT '',
        createdAt TEXT NOT NULL, updatedAt TEXT NOT NULL
      );`),
      d1Query(`CREATE TABLE IF NOT EXISTS categories (
        id TEXT PRIMARY KEY, userId TEXT NOT NULL, name TEXT NOT NULL, slug TEXT NOT NULL,
        scope TEXT DEFAULT 'all', color TEXT DEFAULT 'primary', createdAt TEXT NOT NULL, updatedAt TEXT NOT NULL,
        UNIQUE(userId, slug)
      );`),
      d1Query(`CREATE TABLE IF NOT EXISTS routines (
        id TEXT PRIMARY KEY, userId TEXT NOT NULL, type TEXT DEFAULT 'class', title TEXT NOT NULL,
        subject TEXT DEFAULT '', teacher TEXT DEFAULT '', room TEXT DEFAULT '', dayOfWeek INTEGER DEFAULT 0,
        date TEXT DEFAULT '', startTime TEXT NOT NULL, endTime TEXT NOT NULL, breakTime TEXT DEFAULT '',
        repeatWeekly INTEGER DEFAULT 1, notes TEXT DEFAULT '', createdAt TEXT NOT NULL, updatedAt TEXT NOT NULL
      );`),
      d1Query(`CREATE TABLE IF NOT EXISTS ai_settings (
        id TEXT PRIMARY KEY, userId TEXT NOT NULL, singleton TEXT NOT NULL, provider TEXT DEFAULT 'gemini',
        geminiKey TEXT DEFAULT '', geminiModel TEXT DEFAULT 'gemma-3-27b-it',
        openRouterKey TEXT DEFAULT '', openRouterModel TEXT DEFAULT 'google/gemma-3-27b-it',
        openAiKey TEXT DEFAULT '', openAiModel TEXT DEFAULT 'gpt-4o-mini',
        multimodalEnabled INTEGER DEFAULT 1, models TEXT DEFAULT '[]',
        createdAt TEXT NOT NULL, updatedAt TEXT NOT NULL, UNIQUE(userId, singleton)
      );`),
      d1Query(`CREATE TABLE IF NOT EXISTS chat_history (
        id TEXT PRIMARY KEY, userId TEXT NOT NULL UNIQUE, messages TEXT DEFAULT '[]',
        createdAt TEXT NOT NULL, updatedAt TEXT NOT NULL
      );`),
    ]);

    await Promise.all([
      d1Query(`CREATE INDEX IF NOT EXISTS idx_bookmarks_user_created ON bookmarks(userId, createdAt);`),
      d1Query(`CREATE INDEX IF NOT EXISTS idx_notebooks_user_updated ON notebooks(userId, updatedAt);`),
      d1Query(`CREATE INDEX IF NOT EXISTS idx_codes_user_created ON codes(userId, createdAt);`),
      d1Query(`CREATE INDEX IF NOT EXISTS idx_questions_user_created ON questions(userId, createdAt);`),
      d1Query(`CREATE INDEX IF NOT EXISTS idx_routines_user_time ON routines(userId, dayOfWeek, date, startTime);`),
    ]);
  })();
  return schemaPromise;
}
