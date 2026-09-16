import { useEffect, useRef, useState } from 'react'

import { fetchPoi } from '@/features/map/api/poi'

import type { Poi, PoiCategory } from '@/types/poi'

/** 서버가 좌표를 소수점 3자리로 반올림해 캐싱한다 — 클라이언트도 같은 키를 써야 캐시가 맞는다. */
function cacheKey(category: PoiCategory, lat: number, lng: number) {
  return `${category}|${lat.toFixed(3)}|${lng.toFixed(3)}`
}

/**
 * MAP-04. 켜진 카테고리마다 따로 불러 합친다.
 * 지도를 조금만 움직여도 재호출되므로 캐시와 staleness 가드가 둘 다 필요하다.
 */
export function usePois(
  categories: PoiCategory[],
  center: { lat: number; lng: number } | undefined,
) {
  const [fetched, setFetched] = useState<{ key: string; places: Poi[] }>()
  // 실패한 조건을 같이 들고 있어야 조건이 바뀔 때 옛 에러가 남지 않는다.
  const [failed, setFailed] = useState<string>()

  const cache = useRef(new Map<string, Poi[]>())
  const requestId = useRef(0)

  // 배열은 매 렌더 새 참조라 의존성에 직접 못 쓴다 — 정렬해 문자열로 굳힌다.
  const categoryKey = [...categories].sort().join(',')
  const lat = center?.lat
  const lng = center?.lng
  const queryKey =
    categoryKey && lat !== undefined && lng !== undefined
      ? `${categoryKey}|${lat.toFixed(3)}|${lng.toFixed(3)}`
      : ''

  useEffect(() => {
    if (!queryKey || lat === undefined || lng === undefined) return

    const active = categoryKey.split(',') as PoiCategory[]
    const id = ++requestId.current

    Promise.all(
      active.map(async (category) => {
        const key = cacheKey(category, lat, lng)
        const cached = cache.current.get(key)
        if (cached) return cached

        const result = await fetchPoi({ category, lat, lng })
        cache.current.set(key, result.places)
        return result.places
      }),
    )
      .then((groups) => {
        if (id !== requestId.current) return
        setFetched({ key: queryKey, places: groups.flat() })
      })
      .catch(() => {
        if (id !== requestId.current) return
        // POI는 보조 정보다 — 실패해도 지도 탐색은 계속돼야 한다.
        setFailed(queryKey)
      })
  }, [queryKey, categoryKey, lat, lng])

  // 조건이 바뀌면 이전 결과·에러를 렌더 시점에 버린다 (effect에서 지우면 한 프레임 깜빡인다).
  const pois = fetched && fetched.key === queryKey ? fetched.places : []
  const error = failed === queryKey && queryKey ? '주변 장소를 불러오지 못했습니다.' : undefined

  return { pois, error }
}
