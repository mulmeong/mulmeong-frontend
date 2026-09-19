import { api } from '@/api'
import { env } from '@/lib/env'

import { mockFetchPamphletDetail, mockFetchPamphlets } from './pamphletsMock'

import type { PamphletDetail, PamphletPage } from '@/types/pamphlet'

/**
 * PAM-08 내 팜플렛 목록. 로그인이 필요하다 — 비로그인은 401이다.
 *
 * 지도에서는 대표 정보(제목·장소 수)만 쓰므로 한 페이지로 충분하다.
 */
export function fetchPamphlets(size = 20): Promise<PamphletPage> {
  if (env.useMockPamphlet) return mockFetchPamphlets()
  return api.get<PamphletPage>('/pamphlets', { params: { size } })
}

/** 팜플렛에 담긴 장소. 지도 마커로 쓰려고 좌표가 있는 것만 넘긴다. */
export function fetchPamphletDetail(pamphletId: number): Promise<PamphletDetail> {
  if (env.useMockPamphlet) return mockFetchPamphletDetail(pamphletId)
  return api.get<PamphletDetail>(`/pamphlets/${pamphletId}`)
}
