import type { Photo } from '@/types'

export function assetUrl(path: string): string {
  if (/^(?:[a-z]+:)?\/\//i.test(path) || path.startsWith('data:') || path.startsWith('blob:')) {
    return path
  }
  return `${import.meta.env.BASE_URL}${path.replace(/^\/+/, '')}`
}

export function formatDate(value: string): string {
  const [year, month, day] = value.split('-')
  return year && month && day ? `${year}.${month}.${day}` : value
}

export function photoSrcSet(photo: Photo): string {
  return `${assetUrl(photo.thumb)} 600w, ${assetUrl(photo.full)} 1600w`
}
