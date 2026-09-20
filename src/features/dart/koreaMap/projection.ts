/**
 * KoreaMap의 SVG 좌표계(viewBox 300x430)와 위경도를 잇는 변환.
 *
 * 표준위도 35.8°N 정거원통도법(equirectangular)을 쓴다.
 * 아래 상수는 원본 SVG에서 역산해 얻은 값이라 임의로 바꾸면 마커가 어긋난다.
 * 검증: 덕구온천(129.29E, 36.99N) -> (219.5, 155.8)
 */

/** x = 0 에 해당하는 경도 */
export const LON0 = 124.428
/** y = 0 에 해당하는 위도 */
export const LAT0 = 39.7876
/** 경도 1도당 픽셀 */
export const KX = 45.146
/** 위도 1도당 픽셀 */
export const KY = 55.691

/**
 * 화면에 보여줄 창. 본토(y 62.1~320.8)에 위아래 16px 여백만 준 범위다.
 *
 * 제주는 원래 y 347.5에 있어 본토와 26.7px의 빈 바다를 사이에 두고 떨어져 있었다.
 * 그 탓에 전체를 가운데 정렬하면 본토가 23.5px 위로 치우쳐 보였다.
 * 제주를 인셋으로 옮기면서 창도 본토 기준으로 다시 잡았다.
 */
export const VIEW_X = 0
export const VIEW_Y = 46
export const VIEW_WIDTH = 300
export const VIEW_HEIGHT = 291

/**
 * 제주 인셋.
 *
 * 원본 제주 도형을 확대해 우하단 빈 구역으로 옮긴다.
 * 도형과 마커에 같은 변환을 적용하므로 둘이 어긋날 일이 없다.
 */
export const JEJU_INSET = {
  /** 본토와 겹치지 않는 우하단 자리 */
  box: { x: 228, y: 266, width: 66, height: 52 },
  scale: 1.5,
  /** 원본 제주 bbox(x 76.7~113.7, y 347.5~367.9)의 중심 */
  sourceCenter: { x: 95.2, y: 357.7 },
} as const

/** 인셋 박스의 중심. 원본 제주 중심이 이 점으로 온다. */
export const JEJU_BOX_CENTER: Point = {
  x: JEJU_INSET.box.x + JEJU_INSET.box.width / 2,
  y: JEJU_INSET.box.y + JEJU_INSET.box.height / 2,
}

/**
 * 제주로 볼 위도 상한.
 * 제주는 33.18~33.55, 본토 최남단은 34.03이라 그 사이를 가른다.
 */
export const JEJU_LAT_MAX = 33.8

export type Point = { x: number; y: number }

/** 위경도를 SVG 좌표로 옮긴다. 범위 검사는 하지 않는다 — isInBounds를 따로 쓸 것. */
export function project(lng: number, lat: number): Point {
  return {
    x: (lng - LON0) * KX,
    y: (LAT0 - lat) * KY,
  }
}

/** 제주 인셋에 들어갈 좌표인지. 위도만 본다 — 제주와 본토는 위도로 깔끔히 갈린다. */
export function isJeju(lat: number): boolean {
  return lat < JEJU_LAT_MAX
}

/** 원본 좌표를 인셋 박스 안 위치로 옮긴다. SVG의 <g transform>과 같은 계산이다. */
export function toJejuInset(point: Point): Point {
  return {
    x: JEJU_BOX_CENTER.x + (point.x - JEJU_INSET.sourceCenter.x) * JEJU_INSET.scale,
    y: JEJU_BOX_CENTER.y + (point.y - JEJU_INSET.sourceCenter.y) * JEJU_INSET.scale,
  }
}

/**
 * 위경도를 화면에 그릴 최종 좌표로. 마커는 이걸 쓴다.
 * 제주면 인셋 박스 안으로, 아니면 본토 위치 그대로.
 */
export function projectToView(lng: number, lat: number): Point {
  const point = project(lng, lat)
  return isJeju(lat) ? toJejuInset(point) : point
}

/**
 * 화면에 실제로 보이는 좌표인지.
 *
 * 경위도 범위를 따로 적어두는 대신 최종 위치를 구해 창 안인지 본다.
 * 상수가 바뀌어도 판정이 같이 따라오고, 두 값이 어긋날 일이 없다.
 *
 * 독도(131.87E)는 x가 336으로 나와 범위 밖이다.
 */
export function isInBounds(lng: number, lat: number): boolean {
  const { x, y } = projectToView(lng, lat)
  return x >= VIEW_X && x <= VIEW_X + VIEW_WIDTH && y >= VIEW_Y && y <= VIEW_Y + VIEW_HEIGHT
}
