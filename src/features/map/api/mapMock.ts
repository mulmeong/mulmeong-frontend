import { REGIONS } from '@/types/onsen'

import type { Suggestion } from '@/features/map/api/map'
import type { MapBounds, Onsen, OnsenWithDistance } from '@/types/onsen'

const MOCK_DELAY_MS = 300

/** 지도 영역이 없을 때 목 거리 표시에 쓰는 기준점. */
const DEFAULT_ORIGIN = { lat: 37.5172, lng: 127.0473 }

const EARTH_RADIUS_KM = 6371

/**
 * 목 전용 직선거리. 실제 서비스에서는 백엔드가 요청 좌표 기준으로 distanceKm을 붙여준다
 * (기능명세서 §4-2 OnsenWithDistance) — BE 연동되면 이 함수는 지운다.
 */
function distanceKmBetween(origin: { lat: number; lng: number }, lat: number, lng: number): number {
  const toRad = (deg: number) => (deg * Math.PI) / 180
  const dLat = toRad(lat - origin.lat)
  const dLng = toRad(lng - origin.lng)
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(origin.lat)) * Math.cos(toRad(lat)) * Math.sin(dLng / 2) ** 2
  return 2 * EARTH_RADIUS_KM * Math.asin(Math.sqrt(a))
}

/** 거리 기준점은 보이는 영역의 중심 — "현재 지도에서"가 뜻하는 바와 맞춘다. */
function originOf(bounds?: MapBounds) {
  if (!bounds) return DEFAULT_ORIGIN
  return {
    lat: (bounds.swLat + bounds.neLat) / 2,
    lng: (bounds.swLng + bounds.neLng) / 2,
  }
}

function isInside(onsen: Onsen, bounds: MapBounds): boolean {
  return (
    onsen.lat >= bounds.swLat &&
    onsen.lat <= bounds.neLat &&
    onsen.lng >= bounds.swLng &&
    onsen.lng <= bounds.neLng
  )
}

/**
 * 백엔드 연동 전까지 쓰는 표본.
 * address는 REGIONS(시·도 8단위)로 시작해야 한다 — 지역 필터가 startsWith로 걸러서다.
 * 이름·사진·요금·수질은 화면 확인용 예시이며 실제 업소 정보가 아니다.
 */
const ONSEN_SEEDS: Onsen[] = [
  {
    id: 1,
    name: '학가산 온천',
    address: '서울 강남구',
    lat: 37.5172,
    lng: 127.0286,
    rating: 4.4,
    reviewCount: 128,
    tags: ['노천탕', '24시간'],
    waterTempC: 74,
    waterQuality: '중탄산천',
    mainComponent: 'Ca-HCO₃',
    ph: 7.8,
    phLabel: '약알칼리성',
    description: '중탄산 성분을 함유해 부드러운 물이 특징이에요.',
    features: ['천연 온천수', '중탄산천', '높은 원수 온도', '노천탕 운영'],
    benefits: '피로 회복과 근육통 완화에 좋습니다.',
    openingHours: '10:00 — 22:00',
    closedDays: '매주 화요일',
    parking: '전용 주차장 80면, 무료',
    facilities: ['탈의실', '정수기', '수건 대여(유료)'],
    admissionFee: 15000,
    feeNote: '성인 15,000원 · 어린이 9,000원',
    transitAccessible: true,
    phone: '032-123-4567',
    homepage: 'hakgasan-onsen.co.kr',
    notice:
      '문신이 있으신 분은 방문 전 프런트로 문의해 주세요. 타월과 수건은 개별 지참을 권장합니다.',
  },
  {
    id: 2,
    name: '양재 온유스파',
    address: '서울 서초구',
    lat: 37.5045,
    lng: 127.0248,
    rating: 4.1,
    reviewCount: 76,
    tags: ['개인탕', '주차가능'],
  },
  {
    id: 3,
    name: '잠실 온담사우나',
    address: '서울 송파구',
    lat: 37.5145,
    lng: 127.1059,
    rating: 3.9,
    reviewCount: 41,
    tags: ['찜질방'],
  },
  {
    id: 4,
    name: '도산 온천',
    address: '서울 강남구',
    lat: 37.5243,
    lng: 127.0364,
    rating: 4.6,
    reviewCount: 212,
    tags: ['노천탕', '조용한'],
  },
  {
    id: 5,
    name: '선정릉 스파',
    address: '서울 강남구',
    lat: 37.5107,
    lng: 127.0435,
    rating: 4.2,
    reviewCount: 34,
    tags: ['개인탕'],
  },
  {
    id: 6,
    name: '이천 숲결온천',
    address: '경기 이천시',
    lat: 37.2721,
    lng: 127.435,
    rating: 4.3,
    reviewCount: 164,
    tags: ['노천탕', '주차가능'],
  },
  {
    id: 7,
    name: '포천 솔담스파랜드',
    address: '경기 포천시',
    lat: 37.8949,
    lng: 127.2002,
    rating: 4.0,
    reviewCount: 89,
    tags: ['찜질방', '가족탕'],
  },
  {
    id: 8,
    name: '수원 하루사우나',
    address: '경기 수원시',
    lat: 37.2636,
    lng: 127.0286,
    rating: 3.7,
    reviewCount: 52,
    tags: ['24시간'],
  },
  {
    id: 9,
    name: '강화 해담해수탕',
    address: '인천 강화군',
    lat: 37.7469,
    lng: 126.4878,
    rating: 4.5,
    reviewCount: 203,
    tags: ['해수탕', '노천탕'],
  },
  {
    id: 10,
    name: '인천 느린스파',
    address: '인천 미추홀구',
    lat: 37.4634,
    lng: 126.6503,
    rating: 3.8,
    reviewCount: 47,
    tags: ['개인탕', '주차가능'],
  },
  {
    id: 11,
    name: '속초 바다온천',
    address: '강원 속초시',
    lat: 38.207,
    lng: 128.5918,
    rating: 4.7,
    reviewCount: 311,
    tags: ['노천탕', '바다전망'],
    waterTempC: 51,
    waterQuality: '유황천',
    mainComponent: 'S-Na',
    ph: 8.4,
    phLabel: '알칼리성',
    description: '유황 성분이 진해 특유의 향이 납니다.',
    features: ['천연 온천수', '유황천', '노천탕 운영', '바다 전망'],
    benefits: '피부 질환과 신경통에 도움이 됩니다.',
    openingHours: '06:00 — 21:00',
    closedDays: '연중무휴',
    parking: '주차 가능, 무료',
    facilities: ['탈의실', '수건 대여', '식당'],
    admissionFee: 15000,
    feeNote: '성인 15,000원 · 어린이 8,000원',
    transitAccessible: false,
  },
  {
    id: 12,
    name: '평창 솔숲온천호텔',
    address: '강원 평창군',
    lat: 37.3705,
    lng: 128.3903,
    rating: 4.4,
    reviewCount: 128,
    tags: ['노천탕', '조용한'],
  },
  {
    id: 13,
    name: '원주 온유사우나',
    address: '강원 원주시',
    lat: 37.3422,
    lng: 127.9202,
    rating: 4.0,
    reviewCount: 28,
    tags: ['찜질방'],
  },
  {
    id: 14,
    name: '아산 온담온천',
    address: '충청 아산시',
    lat: 36.7836,
    lng: 127.0041,
    rating: 4.5,
    reviewCount: 276,
    tags: ['노천탕', '24시간'],
  },
  {
    id: 15,
    name: '청주 여유스파',
    address: '충청 청주시',
    lat: 36.6424,
    lng: 127.489,
    rating: 3.9,
    reviewCount: 63,
    tags: ['개인탕'],
  },
  {
    id: 16,
    name: '예산 숲마루온천단지',
    address: '충청 예산군',
    lat: 36.6806,
    lng: 126.8451,
    rating: 4.2,
    reviewCount: 118,
    tags: ['노천탕', '가족탕'],
  },
  {
    id: 17,
    name: '울진 산들온천',
    address: '경상 울진군',
    lat: 36.9931,
    lng: 129.4003,
    rating: 4.6,
    reviewCount: 245,
    tags: ['노천탕', '주차가능'],
  },
  {
    id: 18,
    name: '동래 온유스파',
    address: '경상 부산 동래구',
    lat: 35.2054,
    lng: 129.0784,
    rating: 4.1,
    reviewCount: 157,
    tags: ['찜질방', '24시간'],
  },
  {
    id: 19,
    name: '경주 고요사우나',
    address: '경상 경주시',
    lat: 35.8562,
    lng: 129.2247,
    rating: 3.6,
    reviewCount: 38,
    tags: ['개인탕'],
  },
  {
    id: 20,
    name: '화순 숲결온천',
    address: '전라 화순군',
    lat: 35.0645,
    lng: 126.9862,
    rating: 4.3,
    reviewCount: 142,
    tags: ['노천탕', '조용한'],
  },
  {
    id: 21,
    name: '전주 느린스파',
    address: '전라 전주시',
    lat: 35.8242,
    lng: 127.148,
    rating: 3.8,
    reviewCount: 71,
    tags: ['찜질방'],
  },
  {
    id: 22,
    name: '서귀포 물빛해수탕',
    address: '제주 서귀포시',
    lat: 33.2541,
    lng: 126.5601,
    rating: 4.8,
    reviewCount: 389,
    tags: ['해수탕', '바다전망'],
    waterTempC: 38,
    waterQuality: '해수 염천',
    mainComponent: 'Na-Cl',
    ph: 7.2,
    phLabel: '중성',
    description: '바닷물을 데운 염천이라 몸이 오래 따뜻합니다.',
    features: ['해수탕', '노천탕 운영', '바다 전망'],
    benefits: '혈액순환과 피부 미용에 좋습니다.',
    openingHours: '09:00 — 20:00',
    closedDays: '매월 첫째 월요일',
    parking: '주차 가능, 2시간 무료',
    facilities: ['탈의실', '수건 대여', '카페'],
    admissionFee: 18000,
    feeNote: '성인 18,000원 · 어린이 12,000원',
    transitAccessible: true,
  },
  {
    id: 23,
    name: '제주 온담스파',
    address: '제주 제주시',
    lat: 33.4996,
    lng: 126.5312,
    rating: 4.2,
    reviewCount: 96,
    tags: ['개인탕', '주차가능'],
  },
]

/** 모든 장소에서 상세 탭의 밀도를 확인할 수 있도록 비어 있는 스펙을 채운다. */
const WATER_PROFILES = [
  {
    waterTempC: 42,
    waterQuality: '단순천',
    mainComponent: 'Na-HCO₃',
    ph: 7.6,
    phLabel: '약알칼리성',
  },
  { waterTempC: 48, waterQuality: '유황천', mainComponent: 'S-Na', ph: 8.2, phLabel: '알칼리성' },
  { waterTempC: 39, waterQuality: '탄산천', mainComponent: 'Ca-HCO₃', ph: 6.8, phLabel: '약산성' },
]

export const MOCK_ONSENS: Onsen[] = ONSEN_SEEDS.map((onsen, index) => {
  const isSauna = onsen.name.includes('사우나') || onsen.tags.includes('찜질방')
  const isSeaBath = onsen.tags.includes('해수탕')
  const admissionFee = isSauna ? 12000 : isSeaBath ? 18000 : 15000

  return {
    ...WATER_PROFILES[index % WATER_PROFILES.length],
    ...(isSeaBath
      ? {
          waterTempC: 38,
          waterQuality: '해수 염천',
          mainComponent: 'Na-Cl',
          ph: 7.2,
          phLabel: '중성',
        }
      : {}),
    imageUrl: isSauna ? '/images/panel03.jpg' : '/images/panel05.jpg',
    description: isSauna
      ? '따뜻한 탕과 편백 사우나를 오가며 천천히 쉬어갈 수 있는 공간입니다.'
      : '온탕에 몸을 담그고 휴게 공간에서 여유롭게 하루를 보낼 수 있는 곳입니다.',
    features: [...onsen.tags, isSauna ? '편백 사우나' : '온탕·냉탕', '실내 휴게 공간'],
    openingHours: onsen.tags.includes('24시간') ? '00:00 — 24:00' : '07:00 — 22:00',
    closedDays: index % 3 === 0 ? '매월 둘째 화요일' : '연중무휴',
    parking: '전용 주차장 · 이용객 3시간 무료',
    facilities: ['탈의실', '개인 사물함', '수건 제공', '휴게실', '정수기'],
    admissionFee,
    feeNote: `성인 ${admissionFee.toLocaleString('ko-KR')}원 · 어린이 8,000원`,
    transitAccessible: index % 3 !== 0,
    phone: '000-0000-0000',
    homepage: `https://example.com/onsens/${onsen.id}`,
    notice: '입장 마감은 영업 종료 1시간 전입니다. 개인 세면도구를 준비해 주세요.',
    ...onsen,
  }
})

function delay<T>(value: T): Promise<T> {
  return new Promise((resolve) => setTimeout(() => resolve(value), MOCK_DELAY_MS))
}

const MAX_SUGGESTIONS = 6

/** 목 자동완성 — 이름·주소 부분일치. BE가 붙으면 이 함수는 지운다. */
export function mockSuggest(keyword: string): Promise<Suggestion[]> {
  const regions: Suggestion[] = REGIONS.filter((region) => region.includes(keyword)).map(
    (region) => ({ type: 'region', value: region }),
  )

  const onsens: Suggestion[] = MOCK_ONSENS.filter(
    (onsen) => onsen.name.includes(keyword) || onsen.address.includes(keyword),
  ).map((onsen) => ({
    type: 'onsen',
    id: onsen.id,
    name: onsen.name,
    address: onsen.address,
  }))

  return delay([...regions, ...onsens].slice(0, MAX_SUGGESTIONS))
}

export function mockSearchOnsens(
  keyword?: string,
  region?: string,
  bounds?: MapBounds,
): Promise<OnsenWithDistance[]> {
  const origin = originOf(bounds)

  const filtered = MOCK_ONSENS.filter((onsen) => {
    const matchesKeyword = !keyword || onsen.name.includes(keyword)
    const matchesRegion = !region || onsen.address.startsWith(region)
    // 지역·검색어를 직접 고른 경우엔 영역 밖도 보여준다 (고른 결과가 사라지면 혼란스럽다).
    const matchesBounds = !bounds || keyword || region || isInside(onsen, bounds)
    return matchesKeyword && matchesRegion && matchesBounds
  })
    .map((onsen) => ({
      ...onsen,
      distanceKm: distanceKmBetween(origin, onsen.lat, onsen.lng),
    }))
    .sort((a, b) => a.distanceKm - b.distanceKm)

  return delay(filtered)
}
