import { useCallback, useEffect, useState } from 'react'

import { fetchOnsenMapPoints } from '@/features/map/api/mapPoints'

import type { OnsenMapPoint } from '@/features/map/types/mapPoint'

const EMPTY_POINTS: OnsenMapPoint[] = []

export function useOnsenMapPoints() {
  const [result, setResult] = useState<{
    attempt: number
    points: OnsenMapPoint[]
    error?: boolean
  }>()
  const [attempt, setAttempt] = useState(0)
  const retry = useCallback(() => setAttempt((value) => value + 1), [])

  useEffect(() => {
    let active = true
    fetchOnsenMapPoints()
      .then((result) => {
        if (active) setResult({ attempt, points: result })
      })
      .catch(() => {
        if (active) setResult({ attempt, points: EMPTY_POINTS, error: true })
      })
    return () => {
      active = false
    }
  }, [attempt])

  const current = result?.attempt === attempt ? result : undefined
  return {
    points: current?.points ?? EMPTY_POINTS,
    loading: !current,
    error: Boolean(current?.error),
    retry,
  }
}
