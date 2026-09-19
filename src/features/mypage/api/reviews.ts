import { api } from '@/api'
import { env } from '@/lib/env'

import {
  mockDeleteReview,
  mockGetMyReviews,
  mockGetRegionReviews,
  mockGetReviewDetail,
  mockUpdateReview,
} from './reviewsMock'
import { toMyReviewsPage, type MyReviewsResponse } from './reviewsDto'

import type {
  MyReviewDetail,
  MyReviewFormValues,
  MyReviewsPage,
  ReviewRegion,
  ReviewSort,
} from '@/types/myReview'

/**
 * 목록 탭이 쓰는 호출. 아직 명세(MY-04)와 계약이 어긋난다 —
 * 정렬 값(recent/region/rating vs RECENT/OLDEST/RATING_DESC), 0부터 세는 page,
 * 권역 대신 regionCode. 탭의 칩 구조까지 같이 바꿔야 해서 따로 진행한다.
 *
 * TODO: 탭을 명세로 옮기면 아래 getRegionReviews와 합쳐 이 함수를 없앤다.
 */
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

/**
 * 한 지역의 최신 리뷰 몇 건. 내 지도 오른쪽 패널이 쓴다.
 *
 * regionCode를 서버에 그대로 넘긴다 — 시·도 코드가 곧 명세의 2자리 코드다.
 * 받아온 목록을 화면에서 주소 앞글자로 거르던 방식을 대신한다. 표기가
 * '충북'이냐 '충청북도'냐에 따라 결과가 갈리던 문제가 없어진다.
 */
export function getRegionReviews(
  regionCode: string | undefined,
  size: number,
): Promise<MyReviewsPage> {
  if (env.useMock) return mockGetRegionReviews(regionCode, size)
  return api
    .get<MyReviewsResponse>('/users/me/reviews', {
      // 전국이면 regionCode를 빼고 부른다. page는 0부터다.
      params: { regionCode, sort: 'RECENT', page: 0, size },
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
