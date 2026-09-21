import { Link } from 'react-router-dom'

import type { HomePanel } from '@/features/home/constants'
import { cn } from '@/lib/cn'

/**
 * 확장 비율 1.76 = 440 ÷ 250 (시안의 확장 폭 ÷ 축소 폭, 1440 기준).
 * basis-0이라 컨테이너 폭이 달라져도 이 비율이 유지된다.
 *
 * 값을 상수로 빼서 템플릿 리터럴로 조립하면 안 된다 —
 * Tailwind는 소스를 정적으로 훑어 클래스를 만들기 때문에
 * 런타임에 조합된 문자열은 찾지 못하고, 스타일이 통째로 빠진다.
 */
const GROW_EXPANDED = 'lg:hover:grow-[1.76] lg:focus-within:grow-[1.76]'

/** 시안: 400ms cubic-bezier(.4, 0, .2, 1) — 프로젝트 기본 이징과 같은 값이지만 의도를 남긴다. */
const EASING = 'duration-[400ms] ease-[cubic-bezier(.4,0,.2,1)]'

/** 동작 줄이기 설정을 켠 사용자에게는 전환을 없앤다. */
const REDUCED = 'motion-reduce:transition-none motion-reduce:duration-0'

/** 시안: Instrument Serif / Regular / 52px */
const NUMBER_TEXT = 'font-numeral text-[52px] leading-none font-normal text-white'

/** 시안: Gothic A1 / SemiBold / 16px */
const LABEL_TEXT = 'text-[16px] font-semibold text-white'

/**
 * 설명·CTA는 시안대로 120ms 늦게 따라 올라온다.
 * display를 건드리면 전환이 끊기므로 opacity와 transform만 쓴다.
 * lg 미만에는 확장 동작이 없어 기본값이 "보임"이고, lg부터 숨겼다 꺼낸다.
 */
const DELAYED = cn(
  'transition-[opacity,transform] delay-[120ms]',
  EASING,
  REDUCED,
  'lg:translate-y-2 lg:opacity-0',
  'lg:group-hover:translate-y-0 lg:group-hover:opacity-100',
  'lg:group-focus-within:translate-y-0 lg:group-focus-within:opacity-100',
)

export default function Panel({ panel }: { panel: HomePanel }) {
  return (
    <article
      className={cn(
        'group relative overflow-hidden',
        /*
          lg 미만: 세로로 쌓이는 카드. 확장 없음.

          높이를 고정하지 않고 최소값만 준다. 240px로 묶어두면 안쪽 내용
          (번호·라벨·제목·설명·버튼)이 300px를 넘겨서 overflow-hidden에 잘리고,
          제목이 길면 '자세히 보기'가 통째로 사라진다.
        */
        'min-h-[240px] shrink-0',
        // lg 이상: 균등 분할 후 hover/focus에서만 확장.
        'lg:h-full lg:shrink lg:basis-0 lg:grow',
        GROW_EXPANDED,
        // flex-grow만 전환한다. transition-all은 자식 속성까지 끌고 가 무거워진다.
        'transition-[flex-grow]',
        EASING,
        REDUCED,
      )}
    >
      <img
        src={`/images/${panel.image}`}
        alt=""
        loading="lazy"
        className="absolute inset-0 size-full object-cover"
      />
      {/* 흰 글씨 가독성 확보용. 아래쪽을 더 어둡게 깐다. */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/30 to-black/10" />

      {/*
        축소 상태 — 번호와 라벨만 가운데.
        확장 레이어와 내용이 겹치므로 스크린 리더에서는 숨긴다
        (확장 레이어는 opacity만 0이라 접근성 트리에는 항상 남아 있다).
      */}
      <div
        aria-hidden="true"
        className={cn(
          'absolute inset-0 flex flex-col items-center justify-end gap-2 p-6 text-center lg:p-10',
          'transition-opacity',
          EASING,
          REDUCED,
          // lg 미만에서는 아래 확장 레이어가 늘 보이므로 이쪽을 끈다.
          'opacity-0 lg:opacity-100',
          'lg:group-hover:opacity-0 lg:group-focus-within:opacity-0',
        )}
      >
        <span className={NUMBER_TEXT}>{panel.number}</span>
        <span className={LABEL_TEXT}>{panel.label}</span>
      </div>

      {/*
        확장 상태 — 전체 콘텐츠를 왼쪽 정렬.
        폭을 확장 상태(440px)로 고정해 전환 중 텍스트가 다시 흐르지 않게 한다.
        축소 상태에서는 overflow-hidden이 잘라낼 뿐이다.
      */}
      <div
        className={cn(
          'relative flex h-full w-full flex-col justify-end p-6',
          'lg:w-[440px] lg:shrink-0 lg:p-10',
          'transition-opacity',
          EASING,
          REDUCED,
          'lg:opacity-0 lg:group-hover:opacity-100 lg:group-focus-within:opacity-100',
        )}
      >
        <span className={NUMBER_TEXT}>{panel.number}</span>
        <span className={cn(LABEL_TEXT, 'mt-2')}>{panel.label}</span>

        {/* 시안: Gothic A1 / Bold / 30px */}
        <h3 className="mt-4 text-[30px] leading-tight font-bold text-white">{panel.title}</h3>

        {/* 시안: Gothic A1 / Medium / 16px */}
        <p className={cn(DELAYED, 'mt-3 text-[16px] leading-[1.6] font-medium text-white/85')}>
          {panel.description}
        </p>

        {/*
          시안: padding 18/9, radius 999, fill bg/surface, 텍스트 #0E1513,
          Gothic A1 SemiBold 13px. 헤더의 로그인 버튼과 같은 흰 알약 형태다.

          텍스트 색이 --color-text-primary(#1c1b18)와 미세하게 다른 raw hex라
          토큰 대신 시안 값을 그대로 썼다. 디자이너 확인 필요.

          Button 컴포넌트는 <button>이라 링크로 쓸 수 없어 클래스만 맞춘다.
          이 링크가 포커스를 받으면 group-focus-within으로 패널이 확장된다.
        */}
        <Link
          to={panel.to}
          className={cn(
            DELAYED,
            'bg-surface mt-6 inline-flex w-fit items-center justify-center rounded-full',
            'px-[18px] py-[9px] text-[13px] font-semibold text-[#0E1513]',
            'transition-opacity hover:opacity-90',
          )}
        >
          {panel.ctaLabel}
        </Link>
      </div>
    </article>
  )
}
