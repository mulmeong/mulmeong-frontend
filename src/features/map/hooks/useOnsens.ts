import { useCallback, useEffect, useRef, useState } from 'react'

import { ApiError } from '@/api/ApiError'
import { searchOnsens } from '@/features/map/api/map'

import type { Onsen } from '@/types/onsen'

type Filters = {
  keyword?: string
  region?: string
}

/**
 * 지도 목록 도메인 훅. 컴포넌트는 props가 아니라 이 훅으로 접근한다.
 * 같은 조건으로는 다시 요청하지 않는다 — 관광공사·카카오 API에 일일 쿼터가 있다.
 */
export function useOnsens() {
  const [onsens, setOnsens] = useState<Onsen[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string>()

  const cache = useRef(new Map<string, Onsen[]>())
  /** 늦게 도착한 이전 요청이 최신 결과를 덮어쓰지 않게 한다. */
  const requestId = useRef(0)

  const load = useCallback(async (filters: Filters = {}) => {
    const key = `${filters.keyword ?? ''}|${filters.region ?? ''}`

    const cached = cache.current.get(key)
    if (cached) {
      setOnsens(cached)
      setLoading(false)
      setError(undefined)
      return
    }

    const id = ++requestId.current
    setLoading(true)
    setError(undefined)
    try {
      const result = await searchOnsens(filters)
      if (id !== requestId.current) return
      cache.current.set(key, result)
      setOnsens(result)
    } catch (err) {
      if (id !== requestId.current) return
      setError(err instanceof ApiError ? err.message : '목록을 불러오지 못했습니다.')
    } finally {
      if (id === requestId.current) setLoading(false)
    }
  }, [])

  useEffect(() => {
    void load()
  }, [load])

  return { onsens, loading, error, load }
}
