// Works on both runtimes: Cloudflare edge (APP_ENV) and Node (vite dev plugin).
const runtimeEnv = () => globalThis.APP_ENV || globalThis.process?.env || {};

let schemaPromise;
let dbBinding = null;

export function setDbBinding(db) {
  dbBinding = db;
}

function getD1Url() {
  const env = runtimeEnv();
  return (env.D1_REST_URL || '').trim().replace(/^["']|["']$/g, '').replace(/\/$/, '');
}

function getD1Token() {
  const env = runtimeEnv();
  return (env.D1_REST_TOKEN || '').trim().replace(/^["']|["']$/g, '');
}

function assertConfig(url, token) {
  if (!url || !token) throw new Error('D1_REST_URL and D1_REST_TOKEN are required');
}

export async function d1Query(query, params = []) {
  if (dbBinding) {
    const stmt = dbBinding.prepare(query);
    const res = await stmt.bind(...params).all();
    return res.results || [];
  }
  const url = getD1Url();
  const token = getD1Token();
  assertConfig(url, token);
  const response = await fetch(`${url}/query`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ query, params }),
  });
  const json = await response.json().catch(() => ({}));
  if (!response.ok || json.success === false) throw new Error(json.error || response.statusText || 'D1 query failed');
  return json.results || [];
}

export function id() {
  return globalThis.crypto.randomUUID();
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
    attachments: row.attachments === undefined ? undefined : fromJson(row.attachments),
    phases: row.phases === undefined ? undefined : fromJson(row.phases),
    dailyHabits: row.dailyHabits === undefined ? undefined : fromJson(row.dailyHabits),
    dailyLogs: row.dailyLogs === undefined ? undefined : fromJson(row.dailyLogs),
    notes: row.phases !== undefined ? fromJson(row.notes, []) : row.notes,
  };
}

export function mapRows(rows) {
  return rows.map(mapBase);
}

export async function ensureSchema() {
  if (schemaPromise) return schemaPromise;
  if (String(runtimeEnv().SKIP_SCHEMA_ENSURE || '') === 'true') {
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
      d1Query(`CREATE TABLE IF NOT EXISTS passwords (
        id TEXT PRIMARY KEY, userId TEXT NOT NULL, title TEXT NOT NULL, url TEXT DEFAULT '',
        username TEXT DEFAULT '', password TEXT DEFAULT '', description TEXT DEFAULT '',
        tags TEXT DEFAULT '[]', category TEXT DEFAULT 'general',
        createdAt TEXT NOT NULL, updatedAt TEXT NOT NULL
      );`),
      d1Query(`CREATE TABLE IF NOT EXISTS codes (
        id TEXT PRIMARY KEY, userId TEXT NOT NULL, title TEXT NOT NULL, code TEXT NOT NULL,
        language TEXT DEFAULT 'cpp', description TEXT DEFAULT '', category TEXT DEFAULT 'general',
        tags TEXT DEFAULT '[]', attachments TEXT DEFAULT '[]', isFavorite INTEGER DEFAULT 0, createdAt TEXT NOT NULL, updatedAt TEXT NOT NULL
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
      d1Query(`CREATE TABLE IF NOT EXISTS uploaded_files (
        id TEXT PRIMARY KEY, userId TEXT NOT NULL, objectKey TEXT NOT NULL,
        name TEXT NOT NULL, mimeType TEXT DEFAULT 'application/octet-stream', size INTEGER DEFAULT 0,
        createdAt TEXT NOT NULL
      );`),
      d1Query(`CREATE TABLE IF NOT EXISTS budgets (
        id TEXT PRIMARY KEY, userId TEXT NOT NULL, month TEXT NOT NULL, amount REAL DEFAULT 0,
        currency TEXT DEFAULT 'BDT', notes TEXT DEFAULT '', createdAt TEXT NOT NULL, updatedAt TEXT NOT NULL
      );`),
      d1Query(`CREATE TABLE IF NOT EXISTS expenses (
        id TEXT PRIMARY KEY, userId TEXT NOT NULL, title TEXT NOT NULL, amount REAL DEFAULT 0,
        category TEXT DEFAULT 'general', date TEXT NOT NULL, method TEXT DEFAULT 'cash',
        notes TEXT DEFAULT '', createdAt TEXT NOT NULL, updatedAt TEXT NOT NULL
      );`),
      d1Query(`CREATE TABLE IF NOT EXISTS share_links (
        id TEXT PRIMARY KEY, userId TEXT NOT NULL, code TEXT NOT NULL UNIQUE,
        type TEXT NOT NULL, itemId TEXT NOT NULL, createdAt TEXT NOT NULL, updatedAt TEXT NOT NULL,
        UNIQUE(userId, type, itemId)
      );`),
      d1Query(`CREATE TABLE IF NOT EXISTS authenticators (
        id TEXT PRIMARY KEY, userId TEXT NOT NULL, name TEXT NOT NULL, secret TEXT NOT NULL,
        issuer TEXT DEFAULT '', account TEXT DEFAULT '', digits INTEGER DEFAULT 6, period INTEGER DEFAULT 30,
        createdAt TEXT NOT NULL, updatedAt TEXT NOT NULL
      );`),
      d1Query(`CREATE TABLE IF NOT EXISTS doc_notes (
        id TEXT PRIMARY KEY, userId TEXT NOT NULL,
        categoryId TEXT NOT NULL, chapterId TEXT NOT NULL, sectionId TEXT NOT NULL,
        content TEXT DEFAULT '',
        createdAt TEXT NOT NULL, updatedAt TEXT NOT NULL,
        UNIQUE(userId, categoryId, chapterId, sectionId)
      );`),
      d1Query(`CREATE TABLE IF NOT EXISTS transfers (
        id TEXT PRIMARY KEY, userId TEXT NOT NULL, person TEXT NOT NULL,
        amount REAL DEFAULT 0, reason TEXT DEFAULT '', date TEXT NOT NULL,
        method TEXT DEFAULT 'cash', notes TEXT DEFAULT '',
        createdAt TEXT NOT NULL, updatedAt TEXT NOT NULL
      );`),
      d1Query(`CREATE TABLE IF NOT EXISTS doc_progress (
        id TEXT PRIMARY KEY, userId TEXT NOT NULL,
        categoryId TEXT NOT NULL, readIds TEXT DEFAULT '[]',
        createdAt TEXT NOT NULL, updatedAt TEXT NOT NULL,
        UNIQUE(userId, categoryId)
      );`),
      d1Query(`CREATE TABLE IF NOT EXISTS roadmaps (
        id TEXT PRIMARY KEY, userId TEXT NOT NULL, title TEXT NOT NULL,
        description TEXT DEFAULT '', category TEXT DEFAULT 'general',
        duration TEXT DEFAULT '12 Months',
        dailyHabits TEXT DEFAULT '[]',
        phases TEXT DEFAULT '[]',
        dailyLogs TEXT DEFAULT '[]',
        status TEXT DEFAULT 'active',
        notes TEXT DEFAULT '[]',
        createdAt TEXT NOT NULL, updatedAt TEXT NOT NULL
      );`),
    ]);

    await Promise.all([
      d1Query(`CREATE INDEX IF NOT EXISTS idx_bookmarks_user_created ON bookmarks(userId, createdAt);`),
      d1Query(`CREATE INDEX IF NOT EXISTS idx_notebooks_user_updated ON notebooks(userId, updatedAt);`),
      d1Query(`CREATE INDEX IF NOT EXISTS idx_codes_user_created ON codes(userId, createdAt);`),
      d1Query(`CREATE INDEX IF NOT EXISTS idx_questions_user_created ON questions(userId, createdAt);`),
      d1Query(`CREATE INDEX IF NOT EXISTS idx_routines_user_time ON routines(userId, dayOfWeek, date, startTime);`),
      d1Query(`CREATE INDEX IF NOT EXISTS idx_uploaded_files_user_created ON uploaded_files(userId, createdAt);`),
      d1Query(`CREATE INDEX IF NOT EXISTS idx_budgets_user_month ON budgets(userId, month);`),
      d1Query(`CREATE INDEX IF NOT EXISTS idx_expenses_user_date ON expenses(userId, date);`),
      d1Query(`CREATE INDEX IF NOT EXISTS idx_share_links_code ON share_links(code);`),
      d1Query(`CREATE INDEX IF NOT EXISTS idx_doc_notes_user_chapter ON doc_notes(userId, categoryId, chapterId);`),
      d1Query(`CREATE INDEX IF NOT EXISTS idx_doc_progress_user ON doc_progress(userId, categoryId);`),
      d1Query(`CREATE INDEX IF NOT EXISTS idx_roadmaps_user_created ON roadmaps(userId, createdAt);`),
      d1Query(`CREATE INDEX IF NOT EXISTS idx_transfers_user_date ON transfers(userId, date);`),
    ]);

    await Promise.all([
      d1Query(`UPDATE categories SET scope = 'bookmark' WHERE scope IN ('bookmarks', 'link', 'links');`),
      d1Query(`UPDATE categories SET scope = 'notebook' WHERE scope IN ('notebooks', 'note', 'notes');`),
      d1Query(`UPDATE categories SET scope = 'code' WHERE scope IN ('codes', 'codebook', 'snippet', 'snippets');`),
      d1Query(`UPDATE categories SET scope = 'question' WHERE scope IN ('questions', 'qa', 'q&a', 'problem', 'problems');`),
    ]);

    await d1Query(`ALTER TABLE codes ADD COLUMN attachments TEXT DEFAULT '[]';`).catch(() => {});
    await d1Query(`ALTER TABLE roadmaps ADD COLUMN notes TEXT DEFAULT '[]';`).catch(() => {});
  })();
  return schemaPromise;
}
