import { useState } from 'react'

import { ApiError } from '@/api'
import Button from '@/components/ui/Button'
import Chip from '@/components/ui/Chip'
import Modal from '@/components/ui/Modal'
import { deleteReview } from '@/features/mypage/api/reviews'
import Pagination from '@/features/mypage/components/Pagination'
import ReviewItem from '@/features/mypage/components/ReviewItem'
import { useMyReviews } from '@/features/mypage/hooks/useMyReviews'

import { REGION_GROUPS } from '@/types/region'
import { REVIEW_SORTS, type MyReview, type ReviewRegion, type ReviewSort } from '@/types/review'

/** 내 리뷰 · 담당: 예린 */
export default function MyReviewsPage() {
  const [sort, setSort] = useState<ReviewSort>('recent')
  const [region, setRegion] = useState<ReviewRegion>('all')
  const [page, setPage] = useState(1)
  const { data, loading, error, reload } = useMyReviews(sort, page, region)

  const [actionError, setActionError] = useState<string>()

  /** 삭제 확인 모달의 대상. null이면 닫힌 상태. */
  const [pendingDelete, setPendingDelete] = useState<MyReview | null>(null)
  const [deleteDone, setDeleteDone] = useState(false)
  const [deleting, setDeleting] = useState(false)

  const handleSort = (next: ReviewSort) => {
    setSort(next)
    // 정렬이 바뀌면 3페이지에 있던 항목이 1페이지로 올 수 있어 처음으로 돌린다.
    setPage(1)
    // 지역별에서 벗어나면 골라둔 지역도 푼다 — 칩이 사라져 되돌릴 방법이 없어진다.
    if (next !== 'region') setRegion('all')
  }

  const handleRegion = (next: ReviewRegion) => {
    setRegion(next)
    setPage(1)
  }

  const confirmDelete = async () => {
    if (!pendingDelete) return

    setDeleting(true)
    setActionError(undefined)
    try {
      await deleteReview(pendingDelete.id)
      setPendingDelete(null)
      setDeleteDone(true)
      await reload()
    } catch (cause) {
      // 실패하면 확인 모달을 닫고 목록 위에 사유를 보여준다.
      setPendingDelete(null)
      setActionError(cause instanceof ApiError ? cause.message : '리뷰를 삭제하지 못했습니다.')
    } finally {
      setDeleting(false)
    }
  }

  const message = error ?? actionError

  return (
    <div className="flex flex-col">
      <div className="flex flex-wrap items-center gap-3">
        <span className="text-[14px] font-semibold">리뷰 {data?.totalCount ?? 0}개</span>
        <div className="flex gap-2">
          {REVIEW_SORTS.map((option) => (
            <Chip
              key={option.id}
              selected={option.id === sort}
              onClick={() => handleSort(option.id)}
            >
              {option.label}
            </Chip>
          ))}
        </div>

        {/*
          같은 줄의 정렬 칩(py-2 / 13px)과 높이를 맞춘다 — Button 기본값은
          한 단계 커서 이 줄에서는 혼자 튄다.
          TODO: 리뷰 작성 화면(REV-*)이 아직 없다. 어느 온천에 쓸지 고르는 단계도 미정.
        */}
        <Button className="ml-auto px-4 py-2 text-[13px]">리뷰 작성하기</Button>
      </div>

      {/*
        지역 칩은 '지역별'을 골랐을 때만 나온다.
        17개 시·도를 다 늘어놓으면 두 줄이 넘어가서 시안대로 권역으로 묶었다.
      */}
      {sort === 'region' && (
        <div className="border-border-default mt-3 flex flex-wrap gap-2 border-t pt-3">
          {REGION_GROUPS.map((option) => (
            <Chip
              key={option.id}
              selected={option.id === region}
              onClick={() => handleRegion(option.id)}
            >
              {option.label}
            </Chip>
          ))}
        </div>
      )}

      {/* 목록 자리를 미리 잡아둔다 — 불러오는 동안 아래 페이지네이션이 뛰지 않게. */}
      <div className="min-h-[320px]">
        {message ? (
          <p role="alert" className="text-danger py-10 text-center text-[13px]">
            {message}
          </p>
        ) : loading ? (
          <p className="text-text-secondary py-10 text-center text-[13px]">불러오는 중…</p>
        ) : data && data.items.length > 0 ? (
          <div className="divide-border-default mt-2 flex flex-col divide-y">
            {data.items.map((review) => (
              <ReviewItem
                key={review.id}
                review={review}
                // TODO: 리뷰 수정 화면(REV-*)이 아직 없다.
                onEdit={() => {}}
                onDelete={setPendingDelete}
              />
            ))}
          </div>
        ) : (
          <p className="text-text-secondary py-10 text-center text-[13px]">
            아직 작성한 리뷰가 없습니다.
          </p>
        )}
      </div>

      {data && (
        <div className="mt-6 flex flex-col items-center gap-3">
          <Pagination page={data.page} totalPages={data.totalPages} onChange={setPage} />
          <p className="text-text-secondary text-[12px]">
            리뷰를 쓰면 내 지도의 해당 시·도가 한단계 진해집니다
          </p>
        </div>
      )}

      <Modal
        open={pendingDelete !== null}
        onClose={() => setPendingDelete(null)}
        kicker="리뷰 삭제"
        title={
          <>
            <span className="block">{pendingDelete?.onsenName} 리뷰를</span>
            <span className="block">정말 삭제하시겠습니까?</span>
          </>
        }
        description="삭제한 리뷰는 되돌릴 수 없습니다. 해당 온천의 내 지도 색도 함께 옅어집니다."
        primaryAction={{
          label: deleting ? '삭제 중…' : '삭제하기',
          onClick: confirmDelete,
          disabled: deleting,
        }}
        secondaryAction={{ label: '취소', onClick: () => setPendingDelete(null) }}
      />

      <Modal
        open={deleteDone}
        onClose={() => setDeleteDone(false)}
        kicker="삭제 완료"
        title={
          <>
            <span className="block">리뷰가</span>
            <span className="block">삭제되었습니다</span>
          </>
        }
        description="목록에서 해당 리뷰가 사라졌습니다."
        primaryAction={{ label: '확인', onClick: () => setDeleteDone(false) }}
      />
    </div>
  )
}
