import { useCallback, useEffect, useRef, useState } from 'react'

import { fetchDirections } from '@/features/map/api/directions'

import type {
  DirectionsQuery,
  DirectionsResult,
  RouteField,
  TravelMode,
} from '@/features/map/types/directions'

export function useDirections() {
  const [origin, setOrigin] = useState<RouteField>({ text: '' })
  const [destination, setDestination] = useState<RouteField>({ text: '' })
  const [mode, setMode] = useState<TravelMode>('transit')
  const [result, setResult] = useState<DirectionsResult>()
  const [selectedId, setSelectedId] = useState<string>()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string>()
  const [locating, setLocating] = useState(false)
  const requestId = useRef(0)
  const locationId = useRef(0)

  const invalidate = useCallback(() => {
    requestId.current += 1
    locationId.current += 1
    setLocating(false)
    setResult(undefined)
    setSelectedId(undefined)
    setLoading(false)
    setError(undefined)
  }, [])

  useEffect(
    () => () => {
      requestId.current += 1
      locationId.current += 1
    },
    [],
  )

  const updateField = useCallback(
    (field: 'origin' | 'destination', value: RouteField) => {
      invalidate()
      if (field === 'origin') setOrigin(value)
      else setDestination(value)
    },
    [invalidate],
  )

  const run = useCallback(async (query: DirectionsQuery) => {
    const id = ++requestId.current
    setError(undefined)
    setResult(undefined)
    setSelectedId(undefined)
    setLoading(true)
    try {
      const next = await fetchDirections(query)
      if (id !== requestId.current) return
      setResult({ ...next, origin: query.origin, destination: query.destination })
      setSelectedId(next.routes[0]?.id)
    } catch (cause) {
      if (id === requestId.current)
        setError(
          cause instanceof Error ? cause.message : '경로를 불러오지 못했어요. 다시 시도해 주세요.',
        )
    } finally {
      if (id === requestId.current) setLoading(false)
    }
  }, [])

  const search = () => {
    if (!origin.place || !destination.place) {
      setError('출발지와 도착지를 검색 결과에서 선택해 주세요.')
      return
    }
    if (
      Math.abs(origin.place.lat - destination.place.lat) < 0.0001 &&
      Math.abs(origin.place.lng - destination.place.lng) < 0.0001
    ) {
      setError('출발지와 도착지를 서로 다른 장소로 선택해 주세요.')
      return
    }
    void run({ origin: origin.place, destination: destination.place, mode })
  }

  const changeMode = (next: TravelMode) => {
    if (next === mode) return
    const hadResult = Boolean(result || loading)
    invalidate()
    setMode(next)
    if (hadResult && origin.place && destination.place)
      void run({ origin: origin.place, destination: destination.place, mode: next })
  }

  const swap = () => {
    invalidate()
    setOrigin(destination)
    setDestination(origin)
  }
  const reset = () => {
    invalidate()
    setOrigin({ text: '' })
    setDestination({ text: '' })
  }
  const useCurrentLocation = () => {
    invalidate()
    if (!navigator.geolocation) {
      setError('현재 위치를 지원하지 않는 브라우저예요. 출발지를 직접 입력해 주세요.')
      return
    }
    const id = ++locationId.current
    setLocating(true)
    navigator.geolocation.getCurrentPosition(
      ({ coords }) => {
        if (id !== locationId.current) return
        setOrigin({
          text: '현재 위치',
          place: {
            id: 'current-location',
            name: '현재 위치',
            address: '내 위치',
            lat: coords.latitude,
            lng: coords.longitude,
          },
        })
        setLocating(false)
      },
      () => {
        if (id !== locationId.current) return
        setLocating(false)
        setError(
          '현재 위치를 확인하지 못했어요. 위치 권한을 허용하거나 출발지를 직접 입력해 주세요.',
        )
      },
      { timeout: 10000, maximumAge: 60000 },
    )
  }

  const selectedRoute = result?.routes.find((route) => route.id === selectedId)
  return {
    origin,
    destination,
    mode,
    result,
    selectedRoute,
    loading,
    error,
    locating,
    updateField,
    search,
    changeMode,
    swap,
    reset,
    invalidate,
    useCurrentLocation,
    selectRoute: setSelectedId,
  }
}
