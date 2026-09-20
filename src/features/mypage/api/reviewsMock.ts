import { ApiError } from '@/api/ApiError'
import { SIDO_REGIONS } from '@/features/mypage/myMap/sidoRegions'
import { RATING_MAX, RATING_MIN, VISIT_TIMES } from '@/types/review'

import type { ReviewRegionFilter } from './reviewsDto'
import type {
  MyReview,
  MyReviewDetail,
  MyReviewQuery,
  MyReviewsPage,
  ReviewSort,
} from '@/types/myReview'

const MOCK_DELAY_MS = 300

/** 한 페이지 최대 5건. */
const PAGE_SIZE = 5

/**
 * 백엔드 연동 전까지 쓰는 표본.
 * 이름은 실존 업소로 오해되지 않게 지도 목(mapMock)과 같은 기준으로 둔다.
 * 주소는 시·도 이름으로 시작해야 한다 — 지역 필터가 앞부분을 대조해서다.
 */
const MOCK_REVIEWS: MyReview[] = [
  [
    '덕구온천',
    '경북 울진',
    5,
    '2026-08-28',
    '노천탕에서 계곡 소리가 들린다. 물이 좀 뜨거운 편이라 오래 있진 못했지만, 겨울에 다시 오고 싶은 곳.',
  ],
  [
    '수안보온천',
    '충북 충주',
    4,
    '2026-08-14',
    '평일 오전이 한적하다. 시설은 오래됐지만 물이 좋다는 말이 무슨 뜻인지 알 것 같다.',
  ],
  [
    '온양온천',
    '충남 아산',
    4,
    '2026-07-30',
    '역에서 도보 7분. 뚜벅이로 가장 부담 없는 선택지. 저녁에 가면 붐빈다.',
  ],
  [
    '척산온천',
    '강원 속초',
    5,
    '2026-07-18',
    '바다 보고 와서 몸 녹이기 좋다. 주말 오후는 대기가 있었다.',
  ],
  [
    '부곡온천',
    '경남 창녕',
    3,
    '2026-07-05',
    '수온은 높은데 시설이 노후했다. 가격을 생각하면 납득은 된다.',
  ],
  [
    '해운대온천',
    '부산 해운대',
    4,
    '2026-06-22',
    '해수온천이라 물이 짭짤하다. 처음엔 낯선데 나오고 나면 개운하다.',
  ],
  [
    '유성온천',
    '대전 유성',
    4,
    '2026-06-09',
    '도심 한복판인데 물이 부드럽다. 출장 끝나고 들르기 좋았다.',
  ],
  ['백암온천', '경북 울진', 5, '2026-05-27', '조용하다. 사람이 적어서 노천탕을 거의 혼자 썼다.'],
  ['도고온천', '충남 아산', 3, '2026-05-13', '유황 냄새가 꽤 강하다. 호불호가 갈릴 듯.'],
  ['오색온천', '강원 양양', 5, '2026-04-29', '설악산 들렀다가 갔다. 물 온도가 딱 맞았다.'],
  ['담양온천', '전남 담양', 4, '2026-04-16', '대나무숲 보고 와서 들르기 좋다. 주차가 넉넉했다.'],
  ['마금산온천', '경남 창원', 3, '2026-04-02', '평범하다. 근처에 볼거리가 있으면 겸사겸사.'],
  [
    '아산온천',
    '충남 아산',
    4,
    '2026-03-20',
    '가족탕이 있어서 아이랑 갔다. 붐비지 않는 시간대를 고르는 게 낫다.',
  ],
  ['왕궁온천', '전북 익산', 3, '2026-03-07', '규모는 작다. 대신 조용하고 관리는 잘 되어 있다.'],
  ['수락온천', '경기 가평', 4, '2026-02-21', '서울에서 한 시간대. 당일치기로 가장 무난했다.'],
  [
    '산정호수온천',
    '경기 포천',
    4,
    '2026-02-08',
    '겨울에 눈 오는 날 갔다. 노천탕에서 보는 풍경이 좋았다.',
  ],
  ['테르메덴', '경기 이천', 5, '2026-01-25', '시설이 깔끔하다. 아이 동반이 많아 조용하진 않다.'],
  [
    '서귀포온천',
    '제주 서귀포',
    5,
    '2026-01-11',
    '바다가 보인다. 제주 일정 마지막 날에 넣으면 좋다.',
  ],
  ['광주온천', '광주 북구', 3, '2025-12-28', '동네 목욕탕 느낌. 기대를 낮추면 나쁘지 않다.'],
  ['울산온천', '울산 울주', 4, '2025-12-14', '주말인데도 한산했다. 물은 미끈한 편.'],
  [
    '인천온천',
    '인천 강화',
    4,
    '2025-11-30',
    '강화도 드라이브 코스에 넣기 좋다. 바다 근처라 겨울엔 춥다.',
  ],
  ['대구온천', '대구 달성', 3, '2025-11-16', '접근성은 좋다. 특별한 점은 없었다.'],
  ['세종온천', '세종 조치원', 4, '2025-11-02', '신축이라 깨끗하다. 아직 사람이 많지 않다.'],
  [
    '동래온천',
    '부산 동래',
    5,
    '2025-10-19',
    '오래된 곳 특유의 분위기가 있다. 탕이 여러 개라 돌아다니는 재미가 있다.',
  ],
].map(([onsenName, onsenAddress, rating, date, content], index) => ({
  id: index + 1,
  onsenId: 100 + index,
  onsenName: onsenName as string,
  onsenAddress: onsenAddress as string,
  rating: rating as number,
  content: content as string,
  createdAt: `${date as string}T10:00:00+09:00`,
}))

function delay<T>(value: T): Promise<T> {
  return new Promise((resolve) => setTimeout(() => resolve(value), MOCK_DELAY_MS))
}

function sortReviews(reviews: MyReview[], sort: ReviewSort): MyReview[] {
  const sorted = [...reviews]
  if (sort === 'RATING_DESC') return sorted.sort((a, b) => b.rating - a.rating)
  if (sort === 'OLDEST') return sorted.sort((a, b) => a.createdAt.localeCompare(b.createdAt))
  return sorted.sort((a, b) => b.createdAt.localeCompare(a.createdAt))
}

/** 표본 주소는 '경북 울진'처럼 짧은 이름이라, 코드를 이름으로 바꿔 앞부분을 대조한다. */
function matchesRegionCode(review: MyReview, regionCode: string | undefined): boolean {
  if (!regionCode) return true
  const name = SIDO_REGIONS.find((region) => region.code === regionCode)?.name
  return review.onsenAddress.startsWith(name ?? regionCode)
}

/**
 * 지역 칩. 서버는 내가 리뷰를 쓴 지역만, 많이 쓴 순으로 내려준다.
 *
 * 지금 고른 지역과 무관하게 늘 전체를 만든다 — 거른 결과로 칩을 만들면
 * 충북을 고르는 순간 다른 칩이 사라져 되돌아갈 방법이 없어진다.
 */
function regionFilters(): ReviewRegionFilter[] {
  const counts = new Map<string, number>()

  for (const review of MOCK_REVIEWS) {
    const region = SIDO_REGIONS.find((item) => review.onsenAddress.startsWith(item.name))
    if (region) counts.set(region.code, (counts.get(region.code) ?? 0) + 1)
  }

  return [...counts]
    .map(([regionCode, count]) => ({
      regionCode,
      // 실제 서버는 '충청북도'처럼 정식 명칭을 준다. 화면에서 줄여 쓰는지 확인하려고 맞춰 둔다.
      name: SIDO_REGIONS.find((item) => item.code === regionCode)?.name ?? regionCode,
      count,
    }))
    .sort((a, b) => b.count - a.count)
}

export function mockGetMyReviews({
  regionCode,
  sort = 'RECENT',
  page = 1,
  size = PAGE_SIZE,
}: MyReviewQuery = {}): Promise<MyReviewsPage> {
  const filtered = sortReviews(
    MOCK_REVIEWS.filter((review) => matchesRegionCode(review, regionCode)),
    sort,
  )

  const totalPages = Math.max(1, Math.ceil(filtered.length / size))
  // 필터를 좁혀 페이지 수가 줄면 현재 페이지가 범위를 넘을 수 있다.
  const safePage = Math.min(page, totalPages)
  const start = (safePage - 1) * size

  return delay({
    items: filtered.slice(start, start + size),
    totalCount: filtered.length,
    page: safePage,
    totalPages,
    regions: regionFilters(),
  })
}

export function mockDeleteReview(): Promise<void> {
  return delay(undefined)
}

/**
 * 수정 폼을 채울 값.
 *
 * 목록 표본(MOCK_REVIEWS)에는 별점·본문·날짜밖에 없어서, 폼에만 있는 값은
 * id로 만들어낸다. 열 때마다 같은 값이 나오도록 무작위를 쓰지 않는다 —
 * 수정하다 새로고침하면 다른 리뷰로 바뀌는 것처럼 보인다.
 */
export function mockGetReviewDetail(reviewId: number): Promise<MyReviewDetail> {
  const review = MOCK_REVIEWS.find((item) => item.id === reviewId)
  if (!review) return Promise.reject(new ApiError(404, '리뷰를 찾을 수 없습니다.'))

  return delay({
    id: review.id,
    onsenId: review.onsenId,
    onsenName: review.onsenName,
    onsenAddress: review.onsenAddress,
    updatedAt: null,
    spec: {
      visitTime: VISIT_TIMES[reviewId % VISIT_TIMES.length],
      // 전체 만족도 언저리에서 흔들리게 두되 허용 범위를 벗어나지 않게 자른다.
      clean: clampRating(review.rating),
      crowd: clampRating(review.rating - 1),
      facility: clampRating(review.rating + 1),
    },
    rating: review.rating,
    body: review.content,
    imageUrls: [],
    // 작성 계약의 visitedAt은 YYYY-MM-DD다.
    visitedAt: review.createdAt.slice(0, 10),
  })
}

function clampRating(value: number): number {
  return Math.min(RATING_MAX, Math.max(RATING_MIN, value))
}

export function mockUpdateReview(): Promise<void> {
  return delay(undefined)
}
