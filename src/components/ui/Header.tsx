import type { ReactNode } from 'react'
import { Link } from 'react-router-dom'

import NavItem from '@/components/ui/NavItem'
import { cn } from '@/lib/cn'

type HeaderProps = {
  /** standard=로고+네비+인증버튼, detail=로고+뒤로가기+우측 슬롯 */
  type?: 'standard' | 'detail'
  /** standard 전용. 로그인/로그아웃 등 */
  authLabel?: string
  onAuthClick?: () => void
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
  authLabel = '로그인',
  onAuthClick,
  backLabel = 'MAGAZINE',
  backTo = '/magazine',
  trailing,
  className,
}: HeaderProps) {
  const isStandard = type === 'standard'

  return (
    <header className={cn('bg-inverse flex items-center justify-between px-6 py-4', className)}>
      <div className={cn('flex items-center', isStandard ? 'gap-7' : 'gap-4')}>
        <Link to="/" className="text-text-inverse text-[16px] font-medium tracking-[1.2px]">
          물멍
        </Link>

        {isStandard ? (
          <nav className="flex items-center gap-7">
            {NAV_ITEMS.map((item) => (
              <NavItem key={item.to} to={item.to}>
                {item.label}
              </NavItem>
            ))}
          </nav>
        ) : (
          <Link
            to={backTo}
            className="text-text-secondary hover:text-text-inverse text-[13px] transition-colors"
          >
            ← {backLabel}
          </Link>
        )}
      </div>

      {isStandard ? (
        <button
          type="button"
          onClick={onAuthClick}
          className="bg-surface text-text-primary rounded-full px-4 py-[7px] text-[12px] font-bold"
        >
          {authLabel}
        </button>
      ) : (
        trailing && <span className="text-text-secondary text-[13px]">{trailing}</span>
      )}
    </header>
  )
}
