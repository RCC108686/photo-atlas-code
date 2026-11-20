import { mkdir, readdir, rm } from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const here = path.dirname(fileURLToPath(import.meta.url))
const root = path.resolve(here, '..')
const contentRoot = path.join(root, 'content', 'entries')

const items = await readdir(contentRoot, { withFileTypes: true }).catch(() => [])
const demos = items.filter((item) => item.isDirectory() && item.name.startsWith('demo-'))

for (const demo of demos) {
  await rm(path.join(contentRoot, demo.name), { recursive: true, force: true })
}

console.log(`[demo] 已删除 ${demos.length} 组示例数据，运行 npm run catalog 更新索引`)
