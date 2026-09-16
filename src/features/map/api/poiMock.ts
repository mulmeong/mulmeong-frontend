import { POI_CATEGORY_LABELS } from '@/types/poi'

import type { Poi, PoiCategory, PoiResult } from '@/types/poi'

/** 카카오가 한 번에 주는 최대치. 목도 같은 수로 맞춘다. */
const MOCK_COUNT = 8

const NAME_SEEDS: Record<PoiCategory, string[]> = {
  CAFE: ['온천마을 커피', '탕 앞 카페', '수안보 로스터리', '노천 커피'],
  RESTAURANT: ['수안보 꿩요리집', '온천식당', '한우마을', '손칼국수'],
  PARK: ['온천공원', '천변 산책로', '약수터 쉼터', '솔밭공원'],
  CONVENIENCE: ['GS25 온천점', 'CU 수안보점', '세븐일레븐 탕앞점', '이마트24'],
  PARKING: ['온천 공영주차장', '제1주차장', '노상 주차장', '관광안내소 주차장'],
  ACCOMMODATION: ['수안보파크호텔', '온천모텔', '한옥스테이', '게스트하우스 온'],
}

/** 목이라 좌표를 중심 주변에 흩뿌린다 — 실제 거리 계산은 서버 몫이다. */
function scatter(center: number, index: number, step: number) {
  return center + (((index % 4) - 1.5) * step + Math.floor(index / 4) * step) / 2
}

export function mockPoi(category: PoiCategory, lat: number, lng: number): Promise<PoiResult> {
  const seeds = NAME_SEEDS[category]
  const label = POI_CATEGORY_LABELS[category]

  const places: Poi[] = Array.from({ length: MOCK_COUNT }, (_, i) => ({
    externalId: `KAKAO_${category}_${i}`,
    name: i < seeds.length ? seeds[i] : `${label} ${i + 1}호점`,
    categoryName: `음식점 > ${label}`,
    roadAddress: '충북 충주시 수안보면 온천리 100',
    lat: scatter(lat, i, 0.012),
    lng: scatter(lng, i, 0.014),
    distanceM: 200 + i * 180,
    kakaoPlaceUrl: 'http://place.map.kakao.com/27384991',
  }))

  return Promise.resolve({ category, places })
}
