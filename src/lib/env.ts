function required(key: keyof ImportMetaEnv): string {
  const value = import.meta.env[key]
  if (!value) {
    throw new Error(`환경변수 ${key} 가 없습니다. .env.example 을 복사해 .env 를 만드세요.`)
  }
  return value
}

export const env = {
  apiBaseUrl: required('VITE_API_BASE_URL'),
  /** 지도 작업 전까지는 비어 있을 수 있어 required를 쓰지 않는다. */
  kakaoMapKey: import.meta.env.VITE_KAKAO_MAP_KEY ?? '',
  /** 백엔드 준비 전까지 목 응답을 쓴다. 연동되면 .env에서 false로 끈다. */
  useMock: import.meta.env.VITE_USE_MOCK !== 'false',
}
