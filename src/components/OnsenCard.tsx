import Chip from '@/components/ui/Chip'
import { cn } from '@/lib/cn'

import type { Onsen } from '@/types/onsen'

type OnsenCardProps = {
  onsen: Onsen
  /** 목록 행에 붙는 거리(km). 없으면 표시하지 않는다. */
  distanceKm?: number
  /** row=목록 한 줄, card=마커 클릭 시 뜨는 카드 */
  variant?: 'row' | 'card'
  onClick?: () => void
  selected?: boolean
  className?: string
}

/**
 * MAP-02 마커→카드와 DART-04 다트 결과 카드가 함께 쓰는 컴포넌트.
 * 명세에 동일 컴포넌트 재사용이 명시되어 있어 처음부터 공용에 둔다.
 */
export default function OnsenCard({
  onsen,
  distanceKm,
  variant = 'row',
  onClick,
  selected,
  className,
}: OnsenCardProps) {
  const { name, address, imageUrl, rating, reviewCount, tags } = onsen

  if (variant === 'row') {
    return (
      <button
        type="button"
        onClick={onClick}
        aria-current={selected || undefined}
        className={cn(
          'flex w-full items-baseline justify-between gap-3 py-[11px] text-left',
          'outline-none focus-visible:underline focus-visible:underline-offset-2',
          className,
        )}
      >
        <span
          className={cn(
            'text-text-primary min-w-0 truncate text-[14px]',
            selected ? 'font-bold' : 'font-semibold',
          )}
        >
          {name}
        </span>
        {distanceKm !== undefined && (
          <span className="text-text-secondary shrink-0 text-[13px]">
            {distanceKm.toFixed(1)}km
          </span>
        )}
      </button>
    )
  }

  return (
    <div className={cn('bg-surface w-[260px] overflow-hidden rounded-md shadow-lg', className)}>
      {imageUrl && <img src={imageUrl} alt="" className="h-[120px] w-full object-cover" />}
      <div className="p-4">
        <p className="text-text-primary text-[15px] font-bold">{name}</p>
        <p className="text-text-secondary mt-1 text-[12px]">
          {rating ? `★ ${rating.toFixed(1)} (${reviewCount}) · ` : ''}
          {address}
        </p>
        {tags.length > 0 && (
          <div className="mt-3 flex flex-wrap gap-1.5">
            {tags.map((tag) => (
              <Chip key={tag}>{tag}</Chip>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
