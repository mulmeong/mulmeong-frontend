import { useId, useState, type FormEvent, type KeyboardEvent } from 'react'

import Input from '@/components/ui/Input'
import Tab from '@/components/ui/Tab'
import SearchResultItem from '@/features/map/components/SearchResultItem'
import SearchSuggestions from '@/features/map/components/SearchSuggestions'
import SidebarMagazine from '@/features/map/components/SidebarMagazine'
import { useSuggestions } from '@/features/map/hooks/useSuggestions'
import { cn } from '@/lib/cn'
import { env } from '@/lib/env'
import { REGIONS } from '@/types/onsen'

import type { OnsenListItem, Suggestion } from '@/features/map/api/map'
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

const MOCK_SUGGESTION_IMAGES = [
  '/images/panel05.jpg',
  '/images/panel03.jpg',
  '/images/panel01.jpg',
  '/images/hero.jpg',
]

/**
 * 결과 없음 안내. 가운데 정렬로 좁게 두면 줄마다 길이가 달라져 역삼각형으로 보인다 —
 * 왼쪽 정렬로 폭을 채우고 버튼은 한 줄에 붙인다.
 */
function EmptyResult({ onReset }: { onReset: () => void }) {
  return (
    <div className="mt-3">
      <p className="text-text-secondary text-[12px] leading-[1.6]">
        검색 결과가 없어요. 다른 지역이나 검색어로 찾아보세요.
      </p>
      <button
        type="button"
        onClick={onReset}
        className="text-text-primary mt-2 text-[11px] underline underline-offset-2 outline-none"
      >
        조건 초기화
      </button>
    </div>
  )
}

function SectionLabel({ children }: { children: string }) {
  return <h2 className="text-text-secondary text-[11px] tracking-[0.04em]">{children}</h2>
}

function formatDistance(km: number) {
  return km < 1 ? `${Math.round(km * 1000)}m` : `${km.toFixed(1)}km`
}

/**
 * 사이드바는 시안(1:479/1:555)의 좌표를 그대로 따르지 않는다.
 * 팀 논의로 밀도·위계를 우선하기로 해서, divider를 걷어내고 여백으로 섹션을 나눈다.
 * 검색 → 지역 → 추천 → 현재 지도에서 순으로 읽히게 하는 것이 기준이다.
 */
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

  /** 아무 조건도 없으면 '현재 지도에서'를 감춘다 — 전국 뷰라 목록이 의미 없다. */
  const hasFilter = Boolean(keyword.trim() || region)

  /** 검색어가 있으면 검색 결과 화면으로 바뀐다 — 지역·추천은 숨는다. */
  const [searchedKeyword, setSearchedKeyword] = useState('')
  const isSearching = Boolean(searchedKeyword)

  /** 자동완성 (MAP-05) — 입력창에 포커스가 있고 아직 제출하지 않았을 때만 연다. */
  const [focused, setFocused] = useState(false)
  const [activeIndex, setActiveIndex] = useState(-1)
  const { suggestions, clear } = useSuggestions(keyword, focused)
  const listboxId = useId()
  const optionId = (index: number) => `${listboxId}-${index}`
  const isOpen = focused && suggestions.length > 0

  function runSearch(next: string, nextRegion = region) {
    setSearchedKeyword(next)
    clear()
    setActiveIndex(-1)
    onSearch({ keyword: next || undefined, region: nextRegion })
  }

  function handleSubmit(event: FormEvent) {
    event.preventDefault()
    if (isOpen && activeIndex >= 0) {
      handlePick(suggestions[activeIndex])
      return
    }
    runSearch(keyword.trim())
  }

  function handlePick(suggestion: Suggestion) {
    if (suggestion.type === 'region') {
      setKeyword('')
      setRegion(suggestion.value)
      runSearch('', suggestion.value)
      return
    }
    // 온천 제안은 이름으로 검색해 결과에 담는다 — 지도 이동은 기존 검색 경로가 처리한다.
    setKeyword(suggestion.name)
    runSearch(suggestion.name)
  }

  function handleKeyDown(event: KeyboardEvent<HTMLInputElement>) {
    if (event.key === 'Escape') {
      clear()
      setActiveIndex(-1)
      return
    }
    if (!isOpen) return

    if (event.key === 'ArrowDown') {
      event.preventDefault()
      setActiveIndex((prev) => (prev + 1) % suggestions.length)
    } else if (event.key === 'ArrowUp') {
      event.preventDefault()
      setActiveIndex((prev) => (prev <= 0 ? suggestions.length - 1 : prev - 1))
    }
  }

  function handleRegion(next: string) {
    const value = region === next ? undefined : next
    setRegion(value)
    onSearch({ keyword: keyword.trim() || undefined, region: value })
  }

  /** '전체'는 지역만 푼다 — 검색어는 건드리지 않는다. */
  function handleResetRegion() {
    if (!region) return
    setRegion(undefined)
    onSearch({ keyword: keyword.trim() || undefined })
  }

  function handleReset() {
    setKeyword('')
    setRegion(undefined)
    setSearchedKeyword('')
    onSearch({})
  }

  return (
    <div className="bg-surface flex h-full min-h-0 min-w-0 flex-col overflow-hidden">
      {/* flex-col이라야 내용이 짧을 때 매거진을 mt-auto로 바닥에 붙일 수 있다. */}
      <div className="scrollbar-thin flex min-h-0 flex-1 flex-col overflow-x-hidden overflow-y-auto overscroll-contain px-5 pb-6">
        <div role="tablist" className="flex gap-5 pt-6">
          <Tab selected>장소 검색</Tab>
          {/* 길찾기(MAP-08)는 ① 범위다 — 모드 전환·경로 API가 아직 없어 비활성일 뿐이다. */}
          <Tab disabled className="cursor-not-allowed">
            길찾기
          </Tab>
        </div>

        <form onSubmit={handleSubmit} className="relative pt-3">
          <Input
            variant="search"
            placeholder="온천·사우나 검색"
            value={keyword}
            onChange={(e) => {
              setKeyword(e.target.value)
              setActiveIndex(-1)
            }}
            onFocus={() => setFocused(true)}
            onBlur={() => setFocused(false)}
            onKeyDown={handleKeyDown}
            aria-label="온천·사우나 검색"
            role="combobox"
            aria-expanded={isOpen}
            aria-controls={isOpen ? listboxId : undefined}
            aria-activedescendant={activeIndex >= 0 ? optionId(activeIndex) : undefined}
            aria-autocomplete="list"
          />
          {isOpen && (
            <SearchSuggestions
              suggestions={suggestions}
              activeIndex={activeIndex}
              listboxId={listboxId}
              optionId={optionId}
              onPick={handlePick}
              keyword={keyword.trim()}
            />
          )}
        </form>

        {isSearching && (
          <section className="pt-8">
            <div className="flex items-baseline justify-between gap-3">
              <h2 className="text-text-primary min-w-0 truncate text-[15px] font-semibold">
                “{searchedKeyword}” 검색 결과
              </h2>
              {/* 0은 바로 아래 '검색 결과가 없어요'와 겹쳐 굳이 띄우지 않는다. */}
              {!loading && !error && onsens.length > 0 && (
                <span className="text-text-secondary shrink-0 text-[12px]">{onsens.length}</span>
              )}
            </div>

            {loading && <p className="text-text-secondary mt-3 text-[13px]">불러오는 중…</p>}

            {error && (
              <p role="alert" className="text-danger mt-3 text-[13px]">
                {error}
              </p>
            )}

            {!loading && !error && onsens.length === 0 && <EmptyResult onReset={handleReset} />}

            {!loading && !error && onsens.length > 0 && (
              <ul className="mt-2 flex flex-col">
                {onsens.map((onsen) => (
                  <li key={onsen.id}>
                    <SearchResultItem
                      onsen={onsen}
                      selected={onsen.id === selectedId}
                      onClick={() => onSelect(onsen)}
                    />
                  </li>
                ))}
              </ul>
            )}
          </section>
        )}

        {!isSearching && (
          <>
            <section className="pt-8">
              <SectionLabel>지역으로 둘러보기</SectionLabel>
              <div className="mt-3 flex flex-wrap gap-x-1.5 gap-y-2">
                {/* 지역을 고른 뒤 전국으로 돌아올 길 — 칩을 다시 누르는 건 알아채기 어렵다. */}
                <button
                  type="button"
                  aria-pressed={!region}
                  onClick={handleResetRegion}
                  className={cn(
                    'rounded-full px-3 py-1.5 text-[13px] transition-colors outline-none',
                    !region
                      ? 'bg-inverse text-text-inverse font-medium'
                      : 'text-text-primary hover:bg-surface-dim',
                  )}
                >
                  전체
                </button>

                {REGIONS.map((item) => (
                  <button
                    key={item}
                    type="button"
                    aria-pressed={region === item}
                    onClick={() => handleRegion(item)}
                    className={cn(
                      'rounded-full px-3 py-1.5 text-[13px] transition-colors outline-none',
                      region === item
                        ? 'bg-inverse text-text-inverse font-medium'
                        : 'text-text-primary hover:bg-surface-dim',
                    )}
                  >
                    {item}
                  </button>
                ))}
              </div>
            </section>

            {/* 첫 화면에만 둔다 — 지역을 고르면 그 지역 매거진이 이 자리를 대신한다. */}
            {!region && (
              <section className="pt-8">
                <div className="flex items-baseline justify-between gap-3">
                  <SectionLabel>지금 이런 곳은 어때요</SectionLabel>
                  <button
                    type="button"
                    className="text-text-secondary shrink-0 text-[11px] outline-none hover:underline"
                  >
                    전체보기
                  </button>
                </div>

                {/* 가로 스크롤 — 추천이 세로 공간을 먹어 목록을 밀어내지 않게 한다. */}
                <ul className="scrollbar-thin mt-3 flex snap-x gap-2.5 overflow-x-auto pb-1">
                  {SUGGESTIONS.map((label, index) => (
                    <li key={label} className="w-[132px] shrink-0 snap-start">
                      {env.useMock ? (
                        <img
                          src={MOCK_SUGGESTION_IMAGES[index]}
                          alt=""
                          loading="lazy"
                          className="bg-surface-dim aspect-[132/74] w-full rounded-sm object-cover"
                        />
                      ) : (
                        <div className="bg-surface-dim aspect-[132/74] w-full rounded-sm" />
                      )}
                      <p className="text-text-primary mt-1.5 truncate text-[12px]">{label}</p>
                    </li>
                  ))}
                </ul>
              </section>
            )}
          </>
        )}

        {!isSearching && hasFilter && (
          <section className="pt-8">
            <SectionLabel>현재 지도에서</SectionLabel>

            {loading && <p className="text-text-secondary mt-3 text-[13px]">불러오는 중…</p>}

            {error && (
              <p role="alert" className="text-danger mt-3 text-[13px]">
                {error}
              </p>
            )}

            {!loading && !error && onsens.length === 0 && <EmptyResult onReset={handleReset} />}

            {!loading && !error && onsens.length > 0 && (
              <ul className="mt-2 flex flex-col">
                {onsens.map((onsen) => (
                  <li key={onsen.id}>
                    <button
                      type="button"
                      onClick={() => onSelect(onsen)}
                      aria-current={onsen.id === selectedId || undefined}
                      className={cn(
                        '-mx-2 flex w-[calc(100%+1rem)] items-baseline justify-between gap-3 rounded-sm px-2 py-2.5 text-left',
                        'transition-colors outline-none focus-visible:underline focus-visible:underline-offset-2',
                        onsen.id === selectedId ? 'bg-surface-dim' : 'hover:bg-surface-dim',
                      )}
                    >
                      <span
                        className={cn(
                          'text-text-primary min-w-0 truncate text-[14px]',
                          onsen.id === selectedId ? 'font-semibold' : 'font-medium',
                        )}
                      >
                        {onsen.name}
                      </span>
                      {onsen.distanceKm !== undefined && (
                        <span className="text-text-secondary shrink-0 text-[12px]">
                          {formatDistance(onsen.distanceKm)}
                        </span>
                      )}
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </section>
        )}

        {/* 목록과 매거진 사이 최소 간격. mt-auto와 겹치지 않게 빈 칸으로 벌린다. */}
        {/* 첫 화면은 '지금 이런 곳은 어때요'가 맡는다 — 매거진은 지역을 고른 뒤에 나온다. */}
        {region && (
          <>
            <div aria-hidden className="h-8 shrink-0" />
            <SidebarMagazine region={region} />
          </>
        )}
      </div>
    </div>
  )
}
