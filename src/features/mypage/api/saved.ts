import { api } from '@/api'
import { env } from '@/lib/env'

import { mockDeleteSavedPlace, mockGetSavedPlaces } from './savedMock'

import type { SavedPlacesPage, SavedQuery } from '@/types/saved'

/** TODO: 엔드포인트·응답 형태는 백엔드와 맞춘 뒤 수정할 것. */
export function getSavedPlaces(query: SavedQuery, page: number): Promise<SavedPlacesPage> {
  if (env.useMock) return mockGetSavedPlaces(query, page)
  return api.get<SavedPlacesPage>('/users/me/saved', {
    // 고르지 않은 조건은 보내지 않는다 — 조건이 없는 것과 같다.
    params: {
      page,
      region: query.filter === 'region' && query.region !== 'all' ? query.region : undefined,
      category:
        query.filter === 'category' && query.category !== 'all' ? query.category : undefined,
    },
  })
}

export function deleteSavedPlace(savedId: number): Promise<void> {
  if (env.useMock) return mockDeleteSavedPlace()
  return api.delete<void>(`/users/me/saved/${savedId}`)
}
