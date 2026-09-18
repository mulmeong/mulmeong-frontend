import { limitMapNorth } from '@/features/map/utils/limitMapNorth'

/** 강원 북부·서해 도서·제주와 마라도·동해안·독도를 감싸는 끝점들. */
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
  // 남한·제주를 맞춘 뒤, 남는 북쪽 여백이 제한선을 넘으면 남쪽으로 배치한다.
  const center = projection.coordsFromContainerPoint(
    new maps.Point((left + right) / 2, (top + bottom) / 2),
  )
  return { center: limitMapNorth(map, container, center, level), level }
}
