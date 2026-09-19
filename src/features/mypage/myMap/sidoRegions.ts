import { KOREA_PATHS } from '@/features/dart/koreaMap/paths'

/**
 * 시·도 17개. 경계 도형은 다트 지도와 같은 파일을 쓴다.
 *
 * KOREA_PATHS는 이름 없는 문자열 배열이다(다트에서는 전부 같은 색이라 구분이
 * 필요 없었다). 여기서 순서대로 지역을 붙인다. 각 path의 바운딩 박스 중심을
 * 시·도 대표 좌표와 대조해 정했고, 서울과 경기처럼 겹치는 곳은 크기로 갈랐다
 * (서울 19x16, 경기 61x81).
 *
 * TODO: 다트와 이 화면이 같은 도형을 쓰므로 나중에 공용 위치로 옮기는 게 낫다.
 * 지금 옮기면 다트 쪽 diff가 커져서 미뤘다.
 *
 * code는 행정구역 시·도 코드다. 팀원 리뷰 작성 응답(ReviewReward.sidoCode)이
 * 이 값을 주므로 이름 표기(경북/경상북도)가 달라도 어긋나지 않는다.
 *
 * TODO: 강원(42)과 전북(45)은 특별자치도 전환 후 51·52를 쓰기도 한다.
 * BE가 어느 쪽을 주는지 확인 필요.
 */
export type SidoRegion = {
  code: string
  name: string
  /** KOREA_PATHS 안의 위치. */
  pathIndex: number
}

export const SIDO_REGIONS: readonly SidoRegion[] = [
  { code: '50', name: '제주', pathIndex: 0 },
  { code: '48', name: '경남', pathIndex: 1 },
  { code: '47', name: '경북', pathIndex: 2 },
  { code: '46', name: '전남', pathIndex: 3 },
  { code: '45', name: '전북', pathIndex: 4 },
  { code: '44', name: '충남', pathIndex: 5 },
  { code: '43', name: '충북', pathIndex: 6 },
  { code: '42', name: '강원', pathIndex: 7 },
  { code: '41', name: '경기', pathIndex: 8 },
  { code: '36', name: '세종', pathIndex: 9 },
  { code: '31', name: '울산', pathIndex: 10 },
  { code: '30', name: '대전', pathIndex: 11 },
  { code: '29', name: '광주', pathIndex: 12 },
  { code: '28', name: '인천', pathIndex: 13 },
  { code: '27', name: '대구', pathIndex: 14 },
  { code: '26', name: '부산', pathIndex: 15 },
  { code: '11', name: '서울', pathIndex: 16 },
]

export function sidoPath(region: SidoRegion): string {
  return KOREA_PATHS[region.pathIndex]
}

/**
 * 지도에 보여줄 영역.
 *
 * 다트는 제주를 인셋 박스로 따로 빼서 viewBox가 본토까지만 덮는다.
 * 여기서는 제주도 제자리에 그리므로 아래쪽(y 368)까지 담아야 한다.
 * 도형 전체 범위는 x 6~294, y 62~368이다.
 */
export const MAP_VIEW_BOX = '0 55 300 320'

/**
 * 농도 양 끝. 안 간 곳은 surface-dim, 가장 많이 간 곳은 inverse다.
 * 둘 다 @theme에 있는 값이라 지도만 혼자 다른 색을 쓰지 않는다.
 */
const FILL_EMPTY = [0xf7, 0xf7, 0xf5]
const FILL_FULL = [0x1c, 0x1b, 0x18]

/** 경계선. 진한 지역 위에서도 구분되도록 흰색(surface)을 쓴다. */
export const MAP_STROKE = '#ffffff'

/**
 * density(0.0~1.0) -> 칠할 색.
 *
 * 서버가 visitCount / maxVisitCount로 계산해 준 값을 그대로 받는다.
 * 명세는 opacity에 꽂으라고 하지만, 그러면 안 간 지역이 투명해져 도형이
 * 사라진다. 같은 농도를 회색 눈금으로 옮겨 칠한다.
 */
export function densityFill(density: number): string {
  const ratio = Math.min(1, Math.max(0, density))

  const channels = FILL_EMPTY.map((empty, index) =>
    Math.round(empty + (FILL_FULL[index] - empty) * ratio),
  )

  return `#${channels.map((value) => value.toString(16).padStart(2, '0')).join('')}`
}

export type Bounds = { x: number; y: number; width: number; height: number }

function parseBounds(d: string): Bounds {
  // KOREA_PATHS는 M/L/Z만 쓰는 절대 좌표다 — 숫자 쌍을 전부 모으면 그게 꼭짓점이다.
  const numbers = d.match(/-?\d+(?:\.\d+)?/g)?.map(Number) ?? []

  let minX = Infinity
  let minY = Infinity
  let maxX = -Infinity
  let maxY = -Infinity

  for (let index = 0; index + 1 < numbers.length; index += 2) {
    const x = numbers[index]
    const y = numbers[index + 1]
    if (x < minX) minX = x
    if (x > maxX) maxX = x
    if (y < minY) minY = y
    if (y > maxY) maxY = y
  }

  return { x: minX, y: minY, width: maxX - minX, height: maxY - minY }
}

/** 한 번 잰 값은 바뀌지 않는다 — 17개뿐이지만 확대할 때마다 다시 훑을 이유는 없다. */
const boundsCache = new Map<string, Bounds>()

/** 시·도 도형이 차지하는 사각형. */
export function sidoBounds(region: SidoRegion): Bounds {
  const cached = boundsCache.get(region.code)
  if (cached) return cached

  const bounds = parseBounds(sidoPath(region))
  boundsCache.set(region.code, bounds)
  return bounds
}

/** 아주 작은 시·도가 점에서 튀어나오지 않도록 하는 최소 배율. */
const MIN_GROW_SCALE = 0.18

/**
 * 시군구 지도가 자라나기 시작할 자리.
 *
 * 그 시·도가 전국 지도 안에서 차지하던 위치와 크기를 지도 틀 대비 비율로 옮긴다.
 * 시군구 지도를 감싼 상자에 그대로 꽂으면(region-grow 키프레임) 누른 지역이
 * 그 자리에서 커지는 것처럼 보인다.
 */
export function regionGrowStyle(region: SidoRegion): Record<string, string> {
  const [viewX, viewY, viewWidth, viewHeight] = MAP_VIEW_BOX.split(' ').map(Number)
  const bounds = sidoBounds(region)

  // 지도 틀 한가운데에서 얼마나 벗어나 있는지. 상자 크기 대비 비율이다.
  const offsetX = (bounds.x + bounds.width / 2 - viewX) / viewWidth - 0.5
  const offsetY = (bounds.y + bounds.height / 2 - viewY) / viewHeight - 0.5

  const scale = Math.max(
    MIN_GROW_SCALE,
    bounds.width / viewWidth,
    bounds.height / viewHeight,
  )

  return {
    '--grow-x': `${(offsetX * 100).toFixed(2)}%`,
    '--grow-y': `${(offsetY * 100).toFixed(2)}%`,
    '--grow-scale': scale.toFixed(3),
  }
}
