import { api } from '@/api'
import { env } from '@/lib/env'

import type { Magazine, MagazineIssue } from '@/types/magazine'

import { mockFetchIssue, mockFetchMagazine, mockFetchMagazines } from './magazineMock'

export type MagazineListParams = {
  category?: string
  region?: string
}

export function fetchIssue(): Promise<MagazineIssue> {
  if (env.useMock) return mockFetchIssue()
  // 비로그인도 매거진을 볼 수 있다 (AUTH-02).
  return api.get<MagazineIssue>('/magazines/issue', { skipAuth: true })
}

export function fetchMagazines({ category, region }: MagazineListParams = {}): Promise<Magazine[]> {
  if (env.useMock) return mockFetchMagazines(category, region)
  return api.get<Magazine[]>('/magazines', { params: { category, region }, skipAuth: true })
}

/** MAG-03 상세. */
export function fetchMagazine(id: number): Promise<Magazine | undefined> {
  if (env.useMock) return mockFetchMagazine(id)
  return api.get<Magazine>(`/magazines/${id}`, { skipAuth: true })
}
