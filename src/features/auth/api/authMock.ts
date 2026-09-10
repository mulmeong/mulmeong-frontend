import { ApiError } from '@/api/ApiError'

import type { LoginRequest, SignupRequest } from '@/features/auth/schemas'

import type { LoginResponse } from './auth'

const MOCK_DELAY_MS = 400

/** 이 계정으로만 로그인이 성공한다. */
const MOCK_ACCOUNT = { email: 'test@mulmeong.kr', password: 'mulmeong1234' }

const TAKEN_NICKNAMES = ['온탕러버', '물멍', '사우나킹']

function delay<T>(value: T): Promise<T> {
  return new Promise((resolve) => setTimeout(() => resolve(value), MOCK_DELAY_MS))
}

export async function mockLogin({ email, password }: LoginRequest): Promise<LoginResponse> {
  await delay(null)
  if (email !== MOCK_ACCOUNT.email || password !== MOCK_ACCOUNT.password) {
    throw new ApiError(401, '이메일 또는 비밀번호가 일치하지 않습니다.')
  }
  return {
    accessToken: 'mock-access-token',
    user: { id: 1, email, nickname: '온탕러버', level: 1 },
  }
}

export async function mockSignup({ email, nickname }: SignupRequest): Promise<LoginResponse> {
  await delay(null)
  if (TAKEN_NICKNAMES.includes(nickname)) {
    throw new ApiError(409, '이미 사용 중인 닉네임입니다.')
  }
  return {
    accessToken: 'mock-access-token',
    user: { id: 2, email, nickname, level: 1 },
  }
}

export function mockCheckNickname(nickname: string): Promise<{ available: boolean }> {
  return delay({ available: !TAKEN_NICKNAMES.includes(nickname) })
}
