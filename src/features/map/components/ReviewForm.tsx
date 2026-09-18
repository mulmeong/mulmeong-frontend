import { useState, type FormEvent } from 'react'

import { ApiError } from '@/api'
import { createReview } from '@/features/map/api/review'
import { todayInKst } from '@/features/map/api/reviewMock'
import { cn } from '@/lib/cn'
import {
  RATING_MAX,
  RATING_MIN,
  REVIEW_BODY_MAX,
  VISIT_TIMES,
  VISIT_TIME_LABELS,
} from '@/types/review'

import type { CreateReviewResult, VisitTime } from '@/types/review'

type ReviewFormProps = {
  onsenId: number
  onCancel: () => void
  onCreated: (result: CreateReviewResult) => void
}

const SCORES = [1, 2, 3, 4, 5]

/** 스펙 항목 — 낮은 쪽·높은 쪽 뜻이 달라 양 끝 라벨을 같이 보여준다. */
const SPEC_FIELDS = [
  { key: 'clean', label: '청결도', low: '아쉬움', high: '만족' },
  { key: 'crowd', label: '혼잡도', low: '한산', high: '붐빔' },
  { key: 'facility', label: '시설', low: '아쉬움', high: '만족' },
] as const

function StarRating({ value, onChange }: { value: number; onChange: (next: number) => void }) {
  return (
    <div className="mt-2 flex gap-1">
      {SCORES.map((score) => (
        <button
          key={score}
          type="button"
          onClick={() => onChange(score)}
          aria-label={`${score}점`}
          aria-pressed={value === score}
          className={cn(
            'text-[22px] leading-none transition-colors outline-none',
            score <= value ? 'text-text-primary' : 'text-border-default',
          )}
        >
          ★
        </button>
      ))}
    </div>
  )
}

function ScoreRow({
  label,
  low,
  high,
  value,
  onChange,
}: {
  label: string
  low: string
  high: string
  value: number
  onChange: (next: number) => void
}) {
  return (
    <div>
      <div className="flex items-baseline justify-between">
        <span className="text-text-primary text-[13px]">{label}</span>
        <span className="text-text-secondary text-[11px]">
          {low} · {high}
        </span>
      </div>
      <div className="mt-1.5 flex gap-1.5">
        {SCORES.map((score) => (
          <button
            key={score}
            type="button"
            onClick={() => onChange(score)}
            aria-label={`${label} ${score}점`}
            aria-pressed={value === score}
            className={cn(
              'h-8 flex-1 rounded-sm border text-[12px] transition-colors outline-none',
              value === score
                ? 'bg-inverse text-text-inverse border-transparent font-medium'
                : 'border-border-default text-text-primary hover:bg-surface-dim',
            )}
          >
            {score}
          </button>
        ))}
      </div>
    </div>
  )
}

/** REV-01 리뷰 작성 = 방문 인증. 사진(602)은 업로드 명세가 오면 더한다. */
export default function ReviewForm({ onsenId, onCancel, onCreated }: ReviewFormProps) {
  const today = todayInKst()

  const [rating, setRating] = useState(0)
  const [visitedAt, setVisitedAt] = useState(today)
  const [visitTime, setVisitTime] = useState<VisitTime>('AFTERNOON')
  const [clean, setClean] = useState(0)
  const [crowd, setCrowd] = useState(0)
  const [facility, setFacility] = useState(0)
  const [body, setBody] = useState('')

  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string>()

  // 명세상 별점과 스펙 3종이 필수다. 본문은 0자를 허용한다 (REV-02).
  const canSubmit =
    rating >= RATING_MIN && rating <= RATING_MAX && clean > 0 && crowd > 0 && facility > 0

  async function handleSubmit(event: FormEvent) {
    event.preventDefault()
    if (!canSubmit || submitting) return

    setSubmitting(true)
    setError(undefined)

    try {
      const result = await createReview(onsenId, {
        rating,
        visitedAt,
        spec: { visitTime, clean, crowd, facility },
        body: body.trim(),
      })
      onCreated(result)
    } catch (err) {
      setError(
        err instanceof ApiError
          ? err.message
          : '리뷰를 저장하지 못했어요. 잠시 후 다시 시도해주세요.',
      )
      setSubmitting(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-5">
      <div>
        <h3 className="text-text-primary text-[14px] font-semibold">이번 방문은 어땠나요?</h3>
        <StarRating value={rating} onChange={setRating} />
      </div>

      <div>
        <label htmlFor="visitedAt" className="text-text-primary text-[13px]">
          방문일
        </label>
        <input
          id="visitedAt"
          type="date"
          value={visitedAt}
          // 미래 방문일은 서버가 400으로 막는다 — 입력에서 먼저 잘라낸다.
          max={today}
          onChange={(e) => setVisitedAt(e.target.value)}
          className="border-border-default text-text-primary mt-1.5 h-9 w-full rounded-sm border px-2.5 text-[13px] outline-none"
        />
      </div>

      <div>
        <span className="text-text-primary text-[13px]">방문 시간대</span>
        <div className="mt-1.5 flex gap-1.5">
          {VISIT_TIMES.map((time) => (
            <button
              key={time}
              type="button"
              onClick={() => setVisitTime(time)}
              aria-pressed={visitTime === time}
              className={cn(
                'h-8 flex-1 rounded-sm border text-[12px] transition-colors outline-none',
                visitTime === time
                  ? 'bg-inverse text-text-inverse border-transparent font-medium'
                  : 'border-border-default text-text-primary hover:bg-surface-dim',
              )}
            >
              {VISIT_TIME_LABELS[time]}
            </button>
          ))}
        </div>
      </div>

      {SPEC_FIELDS.map((field) => {
        const value = field.key === 'clean' ? clean : field.key === 'crowd' ? crowd : facility
        const setter =
          field.key === 'clean' ? setClean : field.key === 'crowd' ? setCrowd : setFacility
        return (
          <ScoreRow
            key={field.key}
            label={field.label}
            low={field.low}
            high={field.high}
            value={value}
            onChange={setter}
          />
        )
      })}

      <div>
        <div className="flex items-baseline justify-between">
          <label htmlFor="reviewBody" className="text-text-primary text-[13px]">
            한마디 <span className="text-text-secondary text-[11px]">(선택)</span>
          </label>
          <span className="text-text-secondary text-[11px]">
            {body.length}/{REVIEW_BODY_MAX}
          </span>
        </div>
        <textarea
          id="reviewBody"
          value={body}
          maxLength={REVIEW_BODY_MAX}
          onChange={(e) => setBody(e.target.value)}
          rows={3}
          placeholder="어떤 점이 좋았는지 남겨주세요."
          className="border-border-default text-text-primary mt-1.5 w-full resize-none rounded-sm border px-2.5 py-2 text-[13px] leading-[1.6] outline-none"
        />
      </div>

      {error && (
        <p role="alert" className="text-danger text-[12px] leading-[1.5]">
          {error}
        </p>
      )}

      <div className="flex gap-2">
        <button
          type="button"
          onClick={onCancel}
          className="border-border-default text-text-primary h-10 flex-1 rounded-sm border text-[13px] outline-none"
        >
          취소
        </button>
        <button
          type="submit"
          disabled={!canSubmit || submitting}
          className={cn(
            'h-10 flex-[2] rounded-sm text-[13px] font-medium transition-colors outline-none',
            canSubmit && !submitting
              ? 'bg-inverse text-text-inverse'
              : 'bg-surface-dim text-text-secondary cursor-not-allowed',
          )}
        >
          {submitting ? '올리는 중…' : '리뷰 남기기'}
        </button>
      </div>
    </form>
  )
}
