/** MAP-04 카테고리 POI 토글. 카카오 그룹코드 매핑은 서버가 들고 있다. */

export const POI_CATEGORIES = [
  'CAFE',
  'RESTAURANT',
  'PARK',
  'CONVENIENCE',
  'PARKING',
  'ACCOMMODATION',
] as const

export type PoiCategory = (typeof POI_CATEGORIES)[number]

export const POI_CATEGORY_LABELS: Record<PoiCategory, string> = {
  CAFE: '카페',
  RESTAURANT: '식당',
  PARK: '공원',
  CONVENIENCE: '편의점',
  PARKING: '주차장',
  ACCOMMODATION: '숙소',
}

export type Poi = {
  externalId: string
  name: string
  categoryName: string
  roadAddress?: string
  phone?: string
  lat: number
  lng: number
  distanceM: number
  kakaoPlaceUrl?: string
}

export type PoiResult = {
  category: PoiCategory
  places: Poi[]
}
