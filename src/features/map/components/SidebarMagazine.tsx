import { Link } from 'react-router-dom'

import { useMagazines } from '@/features/magazine/hooks/useMagazines'

/** 시안 30:2224 — 사이드바 하단에 붙는 매거진 묶음. 카드는 2개만 보여준다. */
const VISIBLE_COUNT = 2

export default function SidebarMagazine() {
  const { magazines, loading, error } = useMagazines()

  // 보조 영역이라 실패하면 조용히 감춘다 — 지도 탐색을 막지 않는다.
  if (loading || error || magazines.length === 0) return null

  return (
    <section className="border-border-default mt-8 border-t pt-6">
      <p className="text-text-secondary text-[11px] tracking-[0.08em]">MAGAZINE</p>

      <div className="mt-2 flex items-baseline justify-between gap-3">
        <h2 className="text-text-primary min-w-0 truncate text-[15px] font-semibold">
          이번 주말, 이런 온천은 어때요?
        </h2>
        <Link
          to="/magazine"
          className="text-text-secondary shrink-0 text-[11px] outline-none hover:underline"
        >
          → 전체보기
        </Link>
      </div>

      <ul className="mt-3 grid grid-cols-2 gap-3">
        {magazines.slice(0, VISIBLE_COUNT).map((magazine) => (
          <li key={magazine.id} className="min-w-0">
            <Link to={`/magazine/${magazine.id}`} className="group block outline-none">
              {magazine.coverImageUrl ? (
                <img
                  src={magazine.coverImageUrl}
                  alt=""
                  className="bg-surface-dim aspect-[174/115] w-full rounded-sm object-cover"
                />
              ) : (
                <div className="bg-surface-dim aspect-[174/115] w-full rounded-sm" />
              )}
              <p className="text-text-primary mt-1.5 truncate text-[11px] group-hover:underline">
                {magazine.title}
              </p>
            </Link>
          </li>
        ))}
      </ul>
    </section>
  )
}
