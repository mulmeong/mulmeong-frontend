import { ApiError, errorCodeOf } from '@/api/ApiError'
import { api } from '@/api/client'

import type { Coord2Address, ExternalPlace } from '@/types/dart'

/**
 * 외부 장소 API(901·902). 카카오 로컬을 서버가 프록시한다.
 *
 * **프론트에서 카카오를 직접 부르지 않는다** — REST 키가 번들에 실리면 쿼터를
 * 남이 쓴다. 키는 서버에만 있고, 여기서는 추려진 필드만 받는다.
 *
 * 901은 MAP-05 장소 검색과도 같은 엔드포인트다. 지도 쪽에서 쓰게 되면
 * features 밖 공용 자리로 옮긴다.
 */

/** 서버가 막는 최소 길이. 짧으면 부르지 않고 KEYWORD_TOO_SHORT를 피한다. */
export const KEYWORD_MIN = 2

type SearchResponse = { places: ExternalPlace[] }

type SearchOptions = {
  /** 주면 가까운 순으로 정렬된다. */
  lat?: number
  lng?: number
  /** 서버 최대 15. */
  size?: number
}

export function searchPlaces(keyword: string, { lat, lng, size }: SearchOptions = {}) {
  return api
    .get<SearchResponse>('/external/places/search', {
      params: { keyword, lat, lng, size },
      skipAuth: true,
    })
    .then(({ places }) => places)
}

export function coord2address(lat: number, lng: number) {
  return api.get<Coord2Address>('/external/places/coord2address', {
    params: { lat, lng },
    skipAuth: true,
  })
}

/**
 * 폴백을 안내하는 문구로 바꾼다.
 *
 * DART-01이 검색 → GPS → 추천 목록 순으로 물러나게 돼 있어서, 쿼터·장애처럼
 * 다시 눌러도 소용없는 경우와 그냥 실패를 구분해 다음 수단을 알려준다.
 */
export function placeErrorMessage(cause: unknown): string {
  switch (errorCodeOf(cause)) {
    case 'EXTERNAL_QUOTA_EXCEEDED':
      return '오늘 검색을 너무 많이 썼어요. 현재 위치나 아래 추천 출발지를 이용해주세요.'
    case 'EXTERNAL_API_FAILED':
      return '검색이 잠시 안 돼요. 현재 위치나 아래 추천 출발지를 이용해주세요.'
    case 'OUT_OF_SERVICE_AREA':
      return '국내 위치만 지원해요.'
    default:
      return cause instanceof ApiError ? cause.message : '장소를 불러오지 못했습니다.'
  }
}
