import { d1Query, setDbBinding } from '../api/_lib/d1.js';

function formatBytes(bytes) {
  if (!+bytes) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`;
}

export async function onRequest(context) {
  const { request, env, next } = context;
  const url = new URL(request.url);
  const path = url.pathname;

  let shareCode = null;
  let explicitType = null;
  let explicitId = null;

  const urlParts = path.split('/').filter(Boolean);
  if (urlParts.length === 2 && ['files', 'notebooks', 'codes', 'questions', 'bookmarks', 'share'].includes(urlParts[0])) {
    shareCode = urlParts[1];
  } else if (urlParts.length === 3 && urlParts[0] === 'share') {
    explicitType = urlParts[1];
    explicitId = urlParts[2];
  }

  if (!shareCode && !explicitId) {
    return next();
  }

  if (env.DB) {
    globalThis.APP_ENV = env;
    setDbBinding(env.DB);
  }

  let title = 'BookmarkVault — Study Hub & Knowledge Vault';
  let description = 'BookmarkVault — Your personal study hub and knowledge vault. Save bookmarks, files, notes, code snippets, questions, routines, and budgets in one clean workspace.';

  try {
    let item = null;
    let resourceType = '';
    
    if (shareCode) {
       const row = (await d1Query('SELECT * FROM share_links WHERE code = ? LIMIT 1;', [shareCode]))[0];
       if (row) {
         resourceType = row.type;
         const res = (await d1Query(`SELECT * FROM ${resourceType} WHERE id = ? LIMIT 1;`, [row.itemId]))[0];
         if (res) item = res;
       }
    } else if (explicitId) {
       const resourceMap = {
         files: 'uploaded_files',
         notebooks: 'notebooks',
         codes: 'codes',
         questions: 'questions',
         bookmarks: 'bookmarks'
       };
       resourceType = resourceMap[explicitType] || explicitType;
       
       const shareExists = (await d1Query('SELECT id FROM share_links WHERE type = ? AND itemId = ? LIMIT 1;', [resourceType, explicitId]))[0];
       if (shareExists) {
         const res = (await d1Query(`SELECT * FROM ${resourceType} WHERE id = ? LIMIT 1;`, [explicitId]))[0];
         if (res) item = res;
       }
    }

    if (item) {
       if (resourceType === 'uploaded_files') {
         title = `${item.name} — BookmarkVault File`;
         description = `Shared file: ${item.name} (${formatBytes(item.size)}). Download or view it on BookmarkVault.`;
       } else if (resourceType === 'notebooks') {
         title = `${item.title} — BookmarkVault Note`;
         description = `Shared note: ${item.title}. Read it on BookmarkVault.`;
       } else if (resourceType === 'codes') {
         title = `${item.title} — BookmarkVault Code Snippet`;
         description = `Shared code snippet: ${item.title} (${item.language}). View it on BookmarkVault.`;
       } else if (resourceType === 'bookmarks') {
         title = `${item.title} — BookmarkVault Bookmark`;
         description = `Shared bookmark: ${item.title} - ${item.url}`;
       } else if (resourceType === 'questions') {
         title = `${item.title} — BookmarkVault Question`;
         description = `Shared problem: ${item.title} (${item.difficulty}). View details on BookmarkVault.`;
       }
    }
  } catch (error) {
    // Ignore DB errors and serve default HTML
  }

  const response = await next();
  const contentType = response.headers.get('content-type') || '';
  
  if (contentType.includes('text/html')) {
    return new HTMLRewriter()
      .on('title', {
        element(e) {
          e.setInnerContent(title);
        }
      })
      .on('meta[name="description"]', {
        element(e) {
          e.setAttribute('content', description);
        }
      })
      .on('head', {
        element(e) {
          e.append(`<meta property="og:title" content="${title.replace(/"/g, '&quot;')}">`, { html: true });
          e.append(`<meta property="og:description" content="${description.replace(/"/g, '&quot;')}">`, { html: true });
          e.append(`<meta property="og:type" content="website">`, { html: true });
        }
      })
      .transform(response);
  }

  return response;
}
