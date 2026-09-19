import { api } from '@/api'
import { MOCK_ONSENS } from '@/features/map/api/mapMock'
import { env } from '@/lib/env'

import type { OnsenMapPoint } from '@/features/map/types/mapPoint'

/** 백엔드 MapOnsensResponse(API-301)에서 전국 마커를 만드는 데 필요한 필드만 쓴다. */
type MapPointsResponse = {
  clustered: boolean
  markers: {
    onsenId: number
    name: string
    lat: number
    lng: number
    thumbnail?: string | null
    markerType?: string
  }[]
  totalCount: number
}

const CACHE_TTL_MS = 5 * 60 * 1000
let cached: { points: OnsenMapPoint[]; expiresAt: number } | undefined
let pending: Promise<OnsenMapPoint[]> | undefined

async function requestMapPoints(): Promise<OnsenMapPoint[]> {
  if (env.useMockMapPoints) {
    return MOCK_ONSENS.map(({ id, name, lat, lng }) => ({ id, name, lat, lng }))
  }

  // API-301은 zoom >= 8이면 시군구 집계를 반환한다. 기존 카카오 클러스터러가
  // 묶음을 관리하므로 zoom=7로 전국 개별 마커를 한 번 받고 화면 이동에는 재사용한다.
  const result = await api.get<MapPointsResponse>('/map/onsens', {
    params: { swLat: 33, swLng: 124, neLat: 39, neLng: 132, zoom: 7 },
    skipAuth: true,
  })
  if (result.clustered || result.markers.length !== result.totalCount) {
    throw new Error('지도의 장소를 모두 불러오지 못했어요.')
  }
  return result.markers.map(({ onsenId, name, lat, lng, thumbnail, markerType }) => ({
    id: onsenId,
    name,
    lat,
    lng,
    imageUrl: thumbnail ?? undefined,
    markerType,
  }))
}

/** 패널·페이지 재진입에도 전국 데이터와 진행 중 요청을 공유한다. 실패는 캐시하지 않는다. */
export function fetchOnsenMapPoints(): Promise<OnsenMapPoint[]> {
  if (cached && cached.expiresAt > Date.now()) return Promise.resolve(cached.points)
  if (pending) return pending
  pending = requestMapPoints()
    .then((points) => {
      cached = { points, expiresAt: Date.now() + CACHE_TTL_MS }
      return points
    })
    .finally(() => {
      pending = undefined
    })
  return pending
}
