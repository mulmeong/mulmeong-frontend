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
/**
 * 가로 중심을 잡는 기준점들 — 독도(131.95)뿐 아니라 백령도·흑산도 등 서해 먼 섬(126 이서)도 뺀다.
 * 이 섬들은 본토에서 한참 떨어져 있어 중심 계산에 넣으면 반대쪽으로 끌려간다 —
 * 독도만 빼면 서해 먼 섬이 중심을 서쪽으로 끌어 본토가 오른쪽으로 밀렸다.
 * 둘 다 빼고 본토(서해안~동해안)·제주 기준으로 중심을 잡되, 화면 범위는 NATIONAL_EXTENT 그대로 써서
 * 독도·서해 먼 섬이 화면 밖으로 잘리지는 않는다.
 */
const MAINLAND_EXTENT = NATIONAL_EXTENT.filter(([, lng]) => lng >= 126 && lng < 131)
const ROAD_MAP_MAX_LEVEL = 14
/**
 * 본토 중심을 화면 중앙에서 이만큼 옮긴다(양수=오른쪽, 지도는 왼쪽으로 이동).
 * 본토 중심 그대로면 동쪽으로 치우쳐 보여 왼쪽으로 조금 당긴다.
 */
const EAST_SHIFT_PX = -98

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
  const mainland = MAINLAND_EXTENT.map(([lat, lng]) =>
    projection.containerPointFromCoords(new maps.LatLng(lat, lng)),
  )
  const mainlandLeft = Math.min(...mainland.map((point) => point.x))
  const mainlandRight = Math.max(...mainland.map((point) => point.x))
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
  // 남한이 가운데 오도록 본토 기준으로 맞춘다.
  //
  // 끝점 범위가 화면보다 좁을 때는 양끝 제한(left+halfWidth, right-halfWidth)이 서로 뒤집혀
  // clamp가 한 값으로 고정된다 — 그러면 아래 보정도 통째로 무시된다. 범위가 화면보다 넓을
  // 때만 잘리지 않게 가둔다.
  // 좌표는 측정 시점 레벨의 픽셀이라 화면에서는 scale배로 줄어든다 — 나눠서 보정한다.
  const base = (mainlandLeft + mainlandRight) / 2 + EAST_SHIFT_PX / scale
  const lower = left + halfWidth
  const upper = right - halfWidth
  const centerX = lower <= upper ? Math.min(Math.max(base, lower), upper) : base
  // 북쪽 끝점을 상단 여백에 맞춘다. 위에서 높이도 맞췄으므로 제주·마라도는 유지된다.
  const centerY = top + halfHeight
  return {
    center: projection.coordsFromContainerPoint(new maps.Point(centerX, centerY)),
    level,
  }
}
