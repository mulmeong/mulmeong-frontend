import type { DirectionsQuery, RoutePlace } from '@/features/map/types/directions'

/** 공식 길찾기 링크 형식: https://apis.map.kakao.com/web/guide/#routeurl */
export function kakaoDirectionsUrl({ origin, destination, mode }: DirectionsQuery) {
  const transport = { car: 'car', transit: 'traffic', walk: 'walk', bike: 'bicycle' }[mode]
  const place = (point: RoutePlace) => `${encodeURIComponent(point.name)},${point.lat},${point.lng}`
  return `https://map.kakao.com/link/by/${transport}/${place(origin)}/${place(destination)}`
}
