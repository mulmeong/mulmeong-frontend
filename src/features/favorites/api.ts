import { api } from '@/api'

export type FavoriteCategory = 'ONSEN' | 'SPA' | 'RESTAURANT' | 'CAFE' | 'ATTRACTION' | 'ETC'
export type FavoriteRequest = { placeId: number } | {
  source: 'KAKAO' | 'TOUR_API'
  externalId: string
  name: string
  lat: number
  lng: number
  category: Exclude<FavoriteCategory, 'ONSEN'>
  address?: string | null
  phone?: string | null
  imageUrl?: string | null
}

export type Favorite = {
  favoriteId: number
  placeId: number
  placeType: FavoriteCategory
  placeTypeLabel: string
  name: string
  sido: string | null
  sigungu: string | null
  address: string | null
  lat: number
  lng: number
  thumbnail: string | null
  subText: string | null
  isRegistered: boolean
  source: string
  kakaoPlaceUrl: string | null
  createdAt: string
}

export type FavoritesPage = {
  content: Favorite[]
  page: number
  size: number
  totalElements: number
  totalPages: number
  last: boolean
  counts: Record<'ALL' | 'ONSEN' | 'RESTAURANT' | 'CAFE' | 'ATTRACTION', number> | null
}

export function getFavorites(page = 0, category = 'ALL', sort: 'RECENT' | 'NAME' = 'RECENT') {
  return api.get<FavoritesPage>('/favorites', { params: { page, size: 100, category, sort } })
}

// 최대 300개이며, 지역 필터와 여러 카드의 찜 상태를 위해 모든 페이지를 모은다.
export async function getAllFavorites() {
  const first = await getFavorites()
  const rest = await Promise.all(
    Array.from({ length: Math.max(0, first.totalPages - 1) }, (_, index) => getFavorites(index + 1)),
  )
  return [first, ...rest].flatMap((page) => page.content)
}

export function addFavorite(body: FavoriteRequest) {
  return api.post<{ favoriteId: number; placeId: number; isFavorite: boolean; createdAt: string }>(
    '/favorites', body,
  )
}

export function removeFavorite(placeId: number) {
  return api.delete<void>(`/favorites/${placeId}`)
}
