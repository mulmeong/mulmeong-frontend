import { Navigate, Outlet, useLocation } from 'react-router-dom'

import { useAuth } from '@/features/auth/hooks/authContext'

/**
 * 로그인이 필요한 라우트를 감싼다 (AUTH-02 — 마이페이지 전체).
 * 밀려난 경로를 `state.from`으로 넘겨 로그인 후 그 자리로 돌려보낸다.
 */
export default function RequireAuth() {
  const { user, loading } = useAuth()
  const location = useLocation()

  // 세션 복원 중에 로그인 화면을 띄우면, 로그인한 사용자도 새로고침마다 깜빡인다.
  if (loading) return null

  if (!user) {
    return <Navigate to="/login" replace state={{ from: location.pathname + location.search }} />
  }

  return <Outlet />
}
