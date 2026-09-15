import FilterChip from '@/features/dart/components/FilterChip'
import type { ChipOption } from '@/features/dart/constants'

type ChipGroupProps<T extends string> = {
  label: string
  options: ChipOption<T>[]
  value: T
  onChange: (id: T) => void
}

/** 시안: 11.5px / 700 / letter-spacing +14% / ink-faint */
export const GROUP_LABEL = 'text-[11.5px] font-bold tracking-[0.14em] text-[#8A9491]'

/** 라벨 + 균등 분할 칩 한 줄. 라디오 그룹이라 fieldset/legend로 묶는다. */
export default function ChipGroup<T extends string>({
  label,
  options,
  value,
  onChange,
}: ChipGroupProps<T>) {
  return (
    <fieldset className="flex flex-col gap-[11px]">
      <legend className={GROUP_LABEL}>{label}</legend>
      <div className="flex gap-[7px]">
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
