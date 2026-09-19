import type { PamphletPage } from '@/types/pamphlet'

/** 운영 계정에 팜플렛이 아직 0개라 드롭다운을 확인하려면 표본이 필요하다. */
const PAMPHLETS: PamphletPage['content'] = [
  {
    pamphletId: 1,
    shareToken: 'mock-autumn',
    title: '이번 가을 온천 여행',
    placeCount: 8,
    regionName: '충북',
    partySize: 2,
    travelDate: '2026-10-11',
    coverImage: null,
    shareUrl: null,
    createdAt: '2026-09-18T09:00:00+09:00',
  },
  {
    pamphletId: 2,
    shareToken: 'mock-parents',
    title: '부모님과 갈 곳',
    placeCount: 4,
    regionName: '경북',
    partySize: 4,
    travelDate: null,
    coverImage: null,
    shareUrl: null,
    createdAt: '2026-09-12T09:00:00+09:00',
  },
  {
    pamphletId: 3,
    shareToken: 'mock-gangwon',
    title: '강원도 여행',
    placeCount: 6,
    regionName: '강원',
    partySize: null,
    travelDate: '2026-12-20',
    coverImage: null,
    shareUrl: null,
    createdAt: '2026-08-30T09:00:00+09:00',
  },
]

export function mockFetchPamphlets(): Promise<PamphletPage> {
  return new Promise((resolve) =>
    setTimeout(
      () =>
        resolve({
          content: PAMPHLETS,
          page: 0,
          size: 20,
          totalElements: PAMPHLETS.length,
          totalPages: 1,
          last: true,
        }),
      220,
    ),
  )
}
