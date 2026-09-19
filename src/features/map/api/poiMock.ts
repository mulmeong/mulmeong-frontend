import { POI_CATEGORIES, POI_CATEGORY_LABELS } from '@/types/poi'

import type { Poi, PoiCategory, PoiResult } from '@/types/poi'

/** 카테고리를 여러 개 켠 화면을 확인하기 위한 표본 수. */
const MOCK_COUNT = 8

const NAME_SEEDS: Record<PoiCategory, string[]> = {
  CAFE: ['온천마을 커피', '탕 앞 카페', '느린오후 로스터리', '노천 커피'],
  RESTAURANT: ['온천마을 밥상', '온천식당', '한우마을', '손칼국수'],
  PARK: ['온천공원', '천변 산책로', '약수터 쉼터', '솔밭공원'],
  ACCOMMODATION: ['온천파크호텔', '온천스테이', '한옥스테이', '게스트하우스 온'],
  CULTURE: ['온천문화관', '마을전시관', '작은공연장', '지역박물관'],
  LEISURE: ['숲길 트레킹', '자전거길', '수변 산책코스', '패들 체험장'],
  SHOPPING: ['온천시장', '로컬 편집숍', '기념품 상점', '농산물 직매장'],
  FESTIVAL: ['온천 축제장', '계절 장터', '야외 공연마당', '마을 행사장'],
}

export function mockPoi(category: PoiCategory, lat: number, lng: number): Promise<PoiResult> {
  const seeds = NAME_SEEDS[category]
  const label = POI_CATEGORY_LABELS[category]
  const categoryIndex = POI_CATEGORIES.indexOf(category)

  // 카테고리마다 각도를 달리해 여러 필터를 켜도 같은 좌표에 겹치지 않게 한다.
  const places: Poi[] = Array.from({ length: MOCK_COUNT }, (_, i) => {
    const angle = i * 2.4 + categoryIndex * 0.65
    const distanceM = 250 + i * 180 + categoryIndex * 35
    const offset = distanceM / 111000
    return {
      externalId: `MOCK_${category}_${i}`,
      name: i < seeds.length ? seeds[i] : `${label} ${i + 1}호점`,
      categoryName: label,
      address: `온천마을길 ${10 + i * 12}`,
      lat: lat + Math.cos(angle) * offset,
      lng: lng + (Math.sin(angle) * offset) / Math.cos((lat * Math.PI) / 180),
      distanceM,
    }
  })

  return Promise.resolve({ category, places })
}
