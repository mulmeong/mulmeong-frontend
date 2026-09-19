import { useEffect, useRef, useState } from 'react'
import { useOutletContext, useSearchParams } from 'react-router-dom'

import { ApiError } from '@/api'
import Button from '@/components/ui/Button'
import Chip from '@/components/ui/Chip'
import Modal from '@/components/ui/Modal'
import { deleteReview, findReviewPage } from '@/features/mypage/api/reviews'
import Pagination from '@/features/mypage/components/Pagination'
import ReviewFormPanel from '@/features/mypage/components/ReviewFormPanel'
import ReviewWritePanel from '@/features/mypage/components/ReviewWritePanel'
import ReviewItem from '@/features/mypage/components/ReviewItem'
import { useMyReviews } from '@/features/mypage/hooks/useMyReviews'

import { SIDO_REGIONS } from '@/features/mypage/myMap/sidoRegions'

import type { MyPageOutletContext } from '@/features/mypage/components/MyPageLayout'

import type { ReviewRegionFilter } from '@/features/mypage/api/reviewsDto'
import { REVIEW_SORTS, type MyReview, type ReviewSort } from '@/types/myReview'

/**
 * 칩에 쓸 짧은 이름. 서버는 '충청북도'처럼 정식 명칭을 주는데 그대로 쓰면
 * 칩이 길어져 줄이 넘어간다. 보내는 값은 코드라 표기는 바꿔도 안전하다.
 * 시군구 코드(5자리)는 대응표가 없어 서버 이름을 그대로 쓴다.
 */
function shortRegionName(filter: ReviewRegionFilter): string {
  return SIDO_REGIONS.find((region) => region.code === filter.regionCode)?.name ?? filter.name
}

/** 내 리뷰 · 담당: 예린 */
export default function MyReviewsPage() {
  const { reloadProfile } = useOutletContext<MyPageOutletContext>()

  /**
   * 내 지도에서 '이 지역 리뷰 전체 보기'로 넘어오면 ?regionCode=42가 붙는다.
   * 처음 값만 주소에서 읽고, 그 뒤 칩 조작은 state로만 다룬다 — 주소를 계속
   * 맞춰 쓰면 뒤로 가기가 칩 한 번 누른 만큼씩 되감겨 되레 불편해진다.
   */
  const [searchParams] = useSearchParams()
  const [initialRegion] = useState(() => searchParams.get('regionCode') ?? undefined)

  /**
   * 내 지도에서 리뷰 한 건을 눌러 넘어오면 ?reviewId=501이 함께 붙는다.
   * 그 리뷰를 펼친 채로 연다. 몇 페이지에 있는지는 아래 effect가 찾는다.
   */
  const [initialReviewId] = useState(() => {
    const value = Number(searchParams.get('reviewId'))
    return Number.isInteger(value) && value > 0 ? value : null
  })

  const [sort, setSort] = useState<ReviewSort>('RECENT')
  /** 고른 지역 코드. undefined면 전국이다. */
  const [regionCode, setRegionCode] = useState<string | undefined>(initialRegion)
  const [page, setPage] = useState(1)
  const { data, loading, error, reload } = useMyReviews(sort, page, regionCode)

  const [actionError, setActionError] = useState<string>()

  /** 삭제 확인 모달의 대상. null이면 닫힌 상태. */
  const [pendingDelete, setPendingDelete] = useState<MyReview | null>(null)
  const [deleteDone, setDeleteDone] = useState(false)
  const [deleting, setDeleting] = useState(false)

  /** 수정 패널이 열려 있는 리뷰. null이면 닫힌 상태. */
  const [editingId, setEditingId] = useState<number | null>(null)
  const [writing, setWriting] = useState(false)
  const [editDone, setEditDone] = useState(false)

  /**
   * 아래로 펼친 리뷰. 하나만 연다 — 숫자 하나로 두면 다른 걸 여는 순간
   * 이전 것이 저절로 닫힌다.
   */
  const [expandedId, setExpandedId] = useState<number | null>(initialReviewId)

  /**
   * 수정 후 펼쳐둔 상세를 다시 받아오게 하는 값.
   * 상세는 펼칠 때 한 번만 받아오므로, 항목을 새로 그려야 바뀐 내용이 보인다.
   */
  const [detailVersion, setDetailVersion] = useState(0)

  /**
   * 내 지도에서 지목해 온 리뷰가 몇 페이지에 있는지 찾아 그 페이지를 연다.
   *
   * 첫 페이지에 있으면 이미 보이는 채로 시작하므로 페이지를 건드리지 않는다.
   * 지운 리뷰라 못 찾으면(null) 그냥 목록을 보여준다 — 따로 알리지 않는다.
   * 주소로 들어온 한 번만 하면 되므로 마운트 때만 돈다.
   */
  useEffect(() => {
    if (initialReviewId === null) return

    let cancelled = false

    const locate = async () => {
      const found = await findReviewPage(initialReviewId, { regionCode: initialRegion })
      if (!cancelled && found !== null && found > 1) setPage(found)
    }

    // state 변경은 await 뒤에서 일어난다 — effect 본문에서 동기로 부르지 않는다.
    void locate().catch(() => {
      // 못 찾아도 목록 자체는 멀쩡하다. 펼침만 안 될 뿐이다.
    })

    return () => {
      cancelled = true
    }
  }, [initialReviewId, initialRegion])

  const toggleExpanded = (review: MyReview) => {
    setExpandedId((current) => (current === review.id ? null : review.id))
  }

  const handleSort = (next: ReviewSort) => {
    setSort(next)
    // 정렬이 바뀌면 3페이지에 있던 항목이 1페이지로 올 수 있어 처음으로 돌린다.
    setPage(1)
    // 목록이 새로 그려지므로 펼친 것도 닫는다.
    setExpandedId(null)
  }

  const handleRegion = (next: string | undefined) => {
    setRegionCode(next)
    setPage(1)
    setExpandedId(null)
  }

  const handlePage = (next: number) => {
    setPage(next)
    setExpandedId(null)
  }

  const confirmDelete = async () => {
    if (!pendingDelete) return

    setDeleting(true)
    setActionError(undefined)
    try {
      await deleteReview(pendingDelete.id)
      setPendingDelete(null)
      setDeleteDone(true)
      reload()
      // 삭제는 방문 인증 취소다 — 방문 온천 수·리뷰 수·레벨이 서버에서 다시
      // 계산된다(REV-05). 헤더가 탭 바깥이라 여기서 불러주지 않으면 옛 숫자가 남는다.
      reloadProfile()
    } catch (cause) {
      // 실패하면 확인 모달을 닫고 목록 위에 사유를 보여준다.
      setPendingDelete(null)
      setActionError(cause instanceof ApiError ? cause.message : '리뷰를 삭제하지 못했습니다.')
    } finally {
      setDeleting(false)
    }
  }

  const handleSaved = () => {
    setEditingId(null)
    setEditDone(true)
    setDetailVersion((current) => current + 1)
    reload()
  }

  /**
   * 리뷰를 새로 남겼다.
   * 수정과 달리 포도알·레벨·리뷰 수가 바뀌므로(REV-06) 헤더도 다시 받아온다.
   */
  const handleCreated = () => {
    setWriting(false)
    reload()
    reloadProfile()
  }

  /**
   * 지역 칩 목록. 불러오는 동안에는 직전 것을 그대로 쓴다 —
   * 칩을 누를 때마다 응답이 올 때까지 칩 줄이 통째로 사라졌다 나타난다.
   * 값이 같으면 덮어써도 결과가 같아 렌더 중에 담아둬도 안전하다.
   */
  const regionsRef = useRef<ReviewRegionFilter[]>([])
  if (data?.regions) regionsRef.current = data.regions
  const regions = regionsRef.current

  const message = error ?? actionError

  return (
    <div className="flex flex-col">
      <div className="flex flex-wrap items-center gap-3">
        <span className="text-[14px] font-semibold">리뷰 {data?.totalCount ?? 0}개</span>
        <div className="flex gap-2">
          {REVIEW_SORTS.map((option) => (
            <Chip
              key={option.id}
              variant="plain"
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
        */}
        <Button onClick={() => setWriting(true)} className="ml-auto px-4 py-2 text-[13px]">
          리뷰 작성하기
        </Button>
      </div>

      {/*
        지역 칩은 서버가 준 목록으로 그린다(MY-04 filters.regions).
        내가 리뷰를 쓴 지역만 오므로 눌러도 0건인 칩이 생기지 않는다.

        한 건도 없으면 칩 줄을 감춘다 — '전국' 하나만 떠 있어봐야 할 일이 없다.
        단 지역을 골라둔 상태라면 비어 있어도 남긴다. 고른 지역의 리뷰를 모두
        지우면 목록이 비면서 칩도 같이 사라져, 전국으로 돌아갈 길이 없어진다.
      */}
      {(regions.length > 0 || regionCode !== undefined) && (
        <div className="border-border-default mt-3 flex flex-wrap items-center gap-2 border-t pt-3">
          <Chip
            variant="plain"
            selected={regionCode === undefined}
            onClick={() => handleRegion(undefined)}
          >
            전국
          </Chip>
          {regions.map((option) => (
            <Chip
              key={option.regionCode}
              variant="plain"
              selected={option.regionCode === regionCode}
              onClick={() => handleRegion(option.regionCode)}
            >
              {shortRegionName(option)} {option.count}
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
                // 수정 후 version이 바뀌면 새로 그려져 펼친 상세도 다시 받아온다.
                key={`${review.id}-${detailVersion}`}
                review={review}
                expanded={expandedId === review.id}
                onToggle={toggleExpanded}
                onEdit={(target) => setEditingId(target.id)}
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
          <Pagination page={data.page} totalPages={data.totalPages} onChange={handlePage} />
          <p className="text-text-secondary text-[12px]">
            리뷰를 쓰면 내 지도의 해당 시·도가 한단계 진해집니다
          </p>
        </div>
      )}

      <ReviewWritePanel
        open={writing}
        onClose={() => setWriting(false)}
        onCreated={handleCreated}
      />

      <ReviewFormPanel
        reviewId={editingId}
        onClose={() => setEditingId(null)}
        onSaved={handleSaved}
      />

      <Modal
        open={editDone}
        onClose={() => setEditDone(false)}
        kicker="수정 완료"
        title={
          <>
            <span className="block">리뷰가</span>
            <span className="block">수정되었습니다</span>
          </>
        }
        description="바뀐 내용이 목록에 반영되었습니다."
        primaryAction={{ label: '확인', onClick: () => setEditDone(false) }}
      />

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
        // 삭제는 방문 인증 취소라 레벨이 내려갈 수 있다. 명세(REV-05)가 미리 알리라고 짚는다.
        description="삭제한 리뷰는 되돌릴 수 없습니다. 방문 기록이 취소되어 내 지도 색이 옅어지고, 레벨이 내려갈 수 있습니다."
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
