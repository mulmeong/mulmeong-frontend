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
  imageUrl?: string
  /** 서버가 준 한 줄 설명. 온천은 수온·수질, 그 외는 분류다. */
  description?: string
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
      imageUrl: place.imageUrl ?? undefined,
      description: place.subText ?? undefined,
    })),
  }
}

/** 목록 안에서의 순번. 페이지를 넘겨도 이어지게 앞 페이지 수를 더한다. */
export function coverNumber(index: number, page: number, size: number): string {
  return String((page - 1) * size + index + 1).padStart(2, '0')
}
