import { ApiError } from '@/api/ApiError'
import { tokenStorage } from '@/api/token'

import type { LoginRequest, SignupRequest } from '@/features/auth/schemas'
import type { AuthUser, MyProfile } from '@/types/user'

import type { Availability, LoginResponse, SignupResponse } from './auth'

const MOCK_DELAY_MS = 400

/** 이 계정으로만 로그인이 성공한다. */
export const MOCK_ACCOUNT = { email: 'test@mulmeong.kr', password: 'mulmeong1234' }

/** 로그인·재발급이 내려주는 최소 프로필. 이메일은 없다 (명세). */
export const MOCK_USER: AuthUser = {
  userId: 1,
  nickname: '물멍러1234',
  level: 2,
  title: '물 좀 아는',
}

export const MOCK_PROFILE: MyProfile = {
  ...MOCK_USER,
  email: MOCK_ACCOUNT.email,
  visitedOnsenCount: 12,
  reviewCount: 15,
  grapeRegionCount: 7,
  favoriteCount: 8,
  pamphletCount: 2,
  nicknameEditable: true,
  nicknameChangedAt: '2026-08-20T10:00:00+09:00',
  nicknameEditableAt: null,
  profileShareToken: 'u7Kd92Qa',
  profileShareUrl: 'https://mulmeong.app/u/u7Kd92Qa',
  createdAt: '2026-06-01T09:00:00+09:00',
}

/** 목 토큰은 이 값 하나뿐이다 — 다른 값이 남아 있으면 만료로 친다. */
const MOCK_TOKEN = 'mock-access-token'

/**
 * Refresh 쿠키를 흉내낸다. 실제 쿠키는 JS에서 못 읽으므로(HttpOnly) 모듈 변수로 둔다.
 * 새로고침하면 사라져 실제 쿠키와 다르지만, 재발급 흐름 자체는 이걸로 검증된다.
 */
let refreshSession = false

/** 이미 가입된 이메일을 흉내 내 409·중복 확인 화면을 검토한다. */
const TAKEN_EMAILS = [MOCK_ACCOUNT.email, 'taken@mulmeong.kr']

/** 닉네임 중복(409 DUPLICATE_NICKNAME) 화면을 확인하려고 둔다. */
const TAKEN_NICKNAMES = [MOCK_USER.nickname, '물멍러']

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
  refreshSession = true
  return { accessToken: MOCK_TOKEN, expiresIn: 1800, user: MOCK_USER }
}

/** Refresh 쿠키로 재발급 (AUTH-01). 쿠키가 없으면 비로그인으로 본다. */
export async function mockReissue(): Promise<LoginResponse> {
  await delay(null)
  if (!refreshSession) {
    throw new ApiError(401, '로그인이 필요합니다.', { code: 'REFRESH_TOKEN_MISSING' })
  }
  return { accessToken: MOCK_TOKEN, expiresIn: 1800, user: MOCK_USER }
}

/** 마이페이지 프로필 (MY-01). */
export async function mockGetMe(): Promise<MyProfile> {
  await delay(null)
  if (tokenStorage.get() !== MOCK_TOKEN) {
    throw new ApiError(401, '로그인이 필요합니다.', { code: 'UNAUTHORIZED' })
  }
  return { ...MOCK_PROFILE }
}

/** 서버가 Refresh 쿠키를 지우는 것에 대응한다. */
export function mockLogout() {
  refreshSession = false
}

export async function mockSignup({ email, nickname }: SignupRequest): Promise<SignupResponse> {
  await delay(null)
  // 서버도 이메일을 먼저 본다 (UserService.signup).
  if (TAKEN_EMAILS.includes(email)) {
    throw new ApiError(409, '이미 가입된 이메일입니다.', { code: 'DUPLICATE_EMAIL' })
  }
  if (TAKEN_NICKNAMES.includes(nickname)) {
    throw new ApiError(409, '이미 사용 중인 닉네임입니다.', { code: 'DUPLICATE_NICKNAME' })
  }
  return { userId: 2, email, nickname }
}

export function mockCheckEmail(email: string): Promise<Availability> {
  return delay({ available: !TAKEN_EMAILS.includes(email) })
}

export function mockCheckNickname(nickname: string): Promise<Availability> {
  return delay({ available: !TAKEN_NICKNAMES.includes(nickname) })
}
