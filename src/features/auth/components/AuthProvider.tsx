import { useCallback, useEffect, useMemo, useState } from 'react'
import { Outlet } from 'react-router-dom'

import { tokenStorage, UNAUTHORIZED_EVENT } from '@/api'
import { getMe, login as loginRequest, logout as logoutRequest } from '@/features/auth/api/auth'
import { AuthContext } from '@/features/auth/hooks/authContext'

import type { LoginRequest } from '@/features/auth/schemas'
import type { User } from '@/types/user'

/**
 * 로그인 상태를 앱에 한 벌만 둔다. 모든 라우트를 감싸는 최상위 경계다.
 *
 * 토큰이 "있는지"가 아니라 `getMe()`가 통하는지로 판단한다 — localStorage에 만료된
 * 토큰이 남아 있어도 로그인으로 치면 마이페이지가 빈 화면으로 뜬다.
 *
 * 라우터 밖(`main.tsx`)이 아니라 안에 두는 이유: 아래에서 `useNavigate` 같은
 * 라우터 훅을 쓸 수 있어야 한다.
 */
export default function AuthProvider() {
  const [user, setUser] = useState<User>()
  // 토큰이 없으면 복원할 세션도 없다 — 처음부터 완료 상태로 시작한다.
  const [loading, setLoading] = useState(() => Boolean(tokenStorage.get()))

  useEffect(() => {
    if (!tokenStorage.get()) return

    let alive = true
    getMe()
      .then((me) => {
        if (alive) setUser(me)
      })
      .catch(() => {
        // 만료·폐기된 토큰이다. 남겨두면 매 요청마다 401을 부른다.
        tokenStorage.clear()
      })
      .finally(() => {
        if (alive) setLoading(false)
      })
    return () => {
      alive = false
    }
  }, [])

  // 토큰이 만료되면 API 레이어가 이미 토큰을 비웠다 — 화면의 로그인 상태도 같이 내린다.
  useEffect(() => {
    const handle = () => setUser(undefined)
    window.addEventListener(UNAUTHORIZED_EVENT, handle)
    return () => window.removeEventListener(UNAUTHORIZED_EVENT, handle)
  }, [])

  const login = useCallback(async (body: LoginRequest) => {
    const { user: next } = await loginRequest(body)
    setUser(next)
  }, [])

  const logout = useCallback(async () => {
    await logoutRequest()
    setUser(undefined)
  }, [])

  const value = useMemo(() => ({ user, loading, login, logout }), [user, loading, login, logout])

  return (
    <AuthContext value={value}>
      <Outlet />
    </AuthContext>
  )
}
