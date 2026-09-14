import { cn } from '@/lib/cn'

import type { Suggestion } from '@/features/map/api/map'

type SearchSuggestionsProps = {
  suggestions: Suggestion[]
  activeIndex: number
  listboxId: string
  optionId: (index: number) => string
  onPick: (suggestion: Suggestion) => void
  /** 입력값 — 걸린 부분을 굵게 표시하는 데 쓴다. */
  keyword: string
}

/** 일치한 부분만 굵게. 위치와 무관하게 찾는다 — '◇◇ 온천호텔'의 가운데도 잡힌다. */
function Highlight({ text, match }: { text: string; match: string }) {
  const at = match ? text.toLowerCase().indexOf(match.toLowerCase()) : -1
  if (at < 0) return <>{text}</>

  return (
    <>
      {text.slice(0, at)}
      <span className="font-semibold">{text.slice(at, at + match.length)}</span>
      {text.slice(at + match.length)}
    </>
  )
}

/** 온천/스파/사우나를 구분하는 최소한의 표시. 이름에서 유추한다. */
function PlaceIcon({ name }: { name: string }) {
  const glyph = name.includes('스파') ? '◍' : name.includes('사우나') ? '◎' : '♨'
  return (
    <span aria-hidden className="text-text-secondary w-4 shrink-0 text-center text-[14px]">
      {glyph}
    </span>
  )
}

/**
 * MAP-05 자동완성 드롭다운. 시안이 없어 형태는 우리가 정했다.
 * 지역명과 온천명을 같이 제안한다 (명세: "온천명·지역명 자동완성").
 */
export default function SearchSuggestions({
  suggestions,
  activeIndex,
  listboxId,
  optionId,
  onPick,
  keyword,
}: SearchSuggestionsProps) {
  if (suggestions.length === 0) return null

  return (
    <ul
      id={listboxId}
      role="listbox"
      // 5개까지만 보이고 그 이상은 안에서 스크롤된다 (52px × 5 + 패딩).
      className={cn(
        'border-border-default bg-surface absolute inset-x-0 top-full z-10 mt-1.5 rounded-2xl border p-1.5',
        'scrollbar-thin max-h-[272px] overflow-y-auto shadow-[0_4px_16px_rgba(28,27,24,0.08)]',
      )}
    >
      {suggestions.map((suggestion, index) => {
        const active = index === activeIndex
        const key = suggestion.type === 'region' ? `r-${suggestion.value}` : `o-${suggestion.id}`

        return (
          <li key={key}>
            <button
              type="button"
              id={optionId(index)}
              role="option"
              aria-selected={active}
              // 입력이 blur되기 전에 선택이 처리되도록 mousedown을 쓴다.
              onMouseDown={(event) => {
                event.preventDefault()
                onPick(suggestion)
              }}
              className={cn(
                'flex w-full items-center gap-2.5 rounded-lg px-3 py-[7px] text-left',
                'transition-colors outline-none',
                active ? 'bg-surface-dim' : 'hover:bg-surface-dim',
              )}
            >
              {suggestion.type === 'region' ? (
                <>
                  <span
                    aria-hidden
                    className="text-text-secondary w-4 shrink-0 text-center text-[14px]"
                  >
                    ⌖
                  </span>
                  <span className="min-w-0">
                    <span className="text-text-primary block truncate text-[14px] leading-[1.35]">
                      <Highlight text={suggestion.value} match={keyword} />
                    </span>
                    <span className="text-text-secondary block text-[12px] leading-[1.35]">
                      지역
                    </span>
                  </span>
                </>
              ) : (
                <>
                  <PlaceIcon name={suggestion.name} />
                  <span className="min-w-0">
                    <span className="text-text-primary block truncate text-[14px] leading-[1.35]">
                      <Highlight text={suggestion.name} match={keyword} />
                    </span>
                    <span className="text-text-secondary block truncate text-[12px] leading-[1.35]">
                      {suggestion.address}
                    </span>
                  </span>
                </>
              )}
            </button>
          </li>
        )
      })}
    </ul>
  )
}
