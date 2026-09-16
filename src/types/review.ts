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

/**
 * 작성·수정 폼에서 고르는 방문 시간대.
 * TODO: 값 목록이 시안에만 있다. 명세·BE와 맞춘 뒤 확정할 것.
 */
export const VISIT_TIMES = [
  { id: 'morning', label: '오전' },
  { id: 'afternoon', label: '오후' },
  { id: 'evening', label: '저녁' },
  { id: 'night', label: '심야' },
] as const

export type VisitTime = (typeof VISIT_TIMES)[number]['id']

/**
 * 이용 시설 — 여러 개 고를 수 있다.
 * TODO: 온천마다 있는 시설이 다른데 시안은 고정 목록이다.
 * 장소별로 받아와야 하는지 기획에 확인 필요.
 */
export const FACILITY_OPTIONS = [
  '노천탕',
  '사우나',
  '냉탕',
  '온탕',
  '휴게 공간',
  '주차',
  '샤워 시설',
  '수건 제공',
] as const

/** 세부 평가 항목. 각각 1~5. */
export const RATING_ASPECTS = [
  { id: 'cleanliness', label: '청결도' },
  { id: 'crowding', label: '혼잡도' },
  { id: 'facility', label: '시설 만족도' },
] as const

export type RatingAspect = (typeof RATING_ASPECTS)[number]['id']

/** 폼에 담기는 값. 저장할 때 이 형태로 보낸다. */
export type ReviewFormValues = {
  visitTime: VisitTime
  facilities: string[]
  /** 항목별 1~5. 아직 안 매긴 항목은 0. */
  aspectRatings: Record<RatingAspect, number>
  /** 전체 만족도 1~5. 목록의 별점 한 줄이 이 값이다. */
  rating: number
  content: string
  /** 최대 MAX_REVIEW_PHOTOS장. */
  photoUrls: string[]
  /** 방문일 ISO 문자열. */
  visitedAt: string
}

/** 시안의 '사진 3 / 5'. */
export const MAX_REVIEW_PHOTOS = 5

/**
 * 수정 화면이 받아오는 리뷰 한 건.
 * 목록(MyReview)에는 없는 폼 값까지 들어 있다 — 목록 응답을 무겁게 하지 않으려고 나눴다.
 */
export type ReviewDetail = ReviewFormValues & {
  id: number
  onsenId: number
  onsenName: string
  onsenAddress: string
  /** 장소 종류 — 시안 부제의 '온천 · 인천 남동구' 앞부분. */
  onsenCategory: string
}

export type MyReviewsPage = {
  items: MyReview[]
  /** 전체 리뷰 수. 목록 위 '리뷰 N개'에 쓴다. */
  totalCount: number
  page: number
  totalPages: number
}
