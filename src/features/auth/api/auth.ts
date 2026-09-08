import { api } from '@/api/client'
import { tokenStorage } from '@/api/token'
import type { User } from '@/types/user'

/** 실제 엔드포인트와 응답 형태는 백엔드와 맞춘 뒤 수정할 것. */
type LoginRequest = {
  email: string
  password: string
}

type LoginResponse = {
  accessToken: string
  user: User
}

export async function login(body: LoginRequest): Promise<LoginResponse> {
  const result = await api.post<LoginResponse>('/auth/login', body, { skipAuth: true })
  tokenStorage.set(result.accessToken)
  return result
}

export function logout() {
  tokenStorage.clear()
}

export function getMe() {
  return api.get<User>('/users/me')
}
