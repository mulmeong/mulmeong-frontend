import { getMockReviews } from '@/features/map/api/reviewMock'

import type { OnsenListItem } from '@/features/map/api/map'

/** 목 모드에서만 렌더한다. 리뷰 작성·저장 기능은 포함하지 않는다. */
export default function MockReviewList({ onsen }: { onsen: OnsenListItem }) {
  const reviews = getMockReviews(onsen.id, onsen.reviewCount)

  if (reviews.length === 0) {
    return <p className="text-text-secondary text-[13px]">아직 등록된 리뷰가 없습니다.</p>
  }

  return (
    <section aria-label={`${onsen.name} 방문 리뷰`}>
      <div className="flex items-baseline justify-between gap-3">
        <h3 className="text-text-primary text-[14px] font-semibold">최근 방문 리뷰</h3>
        <span className="text-text-secondary text-[11px]">
          전체 {onsen.reviewCount}개 중 {reviews.length}개
        </span>
      </div>
      <ul className="divide-border-default mt-1 divide-y">
        {reviews.map((review) => (
          <li key={review.id} className="py-4">
            <div className="flex items-center gap-2">
              <span
                aria-hidden
                className="bg-surface-dim flex size-8 shrink-0 items-center justify-center rounded-full text-[12px]"
              >
                {review.nickname.charAt(0)}
              </span>
              <div className="min-w-0 flex-1">
                <p className="text-text-primary text-[12px] font-medium">{review.nickname}</p>
                <time dateTime={review.visitedAt} className="text-text-secondary text-[11px]">
                  {review.visitedAt.replaceAll('-', '.')} 방문
                </time>
              </div>
              <span
                className="text-text-primary text-[12px]"
                aria-label={`별점 ${review.rating}점`}
              >
                ★ {review.rating.toFixed(1)}
              </span>
            </div>
            <p className="text-text-primary mt-3 text-[13px] leading-[1.7]">{review.content}</p>
            {review.imageUrl && (
              <img
                src={review.imageUrl}
                alt="방문 리뷰 사진"
                loading="lazy"
                className="bg-surface-dim mt-3 h-20 w-28 rounded-sm object-cover"
              />
            )}
          </li>
        ))}
      </ul>
    </section>
  )
}
