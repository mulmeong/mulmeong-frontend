import { useEffect, useRef, useState, useSyncExternalStore } from 'react'
import { fetchMagazines, magazineChanges } from '@/features/magazine/api/magazine'
import type { MagazineList, MagazineListParams } from '@/types/magazine'

export function useMagazines(params: MagazineListParams = {}) {
  const revision = useSyncExternalStore(magazineChanges.subscribe, magazineChanges.snapshot)
  const key = JSON.stringify(params)
  const [attempt, setAttempt] = useState(0)
  const identity = `${key}|${revision}|${attempt}`
  const [state, setState] = useState<{ identity: string; data?: MagazineList; error?: string }>()
  const metadata = useRef<
    | { filter: string; categories: MagazineList['categories']; regions: MagazineList['regions'] }
    | undefined
  >(undefined)
  const filter = JSON.stringify({
    category: params.category,
    sidoCode: params.sidoCode,
    sort: params.sort,
    featured: params.featured,
    size: params.size,
  })
  useEffect(() => {
    let cancelled = false
    void fetchMagazines(JSON.parse(key) as MagazineListParams)
      .then(async (data) => {
        // 직접 2페이지로 진입한 경우에도 page=0에서만 제공하는 필터 정보를 확보한다.
        let first = data
        if (
          (data.categories === null || data.regions === null) &&
          metadata.current?.filter !== filter
        ) {
          first = await fetchMagazines({ ...JSON.parse(key), page: 0 } as MagazineListParams)
        }
        if (cancelled) return
        if (first.categories !== null && first.regions !== null)
          metadata.current = { filter, categories: first.categories, regions: first.regions }
        setState({
          identity,
          data: {
            ...data,
            categories: data.categories ?? metadata.current?.categories ?? [],
            regions: data.regions ?? metadata.current?.regions ?? [],
          },
        })
      })
      .catch(() => {
        if (!cancelled)
          setState({ identity, error: '매거진을 불러오지 못했어요. 다시 시도해 주세요.' })
      })
    return () => {
      cancelled = true
    }
  }, [key, identity, filter])
  const current = state?.identity === identity ? state : undefined
  return {
    magazines: current?.data?.content ?? [],
    data: current?.data,
    loading: !current,
    error: current?.error,
    retry: () => setAttempt((value) => value + 1),
  }
}
