import { cn } from '@/lib/cn'
import { POI_CATEGORIES, POI_CATEGORY_LABELS } from '@/types/poi'

import type { PoiCategory } from '@/types/poi'

type PoiFilterProps = {
  selected: PoiCategory[]
  onToggle: (category: PoiCategory) => void
}

/** MAP-04 카테고리 토글. 지도 위에 떠 있어 타일을 가리지 않게 한 줄로 둔다. */
export default function PoiFilter({ selected, onToggle }: PoiFilterProps) {
  return (
    <div className="scrollbar-thin pointer-events-auto flex gap-1.5 overflow-x-auto px-3 py-2">
      {POI_CATEGORIES.map((category) => {
        const on = selected.includes(category)
        return (
          <button
            key={category}
            type="button"
            aria-pressed={on}
            onClick={() => onToggle(category)}
            className={cn(
              'shrink-0 rounded-full border px-3 py-1.5 text-[12px] whitespace-nowrap transition-colors outline-none',
              on
                ? 'bg-inverse text-text-inverse border-transparent font-medium'
                : 'bg-surface text-text-primary border-border-default hover:bg-surface-dim',
            )}
          >
            {POI_CATEGORY_LABELS[category]}
          </button>
        )
      })}
    </div>
  )
}
