import { useNearby } from '@/features/map/hooks/useNearby'

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

  const body = (
    <>
      {place.cardType === 'PHOTO' && place.imageUrl ? (
        <img
          src={place.imageUrl}
          alt=""
          loading="lazy"
          className="bg-surface-dim size-16 shrink-0 rounded-sm object-cover"
        />
      ) : (
        // INFO 카드(카카오 맛집·카페)는 사진이 없다 — 자리를 비우면 줄이 흔들려 라벨을 넣는다.
        <div className="bg-surface-dim text-text-secondary flex size-16 shrink-0 items-center justify-center rounded-sm text-[11px]">
          {place.categoryLabel}
        </div>
      )}

      <div className="flex min-w-0 flex-1 flex-col justify-center gap-0.5">
        <p className="text-text-primary truncate text-[14px] font-medium">{place.name}</p>
        <p className="text-text-secondary text-[12px]">{meta}</p>
        {place.description && (
          <p className="text-text-secondary truncate text-[12px]">{place.description}</p>
        )}
      </div>
    </>
  )

  // 카카오 장소만 바깥으로 나갈 곳이 있다. TourAPI 항목은 아직 열 상세가 없어 정적으로 둔다.
  if (place.kakaoPlaceUrl) {
    return (
      <a
        href={place.kakaoPlaceUrl}
        target="_blank"
        rel="noreferrer"
        className="hover:bg-surface-dim -mx-2 flex gap-3 rounded-sm px-2 py-2 transition-colors outline-none focus-visible:underline"
      >
        {body}
      </a>
    )
  }

  return <div className="-mx-2 flex gap-3 px-2 py-2">{body}</div>
}

export default function NearbyList({ onsenId, active }: NearbyListProps) {
  const { result, loading, error } = useNearby(onsenId, active)

  if (loading) return <p className="text-text-secondary text-[13px]">불러오는 중…</p>

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
      <ul className="flex flex-col">
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
          className="text-text-secondary mt-3 w-full cursor-not-allowed text-[12px] outline-none"
        >
          전체 보기
        </button>
      )}
    </div>
  )
}
