import { useEffect, useRef, useState } from 'react'

import { loadKakaoMap } from '@/features/map/utils/loadKakaoMap'

import { NATIONAL_VIEW } from '@/types/onsen'

import type { MapBounds, MapView, Onsen } from '@/types/onsen'
import type { Poi } from '@/types/poi'

type MapCanvasProps = {
  onsens: Onsen[]
  selectedId?: number
  onSelect?: (onsen: Onsen) => void
  /** MAP-03 이 지역 재검색 — 팬·줌이 멎으면 보이는 영역을 알린다. */
  onBoundsChange?: (bounds: MapBounds) => void
  /** MAP-04 카테고리 POI — 온천과 섞이지 않게 다른 마커로 그린다. */
  pois?: Poi[]
  /** POI 조회 기준점. 영역과 함께 알린다. */
  onCenterChange?: (center: { lat: number; lng: number }) => void
  /** 지역을 고르거나 검색하면 그쪽으로 지도를 옮긴다. 없으면 전국 뷰 그대로. */
  focus?: MapView
}

/** SVG를 data URI로 만든다 — '#'을 미리 이스케이프하면 이중 인코딩돼 색이 깨진다. */
function svgMarker(svg: string) {
  return 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(svg)
}

/** 온천 기호(♨)를 핀에 새긴다 — 지도에서 온천을 뜻하는 표준 기호라 설명이 필요 없다. */
const onsenPin = (fill: string) =>
  `<svg xmlns="http://www.w3.org/2000/svg" width="34" height="44" viewBox="0 0 26 34">
    <path d="M13 33C13 33 24.5 20.8 24.5 13A11.5 11.5 0 1 0 1.5 13C1.5 20.8 13 33 13 33Z"
      fill="${fill}" stroke="#FFFFFF" stroke-width="1.5"/>
    <path d="M8.2 16.4h9.6" stroke="#FFFFFF" stroke-width="1.7" stroke-linecap="round"/>
    <path d="M9.6 12.6c0-1.6 1.6-1.9 1.6-3.4 0-.8-.5-1.4-1-1.8"
      stroke="#FFFFFF" stroke-width="1.5" fill="none" stroke-linecap="round"/>
    <path d="M13 12.6c0-1.6 1.6-1.9 1.6-3.4 0-.8-.5-1.4-1-1.8"
      stroke="#FFFFFF" stroke-width="1.5" fill="none" stroke-linecap="round"/>
    <path d="M16.4 12.6c0-1.6 1.6-1.9 1.6-3.4 0-.8-.5-1.4-1-1.8"
      stroke="#FFFFFF" stroke-width="1.5" fill="none" stroke-linecap="round"/>
  </svg>`

/** 온천 마커. 카카오 기본 핀 대신 서비스 톤(먹색)을 쓴다. */
const ONSEN_MARKER = svgMarker(onsenPin('#1A1A1A'))
const ONSEN_MARKER_SIZE = { w: 34, h: 44 }

/** 선택된 온천. 같은 핀을 키우고 색을 바꿔 눈에 띄게 한다. */
const ONSEN_MARKER_SELECTED = svgMarker(onsenPin('#C2603F'))
const ONSEN_SELECTED_SIZE = { w: 42, h: 54 }

/** POI 마커. 온천 핀과 구분되게 점으로 그린다. */
const POI_MARKER = svgMarker(
  `<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20">
    <circle cx="10" cy="10" r="7" fill="#FFFFFF" stroke="#1A1A1A" stroke-width="2.5"/>
  </svg>`,
)
const POI_MARKER_SIZE = 20

/** 이름표는 HTML로 그린다 — Marker는 텍스트를 못 올린다. */
function labelHtml(text: string, tone: 'onsen' | 'poi') {
  const style =
    tone === 'onsen'
      ? 'background:#1A1A1A;color:#FFFFFF;font-weight:600;'
      : 'background:#FFFFFF;color:#1A1A1A;border:1px solid #D8D3CC;'
  return (
    `<div style="${style}padding:2px 7px;border-radius:9px;font-size:11px;` +
    `line-height:1.5;white-space:nowrap;box-shadow:0 1px 3px rgba(0,0,0,.18);` +
    `font-family:system-ui,sans-serif;">${text}</div>`
  )
}

/** 이 레벨보다 넓게 보면 이름표를 숨긴다 — 전국 뷰에서 글자가 서로 겹친다. */
const LABEL_MAX_LEVEL = 8

/** idle이 연달아 오는 걸 묶는다 — 쿼터 방어 (CLAUDE.md 비기능 요구사항). */
const BOUNDS_DEBOUNCE_MS = 600

/** 이 레벨 이상 확대하면 클러스터를 풀고 개별 마커를 보여준다. */
const CLUSTER_MIN_LEVEL = 7

/** 클러스터를 누르면 한 단계 더 확대한다. */
const CLUSTER_ZOOM_STEP = 2

export default function MapCanvas({
  onsens,
  selectedId,
  onSelect,
  onBoundsChange,
  pois,
  onCenterChange,
  focus,
}: MapCanvasProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const mapRef = useRef<kakao.maps.Map | null>(null)
  const markersRef = useRef<kakao.maps.Marker[]>([])
  const clustererRef = useRef<kakao.maps.MarkerClusterer | null>(null)
  const poiMarkersRef = useRef<kakao.maps.Marker[]>([])
  const labelsRef = useRef<kakao.maps.CustomOverlay[]>([])

  /** 확대 수준에 따라 이름표를 접었다 편다. */
  const [level, setLevel] = useState<number>(NATIONAL_VIEW.level)

  const [error, setError] = useState<string>()
  const [ready, setReady] = useState(false)

  useEffect(() => {
    let cancelled = false

    loadKakaoMap()
      .then((maps) => {
        if (cancelled || !containerRef.current) return
        mapRef.current = new maps.Map(containerRef.current, {
          center: new maps.LatLng(NATIONAL_VIEW.lat, NATIONAL_VIEW.lng),
          level: NATIONAL_VIEW.level,
        })
        setReady(true)
      })
      .catch((err: Error) => {
        if (!cancelled) setError(err.message)
      })

    return () => {
      cancelled = true
    }
  }, [])

  // MAP-01 클러스터링 — 전국 뷰에서 마커 수백 개가 겹치는 걸 막는다.
  useEffect(() => {
    const map = mapRef.current
    if (!ready || !map || clustererRef.current) return

    const maps = window.kakao.maps
    const clusterer = new maps.MarkerClusterer({
      map,
      averageCenter: true,
      minLevel: CLUSTER_MIN_LEVEL,
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
      const { w, h } = chosen ? ONSEN_SELECTED_SIZE : ONSEN_MARKER_SIZE
      // 핀 끝이 좌표를 가리켜야 해서 offset을 바닥 중앙에 둔다.
      const image = new maps.MarkerImage(
        chosen ? ONSEN_MARKER_SELECTED : ONSEN_MARKER,
        new maps.Size(w, h),
        { offset: new maps.Point(w / 2, h) },
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
  }, [onsens, ready, onSelect, selectedId])

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

    const make = (lat: number, lng: number, text: string, tone: 'onsen' | 'poi', zIndex: number) =>
      new maps.CustomOverlay({
        position: new maps.LatLng(lat, lng),
        content: labelHtml(text, tone),
        // 마커 위쪽에 띄운다.
        yAnchor: tone === 'onsen' ? 2.3 : 1.9,
        zIndex,
        clickable: false,
      })

    const overlays = [
      ...onsens.map((o) => make(o.lat, o.lng, o.name, 'onsen', o.id === selectedId ? 5 : 4)),
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
    if (!ready || !map || !container) return

    const observer = new ResizeObserver(() => {
      // relayout은 중심을 흔들 수 있어 직전 중심을 되돌린다.
      const center = map.getCenter()
      map.relayout()
      map.setCenter(center)
    })
    observer.observe(container)

    return () => observer.disconnect()
  }, [ready])

  // 목록에서 고르면 지도를 그 위치로 옮긴다.
  useEffect(() => {
    const map = mapRef.current
    if (!ready || !map || selectedId === undefined) return
    const target = onsens.find((onsen) => onsen.id === selectedId)
    if (!target) return
    map.setCenter(new window.kakao.maps.LatLng(target.lat, target.lng))
  }, [selectedId, onsens, ready])

  if (error) {
    return (
      <div className="bg-surface-dim flex h-full items-center justify-center p-8">
        <p className="text-text-secondary max-w-[320px] text-center text-[13px] leading-[1.7]">
          {error}
        </p>
      </div>
    )
  }

  return <div ref={containerRef} className="size-full" />
}
