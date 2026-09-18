import { ApiError, tokenStorage } from '@/api'
import { MAGAZINE_CATEGORIES } from '@/types/magazine'
import type { Magazine, MagazineDetail, MagazineList, MagazineListParams } from '@/types/magazine'

const seeds = [
  [
    '지하 250m에서 올라오는 왕의 물, 수안보',
    '물이 먼저 있었고, 마을이 나중에 생겼다',
    '43',
    '충청북도',
    '/images/panel02.jpg',
  ],
  [
    '기차에서 내려, 물에 닿기까지',
    '충주역에서 시작하는 느린 하루',
    '43',
    '충청북도',
    '/images/panel01.jpg',
  ],
  [
    '비 오는 날에는 노천탕으로',
    '빗소리만큼 천천히 쉬어가는 주말',
    '51',
    '강원특별자치도',
    '/images/hero.jpg',
  ],
  [
    '탄산천과 유황천의 차이',
    '물의 성분을 알고 나면 달라지는 목욕',
    null,
    '전국',
    '/images/panel03.jpg',
  ],
  [
    '온천 뒤 한 그릇, 안동의 식탁',
    '골목을 따라 찾은 따뜻한 한 끼',
    '47',
    '경상북도',
    '/images/panel05.jpg',
  ],
  [
    '오래된 목욕탕의 아침',
    '도시 한가운데 남은 느린 풍경',
    '11',
    '서울특별시',
    '/images/panel05.jpg',
  ],
  [
    '두 발로 찾아가는 제주 온천',
    '차 없이 떠나는 남쪽의 물 여행',
    '50',
    '제주특별자치도',
    '/images/panel01.jpg',
  ],
  [
    '겨울, 물의 온도를 기억하는 법',
    '차가운 공기와 따뜻한 물 사이',
    '41',
    '경기도',
    '/images/hero.jpg',
  ],
  [
    '온천수의 깊이를 읽다',
    '땅 아래의 시간이 물이 되는 순간',
    '28',
    '인천광역시',
    '/images/panel03.jpg',
  ],
  [
    '시장 골목에서 마무리하는 여행',
    '목욕 후 더 맛있는 작은 즐거움',
    '48',
    '경상남도',
    '/images/panel02.jpg',
  ],
]
const magazines: Magazine[] = Array.from({ length: 25 }, (_, index) => {
  const seed = seeds[index % seeds.length]
  const category = MAGAZINE_CATEGORIES[index % 5]
  return {
    magazineId: index + 1,
    category: category.code,
    categoryLabel: category.label,
    title: seed[0]! + (index >= 10 ? ` · 두 번째 풍경 ${Math.floor(index / 10)}` : ''),
    subtitle: seed[1],
    sidoCode: seed[2],
    regionName: seed[3]!,
    thumbnailUrl: seed[4],
    heroImageUrl: index < 5 ? seed[4] : null,
    readMinutes: 3 + (index % 9),
    likeCount: 42 + ((index * 37) % 181),
    isLiked: false,
    publishedAt: `2026-08-${String(28 - index).padStart(2, '0')}T09:00:00+09:00`,
  }
})
const likes = new Map<string, Set<number>>()
const delay = () => new Promise((resolve) => setTimeout(resolve, 220))
function personalize(item: Magazine): Magazine {
  const token = tokenStorage.get()
  return { ...item, isLiked: !!token && !!likes.get(token)?.has(item.magazineId) }
}
export async function mockFetchMagazines(params: MagazineListParams): Promise<MagazineList> {
  await delay()
  let items = magazines.filter(
    (item) =>
      (!params.category || params.category === 'ALL' || item.category === params.category) &&
      (!params.sidoCode || item.sidoCode === params.sidoCode) &&
      (!params.featured || !!item.heroImageUrl),
  )
  items = [...items].sort((a, b) =>
    params.sort === 'POPULAR'
      ? b.likeCount - a.likeCount
      : params.sort === 'READ_TIME'
        ? a.readMinutes - b.readMinutes
        : b.publishedAt.localeCompare(a.publishedAt),
  )
  const page = params.page ?? 0,
    size = params.size ?? 12
  return {
    content: items.slice(page * size, (page + 1) * size).map(personalize),
    page,
    size,
    totalElements: items.length,
    totalPages: Math.ceil(items.length / size),
    last: (page + 1) * size >= items.length,
    categories:
      page === 0
        ? MAGAZINE_CATEGORIES.map((category) => ({
            ...category,
            count: magazines.filter(
              (item) =>
                item.category === category.code &&
                (!params.sidoCode || item.sidoCode === params.sidoCode),
            ).length,
          }))
        : null,
    regions:
      page === 0
        ? [
            ...new Set(
              magazines.map((item) => item.sidoCode).filter((code): code is string => !!code),
            ),
          ].map((sidoCode) => ({
            sidoCode,
            name: magazines.find((item) => item.sidoCode === sidoCode)!.regionName,
            count: magazines.filter((item) => item.sidoCode === sidoCode).length,
          }))
        : null,
  }
}
export async function mockFetchMagazine(id: number): Promise<MagazineDetail> {
  await delay()
  const item = magazines.find((article) => article.magazineId === id)
  if (!item) throw new ApiError(404, '글을 찾을 수 없습니다.')
  const next = magazines.find(
    (article) => article.category === item.category && article.publishedAt < item.publishedAt,
  )
  return {
    ...personalize(item),
    author: '물멍 편집팀',
    photographer: null,
    bodyFormat: 'MULMUNG_TEXT',
    body: `${item.regionName}의 아침은 물이 데워지는 시간에 맞춰 시작됩니다. 골목의 가게들이 문을 열기 전, 사람들은 익숙한 길을 따라 탕으로 향합니다. 오늘은 서두르지 않고 그 길을 걸어봅니다.\n\n[IMG]따뜻한 물과 고요한 빛이 머무는 풍경. ⓒ 물멍\n\n탕에 들어가기 전 잠시 앉아 바깥을 바라봅니다. 여행의 목적이 꼭 많은 곳을 보는 데 있을 필요는 없습니다. 한 장소에 오래 머무르며 몸의 감각을 되찾는 것도 충분한 여행이 됩니다.\n\n[QUOTE]물이 먼저 있었고, 그 물을 중심으로 사람들의 하루가 이어졌다.\n\n목욕을 마친 뒤에는 가까운 골목으로 걸음을 옮깁니다. 작은 식당에서 따뜻한 한 끼를 먹고, 느린 걸음으로 역으로 돌아갑니다. 다음에 다시 올 이유는 이미 충분합니다.\n\n이 글은 화면 확인을 위한 예시 콘텐츠입니다.`,
    relatedPlaces:
      id % 5 === 0
        ? []
        : [
            {
              placeId: 12,
              name: '수안보온천',
              thumbnail: '/images/panel02.jpg',
              sido: '충청북도',
              sigungu: '충주시',
              lat: 36.8412,
              lng: 128.0021,
              subText: '53℃ · 알칼리성',
              accessSummary: '충주역 → 246번 버스 25분',
            },
          ],
    next: next
      ? {
          magazineId: next.magazineId,
          title: next.title,
          categoryLabel: next.categoryLabel,
          readMinutes: next.readMinutes,
        }
      : null,
    shareUrl: `${window.location.origin}/magazine/${id}`,
  }
}
export async function mockSetMagazineLike(id: number, liked: boolean) {
  await delay()
  const token = tokenStorage.get()
  if (!token) throw new ApiError(401, '로그인이 필요합니다.')
  const item = magazines.find((article) => article.magazineId === id)
  if (!item) throw new ApiError(404, '글을 찾을 수 없습니다.')
  const userLikes = likes.get(token) ?? new Set<number>()
  const previous = userLikes.has(id)
  if (previous !== liked) {
    if (liked) userLikes.add(id)
    else userLikes.delete(id)
    item.likeCount = Math.max(0, item.likeCount + (liked ? 1 : -1))
  }
  likes.set(token, userLikes)
}
