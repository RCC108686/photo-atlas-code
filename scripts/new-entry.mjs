import { access, mkdir, writeFile } from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const here = path.dirname(fileURLToPath(import.meta.url))
const root = path.resolve(here, '..')
const contentRoot = path.join(root, 'content', 'entries')

const [, , rawId, ...titleParts] = process.argv
if (!rawId) {
  console.log('用法: npm run new -- <id> "<标题>"')
  console.log('示例: npm run new -- 2026-05-harbor "五月的港口"')
  process.exit(1)
}

const id = rawId
  .trim()
  .toLowerCase()
  .replace(/[^a-z0-9-_]+/g, '-')
  .replace(/^-+|-+$/g, '')

if (!id) {
  console.error('id 只能包含字母、数字、短横线')
  process.exit(1)
}

const dir = path.join(contentRoot, id)
try {
  await access(dir)
  console.error(`目录已存在: ${dir}`)
  process.exit(1)
} catch {
  // expected
}

await mkdir(path.join(dir, 'photos'), { recursive: true })

const meta = {
  id,
  title: titleParts.join(' ') || id,
  category: '未分类',
  tags: [],
  date: new Date().toISOString().slice(0, 10),
  location: '',
  summary: '',
  description: '',
  cover: '01.jpg',
  captions: {},
}

await writeFile(path.join(dir, 'meta.json'), `${JSON.stringify(meta, null, 2)}\n`, 'utf8')

console.log(`已创建 content/entries/${id}/`)
console.log('下一步：')
console.log('  1. 把照片放进 photos/，按 01.jpg、02.jpg 命名')
console.log('  2. 编辑 meta.json：标题、分类、标签、地点、简介、每张图的说明')
console.log('  3. npm run dev（会自动重建索引和缩略图）')
