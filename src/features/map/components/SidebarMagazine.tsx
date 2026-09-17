import { Link } from 'react-router-dom'

import { useMagazines } from '@/features/magazine/hooks/useMagazines'

/** 시안 30:2224 — 사이드바 하단에 붙는 매거진 묶음. 카드는 2개만 보여준다. */
const VISIBLE_COUNT = 2

export default function SidebarMagazine({ region }: { region?: string }) {
  // 매거진은 sidoCode(행안부 2자리)로 거르는데 지도는 8개 권역이라 코드가 1:1로 안 맞는다.
  // 목록을 받아 regionName으로 좁힌다 — 권역명이 지역명에 포함되는지로 판단한다.
  const { magazines, loading, error } = useMagazines({ size: 12 })

  const visible = region
    ? magazines.filter((magazine) => magazine.regionName.includes(region))
    : magazines

  // 보조 영역이라 실패하면 조용히 감춘다 — 지도 탐색을 막지 않는다.
  // 고른 지역에 글이 없을 때도 마찬가지다 (전체 글로 대체하지 않는다).
  if (loading || error || visible.length === 0) return null

  return (
    <section
      aria-label="추천 매거진"
      // 위 내용이 짧으면 바닥으로 밀리고(mt-auto), 길면 목록 끝에 이어 붙는다.
      className="border-border-default mt-auto shrink-0 border-t pt-6"
    >
      <p className="text-text-secondary text-[11px] tracking-[0.08em]">MAGAZINE</p>

      <div className="mt-2 flex items-baseline justify-between gap-3">
        <h2 className="text-text-primary min-w-0 truncate text-[15px] font-semibold">
          {region ? `${region}의 온천 이야기` : '이번 주말, 이런 온천은 어때요?'}
        </h2>
        <Link
          to="/magazine"
          className="text-text-secondary shrink-0 text-[11px] outline-none hover:underline"
        >
          → 전체보기
        </Link>
      </div>

      <ul className="mt-3 grid grid-cols-2 gap-3">
        {visible.slice(0, VISIBLE_COUNT).map((magazine) => (
          <li key={magazine.magazineId} className="min-w-0">
            <Link to={`/magazine/${magazine.magazineId}`} className="group block outline-none">
              {magazine.thumbnailUrl ? (
                <img
                  src={magazine.thumbnailUrl}
                  alt=""
                  loading="lazy"
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
