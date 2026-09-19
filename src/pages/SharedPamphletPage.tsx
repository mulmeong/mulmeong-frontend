import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'

import { ApiError } from '@/api'
import { fetchSharedPamphlet } from '@/features/mypage/api/pamphlets'
import PamphletPreview from '@/features/mypage/components/PamphletPreview'
import '@/features/mypage/components/pamphlet.css'

import type { PamphletDetail } from '@/types/pamphlet'

/**
 * 공유 링크로 보는 팜플렛(PAM-08). 로그인 없이 열린다 (AUTH-02).
 *
 * 서버는 남의 팜플렛이면 pamphletId를 null로 내리므로 여기서는 쓰지 않는다.
 */
export default function SharedPamphletPage() {
  const { token } = useParams<{ token: string }>()
  const [detail, setDetail] = useState<PamphletDetail>()
  const [error, setError] = useState<string>()

  useEffect(() => {
    if (!token) return
    let alive = true
    fetchSharedPamphlet(token)
      .then((result) => {
        if (alive) setDetail(result)
      })
      .catch((cause) => {
        if (alive) {
          setError(
            cause instanceof ApiError && cause.status === 404
              ? '팜플렛을 찾을 수 없어요. 링크가 만료되었거나 삭제되었을 수 있습니다.'
              : '팜플렛을 불러오지 못했습니다.',
          )
        }
      })
    return () => {
      alive = false
    }
  }, [token])

  return (
    <main className="mx-auto w-full max-w-[720px] px-4 py-10">
      {error ? (
        <div className="py-20 text-center">
          <p role="alert" className="text-[15px]">
            {error}
          </p>
          <Link
            to="/"
            className="text-text-secondary mt-6 inline-flex min-h-11 items-center text-[13px] underline"
          >
            물멍 홈으로
          </Link>
        </div>
      ) : !detail ? (
        <p className="text-text-secondary py-20 text-center text-[13px]">불러오는 중…</p>
      ) : (
        <>
          <div className="border-border-default overflow-hidden rounded-sm border">
            <PamphletPreview detail={detail} />
          </div>
          <div className="mt-8 text-center">
            <p className="text-text-secondary text-[13px]">
              물멍에서 나만의 온천 여행 팜플렛을 만들어 보세요.
            </p>
            <Link
              to="/dart"
              className="border-border-strong mt-4 inline-flex min-h-11 items-center border px-5 text-[13px] font-medium"
            >
              다트 던지러 가기
            </Link>
          </div>
        </>
      )}
    </main>
  )
}
