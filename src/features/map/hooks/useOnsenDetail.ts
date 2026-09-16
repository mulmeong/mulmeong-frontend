import { useEffect, useRef, useState } from 'react'

import { ApiError } from '@/api/ApiError'
import { fetchOnsenDetail } from '@/features/map/api/onsenDetail'

import type { OnsenDetail } from '@/types/onsenDetail'

/**
 * PAM-03 온천 상세. 마커를 옮겨 다니며 열기 때문에 받은 건 캐시에 남긴다.
 * 목록 데이터로 먼저 그리고, 도착하면 상세로 덮는 방식이라 로딩 중에도 화면이 비지 않는다.
 */
export function useOnsenDetail(onsenId: number | undefined) {
  const [fetched, setFetched] = useState<{ onsenId: number; detail: OnsenDetail }>()
  const [failed, setFailed] = useState<number>()

  const cache = useRef(new Map<number, OnsenDetail>())
  const requestId = useRef(0)

  useEffect(() => {
    if (onsenId === undefined) return

    const cached = cache.current.get(onsenId)
    if (cached) {
      setFetched({ onsenId, detail: cached })
      return
    }

    const id = ++requestId.current

    fetchOnsenDetail(onsenId)
      .then((detail) => {
        if (id !== requestId.current) return
        cache.current.set(onsenId, detail)
        setFetched({ onsenId, detail })
      })
      .catch((err: unknown) => {
        if (id !== requestId.current) return
        // 상세가 실패해도 목록 데이터로 그린 화면은 남는다 — 조용히 접는다.
        if (!(err instanceof ApiError) && !(err instanceof Error)) return
        setFailed(onsenId)
      })
  }, [onsenId])

  // 다른 온천의 응답이 남아 보이지 않게 렌더 시점에 거른다.
  const detail = fetched && fetched.onsenId === onsenId ? fetched.detail : undefined
  const error = failed === onsenId && onsenId !== undefined

  return { detail, loading: !detail && !error && onsenId !== undefined, error }
}
