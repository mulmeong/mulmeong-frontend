import type { ButtonHTMLAttributes } from 'react'

import { cn } from '@/lib/cn'

type ChipProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  selected?: boolean
  /**
   * 'outline' — 칩마다 테두리가 있다. 온천 카드의 태그처럼 고르는 게 아니라
   * 늘어놓기만 할 때 쓴다. 고른 상태가 없으면 테두리가 있어야 칩으로 보인다.
   * 'plain' — 고른 것만 칠하고 나머지는 글자만 둔다. 지도 사이드바의 지역
   * 고르기(MapSidebar)와 같은 모양이다. 줄이 여럿일 때 테두리가 겹겹이 쌓이지
   * 않아 목록이 덜 시끄럽다.
   */
  variant?: 'outline' | 'plain'
}

export default function Chip({
  selected = false,
  variant = 'outline',
  className,
  type = 'button',
  ...props
}: ChipProps) {
  const plain = variant === 'plain'

  return (
    <button
      type={type}
      aria-pressed={selected}
      className={cn(
        'inline-flex items-center justify-center rounded-full text-[13px] transition-colors',
        plain ? 'px-3 py-1.5' : 'px-[14px] py-2 font-medium',
        // 테두리가 없으면 포커스가 어디 있는지 보이지 않는다.
        plain &&
          'outline-none focus-visible:ring-2 focus-visible:ring-border-strong focus-visible:ring-offset-2',
        plain && selected && 'bg-inverse text-text-inverse font-medium',
        plain && !selected && 'text-text-primary hover:bg-surface-dim',
        !plain && selected && 'bg-inverse text-text-inverse',
        !plain && !selected && 'bg-surface text-text-primary border border-border-strong',
        className,
      )}
      {...props}
    />
  )
}
