import { api } from '@/api'
import { mockPoi } from '@/features/map/api/poiMock'
import { env } from '@/lib/env'

import type { PoiCategory, PoiResult } from '@/types/poi'

export type PoiParams = {
  category: PoiCategory
  lat: number
  lng: number
  /** 기본 2000, 최대 20000(m). */
  radius?: number
  /** 서버의 TourAPI 조회 결과 개수. */
  size?: number
}

export function fetchPoi(
  { category, lat, lng, radius, size }: PoiParams,
  signal?: AbortSignal,
): Promise<PoiResult> {
  if (env.useMock) return mockPoi(category, lat, lng)
  return api.get<PoiResult>('/external/places/category', {
    params: { category, lat, lng, radius, size },
    skipAuth: true,
    signal,
  })
}
