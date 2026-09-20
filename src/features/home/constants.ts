/**
 * 진입 애니메이션 클래스. 키프레임은 index.css의 --animate-fade-up에 있다.
 * 지연은 쓰는 쪽에서 [animation-delay:...]로 붙인다 — Tailwind의 delay-*는
 * transition-delay라 애니메이션에는 듣지 않는다.
 */
export const FADE_IN = 'animate-fade-up motion-reduce:animate-none'

export type HomePanel = {
  id: string
  /** 축소·확장 양쪽에 노출되는 번호. '01' 같은 두 자리 표기 */
  number: string
  label: string
  title: string
  description: string
  /** public/images 아래 파일명 */
  image: string
  ctaLabel: string
  /** 라우트 경로. 시안 확정 전이라 임시로 '#' */
  to: string
}

/**
 * 라벨은 매거진 카테고리(types/magazine.ts의 MAGAZINE_CATEGORIES)와 같은 값·같은
 * 순서다. 다섯 개가 딱 맞아떨어져서 패널 하나가 카테고리 하나를 맡는다.
 *
 * 값을 거기서 끌어오지 않고 적어 둔 이유는, 카테고리가 늘거나 순서가 바뀌어도
 * 홈 패널이 저절로 따라 바뀌면 안 되기 때문이다 — 패널은 사진과 문구가 딸린
 * 편집물이라 개수가 같아야만 성립한다.
 *
 * TODO: 제목·설명·링크는 아직 시안 대기다. 화면 코드는 이 배열만 읽으므로
 * 여기만 고치면 된다. 개수를 바꿔도 동작한다 — 확장 비율은 패널 수와 무관하다.
 */
export const HOME_PANELS: HomePanel[] = [
  {
    id: 'panel01',
    number: '01',
    label: '온천마을 이야기',
    title: '경주 여행의 마지막 일정은 뜨거워야 한다',
    description: '보문단지 안에서 여행을 접는 법',
    image: 'panel01.jpg',
    ctaLabel: '자세히 보기',
    to: '/magazine/55',
  },
  {
    id: 'panel02',
    number: '02',
    label: '뚜벅이 가이드',
    title: '공업 도시의 목욕탕은 왜 물이 좋은가',
    description: '사상 담덕스파에서 생각한 것들',
    image: 'panel02.jpg',
    ctaLabel: '자세히 보기',
    to: '/magazine/115',
  },
  {
    id: 'panel03',
    number: '03',
    label: '시즌 추천',
    title: '케이블카로 오른 단풍, 순두부로 닫는 하루',
    description: '속초 가을 여행의 마지막 정류장, 척산온천',
    image: 'panel03.jpg',
    ctaLabel: '자세히 보기',
    to: '/magazine/146',
  },
  {
    id: 'panel04',
    number: '04',
    label: '온천 과학',
    title: '달걀 냄새가 반가워지는 순간, 유황천',
    description: '부곡의 김 속에서 코가 먼저 배우는 화학',
    image: 'panel04.jpg',
    ctaLabel: '자세히 보기',
    to: '/magazine/161',
  },
  {
    id: 'panel05',
    number: '05',
    label: '먹거리',
    title: '밀양 국밥은 맑고, 방아잎이 올라간다',
    description: '호텔아리나에서 시작하는 밀양돼지국밥 계보 여행',
    image: 'panel05.jpg',
    ctaLabel: '자세히 보기',
    to: '/magazine/220',
  },
]
