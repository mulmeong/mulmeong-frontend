import { useEffect, useRef, useState } from 'react'

import { loadKakaoMap } from '@/features/map/utils/loadKakaoMap'

import { NATIONAL_VIEW } from '@/types/onsen'

import type { MapBounds, MapView, Onsen } from '@/types/onsen'

type MapCanvasProps = {
  onsens: Onsen[]
  selectedId?: number
  onSelect?: (onsen: Onsen) => void
  /** MAP-03 이 지역 재검색 — 팬·줌이 멎으면 보이는 영역을 알린다. */
  onBoundsChange?: (bounds: MapBounds) => void
  /** 지역을 고르거나 검색하면 그쪽으로 지도를 옮긴다. 없으면 전국 뷰 그대로. */
  focus?: MapView
}

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
  focus,
}: MapCanvasProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const mapRef = useRef<kakao.maps.Map | null>(null)
  const markersRef = useRef<kakao.maps.Marker[]>([])
  const clustererRef = useRef<kakao.maps.MarkerClusterer | null>(null)

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
      const marker = new maps.Marker({
        position: new maps.LatLng(onsen.lat, onsen.lng),
        title: onsen.name,
      })
      maps.event.addListener(marker, 'click', () => onSelect?.(onsen))
      return marker
    })

    // 클러스터러가 지도에 붙인다 — marker.setMap()을 직접 부르면 클러스터가 안 먹는다.
    clusterer.addMarkers(markersRef.current)

    // 결과 전체에 범위를 맞추지 않는다 — MAP-03이 보이는 영역 기준이라 서로 싸운다.
  }, [onsens, ready, onSelect])

  // MAP-03: 팬·줌이 멎으면(idle) 보이는 영역을 알린다.
  useEffect(() => {
    const map = mapRef.current
    if (!ready || !map || !onBoundsChange) return

    let timer: ReturnType<typeof setTimeout> | undefined

    const handleIdle = () => {
      clearTimeout(timer)
      timer = setTimeout(() => {
        const bounds = map.getBounds()
        const sw = bounds.getSouthWest()
        const ne = bounds.getNorthEast()
        onBoundsChange({
          swLat: sw.getLat(),
          swLng: sw.getLng(),
          neLat: ne.getLat(),
          neLng: ne.getLng(),
        })
      }, BOUNDS_DEBOUNCE_MS)
    }

    window.kakao.maps.event.addListener(map, 'idle', handleIdle)
    handleIdle()

    return () => {
      clearTimeout(timer)
      window.kakao.maps.event.removeListener(map, 'idle', handleIdle)
    }
  }, [ready, onBoundsChange])

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
