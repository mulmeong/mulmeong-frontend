import { useEffect, useId, useRef, useState } from 'react'
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
  const trackRef = useRef<HTMLUListElement>(null)
  const trackId = useId()
  const [scroll, setScroll] = useState({ previous: false, next: false })

  useEffect(() => {
    const track = trackRef.current
    if (!track) return
    const update = () => {
      const previous = track.scrollLeft > 1
      const next = track.scrollWidth - track.clientWidth - track.scrollLeft > 1
      setScroll((current) =>
        current.previous === previous && current.next === next ? current : { previous, next },
      )
    }
    update()
    const observer = new ResizeObserver(update)
    observer.observe(track)
    track.addEventListener('scroll', update, { passive: true })
    return () => {
      observer.disconnect()
      track.removeEventListener('scroll', update)
    }
  }, [magazines.length, loading, error])

  function move(direction: number) {
    const track = trackRef.current
    const card = track?.firstElementChild
    if (!track || !card) return
    const gap = Number.parseFloat(getComputedStyle(track).columnGap) || 0
    track.scrollBy({
      left: direction * (card.getBoundingClientRect().width + gap),
      behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'instant' : 'smooth',
    })
  }

  // 보조 영역이라 실패하면 조용히 감춘다 — 지도 탐색을 막지 않는다.
  if (error || (!loading && magazines.length === 0)) return null

  return (
    <section aria-label="추천 매거진" aria-busy={loading} className="mt-auto w-full min-w-0 shrink-0">
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
      <ul
        id={trackId}
        ref={trackRef}
        aria-label="추천 매거진 목록"
        className="-mx-5 mt-3 box-border flex w-[calc(100%+2.5rem)] min-w-0 snap-x scroll-pl-5 gap-2.5 overflow-x-auto overscroll-x-contain px-5 pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
      >
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
      <div className="mt-2 flex h-9 w-full items-center justify-end">
        {!loading && (scroll.previous || scroll.next) && (
          <div role="group" aria-label="추천 매거진 이동" className="flex gap-1">
            {([-1, 1] as const).map((direction) => (
              <button
                key={direction}
                type="button"
                aria-label={direction === -1 ? '이전 매거진' : '다음 매거진'}
                title={direction === -1 ? '이전 매거진' : '다음 매거진'}
                aria-controls={trackId}
                disabled={direction === -1 ? !scroll.previous : !scroll.next}
                onClick={() => move(direction)}
                className="text-text-secondary hover:text-text-primary hover:bg-surface-dim flex size-9 items-center justify-center rounded-full transition-colors outline-none focus-visible:ring-2 focus-visible:ring-border-strong disabled:pointer-events-none disabled:opacity-30"
              >
                <svg aria-hidden="true" viewBox="0 0 16 16" fill="none" className="size-3.5">
                  <path
                    d={direction === -1 ? 'M10 3 5 8l5 5' : 'm6 3 5 5-5 5'}
                    stroke="currentColor"
                    strokeWidth="1.3"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </button>
            ))}
          </div>
        )}
      </div>
    </section>
  )
}
