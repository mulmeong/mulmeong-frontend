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
 * 물방울 마커. 지도 화면(MapCanvas)의 핀과 같은 모양이다 — 거기서는 CSS
 * `border-radius: 50% 50% 50% 10px` + `rotate(-45deg)`로 만드는 도형을,
 * 여기서는 SVG라 같은 윤곽을 path로 그린다.
 *
 * 사진은 넣지 않는다. 저 지도의 핀은 48px이지만 이 지도의 핀은 20px 남짓이라
 * 안에 사진을 깔아도 알아볼 수 없다. 추첨 응답에 사진이 없어 상세가 도착해야
 * 생기는 값이기도 하다.
 *
 * 지도를 크게 그리면 마커도 같은 비율로 커진다. 지도 대비 비율은 그대로다.
 */
const PIN_RADIUS = 9
/** 핀 가운데에서 뾰족한 끝까지. 정사각형을 45° 돌려 대각선이 아래를 향한다. */
const PIN_TIP = PIN_RADIUS * Math.SQRT2
/** 뾰족한 쪽 모서리. 지도 핀의 48px : 10px 비율을 따른다. */
const PIN_CORNER = PIN_RADIUS * 0.42

const INNER_RADIUS = 6.4

/**
 * 돌리기 전 도형. 세 모서리는 반지름만큼 둥글고(= 원의 3/4) 한 모서리만 살짝
 * 둥글다. 이 상태로 -45° 돌리면 그 모서리가 아래를 향한다.
 */
const PIN_PATH = [
  `M ${-PIN_RADIUS} 0`,
  `A ${PIN_RADIUS} ${PIN_RADIUS} 0 0 1 0 ${-PIN_RADIUS}`,
  `A ${PIN_RADIUS} ${PIN_RADIUS} 0 0 1 ${PIN_RADIUS} 0`,
  `A ${PIN_RADIUS} ${PIN_RADIUS} 0 0 1 0 ${PIN_RADIUS}`,
  `L ${-PIN_RADIUS + PIN_CORNER} ${PIN_RADIUS}`,
  `A ${PIN_CORNER} ${PIN_CORNER} 0 0 1 ${-PIN_RADIUS} ${PIN_RADIUS - PIN_CORNER}`,
  'Z',
].join(' ')

/**
 * 온천 기호. MapCanvas의 마커 글리프를 옮겨 그렸다 — 기기별 글꼴·이모지 차이
 * 없이 같은 모양이 나오게 선으로 그린다. 원본이 36×36 기준이라 내용 가운데
 * (18, 18.6)를 원점으로 옮긴 뒤 줄인다.
 *
 * (MapCanvas는 다른 담당자 코드라 지금 공통으로 빼지 않는다. 결과 카드의 탭과
 * 같은 이유다 — 나중에 협의해서 합칠 것.)
 */
/** 원본에서 기호가 실제로 차지하는 폭 (36×36 안에서 x 10~26). */
const GLYPH_SOURCE_WIDTH = 16
/**
 * 기호가 차지할 폭. 안쪽 원 **지름**이 아니라 그보다 작게 잡는다 — 지름에
 * 맞추면 가로로는 들어가도 위아래 끝이 원 밖으로 밀려난다.
 */
const GLYPH_WIDTH = INNER_RADIUS * 1.4
const GLYPH_SCALE = GLYPH_WIDTH / GLYPH_SOURCE_WIDTH
const GLYPH_TRANSFORM = `scale(${GLYPH_SCALE}) translate(-18 -18.6)`

/** 줄인 만큼 선도 가늘어진다. 작은 핀에서도 획이 보이게 원본(1.6)보다 굵게 잡는다. */
const GLYPH_STROKE = 2

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
        {/* 뾰족한 끝이 좌표에 닿도록 핀 전체를 위로 올린다. */}
        <g transform={`translate(0 ${-PIN_TIP})`}>
          <path d={PIN_PATH} transform="rotate(-45)" fill="#0E1513" />
          <circle r={INNER_RADIUS} fill="#FFFFFF" />
          <g
            transform={GLYPH_TRANSFORM}
            fill="none"
            stroke="#0E1513"
            strokeWidth={GLYPH_STROKE}
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M13 18c-2-2 2-3.5 0-5.5M18 18c-2-2 2-3.5 0-5.5M23 18c-2-2 2-3.5 0-5.5" />
            <path d="M12 20.5c-1.3.4-2 1-2 1.7 0 1.4 3.6 2.5 8 2.5s8-1.1 8-2.5c0-.7-.7-1.3-2-1.7" />
          </g>
        </g>
      </g>
    </svg>
  )
}
