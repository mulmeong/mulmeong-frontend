import { ApiError } from '@/api'
import {
  MOCK_ACCOUNT,
  MOCK_PROFILE,
  MOCK_USER,
  mockCheckNickname,
  mockGetMe,
  mockLogout,
} from '@/features/auth/api/authMock'

import type { UpdateMeRequest, UpdateMeResponse } from './account'

const delay = <T>(value: T) => new Promise<T>((resolve) => setTimeout(() => resolve(value), 220))

/** 목은 서버 규칙만 흉내 낸다 — 중복 닉네임과 현재 비밀번호 불일치. */
export async function mockUpdateMe(body: UpdateMeRequest): Promise<UpdateMeResponse> {
  await mockGetMe()
  if (body.nickname) {
    if (!MOCK_PROFILE.nicknameEditable) {
      throw new ApiError(409, '닉네임은 한 달에 한 번만 변경할 수 있어요.')
    }
    const { available } = await mockCheckNickname(body.nickname)
    if (!available) throw new ApiError(409, '이미 사용 중인 닉네임입니다.')
    const changedAt = new Date()
    MOCK_USER.nickname = body.nickname
    MOCK_PROFILE.nickname = body.nickname
    MOCK_PROFILE.nicknameEditable = false
    MOCK_PROFILE.nicknameChangedAt = changedAt.toISOString()
    MOCK_PROFILE.nicknameEditableAt = new Date(
      changedAt.getTime() + 30 * 24 * 60 * 60 * 1000,
    ).toISOString()
  } else if (body.newPassword) {
    checkPassword(body.currentPassword)
    if (body.newPassword !== body.newPasswordConfirm) {
      throw new ApiError(400, '비밀번호가 일치하지 않습니다.', { code: 'PASSWORD_MISMATCH' })
    }
    MOCK_ACCOUNT.password = body.newPassword
  }
  return {
    userId: MOCK_USER.userId,
    nickname: body.nickname ? MOCK_PROFILE.nickname : null,
    nicknameChangedAt: body.nickname ? MOCK_PROFILE.nicknameChangedAt : null,
    nicknameEditableAt: body.nickname ? MOCK_PROFILE.nicknameEditableAt : null,
    passwordChanged: !!body.newPassword,
  }
}

function checkPassword(password: string | undefined) {
  if (password !== MOCK_ACCOUNT.password) {
    throw new ApiError(401, '현재 비밀번호가 올바르지 않습니다.', {
      code: 'CURRENT_PASSWORD_MISMATCH',
    })
  }
}

export async function mockWithdraw(password: string): Promise<void> {
  await delay(undefined)
  checkPassword(password)
  mockLogout()
}
