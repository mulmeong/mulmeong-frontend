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
 *
 * 17개 시·도를 그대로 늘어놓으면 칩이 너무 많아 시안이 권역으로 묶었다.
 * prefixes는 주소 앞부분과 대조할 시·도 이름이다 (예: '경북 울진' -> '경북').
 *
 * 수도권은 서울과 경기·인천으로 나눴다. 서울·경기를 묶으면 인천만 남아
 * 한쪽이 거의 비어버리는데, 이렇게 나누면 양쪽 수가 비슷해진다.
 *
 * TODO: types/onsen.ts의 REGIONS(서울/경기/인천/강원/충청/경상/전라/제주)와
 * 묶는 단위가 다르다. 지도 필터와 같은 값을 써야 하는지 확인 필요.
 * 울산을 경남·부산에, 세종을 충청·대전에 넣은 것도 시안에 명시가 없어 임의로 정했다.
 */
export const REVIEW_REGIONS = [
  { id: 'all', label: '전국', prefixes: [] },
  { id: 'seoul', label: '서울', prefixes: ['서울'] },
  { id: 'gyeonggi', label: '경기·인천', prefixes: ['경기', '인천'] },
  { id: 'gangwon', label: '강원', prefixes: ['강원'] },
  { id: 'chungcheong', label: '충청·대전', prefixes: ['충북', '충남', '대전', '세종'] },
  { id: 'gyeongbuk', label: '경북·대구', prefixes: ['경북', '대구'] },
  { id: 'gyeongnam', label: '경남·부산', prefixes: ['경남', '부산', '울산'] },
  { id: 'jeonbuk', label: '전북', prefixes: ['전북'] },
  { id: 'jeonnam', label: '전남·광주', prefixes: ['전남', '광주'] },
  { id: 'jeju', label: '제주', prefixes: ['제주'] },
] as const

export type ReviewRegion = (typeof REVIEW_REGIONS)[number]['id']

export type MyReviewsPage = {
  items: MyReview[]
  /** 전체 리뷰 수. 목록 위 '리뷰 N개'에 쓴다. */
  totalCount: number
  page: number
  totalPages: number
}
