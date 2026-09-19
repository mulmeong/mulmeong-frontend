import { useEffect, useId, useRef, useState, type FormEvent, type KeyboardEvent } from 'react'

import Input from '@/components/ui/Input'
import PlaceListSkeleton from '@/features/map/components/PlaceListSkeleton'
import RegionPlaces from '@/features/map/components/RegionPlaces'
import SearchResultItem from '@/features/map/components/SearchResultItem'
import SearchSuggestions from '@/features/map/components/SearchSuggestions'
import SidebarMagazine from '@/features/map/components/SidebarMagazine'
import SidebarPicks from '@/features/map/components/SidebarPicks'
import { useSuggestions } from '@/features/map/hooks/useSuggestions'
import { cn } from '@/lib/cn'
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

function SectionLabel({ children }: { children: string }) {
  return <h2 className="text-text-secondary text-[11px] tracking-[0.04em]">{children}</h2>
}

function RegionChip({
  selected,
  onClick,
  children,
}: {
  selected: boolean
  onClick: () => void
  children: string
}) {
  return (
    <button
      type="button"
      aria-pressed={selected}
      onClick={onClick}
      className={cn(
        'shrink-0 rounded-full px-3 py-1.5 text-[13px] transition-colors outline-none focus-visible:ring-2 focus-visible:ring-border-strong focus-visible:ring-offset-2',
        selected
          ? 'bg-inverse text-text-inverse font-medium'
          : 'text-text-primary hover:bg-surface-dim',
      )}
    >
      {children}
    </button>
  )
}

/**
 * 사이드바는 시안(1:479/1:555)의 좌표를 그대로 따르지 않는다.
 * 팀 논의로 밀도·위계를 우선하기로 해서, divider를 걷어내고 여백으로 섹션을 나눈다.
 * 검색 → 지역 필터 → 장소 카드 → 추천 순으로 읽히게 하는 것이 기준이다.
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
  const [exploreAll, setExploreAll] = useState(false)

  /** 검색어가 있으면 검색 결과 화면으로 바뀐다 — 지역·추천은 숨는다. */
  const [searchedKeyword, setSearchedKeyword] = useState('')
  const isSearching = Boolean(searchedKeyword)
  const contentRef = useRef<HTMLDivElement>(null)
  const [scrolled, setScrolled] = useState(false)

  useEffect(() => {
    // 새 목록은 제목부터 보여주고 이전 목록의 중간 스크롤 위치를 가져오지 않는다.
    if (contentRef.current) contentRef.current.scrollTop = 0
    setScrolled(false)
  }, [region, searchedKeyword, exploreAll])

  /** 자동완성 (MAP-05) — 입력창에 포커스가 있고 아직 제출하지 않았을 때만 연다. */
  const [focused, setFocused] = useState(false)
  const [activeIndex, setActiveIndex] = useState(-1)
  const { suggestions, clear } = useSuggestions(keyword, focused)
  const listboxId = useId()
  const optionId = (index: number) => `${listboxId}-${index}`
  const isOpen = focused && suggestions.length > 0

  function runSearch(next: string, nextRegion = region) {
    setSearchedKeyword(next)
    setExploreAll(false)
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
    if (region === next) return
    setRegion(next)
    setExploreAll(false)
    onSearch({ region: next })
  }

  /** 입력 중인 검색어는 제출 전까지 지역 탐색에 적용하지 않는다. */
  function handleResetRegion() {
    if (!region) return
    setRegion(undefined)
    setExploreAll(false)
    onSearch({})
  }

  function handleReset() {
    setKeyword('')
    setRegion(undefined)
    setExploreAll(false)
    setSearchedKeyword('')
    setFocused(false)
    setActiveIndex(-1)
    clear()
    onSearch({})
  }

  return (
    <div className="bg-surface box-border flex h-full w-full min-h-0 min-w-0 max-w-full flex-col overflow-hidden pb-3">
      <div className="relative z-20 w-full min-w-0 shrink-0 bg-white px-5 pb-5">
          <form onSubmit={handleSubmit} className="relative">
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

          {!isSearching && (
            <section className="pt-4">
              <SectionLabel>지역으로 둘러보기</SectionLabel>
              <div
                role="group"
                aria-label="지역 선택"
                className="mt-2 flex flex-wrap gap-x-1.5 gap-y-1.5"
              >
                <RegionChip selected={!region} onClick={handleResetRegion}>
                  전체
                </RegionChip>
                {REGIONS.map((item) => (
                  <RegionChip
                    key={item}
                    selected={region === item}
                    onClick={() => handleRegion(item)}
                  >
                    {item}
                  </RegionChip>
                ))}
              </div>
            </section>
          )}
        <span aria-hidden="true" className={cn(
          'pointer-events-none absolute inset-x-0 top-full h-3 bg-linear-to-b from-white to-transparent transition-opacity duration-150 motion-reduce:transition-none',
          scrolled ? 'opacity-100' : 'opacity-0',
        )} />
      </div>

      <div
        ref={contentRef}
        onScroll={(event) => setScrolled(event.currentTarget.scrollTop > 1)}
        className="scrollbar-thin min-h-0 w-full min-w-0 flex-1 overflow-x-hidden overflow-y-auto overscroll-contain pt-3"
      >
        <div className="box-border flex w-full min-w-0 flex-col px-5 pb-3 [&>*]:min-w-0 [&>*]:shrink-0">
          {isSearching && (
            <section>
              <div className="flex items-baseline justify-between gap-3">
                <h2 className="text-text-primary min-w-0 truncate text-[15px] font-semibold">
                  “{searchedKeyword}” 검색 결과
                </h2>
                <div className="flex shrink-0 items-baseline gap-2.5">
                  {/* 0은 바로 아래 '검색 결과가 없어요'와 겹쳐 굳이 띄우지 않는다. */}
                  {!loading && !error && onsens.length > 0 && (
                    <span className="text-text-secondary text-[12px]">{onsens.length}</span>
                  )}
                  {/* 검색 조건과 장소 선택을 풀고 처음 지도 범위로 돌아간다. */}
                  <button
                    type="button"
                    onClick={handleReset}
                    title="검색 조건을 지우고 처음 지도 화면으로 돌아가기"
                    className="text-text-secondary hover:text-text-primary text-[11px] transition-colors outline-none focus-visible:underline focus-visible:underline-offset-2"
                  >
                    전체 지도 보기
                  </button>
                </div>
              </div>

              {loading && <PlaceListSkeleton />}

              {error && (
                <p role="alert" className="text-danger mt-3 text-[13px]">
                  {error}
                </p>
              )}

              {/* 헤더에서 전체 지도로 돌아갈 수 있으므로 안내 문구만 보여준다. */}
              {!loading && !error && onsens.length === 0 && (
                <p className="text-text-secondary mt-3 text-[12px] leading-[1.6]">
                  검색 결과가 없어요. 다른 지역이나 검색어로 찾아보세요.
                </p>
              )}

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
              <section>
                <RegionPlaces
                  key={region ?? 'all'}
                  region={region}
                  onsens={onsens}
                  loading={loading}
                  error={error}
                  selectedId={selectedId}
                  expanded={exploreAll}
                  onExpandedChange={setExploreAll}
                  onSelect={onSelect}
                  onRetry={() => onSearch({ region })}
                  onReset={handleReset}
                />
              </section>

              {/* 첫 화면에만 둔다 — 지역을 고르면 그 지역 매거진이 이 자리를 대신한다. */}
              {!region && !exploreAll && (
                <>
                  <div aria-hidden className="h-10 shrink-0" />
                  <SidebarPicks />
                </>
              )}
            </>
          )}
        </div>

        {/* 추천 콘텐츠도 장소 목록과 같은 영역에서 스크롤한다. */}
        {!isSearching && region && !exploreAll && <SidebarMagazine region={region} />}
      </div>
    </div>
  )
}
