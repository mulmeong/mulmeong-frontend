import { api } from '@/api'
import { env } from '@/lib/env'

import { mockFetchPamphlets } from './pamphletsMock'

import type { PamphletPage } from '@/types/pamphlet'

/**
 * PAM-08 내 팜플렛 목록. 로그인이 필요하다 — 비로그인은 401이다.
 *
 * 지도에서는 대표 정보(제목·장소 수)만 쓰므로 한 페이지로 충분하다.
 */
export function fetchPamphlets(size = 20): Promise<PamphletPage> {
  if (env.useMockPamphlet) return mockFetchPamphlets()
  return api.get<PamphletPage>('/pamphlets', { params: { size } })
}

/*
 * 팜플렛에 담긴 장소는 아직 id로 가져올 수 없다.
 *   GET /pamphlets/{id}         405
 *   GET /pamphlets/{id}/places  404
 * lat·lng을 주는 건 공유용 GET /pamphlets/share/{shareToken} 뿐인데,
 * 로그인 사용자의 내 지도에 쓰기엔 용도가 달라 쓰지 않는다.
 * BE에 GET /pamphlets/{pamphletId} 요청해 둠 — 열리면 여기에 붙인다.
 */
