import { api } from '@/api'
import { env } from '@/lib/env'

import { mockDeleteReview, mockGetMyReviews } from './reviewsMock'

import type { MyReviewsPage, ReviewRegion, ReviewSort } from '@/types/review'

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
