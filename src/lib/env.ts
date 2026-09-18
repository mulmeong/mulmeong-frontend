export const env = {
  /**
   * API 서버 origin. **Vercel 프록시를 쓰므로 보통 빈 값이다** — 비어 있으면 같은
   * 오리진(`/api/v1/...`)으로 요청이 나가고 `vercel.json`의 rewrite가 ALB로 넘긴다.
   * 로컬에서 BE를 직접 띄워 붙일 때만 `http://localhost:8080` 같은 값을 넣는다.
   */
  apiUrl: import.meta.env.VITE_API_URL ?? '',
  /** 지도 작업 전까지는 비어 있을 수 있다. */
  kakaoMapKey: import.meta.env.VITE_KAKAO_MAP_KEY ?? '',
  /** 백엔드 없이 화면만 볼 때 true. 기본값은 실서버 연동이다. */
  useMock: import.meta.env.VITE_USE_MOCK === 'true',
}
