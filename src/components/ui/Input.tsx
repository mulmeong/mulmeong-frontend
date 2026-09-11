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
  /** 라벨 옆에 '필수' 표시. 제출 전에 무엇이 필요한지 알 수 있게 한다. */
  required?: boolean
  /** 성공 피드백(예: 닉네임 사용 가능). error가 우선한다. */
  success?: string
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
        className={cn(
          'text-text-secondary hover:text-text-primary focus-visible:ring-border-strong',
          // 터치 타겟 확보 — 시각적 크기는 작아도 누르는 영역은 넉넉하게
          'shrink-0 rounded-[4px] px-1.5 py-1 text-[13px] outline-none',
          'underline-offset-2 hover:underline focus-visible:ring-2',
          'disabled:cursor-not-allowed disabled:opacity-40',
        )}
      >
        {trailing.label}
      </button>
    )
  }
  return <span className="text-text-secondary shrink-0 text-[13px]">{trailing}</span>
}

/** 색만으로 오류를 알리지 않도록 아이콘을 함께 쓴다. */
function AlertIcon() {
  return (
    <svg viewBox="0 0 16 16" aria-hidden="true" className="mt-px size-3.5 shrink-0">
      <circle cx="8" cy="8" r="6.5" fill="none" stroke="currentColor" strokeWidth="1.5" />
      <path
        d="M8 4.75v3.75M8 11.1v.15"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
    </svg>
  )
}

function CheckIcon() {
  return (
    <svg viewBox="0 0 16 16" aria-hidden="true" className="mt-px size-3.5 shrink-0">
      <path
        d="M3.5 8.5 6.5 11.5 12.5 4.5"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}

export default function Input({
  variant = 'line',
  label,
  trailing,
  error,
  hint,
  required,
  success,
  className,
  id,
  type = 'text',
  disabled,
  ...props
}: InputProps) {
  const generatedId = useId()
  const inputId = id ?? generatedId
  const message = error ?? success ?? hint
  const describedById = message ? `${inputId}-desc` : undefined

  const field = (
    <input
      id={inputId}
      type={type}
      disabled={disabled}
      aria-invalid={error ? true : undefined}
      aria-describedby={describedById}
      aria-required={required || undefined}
      className={cn(
        'placeholder:text-text-secondary text-text-primary min-w-0 flex-1 bg-transparent outline-none',
        'disabled:cursor-not-allowed',
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
          'transition-colors',
          disabled && 'cursor-not-allowed opacity-40',
          error ? 'border-danger' : 'hover:border-border-strong focus-within:border-border-strong',
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
    <div className={cn('group flex flex-col gap-1.5', className)}>
      {label && (
        <label
          htmlFor={inputId}
          className={cn(
            'text-text-secondary group-focus-within:text-text-primary flex items-center gap-1.5',
            'text-[13px] transition-colors',
            disabled && 'opacity-40',
          )}
        >
          {label}
          {required && (
            <span className="text-text-secondary text-[11px] font-normal">필수</span>
          )}
        </label>
      )}
      <div
        className={cn(
          'flex items-center gap-1 border-b-2 pb-2 transition-colors',
          // 포커스는 자식 input에 가므로 focus-within으로 받는다.
          // 두께는 항상 2px로 두고 색만 바꾼다 — 굵기가 바뀌면 1px만큼 밀려 글자가 흔들린다.
          disabled && 'opacity-40',
          error
            ? 'border-danger'
            : 'border-border-default hover:border-text-secondary focus-within:border-border-strong',
        )}
      >
        {field}
        {trailing && <Trailing trailing={trailing} />}
      </div>
      {message && (
        <p
          id={describedById}
          role={error ? 'alert' : undefined}
          className={cn(
            'flex items-start gap-1.5 text-[12px] leading-[1.5]',
            error ? 'text-danger' : 'text-text-secondary',
          )}
        >
          {error && <AlertIcon />}
          {!error && success && <CheckIcon />}
          <span>{message}</span>
        </p>
      )}
    </div>
  )
}
