import { useEffect, useId, useRef, useState } from 'react'

import PlaceListSkeleton from '@/features/map/components/PlaceListSkeleton'
import RegionPlaceCard, { RegionPlaceCardSkeleton } from '@/features/map/components/RegionPlaceCard'
import SearchResultItem from '@/features/map/components/SearchResultItem'
import { REGION_PREVIEW_COUNT } from '@/features/map/constants'
import { useSidebarCarousel } from '@/features/map/hooks/useSidebarCarousel'
import { SIDEBAR_CARD_TRACK } from './sidebarCardStyles'

import type { OnsenListItem } from '@/features/map/api/map'
import type { Onsen } from '@/types/onsen'

const PAGE_SIZE = 6
const TEXT_ACTION =
  'text-text-secondary hover:text-text-primary inline-flex min-h-9 shrink-0 items-center gap-1 text-[11px] transition-colors outline-none focus-visible:underline focus-visible:underline-offset-4'
const ARROW_ACTION =
  'text-text-secondary hover:text-text-primary hover:bg-surface-dim flex size-9 items-center justify-center rounded-full transition-colors outline-none focus-visible:ring-2 focus-visible:ring-border-strong disabled:pointer-events-none disabled:opacity-30'

type RegionPlacesProps = {
  onsens: OnsenListItem[]
  region?: string
  loading: boolean
  error?: string
  selectedId?: number
  expanded: boolean
  onExpandedChange: (expanded: boolean) => void
  onSelect: (onsen: Onsen) => void
  onRetry: () => void
  onReset: () => void
}

function Chevron({ backwards = false }: { backwards?: boolean }) {
  return (
    <svg aria-hidden="true" viewBox="0 0 16 16" fill="none" className="size-3.5">
      <path
        d={backwards ? 'M10 3 5 8l5 5' : 'm6 3 5 5-5 5'}
        stroke="currentColor"
        strokeWidth="1.3"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}

function PlaceCarousel({
  onsens,
  region,
  selectedId,
  onSelect,
  loading,
}: Pick<RegionPlacesProps, 'onsens' | 'region' | 'selectedId' | 'onSelect' | 'loading'>) {
  const { trackRef, scroll, move } = useSidebarCarousel(onsens.length, loading)
  const trackId = useId()
  const hasOverflow = scroll.previous || scroll.next

  return (
    <>
      {loading && (
        <span role="status" className="sr-only">
          장소를 불러오는 중…
        </span>
      )}
      <ul
        id={trackId}
        ref={trackRef}
        aria-label="장소 미리보기"
        aria-hidden={loading || undefined}
        tabIndex={!loading && hasOverflow ? 0 : undefined}
        onKeyDown={(event) => {
          if (loading || (event.key !== 'ArrowLeft' && event.key !== 'ArrowRight')) return
          event.preventDefault()
          move(event.key === 'ArrowLeft' ? -1 : 1)
        }}
        className={SIDEBAR_CARD_TRACK}
      >
        {loading
          ? Array.from({ length: REGION_PREVIEW_COUNT }, (_, index) => (
              <li key={index} className="min-w-0 snap-start">
                <RegionPlaceCardSkeleton />
              </li>
            ))
          : onsens.map((onsen) => (
              <li key={onsen.id} className="min-w-0 snap-start">
                <RegionPlaceCard
                  onsen={onsen}
                  region={region}
                  selected={onsen.id === selectedId}
                  onClick={() => onSelect(onsen)}
                />
              </li>
            ))}
      </ul>
      <div className="mt-2 flex h-9 w-full items-center justify-end">
        {!loading && hasOverflow && (
          <div role="group" aria-label="장소 카드 이동" className="flex gap-1">
            <button
              type="button"
              aria-label="이전 장소"
              aria-controls={trackId}
              disabled={!scroll.previous}
              onClick={() => move(-1)}
              className={ARROW_ACTION}
            >
              <Chevron backwards />
            </button>
            <button
              type="button"
              aria-label="다음 장소"
              aria-controls={trackId}
              disabled={!scroll.next}
              onClick={() => move(1)}
              className={ARROW_ACTION}
            >
              <Chevron />
            </button>
          </div>
        )}
      </div>
    </>
  )
}

export default function RegionPlaces({
  onsens,
  region,
  loading,
  error,
  selectedId,
  expanded,
  onExpandedChange,
  onSelect,
  onRetry,
  onReset,
}: RegionPlacesProps) {
  const [page, setPage] = useState(0)
  const headingId = useId()
  const listId = useId()
  const headingRef = useRef<HTMLHeadingElement>(null)
  const focusPending = useRef(false)
  const pageCount = Math.max(1, Math.ceil(onsens.length / PAGE_SIZE))
  const currentPage = Math.min(page, pageCount - 1)
  const start = currentPage * PAGE_SIZE
  const ready = !loading && !error
  // 부분 응답으로 전국 총개수·총페이지를 만들지 않는다.
  const showingAll = Boolean(region) && expanded

  useEffect(() => {
    if (!focusPending.current) return
    headingRef.current?.focus()
    focusPending.current = false
  }, [expanded, page])

  function toggleExpanded() {
    focusPending.current = true
    setPage(0)
    onExpandedChange(!expanded)
  }

  function changePage(next: number) {
    focusPending.current = true
    setPage(next)
  }

  return (
    <section aria-labelledby={headingId} aria-busy={loading} className="w-full min-w-0">
      <div className="flex min-h-9 items-center justify-between gap-3">
        <h3
          id={headingId}
          ref={headingRef}
          tabIndex={-1}
          className="text-text-primary min-w-0 text-[13px] font-medium outline-none"
        >
          {region ? `${region}에서 둘러보기` : '먼저 둘러보기'}
        </h3>
        {region && (loading || showingAll || (ready && onsens.length > 0)) && (
          <button
            type="button"
            onClick={toggleExpanded}
            disabled={loading}
            aria-expanded={showingAll}
            aria-controls={listId}
            className={`${TEXT_ACTION} disabled:pointer-events-none disabled:opacity-40`}
          >
            {showingAll && <Chevron backwards />}
            {showingAll ? '미리보기' : '전체보기'}
            {!showingAll && <Chevron />}
          </button>
        )}
      </div>

      {!region && (
        <p className="text-text-secondary mt-1 text-[11px] leading-relaxed">
          지역을 선택하면 더 많은 장소를 볼 수 있어요.
        </p>
      )}

      <div id={listId}>
        {loading && showingAll && (
          <>
            <div aria-hidden="true" className="mt-1 flex h-[16.5px] items-center">
              <div className="bg-border-default/35 h-2 w-28 rounded-full motion-safe:animate-pulse" />
            </div>
            <PlaceListSkeleton count={onsens.slice(start, start + PAGE_SIZE).length || PAGE_SIZE} />
            {pageCount > 1 && <div aria-hidden="true" className="mt-4 h-9" />}
          </>
        )}
        {!loading && error && (
          <div className="py-3">
            <p role="alert" className="text-danger text-[12px]">
              {error}
            </p>
            <button type="button" onClick={onRetry} className={TEXT_ACTION}>
              다시 시도
            </button>
          </div>
        )}
        {ready && onsens.length === 0 && (
          <div role="status" className="py-3">
            <p className="text-text-secondary text-[12px] leading-relaxed">
              {region
                ? '아직 등록된 장소가 없어요. 다른 지역을 둘러보세요.'
                : '미리 볼 장소가 없어요. 지역을 선택해 둘러보세요.'}
            </p>
            {region && (
              <button type="button" onClick={onReset} className={TEXT_ACTION}>
                전체 지역 둘러보기
              </button>
            )}
          </div>
        )}
        {ready && onsens.length > 0 && showingAll && (
          <>
            <p role="status" className="text-text-secondary mt-1 text-[11px]">
              온천·사우나 {onsens.length}곳
              {pageCount > 1 && ` · ${start + 1}–${Math.min(start + PAGE_SIZE, onsens.length)}번째`}
            </p>
            <ul aria-label="전체 장소" className="mt-2 flex flex-col">
              {onsens.slice(start, start + PAGE_SIZE).map((onsen) => (
                <li key={onsen.id}>
                  <SearchResultItem
                    onsen={onsen}
                    selected={onsen.id === selectedId}
                    onClick={() => onSelect(onsen)}
                  />
                </li>
              ))}
            </ul>
            {pageCount > 1 && (
              <nav aria-label="장소 목록 페이지" className="mt-4 flex items-center justify-between">
                <button
                  type="button"
                  disabled={currentPage === 0}
                  onClick={() => changePage(currentPage - 1)}
                  className={`${TEXT_ACTION} disabled:pointer-events-none disabled:opacity-30`}
                >
                  <Chevron backwards /> 이전
                </button>
                <span className="text-text-secondary text-[11px] tabular-nums">
                  <span className="text-text-primary">{currentPage + 1}</span> / {pageCount}
                </span>
                <button
                  type="button"
                  disabled={currentPage === pageCount - 1}
                  onClick={() => changePage(currentPage + 1)}
                  className={`${TEXT_ACTION} disabled:pointer-events-none disabled:opacity-30`}
                >
                  다음 <Chevron />
                </button>
              </nav>
            )}
          </>
        )}
        {!showingAll && (loading || (ready && onsens.length > 0)) && (
          <PlaceCarousel
            onsens={onsens.slice(0, REGION_PREVIEW_COUNT)}
            region={region}
            selectedId={selectedId}
            onSelect={onSelect}
            loading={loading}
          />
        )}
      </div>
    </section>
  )
}
