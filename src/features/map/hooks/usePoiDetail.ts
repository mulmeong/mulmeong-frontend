import { useCallback, useEffect, useState } from 'react'

import { fetchPoiDetail } from '@/features/map/api/poiDetail'

import type { PoiDetail } from '@/types/poi'

/**
 * 캐시는 API 계층에서 공유한다. 목록 응답만으로도 카드가 그려지므로 상세는 보강용이다 —
 * 실패해도 패널을 비우지 않고 목록 값으로 버틴다.
 */
export function usePoiDetail(
  externalId: string | undefined,
  contentTypeId?: string | number | null,
) {
  const [result, setResult] = useState<{
    externalId: string
    attempt: number
    detail?: PoiDetail
    error?: boolean
  }>()

  const [attempt, setAttempt] = useState(0)
  const retry = useCallback(() => setAttempt((value) => value + 1), [])

  useEffect(() => {
    if (!externalId) return

    let active = true

    fetchPoiDetail(externalId, contentTypeId)
      .then((detail) => {
        if (active) setResult({ externalId, attempt, detail })
      })
      .catch(() => {
        if (active) setResult({ externalId, attempt, error: true })
      })
    return () => {
      active = false
    }
  }, [externalId, contentTypeId, attempt])

  // 다른 장소의 응답이 남아 보이지 않게 렌더 시점에 거른다.
  const current =
    result?.externalId === externalId && result?.attempt === attempt ? result : undefined
  const detail = current?.detail
  const error = Boolean(current?.error)

  return { detail, loading: !detail && !error && Boolean(externalId), error, retry }
}
