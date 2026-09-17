import { useCallback, useEffect, useState } from 'react'

import { fetchOnsenDetail } from '@/features/map/api/onsenDetail'

import type { OnsenDetail } from '@/types/onsenDetail'

/**
 * 캐시는 API 계층에서 공유한다. 목록에 없는 마커는 상세 로딩·재시도를 보여준다.
 */
export function useOnsenDetail(onsenId: number | undefined) {
  const [result, setResult] = useState<{
    onsenId: number
    attempt: number
    detail?: OnsenDetail
    error?: boolean
  }>()

  const [attempt, setAttempt] = useState(0)
  const retry = useCallback(() => setAttempt((value) => value + 1), [])

  useEffect(() => {
    if (onsenId === undefined) return

    let active = true

    fetchOnsenDetail(onsenId)
      .then((detail) => {
        if (active) setResult({ onsenId, attempt, detail })
      })
      .catch(() => {
        if (active) setResult({ onsenId, attempt, error: true })
      })
    return () => {
      active = false
    }
  }, [onsenId, attempt])

  // 다른 온천의 응답이 남아 보이지 않게 렌더 시점에 거른다.
  const current = result?.onsenId === onsenId && result?.attempt === attempt ? result : undefined
  const detail = current?.detail
  const error = Boolean(current?.error)

  return { detail, loading: !detail && !error && onsenId !== undefined, error, retry }
}
