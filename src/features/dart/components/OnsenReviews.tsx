import { useState } from 'react'

import ReviewContent from '@/components/ReviewContent'
import { useOnsenReviews } from '@/features/dart/hooks/useOnsenReviews'
import { cn } from '@/lib/cn'

import {
  ONSEN_REVIEW_SORTS,
  VISIT_TIME_LABELS,
  type OnsenReview,
  type OnsenReviewSort,
} from '@/types/review'

const SORTS = Object.entries(ONSEN_REVIEW_SORTS) as [OnsenReviewSort, string][]

/** 2026-09-14 -> 2026.09.14 */
function formatDate(value: string): string {
  return value.slice(0, 10).replaceAll('-', '.')
}

function ReviewRow({ review }: { review: OnsenReview }) {
  const { author, spec } = review

  // 탈퇴 회원은 닉네임만 남고 레벨·칭호가 null이다.
  const who = [author.level != null && `LV.${author.level}`, author.title]
    .filter(Boolean)
    .join(' · ')

  const detail = [
    VISIT_TIME_LABELS[spec.visitTime],
    `청결 ${spec.clean}`,
    `혼잡 ${spec.crowd}`,
    `시설 ${spec.facility}`,
  ].join(' · ')

  return (
    <li className="flex flex-col gap-1.5 py-4">
      <div className="flex items-baseline justify-between gap-2">
        <span className="min-w-0 truncate text-[13px] font-semibold text-[#0E1513]">
          {author.nickname}
          {who && <span className="font-normal text-[#8A9491]"> {who}</span>}
        </span>
        <span className="shrink-0 text-[11.5px] text-[#8A9491]">
          {formatDate(review.visitedAt)}
        </span>
      </div>

      <div className="flex flex-wrap items-center gap-1.5">
        {/* 별을 하나씩 늘어놓으면 스크린 리더가 '별 별 별'로 읽는다 — 숫자로 대신 읽힌다. */}
        <p aria-label={`5점 만점에 ${review.rating}점`} className="text-[11px] tracking-[1px]">
          <span aria-hidden="true">{'★'.repeat(review.rating)}</span>
        </p>
        {review.isMine && (
          <span className="bg-[#0E1513] px-1.5 py-0.5 text-[10px] font-bold text-white">
            내 리뷰
          </span>
        )}
        {review.isRevisit && <span className="text-[11px] text-[#8A9491]">재방문</span>}
        {review.isEdited && <span className="text-[11px] text-[#8A9491]">수정됨</span>}
      </div>

      <p className="text-[11.5px] text-[#8A9491]">{detail}</p>

      <ReviewContent body={review.body} images={review.images} />
    </li>
  )
}

/** '리뷰' 탭 — 온천별 공개 리뷰 목록 (REV-07). */
export default function OnsenReviews({ onsenId }: { onsenId: number }) {
  const [sort, setSort] = useState<OnsenReviewSort>('RECENT')
  const reviews = useOnsenReviews(onsenId, sort)

  return (
    <div className="flex flex-col px-[30px] pt-5 pb-6">
      <div className="flex items-center justify-between gap-2">
        <span className="text-[12px] text-[#8A9491]">리뷰 {reviews.total}</span>
        <div className="flex gap-1.5">
          {SORTS.map(([id, label]) => (
            <button
              key={id}
              type="button"
              aria-pressed={sort === id}
              onClick={() => setSort(id)}
              className={cn(
                'rounded-full border px-2.5 py-1 text-[11.5px]',
                sort === id
                  ? 'border-[#0E1513] bg-[#0E1513] font-semibold text-white'
                  : 'border-[#D8DCDB] text-[#5D6764]',
              )}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {reviews.loading ? (
        <p role="status" className="py-5 text-[13px] text-[#8A9491]">
          불러오는 중…
        </p>
      ) : reviews.items.length === 0 ? (
        <p className="py-5 text-[13px] leading-[1.6] text-[#8A9491]">
          {reviews.error ?? '아직 리뷰가 없어요. 다녀오셨다면 첫 리뷰를 남겨보세요.'}
        </p>
      ) : (
        <ul className="flex flex-col divide-y divide-[#E2E5E4]">
          {reviews.items.map((review) => (
            <ReviewRow key={review.reviewId} review={review} />
          ))}
        </ul>
      )}

      {/* 목록이 남아 있는 채로 더 보기만 실패했을 때. */}
      {reviews.error && reviews.items.length > 0 && (
        <p role="alert" className="pt-3 text-[12px] text-[#B4443A]">
          {reviews.error}
        </p>
      )}

      {reviews.hasMore && (
        <button
          type="button"
          onClick={() => void reviews.loadMore()}
          disabled={reviews.loadingMore}
          className="mt-4 border border-[#D8DCDB] py-3 text-[13px] text-[#0E1513] disabled:opacity-40"
        >
          {reviews.loadingMore ? '불러오는 중…' : '더 보기'}
        </button>
      )}
    </div>
  )
}
