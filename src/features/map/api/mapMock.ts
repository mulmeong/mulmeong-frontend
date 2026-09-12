import type { Onsen } from '@/types/onsen'

const MOCK_DELAY_MS = 300

/** 백엔드 연동 전까지 쓰는 표본. 좌표는 강남 일대 기준. */
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
]

function delay<T>(value: T): Promise<T> {
  return new Promise((resolve) => setTimeout(() => resolve(value), MOCK_DELAY_MS))
}

export function mockSearchOnsens(keyword?: string, region?: string): Promise<Onsen[]> {
  const filtered = MOCK_ONSENS.filter((onsen) => {
    const matchesKeyword = !keyword || onsen.name.includes(keyword)
    const matchesRegion = !region || onsen.address.startsWith(region)
    return matchesKeyword && matchesRegion
  })
  return delay(filtered)
}
