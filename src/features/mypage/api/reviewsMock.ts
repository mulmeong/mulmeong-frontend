import { matchesRegionGroup } from '@/types/region'

import type { MyReview, MyReviewsPage, ReviewRegion, ReviewSort } from '@/types/review'

const MOCK_DELAY_MS = 300

/** 시안과 같은 한 페이지 3건. */
const PAGE_SIZE = 3

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
  if (sort === 'rating') return sorted.sort((a, b) => b.rating - a.rating)
  if (sort === 'region') return sorted.sort((a, b) => a.onsenAddress.localeCompare(b.onsenAddress))
  return sorted.sort((a, b) => b.createdAt.localeCompare(a.createdAt))
}

export function mockGetMyReviews(
  sort: ReviewSort,
  page: number,
  region: ReviewRegion,
): Promise<MyReviewsPage> {
  const filtered = sortReviews(
    MOCK_REVIEWS.filter((review) => matchesRegionGroup(review.onsenAddress, region)),
    sort,
  )

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE))
  // 필터를 좁혀 페이지 수가 줄면 현재 페이지가 범위를 넘을 수 있다.
  const safePage = Math.min(page, totalPages)
  const start = (safePage - 1) * PAGE_SIZE

  return delay({
    items: filtered.slice(start, start + PAGE_SIZE),
    totalCount: filtered.length,
    page: safePage,
    totalPages,
  })
}

export function mockDeleteReview(): Promise<void> {
  return delay(undefined)
}
