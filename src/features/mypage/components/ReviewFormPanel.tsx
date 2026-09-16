import { useEffect, useRef, useState, type ChangeEvent } from 'react'

import { ApiError } from '@/api'
import Chip from '@/components/ui/Chip'
import { getReviewDetail, updateReview } from '@/features/mypage/api/reviews'
import StarRating from '@/features/mypage/components/StarRating'
import { cn } from '@/lib/cn'

import {
  FACILITY_OPTIONS,
  MAX_REVIEW_PHOTOS,
  RATING_ASPECTS,
  VISIT_TIMES,
  type RatingAspect,
  type ReviewDetail,
  type ReviewFormValues,
  type VisitTime,
} from '@/types/review'

type ReviewFormPanelProps = {
  /** 수정할 리뷰. null이면 닫힌 상태. */
  reviewId: number | null
  onClose: () => void
  /** 저장이 끝난 뒤 — 목록을 다시 불러오라는 뜻. */
  onSaved: () => void
}

/** 2026-09-10T… -> 2026.09.10 */
function formatDate(iso: string): string {
  const date = new Date(iso)
  if (Number.isNaN(date.getTime())) return ''
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${date.getFullYear()}.${month}.${day}`
}

const SECTION_LABEL = 'text-[13px] font-bold'

/**
 * 리뷰 수정 패널.
 *
 * 화면 오른쪽에서 덮는 형태라 <dialog>로 만든다 — 포커스 가두기, Escape로 닫기,
 * 뒤쪽을 스크린 리더에서 가리기를 브라우저가 처리해준다.
 *
 * 시안에는 작성(리뷰 등록)도 같은 폼인데, 작성은 대상 장소를 고르는 단계가
 * 먼저 있어야 해서 아직 붙이지 않았다. 그 단계가 정해지면 이 컴포넌트에
 * mode를 받아 제목과 버튼 문구만 바꾸면 된다.
 */
export default function ReviewFormPanel({ reviewId, onClose, onSaved }: ReviewFormPanelProps) {
  const ref = useRef<HTMLDialogElement>(null)

  const [detail, setDetail] = useState<ReviewDetail>()
  const [values, setValues] = useState<ReviewFormValues>()
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string>()

  /**
   * 이 패널이 만든 미리보기 URL. 닫을 때 돌려줘야 메모리에 남지 않는다.
   * 사진 목록에는 서버에서 온 주소도 섞여 있어서, 우리가 만든 것만 따로 센다.
   */
  const objectUrls = useRef<string[]>([])

  const open = reviewId !== null

  useEffect(() => {
    const dialog = ref.current
    if (!dialog) return
    // showModal()이어야 포커스가 갇히고 ::backdrop이 생긴다. show()는 아니다.
    if (open && !dialog.open) dialog.showModal()
    if (!open && dialog.open) dialog.close()
  }, [open])

  useEffect(() => {
    if (reviewId === null) return

    let cancelled = false
    const fetchDetail = async () => {
      setLoading(true)
      setError(undefined)
      try {
        const result = await getReviewDetail(reviewId)
        if (cancelled) return
        setDetail(result)
        setValues({
          visitTime: result.visitTime,
          facilities: result.facilities,
          aspectRatings: result.aspectRatings,
          rating: result.rating,
          content: result.content,
          photoUrls: result.photoUrls,
          visitedAt: result.visitedAt,
        })
      } catch (cause) {
        if (cancelled) return
        setError(cause instanceof ApiError ? cause.message : '리뷰를 불러오지 못했습니다.')
      } finally {
        if (!cancelled) setLoading(false)
      }
    }

    // 서버에서 값을 받아오는 일은 effect가 맞는 자리다. useMyReviews도 같은 구조다.
    // oxlint-disable-next-line react/set-state-in-effect
    void fetchDetail()

    return () => {
      cancelled = true
    }
  }, [reviewId])

  /** 닫힐 때 미리보기 URL을 돌려주고 폼을 비운다. */
  useEffect(() => {
    if (open) return
    for (const url of objectUrls.current) URL.revokeObjectURL(url)
    objectUrls.current = []
  }, [open])

  const patch = (next: Partial<ReviewFormValues>) => {
    setValues((current) => (current ? { ...current, ...next } : current))
  }

  const toggleFacility = (facility: string) => {
    setValues((current) => {
      if (!current) return current
      const has = current.facilities.includes(facility)
      return {
        ...current,
        facilities: has
          ? current.facilities.filter((item) => item !== facility)
          : [...current.facilities, facility],
      }
    })
  }

  const handleAddPhotos = (event: ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files ?? [])
    // 같은 파일을 다시 고를 수 있게 input을 비운다 — 값이 같으면 change가 안 뜬다.
    event.target.value = ''
    if (files.length === 0) return

    setValues((current) => {
      if (!current) return current
      const room = MAX_REVIEW_PHOTOS - current.photoUrls.length
      const added = files.slice(0, room).map((file) => {
        const url = URL.createObjectURL(file)
        objectUrls.current.push(url)
        return url
      })
      return { ...current, photoUrls: [...current.photoUrls, ...added] }
    })
  }

  const removePhoto = (url: string) => {
    setValues((current) =>
      current
        ? { ...current, photoUrls: current.photoUrls.filter((item) => item !== url) }
        : current,
    )
    if (objectUrls.current.includes(url)) {
      URL.revokeObjectURL(url)
      objectUrls.current = objectUrls.current.filter((item) => item !== url)
    }
  }

  const handleSubmit = async () => {
    if (!values || reviewId === null) return

    setSaving(true)
    setError(undefined)
    try {
      await updateReview(reviewId, values)
      onSaved()
    } catch (cause) {
      setError(cause instanceof ApiError ? cause.message : '리뷰를 수정하지 못했습니다.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <dialog
      ref={ref}
      onClose={onClose}
      onClick={(event) => {
        if (event.target === ref.current) onClose()
      }}
      aria-label="온천 리뷰 수정"
      className={cn(
        // 프리플라이트가 margin을 0으로 만들어 기본 정렬이 풀린다. 오른쪽에 붙인다.
        'my-0 mr-0 ml-auto h-dvh max-h-dvh w-[400px] max-w-full',
        // 브라우저 기본 스타일의 padding을 지우고 여기서는 넘치지 않게 한다 —
        // 안 지우면 padding만큼 내용이 넘쳐 dialog에도 스크롤바가 하나 더 생긴다.
        'overflow-hidden p-0',
        'bg-surface text-text-primary backdrop:bg-black/40',
      )}
    >
      <div className="flex h-full flex-col">
        <header className="border-border-default flex items-center justify-between border-b px-6 py-4">
          <h2 className="text-[15px] font-bold">온천 리뷰 수정</h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="닫기"
            className="text-text-secondary hover:text-text-primary text-[18px] leading-none"
          >
            ✕
          </button>
        </header>

        {loading || !values || !detail ? (
          <p className="text-text-secondary py-16 text-center text-[13px]">
            {error ?? '불러오는 중…'}
          </p>
        ) : (
          <>
            {/*
              min-h-0이 없으면 flex 항목의 최소 높이가 내용 높이라 줄어들지 않는다.
              그러면 overflow-y-auto가 걸려도 이 영역이 부모를 밀어내서
              아래 버튼이 화면 밖으로 내려간다.
            */}
            <div className="min-h-0 flex-1 overflow-y-auto px-6 py-5">
              <h3 className="text-[18px] font-bold">{detail.onsenName}</h3>
              <p className="text-text-secondary mt-1 text-[12px]">
                {detail.onsenCategory} · {detail.onsenAddress}
              </p>
              <p className="text-text-secondary border-border-default mt-4 border-t pt-4 text-[12px] leading-[1.7]">
                리뷰를 남기면 이 장소의 방문 기록이 내 지도에 저장돼요.
              </p>

              <section className="mt-6">
                <p className={SECTION_LABEL}>언제 방문하셨나요?</p>
                <div className="mt-3 flex flex-wrap gap-2">
                  {VISIT_TIMES.map((option) => (
                    <Chip
                      key={option.id}
                      selected={values.visitTime === option.id}
                      onClick={() => patch({ visitTime: option.id as VisitTime })}
                    >
                      {option.label}
                    </Chip>
                  ))}
                </div>
              </section>

              <section className="mt-6">
                <p className={SECTION_LABEL}>어떤 시설을 이용하셨나요?</p>
                <div className="mt-3 flex flex-wrap gap-2">
                  {FACILITY_OPTIONS.map((facility) => (
                    <Chip
                      key={facility}
                      selected={values.facilities.includes(facility)}
                      onClick={() => toggleFacility(facility)}
                    >
                      {facility}
                    </Chip>
                  ))}
                </div>
              </section>

              <section className="mt-6">
                <p className={SECTION_LABEL}>이용 경험을 평가해주세요</p>
                <div className="mt-3 flex flex-col gap-2">
                  {RATING_ASPECTS.map((aspect) => (
                    <div key={aspect.id} className="flex items-center justify-between">
                      <span className="text-[13px]">{aspect.label}</span>
                      <StarRating
                        label={aspect.label}
                        value={values.aspectRatings[aspect.id]}
                        onChange={(next) =>
                          patch({
                            aspectRatings: {
                              ...values.aspectRatings,
                              [aspect.id as RatingAspect]: next,
                            },
                          })
                        }
                      />
                    </div>
                  ))}
                </div>
              </section>

              <section className="border-border-default mt-6 border-t pt-5">
                <div className="flex items-center justify-between">
                  <p className={SECTION_LABEL}>전체 만족도</p>
                  <StarRating
                    label="전체 만족도"
                    size="large"
                    value={values.rating}
                    onChange={(next) => patch({ rating: next })}
                  />
                </div>
              </section>

              <section className="mt-6">
                <label htmlFor="review-content" className={SECTION_LABEL}>
                  경험을 들려주세요 <span className="text-text-secondary font-normal">(선택)</span>
                </label>
                <textarea
                  id="review-content"
                  rows={4}
                  value={values.content}
                  onChange={(event) => patch({ content: event.target.value })}
                  placeholder="이 장소에서의 경험을 자유롭게 남겨주세요."
                  className="border-border-strong bg-surface placeholder:text-text-secondary focus:outline-inverse mt-3 w-full resize-none rounded-sm border px-3 py-2.5 text-[13px] leading-[1.7] focus:outline-2"
                />
              </section>

              <section className="mt-6">
                <div className="flex items-center justify-between">
                  <p className={SECTION_LABEL}>사진</p>
                  <span className="text-text-secondary text-[12px]">
                    사진 {values.photoUrls.length} / {MAX_REVIEW_PHOTOS}
                  </span>
                </div>

                <div className="mt-3 flex flex-wrap gap-2">
                  {values.photoUrls.map((url) => (
                    <div key={url} className="relative">
                      <img
                        src={url}
                        alt=""
                        className="bg-surface-dim size-[52px] rounded-sm object-cover"
                      />
                      <button
                        type="button"
                        onClick={() => removePhoto(url)}
                        aria-label="사진 빼기"
                        className="bg-inverse text-text-inverse absolute -top-1.5 -right-1.5 flex size-[18px] items-center justify-center rounded-full text-[10px] leading-none"
                      >
                        ✕
                      </button>
                    </div>
                  ))}

                  {values.photoUrls.length < MAX_REVIEW_PHOTOS && (
                    // 파일 입력은 꾸미기 어려워 감추고 label을 버튼처럼 쓴다.
                    // sr-only로 감추면 안 된다 — <dialog>가 position:absolute라
                    // 감춘 input의 기준이 label이 아니라 패널 전체가 된다. 그러면
                    // input이 패널 맨 위에 놓이고, 누를 때 브라우저가 거기로
                    // 스크롤해서 폼이 위로 튄다. relative 안에서 투명하게 덮는다.
                    <label className="border-border-strong text-text-secondary hover:text-text-primary relative flex size-[52px] cursor-pointer items-center justify-center rounded-sm border text-[18px]">
                      +
                      <input
                        type="file"
                        accept="image/*"
                        multiple
                        onChange={handleAddPhotos}
                        aria-label="사진 추가"
                        className="absolute inset-0 cursor-pointer opacity-0"
                      />
                    </label>
                  )}
                </div>
              </section>

              <section className="mt-6">
                <p className={SECTION_LABEL}>언제 다녀오셨나요?</p>
                <p className="mt-2 text-[13px]">{formatDate(values.visitedAt)}</p>
                <p className="text-text-secondary mt-1 text-[12px]">
                  같은 장소의 방문 기록은 하루 한 번 남길 수 있어요.
                </p>
              </section>

              {error && (
                <p role="alert" className="text-danger mt-5 text-[13px]">
                  {error}
                </p>
              )}
            </div>

            {/* 스크롤 영역 밖이라 항상 아래에 붙어 있다. */}
            <div className="border-border-default shrink-0 border-t px-6 py-4">
              <button
                type="button"
                onClick={handleSubmit}
                disabled={saving || values.rating === 0}
                className="bg-inverse text-text-inverse w-full rounded-sm py-3.5 text-[14px] font-semibold disabled:cursor-not-allowed disabled:opacity-40"
              >
                {saving ? '수정 중…' : '리뷰 수정'}
              </button>
            </div>
          </>
        )}
      </div>
    </dialog>
  )
}
