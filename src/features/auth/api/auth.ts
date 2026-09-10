import { api } from '@/api/client'
import { tokenStorage } from '@/api/token'
import { env } from '@/lib/env'
import type { User } from '@/types/user'

import { mockCheckNickname, mockLogin, mockSignup } from './authMock'

/** 엔드포인트·응답 형태는 백엔드와 맞춘 뒤 수정할 것. */
export type LoginRequest = {
  email: string
  password: string
}

export type LoginResponse = {
  accessToken: string
  user: User
}

/** 닉네임·약관 동의는 AUTH-07에 없는 시안 필드. 명세 갱신 필요. */
export type SignupRequest = {
  email: string
  password: string
  name: string
  /** YYYY-MM-DD */
  birthDate: string
  /** 숫자만 */
  phone: string
  nickname: string
  marketingAgreed: boolean
}

export async function login(body: LoginRequest): Promise<LoginResponse> {
  const result = env.useMock
    ? await mockLogin(body)
    : await api.post<LoginResponse>('/auth/login', body, { skipAuth: true })
  tokenStorage.set(result.accessToken)
  return result
}

export async function signup(body: SignupRequest): Promise<LoginResponse> {
  const result = env.useMock
    ? await mockSignup(body)
    : await api.post<LoginResponse>('/auth/signup', body, { skipAuth: true })
  tokenStorage.set(result.accessToken)
  return result
}

export function checkNickname(nickname: string): Promise<{ available: boolean }> {
  if (env.useMock) return mockCheckNickname(nickname)
  return api.get<{ available: boolean }>('/auth/nickname-check', {
    params: { nickname },
    skipAuth: true,
  })
}

export function logout() {
  tokenStorage.clear()
}

export function getMe() {
  return api.get<User>('/users/me')
}
