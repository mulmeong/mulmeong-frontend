import type { Onsen } from '@/types/onsen'

/** 지도는 목록의 사진·수질·리뷰 정보 없이도 모든 장소를 표시하고 선택할 수 있다. */
export type OnsenMapPoint = Pick<Onsen, 'id' | 'name' | 'lat' | 'lng'> & {
  address?: string
}
