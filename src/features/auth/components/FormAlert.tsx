import type { ReactNode } from 'react'

/**
 * 제출 실패처럼 폼 전체에 해당하는 오류.
 * 색만으로 알리지 않도록 아이콘을 함께 두고, 배경 차이로 영역을 구분한다(테두리 대신).
 */
export default function FormAlert({ children }: { children: ReactNode }) {
  return (
    <p
      role="alert"
      className="text-danger bg-danger/8 flex items-start gap-2 rounded-md px-3.5 py-3 text-[13px] leading-[1.5]"
    >
      <svg viewBox="0 0 16 16" aria-hidden="true" className="mt-px size-4 shrink-0">
        <circle cx="8" cy="8" r="6.5" fill="none" stroke="currentColor" strokeWidth="1.5" />
        <path
          d="M8 4.75v3.75M8 11.1v.15"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinecap="round"
        />
      </svg>
      <span>{children}</span>
    </p>
  )
}
