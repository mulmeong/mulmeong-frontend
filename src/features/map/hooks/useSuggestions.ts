import { useCallback, useEffect, useRef, useState } from 'react'

import { suggestPlaces } from '@/features/map/api/map'

import type { Suggestion } from '@/features/map/api/map'

/** 입력할 때마다 요청하지 않는다 — 쿼터 방어 (CLAUDE.md 비기능 요구사항). */
const DEBOUNCE_MS = 200

/**
 * MAP-05 자동완성. keyword가 바뀌면 디바운스 후 제안을 받아온다.
 * 뒤늦게 도착한 응답은 버려서 낡은 제안이 최신 입력을 덮지 않게 한다.
 */
export function useSuggestions(keyword: string, enabled: boolean) {
  const [fetched, setFetched] = useState<{ keyword: string; items: Suggestion[] }>({
    keyword: '',
    items: [],
  })
  const requestId = useRef(0)

  const trimmed = keyword.trim()
  const active = enabled && Boolean(trimmed)

  useEffect(() => {
    if (!active) return

    const id = ++requestId.current
    const timer = setTimeout(() => {
      void suggestPlaces(trimmed)
        .then((items) => {
          if (id === requestId.current) setFetched({ keyword: trimmed, items })
        })
        .catch(() => {
          // 제안은 보조 기능이라 실패해도 조용히 비운다.
          if (id === requestId.current) setFetched({ keyword: trimmed, items: [] })
        })
    }, DEBOUNCE_MS)

    return () => clearTimeout(timer)
  }, [trimmed, active])

  const clear = useCallback(() => {
    requestId.current += 1
    setFetched({ keyword: '', items: [] })
  }, [])

  // 입력이 바뀌면 이전 제안은 렌더 시점에 버린다 — effect로 비우면 한 프레임 늦는다.
  const suggestions = active && fetched.keyword === trimmed ? fetched.items : []

  return { suggestions, clear }
}
