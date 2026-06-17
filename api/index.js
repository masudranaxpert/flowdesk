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

const resources = {
  bookmarks: {
    table: 'bookmarks',
    columns: ['url', 'title', 'description', 'favicon', 'tags', 'category', 'isFavorite'],
    defaults: { description: '', favicon: '', tags: [], category: 'general', isFavorite: false },
    search: ['title', 'url', 'tags'],
    sort: 'createdAt DESC',
  },
  notebooks: {
    table: 'notebooks',
    columns: ['title', 'content', 'tags', 'category', 'isPinned'],
    defaults: { content: '', tags: [], category: 'general', isPinned: false },
    search: ['title', 'content', 'tags'],
    sort: 'isPinned DESC, updatedAt DESC',
  },
  codes: {
    table: 'codes',
    columns: ['title', 'code', 'language', 'description', 'category', 'tags', 'isFavorite'],
    defaults: { language: 'cpp', description: '', category: 'general', tags: [], isFavorite: false },
    search: ['title', 'code', 'tags'],
    sort: 'createdAt DESC',
  },
  questions: {
    table: 'questions',
    columns: ['title', 'problem', 'solution', 'code', 'language', 'difficulty', 'platform', 'category', 'tags', 'isSolved', 'link'],
    defaults: { problem: '', solution: '', code: '', language: 'cpp', difficulty: 'medium', platform: 'codeforces', category: 'general', tags: [], isSolved: false, link: '' },
    search: ['title', 'tags'],
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
    search: ['title', 'subject', 'teacher', 'room'],
    sort: 'dayOfWeek ASC, date ASC, startTime ASC',
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

function cleanBoolColumn(column, value) {
  return ['isFavorite', 'isPinned', 'isSolved', 'repeatWeekly', 'emailVerified', 'multimodalEnabled'].includes(column) ? bool(value) : value;
}

function cleanJsonColumn(column, value) {
  return ['tags', 'models', 'messages'].includes(column) ? toJson(Array.isArray(value) ? value : []) : value;
}

function cleanValue(column, value) {
  return cleanJsonColumn(column, cleanBoolColumn(column, value));
}

function buildWhere(resource, query, uid) {
  const config = resources[resource];
  const where = ['userId = ?'];
  const params = [uid];
  const add = (sql, value) => {
    where.push(sql);
    params.push(value);
  };

  if (query.search) {
    const parts = config.search.map((column) => `${column} LIKE ?`);
    where.push(`(${parts.join(' OR ')})`);
    params.push(...config.search.map(() => like(query.search)));
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
  if (resource === 'categories') {
    if (query.scope && query.scope !== 'all') {
      where.push('(scope = ? OR scope = ?)');
      params.push('all', query.scope);
    }
  }
  if (resource === 'routines') {
    if (query.type && query.type !== 'all') add('type = ?', query.type);
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
  if (resource === 'categories') {
    const allowedScopes = ['all', 'bookmark', 'notebook', 'code', 'question'];
    if (!partial && !hasCategoryScope) next.scope = 'bookmark';
    if (next.scope !== undefined && !allowedScopes.includes(next.scope)) next.scope = 'bookmark';
    if (!partial) next.name = String(next.name || '').trim() || 'Untitled category';
  }
  if (resource === 'questions' && next.difficulty !== undefined && !['easy', 'medium', 'hard'].includes(next.difficulty)) next.difficulty = 'medium';
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
  if (resource === 'routines' && next.type !== undefined && !['class', 'event'].includes(next.type)) next.type = 'event';
  if (resource === 'routines') {
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
    if (next.dayOfWeek !== undefined) next.dayOfWeek = Math.max(0, Math.min(6, Number(next.dayOfWeek ?? 0)));
    if (next.repeatWeekly !== undefined) next.repeatWeekly = next.repeatWeekly !== false;
  }
  return next;
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
  return getResource(resource, id, uid);
}

async function deleteResource(resource, id, uid) {
  const config = resources[resource];
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
      for (const table of ['bookmarks', 'notebooks', 'codes', 'questions', 'categories', 'routines', 'ai_settings', 'chat_history']) {
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
        const messages = Array.isArray(req.body.messages) ? req.body.messages.slice(-50) : [];
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
      const rows = await d1Query(`
        (SELECT 'bookmarks' AS type, id, title, url AS subtitle FROM bookmarks WHERE userId = ? AND (title LIKE ? OR url LIKE ? OR tags LIKE ?) ORDER BY createdAt DESC LIMIT 5)
        UNION ALL
        (SELECT 'notebooks' AS type, id, title, category AS subtitle FROM notebooks WHERE userId = ? AND (title LIKE ? OR content LIKE ? OR tags LIKE ?) ORDER BY updatedAt DESC LIMIT 5)
        UNION ALL
        (SELECT 'codes' AS type, id, title, language AS subtitle FROM codes WHERE userId = ? AND (title LIKE ? OR code LIKE ? OR tags LIKE ?) ORDER BY createdAt DESC LIMIT 5)
        UNION ALL
        (SELECT 'questions' AS type, id, title, platform AS subtitle FROM questions WHERE userId = ? AND (title LIKE ? OR tags LIKE ?) ORDER BY createdAt DESC LIMIT 5)
      `, [uid, term, term, term, uid, term, term, term, uid, term, term, term, uid, term, term]);
      return res.json(
        rows.map((row) => ({
          id: row.id,
          type: row.type === 'bookmarks' ? 'Bookmark' : row.type === 'notebooks' ? 'Note' : row.type === 'codes' ? 'Code' : 'Q&A',
          title: row.title,
          subtitle: row.subtitle,
          to: row.type === 'bookmarks' ? '/bookmarks' : row.type === 'notebooks' ? '/notebooks' : row.type === 'codes' ? '/codes' : '/questions',
        }))
      );
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

    const parts = slug.split('/');
    const resource = parts[0];
    const itemId = parts[1] || null;
    if (resources[resource]) {
      const user = await requireUser(req, res);
      if (!user) return;
      const uid = userId(user);
      if (method === 'DELETE' && !itemId && resource === 'routines') {
        if (query.type && query.type !== 'all') await d1Query('DELETE FROM routines WHERE userId = ? AND type = ?;', [uid, query.type]);
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
