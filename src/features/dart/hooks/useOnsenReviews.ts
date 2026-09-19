import { useEffect, useState } from 'react'

import { ApiError } from '@/api/ApiError'
import { getOnsenReviews } from '@/features/dart/api/onsenReviews'

import type { OnsenReview, OnsenReviewSort } from '@/types/review'

type Loaded = {
  /** 어떤 온천·정렬의 결과인지. 조건이 바뀌면 통째로 버린다. */
  key: string
  items: OnsenReview[]
  /** 마지막으로 받아온 페이지 번호(0부터). */
  page: number
  last: boolean
  total: number
  error?: string
}

function messageOf(cause: unknown): string {
  return cause instanceof ApiError ? cause.message : '리뷰를 불러오지 못했습니다.'
}

/**
 * 온천별 리뷰 목록 (REV-07).
 *
 * '더 보기'로 한 페이지씩 이어 붙인다. 정렬을 바꾸면 서버가 순서를 다시 매기므로
 * 쌓아둔 걸 버리고 첫 페이지부터 다시 받는다.
 */
export function useOnsenReviews(onsenId: number, sort: OnsenReviewSort) {
  const [loaded, setLoaded] = useState<Loaded>()
  const [loadingMore, setLoadingMore] = useState(false)

  const key = `${onsenId}|${sort}`
  /** 지금 조건의 결과일 때만 쓴다. 아직 없으면 첫 페이지를 불러오는 중이다. */
  const current = loaded?.key === key ? loaded : undefined

  useEffect(() => {
    let cancelled = false

    const load = async () => {
      try {
        const page = await getOnsenReviews(onsenId, { sort, page: 0 })
        if (cancelled) return
        setLoaded({
          key,
          items: page.content,
          page: page.page,
          last: page.last,
          total: page.totalElements,
        })
      } catch (cause) {
        if (cancelled) return
        setLoaded({ key, items: [], page: 0, last: true, total: 0, error: messageOf(cause) })
      }
    }

    // state 변경은 전부 await 뒤에서 일어난다 — effect 본문에서 동기로 부르지 않는다.
    void load()

    return () => {
      cancelled = true
    }
  }, [key, onsenId, sort])

  const loadMore = async () => {
    if (!current || current.last || loadingMore) return

    setLoadingMore(true)
    try {
      const next = await getOnsenReviews(onsenId, { sort, page: current.page + 1 })
      setLoaded((prev) =>
        // 기다리는 동안 정렬이 바뀌었으면 낡은 페이지를 붙이지 않는다.
        prev?.key === key
          ? {
              ...prev,
              items: [...prev.items, ...next.content],
              page: next.page,
              last: next.last,
              error: undefined,
            }
          : prev,
      )
    } catch (cause) {
      // 이미 보고 있는 목록은 남기고 사유만 덧붙인다.
      setLoaded((prev) => (prev?.key === key ? { ...prev, error: messageOf(cause) } : prev))
    } finally {
      setLoadingMore(false)
    }
  }

  return {
    items: current?.items ?? [],
    total: current?.total ?? 0,
    hasMore: current !== undefined && !current.last,
    loading: current === undefined,
    loadingMore,
    error: current?.error,
    loadMore,
  }
}
