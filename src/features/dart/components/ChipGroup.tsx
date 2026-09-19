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

/** 시안: 11.5px / 700 / letter-spacing +14% / ink-faint */
export const GROUP_LABEL = 'text-[11.5px] font-bold tracking-[0.14em] text-[#8A9491]'

/** 라벨 + 균등 분할 칩. 라디오 그룹이라 fieldset/legend로 묶는다. */
export default function ChipGroup<T extends string>({
  label,
  options,
  value,
  onChange,
  columns,
}: ChipGroupProps<T>) {
  return (
    <fieldset className="flex flex-col gap-[11px]">
      <legend className={GROUP_LABEL}>{label}</legend>
      {/*
        칸 수가 옵션 수에 따라 달라져 Tailwind의 grid-cols-* 를 쓸 수 없다 —
        클래스 이름을 만들어 붙이면 정적 스캔에 안 걸려 CSS가 생성되지 않는다.
      */}
      <div
        className="grid gap-[7px]"
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
