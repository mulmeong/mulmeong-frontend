import { useRef, useState } from 'react'

import { ApiError } from '@/api'
import { setMagazineLike } from '@/features/magazine/api/magazine'
import { useAuth } from '@/features/auth/hooks/authContext'

/**
 * MAG-04 좋아요. 서버 값(isLiked/likeCount)을 시작점으로 두고 낙관적으로 뒤집은 뒤,
 * 실패하면 되돌린다 — 하트는 즉시 반응해야 해서 응답을 기다리지 않는다.
 */
export function useMagazineLike(magazineId: number, isLiked: boolean, likeCount: number) {
  const { user, loading: authLoading } = useAuth()
  const [pending, setPending] = useState(false)
  const [needsLogin, setNeedsLogin] = useState(false)
  const [error, setError] = useState<string>()

  /**
   * 낙관적 덮어쓰기는 서버 값 위에 얹는다. 서버 값이 바뀌면(다른 글로 이동, 상세 재조회)
   * 같이 기억해 둔 기준과 달라지므로 덮어쓰기를 버리고 서버 값을 그대로 쓴다.
   * effect로 동기화하면 한 프레임 동안 이전 글의 하트가 보인다.
   */
  const server = { liked: isLiked, count: likeCount }
  const [optimistic, setOptimistic] = useState<{
    base: { id: number; liked: boolean; count: number }
    value: { liked: boolean; count: number }
  }>()
  const fresh =
    optimistic &&
    optimistic.base.id === magazineId &&
    optimistic.base.liked === server.liked &&
    optimistic.base.count === server.count
  const state = fresh ? optimistic.value : server

  const inFlight = useRef(false)

  async function toggle() {
    if (!user) {
      setNeedsLogin(true)
      return
    }
    if (inFlight.current) return
    inFlight.current = true
    setPending(true)
    const base = { id: magazineId, liked: server.liked, count: server.count }
    const next = { liked: !state.liked, count: state.count + (state.liked ? -1 : 1) }
    setOptimistic({ base, value: next })
    try {
      await setMagazineLike(magazineId, next.liked)
    } catch (cause) {
      setOptimistic(undefined)
      if (cause instanceof ApiError && cause.status === 401) setNeedsLogin(true)
      else setError('좋아요를 변경하지 못했어요. 다시 시도해주세요.')
    } finally {
      inFlight.current = false
      setPending(false)
    }
  }

  return {
    liked: state.liked,
    count: state.count,
    disabled: authLoading || pending,
    needsLogin,
    dismissLogin: () => setNeedsLogin(false),
    error,
    dismissError: () => setError(undefined),
    toggle: () => void toggle(),
  }
}
