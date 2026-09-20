import { Link } from 'react-router-dom'

import MagazineImage from '@/features/magazine/components/MagazineImage'

import type { Magazine } from '@/types/magazine'

/**
 * 홈의 가로 스크롤 카드열. 그리드로 줄바꿈하는 아카이브와 달리, 홈은 최신 몇 편만
 * 훑어보는 자리라 한 줄로 흘려보낸다. "← 가로로 스크롤" 문구로 스크롤 가능함을
 * 알린다 — 트랙패드가 없는 마우스 사용자에게는 스크롤바가 유일한 단서라서다.
 */
export default function MagazineFilmstrip({ magazines }: { magazines: Magazine[] }) {
  return (
    <div>
      <ul className="scrollbar-thin -mx-6 flex gap-6 overflow-x-auto px-6 pb-2">
        {magazines.map((magazine, index) => (
          <li key={magazine.magazineId} className="w-[220px] shrink-0">
            <Link to={`/magazine/${magazine.magazineId}`} className="group block">
              <MagazineImage
                src={magazine.thumbnailUrl}
                seed={magazine.magazineId}
                className="aspect-[3/4] rounded-sm"
              />
              <h3 className="mt-3 text-[15px] leading-snug font-bold tracking-tight break-keep group-hover:underline group-hover:underline-offset-4">
                <span className="text-text-secondary mr-1.5 font-normal tabular-nums">
                  {String(index + 1).padStart(2, '0')}
                </span>
                {magazine.title}
              </h3>
              <p className="text-text-secondary mt-1 text-[11px]">
                {magazine.categoryLabel} · {magazine.readMinutes}분
              </p>
            </Link>
          </li>
        ))}
      </ul>
      <p className="text-text-secondary mt-2 text-[11px]" aria-hidden="true">
        ← 가로로 스크롤
      </p>
    </div>
  )
}
