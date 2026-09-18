import { api } from '@/api'
import { env } from '@/lib/env'

import type { MapBounds, Onsen } from '@/types/onsen'

import { mockSearchOnsens, mockSuggest } from './mapMock'

export type SearchOnsensParams = {
  keyword?: string
  region?: string
  /** 지도에 보이는 영역 (MAP-03). 없으면 전체에서 찾는다. */
  bounds?: MapBounds
  /**
   * 서버가 돌려줄 최대 개수. 조건 없이 조회하면 전국 505곳이 통째로 오므로
   * 첫 화면처럼 일부만 쓰는 화면에서 응답 크기를 제한한다. 외부 API 쿼터 절감 여부는
   * 서버 구현에 달려 있으며, limit 지원은 실서버 연동 시 확인해야 한다.
   */
  limit?: number
}

/**
 * distanceKm이 optional인 이유: 목은 항상 채우지만, 백엔드 /onsens가 거리를 붙여주는지
 * 아직 확인되지 않았다. 확인되면 OnsenWithDistance로 좁힌다.
 */
export type OnsenListItem = Onsen & { distanceKm?: number }

/**
 * MAP-05 자동완성 제안. 온천명과 지역명을 같이 돌려준다.
 * 시안이 없어 형태는 우리가 정했다 — BE 검색 스펙이 정해지면 맞춘다.
 */
export type Suggestion =
  { type: 'region'; value: string } | { type: 'onsen'; id: number; name: string; address: string }

/** 서버 검색 응답(GET /map/onsens/search). 명세의 /onsens/suggest는 아직 없다. */
type SearchResponse = {
  results: {
    type: string
    onsenId: number
    name: string
    address: string | null
    lat: number
    lng: number
  }[]
}

/** 좌표까지 필요한 호출부(길찾기 출발·도착 선택)가 있어 원본 그대로 돌려준다. */
export function searchOnsensByKeyword(keyword: string, limit = 10) {
  return api
    .get<SearchResponse>('/map/onsens/search', {
      params: { keyword, limit },
      skipAuth: true,
    })
    .then(({ results }) => results)
}

export function suggestPlaces(keyword: string): Promise<Suggestion[]> {
  const trimmed = keyword.trim()
  if (!trimmed) return Promise.resolve([])

  if (env.useMockSuggest) return mockSuggest(trimmed)
  return searchOnsensByKeyword(trimmed).then((results) =>
    results.map((item): Suggestion => ({
      type: 'onsen',
      id: item.onsenId,
      name: item.name,
      address: item.address ?? '',
    })),
  )
}

export function searchOnsens(params: SearchOnsensParams = {}): Promise<OnsenListItem[]> {
  const { keyword, region, bounds, limit } = params
  if (env.useMock) return mockSearchOnsens(params)
  // 비로그인도 지도를 볼 수 있다 (AUTH-02).
  return api.get<OnsenListItem[]>('/onsens', {
    params: {
      keyword,
      region,
      limit,
      swLat: bounds?.swLat,
      swLng: bounds?.swLng,
      neLat: bounds?.neLat,
      neLng: bounds?.neLng,
    },
    skipAuth: true,
  })
}
