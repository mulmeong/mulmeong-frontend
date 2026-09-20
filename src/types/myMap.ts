/**
 * 포도알 지도(MY-02 · MY-09) — GET /users/me/grapes 응답.
 *
 * 시·도 17개가 기본이고, level=SIGUNGU로 한 시·도 안을 확대해서 본다.
 * 서버의 집계 단위는 시군구(region_stats)이고, 시·도는 그걸 sido_code로 묶어
 * 합친 값이다. 두 레벨의 응답 구조가 같아서 화면은 하나로 다룬다.
 */

export type GrapeLevel = 'SIDO' | 'SIGUNGU'

/** 지도에 칠할 지역 한 곳. */
export type GrapeRegion = {
  /** 행정표준코드. 시·도 2자리, 시군구 5자리. */
  regionCode: string
  /** 서버 표기 이름. '충청북도'처럼 정식 명칭으로 온다. */
  name: string
  visitCount: number
  /**
   * visitCount / maxVisitCount (0.0~1.0). 서버가 계산해 주지만 **지도는 쓰지
   * 않는다** — 내가 제일 많이 간 곳을 기준으로 한 상대값이라, 다른 지역을 더
   * 가면 가만히 둔 지역의 색이 저절로 연해진다. 색은 visitCount로 정한다
   * (sidoRegions의 visitFill).
   */
  density: number
  /** 그 지역에서 내가 리뷰를 남긴 온천들. */
  onsenIds: number[]
}

export type GrapeMap = {
  level: GrapeLevel
  /** 한 번이라도 방문한 지역 수. 시안의 '9 / 17곳 방문'. */
  totalVisitedRegions: number
  totalRegions: number
  /** density의 분모. 0이면 아직 아무 데도 안 갔다는 뜻이다. */
  maxVisitCount: number
  regions: GrapeRegion[]
}
