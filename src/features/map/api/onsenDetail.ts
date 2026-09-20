import { api } from '@/api'
import { mockOnsenDetail } from '@/features/map/api/onsenDetailMock'
import { env } from '@/lib/env'

import type { AccessLevel, OnsenDetail } from '@/types/onsenDetail'

const ACCESS_LEVEL_LABELS: Record<AccessLevel, string> = {
  WALKABLE: '뚜벅이 가능',
  CAR_RECOMMENDED: '자차 권장',
  CAR_REQUIRED: '자차 필수',
}

/**
 * 서버는 지금 water·facilities·access를 묶지 않고 평평하게 준다(waterTemp, hasOutdoor…).
 * 명세와 화면은 중첩 구조를 쓰므로 여기서 맞춘다. BE가 묶어서 주기 시작하면
 * 그 값을 그대로 쓰도록 양쪽을 받는다 — 바뀌는 시점에 프론트가 깨지지 않는다.
 */
type FlatOnsenDetail = OnsenDetail &
  Partial<{
    waterTemp: number | null
    waterType: string | null
    waterBenefit: string | null
    hasOutdoor: boolean
    hasLodging: boolean
    facilityType: string | null
    accessLevel: AccessLevel | null
  }>

function normalize(raw: FlatOnsenDetail): OnsenDetail {
  const level = raw.access?.accessLevel ?? raw.accessLevel ?? null
  return {
    ...raw,
    water: raw.water ?? {
      temp: raw.waterTemp ?? null,
      type: raw.waterType ?? null,
      benefit: raw.waterBenefit ?? null,
    },
    facilities: raw.facilities ?? {
      hasOutdoor: raw.hasOutdoor,
      hasLodging: raw.hasLodging,
      facilityType: raw.facilityType ?? null,
    },
    // 거점역은 평평한 응답에 없다. 라벨은 서버가 안 줘서 프론트가 붙인다.
    access:
      raw.access ??
      (level ? { accessLevel: level, accessLevelLabel: ACCESS_LEVEL_LABELS[level] } : null),
  }
}

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
    env.useMockOnsenDetail
      ? mockOnsenDetail(onsenId)
      : api.get<FlatOnsenDetail>(`/onsens/${onsenId}`, { skipAuth: true }).then(normalize)
  )
    .then((detail) => {
      cache.set(onsenId, { detail, expiresAt: Date.now() + CACHE_TTL_MS })
      return detail
    })
    .finally(() => pending.delete(onsenId))
  pending.set(onsenId, request)
  return request
}
