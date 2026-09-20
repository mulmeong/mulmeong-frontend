import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'

import { fetchPamphlets } from '@/features/map/api/pamphlets'

import type { Pamphlet } from '@/types/pamphlet'

type PamphletMenuProps = {
  id: string
  /** 세션 복원 중이면 로그인 안내를 보류한다. */
  authLoading: boolean
  signedIn: boolean
  activeId?: number
  onSelect: (pamphlet: Pamphlet) => void
}

/**
 * 지도 우측 상단 팜플렛 버튼의 내용. 로그인 안내·빈 상태·목록을 한 팝오버에서 다룬다.
 * 지도 위에 뜨므로 카드가 커지지 않게 폭과 높이를 묶어 둔다.
 */
export default function PamphletMenu({
  id,
  authLoading,
  signedIn,
  activeId,
  onSelect,
}: PamphletMenuProps) {
  const [state, setState] = useState<{ items?: Pamphlet[]; failed?: boolean }>({})

  useEffect(() => {
    if (!signedIn) return
    let cancelled = false
    fetchPamphlets()
      .then((page) => {
        if (!cancelled) setState({ items: page.content })
      })
      .catch(() => {
        if (!cancelled) setState({ failed: true })
      })
    return () => {
      cancelled = true
    }
  }, [signedIn])

  const title = `${id}-title`
  const frame =
    'border-border-default bg-surface absolute top-full right-0 z-10 mt-2 w-[248px] max-w-[calc(100vw-96px)] rounded-md border shadow-sm'

  if (authLoading) return null

  if (!signedIn) {
    return (
      <section id={id} aria-labelledby={title} className={`${frame} p-4`}>
        <h2 id={title} className="text-text-primary text-[14px] leading-5 font-medium">
          팜플렛을 사용하려면 로그인이 필요해요
        </h2>
        <p className="text-text-secondary mt-2 text-[12px] leading-5 break-keep">
          마음에 드는 장소를 모아두고 지도에서 한 번에 볼 수 있어요.
        </p>
        <Link
          to="/login"
          state={{ from: '/map' }}
          className="border-border-default text-text-primary mt-3 inline-flex h-8 items-center rounded-sm border px-3 text-[12px] font-medium hover:bg-surface-dim focus-visible:outline focus-visible:outline-2"
        >
          로그인
        </Link>
      </section>
    )
  }

  const items = state.items

  return (
    <section id={id} aria-labelledby={title} className={frame}>
      <div className="border-border-default/70 border-b px-4 pt-3.5 pb-3">
        <h2 id={title} className="text-text-primary text-[13px] leading-5 font-medium">
          내 팜플렛
        </h2>
        <p className="text-text-secondary mt-0.5 text-[11px] leading-4">
          지도에서 볼 팜플렛을 선택해요
        </p>
      </div>

      {state.failed ? (
        <p role="alert" className="text-text-secondary px-4 py-5 text-[12px] leading-5">
          팜플렛을 불러오지 못했어요.
        </p>
      ) : !items ? (
        <p className="text-text-secondary px-4 py-5 text-[12px] leading-5">불러오는 중…</p>
      ) : items.length === 0 ? (
        <div className="px-4 py-4">
          <p className="text-text-secondary text-[12px] leading-5 break-keep">
            아직 만든 팜플렛이 없어요. 마음에 드는 장소를 저장해 나만의 여행 목록을 만들어보세요.
          </p>
          <Link
            to="/my/saved"
            className="border-border-default text-text-primary mt-3 inline-flex h-8 items-center rounded-sm border px-3 text-[12px] font-medium hover:bg-surface-dim focus-visible:outline focus-visible:outline-2"
          >
            팜플렛 만들기
          </Link>
        </div>
      ) : (
        // 목록이 길어져도 지도를 덮지 않게 내부에서만 스크롤한다.
        <ul className="scrollbar-thin max-h-[264px] overflow-y-auto py-1.5">
          {items.map((pamphlet) => {
            const active = pamphlet.pamphletId === activeId
            return (
              <li key={pamphlet.pamphletId}>
                <button
                  type="button"
                  aria-pressed={active}
                  onClick={() => onSelect(pamphlet)}
                  className="hover:bg-surface-dim flex w-full items-center gap-2.5 px-4 py-2 text-left outline-none focus-visible:outline focus-visible:outline-2 focus-visible:-outline-offset-2"
                >
                  <span className="min-w-0 flex-1">
                    <span className="text-text-primary block truncate text-[13px] leading-5">
                      {pamphlet.title}
                    </span>
                    <span className="text-text-secondary block text-[11px] leading-4">
                      저장한 장소 {pamphlet.placeCount}곳
                      {pamphlet.regionName ? ` · ${pamphlet.regionName}` : ''}
                    </span>
                  </span>
                  {active && (
                    <svg
                      aria-hidden="true"
                      viewBox="0 0 16 16"
                      className="text-text-primary size-3.5 shrink-0"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="1.8"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <path d="m3 8.5 3.2 3.2L13 5" />
                    </svg>
                  )}
                </button>
              </li>
            )
          })}
        </ul>
      )}

      {activeId !== undefined && items?.length ? (
        <div className="border-border-default/70 border-t px-4 py-2.5">
          <button
            type="button"
            onClick={() => {
              const active = items.find((item) => item.pamphletId === activeId)
              if (active) onSelect(active)
            }}
            className="text-text-secondary hover:text-text-primary text-[12px] leading-4 outline-none focus-visible:underline"
          >
            지도에서 숨기기
          </button>
        </div>
      ) : null}
    </section>
  )
}
