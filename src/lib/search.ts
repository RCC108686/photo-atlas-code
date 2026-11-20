import Fuse from 'fuse.js'
import type { EntrySummary } from '@/types'

export function createSearch(entries: EntrySummary[]): Fuse<EntrySummary> {
  return new Fuse(entries, {
    keys: [
      { name: 'title', weight: 0.45 },
      { name: 'tags', weight: 0.25 },
      { name: 'category', weight: 0.15 },
      { name: 'location', weight: 0.1 },
      { name: 'summary', weight: 0.05 },
    ],
    threshold: 0.34,
    ignoreLocation: true,
    minMatchCharLength: 1,
    includeScore: true,
  })
}
