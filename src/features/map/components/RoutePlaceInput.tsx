import { useId, useState } from 'react'

import { useRoutePlaces } from '@/features/map/hooks/useRoutePlaces'
import { cn } from '@/lib/cn'

import type { RouteField, RoutePlace } from '@/features/map/types/directions'

export default function RoutePlaceInput({
  label,
  value,
  onChange,
}: {
  label: string
  value: RouteField
  onChange: (value: RouteField) => void
}) {
  const id = useId()
  const [focused, setFocused] = useState(false)
  const [active, setActive] = useState(-1)
  const enabled = focused && !value.place
  const { places, loading, error } = useRoutePlaces(value.text, enabled)
  const open = enabled && Boolean(value.text.trim())
  const pick = (place: RoutePlace) => {
    onChange({ text: place.name, place })
    setActive(-1)
  }

  return (
    <div>
      <label htmlFor={id} className="text-text-secondary mb-1.5 block text-[11px]">
        {label}
      </label>
      <input
        id={id}
        value={value.text}
        placeholder={`${label} 검색`}
        autoComplete="off"
        role="combobox"
        aria-autocomplete="list"
        aria-expanded={open}
        aria-controls={open ? `${id}-list` : undefined}
        aria-activedescendant={open && active >= 0 ? `${id}-${active}` : undefined}
        onFocus={() => setFocused(true)}
        onBlur={() => {
          setFocused(false)
          setActive(-1)
        }}
        onChange={(event) => {
          onChange({ text: event.target.value })
          setActive(-1)
          setFocused(true)
        }}
        onKeyDown={(event) => {
          if (event.key === 'Escape') {
            setFocused(false)
            setActive(-1)
          }
          if (!open || !places.length) return
          if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
            event.preventDefault()
            setActive((previous) =>
              event.key === 'ArrowDown'
                ? (previous + 1) % places.length
                : previous <= 0
                  ? places.length - 1
                  : previous - 1,
            )
          }
          if (event.key === 'Enter') {
            event.preventDefault()
            pick(places[active >= 0 ? active : 0])
          }
        }}
        className="border-border-default text-text-primary focus:border-text-primary h-11 w-full rounded-sm border bg-transparent px-3 text-[13px] outline-none transition-colors"
      />
      {value.place && (
        <p className="text-text-secondary mt-1 truncate text-[11px]">{value.place.address}</p>
      )}
      {open && (
        <div className="border-border-default mt-1 rounded-sm border">
          <ul
            id={`${id}-list`}
            role="listbox"
            aria-label={`${label} 검색 결과`}
            className="max-h-44 overflow-y-auto"
          >
            {places.map((place, index) => (
              <li
                key={place.id}
                id={`${id}-${index}`}
                role="option"
                aria-selected={active === index}
                onMouseDown={(event) => event.preventDefault()}
                onClick={() => pick(place)}
                className={cn(
                  'cursor-pointer px-3 py-2.5 text-[13px] hover:bg-surface-dim',
                  active === index && 'bg-surface-dim',
                )}
              >
                <span className="block font-medium">{place.name}</span>
                <span className="text-text-secondary mt-0.5 block text-[11px]">
                  {place.address}
                </span>
              </li>
            ))}
          </ul>
          {(loading || error || !places.length) && (
            <p role="status" className="text-text-secondary px-3 py-2.5 text-[12px]">
              {loading
                ? '장소를 찾고 있어요…'
                : (error ?? '검색 결과가 없어요. 다른 장소 이름을 입력해 주세요.')}
            </p>
          )}
        </div>
      )}
    </div>
  )
}
