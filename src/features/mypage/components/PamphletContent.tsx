import { useState } from 'react'

import { TOUR_API_CREDIT } from '@/constants/credits'
import { DEFAULT_ONSEN_IMAGE } from '@/constants/images'
import { usesTourApi } from '@/features/mypage/data/pamphletView'

import type {
  PamphletPlaceSpec,
  PamphletView,
  PamphletViewPlace,
} from '@/features/mypage/data/pamphletView'
import { categoryLabel } from '@/types/saved'

function formatTravelDate(value?: string) {
  if (!value) return undefined
  return value.replaceAll('-', '.')
}

function overviewRows(pamphlet: PamphletView) {
  return [
    ['지역', pamphlet.regionName],
    ['여행 날짜', formatTravelDate(pamphlet.travelDate)],
    ['함께', pamphlet.partySize ? `${pamphlet.partySize}명` : undefined],
    ['큐레이터', pamphlet.authorName],
  ].filter((row): row is [string, string] => Boolean(row[1]))
}

function onsenPlacesOf(pamphlet: PamphletView) {
  return pamphlet.places.filter((place) => place.category === 'onsen')
}

function nearbyPlacesOf(pamphlet: PamphletView) {
  return pamphlet.places.filter((place) => place.category !== 'onsen')
}

function destinationLabel(pamphlet: PamphletView) {
  return (
    pamphlet.regionName?.trim() ||
    pamphlet.places.map((place) => regionLabel(place.address)).find(Boolean) ||
    '이 여행지'
  )
}

function introCopy(pamphlet: PamphletView, onsenPlaces: PamphletViewPlace[]) {
  const destination = destinationLabel(pamphlet)

  if (onsenPlaces.length > 1) {
    return `따뜻한 물에 번갈아 쉬어 가며, ${destination}을 천천히 둘러보는 하루.`
  }
  if (onsenPlaces.length === 1) {
    return `따뜻한 물에 몸을 담그고, ${destination}을 천천히 둘러보는 하루.`
  }
  return `좋아하는 장소들을 따라, ${destination}에서 보내는 하루.`
}

function onsenFocusMeta(place: PamphletViewPlace) {
  const water = waterMeta(place.spec)
  const region = place.address ? regionLabel(place.address) : ''
  return [region, ...water.slice(0, 2)].filter(Boolean).join(' · ')
}

export function PamphletIntro({ pamphlet }: { pamphlet: PamphletView }) {
  const overview = overviewRows(pamphlet)
  const placeCount = pamphlet.placeCount || pamphlet.places.length
  const onsenPlaces = onsenPlacesOf(pamphlet)
  const nearbyPlaces = nearbyPlacesOf(pamphlet)
  const isOnsenTrip = onsenPlaces.length > 0

  return (
    <div className="pamphlet-editorial pamphlet-intro">
      <p className="pamphlet-eyebrow">
        MULMEONG · {isOnsenTrip ? 'ONSEN TRIP CURATION' : 'TRIP CURATION'}
      </p>
      <div className="pamphlet-intro-heading">
        <span className="pamphlet-edition">{pamphlet.number}</span>
        <h2>{pamphlet.title}</h2>
        <p className="pamphlet-intro-copy">{introCopy(pamphlet, onsenPlaces)}</p>
      </div>

      {pamphlet.coverImage && (
        <figure className="pamphlet-intro-cover">
          <img src={pamphlet.coverImage} alt="" />
        </figure>
      )}

      {overview.length > 0 && (
        <dl className="pamphlet-overview">
          {overview.map(([label, value]) => (
            <div key={label}>
              <dt>{label}</dt>
              <dd>{value}</dd>
            </div>
          ))}
        </dl>
      )}

      <p className="pamphlet-course-count">
        {placeCount} PLACES · {pamphlet.onsenCount} ONSEN
      </p>

      {isOnsenTrip && (
        <section className="pamphlet-onsen-focus" aria-label="이번 여행의 온천">
          <p className="pamphlet-eyebrow">ONSEN CENTER</p>
          <ul>
            {onsenPlaces.map((place) => (
              <li key={place.id}>
                <strong>{place.name}</strong>
                <span>{onsenFocusMeta(place)}</span>
              </li>
            ))}
          </ul>
        </section>
      )}

      <ol className="pamphlet-itinerary" aria-label="제안 장소 목록">
        {(isOnsenTrip ? nearbyPlaces : pamphlet.places).map((place) => {
          const originalIndex = pamphlet.places.findIndex((item) => item.id === place.id)
          const index = originalIndex >= 0 ? originalIndex : 0
          return (
            <li key={place.id}>
              <span aria-hidden="true">{String(index + 1).padStart(2, '0')}</span>
              <span>{place.name}</span>
            </li>
          )
        })}
      </ol>

      <footer className="pamphlet-colophon">
        <span>Made for sharing · {pamphlet.createdAt}</span>
        {usesTourApi(pamphlet.places) && <span>PLACE DATA · {TOUR_API_CREDIT}</span>}
      </footer>
    </div>
  )
}

function regionLabel(address: string) {
  return address.split(/\s+/).filter(Boolean).slice(0, 2).join(' ')
}

function waterMeta(spec?: PamphletPlaceSpec): string[] {
  if (!spec) return []
  const values: string[] = []
  if (spec.tempC !== undefined) values.push(`${spec.tempC.toFixed(1)}℃`)
  if (spec.waterType) values.push(spec.waterType)
  if (spec.ph !== undefined) values.push(`pH ${spec.ph}`)
  return values
}

function onsenFeature(spec?: PamphletPlaceSpec) {
  return spec?.note?.trim() ?? ''
}

function facilityLine(spec?: PamphletPlaceSpec) {
  if (!spec) return ''
  return [spec.facilityType, spec.hasLodging ? '숙박 가능' : ''].filter(Boolean).join(' · ')
}

function priceLine(spec?: PamphletPlaceSpec) {
  if (spec?.price === undefined) return ''
  return `${spec.price.toLocaleString()}원부터`
}

function sourceLabel(source?: string) {
  if (source === 'TOUR_API') return '한국관광공사'
  if (source === 'KAKAO') return '카카오 장소'
  if (source === 'MOIS') return '공공데이터'
  return ''
}

function generalFeature(place: PamphletViewPlace, typeLabel: string, isOnsenTrip: boolean) {
  return (
    place.curation?.trim() ||
    place.description?.trim() ||
    (isOnsenTrip ? `온천과 함께 들를 ${typeLabel}` : `이 여행에 함께 담은 ${typeLabel}`)
  )
}

function generalRows(place: PamphletViewPlace, typeLabel: string, isOnsenTrip: boolean) {
  return [
    ['ROLE', isOnsenTrip ? '온천과 함께 들를 곳' : undefined],
    ['TYPE', typeLabel],
    ['AREA', place.address],
    ['SOURCE', sourceLabel(place.source)],
  ].filter((row): row is [string, string] => Boolean(row[1]))
}

function accessLine(spec?: PamphletPlaceSpec) {
  if (!spec) return ''
  return [spec.accessLabel, spec.stationName ? `${spec.stationName} 기준` : '']
    .filter(Boolean)
    .join(' · ')
}

function reviewLine(spec?: PamphletPlaceSpec) {
  if (spec?.avgRating === undefined) return ''
  return `${spec.avgRating.toFixed(1)}${spec.reviewCount ? ` · 리뷰 ${spec.reviewCount}` : ''}`
}

export function PamphletPlace({
  place,
  index,
  isOnsenTrip,
}: {
  place: PamphletViewPlace
  index: number
  isOnsenTrip: boolean
}) {
  const [failedImage, setFailedImage] = useState<string>()
  const spec = place.spec
  const isOnsen = place.category === 'onsen'
  const imageUrl = place.imageUrl && failedImage !== place.imageUrl ? place.imageUrl : undefined
  const typeLabel = place.typeLabel?.trim() || categoryLabel(place.category)
  const region = place.address ? regionLabel(place.address) : ''
  const water = waterMeta(spec)
  const feature = isOnsen ? onsenFeature(spec) : generalFeature(place, typeLabel, isOnsenTrip)
  const generalInfo = generalRows(place, typeLabel, isOnsenTrip)
  const facility = facilityLine(spec)
  const price = priceLine(spec)
  const access = accessLine(spec)
  const route = spec?.stationDesc?.trim() ?? ''
  const review = reviewLine(spec)

  return (
    <article className="pamphlet-editorial pamphlet-place" data-onsen={isOnsen || undefined}>
      <figure className="pamphlet-place-figure">
        {imageUrl ? (
          <img src={imageUrl} alt={place.name} onError={() => setFailedImage(place.imageUrl)} />
        ) : isOnsen ? (
          <img src={DEFAULT_ONSEN_IMAGE} alt={place.name} />
        ) : (
          <div
            className="pamphlet-photo-placeholder"
            role="img"
            aria-label={`${place.name} 사진 없음`}
          >
            <span>{categoryLabel(place.category)}</span>
            <span>등록된 사진이 없습니다</span>
          </div>
        )}
      </figure>

      <div className="pamphlet-place-body">
        <div className="pamphlet-place-kicker">
          <p className="pamphlet-eyebrow pamphlet-place-index">
            PLACE {String(index + 1).padStart(2, '0')}
          </p>
          {isOnsen && <span className="pamphlet-onsen-mark">ONSEN</span>}
        </div>

        <h3>{place.name}</h3>
        {isOnsen ? (
          <p className="pamphlet-place-context">이번 여행의 온천</p>
        ) : isOnsenTrip ? (
          <p className="pamphlet-place-context">온천과 함께 들를 곳</p>
        ) : null}
        <p className="pamphlet-place-kind">{[typeLabel, region].filter(Boolean).join(' · ')}</p>

        {isOnsen ? (
          <div className="pamphlet-onsen-details">
            {water.length > 0 && (
              <p className="pamphlet-place-water">
                {water.map((value, valueIndex) => (
                  // 첫 값은 항상 수온(waterMeta 순서) — 물멍이 온천을 고르는
                  // 첫 기준이라 이 장에서 가장 먼저 눈에 들어와야 한다.
                  <span
                    key={value}
                    className={valueIndex === 0 ? 'pamphlet-place-temp' : undefined}
                  >
                    {value}
                  </span>
                ))}
              </p>
            )}
            {feature && <p className="pamphlet-place-copy">{feature}</p>}
            {(facility || price || access || route || review) && (
              <div className="pamphlet-onsen-meta">
                {facility && (
                  <p>
                    <span>FACILITY</span>
                    {facility}
                  </p>
                )}
                {price && (
                  <p>
                    <span>PRICE</span>
                    {price}
                  </p>
                )}
                {access && (
                  <p>
                    <span>ACCESS</span>
                    {access}
                  </p>
                )}
                {route && (
                  <p className="pamphlet-onsen-route">
                    <span>ROUTE</span>
                    <em>{route}</em>
                  </p>
                )}
                {review && (
                  <p>
                    <span>REVIEW</span>
                    {review}
                  </p>
                )}
              </div>
            )}
          </div>
        ) : (
          <>
            {feature && (
              <p className="pamphlet-place-copy pamphlet-place-copy-general">{feature}</p>
            )}
            {generalInfo.length > 0 && (
              <div className="pamphlet-place-meta-list">
                {generalInfo.map(([label, value]) => (
                  <p key={label}>
                    <span>{label}</span>
                    {value}
                  </p>
                ))}
              </div>
            )}
          </>
        )}
      </div>
    </article>
  )
}

export function PamphletEnd({
  count,
  isOnsenTrip = false,
}: {
  count: number
  isOnsenTrip?: boolean
}) {
  return (
    <div className="pamphlet-editorial pamphlet-end">
      <span className="pamphlet-eyebrow">MULMEONG</span>
      <p>
        {count === 0
          ? '아직 담긴 장소가 없어요.'
          : isOnsenTrip
            ? '온천을 중심으로\n함께 둘러볼 장소들.'
            : '함께 둘러볼 곳들을\n하나의 여행 제안으로.'}
      </p>
      <span className="pamphlet-eyebrow">
        {count} PLACES · {isOnsenTrip ? 'ONSEN TRIP' : 'TRIP CURATION'}
      </span>
    </div>
  )
}
