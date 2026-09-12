import { useState, type FormEvent } from 'react'

import OnsenCard from '@/components/OnsenCard'
import Input from '@/components/ui/Input'
import Tab from '@/components/ui/Tab'
import { cn } from '@/lib/cn'
import { REGIONS } from '@/types/onsen'

import type { OnsenListItem } from '@/features/map/api/map'
import type { Onsen } from '@/types/onsen'

type MapSidebarProps = {
  onsens: OnsenListItem[]
  loading: boolean
  error?: string
  selectedId?: number
  onSelect: (onsen: Onsen) => void
  onSearch: (filters: { keyword?: string; region?: string }) => void
}

/** 시안의 '지금 이런 곳은 어때요' 추천 묶음. 실제 링크는 매거진 연동 후 채운다. */
const SUGGESTIONS = [
  '비 오는 날 가기 좋은 온천',
  '서울에서 2시간 안쪽',
  '노천탕이 있는 곳',
  '조용히 혼자 쉬기 좋은 곳',
]

function SectionHeading({ children }: { children: string }) {
  return <h2 className="text-text-secondary text-[12px] tracking-[0.02em]">{children}</h2>
}

export default function MapSidebar({
  onsens,
  loading,
  error,
  selectedId,
  onSelect,
  onSearch,
}: MapSidebarProps) {
  const [keyword, setKeyword] = useState('')
  const [region, setRegion] = useState<string>()

  function handleSubmit(event: FormEvent) {
    event.preventDefault()
    onSearch({ keyword: keyword.trim() || undefined, region })
  }

  function handleRegion(next: string) {
    const value = region === next ? undefined : next
    setRegion(value)
    onSearch({ keyword: keyword.trim() || undefined, region: value })
  }

  return (
    <div className="bg-surface flex h-full min-w-0 flex-col overflow-x-hidden overflow-y-auto px-4 pb-8 sm:px-[15px]">
      {/* 길찾기는 ① 범위 밖이라 자리만 둔다. */}
      <div role="tablist" className="flex gap-5 pt-5">
        <Tab selected>장소 검색</Tab>
        <Tab disabled className="cursor-not-allowed">
          길찾기
        </Tab>
      </div>

      <form onSubmit={handleSubmit} className="pt-4">
        <Input
          variant="search"
          placeholder="온천·사우나 검색"
          value={keyword}
          onChange={(e) => setKeyword(e.target.value)}
          aria-label="온천·사우나 검색"
        />
      </form>

      <section className="pt-6">
        <SectionHeading>지역으로 둘러보기</SectionHeading>
        <div className="mt-2.5 grid grid-cols-4 gap-x-0 gap-y-2.5">
          {REGIONS.map((item) => (
            <button
              key={item}
              type="button"
              aria-pressed={region === item}
              onClick={() => handleRegion(item)}
              className={cn(
                'py-1 text-left text-[14px] outline-none',
                'focus-visible:underline focus-visible:underline-offset-2',
                region === item ? 'text-text-primary font-bold' : 'text-text-primary font-normal',
              )}
            >
              {item}
            </button>
          ))}
        </div>
      </section>

      <hr className="border-border-default mt-5 border-t-0 border-b" />

      <section className="pt-5">
        <SectionHeading>지금 이런 곳은 어때요</SectionHeading>
        <ul className="mt-2.5 grid grid-cols-2 gap-2.5">
          {SUGGESTIONS.map((label) => (
            <li key={label} className="min-w-0">
              <div className="bg-surface-dim aspect-[155/72] w-full rounded-sm" />
              <p className="text-text-primary mt-1.5 text-[12.5px] leading-[1.35]">{label}</p>
            </li>
          ))}
        </ul>
        <div className="mt-3 flex justify-end">
          <button
            type="button"
            className="text-text-secondary text-[12px] outline-none focus-visible:underline focus-visible:underline-offset-2"
          >
            → 전체보기
          </button>
        </div>
      </section>

      <hr className="border-border-default mt-4 border-t-0 border-b" />

      <section className="pt-5">
        <SectionHeading>현재 지도에서</SectionHeading>

        {loading && <p className="text-text-secondary mt-2.5 text-[13px]">불러오는 중…</p>}

        {error && (
          <p role="alert" className="text-danger mt-2.5 text-[13px]">
            {error}
          </p>
        )}

        {!loading && !error && onsens.length === 0 && (
          <p className="text-text-secondary mx-auto mt-2.5 max-w-[194px] text-center text-[13px] leading-[1.6]">
            검색 결과가 없어요. 다른 지역이나 검색어로 찾아보세요.
          </p>
        )}

        {!loading && !error && onsens.length > 0 && (
          <ul className="mt-2 flex flex-col gap-2">
            {onsens.map((onsen) => (
              <li key={onsen.id} className="border-border-default border-b last:border-b-0">
                <OnsenCard
                  onsen={onsen}
                  distanceKm={onsen.distanceKm}
                  selected={onsen.id === selectedId}
                  onClick={() => onSelect(onsen)}
                />
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  )
}
