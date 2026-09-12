import { useCallback, useState } from 'react'
import { useNavigate } from 'react-router-dom'

import Header from '@/components/ui/Header'
import MapCanvas from '@/features/map/components/MapCanvas'
import MapSidebar from '@/features/map/components/MapSidebar'
import { useOnsens } from '@/features/map/hooks/useOnsens'

import type { Onsen } from '@/types/onsen'

export default function MapPage() {
  const navigate = useNavigate()
  const { onsens, loading, error, load } = useOnsens()
  const [selectedId, setSelectedId] = useState<number>()

  const handleSelect = useCallback((onsen: Onsen) => setSelectedId(onsen.id), [])

  return (
    // 지도는 화면을 꽉 채워야 해서 RootLayout(max-w-5xl 본문) 밖에 두고 헤더만 직접 쓴다.
    <div className="flex h-dvh flex-col overflow-hidden">
      <Header onAuthClick={() => navigate('/login')} />

      <div className="flex min-h-0 flex-1 flex-col lg:flex-row">
        <aside className="border-border-default flex h-[45dvh] w-full min-w-0 shrink-0 flex-col border-b lg:h-auto lg:w-[360px] lg:border-r lg:border-b-0">
          <MapSidebar
            onsens={onsens}
            loading={loading}
            error={error}
            selectedId={selectedId}
            onSelect={handleSelect}
            onSearch={load}
          />
        </aside>

        <main className="min-h-0 flex-1">
          <MapCanvas onsens={onsens} selectedId={selectedId} onSelect={handleSelect} />
        </main>
      </div>
    </div>
  )
}
