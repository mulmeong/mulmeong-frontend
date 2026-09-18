import { useEffect, useRef, useState } from 'react'

import { ApiError } from '@/api/ApiError'
import { fetchNearby } from '@/features/map/api/nearby'

import type { NearbyResult } from '@/types/nearby'

type Fetched = { onsenId: number; result: NearbyResult }

/**
 * PAM-04 주변 여행지. 온천을 옮겨 다니며 열기 때문에 한 번 받은 건 캐시에 남긴다
 * — 서버도 24시간 캐싱하지만 왕복 자체를 줄인다 (쿼터 방어).
 */
export function useNearby(onsenId: number | undefined, enabled: boolean) {
  const [fetched, setFetched] = useState<Fetched>()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string>()

  const cache = useRef(new Map<number, NearbyResult>())
  const requestId = useRef(0)

  useEffect(() => {
    if (!enabled || onsenId === undefined) return

    const cached = cache.current.get(onsenId)
    if (cached) {
      setFetched({ onsenId, result: cached })
      setLoading(false)
      setError(undefined)
      return
    }

    const id = ++requestId.current
    setLoading(true)
    setError(undefined)

    fetchNearby(onsenId)
      .then((result) => {
        if (id !== requestId.current) return
        cache.current.set(onsenId, result)
        setFetched({ onsenId, result })
      })
      .catch((err: unknown) => {
        if (id !== requestId.current) return
        setError(err instanceof ApiError ? err.message : '주변 여행지를 불러오지 못했습니다.')
      })
      .finally(() => {
        if (id === requestId.current) setLoading(false)
      })
  }, [onsenId, enabled])

  // 다른 온천의 응답이 남아 보이지 않게 렌더 시점에 걸러낸다 (effect에서 지우면 깜빡인다).
  const result = fetched && fetched.onsenId === onsenId ? fetched.result : undefined

  return { result, loading, error }
}
