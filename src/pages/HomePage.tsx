import { useEffect, useRef, useState, type RefObject } from 'react'
import { useNavigate } from 'react-router-dom'

import Header from '@/components/ui/Header'
import ClosingSection from '@/features/home/components/ClosingSection'
import ExpandingPanels from '@/features/home/components/ExpandingPanels'
import HeroSection from '@/features/home/components/HeroSection'
import { cn } from '@/lib/cn'

type ScrollDirection = 'up' | 'down'

/**
 * 스크롤 방향. 문서가 아니라 넘겨받은 요소를 관찰한다.
 * 스냅 때문에 페이지 대신 안쪽 div가 스크롤되므로 window.scrollY는 움직이지 않는다.
 */
function useScrollDirection(ref: RefObject<HTMLElement | null>, threshold = 0): ScrollDirection {
  const [direction, setDirection] = useState<ScrollDirection>('up')
  const lastY = useRef(0)
  const ticking = useRef(false)

  useEffect(() => {
    const el = ref.current
    if (!el) return

    const onScroll = () => {
      if (ticking.current) return
      ticking.current = true

      requestAnimationFrame(() => {
        const currentY = el.scrollTop
        const diff = currentY - lastY.current

        if (Math.abs(diff) >= threshold) {
          setDirection(diff > 0 ? 'down' : 'up')
          lastY.current = currentY
        }

        ticking.current = false
      })
    }

    el.addEventListener('scroll', onScroll, { passive: true })
    return () => el.removeEventListener('scroll', onScroll)
  }, [ref, threshold])

  return direction
}

/**
 * 섹션 공통. snap-always가 핵심 — 이게 없으면 빠르게 굴렸을 때
 * 중간 섹션을 건너뛴다. 붙여두면 스크롤 한 번에 반드시 한 칸만 넘어간다.
 */
const SECTION = 'relative h-dvh w-full shrink-0 snap-start snap-always overflow-hidden'

export default function HomePage() {
  const navigate = useNavigate()
  const scrollRef = useRef<HTMLDivElement>(null)
  const scrollDir = useScrollDirection(scrollRef)

  return (
    // 페이지 대신 이 div가 스크롤된다. 높이가 고정돼 있어야 스냅 지점이
    // 흔들리지 않는다.
    //
    // 스냅은 lg 이상에서만 건다. 좁은 화면에서는 패널 섹션이 세로로 쌓여
    // 한 화면을 넘는데, 그 상태로 mandatory 스냅이 걸리면 섹션 안을
    // 스크롤할 수가 없다.
    //
    // motion-reduce에서도 끈다 — 강제 이동은 어지럼증을 유발할 수 있다.
    <div
      ref={scrollRef}
      className={cn(
        'h-dvh overflow-y-scroll overscroll-y-contain',
        'snap-none lg:snap-y lg:snap-mandatory',
        'bg-surface text-text-primary',
        'motion-reduce:snap-none',
      )}
    >
      <Header
        className={cn(
          'fixed inset-x-0 top-0 z-50 bg-transparent transition-transform duration-300',
          scrollDir === 'down' && '-translate-y-full',
        )}
        onAuthClick={() => navigate('/login')}
      />

      <section className={SECTION}>
        <HeroSection />
      </section>

      {/*
        lg 미만에서는 패널이 세로로 쌓여 한 화면을 넘으므로 높이를 풀어준다.
        (스냅도 같은 이유로 lg 이상에서만 건다 — 위 컨테이너 참고)
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
