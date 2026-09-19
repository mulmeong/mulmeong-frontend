import { useState, type CSSProperties } from 'react'
import { Link } from 'react-router-dom'

import MapTooltip, { type MapTip } from '@/features/mypage/components/MapTooltip'
import SidoMap from '@/features/mypage/components/SidoMap'
import SigunguMap from '@/features/mypage/components/SigunguMap'
import { useGrapeMap } from '@/features/mypage/hooks/useGrapeMap'
import { useRegionReviews } from '@/features/mypage/hooks/useRegionReviews'
import { regionGrowStyle, SIDO_REGIONS, type SidoRegion } from '@/features/mypage/myMap/sidoRegions'
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

  /** 커서를 따라다니는 말풍선. null이면 감춘다. */
  const [tip, setTip] = useState<MapTip | null>(null)

  // 지도를 갈아끼울 때는 말풍선을 지운다 — 가리키던 도형이 사라져 버린다.
  const handleSelect = (region: SidoRegion) => {
    setSelected(region)
    setTip(null)
  }

  const handleBack = () => {
    setSelected(null)
    setTip(null)
  }

  const nation = useGrapeMap('SIDO')
  const sigungu = useGrapeMap('SIGUNGU', selected?.code)

  // 오른쪽 패널의 리뷰. 포도알 응답에는 리뷰가 없어 목록 API(MY-04)를 따로 부른다.
  // 지역과 개수를 서버에 넘기므로 받아온 걸 화면에서 다시 거르지 않는다.
  const { data: reviewPage } = useRegionReviews(selected?.code, ASIDE_REVIEW_MAX)

  /**
   * 방문 기록을 못 받아와도 지도는 그린다.
   * 도형은 프론트가 들고 있는 정적 데이터이고 서버는 색칠할 횟수만 준다 —
   * 횟수가 없다고 지도까지 없앨 이유는 없다. 색이 전부 0단계로 나올 뿐이다.
   */
  const map = nation.data
  const regions = map?.regions ?? []

  const totalVisits = regions.reduce((sum, region) => sum + region.visitCount, 0)

  const selectedVisits = selected
    ? (regions.find((region) => region.regionCode === selected.code)?.visitCount ?? 0)
    : 0

  // 이미 지역·개수를 서버가 맞춰 보내준다. totalCount는 자르기 전 전체 수다.
  const reviews = reviewPage?.items ?? []
  const reviewCount = reviewPage?.totalCount ?? 0

  return (
    <div className="flex flex-col gap-4 lg:flex-row">
      <div className="border-border-default relative flex flex-1 flex-col items-center rounded-sm border p-4">
        {nation.error ? (
          // 지도는 그대로 두고 사유만 얹는다. 색이 왜 다 옅은지 알 수 있어야 한다.
          <p role="alert" className="text-danger text-center text-[12px]">
            {nation.error} · 방문 기록 없이 지도만 보여드려요
          </p>
        ) : (
          <p className="text-text-secondary text-center text-[12px]">
            {selected
              ? `${selected.name}의 시군구 · 왼쪽 아래 지도를 누르면 전국으로 돌아가요`
              : nation.loading
                ? '방문 기록을 불러오는 중…'
                : // '0 / 17'만 적으면 온천 개수로 읽힌다. 무엇을 세는 수인지 앞에 붙인다.
                  `전국 시·도 ${map?.totalRegions ?? SIDO_REGIONS.length}곳 중 ${map?.totalVisitedRegions ?? 0}곳 방문 · 리뷰를 남기면 그 지역 포도알이 진해져요`}
          </p>
        )}

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
              <SigunguMap sido={selected} regions={sigungu.data?.regions ?? []} onHover={setTip} />
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
              regions={regions}
              selectedCode={selected?.code ?? null}
              // 줄어든 뒤에는 개별 시·도를 고르지 못한다 — 통째로 돌아가기 버튼이 된다.
              onSelect={selected ? undefined : handleSelect}
              // 작아진 지도 위에서는 말풍선을 띄우지 않는다. 도형이 너무 작아
              // 어디를 가리키는지 알아볼 수 없고, 시군구 말풍선과도 엉킨다.
              onHover={selected ? undefined : setTip}
            />
          </div>

          {/*
            돌아가는 자리. 줄어든 지도 위에 같은 크기·같은 위치로 겹쳐 앉는다.
            테두리 없이 투명하게 둬서 작아진 지도만 보이게 한다.
          */}
          <button
            type="button"
            onClick={handleBack}
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

          <MapTooltip tip={tip} />
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
          {selected ? `이 지역 리뷰 ${reviewCount}` : '최신 리뷰'}
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

        {/* 고른 지역이 있으면 내 리뷰 탭의 지역 칩이 눌린 상태로 열린다. */}
        <Link
          to={selected ? `/my/reviews?regionCode=${selected.code}` : '/my/reviews'}
          className="mt-auto pt-6 text-[12px] font-semibold"
        >
          {selected ? '이 지역 리뷰 전체 보기' : '전체 리뷰 보기'} →
        </Link>
      </aside>
    </div>
  )
}
