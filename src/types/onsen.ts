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

/** 지도에 보이는 영역 (MAP-03 이 지역 재검색). */
export type MapBounds = {
  swLat: number
  swLng: number
  neLat: number
  neLng: number
}

/** 지역 필터 단위 — 포도알 지도(MY-02)와 같은 시·도 17단위. */
export const REGIONS = ['서울', '경기', '인천', '강원', '충청', '경상', '전라', '제주'] as const

/** 지도를 처음 열었을 때 보여주는 전국 뷰. */
export const NATIONAL_VIEW = { lat: 36.5, lng: 127.8, level: 13 } as const

/**
 * 지역을 고르면 지도를 옮길 위치.
 * 명세에 없는 값이라 대략치로 잡았다 — 기획·BE에서 확정되면 교체한다.
 */
export const REGION_VIEWS: Record<Region, { lat: number; lng: number; level: number }> = {
  서울: { lat: 37.5665, lng: 126.978, level: 8 },
  경기: { lat: 37.4138, lng: 127.5183, level: 10 },
  인천: { lat: 37.4563, lng: 126.7052, level: 9 },
  강원: { lat: 37.8228, lng: 128.1555, level: 11 },
  충청: { lat: 36.6358, lng: 127.4913, level: 11 },
  경상: { lat: 35.8, lng: 128.6, level: 11 },
  전라: { lat: 35.3, lng: 127.0, level: 11 },
  제주: { lat: 33.4, lng: 126.55, level: 10 },
}

export type Region = (typeof REGIONS)[number]
