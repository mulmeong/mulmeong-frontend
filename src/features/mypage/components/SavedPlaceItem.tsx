import Badge from '@/components/ui/Badge'
import Checkbox from '@/components/ui/Checkbox'
import { DEFAULT_ONSEN_IMAGE } from '@/constants/images'

import { categoryLabel, type SavedPlace } from '@/types/saved'

type SavedPlaceItemProps = {
  place: SavedPlace
  checked: boolean
  onToggle: (place: SavedPlace) => void
  onShowOnMap: (place: SavedPlace) => void
  onDelete: (place: SavedPlace) => void
}

export default function SavedPlaceItem({
  place,
  checked,
  onToggle,
  onShowOnMap,
  onDelete,
}: SavedPlaceItemProps) {
  const { name, address, category, rating, reviewCount, imageUrl } = place
  const fallbackImage = category === 'onsen' ? DEFAULT_ONSEN_IMAGE : undefined

  return (
    <article className="flex items-center gap-4 py-4">
      {/* 체크박스에 이름을 붙여 스크린 리더가 '덕구온천 선택'으로 읽게 한다. */}
      <Checkbox
        checked={checked}
        onChange={() => onToggle(place)}
        aria-label={`${name} 선택`}
        className="cursor-pointer"
      />

      {imageUrl || fallbackImage ? (
        <img
          src={imageUrl || fallbackImage}
          alt=""
          onError={(event) => {
            if (!fallbackImage) return
            event.currentTarget.onerror = null
            event.currentTarget.src = fallbackImage
          }}
          className="size-12 shrink-0 rounded-sm object-cover"
        />
      ) : (
        <div aria-hidden="true" className="bg-surface-dim size-12 shrink-0 rounded-sm" />
      )}

      <div className="flex min-w-0 flex-1 flex-col gap-1">
        <div className="flex items-center gap-2">
          {/* 이름도 '지도에서 보기'와 같은 곳으로 간다 — 제목 전체를 눌러도 되게. */}
          <h3 className="min-w-0 text-[15px] font-bold">
            <button
              type="button"
              onClick={() => onShowOnMap(place)}
              className="block max-w-full truncate hover:underline"
            >
              {name}
            </button>
          </h3>
          <Badge type="category" className="shrink-0">
            {categoryLabel(category)}
          </Badge>
        </div>

        <p className="text-text-secondary text-[12px]">
          {address}
          {rating !== undefined && (
            <>
              {' · '}
              {/* 별 기호는 장식이다 — 점수는 바로 뒤 숫자가 말한다. */}
              <span aria-hidden="true">★ </span>
              {rating.toFixed(1)} ({reviewCount})
            </>
          )}
        </p>
        {place.subText && <p className="text-text-secondary text-[12px]">{place.subText}</p>}
      </div>

      <div className="text-text-secondary flex shrink-0 items-center gap-2 text-[12px]">
        <button
          type="button"
          onClick={() => onShowOnMap(place)}
          className="hover:text-text-primary"
        >
          지도에서 보기
        </button>
        <span aria-hidden="true">·</span>
        <button type="button" onClick={() => onDelete(place)} className="hover:text-text-primary">
          삭제
        </button>
      </div>
    </article>
  )
}
