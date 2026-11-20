import { readdir, stat } from 'node:fs/promises'
import path from 'node:path'
import OSS from 'ali-oss'
import { root } from './env.mjs'

const mediaDir = path.join(root, 'public', 'media')
const bucket = process.env.OSS_BUCKET
const region = process.env.OSS_REGION
const endpoint = process.env.OSS_ENDPOINT
const accessKeyId = process.env.OSS_ACCESS_KEY_ID
const accessKeySecret = process.env.OSS_ACCESS_KEY_SECRET
const rawPrefix = process.env.OSS_MEDIA_PREFIX
const prefix = (rawPrefix === undefined ? 'media' : rawPrefix).replace(/^\/+|\/+$/g, '')
const concurrency = Math.max(1, Number(process.env.OSS_CONCURRENCY) || 8)

const missing = [
  ['OSS_BUCKET', bucket],
  ['OSS_ACCESS_KEY_ID', accessKeyId],
  ['OSS_ACCESS_KEY_SECRET', accessKeySecret],
].filter(([, value]) => !value)

if (missing.length || (!region && !endpoint)) {
  console.error('[media:upload] 缺少配置：')
  for (const [name] of missing) console.error(`  - ${name}`)
  if (!region && !endpoint) console.error('  - OSS_REGION 或 OSS_ENDPOINT')
  console.error('复制 .env.example 为 .env 并填好，或直接设置环境变量后再运行。')
  process.exit(1)
}

async function collect(dir) {
  const files = []
  for (const item of await readdir(dir, { withFileTypes: true })) {
    const full = path.join(dir, item.name)
    if (item.isDirectory()) files.push(...(await collect(full)))
    else if (item.isFile() && item.name.toLowerCase().endsWith('.webp')) files.push(full)
  }
  return files
}

let files
try {
  files = await collect(mediaDir)
} catch {
  console.error(`[media:upload] 找不到 ${mediaDir}，先运行 npm run catalog`)
  process.exit(1)
}

if (!files.length) {
  console.error('[media:upload] public/media 里没有 webp，先运行 npm run catalog')
  process.exit(1)
}

const client = new OSS({
  region,
  bucket,
  accessKeyId,
  accessKeySecret,
  ...(endpoint ? { endpoint } : {}),
  secure: true,
})

let cursor = 0
let uploaded = 0
let bytes = 0

async function worker() {
  while (cursor < files.length) {
    const file = files[cursor++]
    const relative = path.relative(mediaDir, file).split(path.sep).join('/')
    const key = prefix ? `${prefix}/${relative}` : relative
    const info = await stat(file)

    await client.put(key, file, {
      mime: 'image/webp',
      headers: {
        'Cache-Control': 'public, max-age=31536000, immutable',
      },
    })

    uploaded += 1
    bytes += info.size
    if (uploaded % 20 === 0 || uploaded === files.length) {
      console.log(`[media:upload] ${uploaded}/${files.length}`)
    }
  }
}

console.log(`[media:upload] ${files.length} 个文件 → oss://${bucket}/${prefix ? `${prefix}/` : ''}`)
await Promise.all(Array.from({ length: Math.min(concurrency, files.length) }, () => worker()))
console.log(`[media:upload] 完成：${uploaded} 个文件，${(bytes / 1024 / 1024).toFixed(1)} MB`)
