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
import { REGION_PREVIEW_COUNT } from '@/features/map/constants'
import { useOnsenMapPoints } from '@/features/map/hooks/useOnsenMapPoints'
import { useOnsens } from '@/features/map/hooks/useOnsens'
import { useDirections } from '@/features/map/hooks/useDirections'
import { usePois } from '@/features/map/hooks/usePois'
import { cn } from '@/lib/cn'

import { REGION_VIEWS } from '@/types/onsen'

import type { OnsenMapPoint } from '@/features/map/types/mapPoint'
import type { MapBounds, MapView, Region } from '@/types/onsen'
import type { PoiCategory } from '@/types/poi'

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

  function openSearch() {
    invalidate()
    modeRef.current = 'search'
    setMode('search')
  }

  // 검색어·지역은 MapSidebar가 들고 있다 — 지도를 움직여도 그 조건을 잃지 않게 기억한다.
  const filtersRef = useRef<SearchFilters>({})
  const [hasFilter, setHasFilter] = useState(false)
  const [focus, setFocus] = useState<MapView>()

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
      })),
    [favorites.items],
  )
  const basePoints = showingSaved ? savedPoints : hasFilter ? onsens : nationalMap.points
  const mapOnsens = useMemo(
    () =>
      !showingSaved && linkedOnsen && !basePoints.some((place) => place.id === linkedOnsen.id)
        ? [...basePoints, linkedOnsen]
        : basePoints,
    [showingSaved, linkedOnsen, basePoints],
  )
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
    setCategories([])
    setSidebarVersion((version) => version + 1)
    void handleSearch({})
  }

  // MAP-04 카테고리 POI — 켜진 것만 지도 중심 기준으로 불러온다.
  const [categories, setCategories] = useState<PoiCategory[]>([])
  const [center, setCenter] = useState<{ lat: number; lng: number }>()
  const { pois } = usePois(mode === 'search' ? categories : [], center)

  const handleCenterChange = useCallback(
    (next: { lat: number; lng: number }) => setCenter(next),
    [],
  )

  const handleToggleCategory = useCallback((category: PoiCategory) => {
    setCategories((prev) =>
      prev.includes(category) ? prev.filter((c) => c !== category) : [...prev, category],
    )
  }, [])

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
            selected ? 'hidden lg:flex' : 'flex',
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
            selected ? 'lg:hidden' : 'lg:block',
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
        {selected && (
          <aside
            className={cn(
              'map-detail-panel border-border-default relative z-[110] flex min-w-0 shrink-0 flex-col border-b lg:border-r lg:border-b-0',
            )}
            onAnimationEnd={() => {
              if (!detailClosing) return
              setSelectedId(undefined)
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
                  {externalSelected ? (
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
                      {externalSelected.kakaoPlaceUrl &&
                        /^https?:\/\//i.test(externalSelected.kakaoPlaceUrl) && (
                          <a
                            href={externalSelected.kakaoPlaceUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="mt-5 inline-block text-[13px] underline underline-offset-4"
                          >
                            카카오맵에서 보기
                          </a>
                        )}
                    </div>
                  ) : (
                    <OnsenDetailPanel
                      onsen={selected}
                      onDirections={() => openDirections(selected)}
                    />
                  )}
                </div>
              </div>
            </div>
            <button
              type="button"
              onClick={() => {
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
            pois={pois}
            onCenterChange={handleCenterChange}
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
              <div className="pointer-events-none absolute inset-x-0 top-3 z-[100] flex items-center gap-3 px-3">
                <div className="min-w-0 flex-1">
                  <PoiFilter selected={categories} onToggle={handleToggleCategory} />
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
                <MapSavedControls showingSaved={showingSaved} onToggleSaved={toggleSavedMap} />
              </div>
            </>
          )}
        </main>
      </div>
    </div>
  )
}
