import { tipAtPointer, type MapTip } from '@/features/mypage/components/MapTooltip'
import { densityFill, MAP_STROKE, type SidoRegion } from '@/features/mypage/myMap/sidoRegions'
import { SIGUNGU_MAPS, type SigunguPath } from '@/features/mypage/myMap/sigunguPaths'

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
/** 같은 조합을 여러 번 알리지 않는다. 지도를 오갈 때마다 콘솔이 도배된다. */
const warned = new Set<string>()

/**
 * 서버가 준 코드 중 그릴 도형이 없는 것을 개발 모드에서만 알린다.
 *
 * 없는 코드는 그냥 안 칠해질 뿐 에러가 나지 않아, 눈으로는 '방문 0회'와 구분되지
 * 않는다. 행정구역이 개편되면(인천 중구·동구·서구처럼) 조용히 어긋나므로
 * 그때 바로 눈에 띄게 둔다.
 */
function warnMissingShapes(sido: SidoRegion, paths: SigunguPath[], regions: GrapeRegion[]) {
  if (!import.meta.env.DEV) return

  const drawn = new Set(paths.map((path) => path.code))
  const missing = regions.filter((region) => !drawn.has(region.regionCode))
  if (missing.length === 0) return

  const key = `${sido.code}:${missing.map((region) => region.regionCode).join(',')}`
  if (warned.has(key)) return
  warned.add(key)

  console.warn(
    `[SigunguMap] ${sido.name}: 도형이 없는 시군구 코드 ${missing.length}개 —`,
    missing.map((region) => `${region.regionCode} ${region.name}`).join(', '),
  )
}

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

  warnMissingShapes(sido, map.paths, regions)

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
