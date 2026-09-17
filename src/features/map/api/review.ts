import { api } from '@/api'
import { mockCreateReview } from '@/features/map/api/reviewMock'
import { env } from '@/lib/env'

import type { CreateReviewBody, CreateReviewResult } from '@/types/review'

/**
 * REV-01 리뷰 작성 = 방문 인증. 인증 필수라 skipAuth를 쓰지 않는다.
 * 같은 온천·같은 방문일에 이미 리뷰가 있으면 서버가 409(DAILY_REVIEW_LIMIT)로 막는다.
 */
export function createReview(onsenId: number, body: CreateReviewBody): Promise<CreateReviewResult> {
  if (env.useMock) return mockCreateReview(onsenId, body)
  return api.post<CreateReviewResult>(`/onsens/${onsenId}/reviews`, body)
}
