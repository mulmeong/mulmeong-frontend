import type { Magazine, MagazineIssue } from '@/types/magazine'

const MOCK_DELAY_MS = 300

/** 시안 '히어로 커버'의 ISSUE 04. */
const MOCK_ISSUE: MagazineIssue = {
  label: 'ISSUE 04',
  title: '겨울, 물의 온도',
  headline: '눈 맞으며 몸 담그기 좋은 곳 여덟',
  meta: '사진 8장 · 12분 · 강원·경북',
}

/** 제목·카테고리·분량은 시안 카드에 적힌 값을 그대로 쓴다. */
const MOCK_MAGAZINES: Magazine[] = [
  {
    id: 1,
    title: '30년 세신사의 손',
    coverImageUrl: '/images/panel05.jpg',
    subtitle: '때를 미는 일에도 결이 있다',
    category: '인터뷰',
    readMinutes: 8,
    region: '서울',
    likeCount: 214,
    publishedAt: '2026-01-12',
  },
  {
    id: 2,
    title: '탄산천과 유황천의 차이',
    coverImageUrl: '/images/hero.jpg',
    subtitle: '물이 몸에 닿는 방식',
    category: '수질·효능',
    readMinutes: 5,
    likeCount: 168,
    publishedAt: '2026-01-05',
  },
  {
    id: 3,
    title: '안동의 찜닭거리',
    coverImageUrl: '/images/panel01.jpg',
    subtitle: '온천 다녀와서 뭘 먹을까',
    category: '주변 관광',
    readMinutes: 9,
    region: '경상',
    likeCount: 132,
    publishedAt: '2025-12-28',
  },
  {
    id: 4,
    title: '유황 냄새를 따라 걸었다',
    coverImageUrl: '/images/panel02.jpg',
    subtitle: '덕구에서 백암까지, 겨울 물길을 사흘 걸었다',
    category: '온천 기행',
    readMinutes: 12,
    region: '경상',
    likeCount: 301,
    publishedAt: '2025-12-20',
    author: '이승주',
    photographer: '김온천',
    caption: '사진 설명 캡션. ⓒ 물멍',
    body: [
      '첫 문단은 조금 크게 시작합니다. 본문은 단 폭을 좁게 잡아 읽는 리듬을 만들고, 사진은 단을 뚫고 좌우로 나갑니다.',
      '위 필터 바가 상세에서도 고정되어 있어서, 읽다가 다른 카테고리가 궁금하면 탭 한 번으로 그 카테고리 목록으로 이동합니다.',
      '덕구에서 백암까지 사흘을 걸으며 물이 솟는 자리를 따라갔습니다. 겨울의 산길은 조용했고, 유황 냄새는 멀리서부터 났습니다.',
    ],
    quote: '물이 뜨거운 게 아니라, 겨울이 차가운 것이었다.',
  },
  {
    id: 5,
    title: '100년 된 목욕탕의 하루',
    coverImageUrl: '/images/panel05.jpg',
    subtitle: '문 여는 새벽 다섯 시부터',
    category: '사우나 문화',
    readMinutes: 9,
    region: '서울',
    likeCount: 97,
    publishedAt: '2025-12-11',
  },
]

function delay<T>(value: T): Promise<T> {
  return new Promise((resolve) => setTimeout(() => resolve(value), MOCK_DELAY_MS))
}

export function mockFetchIssue(): Promise<MagazineIssue> {
  return delay(MOCK_ISSUE)
}

export function mockFetchMagazine(id: number): Promise<Magazine | undefined> {
  return delay(MOCK_MAGAZINES.find((item) => item.id === id))
}

export function mockFetchMagazines(category?: string, region?: string): Promise<Magazine[]> {
  const filtered = MOCK_MAGAZINES.filter((item) => {
    const matchesCategory = !category || item.category === category
    const matchesRegion = !region || item.region === region
    return matchesCategory && matchesRegion
  })

  return delay(filtered)
}
