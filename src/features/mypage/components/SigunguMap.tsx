import { densityFill, MAP_STROKE, type SidoRegion } from '@/features/mypage/myMap/sidoRegions'
import { SIGUNGU_MAPS } from '@/features/mypage/myMap/sigunguPaths'

import type { GrapeRegion } from '@/types/myMap'

type SigunguMapProps = {
  sido: SidoRegion
  /** 그 시·도의 시군구별 방문 기록. 방문 0인 곳도 들어 있다. */
  regions: GrapeRegion[]
}

/**
 * 한 시·도의 시군구 지도(MY-09).
 *
 * 도형과 응답을 이름으로 맞춘다. 명세대로라면 regionCode(행정표준코드 5자리)로
 * 맞춰야 하지만, 구워 둔 도형이 아직 이름만 들고 있다.
 * TODO: 이름-코드 대응표를 붙이고 regionCode 기준으로 바꿀 것. 명세에도
 * '프론트·백 합의 필요'로 올라와 있는 항목이다.
 */
export default function SigunguMap({ sido, regions }: SigunguMapProps) {
  const map = SIGUNGU_MAPS[sido.code]

  if (!map) {
    return (
      <p className="text-text-secondary py-10 text-center text-[13px]">
        {sido.name} 지도를 준비하고 있어요.
      </p>
    )
  }

  const visitOf = (name: string) => regions.find((region) => region.name === name)

  return (
    <svg
      viewBox={map.viewBox}
      role="group"
      aria-label={`${sido.name} 시군구 지도`}
      className="h-full w-full"
    >
      {map.paths.map((path) => {
        const visit = visitOf(path.name)

        return (
          <path
            key={path.name}
            d={path.d}
            fill={densityFill(visit?.density ?? 0)}
            stroke={MAP_STROKE}
            strokeWidth={1.5}
            strokeLinejoin="round"
          >
            {/* 이름표를 도형 위에 얹으면 작은 구에서는 삐져나온다 — 툴팁으로 둔다. */}
            <title>{`${path.name} ${visit?.visitCount ?? 0}회`}</title>
          </path>
        )
      })}
    </svg>
  )
}
