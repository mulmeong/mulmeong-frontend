import { useEffect, useState } from 'react'
import { ApiError } from '@/api'
import { fetchMagazine } from '@/features/magazine/api/magazine'
import type { MagazineDetail } from '@/types/magazine'

export function useMagazine(id: number) {
  const [attempt, setAttempt] = useState(0)
  const key = `${id}|${attempt}`
  const [state, setState] = useState<{
    key: string
    magazine?: MagazineDetail
    error?: string
    notFound?: boolean
  }>()
  useEffect(() => {
    let cancelled = false
    void fetchMagazine(id)
      .then((magazine) => {
        if (!cancelled) setState({ key, magazine })
      })
      .catch((error) => {
        if (!cancelled)
          setState({
            key,
            notFound: error instanceof ApiError && error.status === 404,
            error:
              error instanceof ApiError && error.status === 404
                ? '없거나 아직 발행되지 않은 글이에요.'
                : '글을 불러오지 못했어요. 다시 시도해 주세요.',
          })
      })
    return () => {
      cancelled = true
    }
  }, [id, key])
  const current = state?.key === key ? state : undefined
  return {
    magazine: current?.magazine,
    loading: !current,
    error: current?.error,
    notFound: current?.notFound,
    retry: () => setAttempt((value) => value + 1),
  }
}
