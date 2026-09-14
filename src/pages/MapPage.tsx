import { useCallback, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'

import Header from '@/components/ui/Header'
import MapCanvas from '@/features/map/components/MapCanvas'
import MapSidebar from '@/features/map/components/MapSidebar'
import OnsenDetailPanel from '@/features/map/components/OnsenDetailPanel'
import { useOnsens } from '@/features/map/hooks/useOnsens'
import { cn } from '@/lib/cn'

import { REGION_VIEWS } from '@/types/onsen'

import type { MapBounds, Onsen, Region } from '@/types/onsen'

export default function MapPage() {
  const navigate = useNavigate()
  const { onsens, loading, error, load } = useOnsens()
  const [selectedId, setSelectedId] = useState<number>()

  const handleSelect = useCallback((onsen: Onsen) => setSelectedId(onsen.id), [])

  // 검색어·지역은 MapSidebar가 들고 있다 — 지도를 움직여도 그 조건을 잃지 않게 기억한다.
  const filtersRef = useRef<{ keyword?: string; region?: string }>({})
  const [hasFilter, setHasFilter] = useState(false)
  const [focus, setFocus] = useState<{ lat: number; lng: number; level: number }>()

  const handleSearch = useCallback(
    (filters: { keyword?: string; region?: string }) => {
      filtersRef.current = filters
      setHasFilter(Boolean(filters.keyword || filters.region))
      // 지역을 고르면 그쪽으로 지도를 옮긴다. 검색어만 있으면 보던 화면을 유지한다.
      if (filters.region) setFocus(REGION_VIEWS[filters.region as Region])
      void load(filters)
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

  return (
    // 지도는 화면을 꽉 채워야 해서 RootLayout(max-w-5xl 본문) 밖에 두고 헤더만 직접 쓴다.
    <div className="flex h-dvh flex-col overflow-hidden">
      <Header onAuthClick={() => navigate('/login')} />

      <div className="flex min-h-0 flex-1 flex-col lg:flex-row">
        {/* 모바일은 폭이 좁아 두 패널이 못 들어간다 — 상세가 열리면 검색을 감춘다(데스크탑은 둘 다). */}
        <aside
          className={cn(
            'border-border-default h-[45dvh] w-full min-w-0 shrink-0 flex-col border-b',
            'lg:flex lg:h-auto lg:w-[380px] lg:border-r lg:border-b-0',
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
