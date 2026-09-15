import type { ReactNode } from 'react'

import { cn } from '@/lib/cn'

type SpecRowProps = {
  label: string
  value: ReactNode
  /** 표의 마지막 행은 아래 선을 긋지 않는다. */
  divider?: boolean
  /** 시안: 수질 표는 15px, 운영 표는 14px */
  size?: 'md' | 'sm'
}

/** 라벨 96px + 값. 값이 여러 줄이어도 라벨과 첫 줄이 맞도록 baseline 정렬한다. */
export default function SpecRow({ label, value, divider = true, size = 'md' }: SpecRowProps) {
  return (
    <div className={cn('flex items-baseline py-3', divider && 'border-b border-[#E2E5E4]')}>
      <span className="w-24 shrink-0 text-[12.5px] font-normal text-[#8A9491]">{label}</span>
      <span
        className={cn(
          'min-w-0 flex-1 font-semibold text-[#0E1513]',
          size === 'md' ? 'text-[15px]' : 'text-[14px]',
        )}
      >
        {value}
      </span>
    </div>
  )
}
