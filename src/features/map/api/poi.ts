import { api } from '@/api'
import { mockPoi } from '@/features/map/api/poiMock'
import { homepageUrlOf, plainText, secureImageUrl } from '@/features/map/utils/tourApiText'
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

/** 목록도 TourAPI 원문을 그대로 실어 오므로 상세와 같은 방식으로 다듬는다. */
function normalize(result: PoiResult): PoiResult {
  return {
    ...result,
    places: result.places.map((place) => ({
      ...place,
      description: plainText(place.description),
      homepageUrl: homepageUrlOf(place.homepageUrl),
      imageUrl: secureImageUrl(place.imageUrl),
    })),
  }
}

export function fetchPoi(
  { category, lat, lng, radius, size }: PoiParams,
  signal?: AbortSignal,
): Promise<PoiResult> {
  if (env.useMock) return mockPoi(category, lat, lng)
  return api
    .get<PoiResult>('/external/places/category', {
      params: { category, lat, lng, radius, size },
      skipAuth: true,
      signal,
    })
    .then(normalize)
}
