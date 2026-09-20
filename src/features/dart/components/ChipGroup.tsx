import FilterChip from '@/features/dart/components/FilterChip'
import type { ChipOption } from '@/features/dart/constants'

type ChipGroupProps<T extends string> = {
  label: string
  options: ChipOption<T>[]
  value: T | null
  onChange: (id: T) => void
  /** 한 줄에 놓을 칩 수. 기본은 전부 한 줄에 균등 분할이다. */
  columns?: number
}

/**
 * 조건 묶음의 제목.
 *
 * 지도 사이드바의 섹션 제목(MapSidebar의 SectionLabel)과 같은 값이다 —
 * 시안의 굵고 자간 넓은 라벨은 이 화면에만 있어서 혼자 튀었다.
 */
export const GROUP_LABEL = 'text-[11px] tracking-[0.04em] text-text-secondary'

/** 라벨 + 균등 분할 칩. 라디오 그룹이라 fieldset/legend로 묶는다. */
export default function ChipGroup<T extends string>({
  label,
  options,
  value,
  onChange,
  columns,
}: ChipGroupProps<T>) {
  // 간격은 fieldset의 gap이 아니라 아래 칸의 margin으로 준다 — legend를 flex
  // 항목으로 치지 않는 브라우저가 있어 gap이 안 먹을 수 있다.
  return (
    <fieldset className="flex flex-col">
      <legend className={GROUP_LABEL}>{label}</legend>
      {/*
        칸 수가 옵션 수에 따라 달라져 Tailwind의 grid-cols-* 를 쓸 수 없다 —
        클래스 이름을 만들어 붙이면 정적 스캔에 안 걸려 CSS가 생성되지 않는다.
      */}
      <div
        className="mt-2.5 grid gap-[7px]"
        style={{ gridTemplateColumns: `repeat(${columns ?? options.length}, minmax(0, 1fr))` }}
      >
        {options.map((option) => (
          <FilterChip
            key={option.id}
            name={label}
            label={option.label}
            selected={option.id === value}
            onSelect={() => onChange(option.id)}
          />
        ))}
      </div>
    </fieldset>
  )
}
