import type { MyReview, MyReviewDetail, MyReviewsPage } from '@/types/myReview'
import type { ReviewSpec } from '@/types/review'

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

/**
 * GET /users/me/reviews/{reviewId} (MY-05) 응답.
 *
 * 목록과 달리 온천 정보가 통째로 들어 있고, 사진이 문자열이 아니라 객체 배열이다.
 */
export type MyReviewDetailDto = {
  reviewId: number
  onsen: {
    onsenId: number
    name: string
    address: string
    lat: number
    lng: number
    thumbnail?: string | null
  }
  rating: number
  visitedAt: string
  spec: ReviewSpec
  body: string
  /** 썸네일 생성 기능이 없어 thumbnailUrl은 url과 같은 값이다. */
  images: { url: string; thumbnailUrl: string }[]
  createdAt: string
  /** 고친 적이 없으면 null. createdAt과 다르면 목록에 '수정됨'을 붙인다. */
  updatedAt: string | null
  isRevisit: boolean
}

export function toMyReviewDetail(dto: MyReviewDetailDto): MyReviewDetail {
  return {
    id: dto.reviewId,
    onsenId: dto.onsen.onsenId,
    onsenName: dto.onsen.name,
    onsenAddress: dto.onsen.address,
    rating: dto.rating,
    visitedAt: dto.visitedAt,
    spec: dto.spec,
    body: dto.body,
    // 수정(605)의 imageUrls에 그대로 되돌려 보낼 수 있는 값이다 (명세 비고).
    imageUrls: dto.images.map((image) => image.url),
    updatedAt: dto.updatedAt,
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
