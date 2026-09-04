import { createToken, verifyPassword, hashPassword, createVerificationCode, hashValue, verifyToken } from './_lib/auth.js';
import { bool, d1Query, ensureSchema, fromJson, id as newId, like, mapBase, mapRows, now, toJson } from './_lib/d1.js';

const aiDefaults = {
  singleton: 'default',
  provider: 'gemini',
  geminiKey: '',
  geminiModel: 'gemma-3-27b-it',
  openRouterKey: '',
  openRouterModel: 'google/gemma-3-27b-it',
  openAiKey: '',
  openAiModel: 'gpt-4o-mini',
  multimodalEnabled: true,
  models: [],
};

const publicShareTypes = {
  notes: 'notebooks',
  notebooks: 'notebooks',
  codes: 'codes',
  questions: 'questions',
  bookmarks: 'bookmarks',
  files: 'uploaded_files',
};

const resources = {
  bookmarks: {
    table: 'bookmarks',
    columns: ['url', 'title', 'description', 'favicon', 'tags', 'category', 'isFavorite'],
    defaults: { description: '', favicon: '', tags: [], category: 'general', isFavorite: false },
    search: ['title', 'url', 'description', 'category', 'tags'],
    sort: 'createdAt DESC',
  },
  notebooks: {
    table: 'notebooks',
    columns: ['title', 'content', 'tags', 'category', 'isPinned'],
    defaults: { content: '', tags: [], category: 'general', isPinned: false },
    search: ['title', 'content', 'category', 'tags'],
    sort: 'isPinned DESC, updatedAt DESC',
  },
  passwords: {
    table: 'passwords',
    columns: ['title', 'url', 'username', 'password', 'description', 'category', 'tags'],
    defaults: { url: '', username: '', password: '', description: '', category: 'general', tags: [] },
    search: ['title', 'url', 'username', 'description', 'category', 'tags'],
    sort: 'createdAt DESC',
  },
  codes: {
    table: 'codes',
    columns: ['title', 'code', 'language', 'description', 'category', 'tags', 'attachments', 'isFavorite'],
    defaults: { language: 'cpp', description: '', category: 'general', tags: [], attachments: [], isFavorite: false },
    search: ['title', 'code', 'language', 'description', 'category', 'tags', 'attachments'],
    sort: 'createdAt DESC',
  },
  questions: {
    table: 'questions',
    columns: ['title', 'problem', 'solution', 'code', 'language', 'difficulty', 'platform', 'category', 'tags', 'isSolved', 'link'],
    defaults: { problem: '', solution: '', code: '', language: 'cpp', difficulty: 'medium', platform: 'codeforces', category: 'general', tags: [], isSolved: false, link: '' },
    search: ['title', 'problem', 'solution', 'code', 'language', 'difficulty', 'platform', 'category', 'link', 'tags'],
    sort: 'createdAt DESC',
  },
  categories: {
    table: 'categories',
    columns: ['name', 'slug', 'scope', 'color'],
    defaults: { scope: 'all', color: 'primary' },
    search: ['name', 'slug'],
    sort: 'name ASC',
  },
  routines: {
    table: 'routines',
    columns: ['type', 'title', 'subject', 'teacher', 'room', 'dayOfWeek', 'date', 'startTime', 'endTime', 'breakTime', 'repeatWeekly', 'notes'],
    defaults: { type: 'class', subject: '', teacher: '', room: '', dayOfWeek: 0, date: '', breakTime: '', repeatWeekly: true, notes: '' },
    search: ['title', 'subject', 'teacher', 'room', 'notes'],
    sort: 'dayOfWeek ASC, date ASC, startTime ASC',
  },
  budgets: {
    table: 'budgets',
    columns: ['month', 'amount', 'currency', 'notes'],
    defaults: { amount: 0, currency: 'BDT', notes: '' },
    search: ['month', 'notes'],
    sort: 'month DESC, updatedAt DESC',
  },
  expenses: {
    table: 'expenses',
    columns: ['title', 'amount', 'category', 'date', 'method', 'notes'],
    defaults: { amount: 0, category: 'general', method: 'cash', notes: '' },
    search: ['title', 'category', 'method', 'notes'],
    sort: 'date DESC, createdAt DESC',
  },
  transfers: {
    table: 'transfers',
    columns: ['person', 'amount', 'reason', 'date', 'method', 'notes'],
    defaults: { amount: 0, reason: '', method: 'cash', notes: '' },
    search: ['person', 'reason', 'method', 'notes'],
    sort: 'date DESC, createdAt DESC',
  },
  uploaded_files: {
    table: 'uploaded_files',
    columns: ['name', 'mimeType', 'size'],
    defaults: { mimeType: 'application/octet-stream', size: 0 },
    search: ['name', 'mimeType'],
    sort: 'createdAt DESC',
  },
  authenticators: {
    table: 'authenticators',
    columns: ['name', 'secret', 'issuer', 'account', 'digits', 'period'],
    defaults: { issuer: '', account: '', digits: 6, period: 30 },
    search: ['name', 'issuer', 'account'],
    sort: 'name ASC',
  },
  roadmaps: {
    table: 'roadmaps',
    columns: ['title', 'description', 'category', 'duration', 'dailyHabits', 'phases', 'dailyLogs', 'status'],
    defaults: { description: '', category: 'general', duration: '12 Months', dailyHabits: [], phases: [], dailyLogs: [], status: 'active' },
    search: ['title', 'description', 'category'],
    sort: 'createdAt DESC',
  },
};

function userId(user) {
  return user.id || user._id;
}

async function requireUser(req, res) {
  const header = req.headers.authorization || '';
  const token = header.startsWith('Bearer ') ? header.slice(7) : '';
  const session = await verifyToken(token);
  if (!session?.id) {
    res.status(401).json({ error: 'Login required' });
    return null;
  }
  const rows = await d1Query('SELECT id, name, email FROM app_users WHERE id = ? LIMIT 1;', [session.id]);
  if (!rows[0]) {
    res.status(401).json({ error: 'Login required' });
    return null;
  }
  return rows[0];
}

function slugify(value) {
  return value.trim().toLowerCase().replace(/[^\p{L}\p{N}]+/gu, '-').replace(/^-+|-+$/g, '') || 'category';
}

function normalizeCategoryScope(value) {
  const raw = String(value || '').trim().toLowerCase();
  if (['all', 'bookmark', 'notebook', 'code', 'question', 'password'].includes(raw)) return raw;
  if (['bookmarks', 'link', 'links'].includes(raw)) return 'bookmark';
  if (['notebooks', 'note', 'notes'].includes(raw)) return 'notebook';
  if (['codes', 'codebook', 'snippet', 'snippets'].includes(raw)) return 'code';
  if (['questions', 'qa', 'q&a', 'problem', 'problems'].includes(raw)) return 'question';
  return 'bookmark';
}

function categoryScopeAliases(scope) {
  const canonical = normalizeCategoryScope(scope);
  const aliases = {
    all: ['all'],
    bookmark: ['bookmark', 'bookmarks', 'link', 'links'],
    notebook: ['notebook', 'notebooks', 'note', 'notes'],
    code: ['code', 'codes', 'codebook', 'snippet', 'snippets'],
    question: ['question', 'questions', 'qa', 'q&a', 'problem', 'problems'],
    password: ['password', 'passwords', 'secret', 'secrets', 'credential', 'credentials'],
  };
  return aliases[canonical] || [canonical];
}

function cleanBoolColumn(column, value) {
  return ['isFavorite', 'isPinned', 'isSolved', 'repeatWeekly', 'emailVerified', 'multimodalEnabled'].includes(column) ? bool(value) : value;
}

function cleanJsonColumn(column, value) {
  return ['tags', 'models', 'messages', 'attachments', 'phases', 'dailyHabits', 'dailyLogs'].includes(column) ? toJson(Array.isArray(value) || (typeof value === 'object' && value !== null) ? value : []) : value;
}

function cleanValue(column, value) {
  return cleanJsonColumn(column, cleanBoolColumn(column, value));
}

const jsonSearchColumns = new Set(['tags', 'attachments']);

function searchPredicate(column) {
  if (!jsonSearchColumns.has(column)) return `${column} LIKE ?`;
  return `(${column} LIKE ? OR EXISTS (SELECT 1 FROM json_each(CASE WHEN json_valid(${column}) THEN ${column} ELSE '[]' END) WHERE json_each.value LIKE ?))`;
}

function buildWhere(resource, query, uid) {
  const config = resources[resource];
  const where = ['userId = ?'];
  const params = [uid];
  const add = (sql, value) => {
    where.push(sql);
    params.push(value);
  };

  const searchTerm = query.search || query.q;
  if (searchTerm) {
    const parts = config.search.map(searchPredicate);
    where.push(`(${parts.join(' OR ')})`);
    for (const column of config.search) {
      params.push(like(searchTerm));
      if (jsonSearchColumns.has(column)) params.push(like(searchTerm));
    }
  }
  if (resource === 'bookmarks') {
    if (query.category && query.category !== 'all') add('category = ?', query.category);
    if (query.favorite === 'true') where.push('isFavorite = 1');
  }
  if (resource === 'notebooks') {
    if (query.category && query.category !== 'all') add('category = ?', query.category);
  }
  if (resource === 'codes') {
    if (query.language && query.language !== 'all') add('language = ?', query.language);
    if (query.category && query.category !== 'all') add('category = ?', query.category);
    if (query.favorite === 'true') where.push('isFavorite = 1');
  }
  if (resource === 'questions') {
    if (query.difficulty && query.difficulty !== 'all') add('difficulty = ?', query.difficulty);
    if (query.platform && query.platform !== 'all') add('platform = ?', query.platform);
    if (query.category && query.category !== 'all') add('category = ?', query.category);
    if (query.solved === 'true') where.push('isSolved = 1');
    if (query.solved === 'false') where.push('isSolved = 0');
  }
  if (resource === 'passwords') {
    if (query.category && query.category !== 'all') add('category = ?', query.category);
  }
  if (resource === 'categories') {
    if (query.scope && query.scope !== 'all') {
      const scopes = ['all', ...categoryScopeAliases(query.scope)];
      where.push(`scope IN (${scopes.map(() => '?').join(', ')})`);
      params.push(...scopes);
    }
  }
  if (resource === 'routines') {
    if (query.type && query.type !== 'all') add('type = ?', String(query.type).trim().toLowerCase());
  }
  if (resource === 'budgets') {
    if (query.month && query.month !== 'all') add('month = ?', String(query.month).slice(0, 7));
  }
  if (resource === 'expenses') {
    if (query.month && query.month !== 'all') {
      add("substr(date, 1, 7) = ?", String(query.month).slice(0, 7));
    }
    if (query.category && query.category !== 'all') add('category = ?', String(query.category).trim().toLowerCase());
  }
  if (resource === 'transfers') {
    if (query.month && query.month !== 'all') {
      add("substr(date, 1, 7) = ?", String(query.month).slice(0, 7));
    }
  }
  return { where: where.join(' AND '), params };
}

async function listResource(resource, query, uid) {
  const config = resources[resource];
  const { where, params } = buildWhere(resource, query, uid);
  const pageMode = query.page || query.limit;
  const limit = Math.max(1, Math.min(Number(query.limit || 10), 100));
  const page = Math.max(1, Number(query.page || 1));
  const offset = (page - 1) * limit;

  if (pageMode) {
    const rows = await d1Query(`SELECT * FROM ${config.table} WHERE ${where} ORDER BY ${config.sort} LIMIT ? OFFSET ?;`, [...params, limit, offset]);
    const totalRows = await d1Query(`SELECT COUNT(*) AS total FROM ${config.table} WHERE ${where};`, params);
    return { items: mapRows(rows), total: Number(totalRows[0]?.total || 0) };
  }
  const rows = await d1Query(`SELECT * FROM ${config.table} WHERE ${where} ORDER BY ${config.sort};`, params);
  return mapRows(rows);
}

function validateResourceData(resource, data, { partial = false } = {}) {
  const hasCategoryScope = resource === 'categories' && Object.prototype.hasOwnProperty.call(data || {}, 'scope');
  const next = partial ? { ...data } : { ...resources[resource].defaults, ...data };
  if (['bookmarks', 'notebooks', 'codes', 'questions'].includes(resource)) {
    if (next.category !== undefined) {
      next.category = slugify(String(next.category));
    }
    if (next.tags !== undefined) {
      if (Array.isArray(next.tags)) {
        next.tags = next.tags.map((t) => String(t).trim()).filter(Boolean);
      } else if (typeof next.tags === 'string') {
        next.tags = next.tags.split(',').map((t) => t.trim()).filter(Boolean);
      } else {
        next.tags = [];
      }
    }
  }
  if (resource === 'categories') {
    if (!partial && !hasCategoryScope) next.scope = 'bookmark';
    if (next.scope !== undefined) next.scope = normalizeCategoryScope(next.scope);
    if (!partial) next.name = String(next.name || '').trim() || 'Untitled category';
  }
  if (resource === 'codes') {
    if (next.language !== undefined) {
      next.language = String(next.language).trim().toLowerCase();
    }
  }
  if (resource === 'questions') {
    if (next.difficulty !== undefined) {
      next.difficulty = String(next.difficulty).trim().toLowerCase();
      if (!['easy', 'medium', 'hard'].includes(next.difficulty)) {
        next.difficulty = 'medium';
      }
    }
    if (next.platform !== undefined) {
      next.platform = String(next.platform).trim().toLowerCase();
    }
    if (next.language !== undefined) {
      next.language = String(next.language).trim().toLowerCase();
    }
  }
  if (!partial && resource === 'bookmarks') {
    next.url = String(next.url || '').trim() || 'https://example.com';
    next.title = String(next.title || '').trim() || next.url;
  }
  if (!partial && resource === 'notebooks') next.title = String(next.title || '').trim() || 'Untitled note';
  if (!partial && resource === 'codes') {
    next.title = String(next.title || '').trim() || 'Untitled snippet';
    next.code = String(next.code || '').trim() || '// Add code here';
  }
  if (!partial && resource === 'questions') next.title = String(next.title || '').trim() || 'Untitled question';
  if (resource === 'routines') {
    if (next.type !== undefined) {
      next.type = String(next.type).trim().toLowerCase();
      if (!['class', 'event'].includes(next.type)) {
        next.type = 'event';
      }
    }
    if (!partial) {
      next.title = String(next.title || next.subject || '').trim() || 'Untitled routine';
      next.startTime = String(next.startTime || '').trim() || '09:00';
      next.endTime = String(next.endTime || '').trim() || '10:00';
    }
    if (next.startTime !== undefined) {
      next.startTime = String(next.startTime).trim();
      if (/^\d:\d\d$/.test(next.startTime)) {
        next.startTime = '0' + next.startTime;
      }
    }
    if (next.endTime !== undefined) {
      next.endTime = String(next.endTime).trim();
      if (/^\d:\d\d$/.test(next.endTime)) {
        next.endTime = '0' + next.endTime;
      }
    }
    if (next.dayOfWeek !== undefined) {
      const val = Number(next.dayOfWeek);
      next.dayOfWeek = isNaN(val) ? 0 : Math.max(0, Math.min(6, Math.floor(val)));
    }
    if (next.repeatWeekly !== undefined) next.repeatWeekly = next.repeatWeekly !== false;
  }
  if (resource === 'budgets') {
    const currentMonth = new Date().toISOString().slice(0, 7);
    if (!partial || next.month !== undefined) {
      const month = String(next.month || currentMonth).trim().slice(0, 7);
      next.month = /^\d{4}-\d{2}$/.test(month) ? month : currentMonth;
    }
    if (next.amount !== undefined) next.amount = Math.max(0, Number(next.amount) || 0);
    if (next.currency !== undefined) next.currency = String(next.currency || 'BDT').trim().toUpperCase().slice(0, 8) || 'BDT';
    if (next.notes !== undefined) next.notes = String(next.notes || '').slice(0, 5000);
  }
  if (resource === 'expenses') {
    const today = new Date().toISOString().slice(0, 10);
    if (!partial) next.title = String(next.title || '').trim() || 'Expense';
    if (next.amount !== undefined) next.amount = Math.max(0, Number(next.amount) || 0);
    if (next.category !== undefined) next.category = String(next.category || 'general').trim().toLowerCase() || 'general';
    if (next.date !== undefined || !partial) {
      const date = String(next.date || today).trim().slice(0, 10);
      next.date = /^\d{4}-\d{2}-\d{2}$/.test(date) ? date : today;
    }
    if (next.method !== undefined) next.method = String(next.method || 'cash').trim().toLowerCase() || 'cash';
    if (next.notes !== undefined) next.notes = String(next.notes || '').slice(0, 5000);
  }
  if (resource === 'transfers') {
    const todayDate = new Date().toISOString().slice(0, 10);
    if (!partial) next.person = String(next.person || '').trim() || 'Someone';
    if (next.amount !== undefined) next.amount = Math.max(0, Number(next.amount) || 0);
    if (next.reason !== undefined) next.reason = String(next.reason || '').slice(0, 500);
    if (next.date !== undefined || !partial) {
      const date = String(next.date || todayDate).trim().slice(0, 10);
      next.date = /^\d{4}-\d{2}-\d{2}$/.test(date) ? date : todayDate;
    }
    if (next.method !== undefined) next.method = String(next.method || 'cash').trim().toLowerCase() || 'cash';
    if (next.notes !== undefined) next.notes = String(next.notes || '').slice(0, 5000);
  }
  if (resource === 'roadmaps') {
    if (!partial) next.title = String(next.title || '').trim() || 'Untitled roadmap';
    if (next.duration !== undefined) next.duration = String(next.duration || '12 Months').trim();
    if (next.status !== undefined) {
      const s = String(next.status).toLowerCase();
      next.status = ['active', 'completed', 'paused'].includes(s) ? s : 'active';
    }
  }
  return next;
}

function cleanChatAction(action) {
  if (!action || typeof action !== 'object') return null;
  const operation = String(action.operation || '').trim();
  const resource = String(action.resource || '').trim();
  if (!operation || !resource) return null;
  return {
    operation,
    resource,
    ...(action.id !== undefined ? { id: String(action.id).slice(0, 160) } : {}),
    ...(Array.isArray(action.ids) ? { ids: action.ids.map((id) => String(id).slice(0, 160)).filter(Boolean).slice(0, 300) } : {}),
    ...(action.data && typeof action.data === 'object' ? { data: action.data } : {}),
  };
}

function cleanChatActionBatch(batch) {
  if (!batch || typeof batch !== 'object') return null;
  const status = ['pending', 'completed', 'cancelled', 'blocked'].includes(batch.status) ? batch.status : 'blocked';
  const actions = (Array.isArray(batch.actions) ? batch.actions : []).map(cleanChatAction).filter(Boolean).slice(0, 300);
  const rejected = (Array.isArray(batch.rejected) ? batch.rejected : [])
    .map((issue) => {
      if (!issue || typeof issue !== 'object') return null;
      const action = cleanChatAction(issue.action);
      if (!action) return null;
      return { action, reason: String(issue.reason || '').slice(0, 1000) };
    })
    .filter(Boolean)
    .slice(0, 300);
  return {
    id: String(batch.id || newId()).slice(0, 160),
    status,
    actions,
    rejected,
    createdAt: String(batch.createdAt || now()).slice(0, 80),
  };
}

function cleanChatMessages(messages) {
  return (Array.isArray(messages) ? messages : [])
    .filter((message) => message && typeof message === 'object' && ['user', 'assistant'].includes(message.role))
    .map((message) => {
      const next = {
        role: message.role,
        content: String(message.content || '').slice(0, 20000),
      };
      if (Array.isArray(message.actionBatches) && message.actionBatches.length > 0) {
        const actionBatches = message.actionBatches.map(cleanChatActionBatch).filter(Boolean).slice(-4);
        if (actionBatches.length > 0) next.actionBatches = actionBatches;
      }
      return next;
    })
    .filter((message) => message.content.trim())
    .slice(-50);
}

function getFileBucket() {
  return globalThis.APP_ENV?.R2 || globalThis.APP_ENV?.BUCKET || globalThis.APP_ENV?.FILE_BUCKET || globalThis.APP_ENV?.UPLOADS || null;
}

function safeFileName(value) {
  return String(value || 'file')
    .replace(/[^\p{L}\p{N}._-]+/gu, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 120) || 'file';
}

async function pruneUserFiles(uid, incomingSize) {
  const bucket = getFileBucket();
  if (!bucket) return;
  const maxBytes = 8 * 1024 * 1024 * 1024;
  const rows = await d1Query('SELECT COALESCE(SUM(size), 0) AS total FROM uploaded_files WHERE userId = ?;', [uid]);
  let total = Number(rows[0]?.total || 0);
  if (total + incomingSize <= maxBytes) return;
  const oldFiles = await d1Query('SELECT id, objectKey, size FROM uploaded_files WHERE userId = ? ORDER BY createdAt ASC;', [uid]);
  for (const file of oldFiles) {
    await bucket.delete(file.objectKey).catch(() => {});
    await d1Query('DELETE FROM uploaded_files WHERE id = ? AND userId = ?;', [file.id, uid]).catch(() => {});
    total -= Number(file.size || 0);
    if (total + incomingSize <= maxBytes) break;
  }
}

function fileMarkdown(file) {
  const url = `/api/files/${file.id}`;
  if (String(file.mimeType || '').startsWith('image/')) return `![${file.name}](${url})`;
  if (String(file.mimeType || '') === 'application/pdf') return `<iframe class="note-file-preview" src="${url}" title="${file.name}"></iframe>`;
  return `[${file.name}](${url})`;
}

function normalizeShareType(value) {
  return publicShareTypes[String(value || '').trim().toLowerCase()] || '';
}

function publicShareType(resource) {
  if (resource === 'notebooks') return 'notebooks';
  if (resource === 'uploaded_files') return 'files';
  return resource;
}

function randomShareCode(length = 6) {
  const alphabet = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789';
  const bytes = new Uint8Array(length);
  globalThis.crypto.getRandomValues(bytes);
  return Array.from(bytes, (byte) => alphabet[byte % alphabet.length]).join('');
}

async function ensureShareLink(uid, type, itemId) {
  const resource = normalizeShareType(type);
  if (!resource) throw new Error('Unsupported share type');
  const item = await getResource(resource, itemId, uid);
  if (!item) throw new Error('Item not found');
  const existing = (await d1Query('SELECT * FROM share_links WHERE userId = ? AND type = ? AND itemId = ? LIMIT 1;', [uid, resource, itemId]))[0];
  if (existing) return { code: existing.code, type: publicShareType(resource), itemId };
  let code = randomShareCode();
  for (let i = 0; i < 8; i += 1) {
    const used = (await d1Query('SELECT id FROM share_links WHERE code = ? LIMIT 1;', [code]))[0];
    if (!used) break;
    code = randomShareCode();
  }
  const stamp = now();
  await d1Query('INSERT INTO share_links (id, userId, code, type, itemId, createdAt, updatedAt) VALUES (?, ?, ?, ?, ?, ?, ?);', [newId(), uid, code, resource, itemId, stamp, stamp]);
  return { code, type: publicShareType(resource), itemId };
}

async function resolveShareByCode(code) {
  const row = (await d1Query('SELECT * FROM share_links WHERE code = ? LIMIT 1;', [String(code || '').trim()]))[0];
  if (!row) return null;
  const item = await getResource(row.type, row.itemId);
  if (!item) return null;
  const returnedItem = row.type === 'uploaded_files' ? filePayload(item) : item;
  return { code: row.code, type: publicShareType(row.type), item: returnedItem };
}

async function resolveShareByTypeAndId(type, itemId) {
  const resource = normalizeShareType(type);
  if (!resource || !itemId) return null;
  const shareExists = (await d1Query('SELECT id FROM share_links WHERE type = ? AND itemId = ? LIMIT 1;', [resource, itemId]))[0];
  if (!shareExists) return null;
  const item = await getResource(resource, itemId);
  if (!item) return null;
  const returnedItem = resource === 'uploaded_files' ? filePayload(item) : item;
  return { code: '', type: publicShareType(resource), item: returnedItem };
}

function filePayload(row) {
  return {
    id: row.id,
    _id: row.id,
    name: row.name,
    url: `/api/files/${row.id}`,
    markdown: fileMarkdown(row),
    mimeType: row.mimeType || 'application/octet-stream',
    size: Number(row.size || 0),
    createdAt: row.createdAt,
  };
}

function extractFileIdsFromText(value) {
  const ids = new Set();
  const text = String(value || '');
  const regex = /\/api\/files\/([a-zA-Z0-9_-]+)/g;
  let match;
  while ((match = regex.exec(text)) !== null) ids.add(match[1]);
  return [...ids];
}

async function isFileShared(fileId) {
  const directShare = (await d1Query('SELECT id FROM share_links WHERE type = ? AND itemId = ? LIMIT 1;', ['uploaded_files', fileId]))[0];
  if (directShare) return true;

  const notebooks = await d1Query(
    `SELECT n.content FROM share_links s
     JOIN notebooks n ON s.itemId = n.id
     WHERE s.type = 'notebooks' AND n.content LIKE ?;`,
    [`%/api/files/${fileId}%`]
  );
  if (notebooks.length > 0) return true;

  const codes = await d1Query(
    `SELECT c.attachments FROM share_links s
     JOIN codes c ON s.itemId = c.id
     WHERE s.type = 'codes' AND c.attachments LIKE ?;`,
    [`%${fileId}%`]
  );
  if (codes.length > 0) return true;

  return false;
}

async function deleteUploadedFile(uid, fileId) {
  const row = (await d1Query('SELECT * FROM uploaded_files WHERE id = ? AND userId = ? LIMIT 1;', [fileId, uid]))[0];
  if (!row) return false;
  const bucket = getFileBucket();
  if (bucket && row.objectKey) await bucket.delete(row.objectKey).catch(() => {});
  await d1Query('DELETE FROM uploaded_files WHERE id = ? AND userId = ?;', [fileId, uid]);
  return true;
}

async function deleteUploadedFiles(uid, fileIds) {
  const unique = [...new Set((fileIds || []).filter(Boolean))];
  for (const fileId of unique) {
    await deleteUploadedFile(uid, fileId);
  }
}

async function deleteAllUserFiles(uid) {
  const rows = await d1Query('SELECT id FROM uploaded_files WHERE userId = ?;', [uid]);
  await deleteUploadedFiles(uid, rows.map((row) => row.id));
}

async function createResource(resource, body, uid) {
  const config = resources[resource];
  const created = now();
  const rowId = newId();
  const data = validateResourceData(resource, body);
  const columns = config.columns.filter((column) => data[column] !== undefined);
  const names = ['id', 'userId', ...columns, 'createdAt', 'updatedAt'];
  const params = [rowId, uid, ...columns.map((column) => cleanValue(column, data[column])), created, created];
  await d1Query(`INSERT INTO ${config.table} (${names.join(', ')}) VALUES (${names.map(() => '?').join(', ')});`, params);
  return getResource(resource, rowId, uid);
}

async function getResource(resource, id, uid = null) {
  const config = resources[resource];
  const rows = await d1Query(`SELECT * FROM ${config.table} WHERE id = ?${uid ? ' AND userId = ?' : ''} LIMIT 1;`, uid ? [id, uid] : [id]);
  return rows[0] ? mapBase(rows[0]) : null;
}

async function updateResource(resource, id, body, uid) {
  const config = resources[resource];
  const previous = ['notebooks', 'codes'].includes(resource) ? await getResource(resource, id, uid) : null;
  const data = validateResourceData(resource, body, { partial: true });
  const columns = config.columns.filter((column) => data[column] !== undefined);
  if (columns.length === 0) return getResource(resource, id, uid);
  const updated = now();
  await d1Query(`UPDATE ${config.table} SET ${columns.map((column) => `${column} = ?`).join(', ')}, updatedAt = ? WHERE id = ? AND userId = ?;`, [
    ...columns.map((column) => cleanValue(column, data[column])),
    updated,
    id,
    uid,
  ]);
  if (resource === 'notebooks' && data.content !== undefined) {
    const before = new Set(extractFileIdsFromText(previous?.content || ''));
    const after = new Set(extractFileIdsFromText(data.content || ''));
    await deleteUploadedFiles(uid, [...before].filter((fileId) => !after.has(fileId)));
  }
  if (resource === 'codes' && data.attachments !== undefined) {
    const before = new Set(Array.isArray(previous?.attachments) ? previous.attachments.map((file) => file.id) : []);
    const after = new Set(Array.isArray(data.attachments) ? data.attachments.map((file) => file.id) : []);
    await deleteUploadedFiles(uid, [...before].filter((fileId) => !after.has(fileId)));
  }
  return getResource(resource, id, uid);
}

async function deleteResource(resource, id, uid) {
  const config = resources[resource];
  const existing = await getResource(resource, id, uid);
  if (resource === 'notebooks' && existing?.content) {
    await deleteUploadedFiles(uid, extractFileIdsFromText(existing.content));
  }
  if (resource === 'codes' && Array.isArray(existing?.attachments)) {
    await deleteUploadedFiles(uid, existing.attachments.map((file) => file.id));
  }
  await d1Query('DELETE FROM share_links WHERE userId = ? AND type = ? AND itemId = ?;', [uid, resource, id]).catch(() => {});
  await d1Query(`DELETE FROM ${config.table} WHERE id = ? AND userId = ?;`, [id, uid]);
}

async function sendVerifyMail(email, name, code) {
  const { sendVerificationEmail } = await import('./_lib/mailer.js');
  return sendVerificationEmail({ to: email, name, code });
}

async function sendResetMail(email, name, code) {
  const { sendResetPasswordEmail } = await import('./_lib/mailer.js');
  return sendResetPasswordEmail({ to: email, name, code });
}

async function getMetadata(targetUrl) {
  let id;
  try {
    let urlString = targetUrl;
    if (!/^https?:\/\//i.test(urlString)) {
      urlString = 'https://' + urlString;
    }
    const parsedUrl = new URL(urlString);
    const controller = new AbortController();
    id = setTimeout(() => controller.abort(), 4000);
    const response = await fetch(parsedUrl.toString(), {
      signal: controller.signal,
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
      }
    });
    if (!response.ok) {
      throw new Error(`Failed to fetch URL: ${response.statusText}`);
    }
    const contentType = response.headers.get('content-type') || '';
    if (!contentType.includes('text/html')) {
      return { title: '', description: '' };
    }
    const html = await response.text();
    const titleMatch = html.match(/<title[^>]*>([\s\S]*?)<\/title>/i);
    let title = titleMatch ? titleMatch[1].trim() : '';
    if (title) {
      title = title
        .replaceAll('&amp;', '&')
        .replaceAll('&quot;', '"')
        .replaceAll('&#39;', "'")
        .replaceAll('&lt;', '<')
        .replaceAll('&gt;', '>');
    }
    let description = '';
    const descMatch = html.match(/<meta[^>]+(?:name|property)=["'](?:og:)?description["'][^>]+content=["']([^"']*)["']/i)
      || html.match(/<meta[^>]+content=["']([^"']*)["'][^>]+(?:name|property)=["'](?:og:)?description["']/i);
    if (descMatch) {
      description = descMatch[1].trim()
        .replaceAll('&amp;', '&')
        .replaceAll('&quot;', '"')
        .replaceAll('&#39;', "'")
        .replaceAll('&lt;', '<')
        .replaceAll('&gt;', '>');
    }
    return { title, description };
  } catch (err) {
    return { title: '', description: '', error: err.message };
  } finally {
    if (id) clearTimeout(id);
  }
}

async function getQuestionMetadata(targetUrl) {
  let id;
  try {
    let urlString = targetUrl.trim();
    if (!/^https?:\/\//i.test(urlString)) {
      urlString = 'https://' + urlString;
    }
    const parsedUrl = new URL(urlString);
    const host = parsedUrl.hostname.toLowerCase();
    let title = '';
    let difficulty = 'medium';
    let platform = 'other';
    let tags = [];
    const controller = new AbortController();
    id = setTimeout(() => controller.abort(), 4000);
    if (host.includes('codeforces.com')) {
      platform = 'codeforces';
      const response = await fetch(parsedUrl.toString(), {
        signal: controller.signal,
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
        }
      });
      if (response.ok) {
        const html = await response.text();
        const titleMatch = html.match(/<div class="title">\s*[A-Z\d]+\.\s*([^<]+)<\/div>/i) || html.match(/<title[^>]*>([\s\S]*?)<\/title>/i);
        if (titleMatch) {
          title = titleMatch[1].trim()
            .replaceAll('&amp;', '&')
            .replaceAll('&quot;', '"')
            .replaceAll('&#39;', "'")
            .replaceAll('&lt;', '<')
            .replaceAll('&gt;', '>');
          title = title.replace(/\s*-\s*Codeforces\s*$/i, '');
        }
        const tagRegex = /<span class="tag-box"[^>]*>\s*([^<]+)\s*<\/span>/gi;
        let match;
        while ((match = tagRegex.exec(html)) !== null) {
          const tag = match[1].trim();
          if (tag.startsWith('*')) {
            const rating = parseInt(tag.substring(1), 10);
            if (!isNaN(rating)) {
              if (rating < 1200) difficulty = 'easy';
              else if (rating < 1900) difficulty = 'medium';
              else difficulty = 'hard';
            }
          } else if (!tag.startsWith('Combined')) {
            tags.push(tag.toLowerCase());
          }
        }
      }
    } else if (host.includes('leetcode.com')) {
      platform = 'leetcode';
      const match = parsedUrl.pathname.match(/\/problems\/([^/]+)/);
      if (match && match[1]) {
        const slug = match[1];
        const graphqlResponse = await fetch('https://leetcode.com/graphql', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
          },
          body: JSON.stringify({
            query: `query questionTitle($titleSlug: String!) {
              question(titleSlug: $titleSlug) {
                title
                difficulty
                topicTags {
                  name
                }
              }
            }`,
            variables: { titleSlug: slug }
          }),
          signal: controller.signal
        });
        if (graphqlResponse.ok) {
          const result = await graphqlResponse.json();
          const q = result?.data?.question;
          if (q) {
            title = q.title || '';
            difficulty = q.difficulty ? q.difficulty.toLowerCase() : 'medium';
            tags = q.topicTags ? q.topicTags.map(t => t.name.toLowerCase()) : [];
          }
        }
      }
    } else {
      const response = await fetch(parsedUrl.toString(), {
        signal: controller.signal,
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
        }
      });
      if (response.ok) {
        const html = await response.text();
        const titleMatch = html.match(/<title[^>]*>([\s\S]*?)<\/title>/i);
        if (titleMatch) {
          title = titleMatch[1].trim()
            .replaceAll('&amp;', '&')
            .replaceAll('&quot;', '"')
            .replaceAll('&#39;', "'")
            .replaceAll('&lt;', '<')
            .replaceAll('&gt;', '>');
        }
      }
      if (host.includes('atcoder.jp')) {
        platform = 'atcoder';
      } else if (host.includes('codechef.com')) {
        platform = 'codechef';
      } else if (host.includes('hackerrank.com')) {
        platform = 'hackerrank';
      }
    }
    return { title, difficulty, platform, tags };
  } catch (err) {
    return { title: '', difficulty: 'medium', platform: 'other', tags: [], error: err.message };
  } finally {
    if (id) clearTimeout(id);
  }
}

export default async function handler(req, res) {
  await ensureSchema();
  const { method, query = {} } = req;
  const url = new URL(req.url, 'http://localhost');
  const slug = url.pathname.replace(/^\/api\/?/, '').replace(/^\/+|\/+$/g, '');

  try {
    if (slug === 'shares' && method === 'POST') {
      const user = await requireUser(req, res);
      if (!user) return;
      try {
        const link = await ensureShareLink(userId(user), req.body.type, String(req.body.id || req.body.itemId || ''));
        return res.status(201).json(link);
      } catch (error) {
        return res.status(400).json({ error: error instanceof Error ? error.message : 'Could not create share link' });
      }
    }

    if (slug.startsWith('share/')) {
      const parts = slug.split('/');
      const payload = parts.length === 2
        ? await resolveShareByCode(parts[1])
        : await resolveShareByTypeAndId(parts[1], parts[2]);
      if (!payload) return res.status(404).json({ error: 'Shared item not found' });
      return res.json(payload);
    }

    if (slug.startsWith('files/') && !slug.startsWith('files/multipart')) {
      const fileId = slug.split('/')[1];
      if (method === 'PUT' || method === 'PATCH') {
        const user = await requireUser(req, res);
        if (!user) return;
        const uid = userId(user);
        const newName = safeFileName(String(req.body.name || ''));
        if (!newName) return res.status(400).json({ error: 'Valid name is required' });
        const row = (await d1Query('SELECT * FROM uploaded_files WHERE id = ? AND userId = ? LIMIT 1;', [fileId, uid]))[0];
        if (!row) return res.status(404).json({ error: 'File not found' });
        await d1Query('UPDATE uploaded_files SET name = ? WHERE id = ? AND userId = ?;', [newName, fileId, uid]);
        return res.json(filePayload({ ...row, name: newName }));
      }
      if (method === 'DELETE') {
        const user = await requireUser(req, res);
        if (!user) return;
        const deleted = await deleteUploadedFile(userId(user), fileId);
        if (!deleted) return res.status(404).json({ error: 'File not found' });
        return res.json({ message: 'File deleted' });
      }
      if (slug.split('/')[2] === 'download-url' && method === 'GET') {
        const user = await requireUser(req, res);
        if (!user) return;
        const uid = userId(user);
        const row = (await d1Query('SELECT * FROM uploaded_files WHERE id = ? AND userId = ? LIMIT 1;', [fileId, uid]))[0];
        if (!row) return res.status(404).json({ error: 'File not found' });
        const token = req.headers.authorization?.replace('Bearer ', '') || query.token || '';
        return res.json({ url: `/api/files/${fileId}?token=${encodeURIComponent(token)}`, expiresInSeconds: 0 });
      }
      const row = (await d1Query('SELECT * FROM uploaded_files WHERE id = ? LIMIT 1;', [fileId]))[0];
      const bucket = getFileBucket();
      if (!row || !bucket) return res.status(404).json({ error: 'File not found' });
      const header = req.headers.authorization || '';
      const token = header.startsWith('Bearer ') ? header.slice(7) : (query.token || '');
      const session = token ? await verifyToken(token) : null;
      const currentUid = session?.id || null;
      if (row.userId !== currentUid) {
        const isShared = await isFileShared(fileId);
        if (!isShared) return res.status(403).json({ error: 'Access denied' });
      }
      const rangeHeader = req.headers.range || '';
      const fileSize = Number(row.size || 0);

      if (rangeHeader) {
        const match = /bytes=(\d*)-(\d*)/.exec(rangeHeader);
        if (match) {
          let start = match[1] ? parseInt(match[1], 10) : 0;
          let end = match[2] ? parseInt(match[2], 10) : fileSize - 1;
          if (!match[1] && match[2]) {
            start = Math.max(0, fileSize - parseInt(match[2], 10));
            end = fileSize - 1;
          }
          if (start >= fileSize || end >= fileSize) {
            res.status(416);
            res.setHeader('Content-Range', `bytes */${fileSize}`);
            return res.end('');
          }
          const length = end - start + 1;
          const partial = await bucket.get(row.objectKey, { range: { offset: start, length } });
          if (!partial) return res.status(404).json({ error: 'File not found' });
          res.status(206);
          res.setHeader('Content-Type', row.mimeType || 'application/octet-stream');
          res.setHeader('Content-Length', String(length));
          res.setHeader('Content-Range', `bytes ${start}-${end}/${fileSize}`);
          res.setHeader('Accept-Ranges', 'bytes');
          res.setHeader('Cache-Control', 'public, max-age=31536000, immutable');
          return res.stream(partial.body);
        }
      }

      const object = await bucket.get(row.objectKey);
      if (!object) return res.status(404).json({ error: 'File not found' });
      res.setHeader('Content-Type', row.mimeType || 'application/octet-stream');
      res.setHeader('Content-Length', String(fileSize));
      res.setHeader('Accept-Ranges', 'bytes');
      res.setHeader('Cache-Control', 'public, max-age=31536000, immutable');
      res.setHeader('Content-Disposition', `inline; filename="${safeFileName(row.name)}"`);
      return res.stream(object.body);
    }

    if (slug === 'files' && method === 'GET') {
      const user = await requireUser(req, res);
      if (!user) return;
      const uid = userId(user);
      const limit = Math.max(1, Math.min(Number(query.limit || 20), 100));
      const page = Math.max(1, Number(query.page || 1));
      const offset = (page - 1) * limit;
      const where = ['userId = ?'];
      const params = [uid];
      if (query.search) {
        where.push('(name LIKE ? OR mimeType LIKE ?)');
        params.push(like(query.search), like(query.search));
      }
      const rows = await d1Query(`SELECT * FROM uploaded_files WHERE ${where.join(' AND ')} ORDER BY createdAt DESC LIMIT ? OFFSET ?;`, [...params, limit, offset]);
      const totalRows = await d1Query(`SELECT COUNT(*) AS total FROM uploaded_files WHERE ${where.join(' AND ')};`, params);
      return res.json({ items: rows.map(filePayload), total: Number(totalRows[0]?.total || 0) });
    }

    if (slug === 'files' && method === 'POST') {
      const user = await requireUser(req, res);
      if (!user) return;
      const bucket = getFileBucket();
      if (!bucket) return res.status(500).json({ error: 'R2 bucket binding missing. Add R2, BUCKET, FILE_BUCKET, or UPLOADS binding.' });
      if (!req.rawRequest?.formData) return res.status(400).json({ error: 'Multipart upload is required' });
      const form = await req.rawRequest.formData();
      const file = form.get('file');
      if (!file || typeof file === 'string') return res.status(400).json({ error: 'File is required' });
      const size = Number(file.size || 0);
      if (!size) return res.status(400).json({ error: 'Empty file is not allowed' });
      const maxUpload = 300 * 1024 * 1024;
      if (size > maxUpload) return res.status(413).json({ error: 'File must be 300MB or smaller' });
      const uid = userId(user);
      await pruneUserFiles(uid, size);
      const rowId = newId();
      const name = safeFileName(file.name || 'file');
      const mimeType = file.type || 'application/octet-stream';
      const objectKey = `${uid}/${new Date().toISOString().slice(0, 10)}/${rowId}-${name}`;
      const stamp = now();
      await bucket.put(objectKey, await file.arrayBuffer(), {
        httpMetadata: { contentType: mimeType },
        customMetadata: { userId: uid, name },
      });
      await d1Query('INSERT INTO uploaded_files (id, userId, objectKey, name, mimeType, size, createdAt) VALUES (?, ?, ?, ?, ?, ?, ?);', [rowId, uid, objectKey, name, mimeType, size, stamp]);
      const payload = filePayload({ id: rowId, name, mimeType, size, createdAt: stamp });
      return res.status(201).json(payload);
    }

    if (slug === 'files/multipart/create' && method === 'POST') {
      const user = await requireUser(req, res);
      if (!user) return;
      const bucket = getFileBucket();
      if (!bucket) return res.status(500).json({ error: 'R2 bucket binding missing.' });
      
      const { name, mimeType, size } = req.body;
      if (!name || !size) return res.status(400).json({ error: 'Name and size are required' });
      
      const maxUpload = 300 * 1024 * 1024;
      if (size > maxUpload) return res.status(413).json({ error: 'File must be 300MB or smaller' });
      
      const uid = userId(user);
      await pruneUserFiles(uid, size);
      const rowId = newId();
      const safeName = safeFileName(name || 'file');
      const safeMimeType = mimeType || 'application/octet-stream';
      const objectKey = `${uid}/${new Date().toISOString().slice(0, 10)}/${rowId}-${safeName}`;
      
      const multipartUpload = await bucket.createMultipartUpload(objectKey, {
        httpMetadata: { contentType: safeMimeType },
        customMetadata: { userId: uid, name: safeName },
      });
      
      return res.status(201).json({
        uploadId: multipartUpload.uploadId,
        key: objectKey,
        fileId: rowId
      });
    }

    if (slug === 'files/multipart/upload' && method === 'POST') {
      const user = await requireUser(req, res);
      if (!user) return;
      const bucket = getFileBucket();
      if (!bucket) return res.status(500).json({ error: 'R2 bucket binding missing.' });
      if (!req.rawRequest?.formData) return res.status(400).json({ error: 'Multipart upload is required' });
      
      const form = await req.rawRequest.formData();
      const chunk = form.get('chunk');
      const uploadId = form.get('uploadId');
      const key = form.get('key');
      const partNumber = Number(form.get('partNumber'));
      
      if (!chunk || !uploadId || !key || !partNumber) {
        return res.status(400).json({ error: 'Missing required parameters' });
      }
      
      const multipartUpload = bucket.resumeMultipartUpload(key, uploadId);
      const part = await multipartUpload.uploadPart(partNumber, await chunk.arrayBuffer());
      return res.json({ partNumber: part.partNumber, etag: part.etag });
    }

    if (slug === 'files/multipart/complete' && method === 'POST') {
      const user = await requireUser(req, res);
      if (!user) return;
      const bucket = getFileBucket();
      if (!bucket) return res.status(500).json({ error: 'R2 bucket binding missing.' });
      
      const { uploadId, key, fileId, parts, name, mimeType, size } = req.body;
      if (!uploadId || !key || !fileId || !parts) return res.status(400).json({ error: 'Missing required parameters' });
      
      const multipartUpload = bucket.resumeMultipartUpload(key, uploadId);
      await multipartUpload.complete(parts);
      
      const uid = userId(user);
      const stamp = now();
      const safeName = safeFileName(name || 'file');
      const safeMimeType = mimeType || 'application/octet-stream';
      
      await d1Query('INSERT INTO uploaded_files (id, userId, objectKey, name, mimeType, size, createdAt) VALUES (?, ?, ?, ?, ?, ?, ?);', [fileId, uid, key, safeName, safeMimeType, size, stamp]);
      const payload = filePayload({ id: fileId, name: safeName, mimeType: safeMimeType, size, createdAt: stamp });
      return res.status(201).json(payload);
    }

    if (slug === 'auth/login' && method === 'POST') {
      const email = String(req.body.email || '').trim().toLowerCase();
      const password = String(req.body.password || '');
      const rows = await d1Query('SELECT * FROM app_users WHERE email = ? LIMIT 1;', [email]);
      const user = rows[0];
      if (!user || !(await verifyPassword(password, user.salt, user.passwordHash))) return res.status(401).json({ error: 'Invalid email or password' });
      if (!user.emailVerified) return res.status(403).json({ error: 'Please verify your email before login', requiresVerification: true, email: user.email });
      return res.json({ token: await createToken(user), user: { id: user.id, name: user.name, email: user.email } });
    }

    if (slug === 'auth/register' && method === 'POST') {
      const name = String(req.body.name || '').trim();
      const email = String(req.body.email || '').trim().toLowerCase();
      const password = String(req.body.password || '');
      if (!name || !email || password.length < 6) return res.status(400).json({ error: 'Name, email and 6+ character password required' });
      const existing = (await d1Query('SELECT * FROM app_users WHERE email = ? LIMIT 1;', [email]))[0];
      const { salt, passwordHash } = await hashPassword(password);
      const code = createVerificationCode();
      const expiry = new Date(Date.now() + 10 * 60 * 1000).toISOString();
      const stamp = now();
      if (existing) {
        if (existing.emailVerified) return res.status(409).json({ error: 'Email already registered' });
        await d1Query('UPDATE app_users SET name = ?, salt = ?, passwordHash = ?, verificationCodeHash = ?, verificationExpires = ?, updatedAt = ? WHERE id = ?;', [name, salt, passwordHash, await hashValue(code), expiry, stamp, existing.id]);
        await sendVerifyMail(email, name, code);
        return res.status(201).json({ requiresVerification: true, email, message: 'Verification code sent' });
      }
      const rowId = newId();
      await d1Query('INSERT INTO app_users (id, name, email, passwordHash, salt, emailVerified, verificationCodeHash, verificationExpires, createdAt, updatedAt) VALUES (?, ?, ?, ?, ?, 0, ?, ?, ?, ?);', [rowId, name, email, passwordHash, salt, await hashValue(code), expiry, stamp, stamp]);
      await sendVerifyMail(email, name, code);
      return res.status(201).json({ requiresVerification: true, email, message: 'Verification code sent' });
    }

    if (slug === 'auth/verify' && method === 'POST') {
      const email = String(req.body.email || '').trim().toLowerCase();
      const code = String(req.body.code || '').trim();
      const user = (await d1Query('SELECT * FROM app_users WHERE email = ? LIMIT 1;', [email]))[0];
      if (!user) return res.status(404).json({ error: 'Account not found' });
      if (user.emailVerified) return res.json({ token: await createToken(user), user: { id: user.id, name: user.name, email: user.email } });
      if (!user.verificationExpires || new Date(user.verificationExpires).getTime() < Date.now()) return res.status(400).json({ error: 'Verification code expired' });
      if (user.verificationCodeHash !== await hashValue(code)) return res.status(400).json({ error: 'Invalid verification code' });
      await d1Query('UPDATE app_users SET emailVerified = 1, verificationCodeHash = ?, verificationExpires = NULL, updatedAt = ? WHERE id = ?;', ['', now(), user.id]);
      return res.json({ token: await createToken(user), user: { id: user.id, name: user.name, email: user.email } });
    }

    if (slug === 'auth/resend' && method === 'POST') {
      const email = String(req.body.email || '').trim().toLowerCase();
      const user = (await d1Query('SELECT * FROM app_users WHERE email = ? LIMIT 1;', [email]))[0];
      if (!user) return res.status(404).json({ error: 'Account not found' });
      if (user.emailVerified) return res.json({ message: 'Email already verified' });
      const code = createVerificationCode();
      await d1Query('UPDATE app_users SET verificationCodeHash = ?, verificationExpires = ?, updatedAt = ? WHERE id = ?;', [await hashValue(code), new Date(Date.now() + 10 * 60 * 1000).toISOString(), now(), user.id]);
      await sendVerifyMail(user.email, user.name, code);
      return res.json({ message: 'Verification code sent' });
    }

    if (slug === 'auth/forgot-password' && method === 'POST') {
      const email = String(req.body.email || '').trim().toLowerCase();
      const user = (await d1Query('SELECT * FROM app_users WHERE email = ? LIMIT 1;', [email]))[0];
      if (!user) return res.json({ message: 'If the email is registered, a password reset code has been sent.' });
      if (!user.emailVerified) return res.status(400).json({ error: 'This email is not verified yet. Please register or verify first.' });
      const code = createVerificationCode();
      await d1Query('UPDATE app_users SET resetCodeHash = ?, resetExpires = ?, updatedAt = ? WHERE id = ?;', [await hashValue(code), new Date(Date.now() + 10 * 60 * 1000).toISOString(), now(), user.id]);
      await sendResetMail(user.email, user.name, code);
      return res.json({ message: 'Password reset code sent to your email.' });
    }

    if (slug === 'auth/reset-password' && method === 'POST') {
      const email = String(req.body.email || '').trim().toLowerCase();
      const code = String(req.body.code || '').trim();
      const newPassword = String(req.body.newPassword || '');
      if (newPassword.length < 6) return res.status(400).json({ error: 'Password must be at least 6 characters' });
      const user = (await d1Query('SELECT * FROM app_users WHERE email = ? LIMIT 1;', [email]))[0];
      if (!user) return res.status(404).json({ error: 'Account not found' });
      if (!user.resetExpires || new Date(user.resetExpires).getTime() < Date.now()) return res.status(400).json({ error: 'Reset code expired' });
      if (user.resetCodeHash !== await hashValue(code)) return res.status(400).json({ error: 'Invalid reset code' });
      const { salt, passwordHash } = await hashPassword(newPassword);
      await d1Query('UPDATE app_users SET salt = ?, passwordHash = ?, resetCodeHash = ?, resetExpires = NULL, updatedAt = ? WHERE id = ?;', [salt, passwordHash, '', now(), user.id]);
      return res.json({ message: 'Password has been reset successfully' });
    }

    if (slug === 'auth/me' && method === 'GET') {
      const user = await requireUser(req, res);
      if (!user) return;
      return res.json({ user: { id: user.id, name: user.name, email: user.email } });
    }

    if (slug === 'auth/profile' && method === 'PUT') {
      const user = await requireUser(req, res);
      if (!user) return;
      const name = String(req.body.name || '').trim();
      if (!name) return res.status(400).json({ error: 'Name is required' });
      await d1Query('UPDATE app_users SET name = ?, updatedAt = ? WHERE id = ?;', [name, now(), user.id]);
      return res.json({ message: 'Profile updated successfully', user: { id: user.id, name, email: user.email } });
    }

    if (slug === 'auth/change-password' && method === 'PUT') {
      const sessionUser = await requireUser(req, res);
      if (!sessionUser) return;
      const currentPassword = String(req.body.currentPassword || '');
      const newPassword = String(req.body.newPassword || '');
      if (newPassword.length < 6) return res.status(400).json({ error: 'New password must be at least 6 characters' });
      const user = (await d1Query('SELECT * FROM app_users WHERE id = ? LIMIT 1;', [sessionUser.id]))[0];
      if (!(await verifyPassword(currentPassword, user.salt, user.passwordHash))) return res.status(400).json({ error: 'Incorrect current password' });
      const { salt, passwordHash } = await hashPassword(newPassword);
      await d1Query('UPDATE app_users SET salt = ?, passwordHash = ?, updatedAt = ? WHERE id = ?;', [salt, passwordHash, now(), user.id]);
      return res.json({ message: 'Password changed successfully' });
    }

    if (slug === 'auth/profile' && method === 'DELETE') {
      const user = await requireUser(req, res);
      if (!user) return;
      const uid = user.id;
      await deleteAllUserFiles(uid);
      for (const table of ['bookmarks', 'notebooks', 'codes', 'questions', 'categories', 'routines', 'ai_settings', 'chat_history', 'budgets', 'expenses', 'transfers', 'share_links', 'uploaded_files', 'doc_notes']) {
        await d1Query(`DELETE FROM ${table} WHERE userId = ?;`, [uid]);
      }
      await d1Query('DELETE FROM app_users WHERE id = ?;', [uid]);
      return res.json({ message: 'Account deleted permanently' });
    }

    if (slug === 'history' || slug === 'chat-history' || slug === 'chat_history') {
      const user = await requireUser(req, res);
      if (!user) return;
      const uid = userId(user);
      if (method === 'GET') {
        const row = (await d1Query('SELECT messages FROM chat_history WHERE userId = ? LIMIT 1;', [uid]))[0];
        return res.json({ messages: fromJson(row?.messages, []) });
      }
      if (method === 'PUT') {
        const messages = cleanChatMessages(req.body.messages);
        const stamp = now();
        await d1Query(`INSERT INTO chat_history (id, userId, messages, createdAt, updatedAt)
          VALUES (?, ?, ?, ?, ?)
          ON CONFLICT(userId) DO UPDATE SET messages = excluded.messages, updatedAt = excluded.updatedAt;`, [newId(), uid, toJson(messages), stamp, stamp]);
        return res.json({ messages });
      }
      if (method === 'DELETE') {
        await d1Query('DELETE FROM chat_history WHERE userId = ?;', [uid]);
        return res.json({ message: 'History cleared' });
      }
    }

    if (slug === 'stats' && method === 'GET') {
      const user = await requireUser(req, res);
      if (!user) return;
      const uid = userId(user);
      const rows = await d1Query(`
        SELECT 
          (SELECT COUNT(*) FROM bookmarks WHERE userId = ?) AS bookmarks,
          (SELECT COUNT(*) FROM notebooks WHERE userId = ?) AS notebooks,
          (SELECT COUNT(*) FROM codes WHERE userId = ?) AS codes,
          (SELECT COUNT(*) FROM questions WHERE userId = ?) AS questions,
          (SELECT COUNT(*) FROM questions WHERE userId = ? AND isSolved = 1) AS solved
      `, [uid, uid, uid, uid, uid]);
      const stats = rows[0] || { bookmarks: 0, notebooks: 0, codes: 0, questions: 0, solved: 0 };
      const ninetyDaysAgo = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString();
      const heatmapRows = await d1Query(`
        SELECT date, SUM(count) AS count FROM (
          SELECT substr(createdAt, 1, 10) AS date, COUNT(*) AS count FROM bookmarks WHERE userId = ? AND createdAt >= ? GROUP BY date
          UNION ALL
          SELECT substr(createdAt, 1, 10) AS date, COUNT(*) AS count FROM notebooks WHERE userId = ? AND createdAt >= ? GROUP BY date
          UNION ALL
          SELECT substr(createdAt, 1, 10) AS date, COUNT(*) AS count FROM codes WHERE userId = ? AND createdAt >= ? GROUP BY date
          UNION ALL
          SELECT substr(createdAt, 1, 10) AS date, COUNT(*) AS count FROM questions WHERE userId = ? AND createdAt >= ? GROUP BY date
        ) GROUP BY date ORDER BY date ASC;
      `, [uid, ninetyDaysAgo, uid, ninetyDaysAgo, uid, ninetyDaysAgo, uid, ninetyDaysAgo]);
      stats.heatmap = heatmapRows.map((row) => ({ date: row.date, count: Number(row.count) }));
      return res.json(stats);
    }

    if (slug === 'search' && method === 'GET') {
      const user = await requireUser(req, res);
      if (!user) return;
      const q = String(query.q || '').trim();
      if (!q) return res.json([]);
      const uid = userId(user);
      const term = like(q);

      const sources = [
        { table: 'bookmarks', cols: 'id, title, url AS subtitle', where: 'title LIKE ? OR url LIKE ? OR description LIKE ? OR category LIKE ? OR tags LIKE ?', params: [term, term, term, term, term], type: 'Bookmark', to: '/bookmarks' },
        { table: 'notebooks', cols: 'id, title, category AS subtitle', where: 'title LIKE ? OR content LIKE ? OR category LIKE ? OR tags LIKE ?', params: [term, term, term, term], type: 'Note', to: '/notebooks' },
        { table: 'codes', cols: 'id, title, language AS subtitle', where: 'title LIKE ? OR code LIKE ? OR description LIKE ? OR category LIKE ? OR tags LIKE ?', params: [term, term, term, term, term], type: 'Code', to: '/codes' },
        { table: 'questions', cols: 'id, title, platform AS subtitle', where: 'title LIKE ? OR problem LIKE ? OR platform LIKE ? OR category LIKE ?', params: [term, term, term, term], type: 'Q&A', to: '/questions' },
        { table: 'uploaded_files', cols: 'id, name AS title, mimeType AS subtitle', where: 'name LIKE ?', params: [term], type: 'File', to: '/files' },
        { table: 'expenses', cols: 'id, title, category AS subtitle', where: 'title LIKE ? OR category LIKE ? OR notes LIKE ?', params: [term, term, term], type: 'Expense', to: '/hisab' },
        { table: 'transfers', cols: 'id, person AS title, reason AS subtitle', where: 'person LIKE ? OR reason LIKE ? OR notes LIKE ?', params: [term, term, term], type: 'Transfer', to: '/hisab' },
        { table: 'roadmaps', cols: 'id, title, duration AS subtitle', where: 'title LIKE ? OR description LIKE ? OR category LIKE ?', params: [term, term, term], type: 'Roadmap', to: '/progress' },
      ];

      const results = [];
      await Promise.all(sources.map(async (src) => {
        try {
          const rows = await d1Query(
            `SELECT ${src.cols} FROM ${src.table} WHERE userId = ? AND (${src.where}) ORDER BY createdAt DESC LIMIT 5;`,
            [uid, ...src.params]
          );
          for (const row of rows) {
            results.push({ id: row.id, type: src.type, title: row.title, subtitle: row.subtitle, to: src.to });
          }
        } catch {}
      }));

      return res.json(results);
    }

    if (slug === 'ai-settings') {
      const user = await requireUser(req, res);
      if (!user) return;
      const uid = userId(user);
      const singleton = `user:${uid}`;
      if (method === 'GET') {
        let row = (await d1Query('SELECT * FROM ai_settings WHERE userId = ? AND singleton = ? LIMIT 1;', [uid, singleton]))[0];
        if (!row) {
          const stamp = now();
          await d1Query(`INSERT INTO ai_settings (id, userId, singleton, provider, geminiKey, geminiModel, openRouterKey, openRouterModel, openAiKey, openAiModel, multimodalEnabled, models, createdAt, updatedAt)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?);`, [newId(), uid, singleton, aiDefaults.provider, '', aiDefaults.geminiModel, '', aiDefaults.openRouterModel, '', aiDefaults.openAiModel, 1, '[]', stamp, stamp]);
          row = (await d1Query('SELECT * FROM ai_settings WHERE userId = ? AND singleton = ? LIMIT 1;', [uid, singleton]))[0];
        }
        return res.json(mapBase(row));
      }
      if (method === 'PUT') {
        const body = { ...aiDefaults, ...req.body };
        const stamp = now();
        await d1Query(`INSERT INTO ai_settings (id, userId, singleton, provider, geminiKey, geminiModel, openRouterKey, openRouterModel, openAiKey, openAiModel, multimodalEnabled, models, createdAt, updatedAt)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
          ON CONFLICT(userId, singleton) DO UPDATE SET provider = excluded.provider, geminiKey = excluded.geminiKey, geminiModel = excluded.geminiModel,
          openRouterKey = excluded.openRouterKey, openRouterModel = excluded.openRouterModel, openAiKey = excluded.openAiKey, openAiModel = excluded.openAiModel,
          multimodalEnabled = excluded.multimodalEnabled, models = excluded.models, updatedAt = excluded.updatedAt;`, [
          newId(), uid, singleton, body.provider, body.geminiKey || '', body.geminiModel || aiDefaults.geminiModel,
          body.openRouterKey || '', body.openRouterModel || aiDefaults.openRouterModel, body.openAiKey || '', body.openAiModel || aiDefaults.openAiModel,
          bool(body.multimodalEnabled !== false), toJson(body.models || []), stamp, stamp,
        ]);
        const row = (await d1Query('SELECT * FROM ai_settings WHERE userId = ? AND singleton = ? LIMIT 1;', [uid, singleton]))[0];
        return res.json(mapBase(row));
      }
    }

    if (slug === 'bookmarks/meta' && method === 'GET') {
      const user = await requireUser(req, res);
      if (!user) return;
      const targetUrl = String(query.url || '').trim();
      if (!targetUrl) return res.status(400).json({ error: 'URL is required' });
      const meta = await getMetadata(targetUrl);
      return res.json(meta);
    }

    if (slug === 'questions/meta' && method === 'GET') {
      const user = await requireUser(req, res);
      if (!user) return;
      const targetUrl = String(query.url || '').trim();
      if (!targetUrl) return res.status(400).json({ error: 'URL is required' });
      const meta = await getQuestionMetadata(targetUrl);
      return res.json(meta);
    }

    if (slug === 'expenses/summary' && method === 'GET') {
      const user = await requireUser(req, res);
      if (!user) return;
      const uid = userId(user);
      const month = /^\d{4}-\d{2}$/.test(String(query.month || '')) ? String(query.month).slice(0, 7) : new Date().toISOString().slice(0, 7);
      const where = 'userId = ? AND substr(date, 1, 7) = ?';
      const params = [uid, month];
      const totalRows = await d1Query(`SELECT COALESCE(SUM(amount), 0) AS totalAmount, COUNT(*) AS totalCount FROM expenses WHERE ${where};`, params);
      const categoryRows = await d1Query(`SELECT category, COALESCE(SUM(amount), 0) AS amount, COUNT(*) AS count FROM expenses WHERE ${where} GROUP BY category ORDER BY amount DESC;`, params);
      const recentRows = await d1Query(`SELECT title, amount, category, date, method FROM expenses WHERE ${where} ORDER BY date DESC, createdAt DESC LIMIT 35;`, params);
      return res.json({
        totalAmount: Number(totalRows[0]?.totalAmount || 0),
        totalCount: Number(totalRows[0]?.totalCount || 0),
        categories: categoryRows.map((row) => ({ category: row.category, amount: Number(row.amount || 0), count: Number(row.count || 0) })),
        recent: recentRows.map((row) => ({ ...row, amount: Number(row.amount || 0) })),
      });
    }

    if (slug === 'transfers/summary' && method === 'GET') {
      const user = await requireUser(req, res);
      if (!user) return;
      const uid = userId(user);
      const month = /^\d{4}-\d{2}$/.test(String(query.month || '')) ? String(query.month).slice(0, 7) : new Date().toISOString().slice(0, 7);
      const where = 'userId = ? AND substr(date, 1, 7) = ?';
      const params = [uid, month];
      const totalRows = await d1Query(`SELECT COALESCE(SUM(amount), 0) AS totalAmount, COUNT(*) AS totalCount FROM transfers WHERE ${where};`, params);
      const personRows = await d1Query(`SELECT person, COALESCE(SUM(amount), 0) AS amount, COUNT(*) AS count FROM transfers WHERE ${where} GROUP BY person ORDER BY amount DESC;`, params);
      const recentRows = await d1Query(`SELECT person, amount, reason, date, method FROM transfers WHERE ${where} ORDER BY date DESC, createdAt DESC LIMIT 50;`, params);
      return res.json({
        totalAmount: Number(totalRows[0]?.totalAmount || 0),
        totalCount: Number(totalRows[0]?.totalCount || 0),
        persons: personRows.map((row) => ({ person: row.person, amount: Number(row.amount || 0), count: Number(row.count || 0) })),
        recent: recentRows.map((row) => ({ ...row, amount: Number(row.amount || 0) })),
      });
    }

    if (slug === 'doc-notes') {
      const user = await requireUser(req, res);
      if (!user) return;
      const uid = userId(user);

      if (method === 'GET') {
        const categoryId = String(query.categoryId || '');
        const chapterId = String(query.chapterId || '');
        if (!categoryId || !chapterId) return res.json({ notes: {} });
        const rows = await d1Query(
          'SELECT sectionId, content FROM doc_notes WHERE userId = ? AND categoryId = ? AND chapterId = ?;',
          [uid, categoryId, chapterId]
        );
        const notes = {};
        for (const row of rows) {
          notes[row.sectionId] = row.content;
        }
        return res.json({ notes });
      }

      if (method === 'PUT') {
        const { categoryId, chapterId, sectionId, content } = req.body;
        if (!categoryId || !chapterId || !sectionId) {
          return res.status(400).json({ error: 'categoryId, chapterId, sectionId are required' });
        }
        const text = String(content || '').trim();
        const stamp = now();
        if (text) {
          await d1Query(
            `INSERT INTO doc_notes (id, userId, categoryId, chapterId, sectionId, content, createdAt, updatedAt)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?)
             ON CONFLICT(userId, categoryId, chapterId, sectionId) DO UPDATE SET content = excluded.content, updatedAt = excluded.updatedAt;`,
            [newId(), uid, categoryId, chapterId, sectionId, text, stamp, stamp]
          );
        } else {
          await d1Query(
            'DELETE FROM doc_notes WHERE userId = ? AND categoryId = ? AND chapterId = ? AND sectionId = ?;',
            [uid, categoryId, chapterId, sectionId]
          );
        }
        return res.json({ message: 'Saved' });
      }
    }

    if (slug === 'doc-progress') {
      const user = await requireUser(req, res);
      if (!user) return;
      const uid = userId(user);

      if (method === 'GET') {
        const rows = await d1Query(
          'SELECT categoryId, readIds FROM doc_progress WHERE userId = ?;',
          [uid]
        );
        const progress = {};
        for (const row of rows) {
          progress[row.categoryId] = fromJson(row.readIds, []);
        }
        return res.json({ progress });
      }

      if (method === 'PUT') {
        const { categoryId, readIds } = req.body;
        if (!categoryId) {
          return res.status(400).json({ error: 'categoryId is required' });
        }
        const ids = Array.isArray(readIds) ? readIds.filter((x) => typeof x === 'string') : [];
        const payload = JSON.stringify(ids);
        const stamp = now();
        await d1Query(
          `INSERT INTO doc_progress (id, userId, categoryId, readIds, createdAt, updatedAt)
           VALUES (?, ?, ?, ?, ?, ?)
           ON CONFLICT(userId, categoryId) DO UPDATE SET readIds = excluded.readIds, updatedAt = excluded.updatedAt;`,
          [newId(), uid, categoryId, payload, stamp, stamp]
        );
        return res.json({ message: 'Saved', readIds: ids });
      }
    }

    const parts = slug.split('/');
    const resource = parts[0];
    const itemId = parts[1] || null;
    if (resources[resource]) {
      const user = await requireUser(req, res);
      if (!user) return;
      const uid = userId(user);
      if (method === 'DELETE' && !itemId && resource === 'routines') {
        if (query.type && query.type !== 'all') await d1Query('DELETE FROM routines WHERE userId = ? AND type = ?;', [uid, String(query.type).trim().toLowerCase()]);
        else await d1Query('DELETE FROM routines WHERE userId = ?;', [uid]);
        return res.json({ message: 'Reset complete' });
      }
      if (!itemId && method === 'GET') return res.json(await listResource(resource, query, uid));
      if (!itemId && method === 'POST') {
        if (resource === 'categories') {
          const name = String(req.body.name || '').trim();
          if (!name) return res.status(400).json({ error: 'Category name is required' });
          const baseSlug = slugify(name);
          let candidate = baseSlug;
          let suffix = 1;
          while ((await d1Query('SELECT id FROM categories WHERE userId = ? AND slug = ? LIMIT 1;', [uid, candidate]))[0]) {
            suffix += 1;
            candidate = `${baseSlug}-${suffix}`;
          }
          return res.status(201).json(await createResource(resource, { ...req.body, name, slug: candidate }, uid));
        }
        return res.status(201).json(await createResource(resource, req.body, uid));
      }
      if (itemId && method === 'GET') {
        const item = await getResource(resource, itemId, uid);
        if (!item) return res.status(404).json({ error: 'Not found' });
        return res.json(item);
      }
      if (itemId && method === 'PUT') {
        const item = await updateResource(resource, itemId, req.body, uid);
        if (!item) return res.status(404).json({ error: 'Not found' });
        return res.json(item);
      }
      if (itemId && method === 'DELETE') {
        await deleteResource(resource, itemId, uid);
        return res.json({ message: 'Deleted' });
      }
    }

    return res.status(404).json({ error: 'Not found' });
  } catch (error) {
    return res.status(500).json({ error: error instanceof Error ? error.message : 'API error' });
  }
}
