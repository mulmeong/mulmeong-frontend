import { useEffect, useId, useRef, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'

import { useAuth } from '@/features/auth/hooks/authContext'

const ACTIONS = [
  {
    id: 'pamphlets',
    label: '팜플렛',
    to: '/my/pamphlets',
    description: '로그인하면 찜한 장소를 팜플렛으로 엮어둘 수 있어요.',
  },
  {
    id: 'saved',
    label: '찜',
    to: '/my/saved',
    description: '로그인하면 마음에 드는 장소를 찜할 수 있어요.',
  },
] as const

export default function MapSavedControls({
  showingSaved = false,
  onToggleSaved,
}: {
  showingSaved?: boolean
  onToggleSaved: () => void
}) {
  const { user, loading } = useAuth()
  const navigate = useNavigate()
  const [open, setOpen] = useState<string>()
  const rootRef = useRef<HTMLElement>(null)
  const triggerRef = useRef<HTMLButtonElement | null>(null)
  const id = useId()

  useEffect(() => {
    if (!open) return
    // 세션 복원이 끝날 때까지 안내를 보류하고 인증된 사용자는 원래 목적지로 보낸다.
    if (!loading && user) {
      const action = ACTIONS.find((item) => item.id === open)
      setOpen(undefined)
      if (action?.id === 'saved') onToggleSaved()
      else if (action) navigate(action.to)
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
  }, [open, loading, user, navigate, onToggleSaved])

  return (
    <nav
      ref={rootRef}
      aria-label="저장한 장소"
      className="border-border-default/70 bg-surface pointer-events-auto flex h-8 shrink-0 items-center rounded-md border"
    >
      {ACTIONS.map((action, index) => {
        const visible = open === action.id && !loading && !user
        return (
          <div key={action.id} className="relative flex h-full items-center">
            {index > 0 && (
              <span aria-hidden="true" className="bg-border-default/70 h-3 w-px shrink-0" />
            )}
            <button
              type="button"
              aria-expanded={visible}
              aria-pressed={action.id === 'saved' ? showingSaved : undefined}
              aria-controls={visible ? `${id}-${action.id}` : undefined}
              onClick={(event) => {
                if (user && !loading) {
                  if (action.id === 'saved') onToggleSaved()
                  else navigate(action.to)
                  return
                }
                triggerRef.current = event.currentTarget
                setOpen((current) => (current === action.id ? undefined : action.id))
              }}
              className={`text-text-primary inline-flex h-full items-center justify-center gap-1 px-2.5 text-[12px] leading-4 whitespace-nowrap hover:bg-surface-dim focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 ${index === 0 ? 'rounded-l-md' : 'rounded-r-md'} ${action.id === 'saved' && showingSaved ? 'bg-surface-dim font-semibold' : ''}`}
            >
              {action.id === 'saved' && <span aria-hidden="true">{showingSaved ? '♥' : '♡'}</span>}
              {action.label}
            </button>
            {visible && (
              <section
                id={`${id}-${action.id}`}
                aria-labelledby={`${id}-${action.id}-title`}
                className="border-border-default bg-surface absolute top-full right-0 z-10 mt-2 w-[240px] max-w-[calc(100vw-96px)] rounded-md border p-4"
              >
                <h2
                  id={`${id}-${action.id}-title`}
                  className="text-text-primary text-[14px] leading-5 font-medium"
                >
                  로그인이 필요한 기능이에요
                </h2>
                <p className="text-text-secondary mt-2 text-[12px] leading-5 break-keep">
                  {action.description}
                </p>
                <Link
                  to="/login"
                  state={{ from: action.id === 'saved' ? '/map?saved=1' : action.to }}
                  className="border-border-default text-text-primary mt-3 inline-flex h-8 items-center rounded-sm border px-3 text-[12px] font-medium hover:bg-surface-dim focus-visible:outline focus-visible:outline-2"
                >
                  로그인
                </Link>
              </section>
            )}
          </div>
        )
      })}
    </nav>
  )
}
