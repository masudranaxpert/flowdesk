import { d1Query, setDbBinding } from '../api/_lib/d1.js';
import { getDocMeta } from '../api/_lib/docsMeta.js';

function formatBytes(bytes) {
  if (!+bytes) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`;
}

const SECTION_META = {
  '/docs': {
    title: 'Docs — A to Z গাইড | FlowDesk',
    description: 'Python, DSA, Rust, NumPy, Pandas, FastAPI, Docker, PyTorch, Linux, ML, Deep Learning... সম্পূর্ণ বাংলায় কোড সহ A to Z গাইড।',
  },
  '/notebooks': {
    title: 'Notebooks — Study Hub & Knowledge Vault | FlowDesk',
    description: 'Save, manage and organize your study notes and knowledge vault on FlowDesk.',
  },
  '/codes': {
    title: 'Code Book — FlowDesk',
    description: 'Store, organize and search code snippets with syntax highlighting on FlowDesk.',
  },
  '/questions': {
    title: 'Questions & Problem Tracker — FlowDesk',
    description: 'Practice and track problem-solving and interview questions on FlowDesk.',
  },
  '/bookmarks': {
    title: 'Bookmarks Vault — FlowDesk',
    description: 'Organize your web bookmarks, links and resources in one clean workspace.',
  },
  '/files': {
    title: 'Files & Cloud Vault — FlowDesk',
    description: 'Upload, store and share your files safely with FlowDesk.',
  },
  '/hisab': {
    title: 'Hisab & Expense Tracker — FlowDesk',
    description: 'Track daily expenses, budgets, and transfers easily on FlowDesk.',
  },
  '/routine': {
    title: 'Routine & Habit Tracker — FlowDesk',
    description: 'Track your daily routine, habits, tasks, and productivity on FlowDesk.',
  },
  '/chatbot': {
    title: 'AI Assistant Chat — FlowDesk',
    description: 'Chat with AI for study assistance, code debugging, and note summarization.',
  },
};

export async function onRequest(context) {
  const { request, env, next } = context;
  const url = new URL(request.url);
  const path = url.pathname;

  let title = 'FlowDesk — Study Hub & Knowledge Vault';
  let description = 'FlowDesk — Your personal study hub and knowledge vault. Save bookmarks, files, notes, code snippets, questions, routines, and budgets in one clean workspace.';

  const docMeta = getDocMeta(path);
  if (docMeta) {
    title = docMeta.title;
    description = docMeta.description;
  } else if (SECTION_META[path]) {
    title = SECTION_META[path].title;
    description = SECTION_META[path].description;
  } else {
    // Check share links or dynamic items
    let shareCode = null;
    let explicitType = null;
    let explicitId = null;

    const urlParts = path.split('/').filter(Boolean);
    if (urlParts.length === 2 && ['files', 'notebooks', 'codes', 'questions', 'bookmarks', 'share'].includes(urlParts[0])) {
      shareCode = urlParts[1];
    } else if (urlParts.length === 3 && urlParts[0] === 'share' && urlParts[1] !== 'player') {
      explicitType = urlParts[1];
      explicitId = urlParts[2];
    } else if (urlParts[0] === 'share' && urlParts[1] === 'player') {
      if (urlParts.length === 3) {
        shareCode = urlParts[2];
      } else if (urlParts.length === 4) {
        explicitType = urlParts[2];
        explicitId = urlParts[3];
      }
    } else if (urlParts.length === 2 && urlParts[0] === 'player') {
      explicitType = 'files';
      explicitId = urlParts[1];
    }

    if (shareCode || explicitId) {
      if (env.DB) {
        globalThis.APP_ENV = env;
        setDbBinding(env.DB);
      }

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
            bookmarks: 'bookmarks',
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
            title = `${item.name} — FlowDesk File`;
            description = `Shared file: ${item.name} (${formatBytes(item.size)}). Download or view it on FlowDesk.`;
          } else if (resourceType === 'notebooks') {
            title = `${item.title} — FlowDesk Note`;
            description = `Shared note: ${item.title}. Read it on FlowDesk.`;
          } else if (resourceType === 'codes') {
            title = `${item.title} — FlowDesk Code Snippet`;
            description = `Shared code snippet: ${item.title} (${item.language}). View it on FlowDesk.`;
          } else if (resourceType === 'bookmarks') {
            title = `${item.title} — FlowDesk Bookmark`;
            description = `Shared bookmark: ${item.title} - ${item.url}`;
          } else if (resourceType === 'questions') {
            title = `${item.title} — FlowDesk Question`;
            description = `Shared problem: ${item.title} (${item.difficulty}). View details on FlowDesk.`;
          }
        }
      } catch (error) {
        // Ignore DB errors and fallback to default HTML
      }
    }
  }

  const response = await next();
  const contentType = response.headers.get('content-type') || '';

  if (contentType.includes('text/html')) {
    const fullUrl = url.href;

    return new HTMLRewriter()
      .on('title', {
        element(e) {
          e.setInnerContent(title);
        },
      })
      .on('meta[name="description"]', {
        element(e) {
          e.setAttribute('content', description);
        },
      })
      .on('head', {
        element(e) {
          e.append(`<meta property="og:site_name" content="FlowDesk">`, { html: true });
          e.append(`<meta property="og:type" content="website">`, { html: true });
          e.append(`<meta property="og:url" content="${fullUrl.replace(/"/g, '&quot;')}">`, { html: true });
          e.append(`<meta property="og:title" content="${title.replace(/"/g, '&quot;')}">`, { html: true });
          e.append(`<meta property="og:description" content="${description.replace(/"/g, '&quot;')}">`, { html: true });
          e.append(`<meta name="twitter:card" content="summary">`, { html: true });
          e.append(`<meta name="twitter:title" content="${title.replace(/"/g, '&quot;')}">`, { html: true });
          e.append(`<meta name="twitter:description" content="${description.replace(/"/g, '&quot;')}">`, { html: true });
        },
      })
      .transform(response);
  }

  return response;
}
