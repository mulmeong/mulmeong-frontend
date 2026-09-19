import { api } from '@/api/client'

import type { DartOrigin } from '@/types/dart'

/**
 * 다트 출발지 목록 (DART-404).
 *
 * 로그인 없이 부른다. 응답이 페이지 객체가 아니라 배열 자체다.
 * 서버에 고정된 추천 목록이라 사용자 위치를 묻거나 저장하지 않는다.
 */
export function getDartOrigins() {
  return api.get<DartOrigin[]>('/dart/origins', { skipAuth: true })
}
