import type { FocusEvent, MouseEvent } from 'react'

/** 지도 위에 떠 있는 말풍선. 좌표는 지도 상자 왼쪽 위 기준이다. */
export type MapTip = {
  text: string
  x: number
  y: number
}

/**
 * 마우스가 놓인 자리로 말풍선 좌표를 만든다.
 *
 * path의 offsetX는 그 도형 기준이라 못 쓴다. svg 전체의 화면 위치를 재서
 * 마우스 좌표를 상자 안 좌표로 옮긴다. 지도가 작게 줄어 있어도 실제로 그려진
 * 크기가 잡히므로 따로 보정할 필요가 없다.
 */
export function tipAtPointer(event: MouseEvent<SVGPathElement>, text: string): MapTip | null {
  const svg = event.currentTarget.ownerSVGElement
  if (!svg) return null

  const bounds = svg.getBoundingClientRect()
  return { text, x: event.clientX - bounds.left, y: event.clientY - bounds.top }
}

/** 키보드로 옮겨왔을 때. 마우스 좌표가 없으므로 도형 한가운데에 띄운다. */
export function tipAtShape(event: FocusEvent<SVGPathElement>, text: string): MapTip | null {
  const svg = event.currentTarget.ownerSVGElement
  if (!svg) return null

  const bounds = svg.getBoundingClientRect()
  const shape = event.currentTarget.getBoundingClientRect()

  return {
    text,
    x: shape.left + shape.width / 2 - bounds.left,
    y: shape.top + shape.height / 2 - bounds.top,
  }
}

/**
 * 지도 말풍선.
 *
 * 지도를 감싼 relative 상자 안에 둔다. 커서 바로 위에 뜨고, 커서를 따라다니므로
 * 마우스 이벤트를 가로채면 안 된다(pointer-events-none).
 */
export default function MapTooltip({ tip }: { tip: MapTip | null }) {
  if (!tip) return null

  return (
    <div
      // 스크린 리더는 path의 aria-label로 이미 같은 내용을 읽는다.
      aria-hidden="true"
      style={{ left: tip.x, top: tip.y }}
      className="bg-inverse text-text-inverse pointer-events-none absolute z-10 -translate-x-1/2 -translate-y-[calc(100%+10px)] rounded-sm px-2 py-1 text-[11px] whitespace-nowrap"
    >
      {tip.text}
    </div>
  )
}
