import { useEffect, useRef } from 'react'

import { KOREA_PATHS } from '@/features/dart/koreaMap/paths'
import {
  isInBounds,
  JEJU_BOX_CENTER,
  JEJU_INSET,
  projectToView,
  VIEW_HEIGHT,
  VIEW_WIDTH,
  VIEW_X,
  VIEW_Y,
  type Point,
} from '@/features/dart/koreaMap/projection'
import { cn } from '@/lib/cn'

type Coord = { lng: number; lat: number }

type KoreaMapProps = {
  /** 찍을 위치. 없거나 지도 범위 밖이면 마커가 숨는다. */
  marker?: Coord | null
  /** 스크린 리더에 읽힐 장소 이름. 예: '덕구온천' */
  markerLabel?: string
  className?: string
}

/**
 * KOREA_PATHS[0]이 제주도(원본 y 347.5~367.9).
 * 본토와 26.7px 떨어져 있어 같이 그리면 본토가 위로 치우쳐 보인다.
 * 그래서 이것만 빼내 인셋 박스에 따로 그린다.
 */
const JEJU_INDEX = 0

/**
 * 시안 기준 폭 400px일 때 마커 지름이 22px.
 * viewBox 폭이 300이라 1.333배 확대되므로 r은 8.25다 (22 ÷ 1.333 ÷ 2).
 * 중앙 흰 점은 지름 8px -> r 3.
 *
 * 지도를 크게 그리면 마커도 같은 비율로 커진다. 지도 대비 비율은 그대로다.
 */
const MARKER_RADIUS = 8.25
const MARKER_INNER_RADIUS = 3

const LAND_FILL = '#E6E9E8'
const LAND_STROKE = '#FFFFFF'
const INSET_STROKE = '#D8DCDB'

const CENTER: Point = { x: VIEW_X + VIEW_WIDTH / 2, y: VIEW_Y + VIEW_HEIGHT / 2 }

/**
 * 원본 제주 도형을 인셋 자리로 옮기는 변환.
 * projection.ts의 toJejuInset()과 같은 계산이라 도형과 마커가 항상 같이 움직인다.
 */
const JEJU_TRANSFORM = [
  `translate(${JEJU_BOX_CENTER.x} ${JEJU_BOX_CENTER.y})`,
  `scale(${JEJU_INSET.scale})`,
  `translate(${-JEJU_INSET.sourceCenter.x} ${-JEJU_INSET.sourceCenter.y})`,
].join(' ')

/**
 * 연출용 정적 지도. 확대·이동·검색이 없고 모양이 고정이라
 * 지도 SDK 없이 SVG를 그대로 그린다.
 *
 * 마커는 marker가 없어도 항상 렌더하고 opacity로만 숨긴다.
 * 조건부 렌더링하면 DOM이 새로 만들어져 transform 전환이 끊긴다.
 */
export default function KoreaMap({ marker, markerLabel, className }: KoreaMapProps) {
  const visible = marker != null && isInBounds(marker.lng, marker.lat)

  /**
   * 마커 위치는 style prop이 아니라 DOM에 직접 쓴다.
   *
   * 숨을 때 좌표를 잃으면 사라지는 0.3초 사이에 마커가 기본 위치로 미끄러진다.
   * 그렇다고 마지막 좌표를 state에 들면 렌더가 한 번 더 도는 대가를 치른다.
   * 요소의 style 자체가 마지막 값을 들고 있으므로 그걸 저장소로 쓴다 —
   * 좌표가 없는 동안에는 아무것도 건드리지 않아 그 자리에 그대로 머문다.
   */
  const markerRef = useRef<SVGGElement>(null)
  useEffect(() => {
    const element = markerRef.current
    if (!element) return

    if (visible && marker) {
      const { x, y } = projectToView(marker.lng, marker.lat)
      element.style.transform = `translate(${x}px, ${y}px)`
      return
    }

    // 첫 좌표가 오기 전에는 가운데에 둔다. 구석에서 날아오는 것처럼 보이지 않게.
    if (!element.style.transform) {
      element.style.transform = `translate(${CENTER.x}px, ${CENTER.y}px)`
    }
  }, [visible, marker])

  // 경고는 렌더 중이 아니라 커밋 후에 남긴다.
  // 렌더 본문에서 부르면 StrictMode의 이중 렌더로 두 번 찍힌다.
  const outOfBounds = marker != null && !visible
  useEffect(() => {
    if (!outOfBounds || !marker) return
    console.warn(
      `[KoreaMap] 지도 범위를 벗어난 좌표라 마커를 숨깁니다: lng ${marker.lng}, lat ${marker.lat}`,
    )
  }, [outOfBounds, marker])

  return (
    <svg
      viewBox={`${VIEW_X} ${VIEW_Y} ${VIEW_WIDTH} ${VIEW_HEIGHT}`}
      role="img"
      aria-label={
        visible
          ? `대한민국 지도, ${markerLabel ?? '추첨된 위치'} 표시됨`
          : '대한민국 지도, 표시된 위치 없음'
      }
      className={cn('h-full w-full', className)}
    >
      {KOREA_PATHS.map((d, index) =>
        index === JEJU_INDEX ? null : (
          <path
            // 배열이 고정이라 순서가 바뀌지 않는다. d는 최대 7천 자라 키로 쓰기엔 무겁다.
            key={index}
            d={d}
            fill={LAND_FILL}
            stroke={LAND_STROKE}
            strokeWidth={1}
            strokeLinejoin="round"
          />
        ),
      )}

      {/* 제주 인셋 */}
      <rect
        x={JEJU_INSET.box.x}
        y={JEJU_INSET.box.y}
        width={JEJU_INSET.box.width}
        height={JEJU_INSET.box.height}
        fill="none"
        stroke={INSET_STROKE}
        strokeWidth={1}
      />
      <g transform={JEJU_TRANSFORM}>
        <path
          d={KOREA_PATHS[JEJU_INDEX]}
          fill={LAND_FILL}
          stroke={LAND_STROKE}
          // 도형이 1.5배 확대되므로 선도 같이 굵어진다. 나눠서 본토와 두께를 맞춘다.
          strokeWidth={1 / JEJU_INSET.scale}
          strokeLinejoin="round"
        />
      </g>

      <g
        ref={markerRef}
        className={cn(
          '[transition:transform_.55s_cubic-bezier(.2,1.5,.4,1),opacity_.3s]',
          'motion-reduce:[transition:none]',
        )}
        // transform은 위 effect가 DOM에 직접 쓴다. 여기 두면 서로 덮어쓴다.
        style={{ opacity: visible ? 1 : 0 }}
      >
        <circle r={MARKER_RADIUS} fill="#0E1513" />
        <circle r={MARKER_INNER_RADIUS} fill="#FFFFFF" />
      </g>
    </svg>
  )
}
