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

          const body = await new Promise<unknown>((resolve, reject) => {
            if (req.method === 'GET' || req.method === 'HEAD') return resolve({})
            let raw = ''
            req.on('data', (chunk) => {
              raw += chunk
            })
            req.on('end', () => {
              try {
                resolve(raw ? JSON.parse(raw) : {})
              } catch (error) {
                reject(error)
              }
            })
            req.on('error', reject)
          })

          const query = Object.fromEntries(requestUrl.searchParams.entries())

          ;(req as any).query = query
          ;(req as any).body = body

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
