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

export function PamphletIntro({ pamphlet }: { pamphlet: PamphletView }) {
  const summary = pamphlet.summary.length
    ? pamphlet.summary
    : [...new Set(pamphlet.places.map((place) => place.address))].filter(Boolean)

  return (
    <div className="pamphlet-editorial pamphlet-intro">
      <p className="pamphlet-eyebrow">MULMEONG · TRAVEL NOTES</p>
      <div className="pamphlet-intro-heading">
        <span className="pamphlet-edition">{pamphlet.number}</span>
        <h2>{pamphlet.title}</h2>
        <p className="pamphlet-intro-copy">
          온천의 물성, 접근성, 머물 곳을 한 장에 엮은 여행 기록.
        </p>
        {summary.length > 0 && <p className="pamphlet-intro-regions">{summary.join(' · ')}</p>}
      </div>
      <ol className="pamphlet-itinerary" aria-label="엮어둔 여행 장소">
        {pamphlet.places.map((place, index) => (
          <li key={place.id}>
            <span aria-hidden="true">{String(index + 1).padStart(2, '0')}</span>
            <span>{place.name}</span>
          </li>
        ))}
      </ol>
      <footer className="pamphlet-colophon">
        <span>{pamphlet.places.length} Places</span>
        <span>만든 날 {pamphlet.createdAt}</span>
        <span>엮어둔 곳, 나만의 여행.</span>
        {/* 한국관광공사 장소가 섞여 있을 때만, 팜플렛 단위로 한 번. */}
        {usesTourApi(pamphlet.places) && <span>PLACE DATA · {TOUR_API_CREDIT}</span>}
      </footer>
    </div>
  )
}

/** 수온·수질·pH — 온천의 성질. 값이 있는 것만 가운뎃점으로 잇는다. */
function waterLine(spec?: PamphletPlaceSpec): string[] {
  if (!spec) return []
  const values: string[] = []
  if (spec.tempC !== undefined) values.push(`${spec.tempC.toFixed(1)}℃`)
  if (spec.waterType) values.push(spec.waterType)
  if (spec.facilityType) values.push(spec.facilityType)
  if (spec.hasLodging) values.push('숙박 가능')
  if (spec.ph !== undefined) values.push(`pH ${spec.ph}`)
  return values
}

/** 방문에 참고하는 값. 서버가 아직 안 채우는 항목이 많아 있는 것만 싣는다. */
function visitRows(spec?: PamphletPlaceSpec): [string, string][] {
  if (!spec) return []
  const rows: [string, string][] = []
  if (spec.hours) rows.push(['HOURS', spec.hours])
  if (spec.price !== undefined) rows.push(['PRICE', `${spec.price.toLocaleString()}원부터`])
  if (spec.closed) rows.push(['CLOSED', spec.closed])
  if (spec.parking) rows.push(['PARKING', spec.parking])
  if (spec.accessLabel)
    rows.push(['ACCESS', [spec.accessLabel, spec.stationName].filter(Boolean).join(' — ')])
  if (spec.stationDesc) rows.push(['ROUTE', spec.stationDesc])
  if (spec.avgRating !== undefined)
    rows.push([
      'REVIEW',
      `${spec.avgRating.toFixed(1)}점${spec.reviewCount ? ` · ${spec.reviewCount}개` : ''}`,
    ])
  return rows
}

export function PamphletPlace({ place, index }: { place: PamphletViewPlace; index: number }) {
  const [failedImage, setFailedImage] = useState<string>()
  const description = place.description?.trim() ?? ''
  const spec = place.spec
  const isOnsen = place.category === 'onsen'
  const imageUrl = place.imageUrl && failedImage !== place.imageUrl ? place.imageUrl : undefined
  // 온천 자체를 설명하는 값과 방문에 필요한 값을 나눠 배치한다.
  const water = waterLine(spec)
  const visit = visitRows(spec)
  const note = spec?.note?.trim() ?? ''
  // 유형은 서버가 준 구체적인 표기를 먼저 쓴다 ('기타'보다 '관광지'가 낫다).
  const typeLabel = place.typeLabel?.trim() || categoryLabel(place.category)
  // 실제 소개가 있을 때만 문단을 만든다. 없으면 빈 줄을 채우지 않는다.
  // 온천 subText는 수온·수질이라 위 water 줄과 겹친다 — 겹치면 싣지 않는다.
  const copy = note || (water.length > 0 ? '' : description)

  return (
    <article className="pamphlet-editorial pamphlet-place">
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
      <p className="pamphlet-eyebrow pamphlet-place-index">
        PLACE {String(index + 1).padStart(2, '0')}
      </p>
      <h3>{place.name}</h3>
      {/* 장소 유형은 한 번만 — 온천은 그 아래 수온·수질이 이어진다. */}
      <p className="pamphlet-place-kind">{typeLabel}</p>
      {water.length > 0 && (
        <p className="pamphlet-place-water">
          {water.map((value) => (
            <span key={value}>{value}</span>
          ))}
        </p>
      )}
      {copy && <p className="pamphlet-place-copy">{copy}</p>}
      {visit.length > 0 && (
        <dl className="pamphlet-place-spec">
          {visit.map(([label, value]) => (
            <div key={label}>
              <dt>{label}</dt>
              <dd>{value}</dd>
            </div>
          ))}
        </dl>
      )}
      {place.address && <p className="pamphlet-place-location">{place.address}</p>}
    </article>
  )
}

export function PamphletEnd({ count }: { count: number }) {
  return (
    <div className="pamphlet-editorial pamphlet-end">
      <span className="pamphlet-eyebrow">MULMEONG</span>
      <p>
        {count === 0 ? '아직 엮어둔 장소가 없어요.' : '함께 엮어둔 곳들이\n하나의 여행이 되도록.'}
      </p>
      <span className="pamphlet-eyebrow">{count} PLACES · TRAVEL NOTES</span>
    </div>
  )
}
