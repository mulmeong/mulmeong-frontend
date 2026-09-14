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
 * TODO: 시안 확정 후 문구와 링크를 교체할 것.
 * 화면 코드는 이 배열만 읽으므로 여기만 고치면 된다.
 * 개수를 바꿔도 동작한다 — 확장 비율은 패널 수와 무관하게 계산된다.
 */
export const HOME_PANELS: HomePanel[] = [
  {
    id: 'panel01',
    number: '01',
    label: '라벨 01',
    title: '제목이 들어갑니다',
    description: '설명 문구가 들어갑니다. 시안 확정 후 교체하세요.',
    image: 'panel01.jpg',
    ctaLabel: '자세히 보기',
    to: '#',
  },
  {
    id: 'panel02',
    number: '02',
    label: '라벨 02',
    title: '제목이 들어갑니다',
    description: '설명 문구가 들어갑니다. 시안 확정 후 교체하세요.',
    image: 'panel02.jpg',
    ctaLabel: '자세히 보기',
    to: '#',
  },
  {
    id: 'panel03',
    number: '03',
    label: '라벨 03',
    title: '제목이 들어갑니다',
    description: '설명 문구가 들어갑니다. 시안 확정 후 교체하세요.',
    image: 'panel03.jpg',
    ctaLabel: '자세히 보기',
    to: '#',
  },
  {
    id: 'panel04',
    number: '04',
    label: '라벨 04',
    title: '제목이 들어갑니다',
    description: '설명 문구가 들어갑니다. 시안 확정 후 교체하세요.',
    image: 'panel04.jpg',
    ctaLabel: '자세히 보기',
    to: '#',
  },
  {
    id: 'panel05',
    number: '05',
    label: '라벨 05',
    title: '제목이 들어갑니다',
    description: '설명 문구가 들어갑니다. 시안 확정 후 교체하세요.',
    image: 'panel05.jpg',
    ctaLabel: '자세히 보기',
    to: '#',
  },
]
