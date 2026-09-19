import { useEffect, useState } from 'react'
import { createPortal } from 'react-dom'

import { cn } from '@/lib/cn'
import { POI_CATEGORY_LABELS, poiKey, type MapPoi, type PoiCategory } from '@/types/poi'

const ICON_PATHS: Record<PoiCategory, string> = {
  CAFE: 'M18 8h1a3 3 0 0 1 0 6h-1M3 8h15v9a3 3 0 0 1-3 3H6a3 3 0 0 1-3-3ZM6 2v3m4-3v3m4-3v3',
  RESTAURANT: 'M4 3v6a3 3 0 0 0 6 0V3M7 3v18M20 21V3c-4 2-5 6-5 10h5',
  PARK: 'm8 3-5 7h3l-4 6h12l-4-6h3ZM8 16v5m6-15 3-4 5 8h-3l4 6h-7m1 0v5M5 21h15',
  CONVENIENCE: 'M3 10h18l-2-7H5ZM4 10v11h16V10M9 21v-7h6v7M2 21h20M8 3l-1 7m9-7 1 7',
  PARKING:
    'M5 3h14a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2ZM9 17V7h4a3 3 0 0 1 0 6H9',
  ACCOMMODATION:
    'M3 18v3m18-3v3M3 10V4h18v6M2 18v-5a3 3 0 0 1 3-3h14a3 3 0 0 1 3 3v5ZM7 10V7h4v3m2 0V7h4v3',
}

type Host = {
  poi: MapPoi
  members: MapPoi[]
  node: HTMLDivElement
  overlay: kakao.maps.CustomOverlay
}

const POI_OVERLAP_DISTANCE_PX = 1

export default function PoiMarkers({
  map,
  pois,
  selectedKey,
  onSelect,
}: {
  map: kakao.maps.Map | null
  pois: MapPoi[]
  selectedKey?: string
  onSelect: (key?: string) => void
}) {
  const [hosts, setHosts] = useState<Host[]>([])
  const [hoveredKey, setHoveredKey] = useState<string>()
  const [expandedKey, setExpandedKey] = useState<string>()
  const labelKey = hoveredKey ?? selectedKey

  useEffect(() => {
    if (!map) return
    let next: Host[] = []
    const rebuild = () => {
      next.forEach(({ overlay }) => overlay.setMap(null))
      setHoveredKey(undefined)
      setExpandedKey(undefined)
      const projection = map.getProjection()
      const groups: { poi: MapPoi; members: MapPoi[]; x: number; y: number }[] = []
      // Only indistinguishable positions need a chooser; nearby POIs stay independent.
      for (const poi of pois) {
        const point = projection.containerPointFromCoords(
          new window.kakao.maps.LatLng(poi.lat, poi.lng),
        )
        const group = groups.find(
          (item) => Math.hypot(item.x - point.x, item.y - point.y) < POI_OVERLAP_DISTANCE_PX,
        )
        if (group) group.members.push(poi)
        else groups.push({ poi, members: [poi], x: point.x, y: point.y })
      }
      next = groups.map(({ poi, members }) => {
        const node = document.createElement('div')
        node.style.cssText = 'width:40px;height:40px;position:relative;overflow:visible;'
        const overlay = new window.kakao.maps.CustomOverlay({
          position: new window.kakao.maps.LatLng(poi.lat, poi.lng),
          content: node,
          xAnchor: 0.5,
          yAnchor: 0.5,
          zIndex: 15,
          clickable: true,
        })
        overlay.setMap(map)
        return { poi, members, node, overlay }
      })
      setHosts(next)
    }
    rebuild()
    window.kakao.maps.event.addListener(map, 'idle', rebuild)
    return () => {
      next.forEach(({ overlay }) => overlay.setMap(null))
      window.kakao.maps.event.removeListener(map, 'idle', rebuild)
    }
  }, [map, pois])

  useEffect(() => {
    hosts.forEach(({ poi, members, overlay }) =>
      overlay.setZIndex(
        members.some((member) => poiKey(member) === selectedKey)
          ? 80
          : poiKey(poi) === hoveredKey || poiKey(poi) === expandedKey
            ? 60
            : 15,
      ),
    )
  }, [hosts, selectedKey, hoveredKey, expandedKey])

  useEffect(() => {
    if (!map) return
    const clear = () => {
      onSelect(undefined)
      setHoveredKey(undefined)
      setExpandedKey(undefined)
    }
    const escape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') clear()
    }
    window.kakao.maps.event.addListener(map, 'click', clear)
    document.addEventListener('keydown', escape)
    return () => {
      window.kakao.maps.event.removeListener(map, 'click', clear)
      document.removeEventListener('keydown', escape)
    }
  }, [map, onSelect])

  return hosts.map(({ poi: firstPoi, members, node }) => {
    const selectedMember = members.find((member) => poiKey(member) === selectedKey)
    const poi = selectedMember ?? firstPoi
    const key = poiKey(poi)
    const selected = key === selectedKey
    if (members.length > 1 && !selectedMember) {
      return createPortal(
        <div className="relative flex size-10 items-center justify-center">
          <button
            type="button"
            aria-label={`같은 위치의 주변 장소 ${members.length}곳 보기`}
            aria-expanded={expandedKey === key}
            onClick={(event) => {
              event.stopPropagation()
              setHoveredKey(undefined)
              setExpandedKey((current) => (current === key ? undefined : key))
            }}
            className="flex size-[30px] items-center justify-center rounded-full border border-white/80 bg-inverse text-[12px] font-semibold text-white shadow-sm"
          >
            {members.length}
          </button>
          {expandedKey === key ? (
            <div className="absolute bottom-full left-1/2 z-30 mb-3 max-h-48 w-52 -translate-x-1/2 overflow-y-auto rounded-md border border-border-default bg-white p-1 shadow-sm">
              {members.map((member) => (
                <button
                  key={poiKey(member)}
                  type="button"
                  onClick={(event) => {
                    event.stopPropagation()
                    onSelect(poiKey(member))
                    setExpandedKey(undefined)
                  }}
                  className="block w-full rounded-sm px-2 py-2 text-left text-[12px] text-text-primary hover:bg-surface-dim"
                >
                  {member.name}
                </button>
              ))}
            </div>
          ) : null}
        </div>,
        node,
        key,
      )
    }
    return createPortal(
      <div className="relative flex size-10 items-center justify-center">
        <button
          type="button"
          aria-label={`${POI_CATEGORY_LABELS[poi.category]} · ${poi.name}`}
          aria-pressed={selected}
          onClick={(event) => {
            event.stopPropagation()
            onSelect(selected ? undefined : key)
          }}
          onMouseEnter={() => setHoveredKey(key)}
          onMouseLeave={() => setHoveredKey(undefined)}
          onFocus={() => setHoveredKey(key)}
          onBlur={() => setHoveredKey(undefined)}
          className={cn(
            'relative flex items-center justify-center rounded-full bg-inverse text-white transition-[width,height,transform,box-shadow] duration-150 outline-none focus-visible:ring-2 focus-visible:ring-border-strong motion-reduce:transition-none',
            selected
              ? 'size-[38px] border-2 border-white shadow-[0_3px_8px_#00000030]'
              : 'size-[30px] border border-white/80 shadow-[0_1px_3px_#00000020] hover:scale-[1.067] focus-visible:scale-[1.067]',
          )}
        >
          <svg
            aria-hidden="true"
            viewBox="0 0 24 24"
            className="size-[18px]"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d={ICON_PATHS[poi.category]} />
          </svg>
          <span
            className={cn(
              'pointer-events-none absolute bottom-full left-1/2 z-20 mb-3 w-max max-w-[220px] -translate-x-1/2 rounded-sm border border-border-default bg-white px-2 py-1 text-center text-[12px] leading-5 text-text-primary whitespace-normal break-keep shadow-[0_2px_6px_#00000012] [overflow-wrap:anywhere]',
              labelKey === key && !expandedKey && !selected ? 'visible' : 'invisible',
              selected && 'border-text-primary bg-inverse text-white',
            )}
          >
            {poi.name}
          </span>
        </button>
        {selected && labelKey === key && !expandedKey && (
          <div
            className="absolute bottom-full left-1/2 z-30 mb-3 w-56 -translate-x-1/2 rounded-md border border-border-default bg-white p-3 text-text-primary shadow-[0_4px_12px_#00000014]"
            onClick={(event) => event.stopPropagation()}
          >
            <span
              aria-hidden="true"
              className="border-border-default absolute top-full left-1/2 size-2 -translate-x-1/2 -translate-y-1/2 rotate-45 border-t border-r bg-white"
            />
            <p className="text-[13px] leading-5 font-semibold">{poi.name}</p>
            <p className="mt-1 text-[12px] leading-5 text-text-secondary">
              {poi.categoryName || POI_CATEGORY_LABELS[poi.category]}
            </p>
            {poi.roadAddress && (
              <p className="mt-1 text-[12px] leading-5 whitespace-normal">{poi.roadAddress}</p>
            )}
            {poi.phone && <p className="mt-1 text-[12px] leading-5">{poi.phone}</p>}
            {poi.kakaoPlaceUrl && /^https?:\/\//.test(poi.kakaoPlaceUrl) && (
              <a
                className="mt-2 inline-block text-[12px] underline underline-offset-2"
                href={poi.kakaoPlaceUrl}
                target="_blank"
                rel="noopener noreferrer"
              >
                장소 정보
              </a>
            )}
          </div>
        )}
      </div>,
      node,
      key,
    )
  })
}
