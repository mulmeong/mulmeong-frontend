import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'

import { ApiError } from '@/api'
import { fetchSharedPamphlet } from '@/features/mypage/api/pamphlets'
import PamphletReader from '@/features/mypage/components/PamphletReader'
import { toPamphletView } from '@/features/mypage/data/pamphletView'
import '@/features/mypage/components/pamphlet.css'

import type { PamphletDetail } from '@/types/pamphlet'

/**
 * 공유 링크로 보는 팜플렛(PAM-08). 로그인 없이 열린다 (AUTH-02).
 *
 * 목록에서 표지를 눌렀을 때와 같은 리더를 그대로 쓴다 — 공유 전용 화면을 따로
 * 두지 않는다. 리더는 마운트되는 순간 펼침 애니메이션을 시작하므로, 상세가
 * 도착한 뒤에 처음 붙여야 애니메이션이 생략되지 않는다.
 *
 * 서버는 남의 팜플렛이면 pamphletId를 null로 내리므로 여기서는 쓰지 않는다.
 */
export default function SharedPamphletPage() {
  const { token } = useParams<{ token: string }>()
  const [detail, setDetail] = useState<PamphletDetail>()
  const [error, setError] = useState<string>()
  /** 닫으면 리더를 걷어낸다. 공유 페이지에는 돌아갈 목록이 없어 안내만 남긴다. */
  const [closed, setClosed] = useState(false)

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

  // 공유 링크는 한 권만 보여주므로 표지 번호는 01로 고정한다.
  const view = detail ? toPamphletView(detail, '01') : undefined

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
      ) : !view ? (
        <p className="text-text-secondary py-20 text-center text-[13px]">불러오는 중…</p>
      ) : (
        <div className="py-20 text-center">
          <p className="text-[15px] font-semibold">{view.title}</p>
          <p className="text-text-secondary mt-2 text-[13px]">
            {closed ? '팜플렛을 닫았어요.' : '팜플렛을 펼치고 있어요…'}
          </p>
          {closed && (
            <button
              type="button"
              onClick={() => setClosed(false)}
              className="border-border-strong mt-4 inline-flex min-h-11 items-center border px-5 text-[13px] font-medium"
            >
              다시 펼쳐보기
            </button>
          )}
          <div className="mt-10">
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
        </div>
      )}

      {/* 상세가 온 뒤에 붙는다 — 미리 마운트하면 접힌 상태에서 시작하지 못한다. */}
      {view && !closed && (
        <PamphletReader pamphlet={view} fromCard={false} onClose={() => setClosed(true)} />
      )}
    </main>
  )
}
