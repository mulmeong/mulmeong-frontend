import { api, ApiError, tokenStorage } from '@/api'
import { env } from '@/lib/env'
import { mockFetchMagazine, mockFetchMagazines, mockSetMagazineLike } from './magazineMock'
import { MAGAZINE_REGION_CODES } from '@/types/magazine'
import type {
  Magazine,
  MagazineDetail,
  MagazineList,
  MagazineListParams,
  MagazineSort,
} from '@/types/magazine'

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
/**
 * 권역으로 거른 목록. 한 권역이 여러 시도코드를 쓰는데(충청=30·36·43·44) 서버는
 * sidoCode를 하나만 받아, 코드별로 받아 합친 뒤 화면에서 정렬·페이징한다.
 *
 * 코드가 하나뿐인 권역은 그냥 평소 경로를 탄다.
 */
export async function fetchMagazinesByRegionName(
  region: string,
  params: MagazineListParams = {},
): Promise<MagazineList> {
  const codes = MAGAZINE_REGION_CODES[region]
  if (!codes?.length) return fetchMagazines(params)
  if (codes.length === 1) return fetchMagazines({ ...params, sidoCode: codes[0] })

  const size = Math.min(30, Math.max(1, params.size ?? 12))
  const page = Math.max(0, params.page ?? 0)
  // 코드마다 앞쪽을 넉넉히 받아 합친다. 서버가 권역을 지원하면 이 함수는 사라진다.
  const pages = await Promise.all(
    codes.map((sidoCode) =>
      fetchMagazines({ ...params, sidoCode, page: 0, size: 30 }).catch(() => null),
    ),
  )
  const seen = new Set<number>()
  const merged = pages
    .flatMap((item) => item?.content ?? [])
    .filter((magazine) => !seen.has(magazine.magazineId) && seen.add(magazine.magazineId))
  const sorted = sortMagazines(merged, params.sort ?? 'LATEST')
  const start = page * size
  const slice = sorted.slice(start, start + size)
  return {
    content: slice,
    page,
    size,
    totalElements: sorted.length,
    totalPages: Math.max(1, Math.ceil(sorted.length / size)),
    last: start + size >= sorted.length,
    categories: pages.find((item) => item?.categories?.length)?.categories ?? null,
    regions: null,
  }
}

function sortMagazines(items: Magazine[], sort: MagazineSort): Magazine[] {
  const copy = [...items]
  if (sort === 'POPULAR') return copy.sort((a, b) => b.likeCount - a.likeCount)
  if (sort === 'READ_TIME') return copy.sort((a, b) => a.readMinutes - b.readMinutes)
  return copy.sort((a, b) => b.publishedAt.localeCompare(a.publishedAt))
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

/**
 * 지도 8권역 → 행안부 sidoCode. 매거진은 코드로만 거를 수 있고 한 권역이 여러 코드를
 * 쓰므로 나눠 부른 뒤 합친다. 목록 size 상한이 30이라 전부 받아 프론트에서 거를 수 없다.
 */
const REGION_SIDO_CODES: Record<string, string[]> = {
  서울: ['11'],
  부산: ['26'],
  경기: ['41'],
  인천: ['28'],
  강원: ['51', '42'],
  충청: ['30', '36', '43', '44'],
  경상: ['26', '27', '31', '47', '48'],
  전라: ['29', '45', '46', '52'],
  제주: ['50'],
}

/** 권역에 속한 매거진을 코드별로 받아 최신순으로 합친다. */
export async function fetchMagazinesByRegion(region: string, size = 5) {
  const codes = REGION_SIDO_CODES[region]
  if (!codes) return []
  const pages = await Promise.all(
    codes.map((sidoCode) => fetchMagazines({ sidoCode, size }).catch(() => null)),
  )
  return pages
    .flatMap((page) => page?.content ?? [])
    .sort((a, b) => b.publishedAt.localeCompare(a.publishedAt))
}
