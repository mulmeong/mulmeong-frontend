import { api } from '@/api'
import { env } from '@/lib/env'

import {
  mockDeleteReview,
  mockGetMyReviews,
  mockGetReviewDetail,
  mockUpdateReview,
} from './reviewsMock'
import { toMyReviewsPage, type MyReviewsResponse } from './reviewsDto'

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
