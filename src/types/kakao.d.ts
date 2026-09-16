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
    panTo(latlng: LatLng): void
    getLevel(): number
    setLevel(level: number): void
    setMaxLevel(level: number): void
    getBounds(): LatLngBounds
    getProjection(): MapProjection
    setBounds(bounds: LatLngBounds): void
    relayout(): void
  }

  class Size {
    constructor(width: number, height: number)
  }

  class Point {
    constructor(x: number, y: number)
    x: number
    y: number
  }

  class MapProjection {
    containerPointFromCoords(latlng: LatLng): Point
    coordsFromContainerPoint(point: Point): LatLng
  }

  class MarkerImage {
    constructor(src: string, size: Size, options?: { offset?: Point })
  }

  class Polyline {
    constructor(options: {
      map?: Map
      path: LatLng[]
      strokeWeight?: number
      strokeColor?: string
      strokeOpacity?: number
      strokeStyle?: 'solid' | 'dashed'
      zIndex?: number
    })
    setMap(map: Map | null): void
  }

  class Marker {
    constructor(options: { position: LatLng; title?: string; image?: MarkerImage; zIndex?: number })
    setMap(map: Map | null): void
    getPosition(): LatLng
  }

  /** 마커 위에 이름표를 얹는다 — Marker로는 텍스트를 못 그린다. */
  class CustomOverlay {
    constructor(options: {
      position: LatLng
      content: string | HTMLElement
      /** 0=가운데, 1=아래. 마커 위에 띄우려면 1을 쓴다. */
      yAnchor?: number
      xAnchor?: number
      zIndex?: number
      clickable?: boolean
    })
    setMap(map: Map | null): void
  }

  /** libraries=clusterer 로 받아온다 (loadKakaoMap 참고). */
  class MarkerClusterer {
    constructor(options: {
      map: Map
      averageCenter?: boolean
      /** 이 레벨보다 확대하면 클러스터를 풀고 개별 마커를 보여준다. */
      minLevel?: number
      disableClickZoom?: boolean
      /** 묶음 개수에 따라 마커 스타일을 고르는 구간값. */
      calculator?: number[]
      styles?: Record<string, string>[]
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
