/** MAP-08 화면 모델. API 계층에서 정규화된 서버 응답을 변환한다. */
export type RoutePoint = { lat: number; lng: number }
export type RoutePlace = RoutePoint & { id: string; name: string; address: string }
export type RouteField = { text: string; place?: RoutePlace }
export type TravelMode = 'transit' | 'car' | 'walk' | 'bike'
export type RouteLeg = {
  mode: TravelMode
  label: string
  durationSeconds: number
}
export type RouteOption = {
  id: string
  label: string
  distanceMeters: number
  durationSeconds: number
  legs: RouteLeg[]
  path: RoutePoint[]
  fare?: number
  walkTimeExcluded?: boolean
  transitDurationSeconds?: number
  walkDurationSeconds?: number
}
export type DirectionsQuery = {
  origin: RoutePlace
  destination: RoutePlace
  mode: TravelMode
}
export type DirectionsResult = DirectionsQuery & {
  preview: boolean
  routes: RouteOption[]
  routeNotFound?: boolean
}

export const TRAVEL_MODES: { value: TravelMode; label: string }[] = [
  { value: 'transit', label: '대중교통' },
  { value: 'car', label: '자동차' },
  { value: 'walk', label: '도보' },
  { value: 'bike', label: '자전거' },
]

export function formatRouteDuration(seconds: number) {
  const minutes = Math.max(0, Math.ceil(seconds / 60))
  const hours = Math.floor(minutes / 60)
  return hours ? `${hours}시간${minutes % 60 ? ` ${minutes % 60}분` : ''}` : `${minutes}분`
}

export function formatRouteDistance(meters: number) {
  return meters < 1000 ? `${Math.round(meters)}m` : `${(meters / 1000).toFixed(1)}km`
}
