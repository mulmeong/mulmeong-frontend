import { useLocation, useNavigate } from 'react-router-dom'

import Modal from '@/components/ui/Modal'
import { useMagazineLike } from '@/features/magazine/hooks/useMagazineLike'
import { cn } from '@/lib/cn'

export default function MagazineLikeButton({
  magazineId,
  isLiked,
  likeCount,
}: {
  magazineId: number
  isLiked: boolean
  likeCount: number
}) {
  const like = useMagazineLike(magazineId, isLiked, likeCount)
  const navigate = useNavigate()
  const location = useLocation()

  return (
    <>
      <button
        type="button"
        onClick={like.toggle}
        disabled={like.disabled}
        aria-pressed={like.liked}
        aria-label={like.liked ? '좋아요 취소' : '좋아요'}
        className={cn(
          'flex size-10 items-center justify-center rounded-full border text-[15px] transition-colors outline-none disabled:opacity-50',
          like.liked
            ? 'bg-inverse text-text-inverse border-border-strong'
            : 'border-border-default text-text-primary hover:border-border-strong',
        )}
      >
        {like.liked ? '♥' : '♡'}
        <span className="ml-[2px] text-[9px]">{like.count}</span>
      </button>
      <Modal
        open={like.needsLogin}
        onClose={like.dismissLogin}
        title="로그인이 필요한 기능이에요"
        description="로그인하면 마음에 든 글에 좋아요를 남길 수 있어요."
        primaryAction={{
          label: '로그인',
          onClick: () => {
            like.dismissLogin()
            void navigate('/login', { state: { from: location.pathname + location.search } })
          },
        }}
        secondaryAction={{ label: '닫기', onClick: like.dismissLogin }}
      />
      <Modal
        open={!!like.error}
        onClose={like.dismissError}
        title="좋아요를 변경하지 못했어요"
        description={like.error}
        primaryAction={{ label: '확인', onClick: like.dismissError }}
      />
    </>
  )
}
