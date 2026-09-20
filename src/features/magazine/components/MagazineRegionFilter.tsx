import { useEffect, useRef, useState } from 'react'

import { MAGAZINE_REGIONS } from '@/types/magazine'
import { cn } from '@/lib/cn'

/**
 * 지역 고르기. 권역 목록은 화면 상수로 그린다 — 서버가 목록 응답의 regions를
 * 아직 null로 주기 때문이다(BE 요청 중).
 *
 * counts가 들어오면 권역마다 편수를 같이 보여준다. 서버가 regions를 채우면
 * 호출부에서 넘겨 주기만 하면 된다.
 *
 * select 대신 팝오버인 이유는 권역이 여럿이라 한 번에 늘어놓는 편이 고르기 쉬워서다.
 */
export default function MagazineRegionFilter({
  value,
  counts,
  onChange,
}: {
  /** 선택된 권역 이름. 비어 있으면 전국. */
  value?: string
  /** 권역별 편수. 서버가 주면 칩에 함께 찍는다. */
  counts?: Record<string, number>
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
        className="bg-inverse text-text-inverse inline-flex h-9 items-center gap-1.5 rounded-full px-3 text-[12px] font-medium"
      >
        {value || '전국'}
        <span aria-hidden="true" className="text-[9px]">
          ▾
        </span>
      </button>

      {open && (
        <div
          className="border-border-default bg-surface absolute top-[calc(100%+4px)] left-0 z-30 grid w-[260px] grid-cols-3 gap-x-5 gap-y-1 rounded-[2px] border px-3 py-2"
          role="group"
          aria-label="지역"
        >
          {['전국', ...MAGAZINE_REGIONS].map((region) => {
            const selected = region === '전국' ? !value : value === region
            const count = region === '전국' ? undefined : counts?.[region]
            return (
              <button
                key={region}
                type="button"
                onClick={() => pick(region === '전국' ? '' : region)}
                aria-pressed={selected}
                className={cn(
                  'relative flex h-7 items-center gap-1.5 px-0.5 text-left text-[12px] leading-none transition-colors',
                  region === '전국' && 'col-span-3 mb-1 border-b border-border-default/60 pb-1.5',
                  selected
                    ? 'text-text-primary font-semibold after:absolute after:bottom-0 after:left-0 after:h-px after:w-4 after:bg-text-primary after:content-[""]'
                    : 'text-text-secondary hover:bg-surface-dim hover:text-text-primary',
                )}
              >
                {region}
                {count !== undefined && (
                  <span className="text-[10px] tabular-nums text-text-secondary/70">{count}</span>
                )}
              </button>
            )
          })}
        </div>
      )}
    </div>
  )
}
