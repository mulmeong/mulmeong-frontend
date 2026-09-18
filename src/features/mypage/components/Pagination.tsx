import { cn } from '@/lib/cn'

type PaginationProps = {
  page: number
  totalPages: number
  onChange: (page: number) => void
}

/** 생략(...)을 뜻하는 자리. 숫자와 구분하려고 문자열로 둔다. */
const GAP = 'gap' as const

/** 현재 페이지 양옆으로 보여줄 개수. */
const SIBLINGS = 1

/**
 * 표시할 페이지 목록.
 * 첫 장과 끝 장은 항상 두고, 현재 위치 주변만 펼친 뒤 나머지는 ...으로 접는다.
 */
function pageItems(page: number, totalPages: number): (number | typeof GAP)[] {
  // 전부 펼쳐도 짧으면 접지 않는다 — ...이 한 칸만 가리는 건 의미가 없다.
  if (totalPages <= 2 * SIBLINGS + 4) {
    return Array.from({ length: totalPages }, (_, index) => index + 1)
  }

  const start = Math.max(2, page - SIBLINGS)
  const end = Math.min(totalPages - 1, page + SIBLINGS)

  const middle = Array.from({ length: end - start + 1 }, (_, index) => start + index)

  return [
    1,
    ...(start > 2 ? [GAP] : []),
    ...middle,
    ...(end < totalPages - 1 ? [GAP] : []),
    totalPages,
  ]
}

export default function Pagination({ page, totalPages, onChange }: PaginationProps) {
  if (totalPages <= 1) return null

  return (
    <nav aria-label="페이지" className="flex items-center justify-center gap-2">
      <button
        type="button"
        onClick={() => onChange(page - 1)}
        disabled={page <= 1}
        className="text-text-secondary hover:text-text-primary px-2 text-[13px] disabled:cursor-not-allowed disabled:opacity-40"
      >
        이전
      </button>

      {pageItems(page, totalPages).map((item, index) =>
        item === GAP ? (
          // 생략 표시는 읽어줄 내용이 없다.
          <span key={`gap-${index}`} aria-hidden="true" className="text-text-secondary text-[13px]">
            …
          </span>
        ) : (
          <button
            key={item}
            type="button"
            onClick={() => onChange(item)}
            aria-current={item === page ? 'page' : undefined}
            aria-label={`${item}페이지`}
            className={cn(
              'flex size-7 items-center justify-center rounded-full text-[13px]',
              item === page
                ? 'bg-inverse text-text-inverse font-semibold'
                : 'text-text-secondary hover:text-text-primary',
            )}
          >
            {item}
          </button>
        ),
      )}

      <button
        type="button"
        onClick={() => onChange(page + 1)}
        disabled={page >= totalPages}
        className="text-text-secondary hover:text-text-primary px-2 text-[13px] disabled:cursor-not-allowed disabled:opacity-40"
      >
        다음
      </button>
    </nav>
  )
}
