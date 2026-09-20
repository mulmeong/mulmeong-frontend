export const MAGAZINE_CATEGORIES = [
  { code: 'VILLAGE_STORY', label: '온천마을 이야기' },
  { code: 'WALKING_GUIDE', label: '뚜벅이 가이드' },
  { code: 'SEASONAL', label: '시즌 추천' },
  { code: 'ONSEN_SCIENCE', label: '온천 과학' },
  { code: 'FOOD', label: '먹거리' },
] as const
export type MagazineCategory = (typeof MAGAZINE_CATEGORIES)[number]['code']

/**
 * 지역 필터의 권역. 서버가 목록 응답의 regions를 늘 null로 주어 화면에서 정의한다.
 * 한 권역이 여러 시도코드를 쓰므로(강원=51·42) 이름 → 코드 목록으로 둔다.
 */
export const MAGAZINE_REGION_CODES: Record<string, string[]> = {
  수도권: ['11', '41', '28'],
  강원: ['51', '42'],
  충청: ['30', '36', '43', '44'],
  경북: ['27', '47'],
  경남: ['26', '31', '48'],
  전라: ['29', '45', '46', '52'],
  제주: ['50'],
}

export const MAGAZINE_REGIONS = Object.keys(MAGAZINE_REGION_CODES)

/** 시도코드가 어느 권역인지. 목록 카드의 지역 표기에 쓴다. */
export function regionNameOfSido(sidoCode?: string | null): string | undefined {
  if (!sidoCode) return undefined
  return MAGAZINE_REGIONS.find((region) => MAGAZINE_REGION_CODES[region].includes(sidoCode))
}
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
