import { useEffect, useState } from 'react'

import { ApiError } from '@/api/ApiError'
import { getSharedDart, isDartExpired, isDartNotFound } from '@/features/dart/api/dart'

import type { SharedDart } from '@/types/dart'

/** 만료와 없는 링크는 안내가 달라서 사유를 구분해 들고 있는다. */
export type SharedDartProblem = 'expired' | 'notFound' | 'error'

type Loaded = { dartId: string; dart?: SharedDart; problem?: SharedDartProblem; message?: string }

/** 공유된 다트 (DART-06). 로그인 없이 연다. */
export function useSharedDart(dartId: string) {
  const [loaded, setLoaded] = useState<Loaded>()

  const current = loaded?.dartId === dartId ? loaded : undefined

  useEffect(() => {
    let cancelled = false

    const load = async () => {
      try {
        const dart = await getSharedDart(dartId)
        if (!cancelled) setLoaded({ dartId, dart })
      } catch (cause) {
        if (cancelled) return
        setLoaded({
          dartId,
          problem: isDartExpired(cause) ? 'expired' : isDartNotFound(cause) ? 'notFound' : 'error',
          message: cause instanceof ApiError ? cause.message : '다트를 불러오지 못했습니다.',
        })
      }
    }

    // state 변경은 전부 await 뒤에서 일어난다 — effect 본문에서 동기로 부르지 않는다.
    void load()

    return () => {
      cancelled = true
    }
  }, [dartId])

  return {
    dart: current?.dart,
    problem: current?.problem,
    message: current?.message,
    loading: current === undefined,
  }
}
