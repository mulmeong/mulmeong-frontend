import { api } from '@/api'
import { env } from '@/lib/env'

import { mockUpdateMe, mockWithdraw } from './accountMock'

/**
 * MY-08 내 정보 수정. 닉네임과 비밀번호를 같은 엔드포인트로 보낸다.
 * 서버가 보낸 항목만 골라 처리하므로 한쪽만 채워 보낸다.
 */
export type UpdateMeRequest = {
  nickname?: string
  /** 백엔드 UpdateMeRequest가 확인 값까지 검증하므로 셋을 함께 보낸다. */
  currentPassword?: string
  newPassword?: string
  newPasswordConfirm?: string
}

export type UpdateMeResponse = {
  userId: number
  nickname: string | null
  nicknameChangedAt: string | null
  nicknameEditableAt: string | null
  passwordChanged: boolean
}

export function updateMe(body: UpdateMeRequest): Promise<UpdateMeResponse> {
  if (env.useMockAuth) return mockUpdateMe(body)
  return api.patch<UpdateMeResponse>('/users/me', body)
}

/** MY-10 회원 탈퇴. 되돌릴 수 없어 비밀번호로 한 번 더 확인한다. */
export function withdraw(password: string, reason?: string): Promise<void> {
  if (env.useMockAuth) return mockWithdraw(password)
  return api.delete<void>('/users/me', { body: { password, reason } })
}
