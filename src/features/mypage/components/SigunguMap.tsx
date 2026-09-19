import { tipAtPointer, type MapTip } from '@/features/mypage/components/MapTooltip'
import { densityFill, MAP_STROKE, type SidoRegion } from '@/features/mypage/myMap/sidoRegions'
import { SIGUNGU_MAPS } from '@/features/mypage/myMap/sigunguPaths'

import type { GrapeRegion } from '@/types/myMap'

type SigunguMapProps = {
  sido: SidoRegion
  /** 그 시·도의 시군구별 방문 기록. 방문 0인 곳도 들어 있다. */
  regions: GrapeRegion[]
  /** 말풍선에 띄울 내용. null이면 감춘다. */
  onHover?: (tip: MapTip | null) => void
}

/**
 * 한 시·도의 시군구 지도(MY-09).
 *
 * 도형과 응답을 regionCode(행정표준코드 5자리)로 맞춘다.
 * 마스터가 시 단위까지만 들고 있는 곳은 코드 하나에 도형이 여럿 달려 있어
 * (수원시 = 장안·권선·팔달·영통구) 같은 색으로 함께 칠해진다.
 */
export default function SigunguMap({ sido, regions, onHover }: SigunguMapProps) {
  const map = SIGUNGU_MAPS[sido.code]

  if (!map) {
    return (
      <p className="text-text-secondary py-10 text-center text-[13px]">
        {sido.name} 지도를 준비하고 있어요.
      </p>
    )
  }

  const visitOf = (code: string) => regions.find((region) => region.regionCode === code)

  return (
    <svg
      viewBox={map.viewBox}
      role="group"
      aria-label={`${sido.name} 시군구 지도`}
      className="h-full w-full"
    >
      {map.paths.map((path) => {
        const visit = visitOf(path.code)
        // 이름표를 도형 위에 얹으면 작은 구에서는 삐져나온다 — 말풍선으로 띄운다.
        // 서버 이름을 먼저 쓴다 — 수원시장안구에 '수원시 5회'라고 떠야 맞다.
        // 방문 횟수가 구별이 아니라 시 단위로 집계된 값이기 때문이다.
        const tipText = `${visit?.name ?? path.name} ${visit?.visitCount ?? 0}회`

        return (
          <path
            key={path.name}
            d={path.d}
            fill={densityFill(visit?.density ?? 0)}
            stroke={MAP_STROKE}
            strokeWidth={1.5}
            strokeLinejoin="round"
            aria-label={tipText}
            onMouseMove={onHover && ((event) => onHover(tipAtPointer(event, tipText)))}
            onMouseLeave={onHover && (() => onHover(null))}
          />
        )
      })}
    </svg>
  )
}
