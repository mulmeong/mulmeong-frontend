import { useCallback, useEffect, useRef, useState } from 'react'

import { ApiError } from '@/api/ApiError'
import { getMyReviews } from '@/features/mypage/api/reviews'

import type { MyReviewsPage, ReviewRegion, ReviewSort } from '@/types/myReview'

/**
 * 내 리뷰 목록 도메인 훅.
 * 정렬·페이지·지역이 바뀔 때마다 다시 불러오고, 늦게 도착한 이전 요청은 버린다.
 */
export function useMyReviews(sort: ReviewSort, page: number, region: ReviewRegion) {
  const [data, setData] = useState<MyReviewsPage>()
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string>()

  /** 늦게 도착한 이전 요청이 최신 결과를 덮어쓰지 않게 한다. */
  const requestId = useRef(0)

  const load = useCallback(async () => {
    const id = ++requestId.current
    setLoading(true)
    setError(undefined)
    try {
      const result = await getMyReviews(sort, page, region)
      if (id !== requestId.current) return
      setData(result)
    } catch (cause) {
      if (id !== requestId.current) return
      setError(cause instanceof ApiError ? cause.message : '리뷰를 불러오지 못했습니다.')
    } finally {
      if (id === requestId.current) setLoading(false)
    }
  }, [sort, page, region])

  useEffect(() => {
    // load()가 시작할 때 setLoading(true)를 불러 set-state-in-effect에 걸린다.
    // 서버에서 목록을 받아오는 일은 이 규칙이 말하는 "외부 시스템과의 동기화"라
    // effect가 맞는 자리다. features/map/hooks/useOnsens.ts도 같은 구조다.
    // oxlint-disable-next-line react/set-state-in-effect
    void load()
  }, [load])

  return { data, loading, error, reload: load }
}
