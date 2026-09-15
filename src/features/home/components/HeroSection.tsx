import { useEffect, useRef, useState } from 'react'

import { FADE_IN } from '@/features/home/constants'
import { cn } from '@/lib/cn'

/** 워드마크 위아래 세로 구분선. 높이만 화면 폭을 따라 줄어든다. */
const DIVIDER = 'h-[clamp(2.5rem,5vw,4.5rem)] w-px bg-white/55'

/** 이미지가 늦게 와도 흰 화면이 번쩍이지 않도록 어두운 바탕을 깔아둔다. */
export default function HeroSection() {
  const imageRef = useRef<HTMLImageElement>(null)
  const [imageReady, setImageReady] = useState(false)

  // 캐시된 이미지는 React가 onLoad를 붙이기 전에 이미 로딩이 끝나 있을 수 있다.
  // 그 경우 onLoad가 영영 안 불려서 화면이 빈 채로 멈춘다.
  useEffect(() => {
    if (imageRef.current?.complete) setImageReady(true)
  }, [])

  /** 이미지가 오기 전에는 감춰둔다. 배경 없이 글자만 먼저 떠오르는 것을 막는다. */
  const fade = (delay?: string) => (imageReady ? cn(FADE_IN, delay) : 'opacity-0')

  return (
    <div className="bg-inverse relative size-full">
      <img
        ref={imageRef}
        src="/images/hero.jpg"
        alt=""
        fetchPriority="high"
        onLoad={() => setImageReady(true)}
        // 이미지를 못 받아도 텍스트는 나와야 한다.
        onError={() => setImageReady(true)}
        className={cn(
          'size-full object-cover transition-opacity duration-700',
          imageReady ? 'opacity-100' : 'opacity-0',
        )}
      />

      <div className="absolute inset-0 flex flex-col items-center justify-center px-6">
        <span aria-hidden="true" className={cn(DIVIDER, fade())} />

        {/*
          시안: Cormorant Garamond / Bold / 168px / line-height 136 / letter-spacing 11.84px
          1440px 기준 168px라 11.67vw로 환산해 폭에 따라 줄인다.
          tracking·leading은 em·배수로 넣어 글자 크기를 따라간다.
          text-indent는 마지막 글자 뒤에 붙는 자간 때문에 가운데 정렬이
          왼쪽으로 밀리는 것을 절반만큼 되민 값이다.

          그림자 시안: X 0 / Y 2 / Blur 26 / Spread 0 / #14130F 55%
          Spread는 0이라 버린다 (text-shadow에는 없는 값).
          Y·Blur도 168px 기준이라 em으로 환산해 글자 크기를 따라가게 했다.
        */}
        <h1
          className={cn(
            'font-display text-center font-bold text-white',
            'text-[clamp(3.5rem,11.67vw,10.5rem)] leading-[0.8095] tracking-[0.0705em]',
            '[text-indent:0.0352em]',
            '[text-shadow:0_0.0119em_0.1548em_rgba(20,19,15,0.55)]',
            'mt-[clamp(1rem,2vw,1.75rem)]',
            fade('[animation-delay:150ms]'),
          )}
        >
          <span className="block">MUL</span>
          <span className="block">MEONG</span>
        </h1>

        <span
          aria-hidden="true"
          className={cn(DIVIDER, 'mt-[clamp(1rem,2vw,1.75rem)]', fade('[animation-delay:300ms]'))}
        />

        {/* 시안: Lora / Regular / 16px / letter-spacing 4px */}
        <p
          className={cn(
            'font-serif mt-[clamp(0.875rem,1.6vw,1.375rem)] text-[16px] text-white',
            'tracking-[0.25em] [text-indent:0.125em]',
            fade('[animation-delay:450ms]'),
          )}
        >
          SOAK, THEN STARE
        </p>
      </div>
    </div>
  )
}
