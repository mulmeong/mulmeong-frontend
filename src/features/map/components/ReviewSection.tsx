import { useEffect, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'

import { ApiError } from '@/api'
import ReviewContent from '@/components/ReviewContent'
import { Button } from '@/components/ui'
import { useAuth } from '@/features/auth/hooks/authContext'
import { fetchReviews } from '@/features/map/api/review'
import ReviewEmptyState from '@/features/map/components/ReviewEmptyState'
import ReviewForm from '@/features/map/components/ReviewForm'
import { cn } from '@/lib/cn'
import { REVIEW_SORTS, REVIEW_SORT_LABELS, VISIT_TIME_LABELS } from '@/types/review'

import type { OnsenListItem } from '@/features/map/api/map'
import type { CreateReviewResult, PublicReview, ReviewPage, ReviewSort } from '@/types/review'

const PAGE_SIZE = 10

type ReviewState = {
  identity: string
  page?: ReviewPage
  reviews: PublicReview[]
  error?: string
}

function formatDate(value: string) {
  return value.replaceAll('-', '.')
}

function SpecSummary({ review }: { review: PublicReview }) {
  return (
    <p className="text-text-secondary mt-3 text-[11px] leading-5">
      {VISIT_TIME_LABELS[review.spec.visitTime]} 방문 · 청결 {review.spec.clean} · 혼잡{' '}
      {review.spec.crowd} · 시설 {review.spec.facility}
      {review.isRevisit && ' · 재방문'}
      {review.isEdited && ' · 수정됨'}
    </p>
  )
}

function ReviewListItem({ review }: { review: PublicReview }) {
  const author = review.author
  return (
    <li className="py-6 last:pb-0">
      <header className="flex items-start gap-3">
        <span
          aria-hidden
          className="bg-surface-dim flex size-8 shrink-0 items-center justify-center rounded-full text-[12px]"
        >
          {author.nickname.charAt(0)}
        </span>
        <div className="min-w-0 flex-1 pt-0.5">
          <p className="text-text-primary flex min-w-0 flex-wrap items-center gap-x-1.5 gap-y-0.5 text-[13px] leading-4 font-semibold [overflow-wrap:anywhere]">
            <span>{author.nickname}</span>
            {review.isMine && (
              <span className="border-border-default/70 text-text-secondary rounded-full border px-1.5 py-0.5 text-[10px] leading-none font-normal">
                내 리뷰
              </span>
            )}
          </p>
          <time
            dateTime={review.visitedAt}
            className="text-text-secondary mt-px block text-[10.5px] leading-[15px]"
          >
            {author.level ? `Lv.${author.level}` : ''}
            {author.level && author.title ? ' · ' : ''}
            {author.title}
            {(author.level || author.title) && ' · '}
            {formatDate(review.visitedAt)} 방문
          </time>
        </div>
        <span
          className="text-text-primary shrink-0 text-[13px] leading-5 font-semibold tabular-nums"
          aria-label={`별점 ${review.rating}점`}
        >
          ★ {review.rating.toFixed(1)}
        </span>
      </header>
      <SpecSummary review={review} />
      <ReviewContent body={review.body} images={review.images} />
    </li>
  )
}

/** 작성 직후 보상 안내 (REV-06 포도알·레벨). */
function RewardNotice({ result }: { result: CreateReviewResult }) {
  const { reward } = result
  return (
    <div className="border-border-default bg-surface-dim rounded-sm border p-4">
      <p className="text-text-primary text-[14px] font-semibold">리뷰를 남겼어요</p>
      <p className="text-text-secondary mt-1.5 text-[13px] leading-[1.6]">
        {reward.isFirstVisit && reward.regionName
          ? `${reward.regionName} 포도알이 처음 채워졌어요.`
          : '포도알 농도가 진해졌어요.'}
        {reward.levelUp && ` 레벨 ${reward.levelAfter} · ${reward.titleAfter ?? ''}`}
      </p>
      <p className="text-text-secondary mt-1 text-[12px]">
        방문한 온천 {reward.visitedOnsenCount}곳 · 포도알 {reward.grapeCountAfter}개
      </p>
    </div>
  )
}

/** MAP-06 리뷰 작성 진입. 비로그인은 로그인으로 보내되 돌아올 자리를 넘긴다. */
export default function ReviewSection({ onsen }: { onsen: OnsenListItem }) {
  const navigate = useNavigate()
  const location = useLocation()

  const [writing, setWriting] = useState(false)
  const [created, setCreated] = useState<CreateReviewResult>()
  const [sort, setSort] = useState<ReviewSort>('RECENT')
  const [reviewState, setReviewState] = useState<ReviewState>()
  const [loadingMore, setLoadingMore] = useState(false)
  const [moreError, setMoreError] = useState<{ identity: string; message: string }>()
  const [version, setVersion] = useState(0)
  const reviewIdentity = `${onsen.id}|${sort}|${version}`
  const currentReviews = reviewState?.identity === reviewIdentity ? reviewState : undefined
  const reviewPage = currentReviews?.page
  const reviews = currentReviews?.reviews ?? []
  const loading = !currentReviews
  const error = currentReviews?.error
  const loadMoreError = moreError?.identity === reviewIdentity ? moreError.message : undefined

  // 토큰 존재 여부가 아니라 세션이 살아 있는지로 판단한다 (만료 토큰 배제).
  const { user } = useAuth()
  const loggedIn = Boolean(user)

  useEffect(() => {
    let cancelled = false
    fetchReviews(onsen.id, { sort, page: 0, size: PAGE_SIZE })
      .then((page) => {
        if (cancelled) return
        setReviewState({ identity: reviewIdentity, page, reviews: page.content })
      })
      .catch((err) => {
        if (cancelled) return
        setReviewState({
          identity: reviewIdentity,
          reviews: [],
          error:
            err instanceof ApiError
              ? err.message
              : '리뷰를 불러오지 못했어요. 잠시 후 다시 시도해주세요.',
        })
      })
    return () => {
      cancelled = true
    }
  }, [onsen.id, sort, reviewIdentity])

  function handleWriteClick() {
    if (!loggedIn) {
      // 돌아올 경로를 넘겨 로그인 후 이 화면으로 되돌린다.
      navigate('/login', { state: { from: `${location.pathname}${location.search}` } })
      return
    }
    setWriting(true)
  }

  if (writing) {
    return (
      <ReviewForm
        onsenId={onsen.id}
        onCancel={() => setWriting(false)}
        onCreated={(result) => {
          setCreated(result)
          setWriting(false)
          setSort('RECENT')
          setVersion((value) => value + 1)
        }}
      />
    )
  }

  async function loadMore() {
    if (!reviewPage || reviewPage.last || loadingMore) return
    setLoadingMore(true)
    setMoreError(undefined)
    try {
      const page = await fetchReviews(onsen.id, {
        sort,
        page: reviewPage.page + 1,
        size: PAGE_SIZE,
      })
      setReviewState((current) =>
        current?.identity === reviewIdentity
          ? { identity: reviewIdentity, page, reviews: [...current.reviews, ...page.content] }
          : current,
      )
    } catch (err) {
      setMoreError({
        identity: reviewIdentity,
        message:
          err instanceof ApiError
            ? err.message
            : '리뷰를 더 불러오지 못했어요. 잠시 후 다시 시도해주세요.',
      })
    } finally {
      setLoadingMore(false)
    }
  }

  return (
    <div className="flex flex-col gap-7">
      {created && <RewardNotice result={created} />}

      <div>
        <Button
          hierarchy="secondary"
          onClick={handleWriteClick}
          className="border-border-default/60 hover:bg-surface-dim h-8 w-full rounded-[4px] border px-2.5 py-0 text-[12px] leading-4 font-medium outline-none focus-visible:ring-1 focus-visible:ring-inverse focus-visible:ring-offset-2"
        >
          {loggedIn ? '리뷰 작성하기' : '로그인하고 리뷰 작성하기'}
        </Button>
      </div>

      <section aria-label={`${onsen.name} 방문 리뷰`} aria-busy={loading || loadingMore}>
        <div className="flex items-baseline justify-between gap-3">
          <h3 className="text-text-primary text-[14px] font-semibold">
            리뷰 {reviewPage?.totalElements ?? onsen.reviewCount}개
          </h3>
          <div className="flex shrink-0 gap-1">
            {REVIEW_SORTS.map((item) => (
              <button
                key={item}
                type="button"
                onClick={() => setSort(item)}
                aria-pressed={sort === item}
                className={cn(
                  'h-7 rounded-full px-2 text-[11px] transition-colors outline-none focus-visible:ring-1 focus-visible:ring-inverse',
                  sort === item
                    ? 'bg-inverse text-text-inverse'
                    : 'text-text-secondary hover:bg-surface-dim hover:text-text-primary',
                )}
              >
                {REVIEW_SORT_LABELS[item]}
              </button>
            ))}
          </div>
        </div>

        {loading ? (
          <div role="status" className="py-8 text-center">
            <p className="text-text-secondary text-[12px]">리뷰를 불러오는 중…</p>
          </div>
        ) : error && reviews.length === 0 ? (
          <div role="alert" className="py-8 text-center">
            <p className="text-text-secondary text-[12px] leading-5">{error}</p>
            <button
              type="button"
              onClick={() => setVersion((value) => value + 1)}
              className="text-text-primary mt-2 min-h-8 text-[12px] underline underline-offset-4"
            >
              다시 시도
            </button>
          </div>
        ) : reviews.length === 0 ? (
          <ReviewEmptyState />
        ) : (
          <>
            <ul className="divide-border-default/60 mt-1 divide-y">
              {reviews.map((review) => (
                <ReviewListItem key={review.reviewId} review={review} />
              ))}
            </ul>
            {loadMoreError && (
              <p role="alert" className="text-danger mt-3 text-[12px] leading-5">
                {loadMoreError}
              </p>
            )}
            {reviewPage && !reviewPage.last && (
              <button
                type="button"
                onClick={loadMore}
                disabled={loadingMore}
                className="border-border-default text-text-primary hover:bg-surface-dim mt-4 h-9 w-full rounded-sm border text-[12px] outline-none focus-visible:ring-1 focus-visible:ring-inverse disabled:cursor-not-allowed disabled:opacity-50"
              >
                {loadingMore ? '불러오는 중…' : '리뷰 더 보기'}
              </button>
            )}
          </>
        )}
      </section>
    </div>
  )
}
