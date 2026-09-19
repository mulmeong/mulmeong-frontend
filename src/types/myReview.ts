import type { ReviewRegionFilter } from '@/features/mypage/api/reviewsDto'
import type { RegionGroupId } from '@/types/region'
import type { CreateReviewBody, ReviewSpec } from '@/types/review'

/**
 * 마이페이지 내 리뷰(MY-02) 전용 타입.
 *
 * 리뷰 작성 계약(CreateReviewBody 등)은 types/review.ts에 있고 지도 담당이 관리한다.
 * 여기에는 목록·수정 화면에만 필요한 것만 둔다 — 같은 파일에 섞으면
 * 양쪽이 같은 줄을 고쳐 머지할 때마다 충돌한다.
 *
 * 점수 범위·본문 길이·사진 수 제한은 types/review.ts 값을 그대로 쓴다.
 * 옮겨 적으면 한쪽만 바뀌었을 때 갈라진다.
 */

/** 목록 한 줄. */
export type MyReview = {
  id: number
  /** 리뷰 대상 온천 — 눌러서 상세로 갈 수 있어야 하므로 id를 같이 받는다. */
  onsenId: number
  onsenName: string
  /** 시·도 + 시군구 (예: 경북 울진) */
  onsenAddress: string
  /** 전체 만족도 RATING_MIN~RATING_MAX. */
  rating: number
  /** 리뷰 본문. 작성 계약에서는 body다. */
  content: string
  /** 작성일 ISO 문자열. 화면에는 2026.08.28 형태로 보여준다. */
  createdAt: string
  /** 리뷰에 첨부된 사진 중 첫 장. 없을 수 있다. */
  imageUrl?: string
}

/** 시안의 정렬 칩 세 가지. */
export type ReviewSort = 'recent' | 'region' | 'rating'

export const REVIEW_SORTS: { id: ReviewSort; label: string }[] = [
  { id: 'recent', label: '최신순' },
  { id: 'region', label: '지역별' },
  { id: 'rating', label: '별점순' },
]

/** 지역 칩은 찜한 장소와 같은 묶음을 쓴다. */
export type ReviewRegion = RegionGroupId

export type MyReviewsPage = {
  items: MyReview[]
  /** 전체 리뷰 수. 목록 위 '리뷰 N개'에 쓴다. */
  totalCount: number
  page: number
  totalPages: number
  /**
   * 서버가 주는 지역 칩 — 내가 리뷰를 쓴 지역만 담긴다.
   * TODO: 지금 화면은 아직 REGION_GROUPS 권역 칩을 쓴다. 목록 탭을 명세(MY-04)로
   * 옮길 때 이 값으로 칩을 그린다. 그때 ReviewRegion·REGION_GROUPS 의존이 없어진다.
   */
  regions?: ReviewRegionFilter[]
}

/** ReviewSpec에서 점수인 항목만. visitTime은 같은 객체에 있지만 숫자가 아니다. */
export type SpecScoreKey = Exclude<keyof ReviewSpec, 'visitTime'>

/**
 * 세부 평가 항목의 화면 이름.
 * 작성 폼(features/map/components/ReviewForm.tsx)의 SPEC_FIELDS와 같은 값이다.
 * 혼잡도는 낮을수록 한산하다 — 높다고 좋은 항목이 아니다.
 */
export const SPEC_FIELDS: { key: SpecScoreKey; label: string; low: string; high: string }[] = [
  { key: 'clean', label: '청결도', low: '아쉬움', high: '만족' },
  { key: 'crowd', label: '혼잡도', low: '한산', high: '붐빔' },
  { key: 'facility', label: '시설', low: '아쉬움', high: '만족' },
]

/**
 * 수정 폼이 보내는 값. 작성 계약과 같은 모양이라 그대로 쓴다.
 * 방문일은 작성에서만 선택이고 수정에서는 이미 값이 있으므로 필수로 좁힌다.
 */
export type MyReviewFormValues = Omit<CreateReviewBody, 'visitedAt'> & { visitedAt: string }

/**
 * 수정 화면이 받아오는 리뷰 한 건.
 * 목록(MyReview)에는 없는 폼 값까지 들어 있다 — 목록 응답을 무겁게 하지 않으려고 나눴다.
 */
export type MyReviewDetail = MyReviewFormValues & {
  id: number
  onsenId: number
  onsenName: string
  onsenAddress: string
  /** 장소 종류 — 시안 부제의 '온천 · 인천 남동구' 앞부분. */
  onsenCategory: string
}
