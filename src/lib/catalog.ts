import type { Catalog, EntryDetail } from '@/types'

const base = import.meta.env.BASE_URL
let catalogPromise: Promise<Catalog> | null = null
const detailCache = new Map<string, Promise<EntryDetail>>()

async function getJson<T>(url: string): Promise<T> {
  const response = await fetch(url, { cache: 'no-cache' })
  if (!response.ok) {
    throw new Error(`请求失败（${response.status}）`)
  }
  return (await response.json()) as T
}

export function loadCatalog(): Promise<Catalog> {
  if (!catalogPromise) {
    catalogPromise = getJson<Catalog>(`${base}data/catalog.json`)
  }
  return catalogPromise
}

export function loadEntry(id: string): Promise<EntryDetail> {
  let promise = detailCache.get(id)
  if (!promise) {
    promise = getJson<EntryDetail>(`${base}data/entries/${encodeURIComponent(id)}.json`)
    detailCache.set(id, promise)
    promise.catch(() => detailCache.delete(id))
  }
  return promise
}
