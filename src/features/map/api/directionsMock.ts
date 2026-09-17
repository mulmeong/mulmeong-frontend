import { MOCK_ONSENS } from '@/features/map/api/mapMock'

import type {
  DirectionsQuery,
  DirectionsResult,
  RouteOption,
  RoutePlace,
  RoutePoint,
} from '@/features/map/types/directions'

const PLACES: RoutePlace[] = [
  {
    id: 'station-seoul',
    name: '서울역',
    address: '서울 용산구 한강대로 405',
    lat: 37.5547,
    lng: 126.9707,
  },
  {
    id: 'station-gangnam',
    name: '강남역',
    address: '서울 강남구 강남대로',
    lat: 37.4979,
    lng: 127.0276,
  },
  {
    id: 'station-suseo',
    name: '수서역',
    address: '서울 강남구 밤고개로',
    lat: 37.4854,
    lng: 127.1046,
  },
  {
    id: 'station-busan',
    name: '부산역',
    address: '부산 동구 중앙대로 206',
    lat: 35.1152,
    lng: 129.0414,
  },
  {
    id: 'airport-jeju',
    name: '제주공항',
    address: '제주 제주시 공항로 2',
    lat: 33.5066,
    lng: 126.4929,
  },
  ...MOCK_ONSENS.map(({ id, name, address, lat, lng }) => ({
    id: `onsen-${id}`,
    name,
    address,
    lat,
    lng,
  })),
]

export async function mockRoutePlaces(keyword: string): Promise<RoutePlace[]> {
  await new Promise((resolve) => setTimeout(resolve, 180))
  const query = keyword.trim().toLowerCase()
  return PLACES.filter((place) =>
    `${place.name} ${place.address}`.toLowerCase().includes(query),
  ).slice(0, 8)
}

/** 목 모드에서만 쓰는 도식 경로. 실제 도로나 운행 정보를 의미하지 않는다. */
export async function mockDirections(query: DirectionsQuery): Promise<DirectionsResult> {
  await new Promise((resolve) => setTimeout(resolve, 400))
  const { origin, destination, mode } = query
  const rad = Math.PI / 180
  const dLat = (destination.lat - origin.lat) * rad
  const dLng = (destination.lng - origin.lng) * rad
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(origin.lat * rad) * Math.cos(destination.lat * rad) * Math.sin(dLng / 2) ** 2
  const distance = 6371000 * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
  const disconnected = origin.lat < 34 !== destination.lat < 34
  if (
    disconnected ||
    (mode === 'walk' && distance > 30000) ||
    (mode === 'bike' && distance > 100000)
  ) {
    return { ...query, preview: true, routes: [] }
  }

  const make = (alternative: boolean): RouteOption => {
    const path: RoutePoint[] = Array.from({ length: 17 }, (_, index) => {
      const t = index / 16
      const bend = Math.sin(Math.PI * t) * (alternative ? -0.045 : 0.035)
      return {
        lat:
          origin.lat + (destination.lat - origin.lat) * t + (destination.lng - origin.lng) * bend,
        lng:
          origin.lng + (destination.lng - origin.lng) * t - (destination.lat - origin.lat) * bend,
      }
    })
    const distanceMeters = Math.round(distance * (alternative ? 1.28 : 1.15))
    const speed = { transit: 7, car: 12, walk: 1.2, bike: 4.2 }[mode]
    const durationSeconds = Math.max(
      60,
      Math.round(distanceMeters / speed + (mode === 'transit' ? 480 : 0)),
    )
    return {
      id: `${mode}-${alternative ? 'alternative' : 'recommended'}`,
      label: alternative ? '다른 경로' : '추천 경로',
      distanceMeters,
      durationSeconds,
      path,
      legs:
        mode === 'transit'
          ? [
              {
                mode: 'walk',
                label: '출발지에서 정류장까지 도보',
                durationSeconds: Math.round(durationSeconds * 0.1),
              },
              {
                mode: 'transit',
                label: '대중교통 이동',
                durationSeconds: Math.round(durationSeconds * 0.8),
              },
              {
                mode: 'walk',
                label: '정류장에서 도착지까지 도보',
                durationSeconds: Math.round(durationSeconds * 0.1),
              },
            ]
          : [
              {
                mode,
                label:
                  mode === 'car' ? '자동차 이동' : mode === 'bike' ? '자전거 이동' : '도보 이동',
                durationSeconds,
              },
            ],
    }
  }
  return {
    ...query,
    preview: true,
    routes: mode === 'walk' ? [make(false)] : [make(false), make(true)],
  }
}
