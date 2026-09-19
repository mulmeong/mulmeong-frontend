import { useState, type CSSProperties } from 'react'
import { Link } from 'react-router-dom'

import SidoMap from '@/features/mypage/components/SidoMap'
import SigunguMap from '@/features/mypage/components/SigunguMap'
import { useGrapeMap } from '@/features/mypage/hooks/useGrapeMap'
import { useMyReviews } from '@/features/mypage/hooks/useMyReviews'
import { regionGrowStyle, type SidoRegion } from '@/features/mypage/myMap/sidoRegions'
import { cn } from '@/lib/cn'

import type { MyReview } from '@/types/myReview'

/** 오른쪽 패널에 띄울 리뷰 수. 지도가 주인공이라 맛보기만 둔다. */
const ASIDE_REVIEW_MAX = 3

/** 2026-08-28T… -> 2026.08.28 */
function formatDate(iso: string): string {
  const date = new Date(iso)
  if (Number.isNaN(date.getTime())) return ''
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${date.getFullYear()}.${month}.${day}`
}

function ReviewRow({ review }: { review: MyReview }) {
  return (
    <li className="flex flex-col gap-1">
      <div className="flex items-baseline gap-2">
        <span className="text-[13px] font-bold">{review.onsenName}</span>
        <span className="text-text-secondary text-[11px]">{formatDate(review.createdAt)}</span>
      </div>
      {/* 별을 하나씩 늘어놓으면 스크린 리더가 '별 별 별'로 읽는다 — 숫자로 대신 읽힌다. */}
      <p aria-label={`5점 만점에 ${review.rating}점`} className="text-[11px] tracking-[1px]">
        <span aria-hidden="true">{'★'.repeat(review.rating)}</span>
      </p>
      <p className="text-text-secondary line-clamp-2 text-[12px] leading-[1.6]">{review.content}</p>
    </li>
  )
}

/** 내 지도 · 담당: 예린 */
export default function MyMapPage() {
  /** 고른 시·도. null이면 전국 지도를 크게 보여준다. */
  const [selected, setSelected] = useState<SidoRegion | null>(null)

  const nation = useGrapeMap('SIDO')
  const sigungu = useGrapeMap('SIGUNGU', selected?.code)

  // 오른쪽 패널의 리뷰. 포도알 응답에는 리뷰가 없어 목록 API를 그대로 쓴다.
  const { data: reviewPage } = useMyReviews('recent', 1, 'all')

  if (nation.loading) {
    return <p className="text-text-secondary py-20 text-center text-[13px]">불러오는 중…</p>
  }

  if (nation.error || !nation.data) {
    return (
      <p role="alert" className="text-danger py-20 text-center text-[13px]">
        {nation.error ?? '내 지도를 불러오지 못했습니다.'}
      </p>
    )
  }

  const map = nation.data
  const totalVisits = map.regions.reduce((sum, region) => sum + region.visitCount, 0)

  const selectedVisits = selected
    ? (map.regions.find((region) => region.regionCode === selected.code)?.visitCount ?? 0)
    : 0

  // 고른 지역이 있으면 그 지역 리뷰만 추린다.
  // TODO: 지금은 받아온 최신 목록에서 거른다. 지역별 리뷰는 따로 받아와야 할 수 있다.
  const allReviews = reviewPage?.items ?? []
  const matched = selected
    ? allReviews.filter((review) => review.onsenAddress.startsWith(selected.name))
    : allReviews

  // 맛보기 셋만 보여준다. 나머지는 아래 '전체 보기'로 넘긴다.
  const reviews = matched.slice(0, ASIDE_REVIEW_MAX)

  return (
    <div className="flex flex-col gap-4 lg:flex-row">
      <div className="border-border-default relative flex flex-1 flex-col items-center rounded-sm border p-4">
        <p className="text-text-secondary text-center text-[12px]">
          {selected
            ? `${selected.name}의 시군구 · 왼쪽 아래 지도를 누르면 전국으로 돌아가요`
            : `리뷰를 남긴 시·도의 포도알이 진해져요 · 지금까지 ${map.totalVisitedRegions} / ${map.totalRegions}곳 방문`}
        </p>

        {/*
          전국 지도와 시군구 지도가 같은 상자를 겹쳐 쓴다.
          시·도를 누르면 전국 지도는 왼쪽 아래로 줄어들고, 그 지역이 있던 자리에서
          시군구 지도가 자라 올라온다. 두 동작이 같은 500ms 안에 일어나 한 덩어리로 보인다.
        */}
        <div className="relative mt-2 aspect-[300/320] w-full max-w-[420px]">
          {selected && (
            <div
              // 다른 시·도로 바로 넘어가도 자라나는 동작이 다시 돌도록 key를 준다.
              key={selected.code}
              // CSS 변수는 CSSProperties에 없는 키라 그대로는 못 넘긴다.
              style={regionGrowStyle(selected) as CSSProperties}
              className="animate-region-grow absolute inset-0 motion-reduce:animate-none"
            >
              <SigunguMap sido={selected} regions={sigungu.data?.regions ?? []} />
            </div>
          )}

          <div
            className={cn(
              'absolute inset-0 origin-bottom-left transition-transform duration-500 ease-[cubic-bezier(0.4,0,0.2,1)] motion-reduce:transition-none',
              // 22%로 줄인 뒤 상자 왼쪽 바깥으로 밀어낸다 — 가운데 시군구 지도와 겹치지 않게.
              // 자리가 없는 좁은 화면에서는 밀지 않고 왼쪽 아래 구석에 둔다.
              selected && 'scale-[0.22] lg:-translate-x-[20%]',
            )}
          >
            <SidoMap
              regions={map.regions}
              selectedCode={selected?.code ?? null}
              // 줄어든 뒤에는 개별 시·도를 고르지 못한다 — 통째로 돌아가기 버튼이 된다.
              onSelect={selected ? undefined : setSelected}
            />
          </div>

          {/*
            돌아가는 자리. 줄어든 지도 위에 같은 크기·같은 위치로 겹쳐 앉는다.
            테두리 없이 투명하게 둬서 작아진 지도만 보이게 한다.
          */}
          <button
            type="button"
            onClick={() => setSelected(null)}
            aria-label="전국 지도로 돌아가기"
            aria-hidden={!selected}
            tabIndex={selected ? 0 : -1}
            className={cn(
              // left는 상자 너비 기준이라 지도를 민 거리(20%)를 그대로 쓸 수 있다.
              // translate를 쓰면 버튼 자기 너비(22%) 기준이라 어긋난다.
              'absolute bottom-0 left-0 h-[22%] w-[22%] lg:left-[-20%]',
              'hover:bg-text-primary/5 rounded-sm transition-opacity duration-300 motion-reduce:transition-none',
              !selected && 'pointer-events-none opacity-0',
            )}
          />
        </div>
      </div>

      <aside className="border-border-default flex w-full flex-col rounded-sm border p-5 lg:w-[280px]">
        <div className="flex items-start justify-between">
          <span className="text-text-secondary text-[12px]">
            {selected ? '선택한 지역' : '내 온천 기록'}
          </span>
          {/* TODO: 공유 기능(MY-01)은 아직 없다. */}
          <button
            type="button"
            className="border-border-strong rounded-full border px-3 py-1 text-[11px]"
          >
            링크 공유
          </button>
        </div>

        {selected ? (
          <p className="mt-3 flex items-baseline gap-2">
            <span className="text-[20px] font-bold">{selected.name}</span>
            <span className="text-text-secondary text-[12px]">· 방문 {selectedVisits}회</span>
          </p>
        ) : (
          <p className="mt-3 flex items-baseline gap-1">
            <span className="text-[26px] font-bold">{totalVisits}</span>
            <span className="text-text-secondary text-[12px]">회 방문</span>
          </p>
        )}

        <p className="border-border-default text-text-secondary mt-4 border-t pt-4 text-[12px]">
          {selected ? `이 지역 리뷰 ${matched.length}` : '최신 리뷰'}
        </p>

        {reviews.length > 0 ? (
          <ul className="mt-3 flex flex-col gap-4">
            {reviews.map((review) => (
              <ReviewRow key={review.id} review={review} />
            ))}
          </ul>
        ) : (
          <p className="text-text-secondary mt-3 text-[12px]">아직 남긴 리뷰가 없어요.</p>
        )}

        <Link to="/my/reviews" className="mt-auto pt-6 text-[12px] font-semibold">
          {selected ? '이 지역 리뷰 전체 보기' : '전체 리뷰 보기'} →
        </Link>
      </aside>
    </div>
  )
}
