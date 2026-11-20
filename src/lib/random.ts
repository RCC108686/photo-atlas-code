import type { EntrySummary } from '@/types'

const SEEN_KEY = 'atlas:seen:v1'
const SEEN_LIMIT = 60

function readSeen(): string[] {
  try {
    const raw = localStorage.getItem(SEEN_KEY)
    if (!raw) return []
    const parsed: unknown = JSON.parse(raw)
    return Array.isArray(parsed) ? parsed.filter((item): item is string => typeof item === 'string') : []
  } catch {
    return []
  }
}

function writeSeen(ids: string[]): void {
  try {
    localStorage.setItem(SEEN_KEY, JSON.stringify(ids.slice(-SEEN_LIMIT)))
  } catch {
    // 隐私模式下忽略
  }
}

function shuffle<T>(items: T[]): T[] {
  const copy = items.slice()
  for (let index = copy.length - 1; index > 0; index -= 1) {
    const randomIndex = Math.floor(Math.random() * (index + 1))
    ;[copy[index], copy[randomIndex]] = [copy[randomIndex], copy[index]]
  }
  return copy
}

interface PickOptions {
  exclude?: Iterable<string>
  remember?: boolean
}

export function pickEntries(
  entries: EntrySummary[],
  count: number,
  options: PickOptions = {},
): EntrySummary[] {
  const exclude = new Set(options.exclude ?? [])
  const seen = new Set(readSeen())
  const blocked = new Set([...seen, ...exclude])

  let pool = entries.filter((entry) => !blocked.has(entry.id))
  if (pool.length < count) {
    pool = entries.filter((entry) => !exclude.has(entry.id))
  }
  if (!pool.length) {
    pool = entries.slice()
  }

  const picked = shuffle(pool).slice(0, Math.min(count, pool.length))
  if (options.remember) {
    writeSeen([...readSeen(), ...picked.map((entry) => entry.id)])
  }
  return picked
}
