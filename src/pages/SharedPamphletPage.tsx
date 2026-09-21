import { useEffect, useRef, useState, type MouseEvent } from 'react'
import { Link, useParams } from 'react-router-dom'

import { ApiError } from '@/api'
import { fetchOnsenDetail } from '@/features/map/api/onsenDetail'
import { fetchSharedPamphlet } from '@/features/mypage/api/pamphlets'
import PamphletReader from '@/features/mypage/components/PamphletReader'
import { toPamphletView, toPlaceSpec } from '@/features/mypage/data/pamphletView'

import type { PamphletPlaceSpec } from '@/features/mypage/data/pamphletView'
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
  /** 온천별 보강 정보. 팜플렛 응답에 없어 상세를 따로 받아 붙인다. */
  const [specs, setSpecs] = useState<Record<number, PamphletPlaceSpec>>({})
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

  // 온천만 상세가 있다. 실패해도 팜플렛은 그대로 보여준다 — 보강 정보일 뿐이다.
  useEffect(() => {
    if (!detail) return
    let alive = true
    const onsenIds = detail.places
      .filter((place) => place.placeType === 'ONSEN' || place.placeType === 'SPA')
      .map((place) => place.placeId)
    onsenIds.forEach((id) => {
      fetchOnsenDetail(id)
        .then((onsen) => {
          if (alive) setSpecs((current) => ({ ...current, [id]: toPlaceSpec(onsen) }))
        })
        .catch(() => {})
    })
    return () => {
      alive = false
    }
  }, [detail])

  // 공유 링크는 한 권만 보여주므로 표지 번호는 01로 고정한다.
  const base = detail ? toPamphletView(detail, '01') : undefined
  const view = base && {
    ...base,
    places: base.places.map((place) => ({ ...place, spec: specs[place.id] ?? place.spec })),
  }

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
      <p className="text-text-secondary text-[10px] tracking-[0.14em]">물멍 · 디지털 팜플렛</p>

      <div className="flex flex-1 flex-col items-center justify-center py-10 text-center">
        {!view ? (
          <p className="text-text-secondary text-[13px]">불러오는 중…</p>
        ) : (
          <>
            {/*
              팜플렛을 다 읽은 뒤의 마지막 장. 표지를 크게 띄우는 대신 물멍이
              어떤 서비스인지 조용히 남긴다. 표지는 '다시 펼쳐보기'가 대신한다.
            */}
            <p className="text-[19px] leading-[1.7] font-semibold tracking-[-0.03em] break-keep">
              좋은 물을 찾아,
              <br />
              작은 여행을 기록합니다.
            </p>
            <p className="text-text-secondary mt-5 text-[13px] leading-[1.9] break-keep">
              온천을 발견하고
              <br />
              나만의 여행을 엮어보세요.
            </p>
            <Link
              to="/"
              className="border-border-strong mt-9 inline-flex min-h-11 items-center border px-6 text-[13px] font-medium"
            >
              물멍 둘러보기 →
            </Link>
            <button
              ref={coverRef}
              type="button"
              onClick={(event: MouseEvent<HTMLButtonElement>) => setSource(event.currentTarget)}
              aria-haspopup="dialog"
              className="text-text-secondary hover:text-text-primary mt-4 inline-flex min-h-11 items-center text-[12px] underline underline-offset-4"
            >
              팜플렛 다시 펼쳐보기
            </button>
          </>
        )}
      </div>

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
