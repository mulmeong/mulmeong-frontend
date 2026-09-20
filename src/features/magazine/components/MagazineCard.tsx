import { Link } from 'react-router-dom'
import MagazineImage from './MagazineImage'
import { cn } from '@/lib/cn'
import type { Magazine } from '@/types/magazine'

/** 서버가 regionName에 sidoCode를 그대로 주는 건(예: '50') 지역명이 아니라 숨긴다. */
function regionLabel(regionName: string) {
  return /^\d+$/.test(regionName.trim()) ? '' : regionName
}

/**
 * featured는 같은 그리드 안에서 칸만 더 쓰는 변주다 — 카드 구조는 그대로 두고
 * 이미지 비율과 제목 크기만 키운다. masonry처럼 높이가 제각각이 되지 않게 한다.
 */
export default function MagazineCard({
  magazine,
  featured = false,
  index,
}: {
  magazine: Magazine
  featured?: boolean
  /** 목차형 화면의 순번. 있으면 제목 앞에 붙고 사진이 세로로 바뀐다. */
  index?: string
}) {
  return (
    <Link to={`/magazine/${magazine.magazineId}`} className="group block min-w-0">
      <MagazineImage
        src={magazine.thumbnailUrl}
        seed={magazine.magazineId}
        eager={featured}
        className={cn(
          'rounded-sm transition-transform duration-150 group-hover:-translate-y-1 motion-reduce:transform-none',
          featured ? 'aspect-[16/9]' : index ? 'aspect-[3/4]' : 'aspect-[4/3]',
        )}
      />
      <h3
        className={cn(
          'mt-4 leading-snug font-medium tracking-tight group-hover:underline group-hover:underline-offset-4',
          featured ? 'text-[24px] sm:text-[27px]' : 'text-[18px]',
        )}
      >
        {index && (
          <span className="text-text-secondary mr-1.5 text-[13px] font-normal tabular-nums">
            {index}
          </span>
        )}
        {magazine.title}
      </h3>
      {magazine.subtitle && (
        <p
          className={cn(
            'text-text-secondary mt-2 line-clamp-2 leading-[1.65]',
            featured ? 'max-w-[54ch] text-[13px]' : 'text-[12px]',
          )}
        >
          {magazine.subtitle}
        </p>
      )}
      <p className="text-text-secondary mt-3 text-[11px]">
        {[magazine.categoryLabel, regionLabel(magazine.regionName), `${magazine.readMinutes}분`]
          .filter(Boolean)
          .join(' · ')}
      </p>
    </Link>
  )
}
