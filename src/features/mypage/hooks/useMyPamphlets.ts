import { useCallback, useEffect, useRef, useState } from 'react'

import { ApiError } from '@/api'
import {
  deletePamphlet,
  fetchPamphletDetail,
  fetchPamphlets,
} from '@/features/mypage/api/pamphlets'

import type { PamphletDetail, PamphletPage } from '@/types/pamphlet'

/** 한 화면에 보여줄 팜플렛 수. 서버 기본값과 맞춘다. */
export const PAMPHLET_PAGE_SIZE = 12

/**
 * 내 팜플렛 목록(MY-12).
 *
 * 목록 응답에는 장소가 없고 placeCount만 온다. 장소를 보여주려면 상세를 따로
 * 받아야 해서, 표지를 펼칠 때와 관리 화면이 같은 캐시를 나눠 쓴다.
 */
export function useMyPamphlets(page: number) {
  const [data, setData] = useState<PamphletPage>()
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string>()
  const [attempt, setAttempt] = useState(0)

  useEffect(() => {
    let alive = true
    setLoading(true)
    fetchPamphlets(page - 1, PAMPHLET_PAGE_SIZE)
      .then((result) => {
        if (alive) {
          setData(result)
          setError(undefined)
        }
      })
      .catch((cause) => {
        if (alive) {
          setError(cause instanceof ApiError ? cause.message : '팜플렛을 불러오지 못했습니다.')
        }
      })
      .finally(() => {
        if (alive) setLoading(false)
      })
    return () => {
      alive = false
    }
  }, [page, attempt])

  const reload = useCallback(() => setAttempt((count) => count + 1), [])

  return { data, loading, error, reload }
}

/**
 * 팜플렛 상세. 같은 팜플렛을 표지에서 한 번, 관리 화면에서 또 한 번 열어도
 * 요청은 한 번만 나가게 캐시한다 (비기능 ① API 캐싱 우선).
 */
export function usePamphletDetail(pamphletId: number | undefined) {
  const cache = useRef(new Map<number, PamphletDetail>())
  const [detail, setDetail] = useState<PamphletDetail>()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string>()

  useEffect(() => {
    if (pamphletId === undefined) {
      setDetail(undefined)
      setError(undefined)
      return
    }

    const cached = cache.current.get(pamphletId)
    if (cached) {
      setDetail(cached)
      setError(undefined)
      return
    }

    let alive = true
    setLoading(true)
    setDetail(undefined)
    fetchPamphletDetail(pamphletId)
      .then((result) => {
        cache.current.set(pamphletId, result)
        if (alive) {
          setDetail(result)
          setError(undefined)
        }
      })
      .catch((cause) => {
        if (alive) {
          setError(cause instanceof ApiError ? cause.message : '팜플렛을 불러오지 못했습니다.')
        }
      })
      .finally(() => {
        if (alive) setLoading(false)
      })
    return () => {
      alive = false
    }
  }, [pamphletId])

  /** 지운 팜플렛이 캐시에 남아 있으면 다시 열 때 되살아난다. */
  const remove = useCallback(async (id: number) => {
    await deletePamphlet(id)
    cache.current.delete(id)
  }, [])

  return { detail, loading, error, remove }
}
