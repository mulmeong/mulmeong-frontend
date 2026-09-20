import { cn } from '@/lib/cn'

type MagazineRefreshButtonProps = {
  spinning: boolean
  disabled?: boolean
  onClick: () => void
}

export default function MagazineRefreshButton({
  spinning,
  disabled = false,
  onClick,
}: MagazineRefreshButtonProps) {
  return (
    <button
      type="button"
      aria-label="다른 매거진 보기"
      title="다른 매거진 보기"
      disabled={disabled}
      onClick={onClick}
      className="text-text-secondary hover:bg-surface-dim hover:text-text-primary inline-flex size-7 shrink-0 items-center justify-center rounded-full transition-colors outline-none focus-visible:ring-2 focus-visible:ring-border-strong disabled:pointer-events-none disabled:opacity-30"
    >
      <svg
        aria-hidden="true"
        viewBox="0 0 16 16"
        fill="none"
        className={cn('size-3.5', spinning && 'motion-safe:animate-[spin_420ms_linear_1]')}
      >
        <path
          d="M13 7.2a5 5 0 1 0-1.5 3.6M13 7.2V3.8m0 3.4H9.6"
          stroke="currentColor"
          strokeWidth="1.35"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    </button>
  )
}
