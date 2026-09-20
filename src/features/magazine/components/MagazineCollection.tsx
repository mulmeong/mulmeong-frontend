import { useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { useMagazines } from '@/features/magazine/hooks/useMagazines'
import { MAGAZINE_CATEGORIES, MAGAZINE_REGIONS, regionNameOfSido } from '@/types/magazine'
import { cn } from '@/lib/cn'
import MagazineCard from './MagazineCard'
import MagazineRegionFilter from './MagazineRegionFilter'
import MagazineFeedback from './MagazineFeedback'
import type { MagazineCategory, MagazineSort } from '@/types/magazine'

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
  const [view, setView] = useState<'grid' | 'list'>('grid')
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
      <div className="border-border-default flex flex-wrap items-center justify-between gap-x-6 gap-y-3 border-b pb-3">
        {/* 지역은 카테고리보다 앞에 둔다 — 어느 지역 이야기인지가 먼저 좁혀진다. */}
        <div className="flex flex-wrap items-center gap-x-5 gap-y-2">
          <MagazineRegionFilter value={region} onChange={(next) => change('region', next)} />
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
        <div className="text-text-secondary ml-auto flex items-center gap-1 text-[11px]">
          <select
            aria-label="정렬"
            value={sort}
            onChange={(event) => change('sort', event.target.value)}
            className="hover:text-text-primary cursor-pointer bg-transparent py-1 text-[11px]"
          >
            <option value="LATEST">최신순</option>
            <option value="POPULAR">인기순</option>
            <option value="READ_TIME">읽는 시간 짧은 순</option>
          </select>
          {archive && (
            <>
              <span aria-hidden className="opacity-40">
                ·
              </span>
              {(['grid', 'list'] as const).map((mode) => (
                <button
                  key={mode}
                  type="button"
                  aria-pressed={view === mode}
                  onClick={() => setView(mode)}
                  className={cn(
                    'px-1 py-1 text-[11px]',
                    view === mode ? 'text-text-primary font-medium' : 'hover:text-text-primary',
                  )}
                >
                  {mode === 'grid' ? '그리드' : '리스트'}
                </button>
              ))}
            </>
          )}
        </div>
      </div>
      <MagazineFeedback loading={loading} error={error} empty={!magazines.length} retry={retry} />
      {!loading &&
        !error &&
        (view === 'grid' ? (
          <ul className="mt-8 grid gap-x-6 gap-y-10 sm:grid-cols-2 lg:grid-cols-3">
            {magazines.map((magazine, index) => {
              // 첫 화면 첫 글만 두 칸을 써서 리듬을 준다. 아카이브·2페이지부터는
              // 훑어보는 화면이라 크기를 고르게 둔다.
              const featured = !archive && page === 0 && index === 0
              return (
                <li key={magazine.magazineId} className={cn(featured && 'sm:col-span-2')}>
                  <MagazineCard magazine={magazine} featured={featured} />
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
                  className="border-border-default hover:bg-surface-dim/50 group flex flex-col gap-2 border-b px-2 py-6 transition-colors sm:flex-row sm:items-baseline sm:gap-6"
                >
                  {/* 잡지 목차처럼 번호 → 제목 → 정보 → 지역 순으로 읽힌다. */}
                  <span className="text-text-secondary w-8 shrink-0 text-[13px] tabular-nums">
                    {String(index + 1 + page * (archive ? 12 : 6)).padStart(2, '0')}
                  </span>
                  <h3 className="flex-1 text-[20px] font-medium group-hover:underline group-hover:underline-offset-[6px]">
                    {magazine.title}
                  </h3>
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
