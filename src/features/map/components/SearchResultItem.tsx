import { cn } from '@/lib/cn'

import type { OnsenListItem } from '@/features/map/api/map'

type SearchResultItemProps = {
  onsen: OnsenListItem
  selected?: boolean
  onClick?: () => void
}

function formatDistance(km: number) {
  return km < 1 ? `${Math.round(km * 1000)}m` : `${km.toFixed(1)}km`
}

/**
 * 시안 'Search Result Item'(1:834, 330×63). 심볼 내부가 비어 있어
 * 썸네일·3행 구성은 검색 화면 시안을 보고 맞췄다.
 */
export default function SearchResultItem({ onsen, selected, onClick }: SearchResultItemProps) {
  const { name, address, imageUrl, waterQuality, waterTempC, tags, distanceKm } = onsen

  // 스펙 한 줄 — 온천이면 수질·수온, 없으면 태그로 대체한다.
  const spec = [waterQuality, waterTempC !== undefined ? `${waterTempC}℃` : undefined]
    .filter(Boolean)
    .join(' · ')
  const specLine = spec || tags.join(' · ')

  return (
    <button
      type="button"
      onClick={onClick}
      aria-current={selected || undefined}
      className={cn(
        'flex w-full items-center gap-3 py-2 text-left',
        'outline-none focus-visible:underline focus-visible:underline-offset-2',
      )}
    >
      {imageUrl ? (
        <img src={imageUrl} alt="" className="size-[47px] shrink-0 rounded-sm object-cover" />
      ) : (
        <div className="bg-surface-dim size-[47px] shrink-0 rounded-sm" />
      )}

      <span className="min-w-0 flex-1">
        <span
          className={cn(
            'text-text-primary block truncate text-[15px]',
            selected ? 'font-bold' : 'font-semibold',
          )}
        >
          {name}
        </span>
        <span className="text-text-secondary mt-[2px] block truncate text-[12px]">
          온천 · {address}
        </span>
        {specLine && (
          <span className="text-text-primary mt-[2px] block truncate text-[13px]">{specLine}</span>
        )}
      </span>

      {distanceKm !== undefined && (
        <span className="text-text-secondary shrink-0 self-end pb-1 text-[13px]">
          {formatDistance(distanceKm)}
        </span>
      )}
    </button>
  )
}
