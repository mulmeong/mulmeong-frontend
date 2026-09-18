import { useNearby } from '@/features/map/hooks/useNearby'
import FavoriteButton from '@/features/favorites/FavoriteButton'
import type { FavoriteRequest } from '@/features/favorites/api'

import type { NearbyPlace } from '@/types/nearby'

type NearbyListProps = {
  onsenId: number
  /** 탭이 열렸을 때만 부른다 — 안 보는 탭 때문에 쿼터를 쓰지 않는다. */
  active: boolean
}

function formatDistance(m: number) {
  return m < 1000 ? `${m}m` : `${(m / 1000).toFixed(1)}km`
}

function PlaceRow({ place }: { place: NearbyPlace }) {
  const meta = `${place.categoryLabel} · ${formatDistance(place.distanceM)}`
  const category = place.category === 'RESTAURANT' || place.category === 'CAFE' ||
    place.category === 'ATTRACTION' || place.category === 'SPA' ? place.category : 'ETC'
  const target: FavoriteRequest = place.placeId != null ? { placeId: place.placeId } : {
    source: place.source, externalId: place.externalId, name: place.name,
    lat: place.lat, lng: place.lng, category, imageUrl: place.imageUrl,
    address: place.address, phone: place.phone,
  }

  const body = (
    <>
      {place.cardType === 'PHOTO' && place.imageUrl ? (
        <img
          src={place.imageUrl}
          alt=""
          loading="lazy"
          className="bg-surface-dim size-16 shrink-0 rounded-[2px] object-cover"
        />
      ) : (
        // INFO 카드(카카오 맛집·카페)는 사진이 없다 — 자리를 비우면 줄이 흔들려 라벨을 넣는다.
        <div className="bg-surface-dim text-text-secondary flex size-16 shrink-0 items-center justify-center rounded-sm text-[11px]">
          {place.categoryLabel}
        </div>
      )}

      <div className="flex min-w-0 flex-1 flex-col justify-center gap-1">
        <p className="text-text-primary text-[14px] leading-[1.5] font-semibold break-keep [overflow-wrap:anywhere]">
          {place.name}
        </p>
        <p className="text-text-secondary text-[12px] leading-5">{meta}</p>
        {place.description && (
          <p className="text-text-secondary line-clamp-2 text-[12px] leading-[1.65] [overflow-wrap:anywhere]">
            {place.description}
          </p>
        )}
      </div>
    </>
  )

  return (
    <div className="flex items-center gap-2">
      {place.kakaoPlaceUrl ? (
      <a
        href={place.kakaoPlaceUrl}
        target="_blank"
        rel="noreferrer"
        className="hover:bg-surface-dim -mx-2 flex min-w-0 flex-1 items-start gap-3 px-2 py-4 transition-colors outline-none focus-visible:ring-1 focus-visible:ring-inverse focus-visible:ring-inset"
      >
        {body}
      </a>
      ) : <div className="flex min-w-0 flex-1 items-start gap-3 py-4">{body}</div>}
      <FavoriteButton target={target} name={place.name} />
    </div>
  )
}

export default function NearbyList({ onsenId, active }: NearbyListProps) {
  const { result, loading, error } = useNearby(onsenId, active)

  if (loading)
    return (
      <p role="status" className="text-text-secondary py-3 text-[13px] leading-[1.7]">
        불러오는 중…
      </p>
    )

  if (error) {
    return (
      <p role="alert" className="text-danger text-[13px]">
        {error}
      </p>
    )
  }

  if (!result || result.items.length === 0) {
    return <p className="text-text-secondary text-[13px]">주변 여행지가 없습니다.</p>
  }

  return (
    <div>
      <ul className="divide-border-default/60 -mt-4 flex flex-col divide-y">
        {result.items.map((place) => (
          <li key={place.externalId}>
            <PlaceRow place={place} />
          </li>
        ))}
      </ul>

      {result.hasMore && (
        // 전체 보기(205)는 명세가 아직 없어 자리만 잡아둔다.
        <button
          type="button"
          disabled
          className="text-text-secondary mt-3 min-h-11 w-full cursor-not-allowed text-[12px] outline-none"
        >
          전체 보기
        </button>
      )}
    </div>
  )
}
