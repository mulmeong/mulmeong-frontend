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

type PamphletIconName =
  | 'onsen'
  | 'pin'
  | 'cafe'
  | 'restaurant'
  | 'attraction'
  | 'place'
  | 'clock'
  | 'calendar'
  | 'won'
  | 'phone'
  | 'parking'
  | 'route'
  | 'star'
  | 'bed'
  | 'water'

function PamphletIcon({ name }: { name: PamphletIconName }) {
  const common = {
    width: 16,
    height: 16,
    viewBox: '0 0 16 16',
    fill: 'none',
    stroke: 'currentColor',
    strokeWidth: 1.35,
    strokeLinecap: 'round' as const,
    strokeLinejoin: 'round' as const,
    'aria-hidden': true,
  }

  switch (name) {
    case 'onsen':
      return (
        <svg {...common}>
          <path d="M4.2 3.2c.9.7.9 1.5 0 2.2M8 2.7c1 .8 1 1.7 0 2.5M11.8 3.2c.9.7.9 1.5 0 2.2" />
          <path d="M2.8 9.6c1.2-1 2.4-1 3.6 0s2.4 1 3.6 0 2.4-1 3.2-.3" />
          <path d="M3 12.2c1.1-.7 2.2-.7 3.3 0s2.2.7 3.3 0 2.2-.7 3.4-.1" />
        </svg>
      )
    case 'pin':
      return (
        <svg {...common}>
          <path d="M8 14s4-3.8 4-7a4 4 0 0 0-8 0c0 3.2 4 7 4 7Z" />
          <path d="M8 8.2a1.3 1.3 0 1 0 0-2.6 1.3 1.3 0 0 0 0 2.6Z" />
        </svg>
      )
    case 'cafe':
      return (
        <svg {...common}>
          <path d="M3.5 6h6.8v3.2a3 3 0 0 1-3 3h-.8a3 3 0 0 1-3-3V6Z" />
          <path d="M10.3 7h1.1a1.4 1.4 0 0 1 0 2.8h-1.1M5 3.2v1M7.2 2.8v1.1" />
        </svg>
      )
    case 'restaurant':
      return (
        <svg {...common}>
          <path d="M4.7 2.8v10.4M3.2 2.8v3.1a1.5 1.5 0 0 0 3 0V2.8M10.8 2.8c1.2 1.1 1.6 2.4 1.1 4-.3.9-.8 1.5-1.5 1.8v4.6" />
        </svg>
      )
    case 'attraction':
      return (
        <svg {...common}>
          <path d="M3 12.5 5.2 4l3.2 6 2-3.1 2.6 5.6H3Z" />
          <path d="M10.8 3.1h1.7v1.7" />
        </svg>
      )
    case 'clock':
      return (
        <svg {...common}>
          <path d="M8 13.2A5.2 5.2 0 1 0 8 2.8a5.2 5.2 0 0 0 0 10.4Z" />
          <path d="M8 5.2v3l2 1.2" />
        </svg>
      )
    case 'calendar':
      return (
        <svg {...common}>
          <path d="M3.2 4.2h9.6v8H3.2zM5.3 2.8v2M10.7 2.8v2M3.2 6.4h9.6" />
        </svg>
      )
    case 'won':
      return (
        <svg {...common}>
          <path d="m3.2 5.3 1.5 5.4 2-5.4 2 5.4 1.5-5.4M2.8 7.1h10.4M2.8 9h10.4" />
        </svg>
      )
    case 'phone':
      return (
        <svg {...common}>
          <path d="M5 3.2 6.5 6 5.4 7c.8 1.6 2 2.8 3.6 3.6l1-1.1 2.8 1.5-.7 2c-.2.4-.6.6-1 .5-4.2-.8-7.8-4.4-8.6-8.6-.1-.4.1-.8.5-1l2-.7Z" />
        </svg>
      )
    case 'parking':
      return (
        <svg {...common}>
          <path d="M5.2 13V3.2h3.4a2.6 2.6 0 0 1 0 5.2H5.2" />
        </svg>
      )
    case 'route':
      return (
        <svg {...common}>
          <path d="M3.2 4.2h2.4c1.4 0 2.1.7 2.1 1.8s-.7 1.8-2.1 1.8h-.8c-1.4 0-2.1.7-2.1 1.8s.7 1.8 2.1 1.8h7" />
          <path d="m10.4 9.8 1.8 1.7-1.8 1.7" />
        </svg>
      )
    case 'star':
      return (
        <svg {...common}>
          <path d="m8 2.9 1.4 3 3.2.4-2.3 2.3.6 3.2L8 10.3l-2.9 1.5.6-3.2-2.3-2.3 3.2-.4L8 2.9Z" />
        </svg>
      )
    case 'bed':
      return (
        <svg {...common}>
          <path d="M3 12V4M3 8.5h10V12M5 8.5V6.8h2.4v1.7" />
        </svg>
      )
    case 'water':
      return (
        <svg {...common}>
          <path d="M8 2.8s3.2 3.5 3.2 6.1A3.2 3.2 0 0 1 4.8 9C4.8 6.3 8 2.8 8 2.8Z" />
        </svg>
      )
    default:
      return (
        <svg {...common}>
          <path d="M3.5 4.5h9v8h-9z" />
          <path d="M5.5 6.5h5M5.5 8.5h5" />
        </svg>
      )
  }
}

function categoryIcon(category: PamphletViewPlace['category']): PamphletIconName {
  if (category === 'onsen') return 'onsen'
  if (category === 'cafe') return 'cafe'
  if (category === 'restaurant') return 'restaurant'
  if (category === 'attraction') return 'attraction'
  return 'place'
}

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
    return `따뜻한 물을 따라, ${destination}을 천천히 둘러보는 하루.`
  }
  if (onsenPlaces.length === 1) {
    return `온천에서 쉬고, ${destination}을 가볍게 둘러보는 하루.`
  }
  return `이번 여행에 함께 담은 곳들. ${destination}에서 보내는 하루.`
}

function onsenFocusMeta(place: PamphletViewPlace) {
  const water = waterMeta(place.spec)
  const region = place.address ? regionLabel(place.address) : ''
  return [region, ...water.slice(0, 2)].filter(Boolean).join(' · ')
}

function placeCountLabel(placeCount: number, onsenCount: number) {
  return `장소 ${placeCount}곳 · 온천 ${onsenCount}곳`
}

function introPlaceList(pamphlet: PamphletView, isOnsenTrip: boolean, maxVisible: number) {
  const places = isOnsenTrip ? nearbyPlacesOf(pamphlet) : pamphlet.places
  return {
    places: places.slice(0, maxVisible),
    restCount: Math.max(places.length - maxVisible, 0),
  }
}

export function PamphletIntro({
  pamphlet,
  density = 'full',
}: {
  pamphlet: PamphletView
  /**
   * 표지 한 면에 온천 강조·장소 목록을 얼마나 보여줄지. 장소가 많으면
   * (PamphletReader가 실측해 넘치는 걸 감지하면) 단계적으로 줄여 재요청한다
   * — 목록 자체를 자르는 대신 "+N곳"으로 요약하거나 섹션을 생략해, 표지가
   * 하단을 넘지 않게 한다. full → compact → minimal 순으로 더 줄어든다.
   */
  density?: 'full' | 'compact' | 'minimal'
}) {
  const overview = overviewRows(pamphlet)
  const placeCount = pamphlet.placeCount || pamphlet.places.length
  const onsenPlaces = onsenPlacesOf(pamphlet)
  const isOnsenTrip = onsenPlaces.length > 0
  const showOnsenFocus = isOnsenTrip && density !== 'minimal'
  const maxOnsenVisible = density === 'compact' ? 1 : 2
  const maxItineraryVisible =
    density === 'minimal' ? 1 : density === 'compact' ? 2 : pamphlet.coverImage ? 4 : 5
  const visibleOnsens = onsenPlaces.slice(0, maxOnsenVisible)
  const hiddenOnsenCount = Math.max(onsenPlaces.length - visibleOnsens.length, 0)
  const itinerary = introPlaceList(pamphlet, isOnsenTrip, maxItineraryVisible)

  return (
    <div className="pamphlet-editorial pamphlet-intro">
      <p className="pamphlet-eyebrow">{isOnsenTrip ? '물멍 온천 여행' : '물멍 여행 팜플렛'}</p>
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

      <p className="pamphlet-course-count">{placeCountLabel(placeCount, pamphlet.onsenCount)}</p>

      {showOnsenFocus && (
        <section className="pamphlet-onsen-focus" aria-label="이번 여행의 온천">
          <p className="pamphlet-eyebrow">이번 여행의 온천</p>
          <ul>
            {visibleOnsens.map((place) => (
              <li key={place.id}>
                <strong>{place.name}</strong>
                <span>{onsenFocusMeta(place)}</span>
              </li>
            ))}
            {hiddenOnsenCount > 0 && (
              <li className="pamphlet-itinerary-more">온천 {hiddenOnsenCount}곳 더</li>
            )}
          </ul>
        </section>
      )}

      <ol className="pamphlet-itinerary" aria-label="제안 장소 목록">
        {itinerary.places.map((place) => {
          const originalIndex = pamphlet.places.findIndex((item) => item.id === place.id)
          const index = originalIndex >= 0 ? originalIndex : 0
          return (
            <li key={place.id}>
              <span aria-hidden="true">{String(index + 1).padStart(2, '0')}</span>
              <span>{place.name}</span>
            </li>
          )
        })}
        {itinerary.restCount > 0 && (
          <li className="pamphlet-itinerary-more">
            <span aria-hidden="true">+</span>
            <span>외 {itinerary.restCount}곳</span>
          </li>
        )}
      </ol>

      <footer className="pamphlet-colophon">
        <span>공유용 팜플렛 · {pamphlet.createdAt}</span>
        {usesTourApi(pamphlet.places) && <span>장소 정보 · {TOUR_API_CREDIT}</span>}
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
  return [spec.facilityType, spec.hasOutdoor ? '노천 있음' : '', spec.hasLodging ? '숙박 가능' : '']
    .filter(Boolean)
    .join(' · ')
}

function priceLine(spec?: PamphletPlaceSpec) {
  if (spec?.price === undefined) return ''
  return `${spec.price.toLocaleString()}원부터`
}

function generalFeature(place: PamphletViewPlace, typeLabel: string, isOnsenTrip: boolean) {
  return (
    place.curation?.trim() ||
    place.description?.trim() ||
    (isOnsenTrip ? `온천과 함께 들를 ${typeLabel}` : `이 여행에 함께 담은 ${typeLabel}`)
  )
}

function shortCopy(value: string, maxLength = 92) {
  const text = value.trim()
  if (text.length <= maxLength) return text
  const firstSentence = text.match(/^.*?[.!?。！？]|^.*?[.。]\s/)?.[0]?.trim()
  if (firstSentence && firstSentence.length <= maxLength) return firstSentence

  const words = text.split(/\s+/)
  let next = ''
  for (const word of words) {
    const candidate = next ? `${next} ${word}` : word
    if (candidate.length > maxLength) break
    next = candidate
  }
  return next || text.slice(0, maxLength)
}

type PamphletMetaRow = {
  icon: PamphletIconName
  value: string
  label?: string
}

function isMetaRow(row: PamphletMetaRow | undefined): row is PamphletMetaRow {
  return Boolean(row)
}

function metaRow(
  icon: PamphletIconName,
  label: string | undefined,
  value?: string,
): PamphletMetaRow | undefined {
  const text = value?.trim()
  if (!text) return undefined
  return label ? { icon, label, value: text } : { icon, value: text }
}

function generalRows(place: PamphletViewPlace) {
  const details = place.details
  return [
    metaRow('pin', undefined, place.address),
    metaRow('clock', undefined, details?.hours),
    metaRow('calendar', '휴무', details?.closed),
    metaRow(
      'won',
      undefined,
      details?.price !== undefined ? `${details.price.toLocaleString()}원부터` : undefined,
    ),
  ].filter(isMetaRow)
}

function hoursLine(spec?: PamphletPlaceSpec) {
  return spec?.hours?.trim() ?? ''
}

function closedLine(spec?: PamphletPlaceSpec) {
  return spec?.closed?.trim() ?? ''
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

function MetaRow({ row }: { row: PamphletMetaRow }) {
  return (
    <p>
      <span className="pamphlet-meta-icon">
        <PamphletIcon name={row.icon} />
      </span>
      <span className="pamphlet-meta-text">
        {row.label && <span className="pamphlet-meta-label">{row.label}</span>}
        {row.value}
      </span>
    </p>
  )
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
  const feature = shortCopy(
    isOnsen ? onsenFeature(spec) : generalFeature(place, typeLabel, isOnsenTrip),
    isOnsen ? 86 : 96,
  )
  const generalInfo = generalRows(place).slice(0, 3)
  const facility = facilityLine(spec)
  const price = priceLine(spec)
  const hours = hoursLine(spec)
  const closed = closedLine(spec)
  const access = accessLine(spec)
  const review = reviewLine(spec)
  const onsenInfo = [
    metaRow('bed', '시설', facility),
    metaRow('won', '요금', price),
    metaRow('clock', '시간', hours),
    metaRow('calendar', '휴무', closed),
    metaRow('pin', '접근', access),
    metaRow('star', '리뷰', review),
  ]
    .filter(isMetaRow)
    .slice(0, 5)

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
            {String(index + 1).padStart(2, '0')}
          </p>
          {isOnsen && (
            <span className="pamphlet-onsen-mark">
              <PamphletIcon name="onsen" />
              온천
            </span>
          )}
        </div>

        <h3>{place.name}</h3>
        {isOnsen ? (
          <p className="pamphlet-place-context">이번 여행의 온천</p>
        ) : isOnsenTrip ? (
          <p className="pamphlet-place-context">온천과 함께 들를 곳</p>
        ) : null}
        <p className="pamphlet-place-kind">
          <span>
            <PamphletIcon name={categoryIcon(place.category)} />
            {typeLabel}
          </span>
          {region && (
            <span>
              <PamphletIcon name="pin" />
              {region}
            </span>
          )}
        </p>

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
            {onsenInfo.length > 0 && (
              <div className="pamphlet-onsen-meta">
                {onsenInfo.map((row) => (
                  <MetaRow key={`${row.label ?? row.icon}-${row.value}`} row={row} />
                ))}
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
                {generalInfo.map((row) => (
                  <MetaRow key={`${row.label ?? row.icon}-${row.value}`} row={row} />
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
      <span className="pamphlet-eyebrow">물멍</span>
      <p>
        {count === 0
          ? '아직 담긴 장소가 없어요.'
          : isOnsenTrip
            ? '따뜻하게 쉬고,\n천천히 둘러보기.'
            : '이번 여행에\n함께 담은 곳.'}
      </p>
      <span className="pamphlet-eyebrow">
        {isOnsenTrip ? `장소 ${count}곳 · 온천 여행` : `장소 ${count}곳 · 여행 팜플렛`}
      </span>
    </div>
  )
}
