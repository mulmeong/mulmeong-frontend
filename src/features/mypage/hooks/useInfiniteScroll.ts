import { useEffect, useRef } from 'react'

/**
 * 목록 끝에 둔 표식이 화면에 들어오면 더 보여준다.
 *
 * 스크롤 이벤트를 듣지 않고 IntersectionObserver를 쓴다 — 스크롤은 손가락을
 * 움직이는 내내 불려서 매번 위치를 재야 하지만, 이쪽은 표식이 보이기 시작할 때
 * 한 번만 불린다.
 *
 * 반환한 ref를 목록 맨 아래 빈 요소에 달면 된다. enabled가 false면(더 볼 게
 * 없거나 불러오는 중) 아예 감시하지 않는다.
 */
export function useInfiniteScroll(onMore: () => void, enabled: boolean) {
  const ref = useRef<HTMLDivElement>(null)

  /** 최신 콜백을 본다 — 콜백이 매 렌더 새로 만들어져도 감시를 다시 걸지 않는다. */
  const latest = useRef(onMore)
  latest.current = onMore

  useEffect(() => {
    const target = ref.current
    if (!target || !enabled) return

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((entry) => entry.isIntersecting)) latest.current()
      },
      // 바닥에 닿기 전에 미리 부른다 — 기다리는 느낌을 줄인다.
      { rootMargin: '200px' },
    )

    observer.observe(target)
    return () => observer.disconnect()
  }, [enabled])

  return ref
}
