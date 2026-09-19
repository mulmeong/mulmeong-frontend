import { useEffect, useState } from 'react'

import { ApiError } from '@/api/ApiError'
import { getMyReviews } from '@/features/mypage/api/reviews'

import type { MyReviewsPage } from '@/types/myReview'

/**
 * 한 지역의 최신 리뷰 몇 건. 내 지도 오른쪽 패널이 쓴다.
 * regionCode가 없으면 전국이다.
 *
 * 결과에 '어떤 조건으로 받아온 것인지'를 같이 담는 구조는 useMyReviews와 같다.
 */
export function useRegionReviews(regionCode: string | undefined, size: number) {
  const [loaded, setLoaded] = useState<{ key: string; data?: MyReviewsPage; error?: string }>()

  const key = `${regionCode ?? ''}|${size}`

  /** 지금 조건의 결과일 때만 쓴다. 아직 없으면 불러오는 중이다. */
  const current = loaded?.key === key ? loaded : undefined

  useEffect(() => {
    let cancelled = false

    const load = async () => {
      try {
        const data = await getMyReviews({ regionCode, size })
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
  }, [key, regionCode, size])

  return {
    data: current?.data,
    loading: current === undefined,
    error: current?.error,
  }
}
