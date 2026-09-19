import { useEffect, useState } from 'react'

import { ApiError } from '@/api'
import { getReviewDetail } from '@/features/mypage/api/reviews'

import { SPEC_FIELDS, type MyReviewDetail } from '@/types/myReview'
import { VISIT_TIME_LABELS } from '@/types/review'

type ReviewDetailPanelProps = {
  reviewId: number
  /** 목록의 토글 버튼이 aria-controls로 가리키는 id. */
  id: string
}

const FIELD_LABEL = 'text-text-secondary text-[12px]'

/**
 * 목록에서 리뷰를 눌렀을 때 아래로 펼쳐지는 상세.
 *
 * 열릴 때만 그려지므로 마운트 시점에 한 번 받아온다. 한 번에 하나만 열리고
 * 닫으면 사라지기 때문에 따로 캐시를 두지 않았다 — 같은 리뷰를 여닫으면
 * 다시 부른다. 잦아지면 그때 훅으로 빼는 게 낫다.
 */
export default function ReviewDetailPanel({ reviewId, id }: ReviewDetailPanelProps) {
  const [detail, setDetail] = useState<MyReviewDetail>()
  const [error, setError] = useState<string>()

  useEffect(() => {
    let cancelled = false

    const fetchDetail = async () => {
      try {
        const result = await getReviewDetail(reviewId)
        if (!cancelled) setDetail(result)
      } catch (cause) {
        if (!cancelled) {
          setError(cause instanceof ApiError ? cause.message : '리뷰를 불러오지 못했습니다.')
        }
      }
    }

    // 서버에서 값을 받아오는 일은 effect가 맞는 자리다. useMyReviews도 같은 구조다.
    void fetchDetail()

    return () => {
      cancelled = true
    }
  }, [reviewId])

  if (error) {
    return (
      <p role="alert" id={id} className="text-danger bg-surface-dim px-4 py-5 text-[13px]">
        {error}
      </p>
    )
  }

  if (!detail) {
    return (
      <p id={id} className="text-text-secondary bg-surface-dim px-4 py-5 text-[13px]">
        불러오는 중…
      </p>
    )
  }

  return (
    <div id={id} className="bg-surface-dim flex flex-col gap-4 px-4 py-5">
      <div className="flex gap-6">
        <div className="flex flex-col gap-1">
          <span className={FIELD_LABEL}>방문 시간대</span>
          <span className="text-[13px]">{VISIT_TIME_LABELS[detail.spec.visitTime]}</span>
        </div>
        <div className="flex flex-col gap-1">
          <span className={FIELD_LABEL}>방문일</span>
          <span className="text-[13px]">{detail.visitedAt.replaceAll('-', '.')}</span>
        </div>
      </div>

      <div className="flex flex-col gap-1.5">
        <span className={FIELD_LABEL}>세부 평가</span>
        <div className="flex flex-col gap-1">
          {SPEC_FIELDS.map((field) => (
            <div key={field.key} className="flex items-center gap-2 text-[13px]">
              <span className="w-[60px] shrink-0">{field.label}</span>
              {/* 별은 장식이다 — 점수는 바로 뒤 숫자가 말한다. */}
              <span aria-hidden="true" className="tracking-[1px]">
                {'★'.repeat(detail.spec[field.key])}
              </span>
              <span className="text-text-secondary text-[12px]">
                {detail.spec[field.key]}점{/* 혼잡도는 높다고 좋은 게 아니라, 뜻을 같이 적는다. */}
                {field.key === 'crowd' && ` · ${detail.spec.crowd >= 4 ? field.high : field.low}`}
              </span>
            </div>
          ))}
        </div>
      </div>

      {detail.imageUrls && detail.imageUrls.length > 0 && (
        <div className="flex flex-col gap-1.5">
          <span className={FIELD_LABEL}>사진</span>
          <div className="flex flex-wrap gap-2">
            {detail.imageUrls.map((url) => (
              <img
                key={url}
                src={url}
                alt=""
                className="bg-surface size-[52px] rounded-sm object-cover"
              />
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
