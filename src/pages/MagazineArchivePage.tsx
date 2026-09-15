import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'

import { useMagazines } from '@/features/magazine/hooks/useMagazines'
import { cn } from '@/lib/cn'
import { MAGAZINE_CATEGORIES } from '@/types/magazine'
import { REGIONS } from '@/types/onsen'

import type { Magazine } from '@/types/magazine'

const ALL_CATEGORY = '전체'
const ALL_REGION = '전국'

type SortKey = 'new' | 'time'
type ViewMode = 'list' | 'grid'

function formatDate(iso: string) {
  return iso.replaceAll('-', '.')
}

function sortMagazines(items: Magazine[], sort: SortKey) {
  return [...items].sort((a, b) =>
    sort === 'time' ? a.readMinutes - b.readMinutes : b.publishedAt.localeCompare(a.publishedAt),
  )
}

/**
 * MAG-02 아카이브 전체목록. 레이아웃은 매거진 데모를 따른다 —
 * 타이틀 밴드 + 고정 필터 바 + 리스트/그리드 전환.
 * 정렬은 받아온 목록 안에서 처리한다 (정렬만 바꾸려고 다시 요청하지 않는다).
 */
export default function MagazineArchivePage() {
  const [category, setCategory] = useState<string>(ALL_CATEGORY)
  const [region, setRegion] = useState<string>(ALL_REGION)
  const [sort, setSort] = useState<SortKey>('new')
  const [view, setView] = useState<ViewMode>('list')

  const { magazines, loading, error } = useMagazines(
    category === ALL_CATEGORY ? undefined : category,
    region === ALL_REGION ? undefined : region,
  )

  const items = useMemo(() => sortMagazines(magazines, sort), [magazines, sort])

  return (
    <div className="pb-20">
      <div className="border-border-default flex items-end justify-between border-b pb-6">
        <h1>
          <span className="text-text-secondary block text-[12px] tracking-[0.2em]">MAGAZINE</span>
          <span className="text-text-primary mt-2 block text-[44px] leading-none font-bold tracking-[0.04em]">
            ARCHIVE
          </span>
        </h1>
        <p className="text-text-secondary text-[13px]">
          <span className="text-text-primary text-[20px]">{items.length}</span> 편
        </p>
      </div>

      {/* 데모의 고정 필터 바 — 스크롤해도 조건이 따라온다. */}
      <div className="bg-surface border-border-default sticky top-0 z-10 border-b py-3.5">
        <div className="flex flex-wrap items-center justify-between gap-y-3">
          <div className="flex flex-wrap items-center gap-x-5 gap-y-2">
            <label className="sr-only" htmlFor="region">
              지역
            </label>
            <select
              id="region"
              value={region}
              onChange={(e) => setRegion(e.target.value)}
              className="bg-inverse text-text-inverse rounded-full px-3.5 py-[7px] text-[12px] font-bold outline-none"
            >
              {[ALL_REGION, ...REGIONS].map((item) => (
                <option key={item} value={item}>
                  {item}
                </option>
              ))}
            </select>

            <div className="flex flex-wrap gap-x-[18px] gap-y-1">
              {[ALL_CATEGORY, ...MAGAZINE_CATEGORIES].map((item) => (
                <button
                  key={item}
                  type="button"
                  aria-pressed={category === item}
                  onClick={() => setCategory(item)}
                  className={cn(
                    'py-1 text-[13px] outline-none',
                    category === item
                      ? 'text-text-primary font-bold underline underline-offset-[5px]'
                      : 'text-text-secondary hover:text-text-primary',
                  )}
                >
                  {item}
                </button>
              ))}
            </div>
          </div>

          <div className="flex items-center gap-4">
            <label className="sr-only" htmlFor="sort">
              정렬
            </label>
            <select
              id="sort"
              value={sort}
              onChange={(e) => setSort(e.target.value as SortKey)}
              className="text-text-secondary bg-transparent text-[12px] outline-none"
            >
              <option value="new">최신순</option>
              <option value="time">읽는 시간순</option>
            </select>

            <div className="border-border-default flex overflow-hidden rounded-lg border">
              {(['list', 'grid'] as const).map((mode) => (
                <button
                  key={mode}
                  type="button"
                  aria-pressed={view === mode}
                  onClick={() => setView(mode)}
                  className={cn(
                    'px-3 py-1.5 text-[11px] outline-none',
                    view === mode
                      ? 'bg-inverse text-text-inverse font-bold'
                      : 'text-text-secondary hover:text-text-primary',
                  )}
                >
                  {mode === 'list' ? '리스트' : '그리드'}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {loading && <p className="text-text-secondary py-20 text-center text-[14px]">불러오는 중…</p>}

      {error && (
        <p role="alert" className="text-danger py-20 text-center text-[14px]">
          {error}
        </p>
      )}

      {!loading && !error && items.length === 0 && (
        <p className="text-text-secondary py-20 text-center text-[14px]">
          이 조건의 매거진이 아직 없어요. 다른 지역·카테고리를 골라보세요.
        </p>
      )}

      {!loading && !error && items.length > 0 && view === 'list' && (
        <ul className="pt-5">
          {items.map((magazine, index) => (
            <li key={magazine.id}>
              <Link
                to={`/magazine/${magazine.id}`}
                className="group border-border-default hover:bg-surface-dim flex items-baseline gap-6 border-b px-2 py-6 transition-colors outline-none"
              >
                <span className="text-text-secondary w-8 shrink-0 text-[14px] tabular-nums">
                  {String(items.length - index).padStart(2, '0')}
                </span>
                <span className="text-text-primary min-w-0 flex-1 text-[26px] font-bold group-hover:underline group-hover:underline-offset-[6px]">
                  {magazine.title}
                </span>
                <span className="text-text-secondary hidden shrink-0 text-[12px] whitespace-nowrap sm:block">
                  {magazine.category} · {magazine.readMinutes}분 ·{' '}
                  {formatDate(magazine.publishedAt)}
                </span>
                <span className="text-text-secondary hidden w-16 shrink-0 text-right text-[12px] sm:block">
                  {magazine.region ?? ALL_REGION}
                </span>
              </Link>
            </li>
          ))}
        </ul>
      )}

      {!loading && !error && items.length > 0 && view === 'grid' && (
        <ul className="grid grid-cols-2 gap-x-7 gap-y-9 pt-9 lg:grid-cols-4">
          {items.map((magazine, index) => (
            <li key={magazine.id}>
              <Link to={`/magazine/${magazine.id}`} className="group block outline-none">
                {magazine.coverImageUrl ? (
                  <img
                    src={magazine.coverImageUrl}
                    alt=""
                    className="bg-surface-dim aspect-[3/4] w-full rounded-sm object-cover transition-transform group-hover:-translate-y-1"
                  />
                ) : (
                  <div className="bg-surface-dim aspect-[3/4] w-full rounded-sm transition-transform group-hover:-translate-y-1" />
                )}
                <p className="mt-3 text-[15px] font-bold">
                  <span className="text-text-secondary mr-1.5 text-[13px] font-normal">
                    {String(items.length - index).padStart(2, '0')}
                  </span>
                  <span className="text-text-primary">{magazine.title}</span>
                </p>
                <p className="text-text-secondary mt-1 text-[12px]">
                  {magazine.category} · {magazine.readMinutes}분
                </p>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
