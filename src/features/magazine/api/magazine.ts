import { api, ApiError, tokenStorage } from '@/api'
import { env } from '@/lib/env'
import { mockFetchMagazine, mockFetchMagazines, mockSetMagazineLike } from './magazineMock'
import type { MagazineDetail, MagazineList, MagazineListParams } from '@/types/magazine'

export type { MagazineListParams } from '@/types/magazine'

// 공개 읽기 API도 로그인 토큰이 있으면 첨부해 isLiked를 받는다. 로그인은 필수가 아니다.
let revision = 0
const listeners = new Set<() => void>()
const cache = new Map<string, { value: MagazineList; expires: number }>()
const pending = new Map<string, Promise<MagazineList>>()
export const magazineChanges = {
  subscribe(listener: () => void) {
    listeners.add(listener)
    return () => {
      listeners.delete(listener)
    }
  },
  snapshot: () => revision,
}
export function invalidateMagazines() {
  revision += 1
  cache.clear()
  for (const listener of listeners) listener()
}
export function fetchMagazines(params: MagazineListParams = {}): Promise<MagazineList> {
  const normalized = {
    category: params.category ?? 'ALL',
    sidoCode: params.sidoCode,
    sort: params.sort ?? 'LATEST',
    featured: params.featured ?? false,
    page: Math.max(0, params.page ?? 0),
    size: Math.min(30, Math.max(1, params.size ?? (params.featured ? 5 : 12))),
  }
  const key = JSON.stringify([normalized, tokenStorage.get(), revision])
  const saved = cache.get(key)
  if (saved && saved.expires > Date.now()) return Promise.resolve(saved.value)
  const existing = pending.get(key)
  if (existing) return existing
  const version = revision
  const request = (
    env.useMockMagazine
      ? mockFetchMagazines(normalized)
      : api.get<MagazineList>('/magazines', { params: normalized })
  )
    .then((value) => {
      if (version === revision) cache.set(key, { value, expires: Date.now() + 60_000 })
      return value
    })
    .finally(() => pending.delete(key))
  pending.set(key, request)
  return request
}
export async function fetchMagazine(id: number): Promise<MagazineDetail> {
  if (!Number.isSafeInteger(id) || id <= 0) throw new ApiError(404, '글을 찾을 수 없습니다.')
  if (env.useMockMagazine) return mockFetchMagazine(id)
  return api.get<MagazineDetail>(`/magazines/${id}`)
}
export async function setMagazineLike(id: number, liked: boolean): Promise<void> {
  try {
    if (env.useMockMagazine) await mockSetMagazineLike(id, liked)
    else if (liked) await api.post<void>(`/magazines/${id}/like`)
    else await api.delete<void>(`/magazines/${id}/like`)
  } finally {
    // 성공·실패 모두 낙관적 상태와 목록 캐시를 다시 동기화한다.
    invalidateMagazines()
  }
}
