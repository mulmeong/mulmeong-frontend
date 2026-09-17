import { useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { useMagazines } from '@/features/magazine/hooks/useMagazines'
import { MAGAZINE_CATEGORIES } from '@/types/magazine'
import { cn } from '@/lib/cn'
import MagazineCard from './MagazineCard'
import MagazineFeedback from './MagazineFeedback'
import type { MagazineCategory, MagazineSort } from '@/types/magazine'

export default function MagazineCollection({ archive = false }: { archive?: boolean }) {
  const [params, setParams] = useSearchParams()
  const category = MAGAZINE_CATEGORIES.some((item) => item.code === params.get('category'))
    ? (params.get('category') as MagazineCategory)
    : 'ALL'
  const sidoCode = /^\d{2}$/.test(params.get('sidoCode') ?? '')
    ? params.get('sidoCode')!
    : undefined
  const sort = ['LATEST', 'POPULAR', 'READ_TIME'].includes(params.get('sort') ?? '')
    ? (params.get('sort') as MagazineSort)
    : 'LATEST'
  const rawPage = Number(params.get('page') ?? 0)
  const page = archive && Number.isSafeInteger(rawPage) && rawPage >= 0 ? rawPage : 0
  const [view, setView] = useState<'grid' | 'list'>('grid')
  const { magazines, data, loading, error, retry } = useMagazines({
    category,
    sidoCode,
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
      <div className="border-border-default border-y py-4">
        <nav aria-label="매거진 카테고리" className="flex flex-wrap gap-x-5 gap-y-2">
          {[{ code: 'ALL', label: '전체' }, ...MAGAZINE_CATEGORIES].map((item) => {
            const count = data?.categories?.find((entry) => entry.code === item.code)?.count
            return (
              <button
                type="button"
                key={item.code}
                onClick={() => change('category', item.code === 'ALL' ? '' : item.code)}
                aria-pressed={category === item.code}
                className={cn(
                  'py-1 text-[12px]',
                  category === item.code
                    ? 'font-semibold underline underline-offset-8'
                    : 'text-text-secondary hover:text-text-primary',
                )}
              >
                {item.label}
                {count !== undefined && (
                  <span className="ml-1 text-[10px] tabular-nums">{count}</span>
                )}
              </button>
            )
          })}
        </nav>
        <div className="mt-5 flex flex-wrap items-center gap-3">
          <select
            aria-label="지역"
            value={sidoCode ?? ''}
            onChange={(event) => change('sidoCode', event.target.value)}
            className="border-border-default max-w-[170px] rounded-sm border bg-transparent px-2 py-2 text-[12px]"
          >
            <option value="">전국</option>
            {sidoCode && !data?.regions?.some((item) => item.sidoCode === sidoCode) && (
              <option value={sidoCode}>선택 지역</option>
            )}
            {data?.regions?.map((item) => (
              <option key={item.sidoCode} value={item.sidoCode}>
                {item.name} ({item.count})
              </option>
            ))}
          </select>
          <select
            aria-label="정렬"
            value={sort}
            onChange={(event) => change('sort', event.target.value)}
            className="bg-transparent py-2 text-[12px]"
          >
            <option value="LATEST">최신순</option>
            <option value="POPULAR">인기순</option>
            <option value="READ_TIME">읽는 시간 짧은 순</option>
          </select>
          {archive && (
            <div className="ml-auto flex gap-3">
              {(['grid', 'list'] as const).map((mode) => (
                <button
                  key={mode}
                  type="button"
                  aria-pressed={view === mode}
                  onClick={() => setView(mode)}
                  className={cn('py-2 text-[11px]', view !== mode && 'text-text-secondary')}
                >
                  {mode === 'grid' ? '그리드' : '리스트'}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
      <MagazineFeedback loading={loading} error={error} empty={!magazines.length} retry={retry} />
      {!loading &&
        !error &&
        (view === 'grid' ? (
          <ul className="mt-7 grid gap-x-6 gap-y-10 sm:grid-cols-2 lg:grid-cols-3">
            {magazines.map((magazine, index) => (
              <li key={magazine.magazineId}>
                <MagazineCard magazine={magazine} index={page * 12 + index} />
              </li>
            ))}
          </ul>
        ) : (
          <ul>
            {magazines.map((magazine) => (
              <li key={magazine.magazineId}>
                <Link
                  to={`/magazine/${magazine.magazineId}`}
                  className="border-border-default group flex flex-col gap-2 border-b py-6 sm:flex-row sm:items-baseline sm:justify-between"
                >
                  <h3 className="text-[20px] font-medium group-hover:underline">
                    {magazine.title}
                  </h3>
                  <span className="text-text-secondary shrink-0 text-[11px]">
                    {magazine.categoryLabel} · {magazine.readMinutes}분 ·{' '}
                    {magazine.publishedAt.slice(0, 10).replaceAll('-', '.')}
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
