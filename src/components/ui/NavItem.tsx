import type { ReactNode } from 'react'
import { NavLink } from 'react-router-dom'

import { cn } from '@/lib/cn'

type NavItemProps = {
  to: string
  children: ReactNode
  /** 생략하면 현재 경로와 일치할 때 자동으로 selected 처리된다. */
  selected?: boolean
  /** transparent=히어로 위에 얹는 옅은 흰색 톤. 기본은 서비스 공통 톤. */
  variant?: 'default' | 'transparent'
  className?: string
}

export default function NavItem({
  to,
  children,
  selected,
  variant = 'default',
  className,
}: NavItemProps) {
  return (
    <NavLink
      to={to}
      className={({ isActive }) => {
        const active = selected ?? isActive
        return cn(
          'text-[14px] tracking-[0.6px] transition-colors',
          variant === 'transparent'
            ? active
              ? 'text-white font-medium'
              : 'font-normal text-white/60 hover:text-white'
            : active
              ? 'text-text-inverse font-semibold underline decoration-solid'
              : 'text-text-secondary hover:text-text-inverse font-normal',
          className,
        )
      }}
    >
      {children}
    </NavLink>
  )
}
