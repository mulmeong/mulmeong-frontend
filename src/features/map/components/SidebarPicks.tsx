import { Link } from 'react-router-dom'

import MagazineImage from '@/features/magazine/components/MagazineImage'
import { useMagazines } from '@/features/magazine/hooks/useMagazines'

/** 가로 스크롤 한 줄에 들어가는 만큼. 더 받아도 사용자가 끝까지 밀지 않는다. */
const VISIBLE_COUNT = 4

/**
 * 첫 화면(지역 미선택) 추천 묶음 — 시안의 '지금 이런 곳은 어때요'.
 *
 * 문구를 하드코딩하던 자리다. 추천 로직이 따로 없으므로 매거진 최신 글을 그대로 건다
 * — 눌러서 갈 곳이 있는 편이 "누를 수 없는 카드"보다 낫다.
 * 지역을 고르면 이 자리는 `SidebarMagazine`(그 지역 글)이 대신한다.
 */
export default function SidebarPicks() {
  const { magazines, loading, error } = useMagazines({ size: VISIBLE_COUNT })

  // 보조 영역이라 실패하면 조용히 감춘다 — 지도 탐색을 막지 않는다.
  if (error || (!loading && magazines.length === 0)) return null

  return (
    <section aria-label="추천 매거진" aria-busy={loading} className="mt-auto shrink-0">
      <div className="flex items-baseline justify-between gap-3">
        {/* 카드가 큰 만큼 제목도 키워 위계를 맞춘다 (다른 섹션 라벨은 11px 유지). */}
        <h2 className="text-text-primary text-[13px] font-medium">지금 이런 곳은 어때요</h2>
        <Link
          to="/magazine"
          className="text-text-secondary shrink-0 text-[11px] outline-none hover:underline focus-visible:underline"
        >
          전체보기
        </Link>
      </div>

      {/*
        가로 스크롤 — 추천이 세로 공간을 먹어 목록을 밀어내지 않게 한다.
        사이드바 px-5를 상쇄하되(-mx-5) 같은 요소에 px-5를 다시 줘서
        첫·끝 카드가 가장자리에 잘리지 않게 한다.
      */}
      <ul className="scrollbar-thin -mx-5 mt-3 flex snap-x scroll-pl-5 gap-2.5 overflow-x-auto px-5 pb-1">
        {loading
          ? // 자리를 먼저 잡아 목록이 밀려 올라가지 않게 한다.
            Array.from({ length: VISIBLE_COUNT }, (_, index) => (
              <li key={index} className="w-[168px] shrink-0">
                <div className="bg-surface-dim aspect-[168/104] w-full rounded-sm" />
                <div className="bg-surface-dim mt-2 h-3.5 w-3/4 rounded-sm" />
              </li>
            ))
          : magazines.map((magazine) => (
              <li key={magazine.magazineId} className="w-[168px] shrink-0 snap-start">
                <Link
                  to={`/magazine/${magazine.magazineId}`}
                  className="group block outline-none focus-visible:underline focus-visible:underline-offset-4"
                >
                  <MagazineImage
                    src={magazine.thumbnailUrl}
                    className="aspect-[168/104] w-full rounded-sm"
                  />
                  <p className="text-text-primary mt-2 truncate text-[13px] group-hover:underline">
                    {magazine.title}
                  </p>
                  <p className="text-text-secondary mt-0.5 truncate text-[11px]">
                    {magazine.categoryLabel} · {magazine.readMinutes}분
                  </p>
                </Link>
              </li>
            ))}
      </ul>
    </section>
  )
}
