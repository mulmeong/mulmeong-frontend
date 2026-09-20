/** 주변 여행지 (PAM-04). TourAPI 실시간 조회 결과를 서버가 내려준다. */

export const NEARBY_SOURCES = ['TOUR_API'] as const
export type NearbySource = (typeof NEARBY_SOURCES)[number]

/** PHOTO는 사진이 있는 항목, INFO는 사진이 없는 항목. */
export const NEARBY_CARD_TYPES = ['PHOTO', 'INFO'] as const
export type NearbyCardType = (typeof NEARBY_CARD_TYPES)[number]

export type NearbyCategory =
  | 'ATTRACTION'
  | 'RESTAURANT'
  | 'CAFE'
  | 'PARK'
  | 'ACCOMMODATION'
  | 'CULTURE'
  | 'LEISURE'
  | 'SHOPPING'
  | 'FESTIVAL'
  | 'SPA'
  | 'ETC'

export type NearbyPlace = {
  externalId: string
  source: NearbySource
  cardType: NearbyCardType
  category: NearbyCategory
  type?: string | null
  categoryLabel: string
  name: string
  address?: string | null
  phone?: string | null
  description?: string
  image?: string | null
  imageUrl?: string | null
  firstImage?: string | null
  firstimage?: string | null
  thumbnail?: string | null
  lat: number
  lng: number
  distanceM?: number | null
  /** 이미 places에 저장된 장소면 그 id, 아니면 null. 찜(501) 연동 때 쓴다. */
  placeId?: number | null
  isFavorite?: boolean
}

export type NearbyResult = {
  onsenId: number
  items: NearbyPlace[]
  /** 205 전체 보기가 있다는 뜻. 명세가 아직 없어 버튼은 비활성이다. */
  hasMore: boolean
}
