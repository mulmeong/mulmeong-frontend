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
  kakaoPlaceUrl?: string | null
}

/** 팜플렛 상세 (GET /pamphlets/{id}). 지도에는 places의 좌표만 쓴다. */
export type PamphletDetail = Omit<Pamphlet, 'placeCount' | 'regionName'> & {
  isMine: boolean
  places: PamphletPlace[]
  summary?: { onsenCount: number; placeCount: number; regionName?: string | null } | null
}
