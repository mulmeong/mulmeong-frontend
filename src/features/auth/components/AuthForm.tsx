import { useState, type ComponentProps } from 'react'

import { Button, Input } from '@/components/ui'
import { cn } from '@/lib/cn'

export function AuthHeading({ title, subtitle }: { title: string; subtitle: string }) {
  return (
    <>
      <h1 className="text-text-primary text-[32px] leading-[1.2] font-semibold tracking-[-0.035em] sm:text-[38px]">
        {title}
      </h1>
      <p className="text-text-primary/65 mt-3 text-[14px] leading-6">{subtitle}</p>
    </>
  )
}

type AuthFieldProps = Omit<ComponentProps<typeof Input>, 'label'> & {
  label?: string
  labelHint?: string
  success?: boolean
  compact?: boolean
  reserveMessageSpace?: boolean
}

/** 공용 Input의 동작을 재사용하고 인증 폼에만 타이포그래피와 여백을 적용한다. */
export function AuthField({
  type = 'text',
  label,
  labelHint,
  hint,
  error,
  success = false,
  compact = false,
  reserveMessageSpace = false,
  trailing,
  className,
  ...props
}: AuthFieldProps) {
  const [visible, setVisible] = useState(false)
  const isPassword = type === 'password'

  return (
    <div className="min-w-0">
      <Input
        {...props}
        label={
          labelHint ? (
            <>
              {label}
              <span className="text-text-primary/60 ml-2 text-[11px] font-normal">{labelHint}</span>
            </>
          ) : (
            label
          )
        }
        type={isPassword && visible ? 'text' : type}
        error={error}
        hint={
          success && hint
            ? `✓ ${hint}`
            : (hint ?? (reserveMessageSpace || !compact ? ' ' : undefined))
        }
        trailing={
          isPassword ? (
            <button
              type="button"
              aria-label={`${label ?? '비밀번호'} ${visible ? '숨김' : '표시'}`}
              aria-pressed={visible}
              onClick={() => setVisible((previous) => !previous)}
              className="text-text-primary/60 hover:text-text-primary flex size-11 items-center justify-center rounded-sm outline-none transition-colors focus-visible:ring-2 focus-visible:ring-border-strong disabled:opacity-40"
              disabled={props.disabled}
            >
              <svg
                aria-hidden="true"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="size-5"
              >
                {visible ? (
                  <>
                    <path d="m3 3 18 18M10.6 10.6a2 2 0 0 0 2.8 2.8M9.8 5.2A11 11 0 0 1 12 5c5.5 0 9 7 9 7a17 17 0 0 1-3.1 3.9M6.3 6.3C3.7 8.3 2 12 2 12s4 7 10 7a10 10 0 0 0 4.2-.9" />
                  </>
                ) : (
                  <>
                    <path d="M2 12s4-7 10-7 10 7 10 7-4 7-10 7S2 12 2 12Z" />
                    <circle cx="12" cy="12" r="3" />
                  </>
                )}
              </svg>
            </button>
          ) : (
            trailing
          )
        }
        className={cn(
          'min-w-0 gap-2 [&>label]:text-[13px] [&>label]:font-medium [&>label]:text-text-primary',
          '[&>div]:min-h-12 [&>div]:pb-0 [&>div]:transition-colors',
          '[&_input]:w-full [&_input]:text-[16px] [&_input]:leading-6 [&_input::placeholder]:text-text-primary/45',
          '[&>p]:min-h-5 [&>p]:text-[12px] [&>p]:leading-5',
          error
            ? '[&>div:focus-within]:border-danger'
            : '[&>div:focus-within]:border-border-strong [&>p]:text-text-primary/65',
          // 44px 입력 영역 안의 상단 여백이 라벨과 값 사이의 10px 간격을 만든다.
          compact &&
            'gap-0 [&>label]:leading-5 [&>div]:min-h-11 [&>div>input]:h-11 [&>p]:mt-1.5 [&>p]:min-h-0 [&>p]:leading-[18px]',
          reserveMessageSpace && '[&>p]:min-h-[18px]',
          className,
        )}
      />
      <span aria-live="polite" aria-atomic="true" className="sr-only">
        {error || (success ? hint : '')}
      </span>
    </div>
  )
}

export function AuthSubmit({ className, ...props }: ComponentProps<typeof Button>) {
  return (
    <Button
      {...props}
      type="submit"
      size="large"
      className={cn(
        'h-13 w-full rounded-sm py-0 text-[15px] font-semibold outline-none focus-visible:ring-2 focus-visible:ring-border-strong focus-visible:ring-offset-4 active:not-disabled:opacity-80',
        className,
      )}
    />
  )
}
