import { SIDO_REGIONS } from '@/features/mypage/myMap/sidoRegions'
import { SIGUNGU_MAPS } from '@/features/mypage/myMap/sigunguPaths'

import type { GrapeLevel, GrapeMap, GrapeRegion } from '@/types/myMap'

const MOCK_DELAY_MS = 300

/**
 * 방문 기록의 원본. 서버도 시군구 단위로 집계하므로(region_stats) 같은 단위로 둔다.
 * 시·도 값은 여기서 합쳐 만든다 — 두 화면의 숫자가 어긋날 수 없게.
 *
 * 이름은 SIGUNGU_MAPS의 data-name과 같게 적었다. 시안처럼 9곳 32회가 되도록
 * 맞췄고, 농도 차이가 눈에 보이도록 1회부터 40회까지 폭을 벌렸다.
 */
const MOCK_SIGUNGU_VISITS: Record<string, Record<string, number>> = {
  '11': { 강남구: 18, 종로구: 12, 마포구: 10 }, // 서울 40
  '43': { 충주시: 20, 제천시: 8, 단양군: 3 }, // 충북 31
  '51': { 강릉시: 11, 평창군: 6, 속초시: 4 }, // 강원 21
  '47': { 울진군: 9, 경주시: 3 }, // 경북 12
  '44': { 아산시: 6, 예산군: 2 }, // 충남 8
  '41': { 하남시: 3, 가평군: 2 }, // 경기 5
  '26': { 해운대구: 3 }, // 부산 3
  '46': { 담양군: 2 }, // 전남 2
  '50': { 서귀포시: 1 }, // 제주 1
}

/** 지역당 온천 id 두어 개를 만들어 둔다. 실제 값은 서버가 내 리뷰에서 뽑아 준다. */
function mockOnsenIds(regionCode: string, visitCount: number): number[] {
  if (visitCount === 0) return []
  const seed = Number(regionCode.slice(-2))
  return [200 + seed, 300 + seed].slice(0, Math.min(2, visitCount))
}

/**
 * 시군구 코드는 행정표준코드 5자리여야 하는데 지금 도형이 이름만 들고 있다.
 * 대응표가 생기기 전까지는 자리만 채워 두고, 화면에서는 name으로 맞춘다.
 * TODO: BE와 코드 체계를 맞춘 뒤 진짜 코드로 바꿀 것.
 */
function mockSigunguCode(sidoCode: string, index: number): string {
  return `${sidoCode}${String(index + 1).padStart(3, '0')}`
}

/** density를 채워 완성한다. 서버가 하는 일과 같은 계산이다. */
function toGrapeMap(level: GrapeLevel, regions: Omit<GrapeRegion, 'density'>[]): GrapeMap {
  const maxVisitCount = regions.reduce((max, region) => Math.max(max, region.visitCount), 0)

  return {
    level,
    totalVisitedRegions: regions.filter((region) => region.visitCount > 0).length,
    totalRegions: regions.length,
    maxVisitCount,
    regions: regions.map((region) => ({
      ...region,
      // 아무 데도 안 갔으면 분모가 0이다. 나누지 않고 전부 0으로 둔다.
      density: maxVisitCount === 0 ? 0 : region.visitCount / maxVisitCount,
    })),
  }
}

function sidoRegions(): GrapeMap {
  const regions = SIDO_REGIONS.map((region) => {
    const counts = MOCK_SIGUNGU_VISITS[region.code] ?? {}
    const visitCount = Object.values(counts).reduce((sum, count) => sum + count, 0)

    return {
      regionCode: region.code,
      name: region.name,
      visitCount,
      onsenIds: mockOnsenIds(region.code, visitCount),
    }
  })

  return toGrapeMap('SIDO', regions)
}

function sigunguRegions(sidoCode: string): GrapeMap {
  const counts = MOCK_SIGUNGU_VISITS[sidoCode] ?? {}
  const paths = SIGUNGU_MAPS[sidoCode]?.paths ?? []

  // 방문 0인 곳도 전부 내려준다 — 지도는 그 시·도를 통째로 그려야 한다.
  const regions = paths.map((path, index) => {
    const visitCount = counts[path.name] ?? 0

    return {
      regionCode: mockSigunguCode(sidoCode, index),
      name: path.name,
      visitCount,
      onsenIds: mockOnsenIds(sidoCode, visitCount),
    }
  })

  return toGrapeMap('SIGUNGU', regions)
}

function delay<T>(value: T): Promise<T> {
  return new Promise((resolve) => setTimeout(() => resolve(value), MOCK_DELAY_MS))
}

export function mockGetGrapeMap(level: GrapeLevel, parentRegionCode?: string): Promise<GrapeMap> {
  if (level === 'SIGUNGU' && parentRegionCode) return delay(sigunguRegions(parentRegionCode))
  return delay(sidoRegions())
}
