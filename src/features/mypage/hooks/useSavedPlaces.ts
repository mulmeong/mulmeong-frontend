import { useCallback, useEffect, useRef, useState } from 'react'

import { ApiError } from '@/api/ApiError'
import { getSavedPlaces } from '@/features/mypage/api/saved'

import type { RegionGroupId } from '@/types/region'
import type { SavedCategory, SavedFilter, SavedPlacesPage } from '@/types/saved'

/**
 * 찜한 장소 목록 도메인 훅.
 * 조건·페이지가 바뀔 때마다 다시 불러오고, 늦게 도착한 이전 요청은 버린다.
 *
 * 조건을 객체 하나로 받지 않고 셋으로 펼쳐 받는다 — 호출부가 매 렌더 새 객체를
 * 만들면 참조가 매번 달라져 다시 불러오기가 멈추지 않는다.
 */
export function useSavedPlaces(
  filter: SavedFilter,
  region: RegionGroupId,
  category: SavedCategory | 'all',
  page: number,
) {
  const [data, setData] = useState<SavedPlacesPage>()
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string>()

  /** 늦게 도착한 이전 요청이 최신 결과를 덮어쓰지 않게 한다. */
  const requestId = useRef(0)

  const load = useCallback(async () => {
    const id = ++requestId.current
    setLoading(true)
    setError(undefined)
    try {
      const result = await getSavedPlaces({ filter, region, category }, page)
      if (id !== requestId.current) return
      setData(result)
    } catch (cause) {
      if (id !== requestId.current) return
      setError(cause instanceof ApiError ? cause.message : '찜한 장소를 불러오지 못했습니다.')
    } finally {
      if (id === requestId.current) setLoading(false)
    }
  }, [filter, region, category, page])

  useEffect(() => {
    // load()가 시작할 때 setLoading(true)를 불러 set-state-in-effect에 걸린다.
    // 서버에서 목록을 받아오는 일은 이 규칙이 말하는 "외부 시스템과의 동기화"라
    // effect가 맞는 자리다. useMyReviews도 같은 구조다.
    // oxlint-disable-next-line react/set-state-in-effect
    void load()
  }, [load])

  return { data, loading, error, reload: load }
}
