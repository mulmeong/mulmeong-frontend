type PamphletCoverProps = {
  /** 표지 일련번호 (예: '03'). */
  number: string
  title: string
  /** 담긴 장소 수. 목록 응답에는 장소 배열이 없어 개수만 받는다. */
  placeCount: number
  /** YYYY-MM-DD. 표지에는 연·월까지만 찍는다. */
  createdAt: string
}

/** 목록과 전환 표지에서 같은 내용을 사용해 선택한 책자가 이어져 보이게 한다. */
export default function PamphletCover({
  number,
  title,
  placeCount,
  createdAt,
}: PamphletCoverProps) {
  return (
    <div className="pamphlet-cover">
      <div className="pamphlet-cover-art" aria-hidden="true">
        <span className="pamphlet-cover-brand">MULMEONG</span>
        <span className="pamphlet-cover-number">{number}</span>
        <span className="pamphlet-cover-caption">작은 여행의 기록</span>
      </div>
      <div className="pamphlet-cover-description">
        <h3 className="truncate text-[15px] font-semibold">{title}</h3>
        <p className="text-text-secondary mt-1 text-[12px]">
          {placeCount}곳 · {createdAt.slice(0, 7)}
        </p>
      </div>
    </div>
  )
}
