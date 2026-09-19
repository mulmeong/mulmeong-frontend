import type { MyReview, MyReviewsPage } from '@/types/myReview'

/**
 * GET /users/me/reviews (MY-04) 응답. 명세 그대로 옮겼다.
 *
 * 화면이 쓰는 MyReview와 이름이 여럿 다르다. 화면 타입을 응답에 맞춰 바꾸는 대신
 * 여기서 변환한다 — 응답 모양은 BE 사정으로 또 바뀔 수 있고, 그때마다 화면
 * 코드를 따라 고치고 싶지 않다.
 */
export type MyReviewDto = {
  reviewId: number
  onsen: {
    onsenId: number
    name: string
    /** 정식 명칭으로 온다 (예: 충청북도). */
    sido: string
    sigungu: string
    thumbnail?: string
  }
  rating: number
  /** 본문 60자 컷. 본문이 비어 있으면 빈 문자열. */
  bodyPreview: string
  imageCount: number
  firstImage?: string
  visitedAt: string
  isRevisit: boolean
  createdAt: string
}

/** 서버가 내려주는 지역 칩. 내가 리뷰를 쓴 지역만 담긴다. */
export type ReviewRegionFilter = {
  /** 시도 2자리 또는 시군구 5자리. */
  regionCode: string
  name: string
  count: number
}

export type MyReviewsResponse = {
  content: MyReviewDto[]
  /** 0부터 센다. */
  page: number
  size: number
  totalElements: number
  totalPages: number
  last: boolean
  filters?: {
    regions: ReviewRegionFilter[]
  }
}

function toMyReview(dto: MyReviewDto): MyReview {
  return {
    id: dto.reviewId,
    onsenId: dto.onsen.onsenId,
    onsenName: dto.onsen.name,
    onsenAddress: `${dto.onsen.sido} ${dto.onsen.sigungu}`,
    rating: dto.rating,
    content: dto.bodyPreview,
    createdAt: dto.createdAt,
    imageUrl: dto.firstImage,
  }
}

export function toMyReviewsPage(response: MyReviewsResponse): MyReviewsPage {
  return {
    items: response.content.map(toMyReview),
    totalCount: response.totalElements,
    // 서버는 0부터, 화면(Pagination)은 1부터 센다.
    page: response.page + 1,
    totalPages: response.totalPages,
    regions: response.filters?.regions,
  }
}
