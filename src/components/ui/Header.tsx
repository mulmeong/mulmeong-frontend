import type { ReactNode } from 'react'
import { Link } from 'react-router-dom'

import NavItem from '@/components/ui/NavItem'
import { cn } from '@/lib/cn'

type HeaderProps = {
  /** standard=로고+네비+인증버튼, detail=로고+뒤로가기+우측 슬롯 */
  type?: 'standard' | 'detail'
  /**
   * dark(기본)=서비스 공통 배경. transparent=히어로 위에 얹는 상태로,
   * 홈 히어로 구간에서만 쓴다 — 그 구간을 벗어나면 dark로 되돌린다.
   */
  variant?: 'dark' | 'transparent'
  /** standard 전용. 로그인/로그아웃 등 */
  authLabel?: string
  onAuthClick?: () => void
  showMy?: boolean
  /** detail 전용. 좌측 뒤로가기 라벨과 이동 경로. */
  backLabel?: ReactNode
  backTo?: string
  /** detail 전용. 우측 보조 영역 (시안: "01/08") */
  trailing?: ReactNode
  className?: string
}

const NAV_ITEMS = [
  { to: '/magazine', label: 'MAGAZINE' },
  { to: '/map', label: 'MAP' },
  { to: '/dart', label: 'DART' },
  { to: '/my', label: 'MY' },
]

export default function Header({
  type = 'standard',
  variant = 'dark',
  authLabel = '로그인',
  onAuthClick,
  showMy = false,
  backLabel = 'MAGAZINE',
  backTo = '/magazine',
  trailing,
  className,
}: HeaderProps) {
  const isStandard = type === 'standard'
  const isTransparent = variant === 'transparent'

  return (
    <header
      className={cn(
        'flex flex-wrap items-center justify-between gap-y-4 px-6 py-4 transition-colors duration-300 sm:flex-nowrap',
        isTransparent ? 'bg-transparent' : 'bg-inverse',
        className,
      )}
    >
      <div
        className={cn(
          isStandard ? 'contents sm:flex sm:items-center sm:gap-7' : 'flex items-center gap-4',
        )}
      >
        <Link
          to="/"
          className={cn(
            'shrink-0 text-[16px] font-medium tracking-[1.2px] whitespace-nowrap transition-colors duration-300',
            isTransparent ? 'text-white' : 'text-text-inverse',
          )}
        >
          물멍
        </Link>

        {isStandard ? (
          <nav className="order-last flex w-full items-center gap-7 sm:order-none sm:w-auto">
            {NAV_ITEMS.filter((item) => item.to !== '/my' || showMy).map((item) => (
              <NavItem
                key={item.to}
                to={item.to}
                variant={isTransparent ? 'transparent' : 'default'}
              >
                {item.label}
              </NavItem>
            ))}
          </nav>
        ) : (
          <Link
            to={backTo}
            className={cn(
              'text-[13px] transition-colors',
              isTransparent
                ? 'text-white/60 hover:text-white'
                : 'text-text-secondary hover:text-text-inverse',
            )}
          >
            ← {backLabel}
          </Link>
        )}
      </div>

      {isStandard ? (
        <button
          type="button"
          onClick={onAuthClick}
          className={cn(
            'shrink-0 rounded-full px-4 py-[7px] text-[12px] font-bold whitespace-nowrap transition-colors duration-300',
            isTransparent
              ? 'border border-white/50 bg-transparent text-white hover:border-white/80'
              : 'bg-surface text-text-primary',
          )}
        >
          {authLabel}
        </button>
      ) : (
        trailing && (
          <span
            className={cn('text-[13px]', isTransparent ? 'text-white/60' : 'text-text-secondary')}
          >
            {trailing}
          </span>
        )
      )}
    </header>
  )
}
