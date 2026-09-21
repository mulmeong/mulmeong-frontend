import type {
  OnsenAccess,
  OnsenFacilities,
  OnsenReviewSummary,
  OnsenWater,
} from '@/types/onsenDetail'

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
  externalId?: string | null
  contentTypeId?: number | string | null
  /**
   * 장소 데이터 출처(TOUR_API·MOIS·KAKAO). 출처 표기를 붙일지 가른다.
   * 서버가 아직 안 내려주며, 없으면 표기하지 않는다 — 카카오 장소에
   * 한국관광공사를 잘못 붙이지 않으려고 추측하지 않는다.
   */
  source?: string | null
  placeType: string
  placeTypeLabel?: string | null
  name: string
  subText?: string | null
  address?: string | null
  imageUrl?: string | null
  kakaoPlaceUrl?: string | null
  isRegistered?: boolean | null
  sido?: string | null
  sigungu?: string | null
  phone?: string | null
  homepageUrl?: string | null
  hours?: string | null
  holiday?: string | null
  parkingInfo?: string | null
  thumbnail?: string | null
  images?: string[] | null
  priceMin?: number | null
  water?: OnsenWater | null
  facilities?: OnsenFacilities | null
  access?: OnsenAccess | null
  regionComment?: string | null
  notes?: string | null
  reviewSummary?: OnsenReviewSummary | null
  annualVisitors?: number | null
  isFavorite?: boolean | null
  lat?: number | null
  lng?: number | null
}

/**
 * 팜플렛 상세 (GET /pamphlets/{id}). 지도에는 places의 좌표만 쓴다.
 *
 * 공유 조회(`/share/{token}`)로 남의 팜플렛을 볼 때는 서버가 pamphletId를 null로 내린다.
 */
export type PamphletDetail = Omit<Pamphlet, 'pamphletId' | 'placeCount' | 'regionName'> & {
  pamphletId: number | null
  isMine: boolean
  author?: PamphletAuthor | null
  places: PamphletPlace[]
  summary?: { onsenCount: number; placeCount: number; regionName?: string | null } | null
}

/** 팜플렛을 만든 사람. 공유 화면에서 쓴다. */
export type PamphletAuthor = {
  nickname: string
  level: number
  title: string
}

/**
 * 만들기 응답 (POST /pamphlets). 목록 항목과 필드가 달라 따로 둔다 —
 * regionName이 없고, coverImage 대신 cover 정보만 온다.
 */
export type CreatedPamphlet = {
  pamphletId: number
  shareToken: string
  /** 서버가 자기 도메인으로 만든 링크. 배포 도메인과 다를 수 있어 화면에서는 쓰지 않는다. */
  shareUrl?: string | null
  title: string
  partySize?: number | null
  travelDate?: string | null
  placeCount: number
  coverImage?: string | null
  createdAt: string
}

/**
 * 공유 링크. 서버의 shareUrl은 SHARE_BASE가 하드코딩돼 있어 배포 도메인과 어긋난다
 * (BE에 수정 요청됨). 지금 열려 있는 오리진으로 만들면 로컬·배포 모두 맞는다.
 */
export function shareLinkOf(shareToken: string): string {
  return `${window.location.origin}/pamphlet/${shareToken}`
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
