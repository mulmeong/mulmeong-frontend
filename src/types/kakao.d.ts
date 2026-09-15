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
    getSouthWest(): LatLng
    getNorthEast(): LatLng
  }

  class Map {
    constructor(container: HTMLElement, options: { center: LatLng; level?: number })
    getCenter(): LatLng
    setCenter(latlng: LatLng): void
    getLevel(): number
    setLevel(level: number): void
    getBounds(): LatLngBounds
    setBounds(bounds: LatLngBounds): void
    relayout(): void
  }

  class Marker {
    constructor(options: { position: LatLng; title?: string })
    setMap(map: Map | null): void
    getPosition(): LatLng
  }

  /** libraries=clusterer 로 받아온다 (loadKakaoMap 참고). */
  class MarkerClusterer {
    constructor(options: {
      map: Map
      averageCenter?: boolean
      /** 이 레벨보다 확대하면 클러스터를 풀고 개별 마커를 보여준다. */
      minLevel?: number
      disableClickZoom?: boolean
    })
    addMarkers(markers: Marker[]): void
    clear(): void
  }

  class Cluster {
    getCenter(): LatLng
  }

  namespace event {
    function addListener(target: unknown, type: string, handler: () => void): void
    function addListener(
      target: MarkerClusterer,
      type: 'clusterclick',
      handler: (cluster: Cluster) => void,
    ): void
    function removeListener(target: unknown, type: string, handler: () => void): void
  }

  function load(callback: () => void): void
}

interface Window {
  kakao: { maps: typeof kakao.maps }
}
