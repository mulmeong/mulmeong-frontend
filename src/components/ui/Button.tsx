import type { ButtonHTMLAttributes } from 'react'

import { cn } from '@/lib/cn'

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  /** large=풀와이드 CTA, medium=액션로우 버튼 */
  size?: 'medium' | 'large'
  hierarchy?: 'primary' | 'secondary'
  /** 요청 중. 자동으로 비활성화되고 스피너가 붙는다. */
  loading?: boolean
}

const hierarchyStyles = {
  primary: 'bg-inverse text-text-inverse',
  secondary: 'bg-surface text-text-primary border border-border-strong',
} as const

const sizeStyles = {
  medium: 'px-4 py-3 text-[14px] font-medium',
  large: 'px-6 py-[18px] text-[15px] font-semibold',
} as const

function Spinner() {
  return (
    <svg viewBox="0 0 16 16" aria-hidden="true" className="size-4 shrink-0 animate-spin">
      <circle cx="8" cy="8" r="6.5" fill="none" stroke="currentColor" strokeWidth="2" opacity="0.3" />
      <path
        d="M8 1.5a6.5 6.5 0 0 1 6.5 6.5"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
      />
    </svg>
  )
}

export default function Button({
  size = 'medium',
  hierarchy = 'primary',
  loading = false,
  disabled,
  className,
  type = 'button',
  children,
  ...props
}: ButtonProps) {
  return (
    <button
      type={type}
      // 요청 중 중복 제출을 막는다.
      disabled={disabled || loading}
      aria-busy={loading || undefined}
      className={cn(
        'inline-flex items-center justify-center gap-2 rounded-sm',
        // 피드백은 누르는 순간(:active)에 준다 — click까지 기다리면 반응이 없는 것처럼 느껴진다
        'transition-[opacity,transform] duration-100 ease-out active:not-disabled:scale-[0.97]',
        'motion-reduce:transition-none motion-reduce:active:not-disabled:scale-100',
        'outline-none focus-visible:ring-border-strong focus-visible:ring-2 focus-visible:ring-offset-2',
        'disabled:cursor-not-allowed disabled:opacity-40 hover:not-disabled:opacity-90',
        hierarchyStyles[hierarchy],
        sizeStyles[size],
        className,
      )}
      {...props}
    >
      {loading && <Spinner />}
      {children}
    </button>
  )
}
