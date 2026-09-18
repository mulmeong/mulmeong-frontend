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
 * 검색 결과 한 줄. 행 사이를 divider 대신 여백과 hover 배경으로 구분한다
 * (시안에는 구분선이 있지만 팀 논의로 밀도·가독성을 우선했다).
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
        '-mx-2 flex w-[calc(100%+1rem)] items-center gap-3 rounded-sm px-2 py-2.5 text-left',
        'transition-colors outline-none focus-visible:underline focus-visible:underline-offset-2',
        selected ? 'bg-surface-dim' : 'hover:bg-surface-dim',
      )}
    >
      {imageUrl ? (
        <img src={imageUrl} alt="" className="size-11 shrink-0 rounded-[2px] object-cover" />
      ) : (
        <div className="bg-surface-dim size-11 shrink-0 rounded-[2px]" />
      )}

      <span className="min-w-0 flex-1">
        <span
          className={cn(
            'text-text-primary block truncate text-[14px]',
            selected ? 'font-semibold' : 'font-medium',
          )}
        >
          {name}
        </span>
        {specLine && (
          <span className="text-text-secondary mt-[3px] block truncate text-[12px]">
            {specLine}
          </span>
        )}
        <span className="text-text-secondary mt-[2px] block truncate text-[11px]">{address}</span>
      </span>

      {distanceKm !== undefined && (
        <span className="text-text-secondary shrink-0 text-[12px]">
          {formatDistance(distanceKm)}
        </span>
      )}
    </button>
  )
}
