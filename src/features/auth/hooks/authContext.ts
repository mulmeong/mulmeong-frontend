import { createContext, useContext } from 'react'

import type { LoginRequest } from '@/features/auth/schemas'
import type { AuthUser } from '@/types/user'

export type AuthState = {
  user?: AuthUser
  /** 첫 세션 복원이 끝나기 전. 이때 로그인 여부로 화면을 가르면 깜빡인다. */
  loading: boolean
  login: (body: LoginRequest) => Promise<void>
  logout: () => Promise<void>
}

/** Provider와 분리해 둔다 — 컴포넌트 파일이 값까지 내보내면 Fast Refresh가 깨진다. */
export const AuthContext = createContext<AuthState | undefined>(undefined)

export function useAuth(): AuthState {
  const context = useContext(AuthContext)
  if (!context) throw new Error('useAuth는 AuthProvider 안에서만 쓸 수 있습니다.')
  return context
}
