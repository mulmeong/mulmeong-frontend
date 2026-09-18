import { cn } from '@/lib/cn'
export default function MagazineImage({
  src,
  className,
  eager = false,
}: {
  src?: string | null
  className?: string
  eager?: boolean
}) {
  return (
    <div className={cn('bg-surface-dim relative overflow-hidden', className)}>
      <div
        aria-hidden
        className="text-text-secondary absolute inset-0 flex items-center justify-center text-[11px] tracking-[0.25em]"
      >
        MULMEONG
      </div>
      {src && (
        <img
          key={src}
          src={src}
          alt=""
          loading={eager ? 'eager' : 'lazy'}
          onError={(event) => {
            event.currentTarget.style.visibility = 'hidden'
          }}
          className="absolute inset-0 size-full object-cover transition-transform duration-700 group-hover:scale-[1.025]"
        />
      )}
    </div>
  )
}
