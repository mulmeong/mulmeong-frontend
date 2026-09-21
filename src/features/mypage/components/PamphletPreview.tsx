import { useState } from 'react'

import { TOUR_API_CREDIT } from '@/constants/credits'
import { DEFAULT_ONSEN_IMAGE } from '@/constants/images'
import { toPlaceSpec, usesTourApi } from '@/features/mypage/data/pamphletView'

import type { PamphletDetail, PamphletPlace } from '@/types/pamphlet'
import type { PamphletPlaceSpec } from '@/features/mypage/data/pamphletView'

/** 지역 표기는 summary가 이미 대표 시·도를 골라 준다. 없으면 장소 주소에서 추린다. */
function regionsOf(detail: PamphletDetail): string {
  if (detail.summary?.regionName) return detail.summary.regionName
  const seen = [
    ...new Set(detail.places.map((place) => normalizeAddress(place.address).split(' ')[0])),
  ]
  return seen.filter(Boolean).join(' · ')
}

function normalizeAddress(address?: string | null) {
  return (address ?? '').replaceAll('중남', '충남').trim()
}

function formatDate(value: string): string {
  // 서버는 OffsetDateTime을 준다. 'T' 앞까지가 날짜다.
  return value.slice(0, 10)
}

/** 유형 라벨과 같은 값이면 정보가 아니다 — 온천의 수온·수질만 남는다. */
function subTextOf(place: PamphletPlace): string | undefined {
  const value = place.subText?.trim()
  if (!value || value === place.placeTypeLabel?.trim()) return undefined
  return value
}

function isOnsen(place: PamphletPlace) {
  return place.placeType === 'ONSEN' || place.placeType === 'SPA'
}

function specOf(place: PamphletPlace): PamphletPlaceSpec | undefined {
  return isOnsen(place) ? toPlaceSpec(place) : undefined
}

function specLine(spec?: PamphletPlaceSpec): string | undefined {
  if (!spec) return undefined
  const values = [
    spec.tempC !== undefined ? `${spec.tempC.toFixed(1)}℃` : '',
    spec.waterType,
    spec.facilityType,
    spec.hasOutdoor ? '노천 있음' : '',
    spec.hasLodging ? '숙박 가능' : '',
  ].filter(Boolean)
  return values.length ? values.join(' · ') : undefined
}

function visitLine(spec?: PamphletPlaceSpec): string | undefined {
  if (!spec) return undefined
  const values = [
    spec.hours,
    spec.closed ? `휴무 ${spec.closed}` : '',
    spec.accessLabel && [spec.accessLabel, spec.stationName].filter(Boolean).join(' — '),
    spec.price !== undefined ? `${spec.price.toLocaleString()}원부터` : '',
    spec.avgRating !== undefined
      ? `${spec.avgRating.toFixed(1)}점${spec.reviewCount ? ` (${spec.reviewCount})` : ''}`
      : '',
  ].filter(Boolean)
  return values.length ? values.join(' · ') : undefined
}

function PlacePhoto({ place }: { place: PamphletPlace }) {
  const [failed, setFailed] = useState(false)
  const isOnsen = place.placeType === 'ONSEN' || place.placeType === 'SPA'
  const imageUrl = place.imageUrl ?? place.thumbnail ?? place.images?.find(Boolean)

  if (isOnsen && (!imageUrl || failed)) {
    return <img src={DEFAULT_ONSEN_IMAGE} alt={place.name} />
  }

  if (!imageUrl || failed) {
    return (
      <div className="pamphlet-photo-placeholder" role="img" aria-label={`${place.name} 사진 없음`}>
        <span>{place.placeTypeLabel ?? '장소'}</span>
        <span>등록된 사진이 없습니다</span>
      </div>
    )
  }

  return <img src={imageUrl} alt={place.name} onError={() => setFailed(true)} />
}

/**
 * 완성된 팜플렛의 내용. 만들기 직후 미리보기·관리 화면·공유 링크가 모두 이걸 쓴다.
 *
 * 장소 설명은 서버가 준 subText만 보여준다 — 온천은 수온·수질, 그 외는 분류다.
 * 없는 정보를 지어내지 않는다.
 */
export default function PamphletPreview({
  detail,
  specs = {},
}: {
  detail: PamphletDetail
  specs?: Record<number, PamphletPlaceSpec>
}) {
  const regions = regionsOf(detail)
  const onsenCount = detail.summary?.onsenCount ?? 0

  return (
    <div className="pamphlet-preview">
      <header className="pamphlet-preview-head">
        <p className="pamphlet-eyebrow">물멍 여행 팜플렛</p>
        <h3 className="pamphlet-preview-title">{detail.title}</h3>

        <dl className="pamphlet-preview-meta">
          <div>
            <dt>장소</dt>
            <dd>{detail.places.length}곳</dd>
          </div>
          {onsenCount > 0 && (
            <div>
              <dt>온천</dt>
              <dd>{onsenCount}곳</dd>
            </div>
          )}
          {regions && (
            <div>
              <dt>지역</dt>
              <dd>{regions}</dd>
            </div>
          )}
          {detail.travelDate && (
            <div>
              <dt>여행일</dt>
              <dd>{detail.travelDate}</dd>
            </div>
          )}
          {detail.partySize != null && (
            <div>
              <dt>인원</dt>
              <dd>{detail.partySize}명</dd>
            </div>
          )}
        </dl>

        <p className="pamphlet-preview-byline">
          {detail.author ? `${detail.author.nickname} · ` : ''}
          {formatDate(detail.createdAt)}
        </p>
      </header>

      {detail.places.length > 0 && <p className="pamphlet-preview-section">함께 갈 곳</p>}
      <ol className="pamphlet-preview-places">
        {detail.places.map((place) => {
          const spec = specs[place.placeId] ?? specOf(place)
          const line = specLine(spec) ?? subTextOf(place)
          const visit = visitLine(spec)
          return (
            <li key={place.placeId} className="pamphlet-preview-place">
              <figure className="pamphlet-preview-figure">
                <PlacePhoto place={place} />
              </figure>
              <div className="pamphlet-preview-body">
                <p className="pamphlet-eyebrow">
                  {String(place.seq).padStart(2, '0')}
                  {place.placeTypeLabel ? ` · ${place.placeTypeLabel}` : ''}
                </p>
                <h4>{place.name}</h4>
                {/*
                온천이 아니면 서버가 subText에 유형 라벨을 그대로 넣는다.
                위 줄에 이미 유형이 있어서 같은 값이면 '식당 · 식당'이 된다.
              */}
                {line && <p className="pamphlet-preview-sub">{line}</p>}
                {spec?.note && <p className="pamphlet-preview-note">{spec.note}</p>}
                {visit && <p className="pamphlet-preview-facts">{visit}</p>}
                {place.address && (
                  <p className="pamphlet-preview-address">{normalizeAddress(place.address)}</p>
                )}
              </div>
            </li>
          )
        })}
      </ol>

      {detail.places.length === 0 && (
        <p className="pamphlet-preview-empty">아직 엮어둔 장소가 없어요.</p>
      )}

      {/* 한국관광공사 장소가 섞여 있을 때만, 팜플렛 단위로 한 번. */}
      {usesTourApi(detail.places.map((place) => ({ source: place.source ?? undefined }))) && (
        <p className="pamphlet-preview-credit">장소 정보 · {TOUR_API_CREDIT}</p>
      )}
    </div>
  )
}
