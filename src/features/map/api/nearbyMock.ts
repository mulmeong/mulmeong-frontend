import { MOCK_ONSENS } from '@/features/map/api/mapMock'

import type { NearbyPlace, NearbyResult } from '@/types/nearby'

/**
 * PHOTO(TourAPI 사진 있음)와 INFO(카카오 사진 없음)가 섞이는 화면 검토용 예시.
 * 사진은 로컬 샘플이고 이름·좌표는 선택한 온천 주변으로 맞춘다.
 */
const MOCK_ITEMS: NearbyPlace[] = [
  {
    externalId: 'KAKAO_27384991',
    source: 'KAKAO',
    cardType: 'INFO',
    category: 'RESTAURANT',
    categoryLabel: '맛집',
    name: '온천마을 밥상',
    imageUrl: null,
    lat: 36.843,
    lng: 128.0035,
    distanceM: 300,
    placeId: null,
    isFavorite: false,
  },
  {
    externalId: 'KAKAO_18827733',
    source: 'KAKAO',
    cardType: 'INFO',
    category: 'CAFE',
    categoryLabel: '카페',
    name: '온천마을 커피',
    imageUrl: null,
    lat: 36.8445,
    lng: 128.0051,
    distanceM: 620,
    placeId: null,
    isFavorite: false,
  },
  {
    externalId: 'TOUR_126508',
    source: 'TOUR_API',
    cardType: 'PHOTO',
    category: 'ATTRACTION',
    categoryLabel: '관광지',
    name: '숲길 산책로',
    description: '온천 후 가볍게 걷기 좋은 녹음 짙은 숲길',
    imageUrl: '/images/panel01.jpg',
    lat: 36.7421,
    lng: 128.0112,
    distanceM: 4200,
    placeId: null,
    isFavorite: false,
  },
  {
    externalId: 'TOUR_130014',
    source: 'TOUR_API',
    cardType: 'PHOTO',
    category: 'ATTRACTION',
    categoryLabel: '관광지',
    name: '물빛 전망대',
    description: '탁 트인 풍경을 바라보며 쉬어가는 곳',
    imageUrl: '/images/panel04.jpg',
    lat: 36.7455,
    lng: 128.0169,
    distanceM: 4800,
    placeId: null,
    isFavorite: false,
  },
  {
    externalId: 'TOUR_128457',
    source: 'TOUR_API',
    cardType: 'PHOTO',
    category: 'CULTURE',
    categoryLabel: '문화시설',
    name: '온천문화관',
    description: '오래된 목욕 문화와 동네 이야기를 만나는 공간',
    imageUrl: '/images/panel05.jpg',
    lat: 36.8412,
    lng: 128.0088,
    distanceM: 900,
    placeId: null,
    isFavorite: false,
  },
]

export function mockNearby(onsenId: number): Promise<NearbyResult> {
  const onsen = MOCK_ONSENS.find((item) => item.id === onsenId)
  if (!onsen) return Promise.resolve({ onsenId, items: [], hasMore: false })

  const area = onsen.address.split(' ').slice(1).join(' ')
  // 서버가 distanceM 순으로 준다는 보장은 없지만, 화면은 가까운 곳부터 읽는 게 자연스럽다.
  const items = MOCK_ITEMS.map((place, index) => {
    const angle = index * 1.3
    const offset = place.distanceM / 111000
    return {
      ...place,
      externalId: `MOCK_${onsenId}_${index}`,
      name: `${area} ${place.name}`,
      lat: onsen.lat + Math.cos(angle) * offset,
      lng: onsen.lng + (Math.sin(angle) * offset) / Math.cos((onsen.lat * Math.PI) / 180),
    }
  }).sort((a, b) => a.distanceM - b.distanceM)
  return Promise.resolve({ onsenId, items, hasMore: false })
}
