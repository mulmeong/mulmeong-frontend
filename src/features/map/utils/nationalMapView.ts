/**
 * 강원 북부·서해 도서·제주와 마라도·동해안·독도를 감싸는 끝점들.
 * 동쪽 끝(독도)을 빼면 가로 범위가 좁아져 높이 제약이 강해지고,
 * levelChange의 ceil이 한 단계를 더 줄여 제주 아래 바다가 크게 남는다.
 */
const NATIONAL_EXTENT = [
  [38.65, 128.4],
  [37.96, 124.55],
  [34.05, 125.1],
  [33.05, 126.15],
  [33.6, 127.0],
  [35.1, 129.65],
  [37.24, 131.95],
] as const
const EDGE_PADDING = 20
const ROAD_MAP_MAX_LEVEL = 14
/**
 * 가로 중심을 맞출 기준점(충주). 본토 끝점의 산술 중앙은 서해 도서·동해안까지 끌려가
 * 눈으로 보는 한반도의 중앙과 어긋난다. 픽셀 상수 대신 좌표를 기준으로 삼아
 * 화면 크기가 달라져도 같은 지점이 가로 중앙에 오게 한다.
 */
const HORIZONTAL_ANCHOR = { lat: 36.99, lng: 127.93 } as const

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
  // 기준점(충주)을 가로 중앙에 둔다.
  //
  // 끝점 범위가 화면보다 좁을 때는 양끝 제한(left+halfWidth, right-halfWidth)이 서로 뒤집혀
  // clamp가 한 값으로 고정된다 — 그러면 기준점도 통째로 무시된다. 범위가 화면보다 넓을
  // 때만 잘리지 않게 가둔다.
  const anchorX = projection.containerPointFromCoords(
    new maps.LatLng(HORIZONTAL_ANCHOR.lat, HORIZONTAL_ANCHOR.lng),
  ).x
  const lower = left + halfWidth
  const upper = right - halfWidth
  const centerX = lower <= upper ? Math.min(Math.max(anchorX, lower), upper) : anchorX
  // 북쪽 끝점을 상단 여백에 맞춘다. 위에서 높이도 맞췄으므로 제주·마라도는 유지된다.
  const centerY = top + halfHeight
  return {
    center: projection.coordsFromContainerPoint(new maps.Point(centerX, centerY)),
    level,
  }
}
