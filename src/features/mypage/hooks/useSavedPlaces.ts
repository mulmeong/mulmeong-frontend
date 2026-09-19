import { useFavorites } from '@/features/favorites/FavoritesProvider'
import { selectSavedPlaces } from '@/features/mypage/api/saved'

import type { RegionGroupId } from '@/types/region'
import type { SavedCategory, SavedFilter } from '@/types/saved'

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
  const { items, loading, error, reload } = useFavorites()
  return {
    data: selectSavedPlaces(items, { filter, region, category }, page),
    loading,
    error,
    reload,
  }
}
