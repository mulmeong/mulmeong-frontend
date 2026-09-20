import { useState } from 'react'

import MagazineFeedback from '@/features/magazine/components/MagazineFeedback'
import MagazineFilmstrip from '@/features/magazine/components/MagazineFilmstrip'
import MagazineIssueBanner from '@/features/magazine/components/MagazineIssueBanner'
import MagazineRegionFilter from '@/features/magazine/components/MagazineRegionFilter'
import { useMagazines } from '@/features/magazine/hooks/useMagazines'
import { MAGAZINE_CATEGORIES, regionCountsOf } from '@/types/magazine'
import { cn } from '@/lib/cn'

import type { MagazineCategory } from '@/types/magazine'

export default function MagazinePage() {
  const [category, setCategory] = useState<MagazineCategory | 'ALL'>('ALL')
  const [region, setRegion] = useState<string>()
  // 홈은 한 줄로 훑어보는 자리라 스크롤 없이도 볼 수 있는 만큼만 받는다.
  const { magazines, data, loading, error, retry } = useMagazines({
    category,
    region,
    size: 10,
  })

  return (
    // overflow는 여기 두지 않는다 — RootLayout 최상위에 있다. 여기 걸면 그 폭
    // (max-w-5xl 안쪽)이 아래 배너의 calc(50vw - 50%) 계산에 섞여 밀려 보인다.
    <div className="-mt-10 pb-16">
      <MagazineIssueBanner />

      {/* 지역은 카테고리보다 앞에 둔다 — 어느 지역 이야기인지가 먼저 좁혀진다. */}
      <div className="flex flex-wrap items-center gap-x-5 gap-y-2 pt-8">
        <MagazineRegionFilter
          value={region}
          counts={regionCountsOf(data?.regions)}
          onChange={(next) => setRegion(next || undefined)}
        />
        <nav aria-label="매거진 카테고리" className="flex flex-wrap items-center gap-x-4 gap-y-1">
          {[{ code: 'ALL', label: '전체' }, ...MAGAZINE_CATEGORIES].map((item) => (
            <button
              type="button"
              key={item.code}
              onClick={() => setCategory(item.code as MagazineCategory | 'ALL')}
              aria-pressed={category === item.code}
              className={cn(
                'py-1 text-[13px] transition-colors',
                category === item.code
                  ? 'text-text-primary font-semibold underline underline-offset-[8px]'
                  : 'text-text-secondary hover:text-text-primary',
              )}
            >
              {item.label}
            </button>
          ))}
        </nav>
      </div>

      <div className="border-border-default mt-3 border-b" />

      <div className="mt-10">
        <MagazineFeedback loading={loading} error={error} empty={!magazines.length} retry={retry} />
        {!loading && !error && magazines.length > 0 && <MagazineFilmstrip magazines={magazines} />}
      </div>
    </div>
  )
}
