import { useEffect, useState } from 'react'

import { fetchIssue } from '@/features/magazine/api/magazine'

import type { MagazineIssue } from '@/types/magazine'

/** 홈 히어로의 이슈 배너. 한 번 받아두면 바뀌지 않는다. */
export function useIssue() {
  const [issue, setIssue] = useState<MagazineIssue>()

  useEffect(() => {
    let cancelled = false

    void fetchIssue()
      .then((result) => {
        if (!cancelled) setIssue(result)
      })
      .catch(() => {
        // 히어로는 보조 영역이라 실패해도 화면을 막지 않는다.
      })

    return () => {
      cancelled = true
    }
  }, [])

  return issue
}
