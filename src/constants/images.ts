import type { NearbyCategory } from '@/types/nearby'
import type { PoiCategory } from '@/types/poi'

export const DEFAULT_ONSEN_IMAGE = '/images/default_sauna.jpg'

/**
 * 대표 사진이 없는 매거진에 쓰는 기본 표지.
 * 전부 같은 그림이면 목록이 단조로워서 두 장을 번갈아 쓴다.
 */
const MAGAZINE_DEFAULTS = ['/images/magazine_default.jpg', '/images/magazine_default2.jpg'] as const

/** 첫 장. 표지를 하나만 써야 하는 자리(상세 히어로 폴백 등)에 쓴다. */
export const DEFAULT_MAGAZINE_IMAGE = MAGAZINE_DEFAULTS[0]

/**
 * 기사마다 고정된 기본 표지를 준다 — 목록을 다시 그려도 표지가 바뀌지 않는다.
 * seed는 보통 magazineId다.
 */
export function defaultMagazineImageOf(seed?: number | string): string {
  if (seed === undefined) return MAGAZINE_DEFAULTS[0]
  const value =
    typeof seed === 'number'
      ? Math.abs(Math.trunc(seed))
      : Array.from(String(seed)).reduce((sum, char) => sum + char.charCodeAt(0), 0)
  return MAGAZINE_DEFAULTS[value % MAGAZINE_DEFAULTS.length]
}

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
