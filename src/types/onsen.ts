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

  /*
   * 아래는 상세(MAP-02 카드·PAM-01/03 팜플렛)에서 쓰는 스펙.
   * 출처가 행안부 온천현황이라 505곳 중 일부만 값이 있다(명세 §4: 86/93 매칭).
   */

  /** 원천 수온(℃). */
  waterTempC?: number
  /** 수질 유형 — 중탄산천·유황천 등. */
  waterQuality?: string
  /** 주요 성분 — 예: Ca-HCO₃. */
  mainComponent?: string
  /** pH 수치와 해설 — 예: 7.8, '약알칼리성'. */
  ph?: number
  phLabel?: string
  /** 수질 한 줄 해설 (시안 '한눈에'). */
  description?: string
  /** 온천 특징 — 천연 온천수·노천탕 운영 등. */
  features?: string[]
  /** 효능 한 줄 (PAM-01). */
  benefits?: string

  /** 운영시간 — 예: '10:00 — 22:00'. */
  openingHours?: string
  /** 휴무 — 예: '매주 화요일'. */
  closedDays?: string
  /** 주차 안내 — 예: '전용 주차장 80면, 무료'. */
  parking?: string
  /** 시설 그리드 항목 (PAM-03) — 탈의실·수건대여 등. */
  facilities?: string[]
  /** 성인 기준 입장료(원). 목록·요약에서 숫자로 쓴다. */
  admissionFee?: number
  /** 요금 상세 문구 — 예: '성인 12,000원 · 어린이 8,000원'. */
  feeNote?: string
  /** 뚜벅이 접근 가능 여부 (PAM-03). */
  transitAccessible?: boolean

  phone?: string
  homepage?: string
  /** 참고사항 자유 문구 (시안 '정보'). */
  notice?: string
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

/** 지도를 옮길 목표 — 한 곳으로(point) 또는 여러 결과가 다 보이게(bounds). */
export type MapView = { lat: number; lng: number; level: number } | { bounds: MapBounds }

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
