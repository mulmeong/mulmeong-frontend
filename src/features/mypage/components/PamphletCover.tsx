import type { PamphletPreview } from '@/features/mypage/data/pamphletPreview'

/** 목록과 전환 표지에서 같은 내용을 사용해 선택한 책자가 이어져 보이게 한다. */
export default function PamphletCover({ pamphlet }: { pamphlet: PamphletPreview }) {
  return (
    <div className="pamphlet-cover">
      <div className="pamphlet-cover-art" aria-hidden="true">
        <span className="pamphlet-cover-brand">MULMEONG</span>
        <span className="pamphlet-cover-number">{pamphlet.number}</span>
        <span className="pamphlet-cover-caption">작은 여행의 기록</span>
      </div>
      <div className="pamphlet-cover-description">
        <h3 className="truncate text-[15px] font-semibold">{pamphlet.title}</h3>
        <p className="text-text-secondary mt-1 text-[12px]">
          {pamphlet.places.length}곳 · {pamphlet.createdAt.slice(0, 7)}
        </p>
      </div>
    </div>
  )
}
