export const MAGAZINE_CATEGORIES = [
  { code: 'VILLAGE_STORY', label: '온천마을 이야기' },
  { code: 'WALKING_GUIDE', label: '뚜벅이 가이드' },
  { code: 'SEASONAL', label: '시즌 추천' },
  { code: 'ONSEN_SCIENCE', label: '온천 과학' },
  { code: 'FOOD', label: '먹거리' },
] as const
export type MagazineCategory = (typeof MAGAZINE_CATEGORIES)[number]['code']
export type MagazineSort = 'LATEST' | 'POPULAR' | 'READ_TIME'
export type Magazine = {
  magazineId: number
  category: MagazineCategory
  categoryLabel: string
  title: string
  subtitle: string | null
  thumbnailUrl: string | null
  heroImageUrl: string | null
  sidoCode: string | null
  regionName: string
  readMinutes: number
  likeCount: number
  isLiked: boolean
  publishedAt: string
}
export type MagazineListParams = {
  category?: MagazineCategory | 'ALL'
  sidoCode?: string
  sort?: MagazineSort
  featured?: boolean
  page?: number
  size?: number
}
export type MagazineList = {
  content: Magazine[]
  page: number
  size: number
  totalElements: number
  totalPages: number
  last: boolean
  categories: { code: MagazineCategory; label: string; count: number }[] | null
  regions: { sidoCode: string; name: string; count: number }[] | null
}
export type MagazinePlace = {
  placeId: number
  name: string
  thumbnail: string | null
  sido: string
  sigungu: string
  lat: number
  lng: number
  subText: string | null
  accessSummary: string | null
}
export type MagazineDetail = Magazine & {
  author: string
  photographer: string | null
  body: string
  bodyFormat: 'MULMUNG_TEXT'
  relatedPlaces: MagazinePlace[]
  next: { magazineId: number; title: string; categoryLabel: string; readMinutes: number } | null
  shareUrl: string
}
