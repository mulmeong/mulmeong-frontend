import { useEffect, useMemo, useRef, useState } from 'react'

import { fetchPoi } from '@/features/map/api/poi'
import { POI_CATEGORY_LABELS, type MapPoi, type PoiCategory } from '@/types/poi'

type Entry = { places?: MapPoi[]; error?: boolean }
const CACHE_TTL = 30 * 60 * 1000

export function usePois(
  categories: readonly PoiCategory[],
  center: { lat: number; lng: number } | undefined,
) {
  const [entries, setEntries] = useState<Record<string, Entry>>({})
  const [attempt, setAttempt] = useState(0)
  const cache = useRef(new Map<string, { places: MapPoi[]; expires: number }>())
  const categoryKey = [...categories].sort().join(',')
  const lat = center?.lat
  const lng = center?.lng
  const locationKey = lat !== undefined && lng !== undefined ? `${lat},${lng}` : ''
  const active = useMemo(
    () => (locationKey && categoryKey ? (categoryKey.split(',') as PoiCategory[]) : []),
    [locationKey, categoryKey],
  )

  useEffect(() => {
    if (!active.length || lat === undefined || lng === undefined) return
    let cancelled = false
    const controller = new AbortController()
    for (const category of active) {
      const key = `${locationKey}|${category}`
      const cached = cache.current.get(key)
      if (cached && cached.expires > Date.now()) {
        setEntries((current) => ({ ...current, [key]: { places: cached.places } }))
        continue
      }
      cache.current.delete(key)
      setEntries((current) => ({ ...current, [key]: {} }))
      void fetchPoi({ category, lat, lng }, controller.signal)
        .then((result) => {
          if (cancelled) return
          const places = result.places
            .filter((place) => Number.isFinite(place.lat) && Number.isFinite(place.lng))
            .map((place) => ({ ...place, category }))
          cache.current.set(key, { places, expires: Date.now() + CACHE_TTL })
          setEntries((current) => ({ ...current, [key]: { places } }))
        })
        .catch(() => {
          if (!cancelled) setEntries((current) => ({ ...current, [key]: { error: true } }))
        })
    }
    return () => {
      cancelled = true
      controller.abort()
    }
  }, [active, locationKey, lat, lng, attempt])

  const pois = useMemo(() => {
    const seen = new Set<string>()
    return active
      .flatMap((category) => entries[`${locationKey}|${category}`]?.places ?? [])
      .filter((place) => {
        if (seen.has(place.externalId)) return false
        seen.add(place.externalId)
        return true
      })
  }, [active, locationKey, entries])
  const failed = active.filter((category) => entries[`${locationKey}|${category}`]?.error)
  const loading = active.some((category) => {
    const entry = entries[`${locationKey}|${category}`]
    return !entry?.places && !entry?.error
  })
  const error = failed.length
    ? `${failed.map((category) => POI_CATEGORY_LABELS[category]).join(' · ')} 장소를 불러오지 못했어요.`
    : undefined
  return {
    pois,
    loading,
    error,
    requestKey: `${locationKey}|${categoryKey}|${attempt}`,
    retry: () => setAttempt((value) => value + 1),
  }
}
