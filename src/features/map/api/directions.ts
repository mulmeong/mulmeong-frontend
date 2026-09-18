import { z } from 'zod'

import { api, ApiError } from '@/api'
import { mockDirections, mockRoutePlaces } from '@/features/map/api/directionsMock'
import { searchOnsens } from '@/features/map/api/map'
import { env } from '@/lib/env'

import type {
  DirectionsQuery,
  DirectionsResult,
  RoutePlace,
  TravelMode,
} from '@/features/map/types/directions'

const API_MODES = { car: 'CAR', transit: 'TRANSIT', walk: 'WALK', bike: 'BIKE' } as const
const minutes = z.number().finite().nonnegative()
const responseSchema = z.object({
  mode: z.enum(['CAR', 'TRANSIT', 'WALK', 'BIKE']),
  distanceM: z.number().finite().nonnegative(),
  durationMin: minutes,
  walkDurationMin: minutes.nullable(),
  totalDurationMin: minutes,
  fare: z.number().finite().nonnegative().nullish(),
  summary: z.string(),
  steps: z.array(
    z.object({
      seq: z.number(),
      type: z.string(),
      durationMin: minutes,
      distanceM: z.number().nonnegative().optional(),
      description: z.string(),
    }),
  ),
  // 서버 좌표 순서는 [위도, 경도]. 구간별 좌표는 제공되지 않으므로 임의로 나누지 않는다.
  path: z.array(z.tuple([z.number().min(-90).max(90), z.number().min(-180).max(180)])).optional(),
})

const CACHE_TTL_MS = 60 * 60 * 1000
const cache = new Map<string, { result: DirectionsResult; expiresAt: number }>()
const pending = new Map<string, Promise<DirectionsResult>>()

function cacheKey(query: DirectionsQuery) {
  const point = (place: RoutePlace) => `${place.lat.toFixed(3)},${place.lng.toFixed(3)}`
  return `${query.mode}|${point(query.origin)}|${point(query.destination)}|path`
}

// 일반 장소 검색 계약 전까지 실제 모드에서는 기존 온천 검색을 재사용한다.
export async function searchRoutePlaces(keyword: string): Promise<RoutePlace[]> {
  const trimmed = keyword.trim()
  if (!trimmed) return []
  if (env.useMock) return mockRoutePlaces(trimmed)
  const places = await searchOnsens({ keyword: trimmed })
  return places.map(({ id, name, address, lat, lng }) => ({
    id: `onsen-${id}`,
    name,
    address,
    lat,
    lng,
  }))
}

function errorCode(error: ApiError) {
  const data = error.data
  return typeof data === 'object' && data !== null && 'code' in data ? String(data.code) : undefined
}

async function requestDirections(query: DirectionsQuery): Promise<DirectionsResult> {
  if (env.useMock) return mockDirections(query)
  try {
    const raw = await api.get<unknown>('/external/directions', {
      params: {
        originLat: query.origin.lat,
        originLng: query.origin.lng,
        destLat: query.destination.lat,
        destLng: query.destination.lng,
        mode: API_MODES[query.mode],
        includePath: true,
      },
      skipAuth: true,
    })
    const parsed = responseSchema.safeParse(raw)
    if (!parsed.success || parsed.data.mode !== API_MODES[query.mode])
      throw new Error('경로 정보를 확인하지 못했어요. 다시 시도해 주세요.')
    const data = parsed.data
    return {
      ...query,
      preview: false,
      routes: [
        {
          id: `${query.mode}-route`,
          label: data.summary || '추천 경로',
          distanceMeters: data.distanceM,
          durationSeconds: data.totalDurationMin * 60,
          fare: data.fare ?? undefined,
          walkTimeExcluded: query.mode === 'transit' && data.walkDurationMin === null,
          transitDurationSeconds: query.mode === 'transit' ? data.durationMin * 60 : undefined,
          walkDurationSeconds:
            query.mode === 'transit' && data.walkDurationMin !== null
              ? data.walkDurationMin * 60
              : undefined,
          path: (data.path ?? []).map(([lat, lng]) => ({ lat, lng })),
          legs: [...data.steps]
            .sort((a, b) => a.seq - b.seq)
            .map((step) => ({
              mode:
                ({ WALK: 'walk', CAR: 'car', BIKE: 'bike' } as Record<string, TravelMode>)[
                  step.type
                ] ?? 'transit',
              label: step.description,
              durationSeconds: step.durationMin * 60,
            })),
        },
      ],
    }
  } catch (error) {
    if (!(error instanceof ApiError)) throw error
    const code = errorCode(error)
    if (error.status === 404 && code === 'ROUTE_NOT_FOUND')
      return { ...query, preview: false, routes: [], routeNotFound: true }
    if (code === 'EXTERNAL_QUOTA_EXCEEDED' || error.status === 429)
      throw new Error('길찾기 이용량이 많아 잠시 쉬고 있어요. 잠시 후 다시 시도해 주세요.')
    if (code === 'EXTERNAL_API_FAILED' || error.status === 502)
      throw new Error('길찾기 서비스에 연결하지 못했어요. 잠시 후 다시 시도해 주세요.')
    if (code === 'VALIDATION_FAILED' || code === 'INVALID_MODE' || error.status === 400)
      throw new Error('출발지·도착지와 이동 수단을 다시 선택해 주세요.')
    if (error.status === 0) throw new Error('네트워크 연결을 확인하고 다시 시도해 주세요.')
    throw new Error('경로를 불러오지 못했어요. 다시 시도해 주세요.')
  }
}

/** 동일 좌표(소수 3자리)·수단은 1시간 재사용. 캐시 조회는 만료 시간을 연장하지 않는다. */
export async function fetchDirections(query: DirectionsQuery): Promise<DirectionsResult> {
  const key = cacheKey(query)
  const now = Date.now()
  for (const [storedKey, entry] of cache) if (entry.expiresAt <= now) cache.delete(storedKey)
  const cached = cache.get(key)
  if (cached) return { ...cached.result, ...query }
  let request = pending.get(key)
  if (!request) {
    request = requestDirections(query)
      .then((result) => {
        cache.set(key, { result, expiresAt: Date.now() + CACHE_TTL_MS })
        return result
      })
      .finally(() => {
        pending.delete(key)
      })
    pending.set(key, request)
  }
  return { ...(await request), ...query }
}
