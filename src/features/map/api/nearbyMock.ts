import type { NearbyPlace, NearbyResult } from '@/types/nearby'

/**
 * 명세 예시(수안보온천 주변)를 그대로 따른다.
 * PHOTO(TourAPI 사진 있음)와 INFO(카카오 사진 없음)가 섞여 오는 걸 확인하려는 목적이다.
 */
const MOCK_ITEMS: NearbyPlace[] = [
  {
    externalId: 'KAKAO_27384991',
    source: 'KAKAO',
    cardType: 'INFO',
    category: 'RESTAURANT',
    categoryLabel: '맛집',
    name: '수안보 꿩요리집',
    imageUrl: null,
    lat: 36.843,
    lng: 128.0035,
    distanceM: 300,
    kakaoPlaceUrl: 'http://place.map.kakao.com/27384991',
    placeId: 1203,
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
    kakaoPlaceUrl: 'http://place.map.kakao.com/18827733',
    placeId: null,
    isFavorite: false,
  },
  {
    externalId: 'TOUR_126508',
    source: 'TOUR_API',
    cardType: 'PHOTO',
    category: 'ATTRACTION',
    categoryLabel: '관광지',
    name: '미륵대원지',
    description: '고려 초기 석굴사원 터',
    imageUrl: 'https://tong.visitkorea.or.kr/cms/resource/86/3488286_image3_1.JPG',
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
    name: '충주 미륵리 사지',
    description: '월악산 자락의 석불입상',
    imageUrl: 'https://tong.visitkorea.or.kr/cms/resource/80/3488280_image3_1.JPG',
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
    name: '수안보온천역사관',
    description: '조선시대부터 이어진 온천의 기록',
    imageUrl: 'https://tong.visitkorea.or.kr/cms/resource/53/3459553_image3_1.jpg',
    lat: 36.8412,
    lng: 128.0088,
    distanceM: 900,
    placeId: null,
    isFavorite: false,
  },
]

export function mockNearby(onsenId: number): Promise<NearbyResult> {
  // 서버가 distanceM 순으로 준다는 보장은 없지만, 화면은 가까운 곳부터 읽는 게 자연스럽다.
  const items = [...MOCK_ITEMS].sort((a, b) => a.distanceM - b.distanceM)
  return Promise.resolve({ onsenId, items, hasMore: true })
}
