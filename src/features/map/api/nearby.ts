import { api } from '@/api'
import { mockNearby } from '@/features/map/api/nearbyMock'
import { env } from '@/lib/env'

import type { NearbyCategory, NearbyPlace, NearbyResult } from '@/types/nearby'

export type NearbyParams = {
  /** 반경(m). 서버 기본 5000, 최대 20000. */
  radius?: number
  /** 최초 요청은 최대 20건까지 받는다. */
  limit?: number
}

/**
 * PAM-04 주변 여행지. 서버가 TourAPI 실시간 조회 결과를 페이지 형태({content, ...})로 준다.
 * 프론트는 화면에서 쓰는 필드만 NearbyPlace로 맞춘다.
 */
type NearbyResponse = {
  content: NearbyResponseItem[]
  totalElements?: number
  last?: boolean
}

type NearbyResponseItem = {
  source?: 'TOUR' | 'TOUR_API' | null
  type?: string | null
  category?: NearbyCategory | string | null
  contentId?: string | null
  contentTypeId?: string | number | null
  placeId?: number | null
  name: string
  image?: string | null
  imageUrl?: string | null
  firstImage?: string | null
  firstimage?: string | null
  thumbnail?: string | null
  lat: number
  lng: number
  distanceM?: number | null
  address?: string | null
  description?: string | null
  phone?: string | null
  categoryName?: string | null
}

const CATEGORY_LABELS: Record<NearbyCategory, string> = {
  ATTRACTION: '관광지',
  RESTAURANT: '맛집',
  CAFE: '카페',
  PARK: '공원',
  ACCOMMODATION: '숙소',
  CULTURE: '문화',
  LEISURE: '레저',
  SHOPPING: '쇼핑',
  FESTIVAL: '축제',
  SPA: '온천',
  ETC: '주변 장소',
}

function isNearbyCategory(value: string | null | undefined): value is NearbyCategory {
  return Boolean(value && Object.prototype.hasOwnProperty.call(CATEGORY_LABELS, value))
}

function categoryOf(item: NearbyResponseItem): NearbyCategory {
  if (isNearbyCategory(item.category)) return item.category
  if (item.type === '카페') return 'CAFE'
  if (item.type === '맛집') return 'RESTAURANT'

  const contentTypeId = String(item.contentTypeId ?? '')
  if (contentTypeId === '12') return 'ATTRACTION'
  if (contentTypeId === '39') {
    return /카페|cafe/i.test(item.name) ? 'CAFE' : 'RESTAURANT'
  }
  return 'ETC'
}

function normalizeNearby(item: NearbyResponseItem): NearbyPlace {
  const category = categoryOf(item)
  const imageUrl = item.imageUrl ?? item.image ?? item.firstImage ?? item.firstimage ?? item.thumbnail
  return {
    externalId: String(item.contentId ?? item.placeId ?? ''),
    source: 'TOUR_API',
    cardType: imageUrl ? 'PHOTO' : 'INFO',
    category,
    type: item.type,
    categoryLabel: item.type || item.categoryName || CATEGORY_LABELS[category],
    name: item.name,
    address: item.address,
    description: item.description ?? undefined,
    phone: item.phone,
    imageUrl,
    lat: item.lat,
    lng: item.lng,
    distanceM: item.distanceM,
    placeId: item.placeId,
  }
}

export function fetchNearby(onsenId: number, params: NearbyParams = {}): Promise<NearbyResult> {
  if (env.useMockNearby) return mockNearby(onsenId)
  const limit = Math.min(params.limit ?? 20, 20)
  return api
    .get<NearbyResponse>(`/onsens/${onsenId}/nearby`, {
      params: { ...params, limit },
      skipAuth: true,
    })
    .then((data) => ({
      onsenId,
      items: (data.content ?? []).map(normalizeNearby),
      hasMore: data.last === false,
    }))
}
