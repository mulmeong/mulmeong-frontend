import { api } from '@/api'
import { mockNearby } from '@/features/map/api/nearbyMock'
import { env } from '@/lib/env'

import type { NearbyPlace, NearbyResult, NearbySource } from '@/types/nearby'

export type NearbyParams = {
  /** 반경(m). 서버 기본 5000, 최대 20000. */
  radius?: number
  /** 큐레이션 개수. 서버 기본 6. */
  limit?: number
}

/**
 * PAM-04 주변 여행지. TourAPI·카카오는 서버가 내부에서 합치므로 프론트는 이 하나만 부른다.
 * 서버가 onsenId+radius로 24시간 캐싱한다 — 프론트도 useNearby에서 한 번 더 막는다.
 */
/**
 * 서버는 페이지 형태({content, ...})로 준다. 프론트는 onsenId·hasMore를 같이 쓰므로 맞춘다.
 * 지금 운영 데이터는 content가 비어 있어 필드 구성을 실제로 확인하지 못했다 —
 * 항목은 NearbyPlace 그대로라고 보고 넘긴다.
 */
type NearbyResponse = {
  content: NearbyResponseItem[]
  totalElements?: number
  last?: boolean
}

type NearbyResponseItem = {
  source: 'TOUR' | 'TOUR_API' | 'KAKAO'
  type?: string | null
  contentId?: string | null
  placeId?: string | number | null
  name: string
  image?: string | null
  lat: number
  lng: number
  distanceM?: number | null
  description?: string | null
  phone?: string | null
  placeUrl?: string | null
  categoryName?: string | null
}

function categoryOf(item: NearbyResponseItem) {
  if (item.type === '맛집') return 'RESTAURANT'
  if (item.type === '카페') return 'CAFE'
  return 'ATTRACTION'
}

function normalizeNearby(item: NearbyResponseItem): NearbyPlace {
  const source: NearbySource = item.source === 'KAKAO' ? 'KAKAO' : 'TOUR_API'
  const externalId = String(item.contentId ?? item.placeId ?? '')
  return {
    externalId,
    source,
    cardType: item.image ? 'PHOTO' : 'INFO',
    category: categoryOf(item),
    categoryLabel: item.type || item.categoryName || '주변 장소',
    name: item.name,
    address: item.description,
    description: item.description ?? undefined,
    phone: item.phone,
    imageUrl: item.image,
    lat: item.lat,
    lng: item.lng,
    distanceM: item.distanceM,
    kakaoPlaceUrl: item.placeUrl ?? undefined,
  }
}

export function fetchNearby(onsenId: number, params: NearbyParams = {}): Promise<NearbyResult> {
  if (env.useMockNearby) return mockNearby(onsenId)
  return api
    .get<NearbyResponse>(`/onsens/${onsenId}/nearby`, { params, skipAuth: true })
    .then((data) => ({
      onsenId,
      items: (data.content ?? []).map(normalizeNearby),
      hasMore: data.last === false,
    }))
}
