import { useEffect, useRef, useState, type ChangeEvent, type FormEvent } from 'react'

import { ApiError } from '@/api'
import { Button } from '@/components/ui'
import { createReview } from '@/features/map/api/review'
import {
  REVIEW_IMAGE_SIZE_MAX,
  REVIEW_IMAGE_TYPES,
  uploadReviewImages,
} from '@/features/map/api/reviewImages'
import { todayInKst } from '@/features/map/api/reviewMock'
import { cn } from '@/lib/cn'
import { env } from '@/lib/env'
import {
  RATING_MAX,
  RATING_MIN,
  REVIEW_BODY_MAX,
  REVIEW_IMAGE_MAX,
  VISIT_TIMES,
  VISIT_TIME_LABELS,
} from '@/types/review'

import type { CreateReviewResult, VisitTime } from '@/types/review'

type ReviewFormProps = {
  onsenId: number
  onCancel: () => void
  onCreated: (result: CreateReviewResult) => void
}

type ReviewPhoto = { file: File; previewUrl: string }

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
              'text-text-primary h-8 flex-1 rounded-sm border text-[12px] transition-colors outline-none focus-visible:ring-2 focus-visible:ring-inverse/60 focus-visible:ring-offset-2',
              value === score
                ? 'bg-surface-dim border-border-strong/60 font-semibold hover:bg-inverse/5'
                : 'bg-surface border-border-default hover:bg-surface-dim/50 hover:border-border-strong/40',
            )}
          >
            {score}
          </button>
        ))}
      </div>
    </div>
  )
}

/** REV-01 리뷰 작성 = 방문 인증. */
export default function ReviewForm({ onsenId, onCancel, onCreated }: ReviewFormProps) {
  const today = todayInKst()

  const [rating, setRating] = useState(0)
  const [visitedAt, setVisitedAt] = useState(today)
  const [visitTime, setVisitTime] = useState<VisitTime>('AFTERNOON')
  const [clean, setClean] = useState(0)
  const [crowd, setCrowd] = useState(0)
  const [facility, setFacility] = useState(0)
  const [body, setBody] = useState('')
  const [photos, setPhotos] = useState<ReviewPhoto[]>([])
  const photoInput = useRef<HTMLInputElement>(null)
  const previews = useRef(new Set<string>())
  const uploadedUrls = useRef(new Map<File, string>())
  const pending = useRef<AbortController | null>(null)

  useEffect(() => {
    const urls = previews.current
    return () => {
      pending.current?.abort()
      urls.forEach((url) => URL.revokeObjectURL(url))
      urls.clear()
    }
  }, [])

  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string>()

  // 명세상 별점과 스펙 3종이 필수다. 본문은 0자를 허용한다 (REV-02).
  const canSubmit =
    rating >= RATING_MIN && rating <= RATING_MAX && clean > 0 && crowd > 0 && facility > 0

  function handlePhotos(event: ChangeEvent<HTMLInputElement>) {
    const files = Array.from(event.target.files ?? [])
    event.target.value = ''
    if (files.length === 0 || pending.current) return
    if (photos.length + files.length > REVIEW_IMAGE_MAX) {
      setError(`사진은 최대 ${REVIEW_IMAGE_MAX}장까지 첨부할 수 있어요.`)
      return
    }
    if (files.some((file) => !REVIEW_IMAGE_TYPES.includes(file.type))) {
      setError('JPG, PNG, WebP 사진만 첨부할 수 있어요.')
      return
    }
    if (files.some((file) => file.size === 0 || file.size > REVIEW_IMAGE_SIZE_MAX)) {
      setError('사진은 빈 파일이 아닌 장당 10MB 이하의 파일을 선택해주세요.')
      return
    }
    const added = files.map((file) => {
      const previewUrl = URL.createObjectURL(file)
      previews.current.add(previewUrl)
      return { file, previewUrl }
    })
    setPhotos((current) => [...current, ...added])
    setError(undefined)
  }

  function removePhoto({ file, previewUrl }: ReviewPhoto) {
    if (pending.current) return
    URL.revokeObjectURL(previewUrl)
    previews.current.delete(previewUrl)
    uploadedUrls.current.delete(file)
    setPhotos((current) => current.filter((photo) => photo.file !== file))
    setError(undefined)
  }

  async function handleSubmit(event: FormEvent) {
    event.preventDefault()
    if (!canSubmit || pending.current) return

    const controller = new AbortController()
    pending.current = controller
    setSubmitting(true)
    setError(undefined)

    try {
      if (!env.useMock) {
        await uploadReviewImages(
          photos.map((photo) => photo.file).filter((file) => !uploadedUrls.current.has(file)),
          (file, url) => uploadedUrls.current.set(file, url),
          controller.signal,
        )
      }
      if (controller.signal.aborted) return
      const result = await createReview(onsenId, {
        rating,
        visitedAt,
        spec: { visitTime, clean, crowd, facility },
        body: body.trim(),
        ...(photos.length > 0 && {
          imageUrls: photos.map(({ file, previewUrl }) =>
            env.useMock ? previewUrl : uploadedUrls.current.get(file)!,
          ),
        }),
      })
      if (!controller.signal.aborted) onCreated(result)
    } catch (err) {
      if (controller.signal.aborted) return
      setError(
        err instanceof ApiError
          ? err.message
          : '리뷰를 저장하지 못했어요. 잠시 후 다시 시도해주세요.',
      )
    } finally {
      pending.current = null
      if (!controller.signal.aborted) setSubmitting(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} aria-busy={submitting}>
      <fieldset disabled={submitting} className="flex min-w-0 flex-col gap-5">
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
                  'text-text-primary h-8 flex-1 rounded-sm border text-[12px] transition-colors outline-none focus-visible:ring-2 focus-visible:ring-inverse/60 focus-visible:ring-offset-2',
                  visitTime === time
                    ? 'bg-surface-dim border-border-strong/60 font-semibold hover:bg-inverse/5'
                    : 'bg-surface border-border-default hover:bg-surface-dim/50 hover:border-border-strong/40',
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

        <div>
          <div className="flex items-center justify-between gap-2">
            <label htmlFor="reviewPhotos" className="text-text-primary text-[13px]">
              사진 <span className="text-text-secondary text-[11px]">(선택)</span>
            </label>
            <Button
              hierarchy="secondary"
              className="px-2.5 py-1.5 text-[12px]"
              disabled={submitting || photos.length >= REVIEW_IMAGE_MAX}
              onClick={() => photoInput.current?.click()}
            >
              사진 추가 ({photos.length}/{REVIEW_IMAGE_MAX})
            </Button>
          </div>
          <input
            ref={photoInput}
            id="reviewPhotos"
            type="file"
            accept={REVIEW_IMAGE_TYPES.join(',')}
            multiple
            hidden
            onChange={handlePhotos}
          />
          <p className="text-text-secondary mt-1.5 text-[11px]">JPG, PNG, WebP · 장당 10MB 이하</p>
          {photos.length > 0 && (
            <ul className="mt-2 grid grid-cols-3 gap-2">
              {photos.map((photo, index) => (
                <li key={photo.previewUrl} className="relative min-w-0">
                  <img
                    src={photo.previewUrl}
                    alt={`첨부 사진 ${index + 1}`}
                    className="aspect-square w-full rounded-sm object-cover"
                  />
                  <button
                    type="button"
                    onClick={() => removePhoto(photo)}
                    aria-label={`${photo.file.name} 삭제`}
                    title="사진 삭제"
                    className="bg-inverse text-text-inverse absolute top-1 right-1 flex h-7 w-7 items-center justify-center rounded-sm text-[18px] focus-visible:ring-2 disabled:opacity-40"
                  >
                    ×
                  </button>
                  <p
                    className="text-text-secondary mt-1 truncate text-[11px]"
                    title={photo.file.name}
                  >
                    {photo.file.name}
                  </p>
                </li>
              ))}
            </ul>
          )}
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
                : 'bg-surface-dim text-text-secondary',
            )}
          >
            {submitting ? '올리는 중…' : '리뷰 남기기'}
          </button>
        </div>
      </fieldset>
    </form>
  )
}
