import { useState } from 'react'

import type {
  PamphletPlaceSpec,
  PamphletView,
  PamphletViewPlace,
} from '@/features/mypage/data/pamphletView'
import { categoryLabel, type SavedCategory } from '@/types/saved'

// 장소의 특성·동선에 관한 사실을 만들지 않고, 저장된 카테고리만 설명한다.
const PLACE_CONTEXT: Record<SavedCategory, string> = {
  onsen: '이번 여행의 온천·사우나 시간으로 엮어둔 곳입니다.',
  restaurant: '이번 여행에서 식사 장소로 엮어둔 곳입니다.',
  cafe: '여행 중 쉬어갈 카페로 엮어둔 곳입니다.',
  attraction: '이번 여행에서 둘러볼 장소로 엮어둔 곳입니다.',
  etc: '이번 여행에 함께 엮어둔 곳입니다.',
}

export function PamphletIntro({ pamphlet }: { pamphlet: PamphletView }) {
  const regions = [...new Set(pamphlet.places.map((place) => place.address))]

  return (
    <div className="pamphlet-editorial pamphlet-intro">
      <p className="pamphlet-eyebrow">MULMEONG · TRAVEL NOTES</p>
      <div className="pamphlet-intro-heading">
        <span className="pamphlet-edition">{pamphlet.number}</span>
        <h2>{pamphlet.title}</h2>
        <p className="pamphlet-intro-copy">
          엮어둔 {pamphlet.places.length}곳을 한 장에 담은 여행 기록.
        </p>
        {regions.length > 0 && <p className="pamphlet-intro-regions">{regions.join(' · ')}</p>}
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
      </footer>
    </div>
  )
}

/** 수온·수질·pH — 온천의 성질. 값이 있는 것만 가운뎃점으로 잇는다. */
function waterLine(spec?: PamphletPlaceSpec): string[] {
  if (!spec) return []
  const values: string[] = []
  if (spec.tempC !== undefined) values.push(`${spec.tempC.toFixed(1)}°C`)
  if (spec.waterType) values.push(spec.waterType)
  if (spec.ph !== undefined) values.push(`pH ${spec.ph}`)
  return values
}

/** 방문에 참고하는 값. 서버가 아직 안 채우는 항목이 많아 있는 것만 싣는다. */
function visitRows(spec?: PamphletPlaceSpec): [string, string][] {
  if (!spec) return []
  const rows: [string, string][] = []
  if (spec.hours) rows.push(['HOURS', spec.hours])
  if (spec.price !== undefined) rows.push(['PRICE', `${spec.price.toLocaleString()}원~`])
  if (spec.closed) rows.push(['CLOSED', spec.closed])
  if (spec.parking) rows.push(['PARKING', spec.parking])
  if (spec.accessLabel) rows.push(['ACCESS', spec.accessLabel])
  if (spec.facilityType) rows.push(['TYPE', spec.facilityType])
  return rows
}

export function PamphletPlace({ place, index }: { place: PamphletViewPlace; index: number }) {
  const [failedImage, setFailedImage] = useState<string>()
  const description = place.description?.trim() ?? ''
  const spec = place.spec
  // 온천 자체를 설명하는 값과 방문에 필요한 값을 나눠 배치한다.
  const water = waterLine(spec)
  const visit = visitRows(spec)
  const note = spec?.note?.trim() ?? ''

  return (
    <article className="pamphlet-editorial pamphlet-place">
      <figure className="pamphlet-place-figure">
        {place.imageUrl && failedImage !== place.imageUrl ? (
          <img
            src={place.imageUrl}
            alt={place.name}
            onError={() => setFailedImage(place.imageUrl)}
          />
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
      {water.length > 0 && (
        <p className="pamphlet-place-water">
          {water.map((value) => (
            <span key={value}>{value}</span>
          ))}
        </p>
      )}
      <p className="pamphlet-place-copy">{note || description || PLACE_CONTEXT[place.category]}</p>
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
      <p className="pamphlet-place-location">
        {place.address} · {categoryLabel(place.category)}
      </p>
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
