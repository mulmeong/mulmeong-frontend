/**
 * dart-5a 시안 팔레트.
 *
 * 프로젝트 토큰(--color-inverse #1c1b18 등)과 값이 미묘하게 달라 섞지 않는다.
 * Tailwind는 클래스를 정적으로 훑기 때문에 이 값을 변수로 끼워 넣을 수 없다 —
 * 클래스에는 hex를 그대로 적고, 여기는 어떤 색을 쓰는지 찾아보는 용도로 둔다.
 *
 *   ink         #0E1513  기본 텍스트, 주 버튼
 *   ink-body    #2C3331  본문 문단
 *   ink-muted   #5D6764  비활성 칩 라벨
 *   ink-faint   #8A9491  그룹 라벨, 메타
 *   line        #E2E5E4  섹션 구분선
 *   line-strong #D8DCDB  칩 테두리
 *   map-bg      #F2F4F3  지도 배경
 */

import type { DartMaxMinutes, DartStayType, DartTransport } from '@/types/dart'

/** 상한 없음. 칩 id는 문자열이어야 해서 분(分) 값과 섞이지 않는 값을 쓴다. */
export const DURATION_ANY = 'any'

export type DurationId = `${DartMaxMinutes}` | typeof DURATION_ANY

export type ChipOption<T extends string> = {
  id: T
  label: string
}

/**
 * 조건 패널이 들고 있는 값. 출발지는 서버 목록(DART-404)에서 고르므로
 * 여기 두지 않고 useDartOrigins가 따로 들고 있다.
 */
export type DartConditions = {
  transport: DartTransport
  duration: DurationId
  stayType: DartStayType
}

/**
 * 도보는 없다 — 서버가 받는 값이 TRANSIT·CAR 둘뿐이다.
 * 걸어갈 수 있는지는 조건이 아니라 결과의 accessLevel로 내려온다.
 */
export const TRANSPORT_OPTIONS: ChipOption<DartTransport>[] = [
  { id: 'TRANSIT', label: '대중교통' },
  { id: 'CAR', label: '자동차' },
]

// 칩 다섯 개가 한 줄에 들어가야 해서 '1시간 30분' 대신 '90분'으로 줄였다.
export const DURATION_OPTIONS: ChipOption<DurationId>[] = [
  { id: '90', label: '90분' },
  { id: '120', label: '2시간' },
  { id: '180', label: '3시간' },
  { id: '240', label: '4시간' },
  { id: DURATION_ANY, label: '무관' },
]

export const STAY_OPTIONS: ChipOption<DartStayType>[] = [
  { id: 'DAY', label: '당일치기' },
  { id: 'OVERNIGHT', label: '1박 이상' },
]

/** 칩 id를 추첨 요청의 maxMinutes로 바꾼다. '무관'은 필드를 아예 빼야 한다. */
export function toMaxMinutes(duration: DurationId): DartMaxMinutes | undefined {
  return duration === DURATION_ANY ? undefined : (Number(duration) as DartMaxMinutes)
}

/** 시안의 기본 선택 상태. */
export const DEFAULT_CONDITIONS: DartConditions = {
  transport: 'TRANSIT',
  duration: '120',
  stayType: 'DAY',
}
