import type { PamphletDetail, PamphletPage } from '@/types/pamphlet'

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

/** 표본 팜플렛의 장소. 실제 온천 좌표를 써서 지도에 그럴듯하게 찍힌다. */
const PLACES: Record<number, PamphletDetail['places']> = {
  1: [
    { seq: 1, placeId: 506, placeType: 'ONSEN', name: '가조온천', lat: 35.755, lng: 128.03 },
    { seq: 2, placeId: 299, placeType: 'ONSEN', name: '동부산온천호텔', lat: 35.34, lng: 129.222 },
    { seq: 3, placeId: 381, placeType: 'ONSEN', name: '담양온천리조트', lat: 35.32, lng: 126.964 },
  ],
  2: [
    { seq: 1, placeId: 207, placeType: 'ONSEN', name: '그린랜드', lat: 36.03, lng: 128.385 },
    { seq: 2, placeId: 506, placeType: 'ONSEN', name: '가조온천', lat: 35.755, lng: 128.03 },
  ],
  3: [
    { seq: 1, placeId: 32, placeType: 'ONSEN', name: '더앤리조트 스파온', lat: 38.0, lng: 128.6 },
  ],
}

export function mockFetchPamphletDetail(pamphletId: number): Promise<PamphletDetail> {
  const item = PAMPHLETS.find((pamphlet) => pamphlet.pamphletId === pamphletId)
  const places = PLACES[pamphletId] ?? []
  return new Promise((resolve, reject) =>
    setTimeout(() => {
      if (!item) {
        reject(new Error('팜플렛을 찾을 수 없어요.'))
        return
      }
      resolve({ ...item, isMine: true, places, summary: null })
    }, 200),
  )
}
