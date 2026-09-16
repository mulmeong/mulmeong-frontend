import { api } from '@/api'
import { env } from '@/lib/env'

import {
  mockDeleteReview,
  mockGetMyReviews,
  mockGetReviewDetail,
  mockUpdateReview,
} from './reviewsMock'

import type {
  MyReviewsPage,
  ReviewDetail,
  ReviewFormValues,
  ReviewRegion,
  ReviewSort,
} from '@/types/review'

/** TODO: 엔드포인트·응답 형태는 백엔드와 맞춘 뒤 수정할 것. */
export function getMyReviews(
  sort: ReviewSort,
  page: number,
  region: ReviewRegion,
): Promise<MyReviewsPage> {
  if (env.useMock) return mockGetMyReviews(sort, page, region)
  return api.get<MyReviewsPage>('/users/me/reviews', {
    // '전국'은 조건이 없는 것과 같으므로 보내지 않는다.
    params: { sort, page, region: region === 'all' ? undefined : region },
  })
}

export function deleteReview(reviewId: number): Promise<void> {
  if (env.useMock) return mockDeleteReview()
  return api.delete<void>(`/reviews/${reviewId}`)
}

/** 수정 화면을 열 때 폼을 채울 값을 받아온다. */
export function getReviewDetail(reviewId: number): Promise<ReviewDetail> {
  if (env.useMock) return mockGetReviewDetail(reviewId)
  return api.get<ReviewDetail>(`/reviews/${reviewId}`)
}

/**
 * TODO: 사진은 지금 URL 문자열로 보낸다.
 * 실제로는 업로드 엔드포인트가 따로 있을지 BE와 확인 필요.
 */
export function updateReview(reviewId: number, values: ReviewFormValues): Promise<void> {
  if (env.useMock) return mockUpdateReview()
  return api.patch<void>(`/reviews/${reviewId}`, values)
}
