import { useCallback, useEffect, useState } from 'react'

import { ApiError } from '@/api/ApiError'
import { getMyReviews } from '@/features/mypage/api/reviews'

import type { MyReviewsPage, ReviewRegion, ReviewSort } from '@/types/myReview'

/**
 * 내 리뷰 목록 도메인 훅.
 * 정렬·페이지·지역이 바뀔 때마다 다시 불러오고, 늦게 도착한 이전 요청은 버린다.
 *
 * 결과에 '어떤 조건으로 받아온 것인지'를 같이 담는다. 조건이 바뀌면 그 결과는
 * 저절로 쓸모없어지므로, 늦게 도착한 응답을 걸러낼 장치도 로딩 플래그도 따로
 * 두지 않는다. 덕분에 effect 안에서 동기로 state를 건드릴 일이 없다.
 */
export function useMyReviews(sort: ReviewSort, page: number, region: ReviewRegion) {
  /** 같은 조건으로 다시 불러올 때 올린다. key가 달라져 effect가 다시 돈다. */
  const [attempt, setAttempt] = useState(0)

  const [loaded, setLoaded] = useState<{ key: string; data?: MyReviewsPage; error?: string }>()

  const key = `${sort}|${page}|${region}|${attempt}`

  /** 지금 조건의 결과일 때만 쓴다. 아직 없으면 불러오는 중이다. */
  const current = loaded?.key === key ? loaded : undefined

  useEffect(() => {
    let cancelled = false

    const load = async () => {
      try {
        const data = await getMyReviews(sort, page, region)
        if (!cancelled) setLoaded({ key, data })
      } catch (cause) {
        if (cancelled) return
        setLoaded({
          key,
          error: cause instanceof ApiError ? cause.message : '리뷰를 불러오지 못했습니다.',
        })
      }
    }

    // state 변경은 전부 await 뒤에서 일어난다 — effect 본문에서 동기로 부르지 않는다.
    void load()

    return () => {
      cancelled = true
    }
  }, [key, sort, page, region])

  const reload = useCallback(() => setAttempt((count) => count + 1), [])

  return {
    data: current?.data,
    loading: current === undefined,
    error: current?.error,
    reload,
  }
}
