/** 도메인 플래그가 비어 있으면 전역 VITE_USE_MOCK을 따른다. */
function mockFlag(value: string | undefined) {
  return (value ?? import.meta.env.VITE_USE_MOCK) !== 'false'
}

export const env = {
  /**
   * API 서버 origin. **Vercel 프록시를 쓰므로 보통 빈 값이다** — 비어 있으면 같은
   * 오리진(`/api/v1/...`)으로 요청이 나가고 `vercel.json`의 rewrite가 ALB로 넘긴다.
   * 로컬에서 BE를 직접 띄워 붙일 때만 `http://localhost:8080` 같은 값을 넣는다.
   */
  apiUrl: import.meta.env.VITE_API_URL ?? '',
  /** 지도 작업 전까지는 비어 있을 수 있다. */
  kakaoMapKey: import.meta.env.VITE_KAKAO_MAP_KEY ?? '',
  /** 백엔드 준비 전까지 목 응답을 쓴다. 연동되면 .env에서 false로 끈다. */
  useMock: import.meta.env.VITE_USE_MOCK !== 'false',
  /**
   * 도메인별로 목을 따로 끈다. API가 도메인마다 다른 속도로 열려서,
   * 하나를 붙이려고 `VITE_USE_MOCK=false`로 전부 켜면 아직 안 되는 쪽이 깨진다.
   * 값이 없으면 전역 `useMock`을 따르므로 기존 동작은 그대로다.
   */
  useMockAuth: mockFlag(import.meta.env.VITE_USE_MOCK_AUTH),
  useMockMagazine: mockFlag(import.meta.env.VITE_USE_MOCK_MAGAZINE),
  useMockSuggest: mockFlag(import.meta.env.VITE_USE_MOCK_SUGGEST),
  useMockOnsenList: mockFlag(import.meta.env.VITE_USE_MOCK_ONSEN_LIST),
  useMockNearby: mockFlag(import.meta.env.VITE_USE_MOCK_NEARBY),
  useMockRoutePlaces: mockFlag(import.meta.env.VITE_USE_MOCK_ROUTE_PLACES),
  useMockMapPoints: mockFlag(import.meta.env.VITE_USE_MOCK_MAP_POINTS),
  useMockOnsenDetail: mockFlag(import.meta.env.VITE_USE_MOCK_ONSEN_DETAIL),
  useMockPamphlet: mockFlag(import.meta.env.VITE_USE_MOCK_PAMPHLET),
}
