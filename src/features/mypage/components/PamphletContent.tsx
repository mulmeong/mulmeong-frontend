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
  return (
    <div className="pamphlet-editorial pamphlet-intro">
      <p className="pamphlet-eyebrow">MULMEONG · TRAVEL NOTES</p>
      <div className="pamphlet-intro-heading">
        <span className="pamphlet-edition">{pamphlet.number}</span>
        <h2>{pamphlet.title}</h2>
        <p className="pamphlet-intro-copy">담아둔 장소를 천천히 펼쳐 보는 여행 기록.</p>
      </div>
      <ol className="pamphlet-itinerary" aria-label="담긴 장소 목록">
        {pamphlet.places.map((place, index) => (
          <li key={place.id}>
            <span aria-hidden="true">{String(index + 1).padStart(2, '0')}</span>
            <span>{place.name}</span>
          </li>
        ))}
      </ol>
      <footer className="pamphlet-colophon">
        <span>{pamphlet.places.length} Places</span>
        <span>Made on {pamphlet.createdAt}</span>
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
  return values
}

function featureLine(spec?: PamphletPlaceSpec, description?: string) {
  const note = spec?.note?.trim()
  return [spec?.facilityType, note || description].filter(Boolean).join(' · ')
}

function travelLine(spec?: PamphletPlaceSpec) {
  if (!spec) return ''
  if (spec.stationName) return `${spec.stationName}에서 이동하기 좋은 곳`
  return spec.accessLabel ?? ''
}

function reviewLine(spec?: PamphletPlaceSpec) {
  if (spec?.avgRating === undefined) return ''
  return `★ ${spec.avgRating.toFixed(1)}${spec.reviewCount ? ` · 리뷰 ${spec.reviewCount}` : ''}`
}

export function PamphletPlace({ place, index }: { place: PamphletViewPlace; index: number }) {
  const [failedImage, setFailedImage] = useState<string>()
  const description = place.description?.trim() ?? ''
  const spec = place.spec
  const isOnsen = place.category === 'onsen'
  const imageUrl = place.imageUrl && failedImage !== place.imageUrl ? place.imageUrl : undefined
  const water = waterMeta(spec)
  const typeLabel = place.typeLabel?.trim() || categoryLabel(place.category)
  const placeMeta = [place.address ? regionLabel(place.address) : '', typeLabel].filter(Boolean)
  const feature = featureLine(spec, water.length > 0 ? undefined : description)
  const travel = travelLine(spec)
  const review = reviewLine(spec)

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
      <div className="pamphlet-place-body">
        <p className="pamphlet-eyebrow pamphlet-place-index">
          PLACE {String(index + 1).padStart(2, '0')}
        </p>
        <h3>{place.name}</h3>
        {placeMeta.length > 0 && <p className="pamphlet-place-kind">{placeMeta.join(' · ')}</p>}
        <div className="pamphlet-place-notes">
          {water.length > 0 && (
            <p className="pamphlet-place-water">
              {water.map((value) => (
                <span key={value}>{value}</span>
              ))}
            </p>
          )}
          {feature && <p className="pamphlet-place-copy">{feature}</p>}
        </div>
        {(travel || review) && (
          <p className="pamphlet-place-meta">
            {[travel, review].filter(Boolean).map((value) => (
              <span key={value}>{value}</span>
            ))}
          </p>
        )}
      </div>
    </article>
  )
}

export function PamphletEnd({ count }: { count: number }) {
  return (
    <div className="pamphlet-editorial pamphlet-end">
      <span className="pamphlet-eyebrow">MULMEONG</span>
      <p>
        {count === 0 ? '아직 담긴 장소가 없어요.' : '함께 담아둔 곳들을\n하나의 여행 기록으로.'}
      </p>
      <span className="pamphlet-eyebrow">{count} PLACES · TRAVEL NOTES</span>
    </div>
  )
}
