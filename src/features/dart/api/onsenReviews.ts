import { api } from '@/api/client'

import type { OnsenReviewPage, OnsenReviewSort } from '@/types/review'

/**
 * 온천별 리뷰 목록 (REV-07).
 *
 * 지도 화면의 온천 카드도 같은 목록을 쓸 수 있다. 아직 거기는 목 데이터만
 * 보여주고 있어서(ReviewSection), 붙이는 시점에 이 파일을 공용 자리로 옮기면
 * 된다 — 지금 남의 파일을 건드리지 않으려고 다트 쪽에 둔다.
 */

/** 서버 기본 10, 최대 30. */
export const ONSEN_REVIEW_SIZE = 10

type Query = {
  sort?: OnsenReviewSort
  /** 0부터 시작한다 — 마이페이지 리뷰 목록(1부터)과 다르다. */
  page?: number
  size?: number
}

/**
 * 비로그인도 볼 수 있지만 토큰이 있으면 보낸다 — 서버가 isMine을 채워준다.
 * 그래서 skipAuth를 쓰지 않는다.
 */
export function getOnsenReviews(
  onsenId: number,
  { sort = 'RECENT', page = 0, size = ONSEN_REVIEW_SIZE }: Query = {},
) {
  return api.get<OnsenReviewPage>(`/onsens/${onsenId}/reviews`, {
    params: { sort, page, size },
  })
}
