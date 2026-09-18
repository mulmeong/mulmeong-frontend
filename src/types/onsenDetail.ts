/**
 * PAM-03 온천 상세 (`GET /onsens/{onsenId}`).
 * 목록 응답(Onsen)과 구조가 다르다 — 서버가 water·facilities·access로 묶어서 준다.
 * 값이 없는 항목은 null로 오고, 화면은 해당 줄을 숨긴다.
 */

/** 뚜벅이 접근 등급. 화면에는 accessLevelLabel을 쓴다. */
export const ACCESS_LEVELS = ['WALKABLE', 'CAR_RECOMMENDED', 'CAR_REQUIRED'] as const
export type AccessLevel = (typeof ACCESS_LEVELS)[number]

export type OnsenWater = {
  /** 미매칭 온천(505곳 중 7곳)은 null — 화면은 '정보 준비 중'으로 표시한다. */
  temp: number | null
  type?: string | null
  component?: string | null
  ph?: number | null
  benefit?: string | null
}

export type OnsenFacilities = {
  hasOutdoor?: boolean
  hasLodging?: boolean
  facilityType?: string | null
}

/** 거점역. 없는 온천은 access.nearestStation이 null이다. */
export type NearestStation = {
  name: string
  lat: number
  lng: number
  /** 거점역에서 온천까지 가는 법 — 팀이 직접 조사해 넣은 문구. */
  stationToPlaceDesc?: string | null
}

export type OnsenAccess = {
  accessLevel: AccessLevel
  accessLevelLabel: string
  nearestStation?: NearestStation | null
}

export type OnsenReviewSummary = {
  count: number
  avgRating?: number | null
}

export type OnsenDetail = {
  onsenId: number
  name: string
  /** 행안부 등록 온천 여부. */
  isRegistered: boolean
  sido?: string | null
  sigungu?: string | null
  address?: string | null
  lat: number
  lng: number
  phone?: string | null
  homepageUrl?: string | null
  hours?: string | null
  holiday?: string | null
  parkingInfo?: string | null
  /** 성인 기준 최저 요금(원). */
  priceMin?: number | null
  water: OnsenWater
  facilities?: OnsenFacilities | null
  access?: OnsenAccess | null
  annualVisitors?: number | null
  images?: string[] | null
  /** 팀 수기 코멘트 — 명세의 regionComment. */
  regionComment?: string | null
  notes?: string | null
  isFavorite?: boolean
  reviewSummary?: OnsenReviewSummary | null
}
