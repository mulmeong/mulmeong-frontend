import { api } from '@/api'

import type { CreatePamphletBody, Pamphlet, PamphletDetail, PamphletPage } from '@/types/pamphlet'

/**
 * 팜플렛 만들기(PAM-08).
 *
 * placeIds 순서가 그대로 팜플렛 순서가 된다. 화면에서 고른 순서를 그대로 넘긴다.
 * 빈 값을 보내면 서버가 400을 주므로, 안 채운 항목은 아예 빼고 보낸다.
 */
export function createPamphlet(body: CreatePamphletBody): Promise<Pamphlet> {
  return api.post<Pamphlet>('/pamphlets', body)
}

/** 내 팜플렛 목록(MY-12). page는 0부터다 — 화면의 1-based와 다르니 호출부에서 맞춘다. */
export function fetchPamphlets(page: number, size: number): Promise<PamphletPage> {
  return api.get<PamphletPage>('/pamphlets', { params: { page, size } })
}

export function fetchPamphletDetail(pamphletId: number): Promise<PamphletDetail> {
  return api.get<PamphletDetail>(`/pamphlets/${pamphletId}`)
}

/** 공유 링크로 여는 팜플렛. 비로그인도 볼 수 있다 (AUTH-02). */
export function fetchSharedPamphlet(shareToken: string): Promise<PamphletDetail> {
  return api.get<PamphletDetail>(`/pamphlets/share/${shareToken}`, { skipAuth: true })
}

export function deletePamphlet(pamphletId: number): Promise<void> {
  return api.delete<void>(`/pamphlets/${pamphletId}`)
}
