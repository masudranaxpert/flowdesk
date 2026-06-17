import { defineConfig, loadEnv, type PluginOption } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import path from 'path'
import { pathToFileURL } from 'url'

function localApiPlugin(): PluginOption {
  return {
    name: 'local-api-functions',
    apply: 'serve',
    configureServer(server) {
      server.middlewares.use('/api', async (req, res, next) => {
        try {
          const requestUrl = new URL(req.url ?? '/', 'http://localhost')
          const apiFile = path.resolve(__dirname, 'api', 'index.js')

          const chunks: Buffer[] = []
          const rawBody = await new Promise<Buffer>((resolve, reject) => {
            if (req.method === 'GET' || req.method === 'HEAD') return resolve(Buffer.alloc(0))
            req.on('data', (chunk) => {
              chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk))
            })
            req.on('end', () => {
              resolve(Buffer.concat(chunks))
            })
            req.on('error', reject)
          })
          const contentType = req.headers['content-type'] || ''
          const body = req.method === 'GET' || req.method === 'HEAD'
            ? {}
            : String(contentType).includes('application/json')
              ? (rawBody.length ? JSON.parse(rawBody.toString('utf8')) : {})
              : {}

          const query = Object.fromEntries(requestUrl.searchParams.entries())

          ;(req as any).query = query
          ;(req as any).body = body
          ;(req as any).rawRequest = new Request(`http://localhost${req.url || ''}`, {
            method: req.method,
            headers: req.headers as HeadersInit,
            body: rawBody.length ? rawBody : undefined,
          })

          let statusCode = 200
          const apiRes = Object.assign(res, {
            status(code: number) {
              statusCode = code
              res.statusCode = code
              return apiRes
            },
            json(payload: unknown) {
              if (!res.headersSent) {
                res.statusCode = statusCode
                res.setHeader('Content-Type', 'application/json')
              }
              res.end(JSON.stringify(payload))
              return apiRes
            },
          })

          const handlerUrl = `${pathToFileURL(apiFile).href}?t=${Date.now()}`
          const mod = await import(handlerUrl)
          await mod.default(req, apiRes)
        } catch (error) {
          res.statusCode = 500
          res.setHeader('Content-Type', 'application/json')
          res.end(JSON.stringify({ error: error instanceof Error ? error.message : 'API error' }))
        }
      })
    },
  }
}

export default defineConfig(({ mode }) => {
  Object.assign(process.env, loadEnv(mode, process.cwd(), ''))

  return {
    plugins: [react(), tailwindcss(), localApiPlugin()],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, './src'),
      },
    },
  }
})
