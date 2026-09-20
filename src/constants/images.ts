import type { NearbyCategory } from '@/types/nearby'
import type { PoiCategory } from '@/types/poi'

export const DEFAULT_ONSEN_IMAGE = '/images/default_sauna.jpg'

const PLACE_PLACEHOLDER_BY_CATEGORY: Record<NearbyCategory, string> = {
  CAFE: '/images/placeholders/cafe.svg',
  RESTAURANT: '/images/placeholders/restaurant.svg',
  PARK: '/images/placeholders/park.svg',
  ACCOMMODATION: '/images/placeholders/accommodation.svg',
  CULTURE: '/images/placeholders/culture.svg',
  LEISURE: '/images/placeholders/leisure.svg',
  SHOPPING: '/images/placeholders/shopping.svg',
  FESTIVAL: '/images/placeholders/festival.svg',
  SPA: '/images/placeholders/spa.svg',
  ATTRACTION: '/images/placeholders/attraction.svg',
  ETC: '/images/placeholders/etc.svg',
}

/** 장소 카테고리에 맞는 기본 이미지. 사진이 없을 때 카드 폴백으로 쓴다. */
export function placeholderImageOf(category: NearbyCategory | PoiCategory): string {
  return PLACE_PLACEHOLDER_BY_CATEGORY[category]
}
