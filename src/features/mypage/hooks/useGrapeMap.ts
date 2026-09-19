import { useEffect, useState } from 'react'

import { ApiError } from '@/api/ApiError'
import { getGrapeMap } from '@/features/mypage/api/myMap'

import type { GrapeLevel, GrapeMap } from '@/types/myMap'

/**
 * 포도알 지도 한 레벨.
 *
 * 시군구를 보는 동안에도 왼쪽 아래 작은 전국 지도가 떠 있어야 해서, 화면은
 * 이 훅을 두 번 쓴다(SIDO 한 번, 고른 시·도의 SIGUNGU 한 번). 그래서 훅 자체는
 * 레벨 하나만 알고, 아직 고른 시·도가 없으면 아무것도 받아오지 않는다.
 *
 * 결과에 '어떤 조건으로 받아온 것인지'를 같이 담는 구조는 useMyReviews와 같다.
 */
export function useGrapeMap(level: GrapeLevel, parentRegionCode?: string) {
  const [loaded, setLoaded] = useState<{ key: string; data?: GrapeMap; error?: string }>()

  // 시군구는 어느 시·도인지 정해져야 받아올 수 있다.
  const skip = level === 'SIGUNGU' && !parentRegionCode
  const key = `${level}|${parentRegionCode ?? ''}`

  /** 지금 조건의 결과일 때만 쓴다. 아직 없으면 불러오는 중이다. */
  const current = loaded?.key === key ? loaded : undefined

  useEffect(() => {
    if (skip) return

    let cancelled = false

    const load = async () => {
      try {
        const data = await getGrapeMap(level, parentRegionCode)
        if (!cancelled) setLoaded({ key, data })
      } catch (cause) {
        if (cancelled) return
        setLoaded({
          key,
          error: cause instanceof ApiError ? cause.message : '내 지도를 불러오지 못했습니다.',
        })
      }
    }

    // state 변경은 전부 await 뒤에서 일어난다 — effect 본문에서 동기로 부르지 않는다.
    void load()

    return () => {
      cancelled = true
    }
  }, [key, skip, level, parentRegionCode])

  return {
    data: current?.data,
    loading: !skip && current === undefined,
    error: current?.error,
  }
}
