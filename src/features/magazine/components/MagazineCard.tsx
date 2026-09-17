import { Link } from 'react-router-dom'
import MagazineImage from './MagazineImage'
import type { Magazine } from '@/types/magazine'
export default function MagazineCard({
  magazine,
  index = 0,
}: {
  magazine: Magazine
  index?: number
}) {
  return (
    <Link to={`/magazine/${magazine.magazineId}`} className="group block min-w-0">
      <MagazineImage src={magazine.thumbnailUrl} className="aspect-[4/3] rounded-sm" />
      <div className="text-text-secondary mt-4 flex items-center justify-between gap-2 text-[11px]">
        <span>{magazine.categoryLabel}</span>
        <span className="tabular-nums">{String(index + 1).padStart(2, '0')}</span>
      </div>
      <h3 className="mt-2 text-[18px] leading-snug font-medium tracking-tight group-hover:underline group-hover:underline-offset-4">
        {magazine.title}
      </h3>
      {magazine.subtitle && (
        <p className="text-text-secondary mt-2 line-clamp-2 text-[12px] leading-5">
          {magazine.subtitle}
        </p>
      )}
      <p className="text-text-secondary mt-3 text-[11px]">
        {magazine.regionName} · {magazine.readMinutes}분{' '}
        <span className="ml-2">♡ {magazine.likeCount.toLocaleString('ko-KR')}</span>
      </p>
    </Link>
  )
}
