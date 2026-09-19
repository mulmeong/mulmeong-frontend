import { getAllFavorites, type Favorite } from '@/features/favorites/api'
import { SAVED_PAGE_SIZE } from '@/types/saved'

import type { SavedCounts, SavedPlace, SavedPlacesPage, SavedQuery } from '@/types/saved'

const CATEGORY = {
  ONSEN: 'onsen',
  SPA: 'onsen',
  RESTAURANT: 'restaurant',
  CAFE: 'cafe',
  ATTRACTION: 'attraction',
  ETC: 'etc',
} as const

/**
 * 카테고리별 개수(MY-06 counts).
 *
 * 서버도 같은 값을 응답에 담아 주지만, FavoritesProvider가 찜 버튼 상태 때문에
 * 어차피 전체 목록을 들고 있어서 여기서 센다. 조건을 걸기 전 목록으로 세야
 * 칩을 눌러도 숫자가 흔들리지 않는다.
 */
function countByCategory(items: SavedPlace[]): SavedCounts {
  const counts: SavedCounts = {
    all: items.length,
    onsen: 0,
    restaurant: 0,
    cafe: 0,
    attraction: 0,
    etc: 0,
  }

  for (const item of items) counts[item.category] += 1
  return counts
}

/**
 * 조건을 걸고 앞에서부터 limit개만 잘라낸다.
 *
 * 쪽을 나누지 않고 한 덩어리로 자르는 이유는 무한 스크롤이라서다 — 더 볼 때마다
 * 뒤를 이어 붙이는 게 아니라 자르는 지점만 뒤로 민다. 전체 목록을
 * FavoritesProvider가 이미 들고 있어서 받아올 것도 없다.
 */
export function selectSavedPlaces(
  favorites: Favorite[],
  query: SavedQuery,
  limit: number,
): SavedPlacesPage {
  const all: SavedPlace[] = favorites.map((item) => ({
    // 목록 선택과 삭제 모두 favoriteId가 아닌 placeId를 사용한다.
    id: item.placeId,
    onsenId: item.placeId,
    placeType: item.placeType,
    name: item.name,
    address: item.address ?? [item.sido, item.sigungu].filter(Boolean).join(' '),
    category: CATEGORY[item.placeType],
    imageUrl: item.thumbnail ?? undefined,
    subText: item.subText ?? undefined,
    kakaoPlaceUrl: item.kakaoPlaceUrl ?? undefined,
    lat: item.lat,
    lng: item.lng,
  }))

  const items = all.filter((item) => query.category === 'all' || item.category === query.category)

  // RECENT는 서버가 준 순서 그대로다(찜한 순). 이름순만 여기서 다시 세운다.
  if (query.sort === 'NAME') items.sort((a, b) => a.name.localeCompare(b.name, 'ko'))

  const shown = Math.max(SAVED_PAGE_SIZE, limit)
  return {
    items: items.slice(0, shown),
    totalCount: items.length,
    hasMore: items.length > shown,
    counts: countByCategory(all),
  }
}

export async function getSavedPlaces(query: SavedQuery, limit = SAVED_PAGE_SIZE) {
  return selectSavedPlaces(await getAllFavorites(), query, limit)
}
