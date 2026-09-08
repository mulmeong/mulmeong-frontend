import type { ButtonHTMLAttributes } from 'react'

import { cn } from '@/lib/cn'

type ChipProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  selected?: boolean
}

export default function Chip({
  selected = false,
  className,
  type = 'button',
  ...props
}: ChipProps) {
  return (
    <button
      type={type}
      aria-pressed={selected}
      className={cn(
        'inline-flex items-center justify-center rounded-full px-[14px] py-2 text-[13px] font-medium',
        selected
          ? 'bg-inverse text-text-inverse'
          : 'bg-surface text-text-primary border border-border-strong',
        className,
      )}
      {...props}
    />
  )
}
