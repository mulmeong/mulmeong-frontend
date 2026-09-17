import { api } from '@/api/client'
import { tokenStorage } from '@/api/token'
import type { LoginRequest, SignupRequest } from '@/features/auth/schemas'
import { env } from '@/lib/env'
import type { User } from '@/types/user'

import { mockCheckEmail, mockGetMe, mockLogin, mockSignup } from './authMock'

/** AUTH-01 로그인 응답. Refresh Token은 HttpOnly 쿠키로 따로 내려온다. */
export type LoginResponse = {
  accessToken: string
  /** 초 단위 만료. 명세 기준 1800(30분). */
  expiresIn: number
  user: User
}

/** AUTH-07 회원가입 응답. 자동 로그인은 하지 않는다 — 닉네임은 서버가 만든다. */
export type SignupResponse = {
  userId: number
  email: string
  nickname: string
}

export async function login(body: LoginRequest): Promise<LoginResponse> {
  const result = env.useMock
    ? await mockLogin(body)
    : await api.post<LoginResponse>('/auth/login', body, { skipAuth: true })
  tokenStorage.set(result.accessToken)
  return result
}

/** 201만 받고 끝난다. 로그인은 사용자가 다시 한다 (명세 AUTH-07). */
export function signup(body: SignupRequest): Promise<SignupResponse> {
  if (env.useMock) return mockSignup(body)
  return api.post<SignupResponse>('/auth/signup', body, { skipAuth: true })
}

/** 가입 폼 blur 시점 중복 확인. 중복이어도 200 + available:false로 온다. */
export function checkEmail(email: string): Promise<{ email: string; available: boolean }> {
  if (env.useMock) return mockCheckEmail(email)
  return api.get<{ email: string; available: boolean }>('/auth/email/check', {
    params: { email },
    skipAuth: true,
  })
}

/** 서버 Refresh Token까지 폐기한다. 이미 로그아웃 상태여도 204(멱등). */
export async function logout() {
  try {
    if (!env.useMock) await api.post<void>('/auth/logout')
  } catch {
    // 서버 폐기에 실패해도 로컬 토큰은 지운다 — 사용자 입장에선 로그아웃이다.
  }
  tokenStorage.clear()
}

export function getMe(): Promise<User> {
  if (env.useMock) return mockGetMe()
  return api.get<User>('/users/me')
}
