import { useEffect, useState } from 'react'

import { searchRoutePlaces } from '@/features/map/api/directions'

import type { RoutePlace } from '@/features/map/types/directions'

type SearchState = { key: string; places: RoutePlace[]; error?: string }

export function useRoutePlaces(text: string, enabled: boolean) {
  const key = text.trim()
  const [cache, setCache] = useState(() => new Map<string, RoutePlace[]>())
  const [state, setState] = useState<SearchState>()

  useEffect(() => {
    if (!enabled || !key || cache.has(key)) return
    let cancelled = false
    const timer = setTimeout(() => {
      void searchRoutePlaces(key)
        .then((places) => {
          if (cancelled) return
          setCache((previous) => new Map(previous).set(key, places))
          setState({ key, places })
        })
        .catch((error: unknown) => {
          if (!cancelled)
            setState({
              key,
              places: [],
              error:
                error instanceof Error
                  ? error.message
                  : '장소를 찾지 못했어요. 다시 입력해 주세요.',
            })
        })
    }, 200)
    return () => {
      cancelled = true
      clearTimeout(timer)
    }
  }, [key, enabled, cache])

  const cached = cache.get(key)
  const current = state?.key === key ? state : undefined
  return {
    places: enabled ? (cached ?? current?.places ?? []) : [],
    loading: enabled && Boolean(key) && !cached && !current,
    error: enabled ? current?.error : undefined,
  }
}
