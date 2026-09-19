export class ApiError extends Error {
  readonly status: number
  /** 서버가 내려준 에러 본문. 형태는 백엔드와 맞춰야 한다. */
  readonly data: unknown

  constructor(status: number, message: string, data?: unknown) {
    super(message)
    this.name = 'ApiError'
    this.status = status
    this.data = data
  }

  get isUnauthorized() {
    return this.status === 401
  }
}

/**
 * 서버가 내려준 에러 코드(`{ code: 'KEYWORD_TOO_SHORT', ... }`).
 *
 * 같은 상태 코드라도 사용자가 할 수 있는 일이 다를 때 쓴다 — 400 하나로는
 * '두 글자만 더 치세요'와 '국내 위치만 돼요'를 가려낼 수 없다.
 * 본문 형태가 다르면 undefined다.
 */
export function errorCodeOf(cause: unknown): string | undefined {
  if (!(cause instanceof ApiError)) return undefined
  const { data } = cause
  if (typeof data !== 'object' || data === null || !('code' in data)) return undefined
  return typeof data.code === 'string' ? data.code : undefined
}
