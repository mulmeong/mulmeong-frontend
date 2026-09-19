import { useFavorites } from '@/features/favorites/FavoritesProvider'
import { selectSavedPlaces } from '@/features/mypage/api/saved'

import type { SavedCategory, SavedSort } from '@/types/saved'

/**
 * 찜한 장소 목록 도메인 훅.
 *
 * FavoritesProvider가 찜 버튼 상태 때문에 전체 목록을 이미 들고 있다.
 * 거르기·정렬·쪽 나누기는 그 배열 위에서 하므로 여기서 따로 받아오지 않는다.
 *
 * 조건을 객체 하나로 받지 않고 펼쳐 받는다 — 호출부가 매 렌더 새 객체를
 * 만들면 참조가 매번 달라진다.
 */
export function useSavedPlaces(sort: SavedSort, category: SavedCategory | 'all', page: number) {
  const { items, loading, error, reload } = useFavorites()
  return {
    data: selectSavedPlaces(items, { sort, category }, page),
    loading,
    error,
    reload,
  }
}
