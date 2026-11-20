import { rm } from 'node:fs/promises'
import path from 'node:path'
import { root } from './env.mjs'

const mediaBase = (process.env.PHOTO_MEDIA_BASE || '').trim()

if (!/^https?:\/\//i.test(mediaBase)) {
  console.log('[build] 未配置 PHOTO_MEDIA_BASE，保留 dist/media（图片随站点一起部署）')
} else {
  await rm(path.join(root, 'dist', 'media'), { recursive: true, force: true })
  console.log(`[build] 图片走 ${mediaBase}，已移除 dist/media`)
}
