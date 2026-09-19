import type { Onsen } from '@/types/onsen'
import type { OnsenDetail } from '@/types/onsenDetail'

/** 서버는 '값 없음'을 null로, 프론트 타입은 undefined로 쓴다. */
function opt<T>(value: T | null | undefined): T | undefined {
  return value ?? undefined
}

/** 145 -> '2시간 25분', 90 -> '1시간 30분', 45 -> '45분' */
export function formatMinutes(minutes: number): string {
  const hours = Math.floor(minutes / 60)
  const rest = minutes % 60
  if (hours === 0) return `${rest}분`
  return rest === 0 ? `${hours}시간` : `${hours}시간 ${rest}분`
}

/**
 * 결과 카드가 쓸 수 있는 최소한의 온천 정보.
 *
 * 던지기 응답(DartResultPlace)과 공유 응답(SharedDart.result)이 모두 이 모양을
 * 만족한다 — 공유 쪽은 접근성·숙박이 없고 대신 썸네일이 있다.
 */
export type ResultPlaceLike = {
  placeId: number
  name: string
  sido: string
  sigungu?: string | null
  lat: number
  lng: number
  accessLevel?: string
  accessLabel?: string
  hasLodging?: boolean
  thumbnail?: string | null
}

/**
 * 추첨 결과를 결과 카드가 쓰는 Onsen 모양으로 맞춘다.
 *
 * 추첨 응답에는 사진·수질·요금이 없다 — 뽑는 데 필요한 값만 담겨 있다.
 * 그래서 온천 상세(GET /onsens/{id})가 도착하면 그 값으로 빈칸을 채운다.
 * 상세는 늦게 오거나 실패할 수 있어서, 없어도 카드가 그려지게 둔다.
 */
export function toResultOnsen(place: ResultPlaceLike, detail?: OnsenDetail): Onsen {
  const features = [
    detail?.facilities?.hasOutdoor && '노천탕 운영',
    detail?.facilities?.hasLodging && '숙박 가능',
    opt(detail?.facilities?.facilityType),
    opt(detail?.water.benefit),
  ].filter((item): item is string => typeof item === 'string')

  return {
    id: place.placeId,
    name: place.name,
    // 상세가 오기 전에는 시·군·구까지만 보여준다. 도착하면 전체 주소로 바뀐다.
    address: opt(detail?.address) ?? `${place.sido} ${place.sigungu ?? ''}`.trim(),
    sido: opt(detail?.sido) ?? place.sido,
    sigungu: opt(detail?.sigungu) ?? opt(place.sigungu),
    lat: place.lat,
    lng: place.lng,

    // 추첨 결과에만 있는 값 — 상세로 덮어쓰지 않는다.
    tags: [place.accessLabel, place.hasLodging ? '숙박 가능' : ''].filter(
      (tag): tag is string => Boolean(tag),
    ),
    transitAccessible: place.accessLevel === 'WALKABLE' || undefined,

    // 공유 응답은 썸네일을 주지만, 상세가 오면 더 큰 원본으로 바꾼다.
    imageUrl: detail?.images?.[0] ?? opt(place.thumbnail),
    rating: opt(detail?.reviewSummary?.avgRating),
    reviewCount: detail?.reviewSummary?.count ?? 0,

    waterTempC: opt(detail?.water.temp),
    waterQuality: opt(detail?.water.type),
    mainComponent: opt(detail?.water.component),
    ph: opt(detail?.water.ph),
    description: opt(detail?.regionComment),
    features: features.length > 0 ? features : undefined,

    openingHours: opt(detail?.hours),
    closedDays: opt(detail?.holiday),
    parking: opt(detail?.parkingInfo),
    admissionFee: opt(detail?.priceMin),
    phone: opt(detail?.phone),
    homepage: opt(detail?.homepageUrl),
    notice: opt(detail?.notes),
  }
}
