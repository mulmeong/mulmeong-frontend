import { useId, type ReactNode } from 'react'

import Tab from '@/components/ui/Tab'

const TABS = [
  { mode: 'search', label: '장소 검색' },
  { mode: 'directions', label: '길찾기' },
] as const

export default function MapSidebarLayout({
  mode,
  onSearch,
  onDirections,
  children,
}: {
  mode: 'search' | 'directions'
  onSearch: () => void
  onDirections: () => void
  children: ReactNode
}) {
  const id = useId()
  const select = (next: typeof mode) => {
    if (next === mode) return
    if (next === 'search') onSearch()
    else onDirections()
  }

  return (
    <div className="bg-surface flex h-full min-h-0 min-w-0 flex-col overflow-hidden">
      <div
        role="tablist"
        aria-label="지도 탐색"
        className="flex shrink-0 gap-5 px-5 pt-7 pb-3"
        onKeyDown={(event) => {
          const next =
            event.key === 'Home'
              ? 'search'
              : event.key === 'End'
                ? 'directions'
                : event.key === 'ArrowLeft' || event.key === 'ArrowRight'
                  ? mode === 'search'
                    ? 'directions'
                    : 'search'
                  : undefined
          if (!next) return
          event.preventDefault()
          select(next)
          event.currentTarget.querySelector<HTMLButtonElement>(`[id="${id}-${next}"]`)?.focus()
        }}
      >
        {TABS.map((tab) => (
          <Tab
            key={tab.mode}
            id={`${id}-${tab.mode}`}
            aria-controls={`${id}-content`}
            selected={mode === tab.mode}
            tabIndex={mode === tab.mode ? 0 : -1}
            onClick={() => select(tab.mode)}
            className="grid h-7 shrink-0 grid-cols-1 grid-rows-1 leading-5"
          >
            {/* 굵은 글자 폭을 항상 확보해 선택 상태가 바뀌어도 다음 탭이 움직이지 않는다. */}
            <span aria-hidden="true" className="invisible col-start-1 row-start-1 font-semibold">
              {tab.label}
            </span>
            <span className="col-start-1 row-start-1">{tab.label}</span>
          </Tab>
        ))}
      </div>
      <div
        id={`${id}-content`}
        role="tabpanel"
        aria-labelledby={`${id}-${mode}`}
        className="min-h-0 min-w-0 flex-1 overflow-hidden"
      >
        {children}
      </div>
    </div>
  )
}
