import type { OnsenDetail } from '@/types/onsenDetail'
import type { PamphletDetail } from '@/types/pamphlet'
import type { SavedCategory } from '@/types/saved'

/**
 * 리더·표지가 그리는 팜플렛 한 권.
 *
 * 서버 타입(PamphletDetail)을 그대로 쓰지 않는 이유는 표지 번호처럼 화면에만
 * 있는 값이 있어서다. 목록·상세·공유가 모두 이 모양으로 맞춰 들어온다.
 */
export type PamphletView = {
  id: string
  /** 표지에 찍히는 일련번호. 목록 안에서의 순번이라 서버에는 없다. */
  number: string
  title: string
  createdAt: string
  places: PamphletViewPlace[]
}

export type PamphletViewPlace = {
  id: number
  name: string
  address: string
  category: SavedCategory
  /** 서버가 준 장소 유형 표기(예: '식당', '관광지'). 카테고리보다 구체적이다. */
  typeLabel?: string
  /** 데이터 출처. 'TOUR_API'면 팜플렛에 한국관광공사 표기를 붙인다. */
  source?: string
  imageUrl?: string
  /** 서버가 준 한 줄 설명. 온천은 수온·수질, 그 외는 분류다. */
  description?: string
  /**
   * 온천 상세(GET /onsens/{id})로 채우는 보강 정보. 팜플렛 응답에는 없어서
   * 화면에서 따로 받아 붙인다 — 없으면 해당 줄을 숨긴다.
   */
  spec?: PamphletPlaceSpec
}

/** 팜플렛에 싣는 온천 정보. 실제로 값이 있는 필드만 추렸다. */
export type PamphletPlaceSpec = {
  /** 온천 자체를 설명하는 값 — 수온·수질·pH. */
  tempC?: number
  waterType?: string
  ph?: number
  /** 방문에 참고하는 값. 서버가 hours·price·holiday·parking을 아직 안 채운다. */
  hours?: string
  price?: number
  closed?: string
  parking?: string
  accessLabel?: string
  facilityType?: string
  /** 한 줄 소개. benefit(효능)이 없으면 지역 코멘트를 쓴다. */
  note?: string
}

/** 서버 placeType → 화면 카테고리. SPA는 온천과 같은 칸으로 묶는다. */
const CATEGORY: Record<string, SavedCategory> = {
  ONSEN: 'onsen',
  SPA: 'onsen',
  RESTAURANT: 'restaurant',
  CAFE: 'cafe',
  ATTRACTION: 'attraction',
  ETC: 'etc',
}

function meaningfulSubText(subText?: string | null, typeLabel?: string | null) {
  const value = subText?.trim()
  if (!value || value === typeLabel?.trim()) return undefined
  return value
}

export function toPamphletView(detail: PamphletDetail, number: string): PamphletView {
  return {
    id: String(detail.pamphletId ?? detail.shareToken),
    number,
    title: detail.title,
    createdAt: detail.createdAt.slice(0, 10),
    places: detail.places.map((place) => ({
      id: place.placeId,
      name: place.name,
      address: place.address ?? '',
      category: CATEGORY[place.placeType] ?? 'etc',
      typeLabel: place.placeTypeLabel ?? undefined,
      source: place.source ?? undefined,
      imageUrl: place.imageUrl ?? undefined,
      // 온천이 아니면 서버가 subText에 유형 라벨을 그대로 넣는다. 유형을 이미
      // 따로 보여주므로 같은 값이면 설명으로 치지 않는다 ('식당 · 식당' 방지).
      description: meaningfulSubText(place.subText, place.placeTypeLabel),
    })),
  }
}

/** 한국관광공사 데이터가 한 곳이라도 있으면 팜플렛 단위로 한 번 표기한다. */
export function usesTourApi(places: { source?: string }[]): boolean {
  return places.some((place) => place.source === 'TOUR_API')
}

/** 목록 안에서의 순번. 페이지를 넘겨도 이어지게 앞 페이지 수를 더한다. */
export function coverNumber(index: number, page: number, size: number): string {
  return String((page - 1) * size + index + 1).padStart(2, '0')
}

/**
 * 온천 상세를 팜플렛에 실을 형태로 줄인다.
 *
 * 실측(표본 13곳) 기준 hours·price·holiday·parking은 서버가 아직 전부 null이라
 * 대부분 수온·수질·효능만 남는다. 값이 없는 항목은 아예 넣지 않아 화면이 빈
 * 라벨을 그리지 않게 한다.
 */
export function toPlaceSpec(detail: OnsenDetail): PamphletPlaceSpec {
  const water = detail.water ?? undefined
  const spec: PamphletPlaceSpec = {
    tempC: water?.temp ?? undefined,
    waterType: water?.type ?? water?.component ?? undefined,
    ph: water?.ph ?? undefined,
    hours: detail.hours ?? undefined,
    price: detail.priceMin ?? undefined,
    closed: detail.holiday ?? undefined,
    parking: detail.parkingInfo ?? undefined,
    accessLabel: detail.access?.accessLevelLabel ?? undefined,
    facilityType: detail.facilities?.facilityType ?? undefined,
    note: water?.benefit ?? detail.regionComment ?? undefined,
  }
  // undefined 키를 남기면 호출부가 값이 있는지 세기 번거롭다.
  ;(Object.keys(spec) as (keyof PamphletPlaceSpec)[]).forEach((key) => {
    if (spec[key] === undefined) delete spec[key]
  })
  return spec
}
