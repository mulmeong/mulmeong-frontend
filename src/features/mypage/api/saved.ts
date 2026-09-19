import { getAllFavorites, removeFavorite, type Favorite } from '@/features/favorites/api'
import { matchesRegionGroup } from '@/types/region'
import type { SavedPlace, SavedPlacesPage, SavedQuery } from '@/types/saved'

const CATEGORY = {
  ONSEN: 'onsen',
  SPA: 'onsen',
  RESTAURANT: 'restaurant',
  CAFE: 'cafe',
  ATTRACTION: 'attraction',
  ETC: 'etc',
} as const

export function selectSavedPlaces(
  favorites: Favorite[],
  query: SavedQuery,
  page: number,
): SavedPlacesPage {
  const items: SavedPlace[] = favorites
    .map((item) => ({
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
    .filter(
      (item) =>
        (query.filter !== 'category' ||
          query.category === 'all' ||
          item.category === query.category) &&
        (query.filter !== 'region' || matchesRegionGroup(item.address, query.region)),
    )
  const totalPages = Math.max(1, Math.ceil(items.length / 20))
  const safePage = Math.max(1, Math.min(page, totalPages))
  return {
    items: items.slice((safePage - 1) * 20, safePage * 20),
    totalCount: items.length,
    page: safePage,
    totalPages,
  }
}

export async function getSavedPlaces(query: SavedQuery, page: number) {
  return selectSavedPlaces(await getAllFavorites(), query, page)
}

export const deleteSavedPlace = removeFavorite
