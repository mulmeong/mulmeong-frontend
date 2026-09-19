/**
 * 여행 팜플렛(PAM-08) — POST /pamphlets 계약.
 *
 * 찜 목록에서 고른 장소를 묶어 공유 링크를 받는다. 찜 폴더가 아니라 팜플렛이
 * 여행별 묶음을 담당한다.
 *
 * TODO: 명세에 '팜플렛 화면이 수정될 수 있음'이라고 적혀 있다.
 * 화면이 확정되면 필드를 다시 대조할 것.
 */

/** 제목 길이. 서버가 1~50자로 막는다. */
export const PAMPHLET_TITLE_MAX = 50

/** 한 팜플렛에 담을 장소 수. */
export const PAMPHLET_PLACE_MIN = 1
export const PAMPHLET_PLACE_MAX = 20

/** 인원 수. 안 보내도 된다. */
export const PAMPHLET_PARTY_MIN = 1
export const PAMPHLET_PARTY_MAX = 20

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

export type Pamphlet = {
  pamphletId: number
  /** base62 8자. PK가 아니라 이 값으로 공유한다. */
  shareToken: string
  shareUrl: string
  title: string
  partySize?: number
  travelDate?: string
  placeCount: number
  coverImage?: string
  createdAt: string
}
