import { useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'

import { ApiError } from '@/api'
import Modal from '@/components/ui/Modal'
import { useAuth } from '@/features/auth/hooks/authContext'
import { cn } from '@/lib/cn'
import { useFavorites } from './FavoritesProvider'
import type { FavoriteRequest } from './api'

export default function FavoriteButton({ target, name, label, className, onSaved }: {
  target: FavoriteRequest
  name: string
  label?: string
  className?: string
  onSaved?: () => void
}) {
  const { user, loading: authLoading } = useAuth()
  const favorites = useFavorites()
  const navigate = useNavigate()
  const location = useLocation()
  const [loginOpen, setLoginOpen] = useState(false)
  const [error, setError] = useState<string>()
  const saved = !!user && !!favorites.state(target)?.saved
  const pending = favorites.pending(target)

  async function toggle() {
    if (!user) { setLoginOpen(true); return }
    if (favorites.error) { setError(favorites.error); await favorites.reload(); return }
    try {
      const added = await favorites.toggle(target)
      if (added) onSaved?.()
    } catch (cause) {
      if (cause instanceof ApiError && cause.status === 401) setLoginOpen(true)
      else setError(cause instanceof Error ? cause.message : '찜을 변경하지 못했어요. 다시 시도해주세요.')
    }
  }

  return <>
    <button
      type="button"
      aria-label={`${name} ${saved ? '찜 해제' : '찜하기'}`}
      aria-pressed={saved}
      disabled={authLoading || pending || (!!user && favorites.loading)}
      title={favorites.error ? '찜 상태 다시 불러오기' : saved ? '찜 해제' : '찜하기'}
      onClick={(event) => { event.stopPropagation(); void toggle() }}
      className={cn('text-text-primary inline-flex size-8 shrink-0 items-center justify-center gap-2 rounded-sm hover:bg-surface-dim focus-visible:outline focus-visible:outline-2 disabled:opacity-50', className)}
    >
      <svg aria-hidden="true" viewBox="0 0 24 24" className="size-5 shrink-0" fill={saved ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78Z" />
      </svg>
      {label && (saved ? '찜 해제' : label)}
    </button>
    <Modal open={loginOpen} onClose={() => setLoginOpen(false)} title="로그인이 필요한 기능이에요"
      description="로그인하면 마음에 드는 장소를 찜할 수 있어요."
      primaryAction={{ label: '로그인', onClick: () => { setLoginOpen(false); void navigate('/login', { state: { from: location.pathname + location.search } }) } }}
      secondaryAction={{ label: '닫기', onClick: () => setLoginOpen(false) }} />
    <Modal open={!!error} onClose={() => setError(undefined)} title="찜을 변경하지 못했어요" description={error}
      primaryAction={{ label: '확인', onClick: () => setError(undefined) }} />
  </>
}
