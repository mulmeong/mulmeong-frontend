import { useEffect, useState } from 'react'

/** 데모의 진행 트랙 — 문서를 얼마나 읽었는지 0~1로 돌려준다. */
export function useReadingProgress() {
  const [progress, setProgress] = useState(0)

  useEffect(() => {
    function onScroll() {
      const el = document.documentElement
      const scrollable = el.scrollHeight - el.clientHeight
      setProgress(scrollable > 0 ? Math.min(1, el.scrollTop / scrollable) : 0)
    }

    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  return progress
}
