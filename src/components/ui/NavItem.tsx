import type { ReactNode } from 'react'
import { NavLink } from 'react-router-dom'

import { cn } from '@/lib/cn'

type NavItemProps = {
  to: string
  children: ReactNode
  /** 생략하면 현재 경로와 일치할 때 자동으로 selected 처리된다. */
  selected?: boolean
  className?: string
}

export default function NavItem({ to, children, selected, className }: NavItemProps) {
  return (
    <NavLink
      to={to}
      className={({ isActive }) =>
        cn(
          'text-[14px] tracking-[0.6px] transition-colors',
          (selected ?? isActive)
            ? 'text-text-inverse font-semibold underline decoration-solid'
            : 'text-text-secondary hover:text-text-inverse font-normal',
          className,
        )
      }
    >
      {children}
    </NavLink>
  )
}
