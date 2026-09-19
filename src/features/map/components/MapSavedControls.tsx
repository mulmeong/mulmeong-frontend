import { useEffect, useId, useRef, useState } from 'react'
import { Link } from 'react-router-dom'

import { useAuth } from '@/features/auth/hooks/authContext'
import PamphletMenu from '@/features/map/components/PamphletMenu'

import type { Pamphlet } from '@/types/pamphlet'

export default function MapSavedControls({
  showingSaved = false,
  onToggleSaved,
  activePamphlet,
  onSelectPamphlet,
}: {
  showingSaved?: boolean
  onToggleSaved: () => void
  /** 지도에 띄워 둔 팜플렛. 드롭다운 열림 상태와 따로 관리한다. */
  activePamphlet?: Pamphlet
  onSelectPamphlet: (pamphlet: Pamphlet) => void
}) {
  const { user, loading } = useAuth()
  const [open, setOpen] = useState<'pamphlets' | 'saved'>()
  const rootRef = useRef<HTMLElement>(null)
  const triggerRef = useRef<HTMLButtonElement | null>(null)
  const id = useId()

  useEffect(() => {
    if (!open) return
    // 찜은 안내만 띄우면 되므로, 세션 복원이 끝나고 로그인돼 있으면 바로 동작시킨다.
    if (open === 'saved' && !loading && user) {
      setOpen(undefined)
      onToggleSaved()
      return
    }
    const outside = (event: PointerEvent) => {
      if (event.target instanceof Node && !rootRef.current?.contains(event.target))
        setOpen(undefined)
    }
    const escape = (event: KeyboardEvent) => {
      if (event.key !== 'Escape') return
      setOpen(undefined)
      triggerRef.current?.focus()
    }
    document.addEventListener('pointerdown', outside)
    document.addEventListener('keydown', escape)
    return () => {
      document.removeEventListener('pointerdown', outside)
      document.removeEventListener('keydown', escape)
    }
  }, [open, loading, user, onToggleSaved])

  const buttonClass = (position: 'left' | 'right', on: boolean) =>
    `text-text-primary inline-flex h-full items-center justify-center gap-1 px-2.5 text-[12px] leading-4 whitespace-nowrap hover:bg-surface-dim focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 ${position === 'left' ? 'rounded-l-md' : 'rounded-r-md'} ${on ? 'bg-surface-dim font-semibold' : ''}`

  return (
    <nav
      ref={rootRef}
      aria-label="저장한 장소"
      className="border-border-default/70 bg-surface pointer-events-auto flex h-8 shrink-0 items-center rounded-md border"
    >
      <div className="relative flex h-full items-center">
        <button
          type="button"
          aria-expanded={open === 'pamphlets'}
          aria-controls={open === 'pamphlets' ? `${id}-pamphlets` : undefined}
          onClick={(event) => {
            triggerRef.current = event.currentTarget
            setOpen((current) => (current === 'pamphlets' ? undefined : 'pamphlets'))
          }}
          className={buttonClass('left', activePamphlet !== undefined)}
        >
          팜플렛
          {/* 버튼을 늘리지 않으면서 무언가 띄워 둔 상태임을 알린다. */}
          {activePamphlet && (
            <span aria-hidden="true" className="bg-inverse size-1.5 shrink-0 rounded-full" />
          )}
          {activePamphlet && <span className="sr-only">{activePamphlet.title} 표시 중</span>}
        </button>
        {open === 'pamphlets' && (
          <PamphletMenu
            id={`${id}-pamphlets`}
            authLoading={loading}
            signedIn={!!user}
            activeId={activePamphlet?.pamphletId}
            onSelect={(pamphlet) => {
              setOpen(undefined)
              onSelectPamphlet(pamphlet)
            }}
          />
        )}
      </div>

      <span aria-hidden="true" className="bg-border-default/70 h-3 w-px shrink-0" />

      <div className="relative flex h-full items-center">
        <button
          type="button"
          aria-expanded={open === 'saved'}
          aria-pressed={showingSaved}
          aria-controls={open === 'saved' ? `${id}-saved` : undefined}
          onClick={(event) => {
            if (user && !loading) {
              onToggleSaved()
              return
            }
            triggerRef.current = event.currentTarget
            setOpen((current) => (current === 'saved' ? undefined : 'saved'))
          }}
          className={buttonClass('right', showingSaved)}
        >
          <span aria-hidden="true">{showingSaved ? '♥' : '♡'}</span>찜
        </button>
        {open === 'saved' && !loading && !user && (
          <section
            id={`${id}-saved`}
            aria-labelledby={`${id}-saved-title`}
            className="border-border-default bg-surface absolute top-full right-0 z-10 mt-2 w-[240px] max-w-[calc(100vw-96px)] rounded-md border p-4 shadow-sm"
          >
            <h2
              id={`${id}-saved-title`}
              className="text-text-primary text-[14px] leading-5 font-medium"
            >
              로그인이 필요한 기능이에요
            </h2>
            <p className="text-text-secondary mt-2 text-[12px] leading-5 break-keep">
              로그인하면 마음에 드는 장소를 찜할 수 있어요.
            </p>
            <Link
              to="/login"
              state={{ from: '/map?saved=1' }}
              className="border-border-default text-text-primary mt-3 inline-flex h-8 items-center rounded-sm border px-3 text-[12px] font-medium hover:bg-surface-dim focus-visible:outline focus-visible:outline-2"
            >
              로그인
            </Link>
          </section>
        )}
      </div>
    </nav>
  )
}
