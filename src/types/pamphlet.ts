/**
 * PAM-08 팜플렛. 백엔드 PamphletListItem·PamphletPlaceItem을 그대로 따른다.
 */

export type Pamphlet = {
  pamphletId: number
  shareToken: string
  title: string
  /** 함께 가는 인원. 없을 수 있다. */
  partySize?: number | null
  /** 여행 예정일 (YYYY-MM-DD). */
  travelDate?: string | null
  coverImage?: string | null
  placeCount: number
  regionName?: string | null
  shareUrl?: string | null
  createdAt: string
}

export type PamphletPage = {
  content: Pamphlet[]
  page: number
  size: number
  totalElements: number
  totalPages: number
  last: boolean
}

/** 팜플렛에 담긴 장소. 지도 마커로 쓰려면 lat·lng이 있어야 한다. */
export type PamphletPlace = {
  seq: number
  placeId: number
  placeType: string
  placeTypeLabel?: string | null
  name: string
  subText?: string | null
  address?: string | null
  imageUrl?: string | null
  lat?: number | null
  lng?: number | null
}

/** 팜플렛 상세 (GET /pamphlets/{id}). 지도에는 places의 좌표만 쓴다. */
export type PamphletDetail = Omit<Pamphlet, 'placeCount' | 'regionName'> & {
  isMine: boolean
  places: PamphletPlace[]
  summary?: { onsenCount: number; placeCount: number; regionName?: string | null } | null
}

/* 아래는 만들기(POST /pamphlets)에만 쓰는 값이다. 목록·상세는 위 타입을 쓴다. */

/** 제목 길이. 서버가 1~50자로 막는다. */
export const PAMPHLET_TITLE_MAX = 50

/** 한 팜플렛에 담을 장소 수. */
export const PAMPHLET_PLACE_MIN = 1
export const PAMPHLET_PLACE_MAX = 20

/** 인원 수. 안 보내도 된다. */
export const PAMPHLET_PARTY_MIN = 1
export const PAMPHLET_PARTY_MAX = 20

/**
 * 팜플렛 만들기 요청.
 *
 * TODO: 명세에 '팜플렛 화면이 수정될 수 있음'이라고 적혀 있다.
 * 화면이 확정되면 필드를 다시 대조할 것.
 */
export type CreatePamphletBody = {
  title: string
  partySize?: number
  /** YYYY-MM-DD */
  travelDate?: string
  /**
   * 담을 장소의 placeId. **배열 순서가 곧 팜플렛 순서**다.
   * 찜 목록의 placeId를 쓴다 — favoriteId가 아니다.
   */
  placeIds: number[]
  /** 없으면 서버가 첫 온천(없으면 첫 장소)의 대표 이미지를 쓴다. */
  coverImageUrl?: string
}
