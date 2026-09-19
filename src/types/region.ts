/**
 * 목록 필터에서 쓰는 지역 묶음.
 *
 * 17개 시·도를 그대로 늘어놓으면 칩이 너무 많아 시안이 권역으로 묶었다.
 * prefixes는 주소 앞부분과 대조할 시·도 이름이다 (예: '경북 울진' -> '경북').
 *
 * 수도권은 서울과 경기·인천으로 나눴다. 서울·경기를 묶으면 인천만 남아
 * 한쪽이 거의 비어버리는데, 이렇게 나누면 양쪽 수가 비슷해진다.
 *
 * 내 리뷰(MY-02)와 찜한 장소(MY-03)가 같은 칩을 쓴다.
 *
 * TODO: types/onsen.ts의 REGIONS(서울/경기/인천/강원/충청/경상/전라/제주)와
 * 묶는 단위가 다르다. 지도 필터와 같은 값을 써야 하는지 확인 필요.
 * 울산을 경남·부산에, 세종을 충청·대전에 넣은 것도 시안에 명시가 없어 임의로 정했다.
 */
export const REGION_GROUPS = [
  { id: 'all', label: '전국', prefixes: [] },
  { id: 'seoul', label: '서울', prefixes: ['서울'] },
  { id: 'gyeonggi', label: '경기·인천', prefixes: ['경기', '인천'] },
  { id: 'gangwon', label: '강원', prefixes: ['강원'] },
  { id: 'chungcheong', label: '충청·대전', prefixes: ['충북', '충남', '대전', '세종'] },
  { id: 'gyeongbuk', label: '경북·대구', prefixes: ['경북', '대구'] },
  { id: 'gyeongnam', label: '경남·부산', prefixes: ['경남', '부산', '울산'] },
  { id: 'jeonbuk', label: '전북', prefixes: ['전북'] },
  { id: 'jeonnam', label: '전남·광주', prefixes: ['전남', '광주'] },
  { id: 'jeju', label: '제주', prefixes: ['제주'] },
] as const

export type RegionGroupId = (typeof REGION_GROUPS)[number]['id']

/** 주소가 해당 권역에 속하는지. '전국'은 prefixes가 비어 있어 거르지 않는다. */
export function matchesRegionGroup(address: string, region: RegionGroupId): boolean {
  const group = REGION_GROUPS.find((item) => item.id === region)
  if (!group || group.prefixes.length === 0) return true
  return group.prefixes.some((prefix) => address.startsWith(prefix))
}

/**
 * 시·도 이름이 속한 권역. 내 지도에서 고른 지역을 목록 필터로 넘길 때 쓴다.
 * 권역 하나가 시·도 여럿을 묶으므로 '경북'을 넘기면 '경북·대구'가 나온다.
 */
export function regionGroupOf(sidoName: string): RegionGroupId {
  const group = REGION_GROUPS.find((item) =>
    item.prefixes.some((prefix) => prefix === sidoName),
  )
  return group?.id ?? 'all'
}

/** 주소창에서 받은 값이 실제 권역인지. 아무 문자열이나 state로 들어가지 않게 거른다. */
export function toRegionGroupId(value: string | null): RegionGroupId | undefined {
  return REGION_GROUPS.find((item) => item.id === value)?.id
}
