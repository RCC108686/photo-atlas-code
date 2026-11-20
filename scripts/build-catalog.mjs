import { createReadStream } from 'node:fs'
import { createHash } from 'node:crypto'
import { mkdir, readdir, readFile, rm, stat, writeFile } from 'node:fs/promises'
import path from 'node:path'
import sharp from 'sharp'
import { root } from './env.mjs'

const contentRoot = path.join(root, 'content', 'entries')
const mediaRoot = path.join(root, 'public', 'media')
const dataDir = path.join(root, 'public', 'data')
const catalogFile = path.join(dataDir, 'catalog.json')
const entryDataDir = path.join(dataDir, 'entries')

const FORCE = process.argv.includes('--force')
const VARIANTS = [
  { suffix: '600', width: 600 },
  { suffix: '1600', width: 1600 },
]
const IMAGE_EXT = new Set(['.jpg', '.jpeg', '.png', '.webp', '.avif'])

const RAW_MEDIA_BASE = (process.env.PHOTO_MEDIA_BASE || '').trim().replace(/\/+$/, '')
const MEDIA_BASE = /^https?:\/\//i.test(RAW_MEDIA_BASE) ? RAW_MEDIA_BASE : ''
if (RAW_MEDIA_BASE && !MEDIA_BASE) {
  console.warn('[catalog] PHOTO_MEDIA_BASE 需要是 http(s) 绝对地址，已忽略')
}

function mediaPath(id, fileName) {
  const relative = `media/${id}/${encodeURIComponent(fileName)}`
  return MEDIA_BASE ? `${MEDIA_BASE}/${relative}` : relative
}

async function fileVersion(file) {
  const hash = createHash('sha256')
  for await (const chunk of createReadStream(file)) hash.update(chunk)
  return hash.digest('hex').slice(0, 12)
}


const startedAt = Date.now()
let generated = 0
let reused = 0

function isImage(dirent) {
  return dirent.isFile() && IMAGE_EXT.has(path.extname(dirent.name).toLowerCase())
}

async function readMeta(dir) {
  try {
    return JSON.parse(await readFile(path.join(dir, 'meta.json'), 'utf8'))
  } catch {
    return null
  }
}

async function collectPhotos(dir) {
  for (const sub of ['photos', '']) {
    const base = sub ? path.join(dir, sub) : dir
    try {
      const items = await readdir(base, { withFileTypes: true })
      const names = items.filter(isImage).map((item) => item.name)
      if (names.length) {
        names.sort((a, b) => a.localeCompare(b, 'en', { numeric: true, sensitivity: 'base' }))
        return { base, names }
      }
    } catch {
      // try the next location
    }
  }
  return { base: dir, names: [] }
}

async function ensureVariant(src, sourceStat, outPath, targetWidth, sourceWidth, sourceHeight) {
  let needed = FORCE
  if (!needed) {
    try {
      const outStat = await stat(outPath)
      needed = outStat.size === 0 || outStat.mtimeMs < sourceStat.mtimeMs
    } catch {
      needed = true
    }
  }

  if (needed) {
    await sharp(src, { failOn: 'none' })
      .rotate()
      .resize({ width: Math.min(targetWidth, sourceWidth), withoutEnlargement: true })
      .webp({ quality: 80, effort: 4 })
      .toFile(outPath)
    generated += 1
  } else {
    reused += 1
  }

  const width = Math.min(targetWidth, sourceWidth)
  return { width, height: Math.max(1, Math.round((sourceHeight * width) / sourceWidth)) }
}

await mkdir(mediaRoot, { recursive: true })
await mkdir(dataDir, { recursive: true })

let dirNames = []
try {
  dirNames = (await readdir(contentRoot, { withFileTypes: true }))
    .filter((entry) => entry.isDirectory() && !entry.name.startsWith('.'))
    .map((entry) => entry.name)
} catch {
  console.warn('[catalog] content/entries 不存在，将生成空图鉴')
}
dirNames.sort((a, b) => a.localeCompare(b, 'en', { numeric: true }))

const entries = []
const seenIds = new Set()

for (const dirName of dirNames) {
  const dir = path.join(contentRoot, dirName)
  const meta = await readMeta(dir)
  if (!meta) {
    console.warn(`[catalog] 跳过 ${dirName}：缺少或无法解析 meta.json`)
    continue
  }

  const { base, names } = await collectPhotos(dir)
  if (!names.length) {
    console.warn(`[catalog] 跳过 ${dirName}：没有找到图片`)
    continue
  }

  const id = String(meta.id || dirName).trim()
  if (!id || /[\\/:*?"<>|]/.test(id)) {
    console.warn(`[catalog] 跳过 ${dirName}：id 不合法（${id}）`)
    continue
  }
  if (seenIds.has(id)) {
    console.warn(`[catalog] 跳过 ${dirName}：id 重复（${id}）`)
    continue
  }
  seenIds.add(id)

  const outDir = path.join(mediaRoot, id)
  await mkdir(outDir, { recursive: true })

  const photos = []
  for (const name of names) {
    const src = path.join(base, name)
    const sourceStat = await stat(src)
    const info = await sharp(src, { failOn: 'none' }).metadata()
    const sourceWidth = info.autoOrient?.width ?? info.width ?? 0
    const sourceHeight = info.autoOrient?.height ?? info.height ?? 0
    if (!sourceWidth || !sourceHeight) {
      console.warn(`[catalog] 无法读取尺寸，跳过：${src}`)
      continue
    }

    const stem = path.parse(name).name
    const urls = {}
    for (const variant of VARIANTS) {
      const outName = `${stem}-${variant.suffix}.webp`
      const outPath = path.join(outDir, outName)
      const size = await ensureVariant(src, sourceStat, outPath, variant.width, sourceWidth, sourceHeight)
      urls[variant.suffix] = { path: mediaPath(id, outName), ...size }
    }

    const version = await fileVersion(src)
    photos.push({
      file: name,
      thumb: `${urls['600'].path}?v=${version}`,
      full: `${urls['1600'].path}?v=${version}`,
      width: sourceWidth,
      height: sourceHeight,
      caption: meta.captions?.[name] || undefined,
    })
  }

  if (!photos.length) continue

  const cover = photos.find((photo) => photo.file === meta.cover) ?? photos[0]

  entries.push({
    id,
    title: String(meta.title || dirName),
    category: String(meta.category || '未分类'),
    tags: Array.isArray(meta.tags) ? meta.tags.map(String) : [],
    date: String(meta.date || '').slice(0, 10) || new Date().toISOString().slice(0, 10),
    location: String(meta.location || ''),
    summary: String(meta.summary || ''),
    description: String(meta.description || ''),
    demo: meta.demo === true,
    photoCount: photos.length,
    cover,
    photos,
  })
}

entries.sort((a, b) => {
  if (a.date !== b.date) return a.date < b.date ? 1 : -1
  return a.title.localeCompare(b.title, 'zh-Hans-CN')
})

await rm(entryDataDir, { recursive: true, force: true })
await mkdir(entryDataDir, { recursive: true })

const summaries = []
for (const entry of entries) {
  const { description, photos, ...summary } = entry
  summaries.push(summary)
  await writeFile(
    path.join(entryDataDir, `${entry.id}.json`),
    JSON.stringify({ id: entry.id, description, photos }),
    'utf8',
  )
}

const catalog = {
  generatedAt: new Date().toISOString(),
  stats: {
    entries: entries.length,
    photos: entries.reduce((sum, entry) => sum + entry.photoCount, 0),
  },
  entries: summaries,
}

await writeFile(catalogFile, JSON.stringify(catalog), 'utf8')

const seconds = ((Date.now() - startedAt) / 1000).toFixed(1)
const mediaNote = MEDIA_BASE ? ` · 图片走 ${MEDIA_BASE}` : ''
console.log(
  `[catalog] ${catalog.stats.entries} 组 / ${catalog.stats.photos} 张照片 · 缩略图生成 ${generated}，复用 ${reused} · ${seconds}s${mediaNote}`,
)
