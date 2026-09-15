import type { MyReview } from '@/types/review'

type ReviewItemProps = {
  review: MyReview
  onEdit: (review: MyReview) => void
  onDelete: (review: MyReview) => void
}

/** 2026-08-28T… -> 2026.08.28 */
function formatDate(iso: string): string {
  const date = new Date(iso)
  if (Number.isNaN(date.getTime())) return ''
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${date.getFullYear()}.${month}.${day}`
}

export default function ReviewItem({ review, onEdit, onDelete }: ReviewItemProps) {
  const { onsenName, onsenAddress, rating, content, createdAt, imageUrl } = review

  return (
    <article className="flex gap-4 py-5">
      {imageUrl ? (
        <img src={imageUrl} alt="" className="size-12 shrink-0 rounded-sm object-cover" />
      ) : (
        <div aria-hidden="true" className="bg-surface-dim size-12 shrink-0 rounded-sm" />
      )}

      <div className="flex min-w-0 flex-1 flex-col gap-1.5">
        <div className="flex items-baseline gap-2">
          <h3 className="truncate text-[15px] font-bold">{onsenName}</h3>
          <span className="text-text-secondary shrink-0 text-[12px]">
            {onsenAddress} · {formatDate(createdAt)}
          </span>
        </div>

        {/* 별을 하나씩 늘어놓으면 스크린 리더가 '별 별 별'로 읽는다 — 숫자로 대신 읽힌다. */}
        <p aria-label={`5점 만점에 ${rating}점`} className="text-[13px] tracking-[1px]">
          <span aria-hidden="true">{'★'.repeat(rating)}</span>
        </p>

        <p className="text-[13px] leading-[1.7]">{content}</p>
      </div>

      <div className="text-text-secondary flex shrink-0 items-start gap-2 text-[12px]">
        <button type="button" onClick={() => onEdit(review)} className="hover:text-text-primary">
          수정
        </button>
        <span aria-hidden="true">·</span>
        <button type="button" onClick={() => onDelete(review)} className="hover:text-text-primary">
          삭제
        </button>
      </div>
    </article>
  )
}
