import { api } from '@/api'
import { mockPoiDetail } from '@/features/map/api/poiDetailMock'
import { homepageUrlOf, plainText, secureImageUrl } from '@/features/map/utils/tourApiText'
import { env } from '@/lib/env'

import type { PoiDetail } from '@/types/poi'

function normalize(raw: PoiDetail): PoiDetail {
  return {
    ...raw,
    description: plainText(raw.description),
    homepageUrl: homepageUrlOf(raw.homepageUrl),
    imageUrl: secureImageUrl(raw.imageUrl),
    thumbnailUrl: secureImageUrl(raw.thumbnailUrl),
  }
}

const CACHE_TTL_MS = 5 * 60 * 1000
const cache = new Map<string, { detail: PoiDetail; expiresAt: number }>()
const pending = new Map<string, Promise<PoiDetail>>()

/**
 * 서버가 TourAPI를 매번 호출하므로(DB·Redis 저장 없음) 같은 장소를 다시 열 때는
 * 프론트 캐시로 막는다 — TourAPI 일일 쿼터를 카드 클릭마다 쓰지 않는다.
 */
export function fetchPoiDetail(externalId: string): Promise<PoiDetail> {
  const cached = cache.get(externalId)
  if (cached && cached.expiresAt > Date.now()) return Promise.resolve(cached.detail)
  const inFlight = pending.get(externalId)
  if (inFlight) return inFlight

  // 비로그인도 장소 상세를 볼 수 있다 (AUTH-02).
  const request = (
    env.useMockPoiDetail
      ? mockPoiDetail(externalId)
      : api
          .get<PoiDetail>(`/external/tour/${encodeURIComponent(externalId)}`, { skipAuth: true })
          .then(normalize)
  )
    .then((detail) => {
      cache.set(externalId, { detail, expiresAt: Date.now() + CACHE_TTL_MS })
      return detail
    })
    .finally(() => pending.delete(externalId))
  pending.set(externalId, request)
  return request
}
