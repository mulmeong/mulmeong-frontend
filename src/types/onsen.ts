/** 기능명세서 §4-2 스키마 기준. 명세에 없는 필드는 임의로 만들지 않는다. */
export type Onsen = {
  id: number
  name: string
  /** 전체 주소 (예: 강원 강릉시 남부로125번길 18). 일부 항목은 비어 있다. */
  address: string
  /**
   * 정식 시·도 명칭 (예: 강원특별자치도, 부산광역시).
   * 지역 필터는 `address`가 아니라 이 값으로 건다 — `regionOf()` 참고.
   */
  sido?: string
  /** 시군구 (예: 강릉시, 동래구). */
  sigungu?: string
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

/**
 * 지도 지역 필터 — 8개 광역 묶음.
 * 포도알 지도(MY-02)의 시·도 17단위와 **다른 단위다** — 통합하려 하지 말 것.
 */
export const REGIONS = ['서울', '경기', '인천', '강원', '충청', '경상', '전라', '제주'] as const

export type Region = (typeof REGIONS)[number]

/**
 * 시·도(17) → 권역(8) 매핑.
 *
 * 데이터의 `sido`는 '경상북도'·'부산광역시'처럼 정식 명칭이라 권역명으로 시작하지 않는다.
 * 주소 앞 토큰으로 거르면(`address.startsWith('경상')`) 충청·경상·전라가 통째로 빠진다
 * — 주소는 '경북 울진군…', '부산 동래구…' 형태다. 반드시 이 표를 거칠 것.
 */
const SIDO_TO_REGION: Record<string, Region> = {
  서울특별시: '서울',
  경기도: '경기',
  인천광역시: '인천',
  강원특별자치도: '강원',
  대전광역시: '충청',
  세종특별자치시: '충청',
  충청북도: '충청',
  충청남도: '충청',
  부산광역시: '경상',
  대구광역시: '경상',
  울산광역시: '경상',
  경상북도: '경상',
  경상남도: '경상',
  광주광역시: '전라',
  전라남도: '전라',
  전북특별자치도: '전라',
  제주특별자치도: '제주',
}

/**
 * 주소 앞에 오는 약칭 (예: '경북 울진군…', '부산 동래구…').
 * `sido`가 비어 있을 때만 쓰는 보조 표다.
 */
const ABBREV_TO_REGION: Record<string, Region> = {
  서울: '서울',
  경기: '경기',
  인천: '인천',
  강원: '강원',
  대전: '충청',
  세종: '충청',
  충북: '충청',
  충남: '충청',
  부산: '경상',
  대구: '경상',
  울산: '경상',
  경북: '경상',
  경남: '경상',
  광주: '전라',
  전남: '전라',
  전북: '전라',
  제주: '제주',
}

/**
 * 온천이 어느 권역인지 판단한다. 정식 `sido`를 우선 보고, 없으면 주소 앞 토큰으로 넘어간다.
 * 둘 다 모르면 undefined — 임의로 넘겨짚지 않는다 (엉뚱한 권역에 섞이면 찾기 어렵다).
 */
export function regionOf(place: {
  sido?: string | null
  address?: string | null
}): Region | undefined {
  if (place.sido && SIDO_TO_REGION[place.sido]) return SIDO_TO_REGION[place.sido]
  const first = place.address?.trim().split(/\s+/)[0]
  return first ? ABBREV_TO_REGION[first] : undefined
}

/** 지도를 옮길 목표 — 한 곳, 여러 결과의 범위, 또는 처음 화면. */
export type MapView =
  { lat: number; lng: number; level: number } | { bounds: MapBounds } | { initial: true }

/** SDK 생성용 기본값. 실제 전국 범위와 축소 한도는 지도 컨테이너 크기에 맞춰 계산한다. */
export const NATIONAL_VIEW = { lat: 35.8, lng: 127.8, level: 13 } as const

/**
 * MAP 페이지 최초 진입 시 보이는 구도. 충청권을 중심에 두고 서울·경기부터
 * 부산·경남까지 담되, 제주는 하단 밖으로 일부 벗어나도 둔다 — "전국을 다
 * 담는 최대 축소"(getNationalMapView)와는 다른 값으로, 사용자가 직접
 * 축소했을 때 갈 수 있는 한계에는 영향을 주지 않는다.
 */
export const INITIAL_MAP_VIEW = { lat: 36.3, lng: 127.75, level: 12 } as const

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
