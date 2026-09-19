import { useEffect, useRef, useState } from 'react'

import { loadKakaoMap } from '@/features/map/utils/loadKakaoMap'
import {
  captureMapViewport,
  getViewportMaxLevel,
  limitMapViewport,
} from '@/features/map/utils/mapViewportLimits'
import { getNationalMapView } from '@/features/map/utils/nationalMapView'

import { NATIONAL_VIEW } from '@/types/onsen'

import type { MapViewportLimits } from '@/features/map/utils/mapViewportLimits'
import type { DirectionsResult, RouteOption } from '@/features/map/types/directions'
import type { OnsenMapPoint } from '@/features/map/types/mapPoint'
import type { MapBounds, MapView } from '@/types/onsen'
import type { Poi } from '@/types/poi'

type MapCanvasProps = {
  onsens: OnsenMapPoint[]
  selectedId?: number
  loading?: boolean
  favoriteMarkers?: boolean
  onNationalViewChange?: (national: boolean) => void
  onSelect?: (onsen: OnsenMapPoint) => void
  /** MAP-03 이 지역 재검색 — 팬·줌이 멎으면 보이는 영역을 알린다. */
  onBoundsChange?: (bounds: MapBounds) => void
  /** MAP-04 카테고리 POI — 온천과 섞이지 않게 다른 마커로 그린다. */
  pois?: Poi[]
  /** POI 조회 기준점. 영역과 함께 알린다. */
  onCenterChange?: (center: { lat: number; lng: number }) => void
  /** 지역을 고르거나 검색하면 그쪽으로 지도를 옮긴다. 없으면 전국 뷰 그대로. */
  focus?: MapView
  directions?: DirectionsResult
  route?: RouteOption
}

/** SVG를 data URI로 만든다 — '#'을 미리 이스케이프하면 이중 인코딩돼 색이 깨진다. */
function svgMarker(svg: string) {
  return 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(svg)
}

/** 온천 기호는 SVG 선으로 그려 기기별 글꼴·이모지 차이 없이 알아볼 수 있게 한다. */
const onsenMarker = (selected = false) =>
  `<svg xmlns="http://www.w3.org/2000/svg" width="36" height="36" viewBox="0 0 36 36">
    <defs>
      <filter id="shadow" x="-50%" y="-50%" width="200%" height="200%">
        <feDropShadow dx="0" dy="1" stdDeviation="1.25" flood-color="#1C1B18" flood-opacity=".16"/>
      </filter>
    </defs>
    ${selected ? '<circle cx="18" cy="18" r="16.5" fill="none" stroke="#1C1B18" stroke-opacity=".7"/>' : ''}
    <circle cx="18" cy="18" r="${selected ? 14 : 12}" fill="${selected ? '#F7F7F5' : '#1C1B18'}" fill-opacity="${selected ? 1 : 0.92}"
      stroke="${selected ? '#1C1B18' : '#FFFFFF'}" stroke-opacity=".85" stroke-width="${selected ? 1.5 : 1}" filter="url(#shadow)"/>
    <g transform="translate(4.5 4) scale(.75)" fill="none" stroke="${selected ? '#1C1B18' : '#FFFFFF'}" stroke-width="1.6"
      stroke-linecap="round" stroke-linejoin="round">
      <path d="M13 18c-2-2 2-3.5 0-5.5M18 18c-2-2 2-3.5 0-5.5M23 18c-2-2 2-3.5 0-5.5"/>
      <path d="M12 20.5c-1.3.4-2 1-2 1.7 0 1.4 3.6 2.5 8 2.5s8-1.1 8-2.5c0-.7-.7-1.3-2-1.7"/>
    </g>
  </svg>`

const ONSEN_MARKER = svgMarker(onsenMarker())
const ONSEN_MARKER_SELECTED = svgMarker(onsenMarker(true))
const ONSEN_MARKER_SIZE = 36
const ONSEN_SELECTED_SIZE = 48
const FAVORITE_MARKER = svgMarker(
  '<svg xmlns="http://www.w3.org/2000/svg" width="36" height="36" viewBox="0 0 36 36"><circle cx="18" cy="18" r="14" fill="#1C1B18" stroke="white" stroke-width="1.5"/><path d="M18 25 10.8 18a4.5 4.5 0 0 1 7.2-5.3 4.5 4.5 0 0 1 7.2 5.3Z" fill="white"/></svg>',
)

/** 개수 구간은 시각 크기만 결정한다. 지도 격자와 클러스터 묶음 기준은 그대로 둔다. */
const CLUSTER_STYLES = [34, 38, 42].map((size) => ({
  width: `${size}px`,
  height: `${size}px`,
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  boxSizing: 'border-box',
  borderRadius: '50%',
  background: 'rgba(28, 27, 24, .9)',
  border: '1px solid rgba(255, 255, 255, .2)',
  boxShadow: '0 2px 5px rgba(28, 27, 24, .14)',
  color: '#FFFFFF',
  fontFamily: 'var(--font-sans)',
  fontSize: '12px',
  fontWeight: '600',
  fontVariantNumeric: 'tabular-nums',
  lineHeight: '1',
  textAlign: 'center',
  userSelect: 'none',
  cursor: 'pointer',
}))

/** 주변 장소는 같은 무채색 계열의 빈 원으로 온천과 구분한다. */
const POI_MARKER = svgMarker(
  `<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 20 20">
    <circle cx="10" cy="10" r="5.5" fill="#FFFFFF" fill-opacity=".94"
      stroke="#1C1B18" stroke-opacity=".75" stroke-width="1.5"/>
  </svg>`,
)
const POI_MARKER_SIZE = 20

/** 이름표는 HTML로 그린다 — Marker는 텍스트를 못 올린다. */
function labelHtml(text: string, tone: 'onsen' | 'poi') {
  const label = document.createElement('span')
  label.textContent = text
  const style =
    tone === 'onsen'
      ? 'background:#1A1A1A;color:#FFFFFF;font-weight:600;'
      : 'background:#FFFFFF;color:#1A1A1A;border:1px solid #D8D3CC;'
  return (
    `<div style="${style}padding:2px 7px;border-radius:9px;font-size:11px;` +
    `line-height:1.5;white-space:nowrap;box-shadow:0 1px 3px rgba(0,0,0,.18);` +
    `font-family:system-ui,sans-serif;">${label.innerHTML}</div>`
  )
}

/** 이 레벨보다 넓게 보면 이름표를 숨긴다 — 전국 뷰에서 글자가 서로 겹친다. */
const LABEL_MAX_LEVEL = 8

/** idle이 연달아 오는 걸 묶는다 — 쿼터 방어 (CLAUDE.md 비기능 요구사항). */
const BOUNDS_DEBOUNCE_MS = 600

/** 이 레벨 이상 확대하면 클러스터를 풀고 개별 마커를 보여준다. */
const CLUSTER_MIN_LEVEL = 7

/** 주변 지역을 보여주면서 선택 마커가 클러스터에 묶이지 않는 확대 수준. */
const PLACE_FOCUS_LEVEL = CLUSTER_MIN_LEVEL - 1

/** 클러스터를 누르면 한 단계 더 확대한다. */
const CLUSTER_ZOOM_STEP = 2

export default function MapCanvas({
  onsens,
  selectedId,
  loading = false,
  favoriteMarkers = false,
  onNationalViewChange,
  onSelect,
  onBoundsChange,
  pois,
  onCenterChange,
  focus,
  directions,
  route,
}: MapCanvasProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const mapRef = useRef<kakao.maps.Map | null>(null)
  const viewportLimitsRef = useRef<MapViewportLimits | null>(null)
  const markersRef = useRef<kakao.maps.Marker[]>([])
  const clustererRef = useRef<kakao.maps.MarkerClusterer | null>(null)
  const poiMarkersRef = useRef<kakao.maps.Marker[]>([])
  const labelsRef = useRef<kakao.maps.CustomOverlay[]>([])

  /** 확대 수준에 따라 이름표를 접었다 편다. */
  const [level, setLevel] = useState<number>(NATIONAL_VIEW.level)

  const [error, setError] = useState<string>()
  const [ready, setReady] = useState(false)
  const [moving, setMoving] = useState(false)
  const busy = !error && (!ready || loading || moving)

  useEffect(() => {
    const map = mapRef.current
    if (!ready || !map) return
    map.setDraggable(!busy)
    map.setZoomable(!busy)
  }, [ready, busy])

  useEffect(() => {
    const map = mapRef.current
    const container = containerRef.current
    const limits = viewportLimitsRef.current
    if (!ready || !map || !container || !limits) return
    const idle = () => {
      setMoving(false)
      onNationalViewChange?.(map.getLevel() >= getViewportMaxLevel(limits, container))
    }
    window.kakao.maps.event.addListener(map, 'idle', idle)
    idle()
    return () => window.kakao.maps.event.removeListener(map, 'idle', idle)
  }, [ready, onNationalViewChange])

  useEffect(() => {
    let cancelled = false

    loadKakaoMap()
      .then((maps) => {
        if (cancelled || !containerRef.current) return
        mapRef.current = new maps.Map(containerRef.current, {
          center: new maps.LatLng(NATIONAL_VIEW.lat, NATIONAL_VIEW.lng),
          level: NATIONAL_VIEW.level,
        })
        const map = mapRef.current
        const view = getNationalMapView(map, containerRef.current)
        map.setLevel(view.level)
        map.setCenter(view.center)
        map.setMaxLevel(view.level)
        viewportLimitsRef.current = captureMapViewport(map, containerRef.current)
        setReady(true)
      })
      .catch((err: Error) => {
        if (!cancelled) setError(err.message)
      })

    return () => {
      cancelled = true
    }
  }, [])

  useEffect(() => {
    const map = mapRef.current
    const container = containerRef.current
    if (!ready || !map || !container) return

    let adjusting = false
    const constrainViewport = () => {
      const limits = viewportLimitsRef.current
      if (adjusting || !limits) return
      const center = map.getCenter()
      const limited = limitMapViewport(map, container, limits, center)
      if (limited === center) return
      adjusting = true
      try {
        map.setCenter(limited)
      } finally {
        adjusting = false
      }
    }

    // 드래그 도중·관성 이동·휠 확대/축소 모두 같은 첫 화면 경계를 쓴다.
    window.kakao.maps.event.addListener(map, 'bounds_changed', constrainViewport)
    constrainViewport()
    return () => window.kakao.maps.event.removeListener(map, 'bounds_changed', constrainViewport)
  }, [ready])

  // MAP-01 클러스터링 — 전국 뷰에서 마커 수백 개가 겹치는 걸 막는다.
  useEffect(() => {
    const map = mapRef.current
    if (!ready || !map || clustererRef.current) return

    const maps = window.kakao.maps
    const clusterer = new maps.MarkerClusterer({
      map,
      averageCenter: true,
      minLevel: CLUSTER_MIN_LEVEL,
      calculator: [10, 50],
      styles: CLUSTER_STYLES,
      // 기본 클릭 확대는 한 번에 많이 당겨서 직접 단계를 정한다.
      disableClickZoom: true,
    })

    maps.event.addListener(clusterer, 'clusterclick', (cluster) => {
      map.setLevel(Math.max(1, map.getLevel() - CLUSTER_ZOOM_STEP))
      map.setCenter(cluster.getCenter())
    })

    clustererRef.current = clusterer
  }, [ready])

  // 목록이 바뀌면 마커를 다시 그린다.
  useEffect(() => {
    const map = mapRef.current
    const clusterer = clustererRef.current
    if (!ready || !map || !clusterer) return

    const maps = window.kakao.maps
    clusterer.clear()

    markersRef.current = onsens.map((onsen) => {
      const chosen = onsen.id === selectedId
      const size = chosen ? ONSEN_SELECTED_SIZE : ONSEN_MARKER_SIZE
      // 원의 중심이 장소 좌표를 가리키도록 이미지 중앙에 고정한다.
      const image = new maps.MarkerImage(
        favoriteMarkers ? FAVORITE_MARKER : chosen ? ONSEN_MARKER_SELECTED : ONSEN_MARKER,
        new maps.Size(size, size),
        { offset: new maps.Point(size / 2, size / 2) },
      )

      const marker = new maps.Marker({
        position: new maps.LatLng(onsen.lat, onsen.lng),
        title: onsen.name,
        image,
        zIndex: chosen ? 3 : 2,
      })
      maps.event.addListener(marker, 'click', () => onSelect?.(onsen))
      return marker
    })

    // 클러스터러가 지도에 붙인다 — marker.setMap()을 직접 부르면 클러스터가 안 먹는다.
    clusterer.addMarkers(markersRef.current)

    // 결과 전체에 범위를 맞추지 않는다 — MAP-03이 보이는 영역 기준이라 서로 싸운다.
    // selectedId가 바뀌면 선택 마커 모양도 바뀌므로 다시 그린다.
  }, [onsens, ready, onSelect, selectedId, favoriteMarkers])

  // MAP-04: POI는 클러스터러에 넣지 않는다 — 온천 클러스터 숫자가 오염된다.
  useEffect(() => {
    const map = mapRef.current
    if (!ready || !map) return

    const maps = window.kakao.maps
    poiMarkersRef.current.forEach((marker) => marker.setMap(null))

    const image = new maps.MarkerImage(
      POI_MARKER,
      new maps.Size(POI_MARKER_SIZE, POI_MARKER_SIZE),
      { offset: new maps.Point(POI_MARKER_SIZE / 2, POI_MARKER_SIZE / 2) },
    )
    poiMarkersRef.current = (pois ?? []).map((poi) => {
      const marker = new maps.Marker({
        position: new maps.LatLng(poi.lat, poi.lng),
        title: poi.name,
        image,
        // 온천 마커 아래에 깔아 주인공을 가리지 않게 한다.
        zIndex: 1,
      })
      marker.setMap(map)
      return marker
    })
  }, [pois, ready])

  // 이름표. 마커와 별개 객체라 따로 걷어내고 다시 단다.
  useEffect(() => {
    const map = mapRef.current
    if (!ready || !map) return

    const maps = window.kakao.maps
    labelsRef.current.forEach((overlay) => overlay.setMap(null))
    labelsRef.current = []

    // 넓게 보면 글자가 서로 겹쳐 지도를 덮는다 — 일정 이상 확대했을 때만 보여준다.
    if (level > LABEL_MAX_LEVEL) return

    const make = (
      lat: number,
      lng: number,
      text: string,
      tone: 'onsen' | 'poi',
      zIndex: number,
      selected = false,
    ) =>
      new maps.CustomOverlay({
        position: new maps.LatLng(lat, lng),
        content: labelHtml(text, tone),
        // 마커 위쪽에 띄운다.
        yAnchor: selected ? 2.35 : 1.9,
        zIndex,
        clickable: false,
      })

    const overlays = [
      ...onsens.map((o) =>
        make(o.lat, o.lng, o.name, 'onsen', o.id === selectedId ? 5 : 4, o.id === selectedId),
      ),
      ...(pois ?? []).map((p) => make(p.lat, p.lng, p.name, 'poi', 3)),
    ]

    overlays.forEach((overlay) => overlay.setMap(map))
    labelsRef.current = overlays
  }, [onsens, pois, selectedId, ready, level])

  // MAP-03: 팬·줌이 멎으면(idle) 보이는 영역을 알린다.
  useEffect(() => {
    const map = mapRef.current
    // 콜백이 없어도 확대 수준은 따라가야 한다 — 이름표 표시가 여기에 달려 있다.
    if (!ready || !map) return

    let timer: ReturnType<typeof setTimeout> | undefined

    const handleIdle = () => {
      clearTimeout(timer)
      timer = setTimeout(() => {
        const bounds = map.getBounds()
        const sw = bounds.getSouthWest()
        const ne = bounds.getNorthEast()
        onBoundsChange?.({
          swLat: sw.getLat(),
          swLng: sw.getLng(),
          neLat: ne.getLat(),
          neLng: ne.getLng(),
        })

        const center = map.getCenter()
        onCenterChange?.({ lat: center.getLat(), lng: center.getLng() })
        setLevel(map.getLevel())
      }, BOUNDS_DEBOUNCE_MS)
    }

    window.kakao.maps.event.addListener(map, 'idle', handleIdle)
    handleIdle()

    return () => {
      clearTimeout(timer)
      window.kakao.maps.event.removeListener(map, 'idle', handleIdle)
    }
  }, [ready, onBoundsChange, onCenterChange])

  // 지역 선택·검색이 지도를 옮긴다. 사용자가 그 뒤 팬·줌한 건 건드리지 않는다.
  useEffect(() => {
    const map = mapRef.current
    if (!ready || !map || !focus) return

    const maps = window.kakao.maps

    if ('initial' in focus) {
      const limits = viewportLimitsRef.current
      const container = containerRef.current
      if (!limits || !container) return
      // 상세 패널을 닫으며 넓어진 실제 지도 크기를 먼저 반영한다.
      map.relayout()
      const maxLevel = getViewportMaxLevel(limits, container)
      map.setMaxLevel(maxLevel)
      map.setLevel(maxLevel)
      map.setCenter(limitMapViewport(map, container, limits, limits.center))
      return
    }

    if ('bounds' in focus) {
      const { swLat, swLng, neLat, neLng } = focus.bounds
      const area = new maps.LatLngBounds()
      area.extend(new maps.LatLng(swLat, swLng))
      area.extend(new maps.LatLng(neLat, neLng))
      if (!area.isEmpty()) map.setBounds(area)
      return
    }

    map.setLevel(focus.level)
    map.setCenter(new maps.LatLng(focus.lat, focus.lng))
  }, [focus, ready])

  // 상세패널이 열리고 닫히면 지도 컨테이너 폭이 바뀐다 — relayout 없이는 타일이 잘린다.
  useEffect(() => {
    const container = containerRef.current
    const map = mapRef.current
    const limits = viewportLimitsRef.current
    if (!ready || !map || !container || !limits) return

    const observer = new ResizeObserver(() => {
      // relayout은 중심을 흔들 수 있어 직전 중심을 되돌린다.
      const center = map.getCenter()
      map.relayout()
      map.setMaxLevel(getViewportMaxLevel(limits, container))
      map.setCenter(limitMapViewport(map, container, limits, center))
    })
    observer.observe(container)

    return () => observer.disconnect()
  }, [ready])

  // 경로 선택이 바뀔 때만 다시 맞춘다. 팬·줌·idle은 경로를 재조회하지 않는다.
  useEffect(() => {
    const map = mapRef.current
    if (!ready || !map || !directions || !route) return
    const maps = window.kakao.maps
    const bounds = new maps.LatLngBounds()
    const path = route.path.map((point) => new maps.LatLng(point.lat, point.lng))
    path.forEach((point) => bounds.extend(point))
    const lines =
      path.length >= 2
        ? [
            new maps.Polyline({
              map,
              path,
              strokeColor: '#FFFFFF',
              strokeWeight: 7,
              strokeOpacity: 0.9,
              zIndex: 6,
            }),
            new maps.Polyline({
              map,
              path,
              strokeColor: directions.mode === 'walk' ? '#79766E' : '#292823',
              strokeWeight: 3,
              strokeOpacity: 0.95,
              strokeStyle: directions.preview || directions.mode === 'walk' ? 'dashed' : 'solid',
              zIndex: 7,
            }),
          ]
        : []
    const endpoints = [directions.origin, directions.destination].map((place, index) => {
      const content = document.createElement('div')
      content.textContent = index === 0 ? '출발' : '도착'
      content.title = place.name
      content.style.cssText = `padding:6px 10px;border-radius:16px;border:1px solid #292823;background:${index === 0 ? '#FFFFFF' : '#292823'};color:${index === 0 ? '#292823' : '#FFFFFF'};font:600 11px system-ui;box-shadow:0 1px 4px #0002;`
      const position = new maps.LatLng(place.lat, place.lng)
      bounds.extend(position)
      const overlay = new maps.CustomOverlay({ position, content, zIndex: 8, yAnchor: 0.5 })
      overlay.setMap(map)
      return overlay
    })
    map.relayout()
    if (!bounds.isEmpty()) map.setBounds(bounds)
    return () => {
      lines.forEach((line) => line.setMap(null))
      endpoints.forEach((overlay) => overlay.setMap(null))
    }
  }, [ready, directions, route])

  const selectedOnsen = onsens.find((onsen) => onsen.id === selectedId)
  const selectedLat = selectedOnsen?.lat
  const selectedLng = selectedOnsen?.lng

  // 선택 좌표가 같으면 목록 재조회나 직접 팬·줌으로 포커싱을 반복하지 않는다.
  useEffect(() => {
    const map = mapRef.current
    const container = containerRef.current
    const limits = viewportLimitsRef.current
    if (
      !ready ||
      !map ||
      !container ||
      !limits ||
      selectedLat === undefined ||
      selectedLng === undefined
    )
      return
    let frame = requestAnimationFrame(() => {
      // ResizeObserver의 패널 크기 반영이 끝난 다음 포커싱한다.
      frame = requestAnimationFrame(focusPlace)
    })

    function focusPlace() {
      if (!map || !container || !limits || selectedLat === undefined || selectedLng === undefined)
        return
      // 패널은 지도와 나란히 배치되므로 남은 컨테이너의 중앙이 시각적 중앙이다.
      map.relayout()
      map.setMaxLevel(getViewportMaxLevel(limits, container))
      const target = new window.kakao.maps.LatLng(selectedLat, selectedLng)
      const currentLevel = map.getLevel()
      const targetLevel = Math.min(currentLevel, PLACE_FOCUS_LEVEL)
      const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches
      const destination = limitMapViewport(map, container, limits, target)
      const point = map.getProjection().containerPointFromCoords(destination)
      const needsPan =
        Math.abs(point.x - container.clientWidth / 2) > 1 ||
        Math.abs(point.y - container.clientHeight / 2) > 1
      setMoving(currentLevel !== targetLevel || needsPan)

      // 큰 배율 변화는 타일 확대 효과 없이 목적지와 줌을 한 번에 반영한다.
      if (currentLevel !== targetLevel || reducedMotion) {
        map.jump(target, targetLevel, { animate: false })
      } else {
        if (needsPan) map.panTo(destination)
      }
    }
    setMoving(true)
    return () => {
      cancelAnimationFrame(frame)
      setMoving(false)
    }
  }, [selectedId, selectedLat, selectedLng, ready])

  if (error) {
    return (
      <div className="bg-surface-dim flex h-full items-center justify-center p-8">
        <p className="text-text-secondary max-w-[320px] text-center text-[13px] leading-[1.7]">
          {error}
        </p>
      </div>
    )
  }

  return (
    <div className="relative size-full" aria-busy={busy}>
      <div ref={containerRef} className="size-full" inert={busy} />
      {busy && (
        <div
          role="status"
          aria-live="polite"
          className="absolute inset-0 z-[120] flex touch-none flex-col items-center justify-center gap-3 bg-white/35"
          onWheel={(event) => event.stopPropagation()}
        >
          <span
            aria-hidden="true"
            className="border-text-primary/20 border-t-text-primary size-5 rounded-full border-2 motion-safe:animate-spin"
          />
          <p className="text-text-primary bg-white/85 rounded-sm px-2 py-1 text-[14px] leading-5 font-medium">
            장소를 찾고 있어요
          </p>
        </div>
      )}
    </div>
  )
}
