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

/**
 * 표본 팜플렛의 장소. 실제 온천 좌표를 써서 지도에 그럴듯하게 찍힌다.
 * water·facilities·access·reviewSummary 등은 온천 상세 화면과 같은 표본값을
 * 실어, 목데이터로도 팜플렛의 온천 강조 정보를 확인할 수 있게 한다.
 */
const PLACES: Record<number, PamphletDetail['places']> = {
  1: [
    {
      seq: 1,
      placeId: 506,
      placeType: 'ONSEN',
      placeTypeLabel: '온천',
      name: '가조온천',
      address: '경남 거창군 가조면 온천길 12',
      lat: 35.755,
      lng: 128.03,
      // 실측(CLAUDE.md): 온천 524곳 중 사진이 있는 곳은 소수다 — 표본에도
      // 이미지 없는 온천을 하나 남겨 DEFAULT_ONSEN_IMAGE 폴백을 확인한다.
      water: {
        temp: 27.4,
        type: 'Na-HCO₃',
        component: 'Na-HCO₃',
        ph: 8.1,
        benefit: '약알칼리성 — 피부 진정에 좋아요',
      },
      facilities: { hasOutdoor: true, hasLodging: true, facilityType: '노천탕·숙박' },
      access: {
        accessLevel: 'CAR_RECOMMENDED',
        accessLevelLabel: '차량 권장',
        nearestStation: {
          name: '거창버스터미널',
          lat: 35.686,
          lng: 127.909,
          stationToPlaceDesc: '터미널에서 차로 20분',
        },
      },
      reviewSummary: { count: 24, avgRating: 4.3 },
      priceMin: 8000,
      regionComment: '거창 8경 중 하나인 가조 온천지구',
    },
    {
      seq: 2,
      placeId: 299,
      placeType: 'ONSEN',
      placeTypeLabel: '온천',
      name: '동부산온천호텔',
      address: '부산 기장군 장안읍 해맞이로 100',
      lat: 35.34,
      lng: 129.222,
      water: {
        temp: 33.8,
        type: 'Cl',
        component: 'Na-Cl',
        ph: 7.6,
        benefit: '염화천 — 보온 효과가 좋아요',
      },
      facilities: { hasOutdoor: false, hasLodging: true, facilityType: '실내탕·숙박' },
      access: { accessLevel: 'CAR_REQUIRED', accessLevelLabel: '차량 필수' },
      reviewSummary: { count: 9, avgRating: 3.9 },
    },
    {
      seq: 3,
      placeId: 620,
      placeType: 'RESTAURANT',
      placeTypeLabel: '식당',
      name: '기장 대변항 활어회센터',
      address: '부산 기장군 기장읍 대변항로 33',
      subText: '식당',
      images: ['/images/placeholders/restaurant.svg'],
      source: 'TOUR_API',
      lat: 35.238,
      lng: 129.219,
      notes: '온천 가는 길에 들르기 좋은 활어회 골목',
    },
    {
      seq: 4,
      placeId: 381,
      placeType: 'ONSEN',
      placeTypeLabel: '온천',
      name: '담양온천리조트',
      address: '전남 담양군 봉산면 온천길 40',
      lat: 35.32,
      lng: 126.964,
      water: { temp: 29.5, type: 'HCO₃', ph: 7.9 },
      access: { accessLevel: 'WALKABLE', accessLevelLabel: '뚜벅이 가능' },
    },
  ],
  2: [
    {
      seq: 1,
      placeId: 207,
      placeType: 'ONSEN',
      placeTypeLabel: '온천',
      name: '그린랜드',
      address: '경북 칠곡군 북삼읍 인강5길 75',
      lat: 36.03,
      lng: 128.385,
      water: {
        temp: 31.0,
        type: 'Na-CO₃',
        component: 'Na-CO₃',
        benefit: '탄산천 — 혈액순환에 좋아요',
      },
      facilities: { hasOutdoor: true, facilityType: '노천탕' },
      reviewSummary: { count: 41, avgRating: 4.5 },
      priceMin: 12000,
    },
    {
      seq: 2,
      placeId: 506,
      placeType: 'ONSEN',
      placeTypeLabel: '온천',
      name: '가조온천',
      address: '경남 거창군 가조면 온천길 12',
      lat: 35.755,
      lng: 128.03,
    },
  ],
  3: [
    {
      seq: 1,
      placeId: 32,
      placeType: 'ONSEN',
      placeTypeLabel: '온천',
      name: '더앤리조트 스파온',
      address: '강원 고성군 토성면 스파온길 8',
      lat: 38.0,
      lng: 128.6,
      water: { temp: 26.0, type: 'Cl', ph: 7.2, benefit: '염류천' },
      access: { accessLevel: 'CAR_REQUIRED', accessLevelLabel: '차량 필수' },
    },
  ],
}

const SUMMARIES: Record<number, PamphletDetail['summary']> = {
  1: { placeCount: 4, onsenCount: 3, regionName: '경남·부산·전남' },
  2: { placeCount: 2, onsenCount: 2, regionName: '경북' },
  3: { placeCount: 1, onsenCount: 1, regionName: '강원' },
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
      resolve({
        ...item,
        isMine: true,
        places,
        summary: SUMMARIES[pamphletId] ?? null,
        author: { nickname: '소희', level: 3, title: '온천 러버' },
      })
    }, 200),
  )
}
