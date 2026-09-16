import { api } from '@/api'
import { mockOnsenDetail } from '@/features/map/api/onsenDetailMock'
import { env } from '@/lib/env'

import type { OnsenDetail } from '@/types/onsenDetail'

/** PAM-03 온천 상세. 목록(/onsens)에 없는 효능·거점역·팀 코멘트가 여기에 있다. */
export function fetchOnsenDetail(onsenId: number): Promise<OnsenDetail> {
  if (env.useMock) return mockOnsenDetail(onsenId)
  // 비로그인도 상세를 볼 수 있다 (AUTH-02).
  return api.get<OnsenDetail>(`/onsens/${onsenId}`, { skipAuth: true })
}
