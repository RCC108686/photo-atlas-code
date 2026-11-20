import { createServer } from 'node:http'
import { readFile, stat } from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', 'dist')
const port = Number(process.env.PORT || 4173)

const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.webp': 'image/webp',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.png': 'image/png',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon',
  '.woff2': 'font/woff2',
}

createServer(async (request, response) => {
  try {
    const url = new URL(request.url ?? '/', 'http://127.0.0.1')
    const requested = path.join(root, decodeURIComponent(url.pathname))

    if (!requested.startsWith(root)) {
      response.writeHead(403).end('Forbidden')
      return
    }

    let filePath = requested
    let info = await stat(filePath).catch(() => null)

    if (!info || info.isDirectory()) {
      const indexFile = path.join(filePath, 'index.html')
      info = await stat(indexFile).catch(() => null)
      filePath = info ? indexFile : path.join(root, 'index.html')
    }

    const body = await readFile(filePath)
    response.writeHead(200, {
      'content-type': MIME[path.extname(filePath).toLowerCase()] ?? 'application/octet-stream',
    })
    response.end(body)
  } catch {
    response.writeHead(404).end('Not found')
  }
}).listen(port, '127.0.0.1', () => {
  console.log(`[preview] http://127.0.0.1:${port}`)
})
