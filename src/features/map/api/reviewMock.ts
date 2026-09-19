import { ApiError } from '@/api'

import type {
  CreateReviewBody,
  CreateReviewResult,
  PublicReview,
  ReviewPage,
  ReviewSort,
} from '@/types/review'

/** 지도 리뷰 탭의 화면 검토용 데이터. 실제 리뷰 API 계약과는 별개다. */
const REVIEW_PREVIEWS = [
  {
    nickname: '느린주말',
    visitedAt: '2026-09-13',
    rating: 5,
    content:
      '오전에 방문하니 여유롭게 쉬기 좋았어요. 탕에서 나온 뒤 휴게실에서 잠깐 쉬었다 가니 주말을 길게 보낸 기분이에요.',
    imageUrl: '/images/panel05.jpg',
  },
  {
    nickname: '온탕산책',
    visitedAt: '2026-09-10',
    rating: 4,
    content:
      '따뜻한 탕과 시원한 물을 번갈아 이용했어요. 탈의실이 깔끔하고 수건도 준비되어 있어서 짐을 가볍게 챙겨도 괜찮았습니다.',
    imageUrl: '/images/hero.jpg',
  },
  {
    nickname: '여행하는수달',
    visitedAt: '2026-09-07',
    rating: 5,
    content:
      '가족과 함께 다녀왔어요. 주차가 편하고 주변에 식사할 곳도 있어 반나절 일정으로 딱 좋았습니다. 다음에는 평일에 와보고 싶어요.',
    imageUrl: undefined,
  },
  {
    nickname: '잠깐의쉼',
    visitedAt: '2026-09-04',
    rating: 4,
    content:
      '혼자 방문해도 편안한 분위기였어요. 오후에는 조금 붐벼서 조용히 쉬고 싶다면 이른 시간 방문을 추천해요.',
    imageUrl: undefined,
  },
]

export function getMockReviews(onsenId: number, reviewCount: number) {
  const start = (onsenId - 1) % REVIEW_PREVIEWS.length
  return Array.from({ length: Math.min(3, reviewCount) }, (_, index) => ({
    ...REVIEW_PREVIEWS[(start + index) % REVIEW_PREVIEWS.length],
    id: `${onsenId}-${index}`,
  })).sort((a, b) => b.visitedAt.localeCompare(a.visitedAt))
}

export function mockFetchReviews(
  onsenId: number,
  params: { sort: ReviewSort; page: number; size: number },
): Promise<ReviewPage> {
  const totalElements = Math.max(0, ((onsenId * 7) % 24) + 1)
  const start = (onsenId - 1) % REVIEW_PREVIEWS.length
  const reviews: PublicReview[] = Array.from({ length: totalElements }, (_, index) => {
    const seed = REVIEW_PREVIEWS[(start + index) % REVIEW_PREVIEWS.length]
    return {
      reviewId: onsenId * 1000 + index,
      author: {
        nickname: index % 9 === 8 ? '탈퇴한 사용자' : seed.nickname,
        level: index % 9 === 8 ? null : 2 + ((onsenId + index) % 5),
        title: index % 9 === 8 ? null : index % 2 === 0 ? '온천 애호가' : '동네 탐험가',
        profileShareToken: index % 9 === 8 ? null : `mock-${onsenId}-${index}`,
      },
      rating: Math.max(3, Math.min(5, seed.rating - (index % 2 === 0 ? 0 : 1))),
      visitedAt: seed.visitedAt,
      isRevisit: index % 3 === 0,
      spec: {
        visitTime: index % 2 === 0 ? 'AFTERNOON' : 'EVENING',
        clean: Math.max(3, seed.rating),
        crowd: 2 + (index % 3),
        facility: Math.max(3, seed.rating - 1),
      },
      body: seed.content,
      images: seed.imageUrl && index % 2 === 0 ? [seed.imageUrl] : [],
      isMine: index === 0 && onsenId % 2 === 0,
      isEdited: index % 4 === 0,
      createdAt: `${seed.visitedAt}T20:10:00+09:00`,
    }
  })

  const sorted = [...reviews].sort((a, b) => {
    if (params.sort === 'RATING_DESC') return b.rating - a.rating || b.createdAt.localeCompare(a.createdAt)
    if (params.sort === 'PHOTO_FIRST')
      return Number(b.images.length > 0) - Number(a.images.length > 0) || b.createdAt.localeCompare(a.createdAt)
    return b.createdAt.localeCompare(a.createdAt)
  })
  const startIndex = params.page * params.size
  const content = sorted.slice(startIndex, startIndex + params.size)
  const totalPages = Math.max(1, Math.ceil(totalElements / params.size))

  return new Promise((resolve) =>
    setTimeout(
      () =>
        resolve({
          content,
          page: params.page,
          size: params.size,
          totalElements,
          totalPages,
          last: params.page >= totalPages - 1,
        }),
      250,
    ),
  )
}

/** 같은 온천·같은 방문일 중복을 막는 서버 규칙(REV-06)을 목에서도 재현한다. */
const submitted = new Set<string>()

let nextReviewId = 900

export function mockCreateReview(
  onsenId: number,
  body: CreateReviewBody,
): Promise<CreateReviewResult> {
  const visitedAt = body.visitedAt ?? todayInKst()
  const key = `${onsenId}|${visitedAt}`

  if (submitted.has(key)) {
    return Promise.reject(
      new ApiError(409, '같은 날짜에 이미 이 온천 리뷰를 작성했어요.', {
        code: 'DAILY_REVIEW_LIMIT',
      }),
    )
  }

  submitted.add(key)
  const reviewId = ++nextReviewId
  // 첫 방문 여부·레벨업은 서버가 계산한다. 목은 축하 연출을 확인할 수 있게 번갈아 준다.
  const isFirstVisit = submitted.size % 2 === 1

  return new Promise((resolve) =>
    setTimeout(
      () =>
        resolve({
          reviewId,
          onsenId,
          visitedAt,
          createdAt: new Date().toISOString(),
          reward: {
            isFirstVisit,
            sidoCode: '43',
            sigunguCode: '43130',
            regionName: '충청북도 충주시',
            grapeCountAfter: 2 + submitted.size,
            visitedOnsenCount: 10 + submitted.size,
            levelUp: isFirstVisit,
            levelBefore: 3,
            levelAfter: isFirstVisit ? 4 : 3,
            titleAfter: '온천 애호가',
          },
        }),
      400,
    ),
  )
}

/** 방문일 기본값은 KST 기준 오늘 — 서버와 같은 기준을 써야 중복 판정이 어긋나지 않는다. */
export function todayInKst(): string {
  const kst = new Date(Date.now() + 9 * 60 * 60 * 1000)
  return kst.toISOString().slice(0, 10)
}
