/** REV-01 리뷰 작성 = 방문 인증. 포도알·레벨이 여기서 바뀐다. */

export const VISIT_TIMES = ['MORNING', 'AFTERNOON', 'EVENING', 'NIGHT'] as const
export type VisitTime = (typeof VISIT_TIMES)[number]

export const VISIT_TIME_LABELS: Record<VisitTime, string> = {
  MORNING: '오전',
  AFTERNOON: '오후',
  EVENING: '저녁',
  NIGHT: '심야',
}

/** 별점·청결·혼잡·시설 공통 범위. */
export const RATING_MIN = 1
export const RATING_MAX = 5

/** 본문은 0자를 허용한다 (REV-02) — 최대 길이만 막는다. */
export const REVIEW_BODY_MAX = 1000

/** 한 번에 올릴 수 있는 사진 수. 602 업로드 명세가 오면 쓴다. */
export const REVIEW_IMAGE_MAX = 5

export type ReviewSpec = {
  visitTime: VisitTime
  /** 1~5 청결도. */
  clean: number
  /** 1~5 혼잡도. 낮을수록 한산하다. */
  crowd: number
  /** 1~5 시설 만족도. */
  facility: number
}

export type CreateReviewBody = {
  rating: number
  /** YYYY-MM-DD. 없으면 서버가 오늘(KST)로 채운다. */
  visitedAt?: string
  spec: ReviewSpec
  body?: string
  /** 602로 먼저 올리고 받은 URL. 배열 순서가 노출 순서다. */
  imageUrls?: string[]
}

/** 작성 직후 축하 연출에 쓰는 보상 정보. */
export type ReviewReward = {
  isFirstVisit: boolean
  sidoCode?: string | null
  sigunguCode?: string | null
  regionName?: string | null
  grapeCountAfter: number
  visitedOnsenCount: number
  levelUp: boolean
  levelBefore: number
  levelAfter: number
  titleAfter?: string | null
}

export type CreateReviewResult = {
  reviewId: number
  onsenId: number
  visitedAt: string
  createdAt: string
  reward: ReviewReward
}

export const REVIEW_SORTS = ['RECENT', 'RATING_DESC', 'PHOTO_FIRST'] as const
export type ReviewSort = (typeof REVIEW_SORTS)[number]

export const REVIEW_SORT_LABELS: Record<ReviewSort, string> = {
  RECENT: '최신순',
  RATING_DESC: '별점순',
  PHOTO_FIRST: '사진 먼저',
}

export type PublicReviewAuthor = {
  nickname: string
  level?: number | null
  title?: string | null
  profileShareToken?: string | null
}

export type PublicReview = {
  reviewId: number
  author: PublicReviewAuthor
  rating: number
  visitedAt: string
  isRevisit: boolean
  spec: ReviewSpec
  body: string
  images: string[]
  isMine: boolean
  isEdited: boolean
  createdAt: string
}

export type ReviewPage = {
  content: PublicReview[]
  page: number
  size: number
  totalElements: number
  totalPages: number
  last: boolean
}
