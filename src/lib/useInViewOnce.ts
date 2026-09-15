import { useEffect, useRef, useState } from 'react'

/**
 * 요소가 화면에 들어왔는지 알려준다. 한 번 들어오면 계속 true를 유지한다 —
 * 스크롤을 오르내릴 때마다 애니메이션이 다시 재생되면 산만해서다.
 *
 * 스크롤 이벤트로 getBoundingClientRect()를 매번 부르는 방식보다 훨씬 싸다.
 * 그쪽은 호출할 때마다 브라우저가 레이아웃을 다시 계산한다.
 *
 * @param threshold 요소가 이만큼 보이면 발동 (0~1). 객체 대신 숫자를 받는 이유는
 *   객체 리터럴을 넘기면 매 렌더마다 새 참조가 돼 effect가 계속 다시 도는 탓이다.
 */
export function useInViewOnce<T extends HTMLElement>(threshold = 0.3) {
  const ref = useRef<T>(null)
  const [inView, setInView] = useState(false)

  useEffect(() => {
    const el = ref.current
    if (!el) return

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((entry) => entry.isIntersecting)) {
          setInView(true)
          // 한 번 보였으면 더 볼 필요가 없다.
          observer.disconnect()
        }
      },
      { threshold },
    )

    observer.observe(el)
    return () => observer.disconnect()
  }, [threshold])

  return [ref, inView] as const
}
