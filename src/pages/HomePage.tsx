import { useEffect, useRef, useState } from 'react'

import AuthHeader from '@/features/auth/components/AuthHeader'
import ClosingSection from '@/features/home/components/ClosingSection'
import ExpandingPanels from '@/features/home/components/ExpandingPanels'
import HeroSection from '@/features/home/components/HeroSection'
import { cn } from '@/lib/cn'

type ScrollDirection = 'up' | 'down'

/** 문서 스크롤 방향. rAF로 묶어 이벤트가 쏟아져도 프레임당 한 번만 계산한다. */
function useScrollDirection(threshold = 0): ScrollDirection {
  const [direction, setDirection] = useState<ScrollDirection>('up')
  const lastY = useRef(0)
  const ticking = useRef(false)

  useEffect(() => {
    const onScroll = () => {
      if (ticking.current) return
      ticking.current = true

      requestAnimationFrame(() => {
        const currentY = window.scrollY
        const diff = currentY - lastY.current

        if (Math.abs(diff) >= threshold) {
          setDirection(diff > 0 ? 'down' : 'up')
          lastY.current = currentY
        }

        ticking.current = false
      })
    }

    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [threshold])

  return direction
}

/**
 * 홈에서만 문서에 스냅을 건다.
 * 클래스를 documentElement에 붙이는 이유는 스크롤 컨테이너가 문서이기 때문이다 —
 * 스냅은 스크롤하는 요소에 걸려야 동작한다. 떠날 때 반드시 떼서 다른 화면에 남기지 않는다.
 */
function useDocumentSnap() {
  useEffect(() => {
    const root = document.documentElement
    root.classList.add('snap-page')
    return () => root.classList.remove('snap-page')
  }, [])
}

/**
 * 섹션 공통. snap-always가 핵심 — 이게 없으면 빠르게 굴렸을 때
 * 중간 섹션을 건너뛴다. 붙여두면 스크롤 한 번에 반드시 한 칸만 넘어간다.
 */
const SECTION = 'relative h-dvh w-full shrink-0 snap-start snap-always overflow-hidden'

export default function HomePage() {
  const scrollDir = useScrollDirection()
  useDocumentSnap()

  return (
    // 스크롤은 문서가 한다 (useDocumentSnap 참고). 여기에 overflow를 주면
    // 스크롤 주체가 이 div로 바뀌면서 키보드 스크롤이 막힌다.
    <div className="bg-surface text-text-primary">
      <AuthHeader
        className={cn(
          'fixed inset-x-0 top-0 z-50 bg-transparent transition-transform duration-300',
          scrollDir === 'down' && '-translate-y-full',
        )}
      />

      <section className={SECTION}>
        <HeroSection />
      </section>

      {/*
        lg 미만에서는 패널이 세로로 쌓여 한 화면을 넘으므로 높이를 풀어준다.
        (스냅도 같은 이유로 lg 이상에서만 건다 — index.css의 .snap-page 참고)
      */}
      <section className={cn(SECTION, 'h-auto lg:h-dvh')}>
        <ExpandingPanels />
      </section>

      <section className={SECTION}>
        <ClosingSection />
      </section>
    </div>
  )
}
