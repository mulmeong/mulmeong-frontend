import type { PoiDetail } from '@/types/poi'

const MOCK_DELAY_MS = 250

const DESCRIPTIONS = [
  '온천마을 안쪽 골목에 자리한 곳으로, 목욕을 마친 뒤 걸어서 들르기 좋다. 계절마다 메뉴가 조금씩 바뀐다.',
  '수변 산책로와 이어져 있어 온천 전후로 잠깐 쉬어가기 좋은 장소다. 주차 공간은 넉넉하지 않다.',
  '지역에서 오래 자리를 지킨 곳으로, 주말 낮에는 대기가 길어질 수 있다.',
]

/** 목록 목의 externalId(`MOCK_<CATEGORY>_<i>`)에서 이름·본문을 만들어 목록과 어긋나지 않게 한다. */
export function mockPoiDetail(externalId: string): Promise<PoiDetail> {
  const index = Number(externalId.split('_').pop()) || 0

  const detail: PoiDetail = {
    externalId,
    contentId: `${1000000 + index}`,
    contentTypeId: '39',
    name: externalId,
    description: DESCRIPTIONS[index % DESCRIPTIONS.length],
    imageUrl: null,
    thumbnailUrl: null,
    address: `온천마을길 ${10 + index * 12}`,
    phone: `033-000-${String(1000 + index).padStart(4, '0')}`,
    homepageUrl: index % 3 === 0 ? 'https://example.com' : null,
    lat: null,
    lng: null,
  }

  return new Promise((resolve) => setTimeout(() => resolve(detail), MOCK_DELAY_MS))
}
