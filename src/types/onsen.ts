/** 기능명세서 §4-2 스키마 기준. 명세에 없는 필드는 임의로 만들지 않는다. */
export type Onsen = {
  id: number
  name: string
  /** 시·도 + 시군구 (예: 서울 강남구) */
  address: string
  lat: number
  lng: number
  /** 없을 수 있다 — 사진 없는 항목도 지도에는 뜬다. */
  imageUrl?: string
  /** 0~5, 소수 한 자리. 리뷰가 없으면 undefined. */
  rating?: number
  reviewCount: number
  /** 노천탕·개인탕 등. 필터와 칩에 같이 쓴다. */
  tags: string[]
}

/** 지도 목록 응답에만 붙는 거리(km). 기준점은 요청 좌표. */
export type OnsenWithDistance = Onsen & { distanceKm: number }

/** 지역 필터 단위 — 포도알 지도(MY-02)와 같은 시·도 17단위. */
export const REGIONS = [
  '서울',
  '경기',
  '인천',
  '강원',
  '충청',
  '경상',
  '전라',
  '제주',
] as const

export type Region = (typeof REGIONS)[number]
