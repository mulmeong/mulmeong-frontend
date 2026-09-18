import { useCallback, useEffect, useRef, useState } from 'react'

import { ApiError } from '@/api/ApiError'
import { searchOnsens } from '@/features/map/api/map'

import type { OnsenListItem, SearchOnsensParams } from '@/features/map/api/map'
import type { MapBounds } from '@/types/onsen'

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
 *
 * `initialLimit`은 조건 없는 첫 조회에만 쓴다. 전국이 505곳이라 첫 화면이
 * 일부만 보여준다면 반드시 넘긴다.
 */
export function useOnsens(initialLimit?: number) {
  const [onsens, setOnsens] = useState<OnsenListItem[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string>()

  const cache = useRef(new Map<string, OnsenListItem[]>())
  const pending = useRef(new Map<string, Promise<OnsenListItem[]>>())
  /** 늦게 도착한 이전 요청이 최신 결과를 덮어쓰지 않게 한다. */
  const requestId = useRef(0)

  /**
   * 결과를 반환한다 — 호출부가 도착한 목록으로 곧바로 후속 처리(지도 이동 등)를 하게.
   * 실패했거나 뒤늦게 도착한 요청은 빈 배열이라, 낡은 결과로 화면을 움직이지 않는다.
   */
  const load = useCallback(async (filters: SearchOnsensParams = {}): Promise<OnsenListItem[]> => {
    // 부분 목록이 전체 조회의 캐시로 쓰이지 않게 limit도 구분한다.
    const key = `${filters.keyword ?? ''}|${filters.region ?? ''}|${boundsKey(filters.bounds)}|${filters.limit ?? ''}`
    // 캐시로 전체 목록을 복원하는 경우에도 진행 중인 이전 검색을 무효화한다.
    const id = ++requestId.current

    const cached = cache.current.get(key)
    if (cached) {
      setOnsens(cached)
      setLoading(false)
      setError(undefined)
      return cached
    }

    setLoading(true)
    setError(undefined)
    // StrictMode 재실행이나 빠른 필터 전환 중 같은 요청은 공유한다.
    const request = pending.current.get(key) ?? searchOnsens(filters)
    pending.current.set(key, request)
    try {
      const result = await request
      cache.current.set(key, result)
      if (id !== requestId.current) return []
      setOnsens(result)
      return result
    } catch (err) {
      if (id !== requestId.current) return []
      setError(err instanceof ApiError ? err.message : '목록을 불러오지 못했습니다.')
      return []
    } finally {
      if (pending.current.get(key) === request) pending.current.delete(key)
      if (id === requestId.current) setLoading(false)
    }
  }, [])

  useEffect(() => {
    // 첫 조회는 조건이 없다 — 전국을 다 받지 않게 호출부가 정한 개수만 받는다.
    void load(initialLimit === undefined ? {} : { limit: initialLimit })
    return () => {
      requestId.current += 1
    }
  }, [load, initialLimit])

  return { onsens, loading, error, load }
}
