import { cn } from '@/lib/cn'
import { POI_FILTERS } from '@/types/poi'

import type { PoiFilterId } from '@/types/poi'

type PoiFilterProps = {
  selected?: PoiFilterId
  onToggle: (filter: PoiFilterId) => void
  /** 전국 뷰처럼 검색 기준점이 바다 한가운데일 때 — 눌러도 결과가 거의 없다. */
  disabled?: boolean
}

/** MAP-04 카테고리 토글. 지도 위에 떠 있어 타일을 가리지 않게 한 줄로 둔다. */
export default function PoiFilter({ selected, onToggle, disabled = false }: PoiFilterProps) {
  return (
    <div className="scrollbar-thin pointer-events-auto flex items-center gap-1 overflow-x-auto">
      {POI_FILTERS.map((filter) => {
        const on = selected === filter.id
        return (
          <button
            key={filter.id}
            type="button"
            aria-pressed={on}
            disabled={disabled}
            title={disabled ? '지역이나 온천을 먼저 고르면 주변 장소를 볼 수 있어요.' : undefined}
            onClick={() => onToggle(filter.id)}
            className={cn(
              'inline-flex h-8 shrink-0 items-center justify-center rounded-full border px-3 text-[12px] leading-4 whitespace-nowrap transition-colors outline-none',
              on
                ? 'bg-inverse text-text-inverse border-transparent font-medium'
                : 'bg-surface text-text-primary border-border-default hover:not-disabled:bg-surface-dim',
              disabled && 'opacity-45',
            )}
          >
            {filter.label}
          </button>
        )
      })}
    </div>
  )
}
