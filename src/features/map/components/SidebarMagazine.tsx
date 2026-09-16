import { Link } from 'react-router-dom'

import { useMagazines } from '@/features/magazine/hooks/useMagazines'

/** 시안 30:2224 — 사이드바 하단에 붙는 매거진 묶음. 카드는 2개만 보여준다. */
const VISIBLE_COUNT = 2

export default function SidebarMagazine() {
  const { magazines, loading, error } = useMagazines()

  // 보조 영역이라 실패하면 조용히 감춘다 — 지도 탐색을 막지 않는다.
  if (loading || error || magazines.length === 0) return null

  return (
    <section
      aria-label="추천 매거진"
      className="border-border-default bg-surface shrink-0 border-t px-5 py-3 lg:py-4"
    >
      <p className="text-text-secondary text-[10px] tracking-[0.08em]">MAGAZINE</p>

      <div className="mt-1 flex items-baseline justify-between gap-3">
        <h2 className="text-text-primary min-w-0 truncate text-[13px] font-semibold">
          이번 주말, 이런 온천은 어때요?
        </h2>
        <Link
          to="/magazine"
          className="text-text-secondary shrink-0 text-[11px] outline-none hover:underline"
        >
          → 전체보기
        </Link>
      </div>

      <ul className="mt-2 grid grid-cols-2 gap-3">
        {magazines.slice(0, VISIBLE_COUNT).map((magazine) => (
          <li key={magazine.id} className="min-w-0">
            <Link to={`/magazine/${magazine.id}`} className="group block outline-none">
              {magazine.coverImageUrl ? (
                <img
                  src={magazine.coverImageUrl}
                  alt=""
                  loading="lazy"
                  className="bg-surface-dim h-12 w-full rounded-sm object-cover lg:h-[72px]"
                />
              ) : (
                <div className="bg-surface-dim h-12 w-full rounded-sm lg:h-[72px]" />
              )}
              <p className="text-text-primary mt-1 truncate text-[11px] group-hover:underline">
                {magazine.title}
              </p>
            </Link>
          </li>
        ))}
      </ul>
    </section>
  )
}
