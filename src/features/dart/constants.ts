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

import type { Onsen } from '@/types/onsen'

export type TransportId = 'walk' | 'transit' | 'car'
export type DurationId = '1h' | '2h' | '3h' | 'any'
export type ScheduleId = 'day' | 'overnight'

export type ChipOption<T extends string> = {
  id: T
  label: string
}

export type DartConditions = {
  origin: string
  transport: TransportId
  duration: DurationId
  schedule: ScheduleId
}

export const TRANSPORT_OPTIONS: ChipOption<TransportId>[] = [
  { id: 'walk', label: '도보' },
  { id: 'transit', label: '대중교통' },
  { id: 'car', label: '자동차' },
]

export const DURATION_OPTIONS: ChipOption<DurationId>[] = [
  { id: '1h', label: '1시간' },
  { id: '2h', label: '2시간' },
  { id: '3h', label: '3시간' },
  { id: 'any', label: '무관' },
]

export const SCHEDULE_OPTIONS: ChipOption<ScheduleId>[] = [
  { id: 'day', label: '당일치기' },
  { id: 'overnight', label: '1박 이상' },
]

/** 시안의 기본 선택 상태. */
export const DEFAULT_CONDITIONS: DartConditions = {
  origin: '서울역',
  transport: 'transit',
  duration: '2h',
  schedule: 'day',
}

/**
 * TODO: 추첨 API가 붙으면 지운다. 시안(dart-5a)에 적힌 값 그대로다.
 * 필드는 전부 types/onsen.ts의 Onsen 스키마에 있는 것만 쓴다.
 */
export const SAMPLE_RESULT: Onsen = {
  id: 1,
  name: '덕구온천',
  address: '경북 울진',
  lat: 36.99,
  lng: 129.29,
  rating: 4.5,
  reviewCount: 162,
  tags: ['노천탕'],
  waterTempC: 74,
  waterQuality: '약알칼리성 중탄산',
  ph: 7.8,
  phLabel: '약알칼리성',
  description:
    '1984년에 문을 연 노포 온천. 낮은 천장과 오래된 타일이 그대로 남아 있고, 노천탕에서는 능선이 보인다.',
  features: ['천연 온천수', '노천탕 운영', '높은 원수 온도'],
  openingHours: '10:00 — 22:00',
  admissionFee: 12000,
  parking: '가능',
}
