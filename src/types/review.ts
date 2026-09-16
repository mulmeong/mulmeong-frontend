import type { RegionGroupId } from '@/types/region'

/**
 * 내 리뷰 목록(MY-02).
 *
 * TODO: 기능명세서의 REV-* 항목과 대조 필요.
 * 지금 필드는 시안에 실제로 보이는 것만 추린 것이라, 명세에 다른 이름이나
 * 추가 필드가 있으면 맞춰야 한다.
 */
export type MyReview = {
  id: number
  /** 리뷰 대상 온천 — 눌러서 상세로 갈 수 있어야 하므로 id를 같이 받는다. */
  onsenId: number
  onsenName: string
  /** 시·도 + 시군구 (예: 경북 울진) */
  onsenAddress: string
  /** 별점 1~5 */
  rating: number
  content: string
  /** 작성일 ISO 문자열. 화면에는 2026.08.28 형태로 보여준다. */
  createdAt: string
  /** 리뷰에 첨부된 사진. 없을 수 있다. */
  imageUrl?: string
}

/** 시안의 정렬 칩 세 가지. */
export type ReviewSort = 'recent' | 'region' | 'rating'

export const REVIEW_SORTS: { id: ReviewSort; label: string }[] = [
  { id: 'recent', label: '최신순' },
  { id: 'region', label: '지역별' },
  { id: 'rating', label: '별점순' },
]

/**
 * 지역별 정렬에서 고르는 묶음.
 * 찜한 장소(MY-03)가 같은 칩을 써서 types/region.ts로 옮겼다.
 */
export type ReviewRegion = RegionGroupId

export type MyReviewsPage = {
  items: MyReview[]
  /** 전체 리뷰 수. 목록 위 '리뷰 N개'에 쓴다. */
  totalCount: number
  page: number
  totalPages: number
}
