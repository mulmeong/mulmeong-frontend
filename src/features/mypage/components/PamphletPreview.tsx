import { useState } from 'react'

import { DEFAULT_ONSEN_IMAGE } from '@/constants/images'

import type { PamphletDetail, PamphletPlace } from '@/types/pamphlet'

/** 지역 표기는 summary가 이미 대표 시·도를 골라 준다. 없으면 장소 주소에서 추린다. */
function regionsOf(detail: PamphletDetail): string {
  if (detail.summary?.regionName) return detail.summary.regionName
  const seen = [...new Set(detail.places.map((place) => place.address?.split(' ')[0]))]
  return seen.filter(Boolean).join(' · ')
}

function formatDate(value: string): string {
  // 서버는 OffsetDateTime을 준다. 'T' 앞까지가 날짜다.
  return value.slice(0, 10)
}

function PlacePhoto({ place }: { place: PamphletPlace }) {
  const [failed, setFailed] = useState(false)
  const isOnsen = place.placeType === 'ONSEN' || place.placeType === 'SPA'

  if (isOnsen && (!place.imageUrl || failed)) {
    return <img src={DEFAULT_ONSEN_IMAGE} alt={place.name} />
  }

  if (!place.imageUrl || failed) {
    return (
      <div className="pamphlet-photo-placeholder" role="img" aria-label={`${place.name} 사진 없음`}>
        <span>{place.placeTypeLabel ?? '장소'}</span>
        <span>등록된 사진이 없습니다</span>
      </div>
    )
  }

  return <img src={place.imageUrl} alt={place.name} onError={() => setFailed(true)} />
}

/**
 * 완성된 팜플렛의 내용. 만들기 직후 미리보기·관리 화면·공유 링크가 모두 이걸 쓴다.
 *
 * 장소 설명은 서버가 준 subText만 보여준다 — 온천은 수온·수질, 그 외는 분류다.
 * 없는 정보를 지어내지 않는다.
 */
export default function PamphletPreview({ detail }: { detail: PamphletDetail }) {
  const regions = regionsOf(detail)
  const onsenCount = detail.summary?.onsenCount ?? 0

  return (
    <div className="pamphlet-preview">
      <header className="pamphlet-preview-head">
        <p className="pamphlet-eyebrow">MULMEONG · TRAVEL NOTES</p>
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

      <ol className="pamphlet-preview-places">
        {detail.places.map((place) => (
          <li key={place.placeId} className="pamphlet-preview-place">
            <figure className="pamphlet-preview-figure">
              <PlacePhoto place={place} />
            </figure>
            <div className="pamphlet-preview-body">
              <p className="pamphlet-eyebrow">
                PLACE {String(place.seq).padStart(2, '0')}
                {place.placeTypeLabel ? ` · ${place.placeTypeLabel}` : ''}
              </p>
              <h4>{place.name}</h4>
              {place.address && <p className="pamphlet-preview-address">{place.address}</p>}
              {place.subText && <p className="pamphlet-preview-sub">{place.subText}</p>}
            </div>
          </li>
        ))}
      </ol>

      {detail.places.length === 0 && (
        <p className="pamphlet-preview-empty">아직 엮어둔 장소가 없어요.</p>
      )}
    </div>
  )
}
