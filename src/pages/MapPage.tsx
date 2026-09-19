import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useSearchParams } from 'react-router-dom'

import AuthHeader from '@/features/auth/components/AuthHeader'
import { useAuth } from '@/features/auth/hooks/authContext'
import { useFavorites } from '@/features/favorites/FavoritesProvider'
import FavoriteButton from '@/features/favorites/FavoriteButton'
import type { Favorite } from '@/features/favorites/api'
import { useOnsenDetail } from '@/features/map/hooks/useOnsenDetail'
import { onsenFromDetail } from '@/features/map/utils/onsenFromDetail'
import DirectionsPanel from '@/features/map/components/DirectionsPanel'
import MapCanvas from '@/features/map/components/MapCanvas'
import MapSidebar from '@/features/map/components/MapSidebar'
import MapSidebarLayout from '@/features/map/components/MapSidebarLayout'
import MapSavedControls from '@/features/map/components/MapSavedControls'
import OnsenDetailPanel from '@/features/map/components/OnsenDetailPanel'
import PoiFilter from '@/features/map/components/PoiFilter'
import PoiDetailPanel from '@/features/map/components/PoiDetailPanel'
import { usePoiLoadingIndicator } from '@/features/map/hooks/usePoiLoadingIndicator'
import { POI_HIDE_LEVEL, POI_VISIBLE_LEVEL, REGION_PREVIEW_COUNT } from '@/features/map/constants'
import { fetchPamphletDetail } from '@/features/map/api/pamphlets'
import { useNearby } from '@/features/map/hooks/useNearby'
import { useOnsenMapPoints } from '@/features/map/hooks/useOnsenMapPoints'
import { useOnsens } from '@/features/map/hooks/useOnsens'
import { useDirections } from '@/features/map/hooks/useDirections'
import { usePois } from '@/features/map/hooks/usePois'
import { cn } from '@/lib/cn'

import { REGION_VIEWS } from '@/types/onsen'

import type { OnsenMapPoint } from '@/features/map/types/mapPoint'
import type { MapBounds, MapView, Region } from '@/types/onsen'
import type { Pamphlet, PamphletPlace } from '@/types/pamphlet'
import type { MapPoi, PoiFilterId } from '@/types/poi'
import { POI_FILTER_CATEGORY_MAP, poiKey, toPoiCategory } from '@/types/poi'

/** 검색 결과가 하나뿐일 때 지도를 얼마나 당길지. */
const SINGLE_RESULT_LEVEL = 5

type SearchFilters = { keyword?: string; region?: string }

export default function MapPage() {
  const { user } = useAuth()
  const favorites = useFavorites()
  const [searchParams] = useSearchParams()
  const [savedMode, setSavedMode] = useState(searchParams.get('saved') === '1')
  const fitSaved = useRef(searchParams.get('saved') === '1')
  const showingSaved = savedMode && !!user
  /**
   * 지도에 띄워 둔 팜플렛. 드롭다운 열림 상태(MapSavedControls 내부)와 분리해,
   * 목록을 닫아도 마커는 남는다. 같은 팜플렛을 다시 고르면 표시를 해제한다.
   *
   * 장소 마커는 아직 붙이지 않았다 — 팜플렛 id로 장소를 가져오는 API가 없다
   * (features/map/api/pamphlets.ts 주석 참고). BE가 열어주면 여기서 이어받는다.
   */
  const [activePamphlet, setActivePamphlet] = useState<Pamphlet>()
  /**
   * 주변 탭이 열려 있으면 그 장소들을 지도에 띄운다. POI 토글과 둘 다 '주변에 뭐가
   * 있나'를 보는 기능이라 동시에 켜면 마커가 섞여 읽기 어렵다 — 탭이 열리면 POI를 끈다.
   */
  const [nearbyOpen, setNearbyOpen] = useState(false)
  const handleSelectPamphlet = useCallback((pamphlet: Pamphlet) => {
    setActivePamphlet((current) =>
      current?.pamphletId === pamphlet.pamphletId ? undefined : pamphlet,
    )
  }, [])
  const linkedId = Number(searchParams.get('onsen')) || undefined
  const linkedDetail = useOnsenDetail(linkedId)
  const linkedOnsen = useMemo(
    () => (linkedDetail.detail ? onsenFromDetail(linkedDetail.detail) : undefined),
    [linkedDetail.detail],
  )
  const handledLink = useRef('')
  const { onsens, loading, error, load } = useOnsens(REGION_PREVIEW_COUNT)
  const nationalMap = useOnsenMapPoints()
  const [selectedId, setSelectedId] = useState<number>()
  const nearby = useNearby(selectedId, nearbyOpen)
  /**
   * 주변 장소를 POI 마커로 그린다 — 지도 위 표현을 하나로 맞추고 아이콘도 재사용한다.
   * 관광지/기타처럼 POI 토글 카테고리에 없는 값은 공원 아이콘을 빌려 쓴다.
   */
  const nearbyPois = useMemo<MapPoi[]>(
    () =>
      nearbyOpen
        ? (nearby.result?.items ?? [])
            .filter((place) => place.lat != null && place.lng != null)
            .map((place) => ({
              externalId: place.externalId,
              placeId: place.placeId,
              name: place.name,
              categoryName: place.categoryLabel,
              address: place.address ?? undefined,
              lat: place.lat,
              lng: place.lng,
              distanceM: place.distanceM ?? 0,
              imageUrl: place.imageUrl ?? undefined,
              category: toPoiCategory(place.category),
            }))
        : [],
    [nearbyOpen, nearby.result],
  )
  const [selectedPoint, setSelectedPoint] = useState<OnsenMapPoint>()
  const [externalPlace, setExternalPlace] = useState<Favorite>()
  const [detailClosing, setDetailClosing] = useState(false)
  const [detailEntered, setDetailEntered] = useState(false)
  const detailEnterFrame = useRef<number | undefined>(undefined)
  const [nationalView, setNationalView] = useState(true)

  const [mode, setMode] = useState<'search' | 'directions'>('search')
  const modeRef = useRef(mode)
  const directions = useDirections()
  const { updateField, invalidate } = directions
  const setDestination = useCallback(
    (onsen: OnsenMapPoint) => {
      updateField('destination', {
        text: onsen.name,
        place: {
          id: `onsen-${onsen.id}`,
          name: onsen.name,
          address: onsen.address ?? '',
          lat: onsen.lat,
          lng: onsen.lng,
        },
      })
    },
    [updateField],
  )
  const setPoiDestination = useCallback(
    (poi: MapPoi) => {
      updateField('destination', {
        text: poi.name,
        place: {
          id: `poi-${poi.category}-${poi.externalId}`,
          name: poi.name,
          address: poi.address ?? poi.roadAddress ?? '',
          lat: poi.lat,
          lng: poi.lng,
        },
      })
    },
    [updateField],
  )
  const handleSelect = useCallback(
    (onsen: OnsenMapPoint) => {
      const savedPlace = favorites.items.find((place) => place.placeId === onsen.id)
      if (showingSaved && !savedPlace) setSavedMode(false)
      if (modeRef.current === 'directions') setDestination(onsen)
      else {
        setSelectedPoint(onsen)
        setExternalPlace(savedPlace?.placeType !== 'ONSEN' ? savedPlace : undefined)
        const opening = selectedId === undefined
        if (detailEnterFrame.current !== undefined) {
          cancelAnimationFrame(detailEnterFrame.current)
          detailEnterFrame.current = undefined
        }
        setDetailClosing(false)
        setDetailEntered(!opening)
        setSelectedId(onsen.id)
        if (opening) {
          detailEnterFrame.current = requestAnimationFrame(() => {
            detailEnterFrame.current = requestAnimationFrame(() => {
              setDetailEntered(true)
              detailEnterFrame.current = undefined
            })
          })
        }
      }
    },
    [selectedId, setDestination, showingSaved, favorites.items],
  )

  useEffect(() => {
    return () => {
      if (detailEnterFrame.current !== undefined) cancelAnimationFrame(detailEnterFrame.current)
    }
  }, [])

  function openDirections(onsen?: OnsenMapPoint) {
    modeRef.current = 'directions'
    setMode('directions')
    setSelectedId(undefined)
    setDetailClosing(false)
    setDetailEntered(false)
    setCollapsed(false)
    if (onsen) setDestination(onsen)
  }

  function openPoiDirections(poi: MapPoi) {
    modeRef.current = 'directions'
    setMode('directions')
    setSelectedPoi(undefined)
    setDetailClosing(false)
    setDetailEntered(false)
    setCollapsed(false)
    setPoiDestination(poi)
  }

  function openSearch() {
    invalidate()
    modeRef.current = 'search'
    setMode('search')
  }

  // 검색어·지역은 MapSidebar가 들고 있다 — 지도를 움직여도 그 조건을 잃지 않게 기억한다.
  const filtersRef = useRef<SearchFilters>({})
  const [hasFilter, setHasFilter] = useState(false)
  const [focus, setFocus] = useState<MapView>()
  /**
   * 고른 팜플렛의 장소. 목록 응답에는 좌표가 없어 상세를 따로 받는다.
   * 실패해도 지도 탐색은 계속돼야 해서 조용히 비운다.
   */
  const [pamphletPlaces, setPamphletPlaces] = useState<PamphletPlace[]>([])
  useEffect(() => {
    const id = activePamphlet?.pamphletId
    if (id === undefined) {
      setPamphletPlaces([])
      return
    }
    let cancelled = false
    fetchPamphletDetail(id)
      .then((detail) => {
        if (cancelled) return
        const placed = detail.places.filter((place) => place.lat != null && place.lng != null)
        setPamphletPlaces(placed)
        // 저장한 곳이 한눈에 들어오게 범위를 맞춘다. 한 곳뿐이면 과하게 당기지 않는다.
        if (placed.length > 1) {
          setFocus({
            bounds: {
              swLat: Math.min(...placed.map((place) => place.lat!)),
              swLng: Math.min(...placed.map((place) => place.lng!)),
              neLat: Math.max(...placed.map((place) => place.lat!)),
              neLng: Math.max(...placed.map((place) => place.lng!)),
            },
          })
        } else if (placed[0]) {
          setFocus({ lat: placed[0].lat!, lng: placed[0].lng!, level: SINGLE_RESULT_LEVEL })
        }
      })
      .catch(() => {
        if (!cancelled) setPamphletPlaces([])
      })
    return () => {
      cancelled = true
    }
  }, [activePamphlet])

  useEffect(() => {
    const key = searchParams.toString()
    if (handledLink.current === key) return
    if (linkedOnsen) {
      handledLink.current = key
      handleSelect(linkedOnsen)
    } else if (searchParams.has('lat') && searchParams.has('lng')) {
      const lat = Number(searchParams.get('lat'))
      const lng = Number(searchParams.get('lng'))
      if (
        Number.isFinite(lat) &&
        Number.isFinite(lng) &&
        Math.abs(lat) <= 90 &&
        Math.abs(lng) <= 180
      ) {
        handledLink.current = key
        setFocus({ lat, lng, level: SINGLE_RESULT_LEVEL })
      }
    }
  }, [searchParams, linkedOnsen, handleSelect])

  const handleSearch = useCallback(
    async (filters: SearchFilters) => {
      filtersRef.current = filters
      setSavedMode(false)
      setHasFilter(Boolean(filters.keyword || filters.region))
      setSelectedId(undefined)
      setDetailClosing(false)
      setDetailEntered(false)

      if (!filters.keyword && !filters.region) {
        setFocus({ initial: true })
      }

      // 조건이 없으면 첫 화면이라 전국을 다 받지 않는다 — 카드 미리보기에 쓸 만큼만.
      const results = await load(
        filters.keyword || filters.region ? filters : { ...filters, limit: REGION_PREVIEW_COUNT },
      )
      // 초기 화면으로 돌아간 뒤 늦게 도착한 검색이 지도를 다시 이동시키지 않는다.
      if (filtersRef.current !== filters || modeRef.current !== 'search') return

      if (filters.region) {
        // 지역은 결과와 무관하게 그 지역이 보이게 한다.
        setFocus(REGION_VIEWS[filters.region as Region])
        return
      }

      // 검색어로 찾은 결과가 화면 밖이면 못 보므로 결과에 맞춰 옮긴다.
      if (!filters.keyword || results.length === 0) return

      if (results.length === 1) {
        const [only] = results
        setFocus({ lat: only.lat, lng: only.lng, level: SINGLE_RESULT_LEVEL })
        return
      }

      setFocus({
        bounds: {
          swLat: Math.min(...results.map((o) => o.lat)),
          swLng: Math.min(...results.map((o) => o.lng)),
          neLat: Math.max(...results.map((o) => o.lat)),
          neLng: Math.max(...results.map((o) => o.lng)),
        },
      })
    },
    [load],
  )

  /**
   * 조건이 없으면 전국 마커 캐시를 재사용하고 미리보기는 유지한다.
   * 지도 이동으로 전체 카드 목록을 내려받지 않는다.
   */
  const handleBoundsChange = useCallback(
    (bounds: MapBounds) => {
      if (showingSaved || !hasFilter || modeRef.current !== 'search') return
      void load({ ...filtersRef.current, bounds })
    },
    [load, hasFilter, showingSaved],
  )

  const savedPoints = useMemo(
    () =>
      favorites.items.map((place) => ({
        id: place.placeId,
        name: place.name,
        lat: place.lat,
        lng: place.lng,
        address: place.address ?? undefined,
        imageUrl: place.placeType === 'ONSEN' ? (place.thumbnail ?? undefined) : undefined,
      })),
    [favorites.items],
  )
  // 팜플렛을 띄운 동안에는 그 장소만 보여준다 — 전국 마커와 섞이면 뭘 저장했는지 묻힌다.
  const pamphletPoints = useMemo<OnsenMapPoint[]>(
    () =>
      pamphletPlaces.map((place) => ({
        id: place.placeId,
        name: place.name,
        lat: place.lat!,
        lng: place.lng!,
        address: place.address ?? undefined,
        imageUrl: place.imageUrl ?? undefined,
      })),
    [pamphletPlaces],
  )
  const basePoints = pamphletPoints.length
    ? pamphletPoints
    : showingSaved
      ? savedPoints
      : hasFilter
        ? onsens
        : nationalMap.points
  const mapOnsens = useMemo(() => {
    const points =
      !showingSaved && linkedOnsen && !basePoints.some((place) => place.id === linkedOnsen.id)
        ? [...basePoints, linkedOnsen]
        : basePoints
    // 검색 미리보기에서 선택한 온천도 전국 마커 응답 유무와 무관하게 계속 보여준다.
    if (
      selectedPoint?.id === selectedId &&
      externalPlace?.placeId !== selectedId &&
      selectedPoint &&
      !points.some((place) => place.id === selectedPoint.id)
    ) {
      return [...points, selectedPoint]
    }
    return points
  }, [showingSaved, linkedOnsen, basePoints, selectedPoint, selectedId, externalPlace])
  // 첫 화면의 미리보기에 없는 마커도 선택할 수 있다. 상세는 선택한 id로 조회한다.
  const selected =
    onsens.find((onsen) => onsen.id === selectedId) ??
    mapOnsens.find((onsen) => onsen.id === selectedId) ??
    (selectedPoint?.id === selectedId ? selectedPoint : undefined)
  const externalSelected = externalPlace?.placeId === selectedId ? externalPlace : undefined

  function toggleSavedMap() {
    const next = !showingSaved
    filtersRef.current = { ...filtersRef.current }
    fitSaved.current = next
    setSavedMode(next)
    setSelectedId(undefined)
    setDetailClosing(false)
    setDetailEntered(false)
    if (!next) setFocus({ initial: true })
  }

  useEffect(() => {
    if (!showingSaved || !fitSaved.current || favorites.loading || favorites.error) return
    fitSaved.current = false
    const points = savedPoints
    if (points.length === 1) {
      setFocus({ lat: points[0].lat, lng: points[0].lng, level: SINGLE_RESULT_LEVEL })
    } else if (points.length > 1) {
      setFocus({
        bounds: {
          swLat: Math.min(...points.map((point) => point.lat)),
          swLng: Math.min(...points.map((point) => point.lng)),
          neLat: Math.max(...points.map((point) => point.lat)),
          neLng: Math.max(...points.map((point) => point.lng)),
        },
      })
    }
  }, [showingSaved, favorites.loading, favorites.error, savedPoints])

  /**
   * MAP-07 리스트 뷰 토글. 시안에 버튼이 없어 형태는 우리가 정했다 —
   * 패널 경계의 손잡이로 접고 편다. 모바일은 45dvh 스트립이라 접는 의미가 없어 데스크탑만.
   */
  const [collapsed, setCollapsed] = useState(false)
  const [sidebarVersion, setSidebarVersion] = useState(0)

  function handleNationalView() {
    setCollapsed(false)
    setPoiFilter(undefined)
    setSidebarVersion((version) => version + 1)
    void handleSearch({})
  }

  const [poiFilter, setPoiFilter] = useState<PoiFilterId>()
  const [viewportCenter, setViewportCenter] = useState<{ lat: number; lng: number }>()
  const [poiZoomVisible, setPoiZoomVisible] = useState(false)
  const handleCenterChange = useCallback(
    (viewport: { lat: number; lng: number; level: number }) => {
      setPoiZoomVisible((visible) =>
        visible ? viewport.level < POI_HIDE_LEVEL : viewport.level <= POI_VISIBLE_LEVEL,
      )
      // Ignore sub-block drift caused by relayout and floating-point projection.
      const lat = Number(viewport.lat.toFixed(3))
      const lng = Number(viewport.lng.toFixed(3))
      setViewportCenter((current) =>
        current?.lat === lat && current.lng === lng ? current : { lat, lng },
      )
    },
    [],
  )
  const poiOnsen = !externalSelected ? selected : undefined
  // 주변 탭이 열린 동안에는 POI를 내린다 — 둘 다 주변 장소라 마커가 섞이면 읽기 어렵다.
  const poiEnabled = mode === 'search' && poiZoomVisible && !nearbyOpen
  const poiCenter = poiOnsen ? { lat: poiOnsen.lat, lng: poiOnsen.lng } : viewportCenter
  const poiScope =
    poiEnabled && poiCenter
      ? `${poiOnsen?.id ?? 'viewport'}:${poiCenter.lat}:${poiCenter.lng}`
      : undefined
  const nearbyPoiScope = nearbyOpen && selectedId !== undefined ? `nearby:${selectedId}` : undefined
  const activePoiScope = nearbyOpen ? nearbyPoiScope : poiScope
  const {
    pois,
    loading: poiLoading,
    error: poiError,
    retry: retryPois,
    requestKey: poiRequestKey,
  } = usePois(poiEnabled && poiFilter ? POI_FILTER_CATEGORY_MAP[poiFilter] : [], poiCenter)
  const poiLoadingVisible = usePoiLoadingIndicator(
    poiLoading,
    poiRequestKey,
    poiEnabled && poiFilter !== undefined,
  )
  const [selectedPoi, setSelectedPoi] = useState<{ scope: string; key: string }>()
  const visiblePois = nearbyOpen ? nearbyPois : pois
  const selectedPoiKey =
    selectedPoi?.scope === activePoiScope &&
    visiblePois.some((poi) => poiKey(poi) === selectedPoi?.key)
      ? selectedPoi?.key
      : undefined
  const selectedPoiDetail = selectedPoiKey
    ? visiblePois.find((poi) => poiKey(poi) === selectedPoiKey)
    : undefined
  const detailOpen = Boolean(selected || selectedPoiDetail)

  useEffect(() => {
    setSelectedPoi(undefined)
  }, [activePoiScope])

  const handleSelectPoi = useCallback(
    (key?: string) => {
      const opening = !selected && !selectedPoiKey && key !== undefined
      setSelectedPoi(key && activePoiScope ? { scope: activePoiScope, key } : undefined)
      if (key && opening) {
        if (detailEnterFrame.current !== undefined) {
          cancelAnimationFrame(detailEnterFrame.current)
          detailEnterFrame.current = undefined
        }
        setDetailClosing(false)
        setDetailEntered(false)
        detailEnterFrame.current = requestAnimationFrame(() => {
          detailEnterFrame.current = requestAnimationFrame(() => {
            setDetailEntered(true)
            detailEnterFrame.current = undefined
          })
        })
      }
    },
    [activePoiScope, selected, selectedPoiKey],
  )

  const handleSelectNearbyPoi = useCallback(
    (key: string) => {
      if (!nearbyPoiScope) return
      setSelectedPoi({ scope: nearbyPoiScope, key })
    },
    [nearbyPoiScope],
  )

  const handleToggleCategory = useCallback(
    (filter: PoiFilterId) => {
      if (!poiScope) return
      setSelectedPoi(undefined)
      setPoiFilter((current) => (current === filter ? undefined : filter))
    },
    [poiScope],
  )

  return (
    // 지도는 화면을 꽉 채워야 해서 RootLayout(max-w-5xl 본문) 밖에 두고 헤더만 직접 쓴다.
    <div className="flex h-dvh flex-col overflow-hidden">
      <AuthHeader />

      <div className="flex min-h-0 flex-1 flex-col lg:flex-row">
        {/* 모바일은 폭이 좁아 두 패널이 못 들어간다 — 상세가 열리면 검색을 감춘다(데스크탑은 둘 다). */}
        <aside
          className={cn(
            'border-border-default h-[45dvh] w-full min-w-0 shrink-0 flex-col border-b',
            'lg:h-auto lg:border-r lg:border-b-0',
            collapsed ? 'lg:w-0 lg:overflow-hidden lg:border-r-0' : 'lg:flex lg:w-[380px]',
            detailOpen ? 'hidden lg:flex' : 'flex',
          )}
        >
          <MapSidebarLayout mode={mode} onSearch={openSearch} onDirections={() => openDirections()}>
            <div className={cn('h-full min-h-0', mode !== 'search' && 'hidden')}>
              <MapSidebar
                key={sidebarVersion}
                onsens={onsens}
                loading={loading}
                error={error}
                selectedId={selectedId}
                onSelect={handleSelect}
                onSearch={handleSearch}
              />
            </div>
            {mode === 'directions' && <DirectionsPanel directions={directions} />}
          </MapSidebarLayout>
        </aside>

        {/* 접기 손잡이 — 패널 경계에 붙여 지도를 최대한 넓게 쓸 수 있게 한다. */}
        <div
          className={cn(
            'pointer-events-none relative z-10 hidden w-0 shrink-0',
            detailOpen ? 'lg:hidden' : 'lg:block',
          )}
        >
          <button
            type="button"
            onClick={() => setCollapsed((prev) => !prev)}
            aria-expanded={!collapsed}
            aria-label={collapsed ? '검색 패널 펼치기' : '검색 패널 접기'}
            className={cn(
              'border-border-default bg-surface text-text-secondary hover:text-text-primary',
              'pointer-events-auto absolute top-1/2 left-0 -translate-y-1/2',
              'flex h-[51px] w-[23px] items-center justify-center',
              'rounded-r-md border border-l-0 text-[11px] transition-colors outline-none',
            )}
          >
            {collapsed ? '›' : '‹'}
          </button>
        </div>

        {/* 검색 패널을 교체하지 않고 그 오른쪽에 더한다 — 지도는 남은 폭을 쓴다. */}
        {detailOpen && (
          <aside
            className={cn(
              'map-detail-panel border-border-default relative z-[110] flex min-w-0 shrink-0 flex-col border-b lg:border-r lg:border-b-0',
            )}
            onAnimationEnd={() => {
              if (!detailClosing) return
              setSelectedPoi(undefined)
              if (selected && !selectedPoiDetail) setSelectedId(undefined)
              setDetailClosing(false)
              setDetailEntered(false)
            }}
          >
            <div className="h-full min-h-0 w-full overflow-hidden">
              <div
                className={cn(
                  'map-detail-surface h-full min-h-0 w-full',
                  detailClosing
                    ? 'map-detail-surface-exit'
                    : detailEntered && 'map-detail-surface-enter',
                )}
              >
                <div className="h-full min-h-0 w-full">
                  {selectedPoiDetail ? (
                    <>
                      {selected && (
                        <div className="hidden h-full min-h-0 w-full">
                          <OnsenDetailPanel
                            onsen={selected}
                            onDirections={() => openDirections(selected)}
                            onNearbyOpenChange={setNearbyOpen}
                            selectedNearbyKey={selectedPoiKey}
                            onSelectNearby={handleSelectNearbyPoi}
                          />
                        </div>
                      )}
                      <PoiDetailPanel
                        poi={selectedPoiDetail}
                        hasOnsenBack={Boolean(selected)}
                        onBack={() => setSelectedPoi(undefined)}
                        onDirections={() => openPoiDirections(selectedPoiDetail)}
                      />
                    </>
                  ) : externalSelected ? (
                    <div className="bg-surface h-full overflow-y-auto px-4 py-6">
                      <p className="text-text-secondary text-[12px]">
                        {externalSelected.placeTypeLabel}
                      </p>
                      <div className="mt-3 flex items-center justify-between gap-2">
                        <h2 className="text-[20px] font-semibold">{externalSelected.name}</h2>
                        <FavoriteButton
                          target={{ placeId: externalSelected.placeId }}
                          name={externalSelected.name}
                        />
                      </div>
                      <p className="text-text-secondary mt-2 text-[13px] leading-6">
                        {externalSelected.address}
                      </p>
                      {externalSelected.thumbnail && (
                        <img
                          src={externalSelected.thumbnail}
                          alt=""
                          className="mt-5 aspect-video w-full rounded-sm object-cover"
                        />
                      )}
                      {externalSelected.subText && (
                        <p className="mt-4 text-[13px]">{externalSelected.subText}</p>
                      )}
                    </div>
                  ) : (
                    selected && (
                      <OnsenDetailPanel
                        onsen={selected}
                        onDirections={() => openDirections(selected)}
                        onNearbyOpenChange={setNearbyOpen}
                        selectedNearbyKey={selectedPoiKey}
                        onSelectNearby={handleSelectNearbyPoi}
                      />
                    )
                  )}
                </div>
              </div>
            </div>
            <button
              type="button"
              onClick={() => {
                if (selectedPoiDetail) {
                  if (selected) {
                    setSelectedPoi(undefined)
                    return
                  }
                  setDetailEntered(false)
                  setDetailClosing(true)
                  return
                }
                setDetailEntered(false)
                setDetailClosing(true)
              }}
              aria-label="장소 상세 닫기"
              title="장소 상세 닫기"
              className="border-border-default bg-surface text-text-secondary hover:text-text-primary absolute top-full right-3 flex h-[23px] w-[51px] items-center justify-center rounded-b-md border border-t-0 text-[11px] transition-colors outline-none focus-visible:ring-1 focus-visible:ring-inverse lg:top-1/2 lg:right-auto lg:left-full lg:h-[51px] lg:w-[23px] lg:-translate-y-1/2 lg:rounded-none lg:rounded-r-md lg:border-t lg:border-l-0"
            >
              <span aria-hidden="true" className="rotate-90 lg:rotate-0">
                ‹
              </span>
            </button>
          </aside>
        )}

        <main className="relative min-h-0 flex-1">
          <MapCanvas
            onsens={mapOnsens}
            selectedId={selectedId}
            loading={
              mode === 'search' &&
              (showingSaved ? favorites.loading : loading || (!hasFilter && nationalMap.loading))
            }
            favoriteMarkers={showingSaved}
            onNationalViewChange={setNationalView}
            onSelect={handleSelect}
            onBoundsChange={handleBoundsChange}
            onCenterChange={handleCenterChange}
            pois={visiblePois}
            selectedPoiKey={selectedPoiKey}
            onSelectPoi={handleSelectPoi}
            simplePoiLabels={nearbyOpen}
            focus={focus}
            directions={mode === 'directions' ? directions.result : undefined}
            route={mode === 'directions' ? directions.selectedRoute : undefined}
          />

          {showingSaved &&
            !favorites.loading &&
            (favorites.error || favorites.items.length === 0) && (
              <div
                role="status"
                className="bg-surface/95 absolute bottom-5 left-1/2 z-[100] -translate-x-1/2 rounded-sm px-4 py-3 text-center text-[13px]"
              >
                {favorites.error ?? '아직 찜한 장소가 없어요.'}
                {favorites.error && (
                  <button
                    type="button"
                    onClick={() => void favorites.reload()}
                    className="ml-2 underline"
                  >
                    다시 시도
                  </button>
                )}
              </div>
            )}
          {!showingSaved &&
            !hasFilter &&
            mode === 'search' &&
            !nationalMap.loading &&
            nationalMap.error && (
              <div className="bg-surface/95 absolute bottom-5 left-1/2 z-[100] max-w-[calc(100%-2rem)] -translate-x-1/2 rounded-sm px-4 py-3 text-center text-[12px]">
                <p role="alert" className="text-text-secondary">
                  지도에 장소를 표시하지 못했어요.
                </p>
                <button
                  type="button"
                  onClick={nationalMap.retry}
                  className="text-text-primary mt-2 min-h-9 underline underline-offset-4"
                >
                  다시 시도
                </button>
              </div>
            )}

          {/*
            지도 위에 띄운다 — 컨테이너는 클릭을 통과시켜 팬·줌을 막지 않는다.
            카카오맵이 타일·컨트롤에 자체 z-index를 써서, 값을 넉넉히 올려야 가려지지 않는다.
          */}
          {mode === 'search' && (
            <>
              <div className="pointer-events-none absolute inset-x-0 top-3 z-[100] flex items-start gap-3 px-3">
                <div
                  inert={!poiEnabled}
                  aria-hidden={!poiEnabled}
                  className={cn(
                    'min-w-0 flex-1 transition-[opacity,transform] duration-200 ease-out motion-reduce:transition-none',
                    poiEnabled ? 'translate-y-0 opacity-100' : 'translate-y-1 opacity-0',
                  )}
                >
                  <div className="pointer-events-auto w-fit max-w-full rounded-xl bg-white/95 p-3 shadow-[0_2px_8px_#0000000d]">
                    <p
                      role="status"
                      className="text-text-primary mb-2 h-5 truncate text-[13px] leading-5 font-semibold"
                    >
                      {poiLoadingVisible
                        ? '주변을 찾고 있어요…'
                        : poiOnsen
                          ? '온천 주변도 둘러보세요'
                          : '주변도 함께 둘러보세요'}
                    </p>
                    <PoiFilter selected={poiFilter} onToggle={handleToggleCategory} />
                  </div>
                </div>
                {(!nationalView || selectedId !== undefined || hasFilter) && (
                  <button
                    type="button"
                    onClick={handleNationalView}
                    className="border-border-default/70 bg-surface text-text-secondary pointer-events-auto mr-1 inline-flex h-8 shrink-0 items-center justify-center rounded-md border px-2.5 text-[11px] leading-4 whitespace-nowrap hover:bg-surface-dim hover:text-text-primary focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2"
                  >
                    전국 보기
                  </button>
                )}
                <MapSavedControls
                  showingSaved={showingSaved}
                  onToggleSaved={toggleSavedMap}
                  activePamphlet={activePamphlet}
                  onSelectPamphlet={handleSelectPamphlet}
                />
              </div>
              {poiEnabled &&
                poiFilter !== undefined &&
                !poiLoading &&
                !poiLoadingVisible &&
                (poiError || pois.length === 0) && (
                  <div
                    role="status"
                    className="bg-white/95 text-text-secondary absolute top-28 left-3 z-[100] max-w-[calc(100%-1.5rem)] rounded-sm px-3 py-2 text-[12px] leading-5"
                  >
                    {poiError ?? '선택한 카테고리의 주변 장소가 없어요.'}
                    {!poiLoading && poiError && (
                      <button
                        type="button"
                        onClick={retryPois}
                        className="text-text-primary ml-2 underline underline-offset-2"
                      >
                        다시 시도
                      </button>
                    )}
                  </div>
                )}
            </>
          )}
        </main>
      </div>
    </div>
  )
}
