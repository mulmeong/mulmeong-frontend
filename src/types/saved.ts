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

/**
 * 정렬 기준. 명세(MY-06)의 enum을 그대로 쓴다.
 *
 * RECENT는 서버가 준 순서 그대로다 — 찜한 순으로 내려온다.
 * NAME은 화면에서 정렬한다. 전체 목록이 이미 손에 있어 다시 받아올 이유가 없다.
 */
export type SavedSort = 'RECENT' | 'NAME'

export const SAVED_SORTS: { id: SavedSort; label: string }[] = [
  { id: 'RECENT', label: '찜한순' },
  { id: 'NAME', label: '이름순' },
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

/**
 * 카테고리별 개수. 칩 옆 숫자에 쓴다(MY-06 counts).
 * 'all'은 전체 찜 개수다. 조건을 걸기 전 기준이라 칩을 눌러도 값이 바뀌지 않는다.
 */
export type SavedCounts = Record<SavedCategory | 'all', number>

/** 한 번에 더 보여줄 개수. 스크롤이 끝에 닿을 때마다 이만큼씩 늘어난다. */
export const SAVED_PAGE_SIZE = 20

export type SavedPlacesPage = {
  /** 지금까지 펼쳐 보여줄 만큼 잘라낸 목록. */
  items: SavedPlace[]
  /** 조건에 걸린 개수. 목록 위 '전체 N'에 쓴다. */
  totalCount: number
  /** 아직 안 보여준 게 남았다. */
  hasMore: boolean
  counts: SavedCounts
}

/** 목록에 거는 조건. 'all'이면 카테고리를 거르지 않는다. */
export type SavedQuery = {
  sort: SavedSort
  category: SavedCategory | 'all'
}
