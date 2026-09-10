import { api } from '@/api/client'
import { tokenStorage } from '@/api/token'
import type { LoginRequest, SignupRequest } from '@/features/auth/schemas'
import { env } from '@/lib/env'
import type { User } from '@/types/user'

import { mockCheckNickname, mockLogin, mockSignup } from './authMock'

/** 엔드포인트·응답 형태는 백엔드와 맞춘 뒤 수정할 것. */
export type LoginResponse = {
  accessToken: string
  user: User
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
