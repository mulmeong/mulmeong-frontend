import type { ReactNode } from 'react'

import { cn } from '@/lib/cn'

type BadgeProps = {
  /** level=검정 pill(레벨 표시), category=아웃라인(찜 목록 카테고리 태그) */
  type?: 'level' | 'category'
  children: ReactNode
  className?: string
}

export default function Badge({ type = 'level', children, className }: BadgeProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center justify-center px-2 py-[3px]',
        type === 'level'
          ? 'bg-inverse text-text-inverse rounded-full text-[10px] font-semibold'
          : 'border-border-default text-text-primary rounded-sm border text-[11px]',
        className,
      )}
    >
      {children}
    </span>
  )
}
