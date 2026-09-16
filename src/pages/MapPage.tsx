import { useCallback, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'

import Header from '@/components/ui/Header'
import MapCanvas from '@/features/map/components/MapCanvas'
import MapSidebar from '@/features/map/components/MapSidebar'
import OnsenDetailPanel from '@/features/map/components/OnsenDetailPanel'
import { useOnsens } from '@/features/map/hooks/useOnsens'
import { cn } from '@/lib/cn'

import { REGION_VIEWS } from '@/types/onsen'

import type { MapBounds, MapView, Onsen, Region } from '@/types/onsen'

/** 검색 결과가 하나뿐일 때 지도를 얼마나 당길지. */
const SINGLE_RESULT_LEVEL = 5

export default function MapPage() {
  const navigate = useNavigate()
  const { onsens, loading, error, load } = useOnsens()
  const [selectedId, setSelectedId] = useState<number>()

  const handleSelect = useCallback((onsen: Onsen) => setSelectedId(onsen.id), [])

  // 검색어·지역은 MapSidebar가 들고 있다 — 지도를 움직여도 그 조건을 잃지 않게 기억한다.
  const filtersRef = useRef<{ keyword?: string; region?: string }>({})
  const [hasFilter, setHasFilter] = useState(false)
  const [focus, setFocus] = useState<MapView>()

  const handleSearch = useCallback(
    async (filters: { keyword?: string; region?: string }) => {
      filtersRef.current = filters
      setHasFilter(Boolean(filters.keyword || filters.region))

      const results = await load(filters)

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
   * 조건이 없으면 영역을 보내지 않는다 — 첫 화면이 전국 뷰라
   * 그대로 보내면 전국 목록을 쏟아낸다.
   */
  const handleBoundsChange = useCallback(
    (bounds: MapBounds) => {
      if (!hasFilter) return
      void load({ ...filtersRef.current, bounds })
    },
    [load, hasFilter],
  )

  // 목록·마커가 같은 선택 상태를 쓰므로 객체는 id로 되찾는다 (사본을 따로 들지 않는다).
  const selected = onsens.find((onsen) => onsen.id === selectedId)

  /**
   * MAP-07 리스트 뷰 토글. 시안에 버튼이 없어 형태는 우리가 정했다 —
   * 패널 경계의 손잡이로 접고 편다. 모바일은 45dvh 스트립이라 접는 의미가 없어 데스크탑만.
   */
  const [collapsed, setCollapsed] = useState(false)

  return (
    // 지도는 화면을 꽉 채워야 해서 RootLayout(max-w-5xl 본문) 밖에 두고 헤더만 직접 쓴다.
    <div className="flex h-dvh flex-col overflow-hidden">
      <Header onAuthClick={() => navigate('/login')} />

      <div className="flex min-h-0 flex-1 flex-col lg:flex-row">
        {/* 모바일은 폭이 좁아 두 패널이 못 들어간다 — 상세가 열리면 검색을 감춘다(데스크탑은 둘 다). */}
        <aside
          className={cn(
            'border-border-default h-[45dvh] w-full min-w-0 shrink-0 flex-col border-b',
            'lg:h-auto lg:border-r lg:border-b-0',
            collapsed ? 'lg:w-0 lg:overflow-hidden lg:border-r-0' : 'lg:flex lg:w-[380px]',
            selected ? 'hidden' : 'flex',
          )}
        >
          <MapSidebar
            onsens={onsens}
            loading={loading}
            error={error}
            selectedId={selectedId}
            onSelect={handleSelect}
            onSearch={handleSearch}
          />
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
          <aside className="border-border-default flex h-[45dvh] w-full min-w-0 shrink-0 flex-col border-b lg:h-auto lg:w-[347px] lg:border-r lg:border-b-0">
            <OnsenDetailPanel onsen={selected} onClose={() => setSelectedId(undefined)} />
          </aside>
        )}

        <main className="min-h-0 flex-1">
          <MapCanvas
            onsens={onsens}
            selectedId={selectedId}
            onSelect={handleSelect}
            onBoundsChange={handleBoundsChange}
            focus={focus}
          />
        </main>
      </div>
    </div>
  )
}
