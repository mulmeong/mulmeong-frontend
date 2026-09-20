import { useState } from 'react'
import { useEffect, useRef } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { useMagazines } from '@/features/magazine/hooks/useMagazines'
import {
  MAGAZINE_CATEGORIES,
  MAGAZINE_REGIONS,
  regionCountsOf,
  regionNameOfSido,
} from '@/types/magazine'
import { cn } from '@/lib/cn'
import MagazineCard from './MagazineCard'
import MagazineImage from './MagazineImage'
import MagazineRegionFilter from './MagazineRegionFilter'
import MagazineFeedback from './MagazineFeedback'
import type { MagazineCategory, MagazineSort } from '@/types/magazine'

const SORT_OPTIONS: { value: MagazineSort; label: string }[] = [
  { value: 'LATEST', label: '최신순' },
  { value: 'POPULAR', label: '인기순' },
  { value: 'READ_TIME', label: '읽는 시간 짧은 순' },
]

export default function MagazineCollection({ archive = false }: { archive?: boolean }) {
  const [params, setParams] = useSearchParams()
  const category = MAGAZINE_CATEGORIES.some((item) => item.code === params.get('category'))
    ? (params.get('category') as MagazineCategory)
    : 'ALL'
  const region = MAGAZINE_REGIONS.includes(params.get('region') ?? '')
    ? params.get('region')!
    : undefined
  const sort = ['LATEST', 'POPULAR', 'READ_TIME'].includes(params.get('sort') ?? '')
    ? (params.get('sort') as MagazineSort)
    : 'LATEST'
  const rawPage = Number(params.get('page') ?? 0)
  const page = archive && Number.isSafeInteger(rawPage) && rawPage >= 0 ? rawPage : 0
  // 아카이브는 훑어보는 화면이라 목차(리스트)로 시작한다. 홈은 표지 위주라 그리드.
  const [view, setView] = useState<'grid' | 'list'>(archive ? 'list' : 'grid')
  const { magazines, data, loading, error, retry } = useMagazines({
    category,
    region,
    sort,
    page,
    size: archive ? 12 : 6,
  })
  const change = (key: string, value: string) => {
    setParams((previous) => {
      const next = new URLSearchParams(previous)
      if (value) next.set(key, value)
      else next.delete(key)
      if (key !== 'page') next.delete('page')
      return next
    })
  }
  return (
    <section className="mt-12" aria-label="매거진 목록">
      <div className="mb-5 flex items-baseline justify-between gap-3">
        <h2 className="text-[23px] font-medium">
          {archive ? '모든 이야기' : '새로 쓰는 물 이야기'}
        </h2>
        <span className="text-text-secondary text-[12px]">
          {data ? `${data.totalElements}편` : ''}
        </span>
      </div>
      {/* 필터는 목록으로 넘어가는 길잡이라 divider 하나로만 구분하고 톤을 낮춘다. */}
      <div
        className={cn(
          'border-border-default flex flex-wrap items-center justify-between gap-x-6 gap-y-3 border-b pb-3',
          // 아카이브는 목록이 길어 스크롤해도 필터가 따라온다.
          archive && 'bg-surface sticky top-0 z-20 -mx-6 px-6 pt-3',
        )}
      >
        {/* 지역은 카테고리보다 앞에 둔다 — 어느 지역 이야기인지가 먼저 좁혀진다. */}
        <div className="flex flex-wrap items-center gap-x-5 gap-y-2">
          <MagazineRegionFilter
            value={region}
            counts={regionCountsOf(data?.regions)}
            onChange={(next) => change('region', next)}
          />
          <nav aria-label="매거진 카테고리" className="flex flex-wrap items-center gap-x-4 gap-y-1">
            {[{ code: 'ALL', label: '전체' }, ...MAGAZINE_CATEGORIES].map((item) => {
              const count = data?.categories?.find((entry) => entry.code === item.code)?.count
              return (
                <button
                  type="button"
                  key={item.code}
                  onClick={() => change('category', item.code === 'ALL' ? '' : item.code)}
                  aria-pressed={category === item.code}
                  className={cn(
                    'py-1 text-[12px] transition-colors',
                    category === item.code
                      ? 'text-text-primary font-medium underline underline-offset-[6px]'
                      : 'text-text-secondary hover:text-text-primary',
                  )}
                >
                  {item.label}
                  {count !== undefined && (
                    <span className="ml-1 text-[10px] tabular-nums opacity-60">{count}</span>
                  )}
                </button>
              )
            })}
          </nav>
        </div>
        {/* 정렬·보기는 보조 컨트롤이라 오른쪽에 작게 묶는다. */}
        <div className="text-text-secondary ml-auto flex items-center gap-7 text-[12px]">
          <MagazineSortMenu value={sort} onChange={(next) => change('sort', next)} />
          {archive && (
            <div
              className="border-border-default inline-flex h-8 overflow-hidden rounded-md border"
              aria-label="보기 방식"
            >
              {(['list', 'grid'] as const).map((mode) => (
                <button
                  key={mode}
                  type="button"
                  aria-pressed={view === mode}
                  onClick={() => setView(mode)}
                  className={cn(
                    'min-w-16 px-4 text-[12px] font-medium transition-colors',
                    view === mode
                      ? 'bg-inverse text-text-inverse'
                      : 'bg-surface text-text-primary hover:bg-surface-dim',
                  )}
                >
                  {mode === 'list' ? '리스트' : '그리드'}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
      {loading && (
        <MagazineCollectionSkeleton archive={archive} count={archive ? 12 : 6} view={view} />
      )}
      <MagazineFeedback
        loading={false}
        error={error}
        empty={!loading && !magazines.length}
        retry={retry}
      />
      {!loading &&
        !error &&
        (view === 'grid' ? (
          <ul
            className={cn(
              'mt-8 grid gap-x-7 gap-y-9 sm:grid-cols-2',
              archive ? 'lg:grid-cols-4' : 'lg:grid-cols-3',
            )}
          >
            {magazines.map((magazine, index) => {
              // 첫 화면 첫 글만 두 칸을 써서 리듬을 준다. 아카이브·2페이지부터는
              // 훑어보는 화면이라 크기를 고르게 둔다.
              const featured = !archive && page === 0 && index === 0
              return (
                <li key={magazine.magazineId} className={cn(featured && 'sm:col-span-2')}>
                  <MagazineCard
                    magazine={magazine}
                    featured={featured}
                    index={archive ? String(index + 1 + page * 12).padStart(2, '0') : undefined}
                  />
                </li>
              )
            })}
          </ul>
        ) : (
          <ul>
            {magazines.map((magazine, index) => (
              <li key={magazine.magazineId}>
                <Link
                  to={`/magazine/${magazine.magazineId}`}
                  className="border-border-default hover:bg-surface-dim/50 group relative flex flex-col gap-2 border-b px-2 py-6 transition-colors sm:flex-row sm:items-baseline sm:gap-6"
                >
                  {/* 잡지 목차처럼 번호 → 제목 → 정보 → 지역 순으로 읽힌다. */}
                  <span className="text-text-secondary w-8 shrink-0 text-[13px] tabular-nums">
                    {String(index + 1 + page * (archive ? 12 : 6)).padStart(2, '0')}
                  </span>
                  <h3 className="flex-1 text-[20px] font-medium group-hover:underline group-hover:underline-offset-[6px]">
                    {magazine.title}
                  </h3>
                  {/*
                    행에 마우스를 올리면 세로 사진이 뜬다. 목차만 보고 고르기
                    어려운 걸 덜어 준다. 포인터가 없는 기기에선 띄우지 않는다.
                  */}
                  <span className="pointer-events-none absolute top-1/2 right-44 z-50 hidden h-[150px] w-[120px] -translate-y-1/2 rotate-[-2deg] overflow-hidden rounded-sm opacity-0 shadow-lg transition-opacity duration-150 group-hover:opacity-100 xl:[@media(hover:hover)]:block">
                    <MagazineImage
                      src={magazine.thumbnailUrl}
                      seed={magazine.magazineId}
                      className="size-full"
                    />
                  </span>
                  <span className="text-text-secondary shrink-0 text-[11px] whitespace-nowrap">
                    {magazine.categoryLabel} · {magazine.readMinutes}분 ·{' '}
                    {magazine.publishedAt.slice(0, 10).replaceAll('-', '.')}
                  </span>
                  <span className="text-text-secondary shrink-0 text-[11px] sm:w-14 sm:text-right">
                    {magazine.regionName || regionNameOfSido(magazine.sidoCode) || '전국'}
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        ))}
      {archive && data && (data.totalPages > 1 || page > 0) && (
        <nav
          aria-label="페이지"
          className="mt-10 flex items-center justify-center gap-5 text-[13px]"
        >
          <button
            type="button"
            disabled={page === 0}
            onClick={() => change('page', String(page - 1))}
            className="p-3 disabled:opacity-30"
          >
            ← 이전
          </button>
          <span className="tabular-nums">
            {page + 1} / {Math.max(1, data.totalPages)}
          </span>
          <button
            type="button"
            disabled={data.last}
            onClick={() => change('page', String(page + 1))}
            className="p-3 disabled:opacity-30"
          >
            다음 →
          </button>
        </nav>
      )}
      {!archive && (
        <Link
          to={`/magazine/archive?${params.toString()}`}
          className="mt-8 inline-block border-b pb-1 text-[13px]"
        >
          아카이브에서 더 읽기 →
        </Link>
      )}
    </section>
  )
}

function MagazineSortMenu({
  value,
  onChange,
}: {
  value: MagazineSort
  onChange: (sort: MagazineSort) => void
}) {
  const [open, setOpen] = useState(false)
  const rootRef = useRef<HTMLDivElement>(null)
  const selected = SORT_OPTIONS.find((option) => option.value === value) ?? SORT_OPTIONS[0]

  useEffect(() => {
    if (!open) return
    const close = (event: MouseEvent) => {
      if (!rootRef.current?.contains(event.target as Node)) setOpen(false)
    }
    const escape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setOpen(false)
    }
    document.addEventListener('mousedown', close)
    document.addEventListener('keydown', escape)
    return () => {
      document.removeEventListener('mousedown', close)
      document.removeEventListener('keydown', escape)
    }
  }, [open])

  const pick = (sort: MagazineSort) => {
    onChange(sort)
    setOpen(false)
  }

  return (
    <div ref={rootRef} className="relative">
      <button
        type="button"
        onClick={() => setOpen((current) => !current)}
        aria-expanded={open}
        aria-haspopup="true"
        className="hover:text-text-primary inline-flex h-7 items-center gap-2 text-[12px] text-text-secondary transition-colors"
      >
        {selected.label}
        <span aria-hidden="true" className="text-[13px] leading-none text-text-secondary/70">
          ˅
        </span>
      </button>

      {open && (
        <div
          className="border-border-default bg-surface absolute top-[calc(100%+6px)] right-0 z-50 w-[154px] rounded-[2px] border px-2 py-1.5"
          role="group"
          aria-label="정렬"
        >
          {SORT_OPTIONS.map((option) => {
            const active = option.value === value
            return (
              <button
                key={option.value}
                type="button"
                onClick={() => pick(option.value)}
                aria-pressed={active}
                className={cn(
                  'relative flex h-8 w-full items-center text-left text-[12px] transition-colors',
                  active
                    ? 'text-text-primary font-semibold after:absolute after:bottom-1 after:left-0 after:h-px after:w-4 after:bg-text-primary after:content-[""]'
                    : 'text-text-secondary hover:bg-surface-dim hover:text-text-primary',
                )}
              >
                {option.label}
              </button>
            )
          })}
        </div>
      )}
    </div>
  )
}

function MagazineCollectionSkeleton({
  archive,
  count,
  view,
}: {
  archive: boolean
  count: number
  view: 'grid' | 'list'
}) {
  if (view === 'list')
    return (
      <ul role="status" aria-label="매거진을 불러오는 중" className="motion-safe:animate-pulse">
        {Array.from({ length: count }).map((_, index) => (
          <li key={index} className="border-border-default border-b px-2 py-6">
            <div
              aria-hidden="true"
              className="flex flex-col gap-3 sm:flex-row sm:items-center sm:gap-6"
            >
              <div className="bg-border-default/30 h-3 w-8 shrink-0 rounded-[2px]" />
              <div className="min-w-0 flex-1 space-y-2">
                <div className="bg-border-default/40 h-5 w-full max-w-lg rounded-[2px]" />
                <div className="bg-border-default/30 h-3 w-2/3 rounded-[2px] sm:hidden" />
              </div>
              <div className="bg-border-default/30 h-3 w-32 shrink-0 rounded-[2px]" />
              <div className="bg-border-default/30 h-3 w-12 shrink-0 rounded-[2px]" />
            </div>
          </li>
        ))}
      </ul>
    )

  return (
    <ul
      role="status"
      aria-label="매거진을 불러오는 중"
      className={cn(
        'mt-8 grid gap-x-7 gap-y-9 motion-safe:animate-pulse sm:grid-cols-2',
        archive ? 'lg:grid-cols-4' : 'lg:grid-cols-3',
      )}
    >
      {Array.from({ length: count }).map((_, index) => {
        const featured = !archive && index === 0
        return (
          <li key={index} className={cn(featured && 'sm:col-span-2')}>
            <div
              aria-hidden="true"
              className={cn(
                'bg-border-default/35 rounded-sm',
                featured ? 'aspect-[16/9]' : archive ? 'aspect-[3/4]' : 'aspect-[4/3]',
              )}
            />
            <div aria-hidden="true" className="mt-4 space-y-2">
              <div className="bg-border-default/40 h-4 w-11/12 rounded-[2px]" />
              <div className="bg-border-default/30 h-4 w-2/3 rounded-[2px]" />
              <div className="bg-border-default/30 mt-3 h-2.5 w-28 rounded-[2px]" />
            </div>
          </li>
        )
      })}
    </ul>
  )
}
