import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'

import { fetchMagazinesByRegion } from '@/features/magazine/api/magazine'
import MagazineImage from '@/features/magazine/components/MagazineImage'
import { useMagazines } from '@/features/magazine/hooks/useMagazines'

import type { Magazine } from '@/types/magazine'

/** 좁은 패널에서는 대표 기사 한 편의 제목과 읽기 동작을 충분히 보여준다. */
export default function SidebarMagazine({ region }: { region?: string }) {
  // 지역을 고르지 않았을 때만 최신 글을 그대로 쓴다.
  const latest = useMagazines({ size: 5 })
  // 매거진은 sidoCode(행안부 2자리)로만 거를 수 있고 지도는 8개 권역이라 1:1이 아니다.
  // 목록 size 상한이 30이라 전부 받아 프론트에서 좁힐 수도 없다 — 코드별로 나눠 받는다.
  const [byRegion, setByRegion] = useState<{ items: Magazine[]; failed: boolean }>()

  useEffect(() => {
    if (!region) return
    let cancelled = false
    setByRegion(undefined)
    fetchMagazinesByRegion(region)
      .then((items) => {
        if (!cancelled) setByRegion({ items, failed: false })
      })
      .catch(() => {
        if (!cancelled) setByRegion({ items: [], failed: true })
      })
    return () => {
      cancelled = true
    }
  }, [region])

  const loading = region ? !byRegion : latest.loading
  const error = region ? byRegion?.failed : latest.error
  const story = region ? byRegion?.items[0] : latest.magazines[0]

  // 보조 영역이라 실패하면 조용히 감춘다 — 지도 탐색을 막지 않는다.
  // 고른 지역에 글이 없을 때도 마찬가지다 (전체 글로 대체하지 않는다).
  if (error || (!loading && !story)) return null

  return (
    <section
      aria-label="지역 매거진"
      aria-busy={loading}
      className="border-border-default/60 mx-5 shrink-0 border-t pt-4 pb-5"
    >
      <div className="flex min-h-8 items-center justify-between gap-3">
        <div className="flex min-w-0 items-baseline gap-2">
          <h2 className="text-text-primary text-[12px] font-semibold tracking-[0.1em]">MAGAZINE</h2>
          <span className="text-text-secondary truncate text-[11px]">
            {region ? `${region}의 온천 이야기` : '온천 이야기'}
          </span>
        </div>
        <Link
          to="/magazine"
          aria-label="매거진 전체보기"
          className="text-text-secondary hover:text-text-primary inline-flex min-h-8 shrink-0 items-center gap-1 text-[11px] outline-none hover:underline focus-visible:underline focus-visible:underline-offset-4"
        >
          전체보기 <span aria-hidden="true">›</span>
        </Link>
      </div>

      {loading ? (
        <div role="status" className="mt-2">
          <span className="sr-only">매거진을 불러오는 중…</span>
          <div aria-hidden="true" className="flex h-24 gap-3 motion-safe:animate-pulse">
            <div className="bg-surface-dim size-24 shrink-0 rounded-[2px]" />
            <div className="flex min-w-0 flex-1 flex-col py-1">
              <div className="bg-border-default/30 h-2 w-24 rounded-full" />
              <div className="bg-border-default/40 mt-3 h-3 w-full rounded-full" />
              <div className="bg-border-default/40 mt-2 h-3 w-3/4 rounded-full" />
              <div className="bg-border-default/30 mt-auto h-2 w-16 rounded-full" />
            </div>
          </div>
        </div>
      ) : (
        story && (
          <Link
            to={`/magazine/${story.magazineId}`}
            className="group mt-2 flex h-24 gap-3 rounded-sm outline-none focus-visible:ring-2 focus-visible:ring-border-strong focus-visible:ring-offset-2"
          >
            <MagazineImage src={story.thumbnailUrl} className="size-24 shrink-0 rounded-[2px]" />
            <div className="flex min-w-0 flex-1 flex-col py-0.5">
              <p className="text-text-secondary truncate text-[10px] leading-4">
                {story.categoryLabel}
                {story.readMinutes > 0 && ` · ${story.readMinutes}분 읽기`}
              </p>
              <h3 className="text-text-primary mt-1 line-clamp-2 text-[15px] leading-5 font-medium group-hover:underline group-hover:underline-offset-4">
                {story.title}
              </h3>
              <span className="text-text-primary mt-auto inline-flex items-center gap-1.5 text-[11px] leading-4">
                이야기 읽기 <span aria-hidden="true">→</span>
              </span>
            </div>
          </Link>
        )
      )}
    </section>
  )
}
