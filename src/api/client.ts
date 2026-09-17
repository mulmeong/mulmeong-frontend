import { ApiError } from '@/api/ApiError'
import { tokenStorage } from '@/api/token'
import { env } from '@/lib/env'

/**
 * 401을 받아 세션을 비웠을 때 앱에 알리는 신호.
 * API 레이어가 React를 모르게 하려고 DOM 이벤트를 쓴다 — `useAuth`가 받아서 상태를 정리한다.
 */
export const UNAUTHORIZED_EVENT = 'mulmeong:unauthorized'

type RequestOptions = Omit<RequestInit, 'body' | 'method'> & {
  /** 객체를 넘기면 JSON으로 직렬화한다. FormData는 그대로 전송된다. */
  body?: unknown
  /** 쿼리스트링. undefined/null 값은 자동으로 제외된다. */
  params?: Record<string, string | number | boolean | undefined | null>
  /** 로그인 없이 부르는 API에서 true로 둔다. */
  skipAuth?: boolean
}

function buildUrl(path: string, params?: RequestOptions['params']): string {
  const url = new URL(path.replace(/^\//, ''), `${env.apiBaseUrl.replace(/\/$/, '')}/`)
  if (params) {
    for (const [key, value] of Object.entries(params)) {
      if (value !== undefined && value !== null) url.searchParams.set(key, String(value))
    }
  }
  return url.toString()
}

async function parseBody(response: Response): Promise<unknown> {
  if (response.status === 204) return null
  const text = await response.text()
  if (!text) return null
  try {
    return JSON.parse(text)
  } catch {
    return text
  }
}

/**
 * 재발급을 수행하는 함수. 순환 참조를 피하려고 auth 모듈이 시작 시 주입한다
 * (auth → client → auth가 되면 모듈 초기화 순서가 꼬인다).
 */
let reissueFn: (() => Promise<unknown>) | undefined

export function setReissueHandler(fn: () => Promise<unknown>) {
  reissueFn = fn
}

/** 동시에 401이 여러 개 떠도 재발급은 한 번만 나간다. */
let reissuing: Promise<boolean> | undefined

function reissueOnce(): Promise<boolean> {
  if (!reissueFn) return Promise.resolve(false)
  reissuing ??= reissueFn()
    .then(() => true)
    .catch(() => false)
    .finally(() => {
      reissuing = undefined
    })
  return reissuing
}

async function send(
  method: string,
  path: string,
  { body, params, skipAuth, headers, ...init }: RequestOptions,
): Promise<Response> {
  const isFormData = body instanceof FormData
  const finalHeaders = new Headers(headers)

  if (!isFormData && body !== undefined) {
    finalHeaders.set('Content-Type', 'application/json')
  }
  if (!skipAuth) {
    const token = tokenStorage.get()
    if (token) finalHeaders.set('Authorization', `Bearer ${token}`)
  }

  try {
    return await fetch(buildUrl(path, params), {
      ...init,
      method,
      headers: finalHeaders,
      // Refresh Token이 httpOnly 쿠키라 교차 출처에서도 쿠키를 주고받아야 한다.
      // 기본값(same-origin)이면 로그인 응답의 쿠키가 저장조차 되지 않는다.
      credentials: init.credentials ?? 'include',
      body: isFormData ? body : body !== undefined ? JSON.stringify(body) : undefined,
    })
  } catch {
    throw new ApiError(0, '네트워크 연결을 확인해주세요.')
  }
}

async function request<T>(method: string, path: string, options: RequestOptions = {}): Promise<T> {
  let response = await send(method, path, options)

  /*
   * Access Token이 만료됐다. 쿠키로 재발급받아 원요청을 한 번만 다시 보낸다.
   *
   * `skipAuth` 요청은 제외한다 — 로그인 실패(401)나 재발급 자체의 401까지 재발급을
   * 부르면 무한 루프가 된다 (명세 비고). FormData는 이미 소비돼 재전송할 수 없다.
   */
  const retriable =
    response.status === 401 && !options.skipAuth && !(options.body instanceof FormData)

  if (retriable && (await reissueOnce())) {
    response = await send(method, path, options)
  }

  const data = await parseBody(response)

  // 재발급까지 실패했다. 토큰을 남겨두면 이후 요청마다 401을 반복한다.
  if (response.status === 401 && !options.skipAuth) {
    tokenStorage.clear()
    window.dispatchEvent(new Event(UNAUTHORIZED_EVENT))
  }

  if (!response.ok) {
    const message =
      (typeof data === 'object' && data !== null && 'message' in data
        ? String((data as { message: unknown }).message)
        : null) ?? `요청에 실패했습니다. (${response.status})`
    throw new ApiError(response.status, message, data)
  }

  return data as T
}

export const api = {
  get: <T>(path: string, options?: RequestOptions) => request<T>('GET', path, options),
  post: <T>(path: string, body?: unknown, options?: RequestOptions) =>
    request<T>('POST', path, { ...options, body }),
  patch: <T>(path: string, body?: unknown, options?: RequestOptions) =>
    request<T>('PATCH', path, { ...options, body }),
  put: <T>(path: string, body?: unknown, options?: RequestOptions) =>
    request<T>('PUT', path, { ...options, body }),
  delete: <T>(path: string, options?: RequestOptions) => request<T>('DELETE', path, options),
}
