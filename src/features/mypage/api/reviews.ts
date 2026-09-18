import { api } from '@/api'
import { env } from '@/lib/env'

import {
  mockDeleteReview,
  mockGetMyReviews,
  mockGetReviewDetail,
  mockUpdateReview,
} from './reviewsMock'

import type {
  MyReviewDetail,
  MyReviewFormValues,
  MyReviewsPage,
  ReviewRegion,
  ReviewSort,
} from '@/types/myReview'

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

/**
 * 수정 화면을 열 때 폼을 채울 값을 받아온다.
 * TODO: 작성(REV-01)과 달리 조회·수정 엔드포인트는 아직 명세에 없다. BE와 확인할 것.
 */
export function getReviewDetail(reviewId: number): Promise<MyReviewDetail> {
  if (env.useMock) return mockGetReviewDetail(reviewId)
  return api.get<MyReviewDetail>(`/reviews/${reviewId}`)
}

/**
 * TODO: 사진은 지금 URL 문자열로 보낸다. 작성 쪽 주석(602 업로드 명세)을 보면
 * 별도 업로드 후 받은 URL을 넘기는 방식이라 같은 흐름으로 맞춰야 한다.
 */
export function updateReview(reviewId: number, values: MyReviewFormValues): Promise<void> {
  if (env.useMock) return mockUpdateReview()
  return api.patch<void>(`/reviews/${reviewId}`, values)
}
