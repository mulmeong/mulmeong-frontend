import { api } from '@/api'
import { mockNearby } from '@/features/map/api/nearbyMock'
import { env } from '@/lib/env'

import type { NearbyResult } from '@/types/nearby'

export type NearbyParams = {
  /** 반경(m). 서버 기본 5000, 최대 20000. */
  radius?: number
  /** 큐레이션 개수. 서버 기본 6. */
  limit?: number
}

/**
 * PAM-04 주변 여행지. TourAPI·카카오는 서버가 내부에서 합치므로 프론트는 이 하나만 부른다.
 * 서버가 onsenId+radius로 24시간 캐싱한다 — 프론트도 useNearby에서 한 번 더 막는다.
 */
export function fetchNearby(onsenId: number, params: NearbyParams = {}): Promise<NearbyResult> {
  if (env.useMock) return mockNearby(onsenId)
  return api.get<NearbyResult>(`/onsens/${onsenId}/nearby`, { params, skipAuth: true })
}
