import { Link, useNavigate } from 'react-router-dom'

import { DEFAULT_ONSEN_IMAGE } from '@/constants/images'
import FavoriteButton from '@/features/favorites/FavoriteButton'

import type { MagazineDetail, MagazinePlace } from '@/types/magazine'

/**
 * 상세 오른쪽 레일 — 이 글의 온천과 다음 글.
 *
 * OnsenCard(공용)를 쓰지 않은 이유는 그쪽이 평점·리뷰 수까지 있는 Onsen 전체를
 * 요구하는데, 매거진이 주는 MagazinePlace에는 그 값이 없어서다. 없는 값을
 * 지어내는 대신 여기에 필요한 만큼만 그린다.
 */
export default function MagazineAside({ magazine }: { magazine: MagazineDetail }) {
  const place = magazine.relatedPlaces[0]
  const next = magazine.next

  if (!place && !next) return null

  return (
    <aside className="hidden w-[200px] shrink-0 xl:block">
      <div className="sticky top-24 flex flex-col gap-5 pt-14">
        {place && <RelatedPlace place={place} />}
        {next && (
          <div className="px-1">
            <p className="text-text-secondary text-[10px] font-bold tracking-[0.2em]">다음 글</p>
            <Link
              to={`/magazine/${next.magazineId}`}
              className="mt-2 block text-[14px] leading-[1.5] font-bold hover:underline hover:underline-offset-4"
            >
              {next.title}
            </Link>
            <p className="text-text-secondary mt-1 text-[11px]">
              {next.categoryLabel} · {next.readMinutes}분
            </p>
          </div>
        )}
      </div>
    </aside>
  )
}

function RelatedPlace({ place }: { place: MagazinePlace }) {
  const navigate = useNavigate()
  const region = [place.sido, place.sigungu].filter(Boolean).join(' ')
  const meta = [region, place.subText].filter(Boolean).join(' · ')

  return (
    <div className="border-border-default rounded-md border p-3.5">
      <p className="text-text-secondary text-[9px] font-bold tracking-[0.2em]">이 글의 온천</p>

      <img
        src={place.thumbnail || DEFAULT_ONSEN_IMAGE}
        alt=""
        onError={(event) => {
          event.currentTarget.onerror = null
          event.currentTarget.src = DEFAULT_ONSEN_IMAGE
        }}
        className="bg-surface-dim mt-2.5 h-20 w-full rounded-sm object-cover"
      />

      <p className="mt-3 text-[15px] font-bold">{place.name}</p>
      {meta && <p className="text-text-secondary mt-0.5 text-[11px]">{meta}</p>}
      {place.accessSummary && (
        <p className="text-text-secondary mt-1.5 text-[11px] leading-[1.6]">
          {place.accessSummary}
        </p>
      )}

      <div className="mt-3 flex gap-2">
        <button
          type="button"
          onClick={() => void navigate(`/map?onsen=${place.placeId}`)}
          className="bg-inverse text-text-inverse flex-1 rounded-sm py-2.5 text-[11px] font-bold"
        >
          지도에서 보기
        </button>
        <FavoriteButton
          target={{ placeId: place.placeId }}
          name={place.name}
          className="border-border-default size-9 shrink-0 rounded-sm border [&>svg]:size-4"
        />
      </div>
    </div>
  )
}
