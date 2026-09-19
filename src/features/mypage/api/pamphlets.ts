import { api } from '@/api'

import type { CreatePamphletBody, Pamphlet } from '@/types/pamphlet'

/**
 * 팜플렛 만들기(PAM-08).
 *
 * placeIds 순서가 그대로 팜플렛 순서가 된다. 화면에서 고른 순서를 그대로 넘긴다.
 * 빈 값을 보내면 서버가 400을 주므로, 안 채운 항목은 아예 빼고 보낸다.
 */
export function createPamphlet(body: CreatePamphletBody): Promise<Pamphlet> {
  return api.post<Pamphlet>('/pamphlets', body)
}
