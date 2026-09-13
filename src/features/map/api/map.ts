import { api } from '@/api'
import { env } from '@/lib/env'

import type { MapBounds, Onsen } from '@/types/onsen'

import { mockSearchOnsens } from './mapMock'

export type SearchOnsensParams = {
  keyword?: string
  region?: string
  /** 지도에 보이는 영역 (MAP-03). 없으면 전체에서 찾는다. */
  bounds?: MapBounds
}

/**
 * distanceKm이 optional인 이유: 목은 항상 채우지만, 백엔드 /onsens가 거리를 붙여주는지
 * 아직 확인되지 않았다. 확인되면 OnsenWithDistance로 좁힌다.
 */
export type OnsenListItem = Onsen & { distanceKm?: number }

export function searchOnsens({ keyword, region, bounds }: SearchOnsensParams = {}): Promise<
  OnsenListItem[]
> {
  if (env.useMock) return mockSearchOnsens(keyword, region, bounds)
  // 비로그인도 지도를 볼 수 있다 (AUTH-02).
  return api.get<OnsenListItem[]>('/onsens', {
    params: {
      keyword,
      region,
      swLat: bounds?.swLat,
      swLng: bounds?.swLng,
      neLat: bounds?.neLat,
      neLng: bounds?.neLng,
    },
    skipAuth: true,
  })
}
