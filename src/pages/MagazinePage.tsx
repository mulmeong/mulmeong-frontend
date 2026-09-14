import { useState } from 'react'
import { Link } from 'react-router-dom'

import MagazineCard from '@/features/magazine/components/MagazineCard'
import { useIssue } from '@/features/magazine/hooks/useIssue'
import { useMagazines } from '@/features/magazine/hooks/useMagazines'
import { cn } from '@/lib/cn'
import { MAGAZINE_CATEGORIES } from '@/types/magazine'

/** 시안 카테고리 탭의 '전체' — 값이 없으면 전부 보여준다. */
const ALL = '전체'

/**
 * MAG-01 매거진 홈. 시안('매거진 홈')의 히어로 + 카테고리 탭 + 카드 스크롤 구성을 따르되,
 * 폭은 RootLayout의 max-w-5xl 안에서 맞춘다 (시안 아트보드는 1496px).
 */
export default function MagazinePage() {
  const [category, setCategory] = useState<string>(ALL)
  const issue = useIssue()
  const { magazines, loading, error } = useMagazines(category === ALL ? undefined : category)

  return (
    <div>
      {issue && (
        <section className="border-border-default border-b pb-12">
          <div className="flex items-baseline gap-5">
            <span className="text-text-secondary text-[13px] tracking-[0.08em]">{issue.label}</span>
            <span className="text-text-primary text-[15px]">{issue.title}</span>
          </div>

          <h1 className="text-text-primary mt-8 text-[44px] leading-[1.25] font-bold">
            {issue.headline}
          </h1>

          <div className="mt-9 flex items-center gap-7">
            <button
              type="button"
              className="border-border-strong text-text-primary hover:bg-inverse hover:text-text-inverse rounded-full border px-6 py-2 text-[14px] transition-colors outline-none"
            >
              읽어보기
            </button>
            <span className="text-text-secondary text-[13px]">{issue.meta}</span>
          </div>
        </section>
      )}

      {/* .scrollbar-thin은 feat/map의 index.css에 있다 — 머지되면 여기에도 붙인다. */}
      <nav className="mt-8 flex gap-7 overflow-x-auto pb-1">
        {[ALL, ...MAGAZINE_CATEGORIES].map((item) => (
          <button
            key={item}
            type="button"
            aria-pressed={category === item}
            onClick={() => setCategory(item)}
            className={cn(
              'shrink-0 pb-1 text-[15px] whitespace-nowrap outline-none',
              category === item
                ? 'text-text-primary border-border-strong border-b-2 font-semibold'
                : 'text-text-secondary hover:text-text-primary',
            )}
          >
            {item}
          </button>
        ))}
      </nav>

      {loading && <p className="text-text-secondary mt-10 text-[14px]">불러오는 중…</p>}

      {error && (
        <p role="alert" className="text-danger mt-10 text-[14px]">
          {error}
        </p>
      )}

      {!loading && !error && magazines.length === 0 && (
        <p className="text-text-secondary mt-10 text-[14px]">아직 등록된 글이 없어요.</p>
      )}

      {!loading && !error && magazines.length > 0 && (
        <ul className="mt-10 flex gap-9 overflow-x-auto pb-4">
          {magazines.map((magazine, index) => (
            <li key={magazine.id}>
              <MagazineCard magazine={magazine} index={index} />
            </li>
          ))}
        </ul>
      )}

      <div className="mt-6 flex justify-end">
        <Link
          to="/magazine/archive"
          className="text-text-secondary hover:text-text-primary text-[13px] outline-none hover:underline"
        >
          → 전체 아카이브 보기
        </Link>
      </div>
    </div>
  )
}
