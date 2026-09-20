import { useEffect, useId, useMemo, useRef, useState } from 'react'
import { Link } from 'react-router-dom'

import MagazineImage from '@/features/magazine/components/MagazineImage'
import { useMagazines } from '@/features/magazine/hooks/useMagazines'
import MagazineRefreshButton from '@/features/map/components/MagazineRefreshButton'
import { useSidebarCarousel } from '@/features/map/hooks/useSidebarCarousel'
import { cn } from '@/lib/cn'
import { SIDEBAR_CARD_IMAGE, SIDEBAR_CARD_TRACK } from './sidebarCardStyles'

/** 가로 스크롤 한 줄에 들어가는 만큼. 더 받아도 사용자가 끝까지 밀지 않는다. */
const VISIBLE_COUNT = 4
const FETCH_COUNT = 12
const FADE_MS = 120
const SPIN_MS = 450

function takeCircular<T>(items: T[], start: number, count: number) {
  if (items.length <= count) return items
  return Array.from({ length: count }, (_, index) => items[(start + index) % items.length])
}

/**
 * 첫 화면(지역 미선택) 추천 묶음 — 시안의 '지금 이런 곳은 어때요'.
 *
 * 문구를 하드코딩하던 자리다. 추천 로직이 따로 없으므로 매거진 최신 글을 그대로 건다
 * — 눌러서 갈 곳이 있는 편이 "누를 수 없는 카드"보다 낫다.
 * 지역을 고르면 이 자리는 `SidebarMagazine`(그 지역 글)이 대신한다.
 */
export default function SidebarPicks() {
  const { magazines, loading, error } = useMagazines({ size: FETCH_COUNT })
  const trackId = useId()
  const [offset, setOffset] = useState(0)
  const [spinning, setSpinning] = useState(false)
  const [fading, setFading] = useState(false)
  const spinTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const fadeTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const visibleMagazines = useMemo(
    () => takeCircular(magazines, offset, VISIBLE_COUNT),
    [magazines, offset],
  )
  const { trackRef, scroll, move } = useSidebarCarousel(visibleMagazines.length, loading || !!error)

  useEffect(
    () => () => {
      if (spinTimer.current) clearTimeout(spinTimer.current)
      if (fadeTimer.current) clearTimeout(fadeTimer.current)
    },
    [],
  )

  useEffect(() => {
    if (!trackRef.current) return
    trackRef.current.scrollTo({ left: 0, behavior: 'instant' })
  }, [offset, trackRef])

  function refreshMagazines() {
    if (magazines.length <= VISIBLE_COUNT) return
    if (spinTimer.current) clearTimeout(spinTimer.current)
    if (fadeTimer.current) clearTimeout(fadeTimer.current)
    setSpinning(true)
    setFading(true)
    spinTimer.current = setTimeout(() => setSpinning(false), SPIN_MS)
    fadeTimer.current = setTimeout(() => {
      setOffset((current) => (current + VISIBLE_COUNT) % magazines.length)
      setFading(false)
    }, FADE_MS)
  }

  // 보조 영역이라 실패하면 조용히 감춘다 — 지도 탐색을 막지 않는다.
  if (error || (!loading && magazines.length === 0)) return null

  return (
    <section aria-label="추천 매거진" aria-busy={loading} className="w-full min-w-0 shrink-0">
      <div className="flex items-baseline justify-between gap-3">
        {/* 카드가 큰 만큼 제목도 키워 위계를 맞춘다 (다른 섹션 라벨은 11px 유지). */}
        <h2 className="text-text-primary text-[13px] font-medium">지금 이런 곳은 어때요</h2>
        <div className="flex shrink-0 items-center gap-1">
          <MagazineRefreshButton
            spinning={spinning}
            disabled={loading || magazines.length <= VISIBLE_COUNT}
            onClick={refreshMagazines}
          />
          <Link
            to="/magazine"
            className="text-text-secondary shrink-0 text-[11px] outline-none hover:underline focus-visible:underline"
          >
            전체보기
          </Link>
        </div>
      </div>

      <ul
        id={trackId}
        ref={trackRef}
        aria-label="추천 매거진 목록"
        className={cn(
          SIDEBAR_CARD_TRACK,
          'transition-opacity duration-150 motion-reduce:transition-none',
          fading && 'opacity-0',
        )}
      >
        {loading
          ? // 자리를 먼저 잡아 목록이 밀려 올라가지 않게 한다.
            Array.from({ length: VISIBLE_COUNT }, (_, index) => (
              <li key={index} className="min-w-0 snap-start">
                <div className={SIDEBAR_CARD_IMAGE} />
                <div className="bg-surface-dim mt-2 h-3.5 w-3/4 rounded-sm" />
              </li>
            ))
          : visibleMagazines.map((magazine) => (
              <li key={magazine.magazineId} className="min-w-0 snap-start">
                <Link
                  to={`/magazine/${magazine.magazineId}`}
                  className="group block outline-none focus-visible:underline focus-visible:underline-offset-4"
                >
                  <MagazineImage
                    src={magazine.thumbnailUrl}
                    seed={magazine.magazineId}
                    className={SIDEBAR_CARD_IMAGE}
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
