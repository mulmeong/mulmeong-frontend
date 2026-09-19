/**
 * 다트 추첨(DART-02·03·04)과 출발지 목록(DART-404)에서 쓰는 값.
 *
 * 문자열 값은 서버가 그대로 받는 enum이라 한글 라벨과 섞지 않는다 —
 * 화면에 보일 이름은 features/dart/constants.ts의 옵션 목록에 있다.
 */

/**
 * 정해진 출발지. 검색(901)·GPS(902)·추천 목록(404) 어느 쪽에서 왔든 이 모양으로
 * 맞춰서 화면이 하나만 들고 있게 한다. 좌표는 추첨 요청의 origin에 그대로 들어간다.
 */
export type DartOrigin = {
  /** 화면에 표시하는 출발지명. */
  label: string
  lat: number
  lng: number
  /** 주소 등 라벨 밑에 붙는 보조 설명. 추천 목록에는 없다. */
  detail?: string
}

/** 901 장소 검색 결과 한 건. */
export type ExternalPlace = {
  externalId: string
  name: string
  category: string
  roadAddress: string
  lat: number
  lng: number
  /** lat·lng를 같이 보냈을 때만 채워진다. */
  distanceM: number | null
}

/** 추첨으로 뽑힌 온천 한 곳. 온천 상세(GET /onsens/{id})보다 항목이 적다. */
export type DartResultPlace = {
  /** 추첨 후보로서의 id. 다시 던질 때 excludeIds에 넣는 값이다. */
  candidateId: number
  /** 온천 id. 상세·찜·리뷰는 전부 이 값을 쓴다. */
  placeId: number
  name: string
  /** 온천 등급. 값의 종류를 명세가 열거하지 않아 문자열로 둔다. */
  grade: string
  sido: string
  sigungu: string
  lat: number
  lng: number
  distanceKm: number
  /** 출발지에서 걸리는 예상 시간(분). 서버가 거리·교통수단·접근성으로 계산한다. */
  estimatedMinutes: number
  accessLevel: string
  accessLabel: string
  stationName: string | null
  /** 거점역에서 온천까지 가는 법. 예: '버스로 약 40분' */
  stationToPlace: string | null
  hasLodging: boolean
}

export type DartThrowBody = {
  origin: { lat: number; lng: number; label: string }
  transport: DartTransport
  /** 안 보내면 시간 상한이 없다. */
  maxMinutes?: DartMaxMinutes
  stayType: DartStayType
  /** 이번 추첨에서 뺄 후보. 서버 상한이 100개다. */
  excludeIds?: number[]
}

export type DartThrowResponse = {
  /** base62 8자. 공유 주소의 끝부분이다. */
  dartId: string
  shareUrl: string
  /** 실제 추첨에 쓰인 후보 수. 후보 목록 자체는 내려오지 않는다. */
  candidateCount: number
  /** 후보가 모자라 서버가 시간 조건을 늘렸다. */
  relaxed: boolean
  /** 완화 전 조건(분). relaxed일 때만 값이 있다. */
  relaxedFrom: number | null
  relaxMessage: string | null
  result: DartResultPlace
}

/**
 * 결과 카드의 '가는 길'에 쓰는 값.
 *
 * 던지기 응답과 공유 응답이 주는 항목이 다르다 — 공유 쪽은 예상 시간만 있고
 * 거리·접근성·거점역이 없다. 같은 카드로 보여주려고 둘의 공통 모양을 따로 둔다.
 */
export type DartTravel = {
  estimatedMinutes: number
  distanceKm?: number
  accessLabel?: string
  stationName?: string | null
  stationToPlace?: string | null
}

/**
 * 공유된 다트 (DART-06).
 *
 * 로그인 없이 열 수 있어야 한다. 온천 상세는 여기 없고 onsenId로 따로 받는다.
 * 조건 필드 이름이 던지기 요청과 다르다 — maxMinutes가 아니라 maxDurationMin,
 * stayType이 아니라 tripType이다.
 */
export type SharedDart = {
  dartId: string
  conditions: {
    originLabel: string
    transport: DartTransport
    maxDurationMin: number | null
    tripType: DartStayType
  }
  result: {
    onsenId: number
    name: string
    sido: string
    lat: number
    lng: number
    thumbnail: string | null
    estimatedMinutes: number
  }
  relaxed: boolean
  /** 이 결과가 나오기까지 던진 횟수. */
  throwCount: number
  /** 비로그인·탈퇴 사용자가 던졌으면 '익명의 물멍러'. */
  thrownBy: string
  /** 로그인한 본인이 던진 다트. */
  isMine: boolean
  createdAt: string
  /** 생성 30일 뒤. 지나면 410이다. */
  expiresAt: string
}

/** 902 좌표→주소 변환 결과. */
export type Coord2Address = {
  lat: number
  lng: number
  roadAddress: string
  jibunAddress: string
  sido: string
  sigungu: string
  /** 행정표준코드 5자리. 추첨 요청에 출발 지역으로 넘길 수 있다. */
  regionCode: string
  /** 화면에 그대로 찍는 문자열. 도로명이 없으면 서버가 지번으로 대체해 준다. */
  label: string
}

export type DartTransport = 'TRANSIT' | 'CAR'

export type DartStayType = 'DAY' | 'OVERNIGHT'

/** 소요시간 상한(분). 서버는 이 네 값만 받고, 안 보내면 상한이 없다. */
export type DartMaxMinutes = 90 | 120 | 180 | 240
