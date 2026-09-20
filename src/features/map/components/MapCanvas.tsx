import { useEffect, useRef, useState } from 'react'

import { DEFAULT_ONSEN_IMAGE } from '@/constants/images'
import { loadKakaoMap } from '@/features/map/utils/loadKakaoMap'
import PoiMarkers from '@/features/map/components/PoiMarkers'
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
import { poiKey, type MapPoi } from '@/types/poi'

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
  pois?: MapPoi[]
  selectedPoiKey?: string
  onSelectPoi?: (key?: string) => void
  simplePoiLabels?: boolean
  /** POI 조회 기준점. 영역과 함께 알린다. */
  onCenterChange?: (center: { lat: number; lng: number; level: number }) => void
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
const onsenMarker = () =>
  `<svg xmlns="http://www.w3.org/2000/svg" width="36" height="36" viewBox="0 0 36 36">
    <g transform="translate(-3.6 -3.6) scale(1.2)" fill="none" stroke="#1C1B18" stroke-width="1.6"
      stroke-linecap="round" stroke-linejoin="round">
      <path d="M13 18c-2-2 2-3.5 0-5.5M18 18c-2-2 2-3.5 0-5.5M23 18c-2-2 2-3.5 0-5.5"/>
      <path d="M12 20.5c-1.3.4-2 1-2 1.7 0 1.4 3.6 2.5 8 2.5s8-1.1 8-2.5c0-.7-.7-1.3-2-1.7"/>
    </g>
  </svg>`

const ONSEN_MARKER = svgMarker(onsenMarker())
const FAVORITE_MARKER = svgMarker(
  '<svg xmlns="http://www.w3.org/2000/svg" width="36" height="36" viewBox="0 0 36 36"><path d="M18 25 10.8 18a4.5 4.5 0 0 1 7.2-5.3 4.5 4.5 0 0 1 7.2 5.3Z" fill="#1C1B18"/></svg>',
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

const EMPTY_POIS: MapPoi[] = []

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
  selectedPoiKey,
  onSelectPoi,
  simplePoiLabels = false,
  onCenterChange,
  focus,
  directions,
  route,
}: MapCanvasProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const mapRef = useRef<kakao.maps.Map | null>(null)
  const viewportLimitsRef = useRef<MapViewportLimits | null>(null)
  const clustererRef = useRef<kakao.maps.MarkerClusterer | null>(null)

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

  // Custom overlays retain the existing clusterer while allowing image fallback and hover.
  useEffect(() => {
    const map = mapRef.current
    const clusterer = clustererRef.current
    if (!ready || !map || !clusterer) return
    const maps = window.kakao.maps
    clusterer.clear()
    const markers = onsens.map((onsen) => {
      const chosen = onsen.id === selectedId
      const pinSize = chosen ? 58 : 48
      const photoSize = chosen ? 40 : 32
      const hostHeight = pinSize + 12
      const host = document.createElement('div')
      host.style.cssText = `position:relative;width:${pinSize}px;height:${hostHeight}px;`
      const button = document.createElement('button')
      button.type = 'button'
      button.setAttribute('aria-label', onsen.name)
      button.setAttribute('aria-pressed', String(chosen))
      button.style.cssText = `position:absolute;left:50%;top:0;display:flex;align-items:center;justify-content:center;padding:0;box-sizing:border-box;width:${pinSize}px;height:${pinSize}px;border-radius:50% 50% 50% 10px;border:${chosen ? '2px solid #292823' : '1px solid rgba(28,27,24,.86)'};background:#1C1B18;box-shadow:0 3px 8px #00000026;cursor:pointer;overflow:hidden;transform:translateX(-50%) rotate(-45deg);transform-origin:50% 50%;`
      const restingShadow = chosen ? '0 4px 12px #0000002e' : '0 3px 8px #00000026'
      button.style.boxShadow = restingShadow
      if (!window.matchMedia('(prefers-reduced-motion: reduce)').matches)
        button.style.transition = 'transform 180ms ease-out, box-shadow 180ms ease-out'
      const photoWrap = document.createElement('span')
      photoWrap.style.cssText = `display:block;box-sizing:border-box;width:${photoSize}px;height:${photoSize}px;border-radius:50%;border:2px solid rgba(255,255,255,.92);background:#F7F7F5;overflow:hidden;transform:rotate(45deg);`
      const image = document.createElement('img')
      image.alt = ''
      image.style.cssText = 'display:block;width:100%;height:100%;object-fit:cover;'
      const showFallback = () => {
        if (favoriteMarkers) {
          image.onerror = null
          photoWrap.style.border = '0'
          image.src = FAVORITE_MARKER
          return
        }
        image.onerror = () => {
          image.onerror = null
          photoWrap.style.border = '0'
          image.src = ONSEN_MARKER
        }
        image.src = DEFAULT_ONSEN_IMAGE
      }
      image.onerror = showFallback
      if (onsen.imageUrl && (!onsen.markerType || onsen.markerType === 'REGISTERED'))
        image.src = onsen.imageUrl
      else showFallback()
      photoWrap.append(image)
      button.append(photoWrap)
      const label = document.createElement('span')
      label.textContent = onsen.name
      label.style.cssText =
        'display:none;position:absolute;bottom:100%;left:50%;transform:translateX(-50%);margin-bottom:8px;max-width:220px;width:max-content;padding:4px 8px;border:1px solid #ddd;border-radius:4px;background:white;color:#1c1b18;font:500 12px/1.5 system-ui;pointer-events:none;white-space:normal;box-shadow:0 2px 6px #00000010;'
      host.append(button, label)
      const overlay = new maps.CustomOverlay({
        position: new maps.LatLng(onsen.lat, onsen.lng),
        content: host,
        xAnchor: 0.5,
        yAnchor: 1,
        zIndex: chosen ? 50 : 25,
        clickable: true,
      })
      const show = () => {
        label.style.display = 'block'
        button.style.transform = chosen
          ? 'translateX(-50%) rotate(-45deg)'
          : 'translateX(-50%) rotate(-45deg) scale(1.08)'
        button.style.boxShadow = '0 4px 12px #0000002e'
        overlay.setZIndex(chosen ? 50 : 40)
      }
      const hide = () => {
        label.style.display = 'none'
        button.style.transform = 'translateX(-50%) rotate(-45deg)'
        button.style.boxShadow = restingShadow
        overlay.setZIndex(chosen ? 50 : 25)
      }
      button.onmouseenter = show
      button.onmouseleave = hide
      button.onfocus = show
      button.onblur = hide
      button.onclick = (event) => {
        event.stopPropagation()
        onSelect?.(onsen)
      }
      return overlay
    })
    clusterer.addMarkers(
      markers.filter((marker, index) => {
        if (onsens[index].id !== selectedId) return true
        marker.setMap(map)
        return false
      }),
    )
    return () => {
      clusterer.clear()
      markers.forEach((marker) => marker.setMap(null))
    }
  }, [onsens, ready, onSelect, selectedId, favoriteMarkers])

  // MAP-03: 팬·줌이 멎으면(idle) 보이는 영역을 알린다.
  useEffect(() => {
    const map = mapRef.current
    // 콜백이 없어도 확대 수준은 따라가야 한다 — 이름표 표시가 여기에 달려 있다.
    if (!ready || !map) return

    let timer: ReturnType<typeof setTimeout> | undefined
    const cancelPending = () => clearTimeout(timer)

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
        onCenterChange?.({ lat: center.getLat(), lng: center.getLng(), level: map.getLevel() })
      }, BOUNDS_DEBOUNCE_MS)
    }

    window.kakao.maps.event.addListener(map, 'idle', handleIdle)
    window.kakao.maps.event.addListener(map, 'bounds_changed', cancelPending)
    handleIdle()

    return () => {
      clearTimeout(timer)
      window.kakao.maps.event.removeListener(map, 'idle', handleIdle)
      window.kakao.maps.event.removeListener(map, 'bounds_changed', cancelPending)
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

  useEffect(() => {
    const map = mapRef.current
    const container = containerRef.current
    const limits = viewportLimitsRef.current
    if (!ready || !map || !container || !limits || !selectedPoiKey) return
    const selectedPoi = (pois ?? EMPTY_POIS).find((poi) => poiKey(poi) === selectedPoiKey)
    if (!selectedPoi) return

    let frame = requestAnimationFrame(() => {
      const target = new window.kakao.maps.LatLng(selectedPoi.lat, selectedPoi.lng)
      const destination = limitMapViewport(map, container, limits, target)
      const point = map.getProjection().containerPointFromCoords(destination)
      const margin = Math.min(
        120,
        Math.max(56, Math.min(container.clientWidth, container.clientHeight) * 0.18),
      )
      const outsideComfortableView =
        point.x < margin ||
        point.y < margin ||
        point.x > container.clientWidth - margin ||
        point.y > container.clientHeight - margin
      if (outsideComfortableView) map.panTo(destination)
    })

    return () => cancelAnimationFrame(frame)
  }, [ready, pois, selectedPoiKey])

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
      {ready && onSelectPoi && (
        <PoiMarkers
          map={mapRef.current}
          pois={pois ?? EMPTY_POIS}
          selectedKey={selectedPoiKey}
          onSelect={onSelectPoi}
          simpleLabels={simplePoiLabels}
        />
      )}
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
