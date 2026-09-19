import { api } from '@/api'
import { env } from '@/lib/env'

import {
  mockDeleteReview,
  mockGetMyReviews,
  mockGetReviewDetail,
  mockUpdateReview,
} from './reviewsMock'
import {
  toMyReviewDetail,
  toMyReviewsPage,
  type MyReviewDetailDto,
  type MyReviewsResponse,
} from './reviewsDto'

import type {
  MyReviewDetail,
  MyReviewFormValues,
  MyReviewQuery,
  MyReviewsPage,
} from '@/types/myReview'

/** 목록 한 페이지에 담을 수. 명세 기본값은 10, 최대 30이다. */
export const REVIEW_PAGE_SIZE = 5

/**
 * 내 리뷰 목록(MY-04). 목록 탭과 내 지도 오른쪽 패널이 같이 쓴다.
 *
 * regionCode는 서버에 그대로 넘긴다 — 시·도 코드가 곧 명세의 2자리 코드다.
 * 받아온 목록을 화면에서 주소 앞글자로 거르던 방식을 대신하므로, 표기가
 * '충북'이냐 '충청북도'냐에 따라 결과가 갈리지 않는다.
 */
export function getMyReviews({
  regionCode,
  sort = 'RECENT',
  page = 1,
  size = REVIEW_PAGE_SIZE,
}: MyReviewQuery = {}): Promise<MyReviewsPage> {
  if (env.useMock) return mockGetMyReviews({ regionCode, sort, page, size })
  return api
    .get<MyReviewsResponse>('/users/me/reviews', {
      // 전국이면 regionCode를 빼고 부른다. 서버의 page는 0부터다.
      params: { regionCode, sort, page: page - 1, size },
    })
    .then(toMyReviewsPage)
}

export function deleteReview(reviewId: number): Promise<void> {
  if (env.useMock) return mockDeleteReview()
  return api.delete<void>(`/reviews/${reviewId}`)
}

/**
 * 내 리뷰 상세(MY-05). 수정 화면을 열 때 폼을 채울 값을 받아온다.
 *
 * 목록과 달리 내 것만 볼 수 있는 경로다 — 남의 리뷰를 부르면 403이다.
 */
export function getReviewDetail(reviewId: number): Promise<MyReviewDetail> {
  if (env.useMock) return mockGetReviewDetail(reviewId)
  return api.get<MyReviewDetailDto>(`/users/me/reviews/${reviewId}`).then(toMyReviewDetail)
}

/**
 * 리뷰 수정(REV-05). 보낸 필드만 바뀐다.
 *
 * **imageUrls는 전체 교체다.** 부분 추가·삭제가 아니라, 보낸 배열이 곧 남는
 * 사진의 전부다 — 남길 기존 URL까지 같이 보내야 한다. 아예 안 보내면 그대로 둔다.
 *
 * 방문일은 넣지 않는다. 서버가 막는 값이라 보내봐야 400이다.
 *
 * TODO: 새 사진은 602로 먼저 올리고 받은 URL을 넣어야 한다. 지금 화면은 기존
 * 사진을 그대로 돌려보내기만 하고 새로 올리는 길이 없다.
 */
export function updateReview(reviewId: number, values: MyReviewFormValues): Promise<void> {
  if (env.useMock) return mockUpdateReview()
  return api.patch<void>(`/reviews/${reviewId}`, values)
}
