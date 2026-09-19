/** MAP-04 카테고리 POI 토글. 서버의 TourAPI 기반 카테고리와 맞춘다. */

export const POI_CATEGORIES = [
  'CAFE',
  'RESTAURANT',
  'PARK',
  'ACCOMMODATION',
  'CULTURE',
  'LEISURE',
  'SHOPPING',
  'FESTIVAL',
] as const

export type PoiCategory = (typeof POI_CATEGORIES)[number]

export const POI_CATEGORY_LABELS: Record<PoiCategory, string> = {
  CAFE: '카페',
  RESTAURANT: '맛집',
  PARK: '공원',
  ACCOMMODATION: '숙소',
  CULTURE: '문화',
  LEISURE: '레저',
  SHOPPING: '쇼핑',
  FESTIVAL: '축제',
}

export const POI_FILTERS = [
  { id: 'CAFE', label: '카페', categories: ['CAFE'] },
  { id: 'RESTAURANT', label: '맛집', categories: ['RESTAURANT'] },
  { id: 'NATURE', label: '자연', categories: ['PARK'] },
  { id: 'ACCOMMODATION', label: '숙소', categories: ['ACCOMMODATION'] },
  {
    id: 'SIGHTS',
    label: '볼거리·즐길거리',
    categories: ['CULTURE', 'LEISURE', 'SHOPPING', 'FESTIVAL'],
  },
] as const

export type PoiFilterId = (typeof POI_FILTERS)[number]['id']

export const POI_FILTER_CATEGORY_MAP: Record<PoiFilterId, readonly PoiCategory[]> = {
  CAFE: ['CAFE'],
  RESTAURANT: ['RESTAURANT'],
  NATURE: ['PARK'],
  ACCOMMODATION: ['ACCOMMODATION'],
  SIGHTS: ['CULTURE', 'LEISURE', 'SHOPPING', 'FESTIVAL'],
}

export type Poi = {
  externalId: string
  placeId?: number | null
  name: string
  categoryName?: string | null
  address?: string | null
  roadAddress?: string | null
  phone?: string | null
  description?: string | null
  homepageUrl?: string | null
  lat: number
  lng: number
  distanceM?: number | null
  image?: string | null
  imageUrl?: string | null
  firstImage?: string | null
  firstimage?: string | null
  thumbnail?: string | null
}

/**
 * `/external/tour/{externalId}` 상세. TourAPI를 실시간으로 긁어 내려주므로
 * 서버가 저장하지 않고, 목록에 없는 소개글·홈페이지가 여기에 있다.
 */
export type PoiDetail = {
  externalId: string
  contentId?: string | null
  contentTypeId?: string | null
  name: string
  description?: string | null
  imageUrl?: string | null
  thumbnailUrl?: string | null
  address?: string | null
  phone?: string | null
  homepageUrl?: string | null
  lat?: number | null
  lng?: number | null
}

export type PoiResult = {
  category: PoiCategory
  places: Poi[]
}

/** API 그룹의 카테고리를 개별 지도 마커까지 전달한다. */
export type MapPoi = Poi & { category: PoiCategory }

export function toPoiCategory(category: string): PoiCategory {
  return POI_CATEGORIES.includes(category as PoiCategory) ? (category as PoiCategory) : 'PARK'
}

export function poiKeyOf(category: PoiCategory, externalId: string) {
  return `${category}:${externalId}`
}

export function poiKey(poi: MapPoi) {
  return poiKeyOf(poi.category, poi.externalId)
}
