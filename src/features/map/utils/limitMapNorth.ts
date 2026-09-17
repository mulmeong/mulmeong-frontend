/** 강원 북부를 남기되 그 위로는 화면을 이동하지 못하게 한다. */
const NORTH_LIMIT = 38.75

/** 중심점 대신 화면 위쪽 전체를 제한한다. 줌·화면 비율이 달라도 같은 경계를 쓴다. */
export function limitMapNorth(
  map: kakao.maps.Map,
  container: HTMLElement,
  center: kakao.maps.LatLng,
  level = map.getLevel(),
) {
  const maps = window.kakao.maps
  const projection = map.getProjection()
  const point = projection.containerPointFromCoords(center)
  const scale = 2 ** (level - map.getLevel())
  const top = point.y - (container.clientHeight / 2) * scale
  let offset = 0

  // 카카오의 투영에서는 같은 위도라도 경도에 따라 화면 높이가 조금 다르다.
  for (const fraction of [0, 0.25, 0.5, 0.75, 1]) {
    const x = point.x + (fraction - 0.5) * container.clientWidth * scale
    const edge = projection.coordsFromContainerPoint(new maps.Point(x, top))
    const limit = projection.containerPointFromCoords(new maps.LatLng(NORTH_LIMIT, edge.getLng()))
    offset = Math.max(offset, limit.y - top)
  }

  // SDK의 픽셀 반올림 때문에 같은 중심을 반복 설정하지 않도록 여유를 둔다.
  if (offset < scale) return center
  return projection.coordsFromContainerPoint(new maps.Point(point.x, point.y + offset + scale))
}
