import { useId, useRef, useState, type KeyboardEvent } from 'react'

import { KEYWORD_MIN } from '@/features/dart/api/places'
import ChipGroup, { GROUP_LABEL } from '@/features/dart/components/ChipGroup'
import { useGpsOrigin } from '@/features/dart/hooks/useGpsOrigin'
import { useOriginSearch } from '@/features/dart/hooks/useOriginSearch'
import { cn } from '@/lib/cn'

import type { DartOrigin, ExternalPlace } from '@/types/dart'

/** 추천 출발지 칩을 한 줄에 몇 개씩 놓을지. 역 이름이 길어 세 개가 한계다. */
const RECOMMENDED_COLUMNS = 3

type OriginFieldProps = {
  /** 추천 출발지(DART-404). 아직 안 왔으면 빈 배열이다. */
  recommended: DartOrigin[]
  /** 추천 목록을 못 받아온 사유. 폴백의 마지막 단이 막힌 상태다. */
  recommendedError?: string
  value: DartOrigin | null
  onChange: (origin: DartOrigin) => void
}

function toOrigin(place: ExternalPlace): DartOrigin {
  return { label: place.name, lat: place.lat, lng: place.lng, detail: place.roadAddress }
}

/**
 * 출발지 고르기 (DART-01).
 *
 * 명세의 3단 폴백을 그대로 화면에 옮겼다 — 검색(901)이 먼저고, 안 되면 현재
 * 위치(902), 그것도 안 되면 아래 추천 목록(404)이다. 추천 칩은 마지막 폴백이자
 * 자주 쓰는 출발지의 지름길이라 항상 펼쳐 둔다.
 */
export default function OriginField({
  recommended,
  recommendedError,
  value,
  onChange,
}: OriginFieldProps) {
  const [keyword, setKeyword] = useState('')
  const [activeIndex, setActiveIndex] = useState(-1)
  /** 입력 중인지. 아니면 같은 칸에 고른 출발지를 보여준다. */
  const [typing, setTyping] = useState(false)

  const inputRef = useRef<HTMLInputElement>(null)
  const listboxId = useId()
  const optionId = (index: number) => `${listboxId}-${index}`

  const search = useOriginSearch(keyword)
  const gps = useGpsOrigin()

  const pick = (origin: DartOrigin) => {
    onChange(origin)
    // 고른 곳이 그대로 칸에 들어차야 해서 입력 상태를 끝낸다.
    setKeyword('')
    setActiveIndex(-1)
    setTyping(false)
    inputRef.current?.blur()
  }

  const places = search.places
  // 칸을 떠나면 목록도 닫는다 — 고르지 않고 나간 검색 결과가 남아 있으면 안 된다.
  const open = typing && places.length > 0

  const handleKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    if (event.key === 'Escape') {
      setKeyword('')
      return
    }
    if (!open) return

    if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
      event.preventDefault()
      const step = event.key === 'ArrowDown' ? 1 : -1
      // 목록 안에서만 돈다. -1(고른 것 없음)은 거치지 않는다.
      setActiveIndex((index) => (index + step + places.length) % places.length)
      return
    }
    if (event.key === 'Enter' && activeIndex >= 0) {
      event.preventDefault()
      pick(toOrigin(places[activeIndex]))
    }
  }

  // 검색·GPS·추천 중 지금 알려야 할 사유 하나만 보여준다.
  const message = search.error ?? gps.error ?? recommendedError

  return (
    <div className="flex flex-col gap-[11px]">
      <div className="flex items-center justify-between">
        <span className={GROUP_LABEL}>출발지</span>
        <button
          type="button"
          onClick={() => void gps.locate(pick)}
          disabled={gps.loading}
          className="text-[12px] font-semibold text-[#0E1513] underline underline-offset-[3px] disabled:opacity-40"
        >
          {gps.loading ? '찾는 중…' : '현재 위치'}
        </button>
      </div>

      {/*
        검색칸과 고른 출발지가 같은 줄을 쓴다. 입력 중이 아니면 고른 곳이 그 자리에
        찍혀 있고, 누르면 지워지면서 검색칸이 된다 — 시안의 밑줄 하나를 유지하려고
        칸을 나누지 않았다.
      */}
      <div className="relative">
        <input
          ref={inputRef}
          type="text"
          value={typing ? keyword : (value?.label ?? '')}
          onFocus={() => setTyping(true)}
          onBlur={() => setTyping(false)}
          onChange={(event) => {
            setKeyword(event.target.value)
            setActiveIndex(-1)
          }}
          onKeyDown={handleKeyDown}
          placeholder={`장소를 검색하세요 (${KEYWORD_MIN}자 이상)`}
          role="combobox"
          aria-expanded={open}
          aria-controls={listboxId}
          aria-autocomplete="list"
          aria-activedescendant={activeIndex >= 0 ? optionId(activeIndex) : undefined}
          className={cn(
            'w-full border-b border-[#0E1513] pb-[7px] text-[16px] font-semibold text-[#0E1513]',
            'focus:outline-none',
            'placeholder:text-[14px] placeholder:font-normal placeholder:text-[#8A9491]',
          )}
        />

        {/* 고른 곳의 주소. 입력 중에는 목록이 그 자리를 쓴다. */}
        {!typing && value?.detail && (
          <p className="mt-[5px] text-[11.5px] text-[#8A9491]">{value.detail}</p>
        )}

        {open && (
          <ul
            id={listboxId}
            role="listbox"
            className={cn(
              'absolute inset-x-0 top-full z-10 mt-1.5 rounded-2xl border border-[#E2E5E4] bg-white p-1.5',
              'scrollbar-thin max-h-[228px] overflow-y-auto shadow-[0_4px_16px_rgba(14,21,19,0.08)]',
            )}
          >
            {places.map((place, index) => (
              <li key={place.externalId}>
                <button
                  type="button"
                  id={optionId(index)}
                  role="option"
                  aria-selected={index === activeIndex}
                  // 입력이 blur되기 전에 선택이 처리되도록 mousedown을 쓴다.
                  onMouseDown={(event) => {
                    event.preventDefault()
                    pick(toOrigin(place))
                  }}
                  className={cn(
                    'block w-full rounded-lg px-3 py-[7px] text-left',
                    index === activeIndex ? 'bg-[#F2F4F3]' : 'hover:bg-[#F2F4F3]',
                  )}
                >
                  <span className="block truncate text-[13.5px] text-[#0E1513]">{place.name}</span>
                  <span className="block truncate text-[11.5px] text-[#8A9491]">
                    {place.roadAddress}
                  </span>
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>

      {message && (
        <p role="alert" className="text-[12px] leading-[1.6] text-[#B4443A]">
          {message}
        </p>
      )}

      {recommended.length > 0 && (
        <ChipGroup
          label="추천 출발지"
          options={recommended.map((item) => ({ id: item.label, label: item.label }))}
          // 검색이나 GPS로 고르면 칩은 하나도 안 눌린 상태가 된다.
          value={value?.label ?? null}
          onChange={(label) => {
            const found = recommended.find((item) => item.label === label)
            if (found) pick(found)
          }}
          columns={RECOMMENDED_COLUMNS}
        />
      )}
    </div>
  )
}
