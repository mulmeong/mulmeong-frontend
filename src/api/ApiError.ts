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
