import { useEffect, useState } from 'react'

import { ApiError } from '@/api/ApiError'
import { getDartOrigins } from '@/features/dart/api/origins'

import type { DartOrigin } from '@/types/dart'

/**
 * 추천 출발지(DART-404)와 지금 정해진 출발지.
 *
 * 목록은 지름길이자 DART-01 폴백의 마지막 단이다 — 검색·GPS가 막혀도 여기서
 * 고를 수 있어야 한다. 그래서 고른 값은 이 목록 밖(검색·GPS 결과)일 수도 있다.
 *
 * 고른 값을 따로 들지 않고 '아직 안 골랐으면 첫 번째'로 계산한다 — 목록이 도착한
 * 뒤에 기본값을 넣어주는 effect가 필요 없어지고, 목록이 비어 있는 동안에도
 * selected가 null로 자연스럽게 남는다.
 */
export function useDartOrigins() {
  const [origins, setOrigins] = useState<DartOrigin[]>([])
  const [picked, setPicked] = useState<DartOrigin>()
  const [error, setError] = useState<string>()
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let cancelled = false

    const load = async () => {
      try {
        const data = await getDartOrigins()
        if (!cancelled) setOrigins(data)
      } catch (cause) {
        if (cancelled) return
        setError(
          cause instanceof ApiError ? cause.message : '추천 출발지를 불러오지 못했습니다.',
        )
      } finally {
        if (!cancelled) setLoading(false)
      }
    }

    // state 변경은 전부 await 뒤에서 일어난다 — effect 본문에서 동기로 부르지 않는다.
    void load()

    return () => {
      cancelled = true
    }
  }, [])

  return {
    origins,
    selected: picked ?? origins[0] ?? null,
    select: setPicked,
    loading,
    error,
  }
}
