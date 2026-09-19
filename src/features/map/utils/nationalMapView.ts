/** 남한 본토와 제주가 잘리지 않는 선에서 바다 여백을 줄이는 전국 뷰 기준점들. */
const NATIONAL_EXTENT = [
  [38.55, 128.6],
  [37.65, 125.35],
  [34.05, 125.55],
  [33.05, 126.15],
  [33.35, 127.3],
  [35.1, 129.45],
  [37.6, 129.4],
] as const
const EDGE_PADDING = 12
const WEST_SHIFT_MAX_PX = 72
const ROAD_MAP_MAX_LEVEL = 14

export type NationalMapView = { center: kakao.maps.LatLng; level: number }

/** 현재 투영에서 필요한 배율을 구하므로 화면 크기가 달라도 섬이 잘리지 않는다. */
export function getNationalMapView(map: kakao.maps.Map, container: HTMLElement): NationalMapView {
  const maps = window.kakao.maps
  const projection = map.getProjection()
  // 위경도 사각형의 바다 모서리까지 포함하면 좁은 패널에서 한 단계 더 축소될 수 있다.
  const corners = NATIONAL_EXTENT.map(([lat, lng]) =>
    projection.containerPointFromCoords(new maps.LatLng(lat, lng)),
  )
  const left = Math.min(...corners.map((point) => point.x))
  const right = Math.max(...corners.map((point) => point.x))
  const top = Math.min(...corners.map((point) => point.y))
  const bottom = Math.max(...corners.map((point) => point.y))
  const width = Math.max(1, container.clientWidth - EDGE_PADDING * 2)
  const height = Math.max(1, container.clientHeight - EDGE_PADDING * 2)
  const levelChange = Math.ceil(
    Math.log2(Math.max((right - left) / width, (bottom - top) / height)),
  )
  const level = Math.max(1, Math.min(ROAD_MAP_MAX_LEVEL, map.getLevel() + levelChange))
  const scale = 2 ** (level - map.getLevel())
  const halfWidth = (container.clientWidth / 2 - EDGE_PADDING) * scale
  const halfHeight = (container.clientHeight / 2 - EDGE_PADDING) * scale
  // 동쪽 섬까지 남기는 범위에서 서쪽으로 치우쳐 일본 노출을 줄인다.
  const westShift = Math.min(WEST_SHIFT_MAX_PX, container.clientWidth * 0.08) * scale
  const centerX = Math.max(right - halfWidth, (left + right) / 2 - westShift)
  // 북쪽 끝점을 상단 여백에 맞춘다. 위에서 높이도 맞췄으므로 제주·마라도는 유지된다.
  const centerY = top + halfHeight
  return {
    center: projection.coordsFromContainerPoint(new maps.Point(centerX, centerY)),
    level,
  }
}
