import type { RegionGroupId } from '@/types/region'
import type { FavoriteCategory } from '@/features/favorites/api'

/**
 * 찜한 장소 하나(MY-03).
 *
 * TODO: 기능명세서의 PAM-07(찜하기) 항목과 대조 필요.
 * 지금 필드는 시안에 실제로 보이는 것만 추린 것이라, 명세에 다른 이름이나
 * 추가 필드가 있으면 맞춰야 한다.
 */
export type SavedPlace = {
  id: number
  /** 찜 대상 장소 — 지도에서 보기·상세 이동에 쓴다. */
  onsenId: number
  name: string
  /** 시·도 + 시군구 (예: 경북 울진) */
  address: string
  category: SavedCategory
  /** 0~5, 소수 한 자리. 리뷰가 없으면 undefined. */
  rating?: number
  reviewCount?: number
  placeType?: FavoriteCategory
  subText?: string
  kakaoPlaceUrl?: string
  lat?: number
  lng?: number
  /** 없을 수 있다 — 사진 없는 항목도 목록에는 뜬다. */
  imageUrl?: string
}

/** 시안의 1단계 칩 세 가지. */
export type SavedFilter = 'all' | 'region' | 'category'

export const SAVED_FILTERS: { id: SavedFilter; label: string }[] = [
  { id: 'all', label: '전체' },
  { id: 'region', label: '지역별' },
  { id: 'category', label: '카테고리별' },
]

/**
 * 카테고리별에서 고르는 장소 종류.
 *
 * TODO: 찜 목록에 온천 말고 식당·카페·관광지가 들어간다는 건 시안에만 있고
 * types/onsen.ts의 Onsen에는 종류를 나타내는 필드가 없다.
 * 기획·BE와 필드 이름과 값 목록을 확정한 뒤 이 상수를 교체할 것.
 */
export const SAVED_CATEGORIES = [
  { id: 'onsen', label: '온천/사우나' },
  { id: 'restaurant', label: '식당' },
  { id: 'cafe', label: '카페' },
  { id: 'attraction', label: '관광지' },
] as const

export type SavedCategory = (typeof SAVED_CATEGORIES)[number]['id'] | 'etc'

/** 카테고리 id -> 목록 배지에 쓸 한글 이름. */
export function categoryLabel(category: SavedCategory): string {
  if (category === 'etc') return '기타'
  return SAVED_CATEGORIES.find((item) => item.id === category)?.label ?? category
}

export type SavedPlacesPage = {
  items: SavedPlace[]
  /** 전체 찜 개수. 목록 위 '전체 N'에 쓴다. */
  totalCount: number
  page: number
  totalPages: number
}

/**
 * 목록에 거는 조건.
 * 1단계에서 '전체'를 고르면 2단계 칩이 없으므로 region·category 둘 다 기본값이다.
 */
export type SavedQuery = {
  filter: SavedFilter
  region: RegionGroupId
  category: SavedCategory | 'all'
}
