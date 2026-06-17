import handler from '../../api/index.js';
import { setDbBinding } from '../../api/_lib/d1.js';

export async function onRequest(context) {
  const { request, env } = context;

  if (env.DB) {
    setDbBinding(env.DB);
  }

  const url = new URL(request.url);
  const query = Object.fromEntries(url.searchParams.entries());

  let body = {};
  if (request.method !== 'GET' && request.method !== 'HEAD') {
    try {
      const contentType = request.headers.get('content-type') || '';
      if (contentType.includes('application/json')) {
        body = await request.json();
      }
    } catch (e) {
    }
  }

  if (!globalThis.process) {
    globalThis.process = { env: {} };
  }
  Object.assign(process.env, env);

  const req = {
    method: request.method,
    headers: Object.fromEntries(request.headers.entries()),
    url: url.pathname + url.search,
    query,
    body,
  };

  let statusCode = 200;
  const headers = new Headers({
    'Content-Type': 'application/json',
  });
  let responseBody = '';

  const res = {
    status(code) {
      statusCode = code;
      return this;
    },
    setHeader(name, value) {
      headers.set(name, value);
      return this;
    },
    json(payload) {
      responseBody = JSON.stringify(payload);
      return this;
    },
    end(data) {
      responseBody = data;
      return this;
    }
  };

  try {
    await handler(req, res);
    return new Response(responseBody, {
      status: statusCode,
      headers,
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message || 'Internal Server Error' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}
