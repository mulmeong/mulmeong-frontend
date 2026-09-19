import { placeholderImageOf } from '@/constants/images'
import FavoriteButton from '@/features/favorites/FavoriteButton'
import type { FavoriteCategory, FavoriteRequest } from '@/features/favorites/api'
import { POI_CATEGORY_LABELS, type MapPoi, type PoiCategory } from '@/types/poi'

function formatDistance(m?: number | null) {
  if (m == null) return undefined
  return m < 1000 ? `${m}m` : `${(m / 1000).toFixed(1)}km`
}

function favoriteCategoryOf(category: PoiCategory): Exclude<FavoriteCategory, 'ONSEN'> {
  if (category === 'CAFE' || category === 'RESTAURANT') return category
  if (
    category === 'PARK' ||
    category === 'CULTURE' ||
    category === 'LEISURE' ||
    category === 'SHOPPING' ||
    category === 'FESTIVAL'
  )
    return 'ATTRACTION'
  return 'ETC'
}

function favoriteTargetOf(poi: MapPoi, imageUrl?: string | null): FavoriteRequest | undefined {
  const address = poi.address ?? poi.roadAddress
  if (poi.placeId != null) return { placeId: poi.placeId }
  if (!poi.externalId) return undefined
  return {
    source: 'TOUR_API',
    externalId: poi.externalId,
    name: poi.name,
    lat: poi.lat,
    lng: poi.lng,
    category: favoriteCategoryOf(poi.category),
    address,
    phone: poi.phone,
    imageUrl,
  }
}

type PoiDetailPanelProps = {
  poi: MapPoi
  hasOnsenBack: boolean
  onBack: () => void
  onDirections: () => void
}

export default function PoiDetailPanel({
  poi,
  hasOnsenBack,
  onBack,
  onDirections,
}: PoiDetailPanelProps) {
  const imageUrl = poi.imageUrl ?? poi.image ?? poi.firstImage ?? poi.firstimage ?? poi.thumbnail
  const address = poi.address ?? poi.roadAddress
  const category = poi.categoryName || POI_CATEGORY_LABELS[poi.category]
  const distance = formatDistance(poi.distanceM)
  const favoriteTarget = favoriteTargetOf(poi, imageUrl)
  const fallbackImage = placeholderImageOf(poi.category)

  return (
    <div className="bg-surface scrollbar-thin h-full min-w-0 overflow-y-auto px-4 pb-8">
      <div className="flex h-12 items-center pt-3">
        <button
          type="button"
          onClick={onBack}
          className="text-text-secondary hover:text-text-primary -ml-1 inline-flex min-h-8 items-center gap-1 rounded-sm px-1 text-[12px] outline-none focus-visible:ring-1 focus-visible:ring-inverse"
        >
          <span aria-hidden="true">‹</span>
          {hasOnsenBack ? '온천 상세' : '돌아가기'}
        </button>
      </div>

      <div className="pt-1">
        <p className="text-text-secondary text-[12px] leading-5">{category}</p>
        <h2 className="text-text-primary mt-1 text-[20px] leading-[1.4] font-semibold tracking-tight break-keep [overflow-wrap:anywhere]">
          {poi.name}
        </h2>
        {distance && (
          <p className="text-text-secondary mt-1.5 text-[12px] leading-5">{distance}</p>
        )}
      </div>

      <img
        src={imageUrl || fallbackImage}
        alt=""
        onError={(event) => {
          event.currentTarget.onerror = null
          event.currentTarget.src = fallbackImage
        }}
        className="bg-surface-dim mt-6 h-[180px] w-full rounded-[2px] object-cover"
      />

      <div role="group" aria-label="장소 액션" className="mt-2 grid grid-cols-2 gap-1 pb-1">
        {favoriteTarget ? (
          <FavoriteButton
            target={favoriteTarget}
            name={poi.name}
            label="저장"
            className="h-9 w-full text-[12px] font-medium [&>svg]:size-4"
          />
        ) : (
          <span />
        )}
        <button
          type="button"
          onClick={onDirections}
          className="text-text-primary hover:bg-surface-dim flex min-h-9 items-center justify-center gap-2 text-[12px] font-medium outline-none focus-visible:ring-1 focus-visible:ring-inverse"
        >
          길찾기
        </button>
      </div>

      <section className="mt-7">
        <h3 className="text-text-primary text-[15px] leading-6 font-semibold">기본 정보</h3>
        <dl className="mt-4 space-y-4">
          {address && (
            <div className="space-y-1.5">
              <dt className="text-text-secondary text-[11px] leading-6">주소</dt>
              <dd className="text-text-primary text-[13px] leading-6 font-medium break-keep [overflow-wrap:anywhere]">
                {address}
              </dd>
            </div>
          )}
          {poi.phone && (
            <div className="grid grid-cols-[64px_minmax(0,1fr)] items-start gap-3">
              <dt className="text-text-secondary text-[11px] leading-6">전화번호</dt>
              <dd className="text-text-primary text-[13px] leading-6 font-medium">{poi.phone}</dd>
            </div>
          )}
          {distance && (
            <div className="grid grid-cols-[64px_minmax(0,1fr)] items-start gap-3">
              <dt className="text-text-secondary text-[11px] leading-6">거리</dt>
              <dd className="text-text-primary text-[13px] leading-6 font-medium">{distance}</dd>
            </div>
          )}
        </dl>
      </section>
    </div>
  )
}

