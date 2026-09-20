import { useEffect, useRef, useState, useSyncExternalStore } from 'react'
import {
  fetchMagazines,
  fetchMagazinesByRegionName,
  magazineChanges,
} from '@/features/magazine/api/magazine'
import type { MagazineList, MagazineListParams } from '@/types/magazine'

/** region(권역 이름)이 있으면 시도코드 여러 개를 합쳐 받는다. */
export function useMagazines(params: MagazineListParams & { region?: string } = {}) {
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
    region: params.region,
    sort: params.sort,
    featured: params.featured,
    size: params.size,
  })
  useEffect(() => {
    let cancelled = false
    const parsed = JSON.parse(key) as MagazineListParams & { region?: string }
    const load = parsed.region
      ? fetchMagazinesByRegionName(parsed.region, parsed)
      : fetchMagazines(parsed)
    void load
      .then(async (data) => {
        // 직접 2페이지로 진입한 경우에도 page=0에서만 제공하는 필터 정보를 확보한다.
        // 서버가 regions를 늘 null로 주므로 그것 때문에 page=0을 다시 부르지 않는다.
        let first = data
        if (data.categories === null && metadata.current?.filter !== filter && !parsed.region) {
          first = await fetchMagazines({ ...parsed, page: 0 })
        }
        if (cancelled) return
        if (first.categories !== null)
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
