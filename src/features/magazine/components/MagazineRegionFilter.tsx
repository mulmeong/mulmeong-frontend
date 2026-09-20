import { useEffect, useRef, useState } from 'react'

import { MAGAZINE_REGIONS } from '@/types/magazine'
import { cn } from '@/lib/cn'

/**
 * 지역 고르기. 서버 목록(regions)이 늘 null이라 권역 상수로 그린다 —
 * 편수(count)는 서버만 알아서 보여주지 않는다.
 *
 * select 대신 팝오버인 이유는 권역이 9개라 한 번에 늘어놓는 편이 고르기 쉬워서다.
 */
export default function MagazineRegionFilter({
  value,
  onChange,
}: {
  /** 선택된 권역 이름. 비어 있으면 전국. */
  value?: string
  onChange: (region: string) => void
}) {
  const [open, setOpen] = useState(false)
  const rootRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!open) return
    const close = (event: MouseEvent) => {
      if (!rootRef.current?.contains(event.target as Node)) setOpen(false)
    }
    const escape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setOpen(false)
    }
    document.addEventListener('mousedown', close)
    document.addEventListener('keydown', escape)
    return () => {
      document.removeEventListener('mousedown', close)
      document.removeEventListener('keydown', escape)
    }
  }, [open])

  const pick = (region: string) => {
    onChange(region)
    setOpen(false)
  }

  return (
    <div ref={rootRef} className="relative">
      <button
        type="button"
        onClick={() => setOpen((current) => !current)}
        aria-expanded={open}
        aria-haspopup="true"
        className="bg-inverse text-text-inverse inline-flex min-h-11 items-center gap-1.5 rounded-full px-3.5 text-[12px] font-medium"
      >
        {value || '전국'}
        <span aria-hidden="true" className="text-[9px]">
          ▾
        </span>
      </button>

      {open && (
        <div
          className="border-border-default bg-surface absolute top-[calc(100%+6px)] left-0 z-30 grid w-[264px] grid-cols-3 gap-1.5 rounded-md border p-2.5 shadow-sm"
          role="group"
          aria-label="지역"
        >
          {['전국', ...MAGAZINE_REGIONS].map((region) => {
            const selected = region === '전국' ? !value : value === region
            return (
              <button
                key={region}
                type="button"
                onClick={() => pick(region === '전국' ? '' : region)}
                aria-pressed={selected}
                className={cn(
                  'rounded-full border py-2 text-[12px] transition-colors',
                  selected
                    ? 'bg-inverse text-text-inverse border-border-strong font-medium'
                    : 'border-border-default text-text-secondary hover:text-text-primary hover:border-border-strong',
                )}
              >
                {region}
              </button>
            )
          })}
        </div>
      )}
    </div>
  )
}
