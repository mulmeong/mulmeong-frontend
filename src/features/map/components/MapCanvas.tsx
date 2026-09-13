import { useEffect, useRef, useState } from 'react'

import { loadKakaoMap } from '@/features/map/utils/loadKakaoMap'

import type { MapBounds, Onsen } from '@/types/onsen'

type MapCanvasProps = {
  onsens: Onsen[]
  selectedId?: number
  onSelect?: (onsen: Onsen) => void
  /** MAP-03 이 지역 재검색 — 팬·줌이 멎으면 보이는 영역을 알린다. */
  onBoundsChange?: (bounds: MapBounds) => void
}

/** idle이 연달아 오는 걸 묶는다 — 쿼터 방어 (CLAUDE.md 비기능 요구사항). */
const BOUNDS_DEBOUNCE_MS = 600

/** 시안 기준 초기 중심 — 강남구청 인근. */
const DEFAULT_CENTER = { lat: 37.5172, lng: 127.0473 }

export default function MapCanvas({
  onsens,
  selectedId,
  onSelect,
  onBoundsChange,
}: MapCanvasProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const mapRef = useRef<kakao.maps.Map | null>(null)
  const markersRef = useRef<kakao.maps.Marker[]>([])

  const [error, setError] = useState<string>()
  const [ready, setReady] = useState(false)

  useEffect(() => {
    let cancelled = false

    loadKakaoMap()
      .then((maps) => {
        if (cancelled || !containerRef.current) return
        mapRef.current = new maps.Map(containerRef.current, {
          center: new maps.LatLng(DEFAULT_CENTER.lat, DEFAULT_CENTER.lng),
          level: 5,
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

  // 목록이 바뀌면 마커를 다시 그린다.
  useEffect(() => {
    const map = mapRef.current
    if (!ready || !map) return

    const maps = window.kakao.maps
    markersRef.current.forEach((marker) => marker.setMap(null))

    markersRef.current = onsens.map((onsen) => {
      const marker = new maps.Marker({
        position: new maps.LatLng(onsen.lat, onsen.lng),
        title: onsen.name,
      })
      marker.setMap(map)
      maps.event.addListener(marker, 'click', () => onSelect?.(onsen))
      return marker
    })

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
