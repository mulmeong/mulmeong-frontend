import { ApiError } from '@/api/ApiError'
import { tokenStorage } from '@/api/token'

import type { LoginRequest, SignupRequest } from '@/features/auth/schemas'
import type { User } from '@/types/user'

import type { LoginResponse, SignupResponse } from './auth'

const MOCK_DELAY_MS = 400

/** 이 계정으로만 로그인이 성공한다. */
const MOCK_ACCOUNT = { email: 'test@mulmeong.kr', password: 'mulmeong1234' }

const MOCK_USER: User = { id: 1, email: MOCK_ACCOUNT.email, nickname: '물멍러1234', level: 2 }

/** 목 토큰은 이 값 하나뿐이다 — 다른 값이 남아 있으면 만료로 친다. */
const MOCK_TOKEN = 'mock-access-token'

/** 이미 가입된 이메일을 흉내 내 409·중복 확인 화면을 검토한다. */
const TAKEN_EMAILS = [MOCK_ACCOUNT.email, 'taken@mulmeong.kr']

function delay<T>(value: T): Promise<T> {
  return new Promise((resolve) => setTimeout(() => resolve(value), MOCK_DELAY_MS))
}

export async function mockLogin({ email, password }: LoginRequest): Promise<LoginResponse> {
  await delay(null)
  // 명세: 이메일 없음과 비밀번호 불일치를 구분하지 않는다 (계정 존재 노출 방지).
  if (email !== MOCK_ACCOUNT.email || password !== MOCK_ACCOUNT.password) {
    throw new ApiError(401, '이메일 또는 비밀번호가 일치하지 않습니다.', {
      code: 'LOGIN_FAILED',
    })
  }
  return { accessToken: MOCK_TOKEN, expiresIn: 1800, user: MOCK_USER }
}

/** 새로고침 시 세션 복원. 실서버의 GET /users/me 자리를 대신한다. */
export async function mockGetMe(): Promise<User> {
  await delay(null)
  if (tokenStorage.get() !== MOCK_TOKEN) {
    throw new ApiError(401, '로그인이 필요합니다.', { code: 'UNAUTHORIZED' })
  }
  return MOCK_USER
}

export async function mockSignup({ email }: SignupRequest): Promise<SignupResponse> {
  await delay(null)
  if (TAKEN_EMAILS.includes(email)) {
    throw new ApiError(409, '이미 가입된 이메일입니다.', { code: 'DUPLICATE_EMAIL' })
  }
  // 닉네임은 서버가 만든다 — '물멍러' + 랜덤 4자리.
  const suffix = String(Math.floor(1000 + Math.random() * 9000))
  return { userId: 2, email, nickname: `물멍러${suffix}` }
}

export function mockCheckEmail(email: string): Promise<{ email: string; available: boolean }> {
  return delay({ email, available: !TAKEN_EMAILS.includes(email) })
}
