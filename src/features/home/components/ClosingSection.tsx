import { Link } from 'react-router-dom'

import { FADE_IN } from '@/features/home/constants'
import { cn } from '@/lib/cn'
import { useInViewOnce } from '@/lib/useInViewOnce'

/**
 * 마지막 클로징 섹션. 좌측 이미지 / 우측 문구 2분할.
 * lg 미만에서는 이미지가 위, 문구가 아래로 쌓인다.
 *
 * 히어로와 달리 마운트가 아니라 화면에 들어올 때 애니메이션을 시작한다.
 * 세 번째 섹션이라 마운트 시점에 걸면 화면 밖에서 혼자 끝나버린다.
 */
export default function ClosingSection() {
  const [ref, inView] = useInViewOnce<HTMLDivElement>()

  const fade = (delay?: string) => (inView ? cn(FADE_IN, delay) : 'opacity-0')

  return (
    <div ref={ref} className="flex h-full w-full flex-col lg:flex-row">
      <div className="h-[45%] w-full shrink-0 lg:h-full lg:w-1/2">
        <img
          src="/images/closing.jpg"
          alt=""
          loading="lazy"
          className={cn('size-full object-cover', fade())}
        />
      </div>

      {/* TODO: 배경색이 시안에 명시되지 않아 --color-inverse 토큰을 썼다. 확인 필요. */}
      <div className="bg-inverse @container flex flex-1 flex-col items-end justify-center px-8 py-12 lg:px-16">
        {/*
          시안: Gothic A1 / Bold / 70px / letter-spacing 3.5%

          vw가 아니라 cqw(이 칸의 폭)를 기준으로 줄인다 — lg에서 글자가 놓이는
          칸은 화면의 절반이라, 화면 폭을 따라가면 칸보다 커져서 '기록까 / 지'로
          잘린다. 10cqw는 가장 긴 줄(9글자)이 칸에 들어가는 최대치다.

          줄바꿈은 아래 span으로만 한다. nowrap을 걸어 그 밖에서는 절대 안 꺾이게
          두면, 크기 계산이 어긋나도 잘리는 대신 넘쳐서 바로 눈에 띈다.

          -mr는 마지막 글자 뒤에 붙는 자간 때문에 오른쪽 끝이 살짝 뜨는 것을 되민 값이다.
        */}
        <h2
          className={cn(
            'text-text-inverse text-right font-bold',
            'text-[clamp(1.75rem,10cqw,4.375rem)] leading-[1.3] tracking-[0.035em]',
            '-mr-[0.035em]',
            fade('[animation-delay:150ms]'),
          )}
        >
          <span className="block whitespace-nowrap">온천 여행,</span>
          <span className="block whitespace-nowrap">계획부터 기록까지</span>
        </h2>

        {/* 시안: Gothic A1 / SemiBold / 18px */}
        <Link
          to="/magazine"
          className={cn(
            'group text-text-inverse mt-6 inline-flex items-center gap-2 text-[18px] font-semibold',
            'transition-opacity hover:opacity-80',
            fade('[animation-delay:300ms]'),
          )}
        >
          시작하기
          <span aria-hidden="true" className="transition-transform group-hover:translate-x-1">
            →
          </span>
        </Link>
      </div>
    </div>
  )
}
