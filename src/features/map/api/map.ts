import { api } from '@/api'
import { env } from '@/lib/env'

import type { Onsen } from '@/types/onsen'

import { mockSearchOnsens } from './mapMock'

export type SearchOnsensParams = {
  keyword?: string
  region?: string
}

/**
 * distanceKm이 optional인 이유: 목은 항상 채우지만, 백엔드 /onsens가 거리를 붙여주는지
 * 아직 확인되지 않았다. 확인되면 OnsenWithDistance로 좁힌다.
 */
export type OnsenListItem = Onsen & { distanceKm?: number }

export function searchOnsens({ keyword, region }: SearchOnsensParams = {}): Promise<
  OnsenListItem[]
> {
  if (env.useMock) return mockSearchOnsens(keyword, region)
  // 비로그인도 지도를 볼 수 있다 (AUTH-02).
  return api.get<OnsenListItem[]>('/onsens', { params: { keyword, region }, skipAuth: true })
}
