import { useCallback, useEffect, useMemo, useState } from 'react'
import { Outlet } from 'react-router-dom'

import { UNAUTHORIZED_EVENT } from '@/api'
import { login as loginRequest, logout as logoutRequest, reissue } from '@/features/auth/api/auth'
import { AuthContext } from '@/features/auth/hooks/authContext'
import FavoritesProvider from '@/features/favorites/FavoritesProvider'

import type { LoginRequest } from '@/features/auth/schemas'
import type { AuthUser } from '@/types/user'

/**
 * 로그인 상태를 앱에 한 벌만 둔다. 모든 라우트를 감싸는 최상위 경계다.
 *
 * 세션의 근거는 Access Token이 아니라 **Refresh 쿠키**다 — 첫 진입에 `/auth/reissue`를
 * 불러 복원한다. Access는 30분이라 새로고침 시점엔 이미 만료됐을 수 있고, 쿠키는
 * HttpOnly라 JS가 미리 볼 수 없어 "있는지" 확인 없이 그냥 호출한다 (명세 AUTH-01).
 *
 * 라우터 밖(`main.tsx`)이 아니라 안에 두는 이유: 아래에서 `useNavigate` 같은
 * 라우터 훅을 쓸 수 있어야 한다.
 */
export default function AuthProvider() {
  const [user, setUser] = useState<AuthUser>()
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let alive = true
    reissue()
      .then(({ user: next }) => {
        if (alive) setUser(next)
      })
      // 쿠키가 없거나 만료됐다 = 비로그인. 화면을 막지 않는다 (AUTH-02).
      .catch(() => {})
      .finally(() => {
        if (alive) setLoading(false)
      })
    return () => {
      alive = false
    }
  }, [])

  // 재발급까지 실패한 401이다 (API 레이어가 이미 토큰을 비웠다).
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
      <FavoritesProvider>
        <Outlet />
      </FavoritesProvider>
    </AuthContext>
  )
}
