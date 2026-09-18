import { useEffect, useRef, useState } from 'react'

import { ApiError } from '@/api'
import { getReviewDetail } from '@/features/mypage/api/reviews'
import MyReviewEditForm from '@/features/mypage/components/MyReviewEditForm'
import { cn } from '@/lib/cn'

import type { MyReviewDetail } from '@/types/myReview'

type ReviewFormPanelProps = {
  /** 수정할 리뷰. null이면 닫힌 상태. */
  reviewId: number | null
  onClose: () => void
  /** 저장이 끝난 뒤 — 목록을 다시 불러오라는 뜻. */
  onSaved: () => void
}

/**
 * 리뷰 수정 패널.
 *
 * 화면 오른쪽에서 덮는 형태라 <dialog>로 만든다 — 포커스 가두기, Escape로 닫기,
 * 뒤쪽을 스크린 리더에서 가리기를 브라우저가 처리해준다.
 *
 * 폼 자체는 MyReviewEditForm이 그린다. 이 컴포넌트는 값을 받아오고 감싸기만 한다.
 */
export default function ReviewFormPanel({ reviewId, onClose, onSaved }: ReviewFormPanelProps) {
  const ref = useRef<HTMLDialogElement>(null)

  const [detail, setDetail] = useState<MyReviewDetail>()
  const [error, setError] = useState<string>()

  const open = reviewId !== null

  useEffect(() => {
    const dialog = ref.current
    if (!dialog) return
    // showModal()이어야 포커스가 갇히고 ::backdrop이 생긴다. show()는 아니다.
    if (open && !dialog.open) dialog.showModal()
    if (!open && dialog.open) dialog.close()
  }, [open])

  useEffect(() => {
    if (reviewId === null) {
      setDetail(undefined)
      setError(undefined)
      return
    }

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
    // oxlint-disable-next-line react/set-state-in-effect
    void fetchDetail()

    return () => {
      cancelled = true
    }
  }, [reviewId])

  return (
    <dialog
      ref={ref}
      onClose={onClose}
      onClick={(event) => {
        if (event.target === ref.current) onClose()
      }}
      aria-label="리뷰 수정"
      className={cn(
        // 프리플라이트가 margin을 0으로 만들어 기본 정렬이 풀린다. 오른쪽에 붙인다.
        'my-0 mr-0 ml-auto h-dvh max-h-dvh w-[400px] max-w-full',
        // 브라우저 기본 padding을 지우고 여기서는 넘치지 않게 한다 —
        // 안 지우면 padding만큼 내용이 넘쳐 dialog에도 스크롤바가 하나 더 생긴다.
        'overflow-hidden p-0',
        'bg-surface text-text-primary backdrop:bg-black/40',
      )}
    >
      <div className="flex h-full flex-col">
        <header className="border-border-default flex items-center justify-between border-b px-6 py-4">
          <h2 className="text-[15px] font-bold">리뷰 수정</h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="닫기"
            className="text-text-secondary hover:text-text-primary text-[18px] leading-none"
          >
            ✕
          </button>
        </header>

        {/*
          min-h-0이 없으면 flex 항목의 최소 높이가 내용 높이라 줄어들지 않는다.
          그러면 overflow-y-auto가 걸려도 이 영역이 부모를 밀어낸다.
        */}
        <div className="min-h-0 flex-1 overflow-y-auto px-6 py-5">
          {error ? (
            <p role="alert" className="text-danger py-10 text-center text-[13px]">
              {error}
            </p>
          ) : !detail ? (
            <p className="text-text-secondary py-10 text-center text-[13px]">불러오는 중…</p>
          ) : (
            <>
              <h3 className="text-[18px] font-bold">{detail.onsenName}</h3>
              <p className="text-text-secondary mt-1 mb-5 text-[12px]">
                {detail.onsenCategory} · {detail.onsenAddress}
              </p>

              <MyReviewEditForm detail={detail} onCancel={onClose} onUpdated={onSaved} />
            </>
          )}
        </div>
      </div>
    </dialog>
  )
}
