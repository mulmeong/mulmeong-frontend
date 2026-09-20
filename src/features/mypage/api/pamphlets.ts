import { api } from '@/api'
import { env } from '@/lib/env'
import { mockFetchPamphletDetail, mockFetchPamphlets } from '@/features/map/api/pamphletsMock'

import type {
  CreatePamphletBody,
  CreatedPamphlet,
  PamphletDetail,
  PamphletPage,
} from '@/types/pamphlet'

/**
 * 팜플렛 만들기(PAM-08).
 *
 * placeIds 순서가 그대로 팜플렛 순서가 된다. 화면에서 고른 순서를 그대로 넘긴다.
 * 빈 값을 보내면 서버가 400을 주므로, 안 채운 항목은 아예 빼고 보낸다.
 */
export function createPamphlet(body: CreatePamphletBody): Promise<CreatedPamphlet> {
  return api.post<CreatedPamphlet>('/pamphlets', body)
}

/** 내 팜플렛 목록(MY-12). 로그인이 필요하다 — 비로그인은 401이다. */
export function fetchPamphlets(page = 0, size = 12): Promise<PamphletPage> {
  if (env.useMockPamphlet) return mockFetchPamphlets()
  return api.get<PamphletPage>('/pamphlets', { params: { page, size } })
}

/** 팜플렛 상세. 장소 목록은 여기에만 있다 — 목록 응답에는 placeCount만 온다. */
export function fetchPamphletDetail(pamphletId: number): Promise<PamphletDetail> {
  if (env.useMockPamphlet) return mockFetchPamphletDetail(pamphletId)
  return api.get<PamphletDetail>(`/pamphlets/${pamphletId}`)
}

/** 공유 링크로 보는 팜플렛. 비로그인도 열 수 있다. */
export function fetchSharedPamphlet(shareToken: string): Promise<PamphletDetail> {
  return api.get<PamphletDetail>(`/pamphlets/share/${shareToken}`, { skipAuth: true })
}

export function deletePamphlet(pamphletId: number): Promise<void> {
  return api.delete<void>(`/pamphlets/${pamphletId}`)
}
