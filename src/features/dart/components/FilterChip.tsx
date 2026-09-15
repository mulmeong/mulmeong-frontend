import { cn } from '@/lib/cn'

type FilterChipProps = {
  /** 같은 그룹의 칩끼리 같은 값을 줘야 하나만 선택된다. */
  name: string
  label: string
  selected: boolean
  onSelect: () => void
}

/**
 * 조건 선택 칩. 그룹에서 하나만 고르는 형태다.
 *
 * 버튼 대신 감춘 라디오 입력을 쓴다 — 그래야 스크린 리더가 "3개 중 2번째"처럼
 * 읽어주고, 방향키로 그룹 안을 이동하는 동작도 브라우저가 알아서 해준다.
 * 버튼에 aria-pressed를 다는 방식은 그 둘을 직접 구현해야 한다.
 */
export default function FilterChip({ name, label, selected, onSelect }: FilterChipProps) {
  return (
    <label className="flex-1 cursor-pointer">
      <input
        type="radio"
        name={name}
        checked={selected}
        onChange={onSelect}
        className="peer sr-only"
      />
      <span
        className={cn(
          'block rounded-full border py-2 text-center text-[13px]',
          // 포커스는 보이는 칸에 그린다. 입력 자체는 화면에서 감춰져 있다.
          'peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-[#0E1513]',
          selected
            ? 'border-[#0E1513] bg-[#0E1513] font-semibold text-white'
            : 'border-[#D8DCDB] font-normal text-[#5D6764]',
        )}
      >
        {label}
      </span>
    </label>
  )
}
