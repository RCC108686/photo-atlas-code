import path from 'node:path'
import { fileURLToPath } from 'node:url'

export const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')

if (typeof process.loadEnvFile === 'function') {
  try {
    process.loadEnvFile(path.join(root, '.env'))
  } catch {
    // 没有 .env 时忽略
  }
}
