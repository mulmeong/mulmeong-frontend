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
