import { ApiError } from '@/api/ApiError'
import { tokenStorage } from '@/api/token'
import { env } from '@/lib/env'

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

async function request<T>(
  method: string,
  path: string,
  { body, params, skipAuth, headers, ...init }: RequestOptions = {},
): Promise<T> {
  const isFormData = body instanceof FormData
  const finalHeaders = new Headers(headers)

  if (!isFormData && body !== undefined) {
    finalHeaders.set('Content-Type', 'application/json')
  }
  if (!skipAuth) {
    const token = tokenStorage.get()
    if (token) finalHeaders.set('Authorization', `Bearer ${token}`)
  }

  let response: Response
  try {
    response = await fetch(buildUrl(path, params), {
      ...init,
      method,
      headers: finalHeaders,
      body: isFormData ? body : body !== undefined ? JSON.stringify(body) : undefined,
    })
  } catch {
    throw new ApiError(0, '네트워크 연결을 확인해주세요.')
  }

  const data = await parseBody(response)

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
