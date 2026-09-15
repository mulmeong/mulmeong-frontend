/** 온천 특징 표시용. 누를 수 없는 라벨이라 FilterChip과 달리 그냥 span이다. */
export default function TagChip({ label }: { label: string }) {
  return (
    <span className="rounded-full border border-[#D8DCDB] px-3 py-1.5 text-[12.5px] font-normal text-[#5D6764]">
      {label}
    </span>
  )
}
