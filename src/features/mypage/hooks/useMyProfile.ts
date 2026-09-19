import { useCallback, useEffect, useState } from 'react'

import { ApiError } from '@/api'
import { getMe } from '@/features/auth/api/auth'

import type { MyProfile } from '@/types/user'

/**
 * 마이페이지 프로필 (MY-01).
 *
 * 로그인 응답의 `user`는 닉네임·레벨·칭호뿐이라 통계가 없다 — 마이페이지에 들어올 때
 * 전체를 따로 받는다 (명세 비고).
 *
 * reload는 리뷰를 지운 뒤에 쓴다. 삭제는 방문 인증 취소라 방문 온천 수·리뷰 수는
 * 물론 레벨까지 다시 계산된다(REV-05). 헤더가 탭 바깥에 있어 탭을 옮겨도 다시
 * 받아오지 않으므로, 지운 쪽에서 직접 불러줘야 숫자가 맞는다.
 */
export function useMyProfile() {
  const [attempt, setAttempt] = useState(0)
  const [profile, setProfile] = useState<MyProfile>()
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string>()

  useEffect(() => {
    let alive = true
    getMe()
      .then((me) => {
        if (alive) setProfile(me)
      })
      .catch((err) => {
        if (alive) setError(err instanceof ApiError ? err.message : '프로필을 불러오지 못했습니다.')
      })
      .finally(() => {
        if (alive) setLoading(false)
      })
    return () => {
      alive = false
    }
  }, [attempt])

  const reload = useCallback(() => setAttempt((count) => count + 1), [])

  return { profile, loading, error, reload }
}
