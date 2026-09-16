import { matchesRegionGroup } from '@/types/region'

import type { SavedCategory, SavedPlace, SavedPlacesPage, SavedQuery } from '@/types/saved'

const MOCK_DELAY_MS = 300

/** 시안과 같은 한 페이지 5건. */
const PAGE_SIZE = 5

/**
 * 백엔드 연동 전까지 쓰는 표본.
 * 개수는 MyPageLayout의 프로필 통계('찜한 장소 18')와 맞춰 뒀다.
 * 이름은 실존 업소로 오해되지 않게 지도 목(mapMock)과 같은 기준으로 둔다.
 * 주소는 시·도 이름으로 시작해야 한다 — 지역 필터가 앞부분을 대조해서다.
 */
const MOCK_SAVED: SavedPlace[] = (
  [
    ['덕구온천', '경북 울진', 'onsen', 4.8, 342],
    ['수안보온천', '충북 충주', 'onsen', 4.2, 156],
    ['온양온천', '충남 아산', 'onsen', 4.3, 218],
    ['스파랜드', '부산 해운대', 'onsen', 4.5, 512],
    ['아쿠아필드', '경기 하남', 'onsen', 4.1, 289],
    ['척산온천', '강원 속초', 'onsen', 4.6, 174],
    ['오색약수 산채정식', '강원 양양', 'restaurant', 4.4, 96],
    ['울진 대게마을', '경북 울진', 'restaurant', 4.7, 231],
    ['충주 매운탕집', '충북 충주', 'restaurant', 4.0, 58],
    ['온천마을 커피', '충남 아산', 'cafe', 4.2, 77],
    ['해운대 로스터리', '부산 해운대', 'cafe', 4.5, 304],
    ['속초 바다뷰 카페', '강원 속초', 'cafe', 4.3, 188],
    ['성산일출봉', '제주 서귀포', 'attraction', 4.9, 1204],
    ['담양 죽녹원', '전남 담양', 'attraction', 4.6, 421],
    ['경주 불국사', '경북 경주', 'attraction', 4.8, 973],
    ['서귀포 중문온천', '제주 서귀포', 'onsen', 4.4, 265],
    ['전주 한옥마을', '전북 전주', 'attraction', 4.5, 812],
    ['유성온천', '대전 유성', 'onsen', 4.1, 143],
  ] as const
).map(([name, address, category, rating, reviewCount], index) => ({
  id: index + 1,
  onsenId: 100 + index,
  name,
  address,
  category: category as SavedCategory,
  rating,
  reviewCount,
}))

function delay<T>(value: T): Promise<T> {
  return new Promise((resolve) => setTimeout(() => resolve(value), MOCK_DELAY_MS))
}

/**
 * 1단계에서 고른 것만 거른다.
 * '전체'면 2단계 칩이 화면에 없으므로 region·category 값을 보지 않는다.
 */
function matches(place: SavedPlace, query: SavedQuery): boolean {
  if (query.filter === 'region') return matchesRegionGroup(place.address, query.region)
  if (query.filter === 'category') {
    return query.category === 'all' || place.category === query.category
  }
  return true
}

/** 지역별은 주소순, 나머지는 찜한 순서(최신 먼저)로 둔다. */
function sortPlaces(places: SavedPlace[], query: SavedQuery): SavedPlace[] {
  const sorted = [...places]
  if (query.filter === 'region') return sorted.sort((a, b) => a.address.localeCompare(b.address))
  return sorted.sort((a, b) => b.id - a.id)
}

export function mockGetSavedPlaces(query: SavedQuery, page: number): Promise<SavedPlacesPage> {
  const filtered = sortPlaces(
    MOCK_SAVED.filter((place) => matches(place, query)),
    query,
  )

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE))
  // 필터를 좁혀 페이지 수가 줄면 현재 페이지가 범위를 넘을 수 있다.
  const safePage = Math.min(page, totalPages)
  const start = (safePage - 1) * PAGE_SIZE

  return delay({
    items: filtered.slice(start, start + PAGE_SIZE),
    totalCount: filtered.length,
    page: safePage,
    totalPages,
  })
}

export function mockDeleteSavedPlace(): Promise<void> {
  return delay(undefined)
}
