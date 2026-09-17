import { useNavigate } from 'react-router-dom'

import Header from '@/components/ui/Header'
import { useAuth } from '@/features/auth/hooks/authContext'

import type { ComponentProps } from 'react'

type AuthHeaderProps = Omit<ComponentProps<typeof Header>, 'authLabel' | 'onAuthClick'>

/**
 * `Header`(순수 UI)에 로그인 상태를 붙이는 얇은 컨테이너.
 * 헤더가 도메인을 알면 안 되므로 라벨·동작만 여기서 정해 넘긴다.
 */
export default function AuthHeader(props: AuthHeaderProps) {
  const navigate = useNavigate()
  const { user, logout } = useAuth()

  async function handleClick() {
    if (!user) {
      navigate('/login')
      return
    }
    await logout()
    // 보호된 화면에 머무르면 RequireAuth가 곧바로 로그인으로 밀어낸다. 홈으로 보낸다.
    navigate('/', { replace: true })
  }

  return <Header {...props} authLabel={user ? '로그아웃' : '로그인'} onAuthClick={handleClick} />
}
