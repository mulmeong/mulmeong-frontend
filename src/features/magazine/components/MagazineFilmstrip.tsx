import { Link } from 'react-router-dom'

import MagazineImage from '@/features/magazine/components/MagazineImage'
import { cn } from '@/lib/cn'
import { useDragCarousel } from '@/lib/useDragCarousel'

import type { Magazine } from '@/types/magazine'

/**
 * 카드마다 다른 높이에서 시작하게 하는 오프셋 리듬. 값 자체보다 '교차한다'는
 * 규칙이 중요해서 3단으로만 순환시킨다 — 전부 다르게 하면 무작위로 보이고,
 * 두 단만 쓰면 단조롭다.
 */
const OFFSETS = ['mt-10', 'mt-0', 'mt-16'] as const

/**
 * 홈의 가로 스크롤 카드열. 그리드로 줄바꿈하는 아카이브와 달리, 홈은 최신 몇 편만
 * 훑어보는 자리라 한 줄로 흘려보낸다. "← 가로로 스크롤" 문구로 스크롤 가능함을
 * 알린다 — 트랙패드가 없는 마우스 사용자에게는 스크롤바가 유일한 단서라서다.
 *
 * 드래그는 지도 사이드바가 쓰던 useDragCarousel(lib로 공용 승격)을 그대로 가져다 쓴다.
 * 마우스로 눌러 끌면 포인터를 실시간으로 따라가고, 놓으면 가장 가까운 카드에
 * 정렬된다 — 여기서 새로 구현하지 않는다.
 */
export default function MagazineFilmstrip({ magazines }: { magazines: Magazine[] }) {
  const { trackRef } = useDragCarousel(magazines.length)

  return (
    <div>
      <ul
        ref={trackRef}
        className="scrollbar-thin -mx-6 flex touch-pan-x items-start gap-7 overflow-x-auto px-6 pb-2 select-none"
      >
        {magazines.map((magazine, index) => (
          <li
            key={magazine.magazineId}
            className={cn('w-[240px] shrink-0', OFFSETS[index % OFFSETS.length])}
          >
            <Link to={`/magazine/${magazine.magazineId}`} className="group block">
              <MagazineImage
                src={magazine.thumbnailUrl}
                seed={magazine.magazineId}
                className="aspect-[3/4]"
              />
              <h3 className="mt-3 text-[15px] leading-snug font-bold tracking-tight break-keep group-hover:underline group-hover:underline-offset-4">
                <span className="text-text-secondary mr-1.5 font-normal tabular-nums">
                  {String(index + 1).padStart(2, '0')}
                </span>
                {magazine.title}
              </h3>
              <p className="text-text-secondary mt-1 text-[11px]">
                {magazine.categoryLabel} · {magazine.readMinutes}분
              </p>
            </Link>
          </li>
        ))}
      </ul>
      <div className="mt-4 flex items-center justify-between">
        <p className="text-text-secondary text-[11px]" aria-hidden="true">
          ← 가로로 스크롤
        </p>
        <Link
          to="/magazine/archive"
          className="text-text-secondary hover:text-text-primary text-[13px] underline underline-offset-4"
        >
          전체 아카이브 보기
        </Link>
      </div>
    </div>
  )
}

export function MagazineFilmstripSkeleton({ count = 5 }: { count?: number }) {
  return (
    <div role="status" aria-label="매거진을 불러오는 중" className="motion-safe:animate-pulse">
      <ul
        aria-hidden="true"
        className="scrollbar-thin -mx-6 flex touch-pan-x items-start gap-7 overflow-hidden px-6 pb-2"
      >
        {Array.from({ length: count }).map((_, index) => (
          <li key={index} className={cn('w-[240px] shrink-0', OFFSETS[index % OFFSETS.length])}>
            <div className="bg-border-default/35 aspect-[3/4] rounded-sm" />
            <div className="mt-3 flex items-start gap-2">
              <div className="bg-border-default/35 mt-1 h-3 w-5 shrink-0 rounded-[2px]" />
              <div className="min-w-0 flex-1 space-y-2">
                <div className="bg-border-default/40 h-3.5 w-full rounded-[2px]" />
                <div className="bg-border-default/30 h-3.5 w-3/4 rounded-[2px]" />
              </div>
            </div>
            <div className="bg-border-default/30 mt-3 h-2.5 w-24 rounded-[2px]" />
          </li>
        ))}
      </ul>
      <div aria-hidden="true" className="mt-4 flex items-center justify-between">
        <div className="bg-border-default/30 h-2.5 w-24 rounded-[2px]" />
        <div className="bg-border-default/30 h-3 w-28 rounded-[2px]" />
      </div>
    </div>
  )
}
