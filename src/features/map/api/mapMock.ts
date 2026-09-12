import type { Onsen, OnsenWithDistance } from '@/types/onsen'

const MOCK_DELAY_MS = 300

/** 목 거리 계산 기준점 — MapCanvas의 초기 중심(강남구청)과 같게 둔다. */
const ORIGIN = { lat: 37.5172, lng: 127.0473 }

const EARTH_RADIUS_KM = 6371

/**
 * 목 전용 직선거리. 실제 서비스에서는 백엔드가 요청 좌표 기준으로 distanceKm을 붙여준다
 * (기능명세서 §4-2 OnsenWithDistance) — BE 연동되면 이 함수는 지운다.
 */
function distanceKmFrom(lat: number, lng: number): number {
  const toRad = (deg: number) => (deg * Math.PI) / 180
  const dLat = toRad(lat - ORIGIN.lat)
  const dLng = toRad(lng - ORIGIN.lng)
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(ORIGIN.lat)) * Math.cos(toRad(lat)) * Math.sin(dLng / 2) ** 2
  return 2 * EARTH_RADIUS_KM * Math.asin(Math.sqrt(a))
}

/**
 * 백엔드 연동 전까지 쓰는 표본.
 * address는 REGIONS(시·도 8단위)로 시작해야 한다 — 지역 필터가 startsWith로 걸러서다.
 * 이름은 실존 업소로 오해되지 않게 익명으로 둔다.
 */
const MOCK_ONSENS: Onsen[] = [
  {
    id: 1,
    name: '학가산 온천',
    address: '서울 강남구',
    lat: 37.5172,
    lng: 127.0286,
    rating: 4.4,
    reviewCount: 128,
    tags: ['노천탕', '24시간'],
  },
  {
    id: 2,
    name: '○○ 스파',
    address: '서울 서초구',
    lat: 37.5045,
    lng: 127.0248,
    rating: 4.1,
    reviewCount: 76,
    tags: ['개인탕', '주차가능'],
  },
  {
    id: 3,
    name: '○○ 사우나',
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
    reviewCount: 0,
    tags: ['개인탕'],
  },
  {
    id: 6,
    name: '△△ 온천',
    address: '경기 이천시',
    lat: 37.2721,
    lng: 127.435,
    rating: 4.3,
    reviewCount: 164,
    tags: ['노천탕', '주차가능'],
  },
  {
    id: 7,
    name: '△△ 스파랜드',
    address: '경기 포천시',
    lat: 37.8949,
    lng: 127.2002,
    rating: 4.0,
    reviewCount: 89,
    tags: ['찜질방', '가족탕'],
  },
  {
    id: 8,
    name: '△△ 사우나',
    address: '경기 수원시',
    lat: 37.2636,
    lng: 127.0286,
    rating: 3.7,
    reviewCount: 52,
    tags: ['24시간'],
  },
  {
    id: 9,
    name: '□□ 해수탕',
    address: '인천 강화군',
    lat: 37.7469,
    lng: 126.4878,
    rating: 4.5,
    reviewCount: 203,
    tags: ['해수탕', '노천탕'],
  },
  {
    id: 10,
    name: '□□ 스파',
    address: '인천 미추홀구',
    lat: 37.4634,
    lng: 126.6503,
    rating: 3.8,
    reviewCount: 47,
    tags: ['개인탕', '주차가능'],
  },
  {
    id: 11,
    name: '◇◇ 온천',
    address: '강원 속초시',
    lat: 38.207,
    lng: 128.5918,
    rating: 4.7,
    reviewCount: 311,
    tags: ['노천탕', '바다전망'],
  },
  {
    id: 12,
    name: '◇◇ 온천호텔',
    address: '강원 평창군',
    lat: 37.3705,
    lng: 128.3903,
    rating: 4.4,
    reviewCount: 128,
    tags: ['노천탕', '조용한'],
  },
  {
    id: 13,
    name: '◇◇ 사우나',
    address: '강원 원주시',
    lat: 37.3422,
    lng: 127.9202,
    reviewCount: 0,
    tags: ['찜질방'],
  },
  {
    id: 14,
    name: '☆☆ 온천',
    address: '충청 아산시',
    lat: 36.7836,
    lng: 127.0041,
    rating: 4.5,
    reviewCount: 276,
    tags: ['노천탕', '24시간'],
  },
  {
    id: 15,
    name: '☆☆ 스파',
    address: '충청 청주시',
    lat: 36.6424,
    lng: 127.489,
    rating: 3.9,
    reviewCount: 63,
    tags: ['개인탕'],
  },
  {
    id: 16,
    name: '☆☆ 온천단지',
    address: '충청 예산군',
    lat: 36.6806,
    lng: 126.8451,
    rating: 4.2,
    reviewCount: 118,
    tags: ['노천탕', '가족탕'],
  },
  {
    id: 17,
    name: '▽▽ 온천',
    address: '경상 울진군',
    lat: 36.9931,
    lng: 129.4003,
    rating: 4.6,
    reviewCount: 245,
    tags: ['노천탕', '주차가능'],
  },
  {
    id: 18,
    name: '▽▽ 스파',
    address: '경상 부산 동래구',
    lat: 35.2054,
    lng: 129.0784,
    rating: 4.1,
    reviewCount: 157,
    tags: ['찜질방', '24시간'],
  },
  {
    id: 19,
    name: '▽▽ 사우나',
    address: '경상 경주시',
    lat: 35.8562,
    lng: 129.2247,
    rating: 3.6,
    reviewCount: 38,
    tags: ['개인탕'],
  },
  {
    id: 20,
    name: '◎◎ 온천',
    address: '전라 화순군',
    lat: 35.0645,
    lng: 126.9862,
    rating: 4.3,
    reviewCount: 142,
    tags: ['노천탕', '조용한'],
  },
  {
    id: 21,
    name: '◎◎ 스파',
    address: '전라 전주시',
    lat: 35.8242,
    lng: 127.148,
    rating: 3.8,
    reviewCount: 71,
    tags: ['찜질방'],
  },
  {
    id: 22,
    name: '◈◈ 해수탕',
    address: '제주 서귀포시',
    lat: 33.2541,
    lng: 126.5601,
    rating: 4.8,
    reviewCount: 389,
    tags: ['해수탕', '바다전망'],
  },
  {
    id: 23,
    name: '◈◈ 스파',
    address: '제주 제주시',
    lat: 33.4996,
    lng: 126.5312,
    rating: 4.2,
    reviewCount: 96,
    tags: ['개인탕', '주차가능'],
  },
]

function delay<T>(value: T): Promise<T> {
  return new Promise((resolve) => setTimeout(() => resolve(value), MOCK_DELAY_MS))
}

export function mockSearchOnsens(keyword?: string, region?: string): Promise<OnsenWithDistance[]> {
  const filtered = MOCK_ONSENS.filter((onsen) => {
    const matchesKeyword = !keyword || onsen.name.includes(keyword)
    const matchesRegion = !region || onsen.address.startsWith(region)
    return matchesKeyword && matchesRegion
  })
    .map((onsen) => ({ ...onsen, distanceKm: distanceKmFrom(onsen.lat, onsen.lng) }))
    .sort((a, b) => a.distanceKm - b.distanceKm)

  return delay(filtered)
}
