import { useCallback, useEffect, useRef, useState } from 'react'

import { ApiError } from '@/api/ApiError'
import { fetchMagazines } from '@/features/magazine/api/magazine'

import type { Magazine } from '@/types/magazine'

/**
 * 매거진 목록 도메인 훅. 카테고리·지역이 바뀔 때만 다시 불러온다.
 * 같은 조건은 캐시에서 준다 — 관광공사 API 쿼터 방어와 같은 이유다.
 */
export function useMagazines(category?: string, region?: string) {
  const [magazines, setMagazines] = useState<Magazine[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string>()

  const cache = useRef(new Map<string, Magazine[]>())
  const requestId = useRef(0)

  const load = useCallback(async (nextCategory?: string, nextRegion?: string) => {
    const key = `${nextCategory ?? ''}|${nextRegion ?? ''}`

    const cached = cache.current.get(key)
    if (cached) {
      setMagazines(cached)
      setLoading(false)
      setError(undefined)
      return
    }

    const id = ++requestId.current
    setLoading(true)
    setError(undefined)
    try {
      const result = await fetchMagazines({ category: nextCategory, region: nextRegion })
      if (id !== requestId.current) return
      cache.current.set(key, result)
      setMagazines(result)
    } catch (err) {
      if (id !== requestId.current) return
      setError(err instanceof ApiError ? err.message : '매거진을 불러오지 못했습니다.')
    } finally {
      if (id === requestId.current) setLoading(false)
    }
  }, [])

  useEffect(() => {
    void load(category, region)
  }, [load, category, region])

  return { magazines, loading, error }
}
