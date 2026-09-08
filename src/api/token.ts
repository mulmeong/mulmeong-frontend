const ACCESS_TOKEN_KEY = 'mulmeong.accessToken'

/** 저장 방식을 바꿀 일이 생기면 이 파일만 고치면 된다. */
export const tokenStorage = {
  get(): string | null {
    try {
      return localStorage.getItem(ACCESS_TOKEN_KEY)
    } catch {
      return null
    }
  },

  set(token: string) {
    try {
      localStorage.setItem(ACCESS_TOKEN_KEY, token)
    } catch {
      // 시크릿 모드 등 저장이 막힌 환경에서는 조용히 넘어간다.
    }
  },

  clear() {
    try {
      localStorage.removeItem(ACCESS_TOKEN_KEY)
    } catch {
      // 위와 동일
    }
  },
}
