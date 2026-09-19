import { useCallback, useEffect, useState } from 'react'

import { ApiError } from '@/api/ApiError'
import { getSavedPlaces } from '@/features/mypage/api/saved'

import type { RegionGroupId } from '@/types/region'
import type { SavedCategory, SavedFilter, SavedPlacesPage } from '@/types/saved'

/**
 * 찜한 장소 목록 도메인 훅.
 * 조건·페이지가 바뀔 때마다 다시 불러오고, 늦게 도착한 이전 요청은 버린다.
 *
 * 조건을 객체 하나로 받지 않고 넷으로 펼쳐 받는다 — 호출부가 매 렌더 새 객체를
 * 만들면 참조가 매번 달라져 다시 불러오기가 멈추지 않는다.
 *
 * 결과에 '어떤 조건으로 받아온 것인지'를 같이 담는 구조는 useMyReviews와 같다.
 */
export function useSavedPlaces(
  filter: SavedFilter,
  region: RegionGroupId,
  category: SavedCategory | 'all',
  page: number,
) {
  /** 같은 조건으로 다시 불러올 때 올린다. key가 달라져 effect가 다시 돈다. */
  const [attempt, setAttempt] = useState(0)

  const [loaded, setLoaded] = useState<{ key: string; data?: SavedPlacesPage; error?: string }>()

  const key = `${filter}|${region}|${category}|${page}|${attempt}`

  /** 지금 조건의 결과일 때만 쓴다. 아직 없으면 불러오는 중이다. */
  const current = loaded?.key === key ? loaded : undefined

  useEffect(() => {
    let cancelled = false

    const load = async () => {
      try {
        const data = await getSavedPlaces({ filter, region, category }, page)
        if (!cancelled) setLoaded({ key, data })
      } catch (cause) {
        if (cancelled) return
        setLoaded({
          key,
          error: cause instanceof ApiError ? cause.message : '찜한 장소를 불러오지 못했습니다.',
        })
      }
    }

    // state 변경은 전부 await 뒤에서 일어난다 — effect 본문에서 동기로 부르지 않는다.
    void load()

    return () => {
      cancelled = true
    }
  }, [key, filter, region, category, page])

  const reload = useCallback(() => setAttempt((count) => count + 1), [])

  return {
    data: current?.data,
    loading: current === undefined,
    error: current?.error,
    reload,
  }
}
