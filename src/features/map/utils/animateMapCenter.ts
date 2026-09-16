const MOVE_DURATION_MS = 480

/** panTo는 화면보다 먼 좌표에서는 즉시 이동하므로 선택 이동은 거리에 관계없이 보간한다. */
export function animateMapCenter(map: kakao.maps.Map, target: kakao.maps.LatLng) {
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
    map.setCenter(target)
    return () => {}
  }

  const start = map.getCenter()
  let frame = 0
  let startedAt: number | undefined

  const stop = () => cancelAnimationFrame(frame)
  const move = (now: number) => {
    startedAt ??= now
    const progress = Math.min((now - startedAt) / MOVE_DURATION_MS, 1)
    const eased = 1 - (1 - progress) ** 3

    map.setCenter(
      new window.kakao.maps.LatLng(
        start.getLat() + (target.getLat() - start.getLat()) * eased,
        start.getLng() + (target.getLng() - start.getLng()) * eased,
      ),
    )

    if (progress < 1) frame = requestAnimationFrame(move)
  }

  frame = requestAnimationFrame(move)
  // 사용자가 직접 지도를 조작하면 진행 중인 자동 이동을 멈춘다.
  window.kakao.maps.event.addListener(map, 'dragstart', stop)
  window.kakao.maps.event.addListener(map, 'zoom_start', stop)

  return () => {
    stop()
    window.kakao.maps.event.removeListener(map, 'dragstart', stop)
    window.kakao.maps.event.removeListener(map, 'zoom_start', stop)
  }
}
