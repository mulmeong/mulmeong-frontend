import { api } from '@/api'
import { env } from '@/lib/env'

import type { Onsen } from '@/types/onsen'

import { mockSearchOnsens } from './mapMock'

export type SearchOnsensParams = {
  keyword?: string
  region?: string
}

export function searchOnsens({ keyword, region }: SearchOnsensParams = {}): Promise<Onsen[]> {
  if (env.useMock) return mockSearchOnsens(keyword, region)
  // 비로그인도 지도를 볼 수 있다 (AUTH-02).
  return api.get<Onsen[]>('/onsens', { params: { keyword, region }, skipAuth: true })
}
