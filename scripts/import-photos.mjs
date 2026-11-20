import { access, copyFile, mkdir, readdir, writeFile } from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const here = path.dirname(fileURLToPath(import.meta.url))
const root = path.resolve(here, '..')
const contentRoot = path.join(root, 'content', 'entries')

const DRY = process.argv.includes('--dry')

// 需要导入的源目录；year 决定排序用的日期，按需修改
const SOURCES = [
  { dir: 'D:/新建文件夹/我的项目/秋季', category: '秋季', prefix: 'autumn', year: 2026 },
  { dir: 'D:/新建文件夹/我的项目/夏季', category: '夏季', prefix: 'summer', year: 2026 },
]

const NAME_RE = /^(\d{1,2})月(\d{1,2})日?(.*)$/
const IMAGE_EXT = new Set(['.jpg', '.jpeg', '.png', '.webp', '.avif'])

const pad = (value) => String(value).padStart(2, '0')

function slugify(text) {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
}

const used = new Set()
const report = []

for (const source of SOURCES) {
  let items = []
  try {
    items = await readdir(source.dir, { withFileTypes: true })
  } catch {
    console.warn(`[import] 找不到目录，已跳过：${source.dir}`)
    continue
  }

  const files = items
    .filter((item) => item.isFile() && IMAGE_EXT.has(path.extname(item.name).toLowerCase()))
    .map((item) => item.name)
    .sort((a, b) => a.localeCompare(b, 'zh-Hans-CN', { numeric: true }))
    .sort((a, b) => {
      const ma = a.match(NAME_RE)
      const mb = b.match(NAME_RE)
      if (!ma || !mb) return 0
      const ka = Number(ma[1]) * 100 + Number(ma[2])
      const kb = Number(mb[1]) * 100 + Number(mb[2])
      return ka - kb
    })

  let count = 0

  for (const file of files) {
    const ext = path.extname(file).toLowerCase()
    const stem = path.basename(file, ext)
    const match = stem.match(NAME_RE)
    if (!match) {
      console.warn(`[import] 文件名无法解析，已跳过：${file}`)
      continue
    }

    const month = Number(match[1])
    const day = Number(match[2])
    const title = match[3].trim()
    if (!title) {
      console.warn(`[import] 缺少名字，已跳过：${file}`)
      continue
    }

    // 去掉日期，只用名字做标题；id 带日期保证唯一、可排序
    const base = `${source.prefix}-${pad(month)}${pad(day)}`
    const slug = slugify(title)
    const baseId = slug ? `${base}-${slug}` : base

    let id = baseId
    let index = 2
    while (used.has(id)) id = `${baseId}-${index++}`
    used.add(id)

    const entryDir = path.join(contentRoot, id)
    try {
      await access(entryDir)
      console.log(`[import] 已存在，跳过：${id}`)
      continue
    } catch {
      // 不存在，继续创建
    }

    const photoName = `01${ext}`
    const meta = {
      id,
      title,
      category: source.category,
      tags: [source.category],
      date: `${source.year}-${pad(month)}-${pad(day)}`,
      location: '',
      summary: '',
      description: '',
      cover: photoName,
      captions: {},
    }

    if (!DRY) {
      await mkdir(path.join(entryDir, 'photos'), { recursive: true })
      await copyFile(path.join(source.dir, file), path.join(entryDir, 'photos', photoName))
      await writeFile(path.join(entryDir, 'meta.json'), `${JSON.stringify(meta, null, 2)}\n`, 'utf8')
    }

    report.push({ id, title, category: source.category, file })
    count += 1
  }

  console.log(`[import] ${source.category}：处理 ${count} 张`)
}

if (DRY) {
  console.log('\n[import] 预览模式，未写入任何文件：')
}
for (const item of report) {
  console.log(`  ${item.id.padEnd(28)} ${item.title}   ← ${item.file}`)
}
console.log(`\n[import] 共 ${report.length} 组${DRY ? '（预览）' : '已创建'}，下一步运行 npm run catalog`)
