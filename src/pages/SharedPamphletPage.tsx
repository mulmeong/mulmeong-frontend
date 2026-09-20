import { useEffect, useRef, useState, type MouseEvent } from 'react'
import { Link, useParams } from 'react-router-dom'

import { ApiError } from '@/api'
import PamphletCover from '@/features/mypage/components/PamphletCover'
import { fetchSharedPamphlet } from '@/features/mypage/api/pamphlets'
import PamphletReader from '@/features/mypage/components/PamphletReader'
import { toPamphletView } from '@/features/mypage/data/pamphletView'
import '@/features/mypage/components/pamphlet.css'

import type { PamphletDetail } from '@/types/pamphlet'

/**
 * 공유 링크로 받은 팜플렛 한 권(PAM-08). 로그인 없이 열린다 (AUTH-02).
 *
 * 화면 전체가 팜플렛이다 — 글로벌 헤더를 쓰지 않으려고 라우터에서 RootLayout
 * 밖에 두었다. 접힌 표지를 누르면 목록에서와 같은 리더가 열리고, 닫으면 다시
 * 접힌 표지로 돌아온다.
 *
 * 서버는 남의 팜플렛이면 pamphletId를 null로 내리므로 여기서는 쓰지 않는다.
 */
export default function SharedPamphletPage() {
  const { token } = useParams<{ token: string }>()
  const [detail, setDetail] = useState<PamphletDetail>()
  const [error, setError] = useState<string>()
  /** 표지를 눌러 연 상태. 리더는 열릴 때 붙고 닫히면 떨어진다. */
  const [source, setSource] = useState<HTMLButtonElement>()
  const coverRef = useRef<HTMLButtonElement>(null)
  /** 처음 한 번은 사용자가 누르지 않아도 펼친다 — 받은 팜플렛을 바로 보여준다. */
  const opened = useRef(false)

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

  // 표지가 놓인 자리에서 펼쳐지도록, 표지가 그려진 뒤에 리더를 붙인다.
  useEffect(() => {
    if (!detail || opened.current || !coverRef.current) return
    opened.current = true
    setSource(coverRef.current)
  }, [detail])

  // 공유 링크는 한 권만 보여주므로 표지 번호는 01로 고정한다.
  const view = detail ? toPamphletView(detail, '01') : undefined

  if (error) {
    return (
      <main className="flex min-h-dvh flex-col items-center justify-center px-6 text-center">
        <p role="alert" className="text-[15px]">
          {error}
        </p>
        <Link
          to="/"
          className="text-text-secondary mt-6 inline-flex min-h-11 items-center text-[13px] underline underline-offset-4"
        >
          물멍 홈으로
        </Link>
      </main>
    )
  }

  return (
    <main className="flex min-h-dvh flex-col px-6 py-8">
      <p className="text-text-secondary text-[10px] tracking-[0.14em]">
        MULMEONG · DIGITAL PAMPHLET
      </p>

      <div className="flex flex-1 items-center justify-center py-10">
        {!view ? (
          <p className="text-text-secondary text-[13px]">불러오는 중…</p>
        ) : (
          <button
            ref={coverRef}
            type="button"
            onClick={(event: MouseEvent<HTMLButtonElement>) => setSource(event.currentTarget)}
            className="pamphlet-card w-[min(260px,72vw)]"
            data-reading={source ? true : undefined}
            aria-haspopup="dialog"
            aria-label={`${view.title}, ${view.places.length}곳, 팜플렛 펼치기`}
          >
            <PamphletCover
              number={view.number}
              title={view.title}
              placeCount={view.places.length}
              createdAt={view.createdAt}
            />
          </button>
        )}
      </div>

      <Link
        to="/dart"
        className="text-text-secondary hover:text-text-primary mx-auto inline-flex min-h-11 items-center text-[12px]"
      >
        나도 여행 팜플렛 만들기 →
      </Link>

      {view && source && (
        <PamphletReader
          pamphlet={view}
          source={source}
          fromCard
          onClose={() => setSource(undefined)}
        />
      )}
    </main>
  )
}
