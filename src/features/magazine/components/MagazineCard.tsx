import { Link } from 'react-router-dom'

import type { Magazine } from '@/types/magazine'

type MagazineCardProps = {
  magazine: Magazine
  /** 시안 카드에 붙는 01·02 번호. */
  index: number
}

/** 시안 '매거진 카드' — 세로 사진 + 번호·제목 + 카테고리·분량. */
export default function MagazineCard({ magazine, index }: MagazineCardProps) {
  const { id, title, category, readMinutes, coverImageUrl } = magazine

  return (
    <Link to={`/magazine/${id}`} className="group block w-[279px] shrink-0 outline-none">
      {coverImageUrl ? (
        <img
          src={coverImageUrl}
          alt=""
          className="bg-surface-dim aspect-[279/340] w-full rounded-sm object-cover"
        />
      ) : (
        <div className="bg-surface-dim aspect-[279/340] w-full rounded-sm" />
      )}

      <div className="mt-[14px] flex items-baseline gap-[6px]">
        <span className="text-text-secondary shrink-0 text-[13px] tabular-nums">
          {String(index + 1).padStart(2, '0')}
        </span>
        <h3 className="text-text-primary min-w-0 text-[17px] leading-[1.3] group-hover:underline">
          {title}
        </h3>
      </div>

      <p className="text-text-secondary mt-[10px] text-[13px]">
        {category} · {readMinutes}분
      </p>
    </Link>
  )
}
