import { useEffect, useMemo, useRef, useState } from 'react'

import { useNearby } from '@/features/map/hooks/useNearby'
import FavoriteButton from '@/features/favorites/FavoriteButton'
import type { FavoriteCategory, FavoriteRequest } from '@/features/favorites/api'
import { cn } from '@/lib/cn'

import type { NearbyCategory, NearbyPlace } from '@/types/nearby'
import { poiKeyOf, toPoiCategory } from '@/types/poi'

const DEFAULT_PLACE_IMAGE = '/images/place-placeholder.svg'
const ALL_FILTER = 'ALL'
const EMPTY_NEARBY_ITEMS: NearbyPlace[] = []

type NearbyListProps = {
  onsenId: number
  /** 탭이 열렸을 때만 부른다 — 안 보는 탭 때문에 쿼터를 쓰지 않는다. */
  active: boolean
  selectedKey?: string
  onSelectPlace?: (key: string) => void
}

function formatDistance(m: number) {
  return m < 1000 ? `${m}m` : `${(m / 1000).toFixed(1)}km`
}

function favoriteCategoryOf(category: NearbyCategory): Exclude<FavoriteCategory, 'ONSEN'> {
  if (category === 'CAFE' || category === 'RESTAURANT' || category === 'SPA') return category
  if (
    category === 'ATTRACTION' ||
    category === 'PARK' ||
    category === 'CULTURE' ||
    category === 'LEISURE' ||
    category === 'SHOPPING' ||
    category === 'FESTIVAL'
  )
    return 'ATTRACTION'
  return 'ETC'
}

function filterKeyOf(place: NearbyPlace) {
  return (place.type || place.categoryLabel || place.category).trim()
}

function nearbyPlaceKey(place: NearbyPlace) {
  return poiKeyOf(toPoiCategory(place.category), place.externalId)
}

function PlaceRow({
  place,
  selected,
  onSelect,
}: {
  place: NearbyPlace
  selected: boolean
  onSelect?: () => void
}) {
  const address = place.address ?? undefined
  const imageUrl =
    place.imageUrl ?? place.image ?? place.firstImage ?? place.firstimage ?? place.thumbnail
  const favoriteTarget: FavoriteRequest | undefined =
    place.placeId != null
      ? { placeId: place.placeId }
      : place.externalId
        ? {
            source: 'TOUR_API',
            externalId: place.externalId,
            name: place.name,
            lat: place.lat,
            lng: place.lng,
            category: favoriteCategoryOf(place.category),
            imageUrl,
            address: place.address,
            phone: place.phone,
          }
        : undefined
  const meta = [
    place.categoryLabel,
    place.distanceM != null ? formatDistance(place.distanceM) : undefined,
  ]
    .filter(Boolean)
    .join(' · ')

  const body = (
    <>
      <img
        src={imageUrl || DEFAULT_PLACE_IMAGE}
        alt=""
        loading="lazy"
        onError={(event) => {
          event.currentTarget.onerror = null
          event.currentTarget.src = DEFAULT_PLACE_IMAGE
        }}
        className="bg-surface-dim size-16 shrink-0 rounded-[2px] object-cover"
      />

      <div className="flex min-w-0 flex-1 flex-col justify-center gap-1">
        <p
          className={cn(
            'text-text-primary text-[14px] leading-[1.5] font-semibold break-keep transition-colors [overflow-wrap:anywhere]',
            selected && 'text-text-primary',
          )}
        >
          {place.name}
        </p>
        {meta && <p className="text-text-secondary text-[12px] leading-5">{meta}</p>}
        {address && <p className="text-text-secondary text-[12px] leading-5">{address}</p>}
        {place.description && (
          <p className="text-text-secondary line-clamp-2 text-[12px] leading-[1.65] [overflow-wrap:anywhere]">
            {place.description}
          </p>
        )}
      </div>
    </>
  )

  return (
    <div
      role={onSelect ? 'button' : undefined}
      tabIndex={onSelect ? 0 : undefined}
      aria-pressed={selected || undefined}
      onClick={onSelect}
      onKeyDown={(event) => {
        if (!onSelect || (event.key !== 'Enter' && event.key !== ' ')) return
        event.preventDefault()
        onSelect()
      }}
      className={cn(
        'relative flex items-center gap-2 transition-colors duration-150 outline-none',
        onSelect && 'cursor-pointer hover:bg-surface-dim/35 focus-visible:ring-1 focus-visible:ring-inverse',
        selected && 'bg-surface-dim/80',
      )}
    >
      <div
        className={cn(
          'flex min-w-0 flex-1 origin-left items-start gap-3 py-4 transition-[transform,opacity] duration-150 ease-out motion-reduce:transition-none',
          selected && 'scale-[1.025]',
        )}
      >
        {body}
      </div>
      {favoriteTarget && (
        <FavoriteButton
          target={favoriteTarget}
          name={place.name}
          className="size-7 shrink-0 [&>svg]:size-4"
        />
      )}
    </div>
  )
}

export default function NearbyList({
  onsenId,
  active,
  selectedKey,
  onSelectPlace,
}: NearbyListProps) {
  const { result, loading, error } = useNearby(onsenId, active)
  const [filter, setFilter] = useState(ALL_FILTER)
  const [highlightKey, setHighlightKey] = useState<string>()
  const itemRefs = useRef(new Map<string, HTMLLIElement>())
  const items = result?.items ?? EMPTY_NEARBY_ITEMS
  const filterOptions = useMemo(() => {
    const counts = new Map<string, number>()
    for (const place of items) {
      const key = filterKeyOf(place)
      if (!key) continue
      counts.set(key, (counts.get(key) ?? 0) + 1)
    }
    return [
      { id: ALL_FILTER, label: '전체', count: items.length },
      ...Array.from(counts, ([label, count]) => ({ id: label, label, count })),
    ]
  }, [items])
  const activeFilter = filterOptions.some((option) => option.id === filter) ? filter : ALL_FILTER
  const selectedPlace = selectedKey
    ? items.find((place) => nearbyPlaceKey(place) === selectedKey)
    : undefined
  const visibleFilter =
    selectedPlace && activeFilter !== ALL_FILTER && filterKeyOf(selectedPlace) !== activeFilter
      ? ALL_FILTER
      : activeFilter
  const filteredItems = useMemo(
    () =>
      visibleFilter === ALL_FILTER
        ? items
        : items.filter((place) => filterKeyOf(place) === visibleFilter),
    [visibleFilter, items],
  )

  useEffect(() => {
    if (!selectedKey) return
    const node = itemRefs.current.get(selectedKey)
    if (!node) return
    node.scrollIntoView({ block: 'nearest', behavior: 'smooth' })
    setHighlightKey(selectedKey)
    const timer = window.setTimeout(() => setHighlightKey(undefined), 1600)
    return () => window.clearTimeout(timer)
  }, [selectedKey, filteredItems])

  if (loading)
    return (
      <p role="status" className="text-text-secondary py-3 text-[13px] leading-[1.7]">
        불러오는 중…
      </p>
    )

  if (error) {
    return (
      <p role="alert" className="text-danger text-[13px]">
        {error}
      </p>
    )
  }

  if (!result || result.items.length === 0) {
    return <p className="text-text-secondary text-[13px]">주변 여행지가 없습니다.</p>
  }

  return (
    <div>
      {filterOptions.length > 2 && (
        <div className="scrollbar-thin -mt-2 mb-2 flex gap-1 overflow-x-auto pb-2">
          {filterOptions.map((option) => {
            const selected = visibleFilter === option.id
            return (
              <button
                key={option.id}
                type="button"
                aria-pressed={selected}
                onClick={() => setFilter(option.id)}
                className={cn(
                  'inline-flex h-8 shrink-0 items-center justify-center rounded-full border px-3 text-[12px] leading-4 whitespace-nowrap transition-colors outline-none',
                  selected
                    ? 'bg-inverse text-text-inverse border-transparent font-medium'
                    : 'bg-surface text-text-primary border-border-default hover:bg-surface-dim',
                )}
              >
                {option.label}
                <span className="ml-1 text-[11px] opacity-65">{option.count}</span>
              </button>
            )
          })}
        </div>
      )}

      <ul className="divide-border-default/60 flex flex-col divide-y">
        {filteredItems.map((place) => {
          const key = nearbyPlaceKey(place)
          const selected = selectedKey === key || highlightKey === key
          return (
            <li
              key={place.externalId}
              ref={(node) => {
                if (node) itemRefs.current.set(key, node)
                else itemRefs.current.delete(key)
              }}
            >
              <PlaceRow
                place={place}
                selected={selected}
                onSelect={onSelectPlace ? () => onSelectPlace(key) : undefined}
              />
            </li>
          )
        })}
      </ul>

      {result.hasMore && (
        // 전체 보기(205)는 명세가 아직 없어 자리만 잡아둔다.
        <button
          type="button"
          disabled
          className="text-text-secondary mt-3 min-h-11 w-full cursor-not-allowed text-[12px] outline-none"
        >
          전체 보기
        </button>
      )}
    </div>
  )
}
