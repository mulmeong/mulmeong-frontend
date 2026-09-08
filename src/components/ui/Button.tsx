import type { ButtonHTMLAttributes } from 'react'

import { cn } from '@/lib/cn'

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  /** large=풀와이드 CTA, medium=액션로우 버튼 */
  size?: 'medium' | 'large'
  hierarchy?: 'primary' | 'secondary'
}

const hierarchyStyles = {
  primary: 'bg-inverse text-text-inverse',
  secondary: 'bg-surface text-text-primary border border-border-strong',
} as const

const sizeStyles = {
  medium: 'px-4 py-3 text-[14px] font-medium',
  large: 'px-6 py-[18px] text-[15px] font-semibold',
} as const

export default function Button({
  size = 'medium',
  hierarchy = 'primary',
  className,
  type = 'button',
  ...props
}: ButtonProps) {
  return (
    <button
      type={type}
      className={cn(
        'inline-flex items-center justify-center rounded-sm transition-opacity',
        'disabled:cursor-not-allowed disabled:opacity-40 hover:not-disabled:opacity-90',
        hierarchyStyles[hierarchy],
        sizeStyles[size],
        className,
      )}
      {...props}
    />
  )
}
