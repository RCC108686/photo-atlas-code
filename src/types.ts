export interface Photo {
  file: string
  thumb: string
  full: string
  width: number
  height: number
  caption?: string
}

export interface EntrySummary {
  id: string
  title: string
  category: string
  tags: string[]
  date: string
  location: string
  summary: string
  demo: boolean
  photoCount: number
  cover: Photo
}

export interface EntryDetail {
  id: string
  description: string
  photos: Photo[]
}

export interface Catalog {
  generatedAt: string
  stats: {
    entries: number
    photos: number
  }
  entries: EntrySummary[]
}
