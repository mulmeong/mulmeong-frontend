import { api, setReissueHandler } from '@/api/client'
import { tokenStorage } from '@/api/token'
import type { LoginRequest, SignupRequest } from '@/features/auth/schemas'
import { env } from '@/lib/env'
import type { AuthUser, MyProfile } from '@/types/user'

import {
  mockCheckEmail,
  mockCheckNickname,
  mockGetMe,
  mockLogin,
  mockLogout,
  mockReissue,
  mockSignup,
} from './authMock'

/** AUTH-01 로그인 응답. Refresh Token은 HttpOnly 쿠키로 따로 내려온다. */
export type LoginResponse = {
  accessToken: string
  /** 초 단위 만료. 명세 기준 1800(30분). */
  expiresIn: number
  user: AuthUser
}

/** AUTH-07 회원가입 응답. 자동 로그인은 하지 않는다 — 로그인은 사용자가 다시 한다. */
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

export type Availability = { available: boolean }

/**
 * 가입 폼 blur 시점 닉네임 중복 확인. 중복이어도 200 + available:false로 온다.
 * 서버 제약과 같은 2~10자를 통과한 값만 넘길 것 — 길이가 어긋나면 400이다.
 */
export function checkNickname(nickname: string): Promise<Availability> {
  if (env.useMock) return mockCheckNickname(nickname)
  return api.get<Availability>('/auth/nickname/check', {
    params: { nickname },
    skipAuth: true,
  })
}

/**
 * 이메일 중복 확인.
 *
 * ⚠️ 서버의 `/auth/email/check`는 **주석 처리되어 있어 404다** (UserController). 그래서
 * 실서버에서는 확인을 건너뛰고 `undefined`(미확인)를 돌려준다 — 최종 판정은 가입 API의
 * 409(DUPLICATE_EMAIL)가 한다. 서버에서 주석이 풀리면 아래 주석을 살리면 된다.
 */
export async function checkEmail(email: string): Promise<Availability | undefined> {
  if (env.useMock) return mockCheckEmail(email)
  // return api.get<Availability>('/auth/email/check', { params: { email }, skipAuth: true })
  return undefined
}

/** 서버 Refresh Token까지 폐기한다. 이미 로그아웃 상태여도 204(멱등). */
export async function logout() {
  try {
    if (env.useMock) mockLogout()
    else await api.post<void>('/auth/logout')
  } catch {
    // 서버 폐기에 실패해도 로컬 토큰은 지운다 — 사용자 입장에선 로그아웃이다.
  }
  tokenStorage.clear()
}

/**
 * Refresh 쿠키로 Access Token을 재발급한다 (AUTH-01).
 * 앱 첫 진입과 401을 받았을 때 부른다. 실패하면 비로그인으로 보고 로그인 화면으로 보낸다.
 *
 * `skipAuth`인 이유가 두 가지다 — 만료된 Access Token을 보낼 필요가 없고,
 * 이 요청의 401이 다시 재발급을 부르면 무한 루프가 된다 (명세 비고).
 * 쿠키는 `credentials: 'include'`로 자동 전송된다.
 */
export async function reissue(): Promise<LoginResponse> {
  const result = env.useMock
    ? await mockReissue()
    : await api.post<LoginResponse>('/auth/reissue', undefined, { skipAuth: true })
  tokenStorage.set(result.accessToken)
  return result
}

// 401을 받은 요청이 재발급 후 스스로 재시도할 수 있게 클라이언트에 연결한다.
setReissueHandler(reissue)

/** 마이페이지 프로필 (MY-01). 로그인 응답보다 넓어 진입 시 따로 받는다. */
export function getMe(): Promise<MyProfile> {
  if (env.useMock) return mockGetMe()
  return api.get<MyProfile>('/users/me')
}
