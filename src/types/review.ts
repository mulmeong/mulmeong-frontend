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

/* 아래는 REV-07 온천별 리뷰 목록(GET /onsens/{id}/reviews)에서 쓴다. */

export const ONSEN_REVIEW_SORTS = {
  RECENT: '최신순',
  RATING_DESC: '별점순',
  PHOTO_FIRST: '사진순',
} as const

export type OnsenReviewSort = keyof typeof ONSEN_REVIEW_SORTS

/**
 * 공개 프로필. 사용자 PK·이메일·실명은 오지 않는다.
 * 탈퇴 회원은 nickname이 '탈퇴한 사용자'이고 나머지가 전부 null이다.
 */
export type ReviewAuthor = {
  nickname: string
  level?: number | null
  title?: string | null
  profileShareToken?: string | null
}

export type OnsenReview = {
  reviewId: number
  author: ReviewAuthor
  rating: number
  /** YYYY-MM-DD */
  visitedAt: string
  isRevisit: boolean
  spec: ReviewSpec
  /** 본문은 0자를 허용한다 — 빈 문자열일 수 있다. */
  body: string
  /** CloudFront 원본 URL. 썸네일은 아직 없다. */
  images: string[]
  isMine: boolean
  /** 작성 후 고친 적이 있다. */
  isEdited: boolean
  createdAt: string
}

export type OnsenReviewPage = {
  content: OnsenReview[]
  page: number
  size: number
  totalElements: number
  totalPages: number
  last: boolean
}
