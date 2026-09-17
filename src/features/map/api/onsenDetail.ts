import { api } from '@/api'
import { mockOnsenDetail } from '@/features/map/api/onsenDetailMock'
import { env } from '@/lib/env'

import type { OnsenDetail } from '@/types/onsenDetail'

const CACHE_TTL_MS = 5 * 60 * 1000
const cache = new Map<number, { detail: OnsenDetail; expiresAt: number }>()
const pending = new Map<number, Promise<OnsenDetail>>()

/** PAM-03 온천 상세. 목록(/onsens)에 없는 효능·거점역·팀 코멘트가 여기에 있다. */
export function fetchOnsenDetail(onsenId: number): Promise<OnsenDetail> {
  const cached = cache.get(onsenId)
  if (cached && cached.expiresAt > Date.now()) return Promise.resolve(cached.detail)
  const inFlight = pending.get(onsenId)
  if (inFlight) return inFlight

  // 비로그인도 상세를 볼 수 있다 (AUTH-02).
  const request = (
    env.useMock
      ? mockOnsenDetail(onsenId)
      : api.get<OnsenDetail>(`/onsens/${onsenId}`, { skipAuth: true })
  )
    .then((detail) => {
      cache.set(onsenId, { detail, expiresAt: Date.now() + CACHE_TTL_MS })
      return detail
    })
    .finally(() => pending.delete(onsenId))
  pending.set(onsenId, request)
  return request
}
