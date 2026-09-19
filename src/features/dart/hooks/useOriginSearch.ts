import { useEffect, useRef, useState } from 'react'

import { KEYWORD_MIN, placeErrorMessage, searchPlaces } from '@/features/dart/api/places'

import type { ExternalPlace } from '@/types/dart'

/** 타자 칠 때마다 부르지 않는다 — 카카오 쿼터를 서버가 나눠 쓴다. */
const DEBOUNCE_MS = 250

type Fetched = { keyword: string; places?: ExternalPlace[]; error?: string }

/**
 * 출발지 검색(901).
 *
 * 뒤늦게 온 응답은 버린다 — 느린 요청이 최신 입력의 결과를 덮으면 엉뚱한 목록이 남는다.
 * 요청 번호를 세어서 마지막 것만 받아들인다.
 */
export function useOriginSearch(keyword: string) {
  const [fetched, setFetched] = useState<Fetched>({ keyword: '' })
  const requestId = useRef(0)

  const trimmed = keyword.trim()
  const active = trimmed.length >= KEYWORD_MIN

  useEffect(() => {
    if (!active) return

    const id = ++requestId.current
    const timer = setTimeout(() => {
      void searchPlaces(trimmed)
        .then((places) => {
          if (id === requestId.current) setFetched({ keyword: trimmed, places })
        })
        .catch((cause: unknown) => {
          // 쿼터·장애는 다음 수단을 안내해야 해서 조용히 넘기지 않는다.
          if (id === requestId.current) {
            setFetched({ keyword: trimmed, error: placeErrorMessage(cause) })
          }
        })
    }, DEBOUNCE_MS)

    return () => clearTimeout(timer)
  }, [trimmed, active])

  // 입력이 바뀌면 이전 결과는 렌더 시점에 버린다 — effect로 비우면 한 프레임 늦는다.
  const current = active && fetched.keyword === trimmed ? fetched : undefined

  return {
    places: current?.places ?? [],
    error: current?.error,
    /** 두 글자를 채웠는데 아직 결과가 없는 동안. */
    loading: active && current === undefined,
  }
}
