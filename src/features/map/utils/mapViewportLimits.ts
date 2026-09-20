export type MapViewportLimits = {
  center: kakao.maps.LatLng
  northWest: kakao.maps.LatLng
  southEast: kakao.maps.LatLng
  initialLevel: number
  width: number
  height: number
}

/**
 * 처음 보인 사각형을 지도 투영 좌표 그대로 저장한다. 팬·줌·패널 변경 때 갱신하지 않는다.
 *
 * `overrideView`를 주면 지도를 실제로 그 중심·레벨로 옮기지 않고도 그 상태에서
 * 보였을 사각형을 계산한다 — MAP 페이지 최초 진입 구도(충청권 중심)와 팬 허용
 * 범위(남한 전체+제주)가 다를 때 쓴다. 연속 setLevel/setCenter는 SDK 애니메이션이
 * 서로 씹혀 두 번째 호출이 무시되는 문제가 있어, 지도를 옮기는 대신 현재 레벨의
 * projection에 스케일만 보정해 계산한다(getNationalMapView와 같은 방식).
 */
export function captureMapViewport(
  map: kakao.maps.Map,
  container: HTMLElement,
  overrideView?: { center: kakao.maps.LatLng; level: number },
): MapViewportLimits {
  const projection = map.getProjection()
  const { clientWidth: width, clientHeight: height } = container
  if (!overrideView) {
    return {
      center: map.getCenter(),
      northWest: projection.coordsFromContainerPoint(new window.kakao.maps.Point(0, 0)),
      southEast: projection.coordsFromContainerPoint(new window.kakao.maps.Point(width, height)),
      initialLevel: map.getLevel(),
      width,
      height,
    }
  }
  const scale = 2 ** (overrideView.level - map.getLevel())
  const centerPoint = projection.containerPointFromCoords(overrideView.center)
  const halfWidth = (width / 2) * scale
  const halfHeight = (height / 2) * scale
  return {
    center: overrideView.center,
    northWest: projection.coordsFromContainerPoint(
      new window.kakao.maps.Point(centerPoint.x - halfWidth, centerPoint.y - halfHeight),
    ),
    southEast: projection.coordsFromContainerPoint(
      new window.kakao.maps.Point(centerPoint.x + halfWidth, centerPoint.y + halfHeight),
    ),
    initialLevel: overrideView.level,
    width,
    height,
  }
}

/** 창이 커져도 처음 범위 밖이 나타나지 않도록 필요한 경우 축소 한도를 더 좁힌다. */
export function getViewportMaxLevel(limits: MapViewportLimits, container: HTMLElement) {
  const scale = Math.min(
    limits.width / Math.max(1, container.clientWidth),
    limits.height / Math.max(1, container.clientHeight),
    1,
  )
  return Math.max(1, limits.initialLevel + Math.floor(Math.log2(scale)))
}

/** 확대된 화면 전체가 첫 화면의 동서남북 경계를 벗어나지 않게 중심을 제한한다. */
export function limitMapViewport(
  map: kakao.maps.Map,
  container: HTMLElement,
  limits: MapViewportLimits,
  center: kakao.maps.LatLng,
) {
  const projection = map.getProjection()
  const topLeft = projection.containerPointFromCoords(limits.northWest)
  const bottomRight = projection.containerPointFromCoords(limits.southEast)
  const point = projection.containerPointFromCoords(center)
  const halfWidth = container.clientWidth / 2
  const halfHeight = container.clientHeight / 2

  const clamp = (value: number, min: number, max: number) =>
    min > max ? (min + max) / 2 : Math.max(min, Math.min(max, value))
  const x = clamp(point.x, topLeft.x + halfWidth, bottomRight.x - halfWidth)
  const y = clamp(point.y, topLeft.y + halfHeight, bottomRight.y - halfHeight)

  // SDK의 픽셀 반올림 오차 때문에 같은 중심을 반복 설정하지 않는다.
  if (Math.abs(x - point.x) < 1 && Math.abs(y - point.y) < 1) return center
  return projection.coordsFromContainerPoint(new window.kakao.maps.Point(x, y))
}
