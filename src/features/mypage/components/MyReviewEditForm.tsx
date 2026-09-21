import { useEffect, useRef, useState, type ChangeEvent, type FormEvent } from 'react'

import { ApiError } from '@/api'
import {
  REVIEW_IMAGE_SIZE_MAX,
  REVIEW_IMAGE_TYPES,
  uploadReviewImages,
} from '@/features/map/api/reviewImages'
import { updateReview } from '@/features/mypage/api/reviews'
import { cn } from '@/lib/cn'
import { env } from '@/lib/env'
import { SPEC_FIELDS, type MyReviewDetail } from '@/types/myReview'
import {
  RATING_MAX,
  RATING_MIN,
  REVIEW_BODY_MAX,
  REVIEW_IMAGE_MAX,
  VISIT_TIMES,
  VISIT_TIME_LABELS,
} from '@/types/review'

import type { VisitTime } from '@/types/review'

/** 새로 고른 사진. 올리기 전이라 아직 URL이 없다. */
type NewPhoto = { file: File; previewUrl: string }

type MyReviewEditFormProps = {
  detail: MyReviewDetail
  onCancel: () => void
  onUpdated: () => void
}

const SCORES = [1, 2, 3, 4, 5]

/*
 * 아래 StarRating·ScoreRow와 폼 구조는 features/map/components/ReviewForm.tsx에서
 * 복사해 왔다. 작성 화면과 수정 화면이 같아 보여야 해서다.
 *
 * 공통 컴포넌트로 빼지 않은 건, 그쪽이 다른 팀원 담당이라 지금 고치면 충돌이 나서다.
 * 나중에 협의해서 합칠 것. 그때까지 한쪽을 고치면 다른 쪽도 같이 봐야 한다.
 */

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

/** 이미 쓴 리뷰 고치기. 값이 채워진 채로 열린다는 점만 작성과 다르다. */
export default function MyReviewEditForm({ detail, onCancel, onUpdated }: MyReviewEditFormProps) {
  const [rating, setRating] = useState(detail.rating)
  const [visitTime, setVisitTime] = useState<VisitTime>(detail.spec.visitTime)
  const [clean, setClean] = useState(detail.spec.clean)
  const [crowd, setCrowd] = useState(detail.spec.crowd)
  const [facility, setFacility] = useState(detail.spec.facility)
  const [body, setBody] = useState(detail.body ?? '')

  /**
   * 사진은 두 갈래로 든다 — 이미 올라가 있는 것(URL)과 방금 고른 것(File).
   * 저장할 때 새 파일만 올려 URL을 받고, 둘을 이어 붙여 한 배열로 보낸다.
   *
   * imageUrls는 전체 교체라(REV-05 비고) 보낸 배열이 곧 남는 사진의 전부다.
   * 순서도 그대로 노출 순서가 되므로 기존 것을 앞에 둔다.
   */
  const [keptUrls, setKeptUrls] = useState(detail.imageUrls ?? [])
  const [newPhotos, setNewPhotos] = useState<NewPhoto[]>([])

  const photoCount = keptUrls.length + newPhotos.length

  const previews = useRef(new Set<string>())
  const uploadedUrls = useRef(new Map<File, string>())
  const pending = useRef<AbortController | null>(null)

  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string>()

  // 화면을 떠나면 올리던 요청을 끊고 미리보기 URL을 놓아준다.
  useEffect(() => {
    const urls = previews.current
    return () => {
      pending.current?.abort()
      urls.forEach((url) => URL.revokeObjectURL(url))
      urls.clear()
    }
  }, [])

  function addPhotos(event: ChangeEvent<HTMLInputElement>) {
    const files = Array.from(event.target.files ?? [])
    // 같은 파일을 다시 고를 수 있게 비운다.
    event.target.value = ''
    if (files.length === 0 || pending.current) return

    // 남겨둔 기존 사진까지 합쳐서 센다 — 서버가 보는 건 합친 배열이다.
    if (photoCount + files.length > REVIEW_IMAGE_MAX) {
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
    setNewPhotos((current) => [...current, ...added])
    setError(undefined)
  }

  function removeKept(url: string) {
    if (pending.current) return
    setKeptUrls((current) => current.filter((it) => it !== url))
    setError(undefined)
  }

  function removeNew({ file, previewUrl }: NewPhoto) {
    if (pending.current) return
    URL.revokeObjectURL(previewUrl)
    previews.current.delete(previewUrl)
    uploadedUrls.current.delete(file)
    setNewPhotos((current) => current.filter((photo) => photo.file !== file))
    setError(undefined)
  }

  // 명세상 별점과 스펙 3종이 필수다. 본문은 0자를 허용한다 (REV-02).
  const canSubmit =
    rating >= RATING_MIN && rating <= RATING_MAX && clean > 0 && crowd > 0 && facility > 0

  async function handleSubmit(event: FormEvent) {
    event.preventDefault()
    if (!canSubmit || pending.current) return

    const controller = new AbortController()
    pending.current = controller
    setSubmitting(true)
    setError(undefined)

    try {
      // 이미 올린 파일은 건너뛴다 — 저장이 실패해 다시 눌러도 두 번 올리지 않는다.
      if (!env.useMock) {
        await uploadReviewImages(
          newPhotos.map((photo) => photo.file).filter((file) => !uploadedUrls.current.has(file)),
          (file, url) => uploadedUrls.current.set(file, url),
          controller.signal,
        )
      }
      if (controller.signal.aborted) return

      await updateReview(detail.id, {
        rating,
        spec: { visitTime, clean, crowd, facility },
        body: body.trim(),
        // 전체 교체다. 이 배열에 없는 사진은 지워진다.
        imageUrls: [
          ...keptUrls,
          ...newPhotos.map(({ file, previewUrl }) =>
            env.useMock ? previewUrl : uploadedUrls.current.get(file)!,
          ),
        ],
      })
      if (!controller.signal.aborted) onUpdated()
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
    <form onSubmit={handleSubmit} className="flex flex-col gap-5">
      <div>
        <h3 className="text-text-primary text-[14px] font-semibold">이번 방문은 어땠나요?</h3>
        <StarRating value={rating} onChange={setRating} />
      </div>

      {/*
        방문일은 고칠 수 없다 (REV-05 비고) — 방문 인증 날짜이자 하루 한 번
        제한의 기준이라 서버가 막는다. 입력칸 대신 값만 보여주고 왜 못 고치는지
        적어둔다. 칸을 지워버리면 "왜 없지" 하고 찾게 된다.
      */}
      <div>
        <span className="text-text-primary text-[13px]">방문일</span>
        <p className="text-text-primary mt-1.5 text-[13px]">
          {detail.visitedAt.replaceAll('-', '.')}
        </p>
        <p className="text-text-secondary mt-1 text-[12px]">
          방문일은 고칠 수 없어요. 바꾸려면 지우고 다시 써주세요.
        </p>
      </div>

      {/*
        기존 사진과 새로 고른 사진을 한 줄에 같이 늘어놓는다. 저장하면 여기
        보이는 순서 그대로 남는다 — 서버가 배열을 통째로 갈아끼운다.
      */}
      <div>
        <div className="flex items-baseline justify-between">
          <span className="text-text-primary text-[13px]">사진</span>
          <span className="text-text-secondary text-[11px]">
            {photoCount} / {REVIEW_IMAGE_MAX}
          </span>
        </div>

        <ul className="mt-1.5 flex flex-wrap gap-2">
          {keptUrls.map((url) => (
            <li key={url} className="relative">
              <img src={url} alt="" className="bg-surface-dim size-16 rounded-sm object-cover" />
              <button
                type="button"
                onClick={() => removeKept(url)}
                aria-label="이 사진 빼기"
                className="bg-inverse text-text-inverse absolute -top-1.5 -right-1.5 grid size-5 place-items-center rounded-full text-[11px] leading-none"
              >
                ✕
              </button>
            </li>
          ))}

          {newPhotos.map((photo) => (
            <li key={photo.previewUrl} className="relative">
              <img
                src={photo.previewUrl}
                alt=""
                className="bg-surface-dim size-16 rounded-sm object-cover"
              />
              <button
                type="button"
                onClick={() => removeNew(photo)}
                aria-label="이 사진 빼기"
                className="bg-inverse text-text-inverse absolute -top-1.5 -right-1.5 grid size-5 place-items-center rounded-full text-[11px] leading-none"
              >
                ✕
              </button>
            </li>
          ))}

          {photoCount < REVIEW_IMAGE_MAX && (
            <li>
              {/*
                input을 label로 감싸면 버튼 하나처럼 눌린다 — 숨긴 input에
                따로 id를 달고 연결할 필요가 없다.
              */}
              <label
                className={cn(
                  'border-border-default text-text-secondary grid size-16 cursor-pointer place-items-center rounded-sm border border-dashed text-[20px]',
                  'hover:bg-surface-dim',
                  submitting && 'pointer-events-none opacity-50',
                )}
              >
                <input
                  type="file"
                  accept={REVIEW_IMAGE_TYPES.join(',')}
                  multiple
                  onChange={addPhotos}
                  disabled={submitting}
                  className="sr-only"
                />
                <span aria-hidden="true">＋</span>
                <span className="sr-only">사진 추가</span>
              </label>
            </li>
          )}
        </ul>

        <p className="text-text-secondary mt-1.5 text-[12px]">
          JPG · PNG · WebP, 장당 10MB까지. 저장해야 반영됩니다.
        </p>
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
          <label htmlFor="editReviewBody" className="text-text-primary text-[13px]">
            한마디 <span className="text-text-secondary text-[11px]">(선택)</span>
          </label>
          <span className="text-text-secondary text-[11px]">
            {body.length}/{REVIEW_BODY_MAX}
          </span>
        </div>
        <textarea
          id="editReviewBody"
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
              : 'bg-surface-dim text-text-secondary',
          )}
        >
          {submitting ? '저장하는 중…' : '수정 완료'}
        </button>
      </div>
    </form>
  )
}
