import type { ButtonHTMLAttributes } from 'react'

import { cn } from '@/lib/cn'

type TabProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  /** underline=매거진 카테고리, filled=마이페이지 세그먼트 */
  variant?: 'underline' | 'filled'
  selected?: boolean
}

export default function Tab({
  variant = 'underline',
  selected = false,
  className,
  type = 'button',
  ...props
}: TabProps) {
  const filled = variant === 'filled'
  return (
    <button
      type={type}
      role="tab"
      aria-selected={selected}
      className={cn(
        'text-[14px] whitespace-nowrap',
        filled
          ? cn(
              'border-border-default flex items-center justify-center border-r px-5 py-[14px]',
              selected
                ? 'bg-inverse text-text-inverse font-semibold'
                : 'bg-surface text-text-primary font-normal',
            )
          : cn(
              // 밑줄 굵기·간격을 조절하려면 text-decoration 대신 가상요소를 쓴다.
              'relative flex flex-col items-start pb-[7px]',
              selected
                ? 'text-text-primary after:bg-text-primary font-semibold after:absolute after:inset-x-0 after:bottom-0 after:h-[3px] after:rounded-full after:content-[""]'
                : 'text-text-secondary font-normal',
            ),
        className,
      )}
      {...props}
    />
  )
}
