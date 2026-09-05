import handler from '../../api/index.js';
import { setDbBinding } from '../../api/_lib/d1.js';

export async function onRequest(context) {
  const { request, env } = context;

  globalThis.APP_ENV = env;

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


  const req = {
    method: request.method,
    headers: Object.fromEntries(request.headers.entries()),
    url: url.pathname + url.search,
    query,
    body,
    rawRequest: request,
  };

  let statusCode = 200;
  const headers = new Headers({
    'Content-Type': 'application/json',
  });
  let responseBody = '';
  let streamBody = null;

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
    },
    stream(stream) {
      streamBody = stream;
      return this;
    }
  };

  try {
    await handler(req, res);
    if (streamBody) {
      return new Response(streamBody, {
        status: statusCode,
        headers,
      });
    }
    return new Response(responseBody, {
      status: statusCode,
      headers,
    });
  } catch (error) {
    console.error('[api] unhandled error:', error);
    return new Response(JSON.stringify({ error: 'Internal Server Error' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}
