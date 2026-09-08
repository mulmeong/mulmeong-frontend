import { useId, type InputHTMLAttributes, type ReactNode } from 'react'

import { cn } from '@/lib/cn'

type TrailingAction = {
  label: ReactNode
  onClick?: () => void
  disabled?: boolean
}

type InputProps = Omit<InputHTMLAttributes<HTMLInputElement>, 'size'> & {
  /** line=라벨+값+하단선, search=박스형 */
  variant?: 'line' | 'search'
  /** line 전용. */
  label?: string
  /** 문자열이면 텍스트로, 객체면 클릭 가능한 버튼으로 렌더링된다. */
  trailing?: ReactNode | TrailingAction
  /** 에러 메시지. 있으면 밑줄과 메시지가 에러색으로 바뀐다. */
  error?: string
  /** 라벨 아래 보조 설명. error가 있으면 error가 우선한다. */
  hint?: string
  className?: string
}

function isTrailingAction(value: unknown): value is TrailingAction {
  return typeof value === 'object' && value !== null && 'label' in value
}

function Trailing({ trailing }: { trailing: NonNullable<InputProps['trailing']> }) {
  if (isTrailingAction(trailing)) {
    return (
      <button
        type="button"
        onClick={trailing.onClick}
        disabled={trailing.disabled}
        className="text-text-secondary hover:text-text-primary shrink-0 text-[12px] underline-offset-2 hover:underline disabled:cursor-not-allowed disabled:opacity-40"
      >
        {trailing.label}
      </button>
    )
  }
  return <span className="text-text-secondary shrink-0 text-[12px]">{trailing}</span>
}

export default function Input({
  variant = 'line',
  label,
  trailing,
  error,
  hint,
  className,
  id,
  type = 'text',
  ...props
}: InputProps) {
  const generatedId = useId()
  const inputId = id ?? generatedId
  const describedById = error || hint ? `${inputId}-desc` : undefined

  const field = (
    <input
      id={inputId}
      type={type}
      aria-invalid={error ? true : undefined}
      aria-describedby={describedById}
      className={cn(
        'placeholder:text-text-secondary text-text-primary min-w-0 flex-1 bg-transparent outline-none',
        'disabled:cursor-not-allowed disabled:opacity-40',
        variant === 'search' ? 'text-[14px]' : 'text-[15px]',
      )}
      {...props}
    />
  )

  if (variant === 'search') {
    return (
      <div
        className={cn(
          'bg-surface border-border-default flex items-center gap-2 rounded-md border px-4 py-3',
          error && 'border-danger',
          className,
        )}
      >
        <svg
          viewBox="0 0 15 15"
          aria-hidden="true"
          className="text-inverse block size-[15px] shrink-0"
        >
          <g
            fill="none"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M10.625 10.625L13.125 13.125" />
            <path d="M1.875 6.875C1.875 9.63644 4.11357 11.875 6.875 11.875C8.25813 11.875 9.51006 11.3134 10.4153 10.4058C11.3173 9.50137 11.875 8.25331 11.875 6.875C11.875 4.11357 9.63644 1.875 6.875 1.875C4.11357 1.875 1.875 4.11357 1.875 6.875Z" />
          </g>
        </svg>
        {field}
        {trailing && <Trailing trailing={trailing} />}
      </div>
    )
  }

  return (
    <div className={cn('flex flex-col gap-2', className)}>
      {label && (
        <label htmlFor={inputId} className="text-text-secondary text-[12px]">
          {label}
        </label>
      )}
      <div
        className={cn(
          'flex items-center gap-2 border-b pb-2',
          error ? 'border-danger' : 'border-border-default',
        )}
      >
        {field}
        {trailing && <Trailing trailing={trailing} />}
      </div>
      {(error || hint) && (
        <p
          id={describedById}
          className={cn('text-[12px]', error ? 'text-danger' : 'text-text-secondary')}
        >
          {error ?? hint}
        </p>
      )}
    </div>
  )
}
