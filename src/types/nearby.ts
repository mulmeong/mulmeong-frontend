/** 주변 여행지 (PAM-04). TourAPI 관광지와 카카오 로컬 맛집·카페를 서버가 합쳐서 내려준다. */

export const NEARBY_SOURCES = ['TOUR_API', 'KAKAO'] as const
export type NearbySource = (typeof NEARBY_SOURCES)[number]

/** PHOTO는 사진이 있는 TourAPI 항목, INFO는 사진 없는 카카오 장소. */
export const NEARBY_CARD_TYPES = ['PHOTO', 'INFO'] as const
export type NearbyCardType = (typeof NEARBY_CARD_TYPES)[number]

export type NearbyPlace = {
  externalId: string
  source: NearbySource
  cardType: NearbyCardType
  category: string
  categoryLabel: string
  name: string
  address?: string | null
  phone?: string | null
  description?: string
  imageUrl?: string | null
  lat: number
  lng: number
  distanceM: number
  /** 카카오 장소만 가진다 — 상세는 카카오맵으로 넘긴다. */
  kakaoPlaceUrl?: string
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
