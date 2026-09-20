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
      {/*
        사진이 있으면 맨 위에 크게 둔다 — 리뷰에서 먼저 보게 되는 건 글이 아니라
        사진이다. 여러 장이면 옆으로 밀어 본다. 패널 좌우 여백만큼 밖으로 빼서
        끝까지 닿게 하고, 잘린 사진이 보여야 더 있다는 걸 알 수 있다.
      */}
      {detail.imageUrls && detail.imageUrls.length > 0 && (
        <div className="scrollbar-thin -mx-4 flex gap-2 overflow-x-auto px-4 pb-1">
          {detail.imageUrls.map((url) => (
            <img
              key={url}
              src={url}
              alt=""
              loading="lazy"
              className="bg-surface h-52 shrink-0 rounded-sm object-cover"
            />
          ))}
        </div>
      )}

      {/*
        본문은 펼쳤을 때만 여기서 보여준다 — 목록 행에는 60자로 잘린 미리보기만
        오고(MY-04 bodyPreview), 전문은 상세 응답에만 있다.
        0자를 허용하는 리뷰라(REV-02) 비어 있으면 줄째로 뺀다.
      */}
      {detail.body && (
        <div className="flex flex-col gap-1.5">
          <span className={FIELD_LABEL}>리뷰 내용</span>
          <p className="text-[13px] leading-[1.7] whitespace-pre-wrap [overflow-wrap:anywhere]">
            {detail.body}
          </p>
        </div>
      )}

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
    </div>
  )
}
