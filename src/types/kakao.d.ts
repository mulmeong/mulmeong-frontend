/**
 * 카카오맵 JS SDK 중 우리가 쓰는 부분만 선언한다.
 * 공식 타입 패키지를 넣으려면 새 의존성이라 팀 합의가 필요하다.
 */
declare namespace kakao.maps {
  class LatLng {
    constructor(lat: number, lng: number)
    getLat(): number
    getLng(): number
  }

  class LatLngBounds {
    extend(latlng: LatLng): void
    isEmpty(): boolean
  }

  class Map {
    constructor(container: HTMLElement, options: { center: LatLng; level?: number })
    setCenter(latlng: LatLng): void
    setLevel(level: number): void
    setBounds(bounds: LatLngBounds): void
    relayout(): void
  }

  class Marker {
    constructor(options: { position: LatLng; title?: string })
    setMap(map: Map | null): void
  }

  namespace event {
    function addListener(target: unknown, type: string, handler: () => void): void
  }

  function load(callback: () => void): void
}

interface Window {
  kakao: { maps: typeof kakao.maps }
}
