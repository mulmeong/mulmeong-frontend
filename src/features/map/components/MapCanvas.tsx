import { useEffect, useRef, useState } from 'react'

import { loadKakaoMap } from '@/features/map/utils/loadKakaoMap'

import type { Onsen } from '@/types/onsen'

type MapCanvasProps = {
  onsens: Onsen[]
  selectedId?: number
  onSelect?: (onsen: Onsen) => void
}

/** 시안 기준 초기 중심 — 강남구청 인근. */
const DEFAULT_CENTER = { lat: 37.5172, lng: 127.0473 }

export default function MapCanvas({ onsens, selectedId, onSelect }: MapCanvasProps) {
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

    // 결과가 모두 보이도록 범위를 맞춘다.
    if (onsens.length > 0) {
      const bounds = new maps.LatLngBounds()
      onsens.forEach((onsen) => bounds.extend(new maps.LatLng(onsen.lat, onsen.lng)))
      if (!bounds.isEmpty()) map.setBounds(bounds)
    }
  }, [onsens, ready, onSelect])

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
