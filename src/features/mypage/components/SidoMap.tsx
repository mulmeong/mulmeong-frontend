import {
  densityFill,
  MAP_STROKE,
  MAP_VIEW_BOX,
  SIDO_REGIONS,
  sidoPath,
  type SidoRegion,
} from '@/features/mypage/myMap/sidoRegions'
import { cn } from '@/lib/cn'

import type { GrapeRegion } from '@/types/myMap'

type SidoMapProps = {
  /** 서버가 내려준 시·도별 방문 기록. 방문 0인 곳도 들어 있다. */
  regions: GrapeRegion[]
  /** 고른 시·도 코드. null이면 아무 곳도 안 골랐다. */
  selectedCode?: string | null
  /** 넘기지 않으면 고를 수 없는 지도가 된다 — 왼쪽 아래로 줄어든 지도가 그 경우다. */
  onSelect?: (region: SidoRegion) => void
}

export default function SidoMap({ regions, selectedCode = null, onSelect }: SidoMapProps) {
  // 시·도 코드는 응답의 regionCode 2자리와 그대로 맞는다.
  const visitOf = (code: string) => regions.find((region) => region.regionCode === code)

  return (
    <svg
      viewBox={MAP_VIEW_BOX}
      role="group"
      aria-label="시·도별 방문 기록 지도"
      className="h-full w-full"
    >
      {SIDO_REGIONS.map((region) => {
        const visit = visitOf(region.code)
        const count = visit?.visitCount ?? 0
        const selected = region.code === selectedCode

        return (
          <path
            key={region.code}
            d={sidoPath(region)}
            fill={densityFill(visit?.density ?? 0)}
            stroke={MAP_STROKE}
            // 고른 지역만 테두리를 굵게 해 색과 별개로 구분되게 한다.
            strokeWidth={selected ? 2 : 1}
            strokeLinejoin="round"
            // path는 기본으로 포커스를 못 받는다. 키보드로도 고를 수 있게 한다.
            tabIndex={onSelect ? 0 : undefined}
            role={onSelect ? 'button' : undefined}
            aria-pressed={onSelect ? selected : undefined}
            aria-label={onSelect ? `${region.name}, ${count}회 방문` : undefined}
            onClick={onSelect && (() => onSelect(region))}
            onKeyDown={
              onSelect &&
              ((event) => {
                if (event.key === 'Enter' || event.key === ' ') {
                  event.preventDefault()
                  onSelect(region)
                }
              })
            }
            className={cn(
              'outline-none',
              Boolean(onSelect) &&
                'cursor-pointer transition-[stroke-width,opacity] duration-150 hover:opacity-80 focus-visible:opacity-80 motion-reduce:transition-none',
            )}
          >
            {/* 호버하면 방문 횟수가 뜬다(MY-02). */}
            <title>{`${region.name} ${count}회`}</title>
          </path>
        )
      })}
    </svg>
  )
}
