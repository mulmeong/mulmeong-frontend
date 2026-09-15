import { useEffect, useRef, useState } from 'react'

import { ApiError } from '@/api/ApiError'
import { fetchMagazine } from '@/features/magazine/api/magazine'

import type { Magazine } from '@/types/magazine'

type Fetched = { id: number; magazine?: Magazine; error?: string }

/** MAG-03 상세 한 건. id가 바뀌면 다시 불러온다. */
export function useMagazine(id: number) {
  const [fetched, setFetched] = useState<Fetched>()
  const requestId = useRef(0)

  useEffect(() => {
    const current = ++requestId.current

    void fetchMagazine(id)
      .then((magazine) => {
        if (current !== requestId.current) return
        setFetched({ id, magazine, error: magazine ? undefined : '글을 찾을 수 없습니다.' })
      })
      .catch((err: unknown) => {
        if (current !== requestId.current) return
        setFetched({
          id,
          error: err instanceof ApiError ? err.message : '글을 불러오지 못했습니다.',
        })
      })
  }, [id])

  // 응답이 아직이거나 다른 id의 결과면 로딩으로 본다 — effect에서 비우면 한 프레임 늦는다.
  const settled = fetched?.id === id
  return {
    magazine: settled ? fetched.magazine : undefined,
    loading: !settled,
    error: settled ? fetched.error : undefined,
  }
}
