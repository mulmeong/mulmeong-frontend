import {
  visitFill,
  MAP_STROKE,
  MAP_VIEW_BOX,
  SIDO_REGIONS,
  sidoPath,
  type SidoRegion,
} from '@/features/mypage/myMap/sidoRegions'
import { tipAtPointer, tipAtShape, type MapTip } from '@/features/mypage/components/MapTooltip'
import { cn } from '@/lib/cn'

import type { GrapeRegion } from '@/types/myMap'

type SidoMapProps = {
  /** 서버가 내려준 시·도별 방문 기록. 방문 0인 곳도 들어 있다. */
  regions: GrapeRegion[]
  /** 고른 시·도 코드. null이면 아무 곳도 안 골랐다. */
  selectedCode?: string | null
  /** 넘기지 않으면 고를 수 없는 지도가 된다 — 왼쪽 아래로 줄어든 지도가 그 경우다. */
  onSelect?: (region: SidoRegion) => void
  /** 말풍선에 띄울 내용. null이면 감춘다. onSelect가 없으면 부르지 않는다. */
  onHover?: (tip: MapTip | null) => void
}

/** 같은 조합을 여러 번 알리지 않는다. 지도를 오갈 때마다 콘솔이 도배된다. */
const warned = new Set<string>()

/**
 * 서버가 준 코드 중 우리 지도에 없는 것을 개발 모드에서만 알린다.
 *
 * 없는 코드는 그냥 안 칠해질 뿐 에러가 나지 않아, 눈으로는 '방문 0회'와 구분되지
 * 않는다. 코드 체계가 어긋나면(SGIS 대 행정표준, 강원 42/51처럼) 방문 기록이
 * 조용히 사라지므로 그때 바로 눈에 띄게 둔다.
 */
function warnUnknownCodes(regions: GrapeRegion[]) {
  if (!import.meta.env.DEV) return

  const known = new Set(SIDO_REGIONS.map((region) => region.code))
  const unknown = regions.filter((region) => !known.has(region.regionCode))
  if (unknown.length === 0) return

  const key = unknown.map((region) => region.regionCode).join(',')
  if (warned.has(key)) return
  warned.add(key)

  console.warn(
    `[SidoMap] 지도에 없는 시·도 코드 ${unknown.length}개 —`,
    unknown.map((region) => `${region.regionCode} ${region.name}`).join(', '),
  )
}

export default function SidoMap({ regions, selectedCode = null, onSelect, onHover }: SidoMapProps) {
  // 시·도 코드는 응답의 regionCode 2자리와 그대로 맞는다.
  const visitOf = (code: string) => regions.find((region) => region.regionCode === code)

  warnUnknownCodes(regions)

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
        const tipText = `${region.name} ${count}회`

        return (
          <path
            key={region.code}
            d={sidoPath(region)}
            fill={visitFill(count)}
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
            onMouseMove={onHover && ((event) => onHover(tipAtPointer(event, tipText)))}
            onMouseLeave={onHover && (() => onHover(null))}
            onFocus={onHover && ((event) => onHover(tipAtShape(event, tipText)))}
            onBlur={onHover && (() => onHover(null))}
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
          />
        )
      })}
    </svg>
  )
}
