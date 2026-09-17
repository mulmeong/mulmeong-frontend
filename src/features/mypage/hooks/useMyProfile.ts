import { useEffect, useState } from 'react'

import { ApiError } from '@/api'
import { getMe } from '@/features/auth/api/auth'

import type { MyProfile } from '@/types/user'

/**
 * 마이페이지 프로필 (MY-01).
 *
 * 로그인 응답의 `user`는 닉네임·레벨·칭호뿐이라 통계가 없다 — 마이페이지에 들어올 때
 * 전체를 따로 받는다 (명세 비고).
 */
export function useMyProfile() {
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
  }, [])

  return { profile, loading, error }
}
