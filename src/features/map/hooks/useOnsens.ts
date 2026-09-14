import { useCallback, useEffect, useRef, useState } from 'react'

import { ApiError } from '@/api/ApiError'
import { searchOnsens } from '@/features/map/api/map'

import type { OnsenListItem } from '@/features/map/api/map'
import type { MapBounds } from '@/types/onsen'

type Filters = {
  keyword?: string
  region?: string
  bounds?: MapBounds
}

/**
 * 캐시 키의 좌표는 소수 3자리로 줄인다 — 1픽셀 팬마다 키가 새로 생기면
 * 쿼터 방어가 무력해진다 (약 100m 단위).
 */
function boundsKey(bounds?: MapBounds): string {
  if (!bounds) return ''
  const r = (n: number) => n.toFixed(3)
  return `${r(bounds.swLat)},${r(bounds.swLng)},${r(bounds.neLat)},${r(bounds.neLng)}`
}

/**
 * 지도 목록 도메인 훅. 컴포넌트는 props가 아니라 이 훅으로 접근한다.
 * 같은 조건으로는 다시 요청하지 않는다 — 관광공사·카카오 API에 일일 쿼터가 있다.
 */
export function useOnsens() {
  const [onsens, setOnsens] = useState<OnsenListItem[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string>()

  const cache = useRef(new Map<string, OnsenListItem[]>())
  /** 늦게 도착한 이전 요청이 최신 결과를 덮어쓰지 않게 한다. */
  const requestId = useRef(0)

  /**
   * 결과를 반환한다 — 호출부가 도착한 목록으로 곧바로 후속 처리(지도 이동 등)를 하게.
   * 실패했거나 뒤늦게 도착한 요청은 빈 배열이라, 낡은 결과로 화면을 움직이지 않는다.
   */
  const load = useCallback(async (filters: Filters = {}): Promise<OnsenListItem[]> => {
    const key = `${filters.keyword ?? ''}|${filters.region ?? ''}|${boundsKey(filters.bounds)}`

    const cached = cache.current.get(key)
    if (cached) {
      setOnsens(cached)
      setLoading(false)
      setError(undefined)
      return cached
    }

    const id = ++requestId.current
    setLoading(true)
    setError(undefined)
    try {
      const result = await searchOnsens(filters)
      if (id !== requestId.current) return []
      cache.current.set(key, result)
      setOnsens(result)
      return result
    } catch (err) {
      if (id !== requestId.current) return []
      setError(err instanceof ApiError ? err.message : '목록을 불러오지 못했습니다.')
      return []
    } finally {
      if (id === requestId.current) setLoading(false)
    }
  }, [])

  useEffect(() => {
    void load()
  }, [load])

  return { onsens, loading, error, load }
}
