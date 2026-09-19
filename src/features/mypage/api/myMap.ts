import { api } from '@/api'
import { env } from '@/lib/env'

import { mockGetGrapeMap } from './myMapMock'

import type { GrapeLevel, GrapeMap } from '@/types/myMap'

/**
 * 포도알 지도. level=SIGUNGU일 때는 parentRegionCode로 볼 시·도를 지정한다.
 *
 * TODO: regionCode 체계(행정표준코드)를 BE와 맞춰야 한다. 명세에도 '프론트·백
 * 합의 필요'로 적혀 있다. 지금 시군구 도형은 이름만 들고 있어 코드가 오면
 * 이름-코드 대응표를 붙여야 칠해진다.
 */
export function getGrapeMap(level: GrapeLevel, parentRegionCode?: string): Promise<GrapeMap> {
  if (env.useMock) return mockGetGrapeMap(level, parentRegionCode)
  return api.get<GrapeMap>('/users/me/grapes', {
    params: { level, parentRegionCode },
  })
}
