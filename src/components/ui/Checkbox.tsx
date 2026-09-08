import type { InputHTMLAttributes } from 'react'

import { cn } from '@/lib/cn'

type CheckboxProps = Omit<InputHTMLAttributes<HTMLInputElement>, 'type' | 'size'> & {
  label?: string
}

export default function Checkbox({ label, className, ...props }: CheckboxProps) {
  const box = (
    <span className="relative inline-flex size-[18px] shrink-0">
      <input
        type="checkbox"
        className={cn(
          'peer border-border-strong bg-surface size-full appearance-none rounded-[4px] border',
          'checked:bg-inverse checked:border-inverse',
          'disabled:cursor-not-allowed disabled:opacity-40',
          className,
        )}
        {...props}
      />
      <svg
        viewBox="0 0 12 12"
        aria-hidden="true"
        className="text-text-inverse pointer-events-none absolute inset-0 m-auto hidden size-3 peer-checked:block"
      >
        <path
          d="M2.5 6.2 4.8 8.5 9.5 3.8"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.8"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    </span>
  )

  if (!label) return box

  return (
    <label className="inline-flex cursor-pointer items-center gap-2">
      {box}
      <span className="text-text-primary text-[13px]">{label}</span>
    </label>
  )
}
