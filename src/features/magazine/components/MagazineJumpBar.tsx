import { useNavigate } from 'react-router-dom'

import MagazineRegionFilter from '@/features/magazine/components/MagazineRegionFilter'
import { MAGAZINE_CATEGORIES } from '@/types/magazine'
import { cn } from '@/lib/cn'

import type { MagazineCategory } from '@/types/magazine'

/**
 * 글을 읽다가 다른 카테고리·지역이 궁금해지면 한 번에 목록으로 건너뛰는 줄.
 *
 * 정렬·보기 전환은 목록에서만 의미가 있어 여기에는 두지 않는다.
 * 현재 글의 카테고리를 짚어 줘서 어디를 읽고 있는지 보이게 한다.
 */
export default function MagazineJumpBar({ current }: { current?: MagazineCategory }) {
  const navigate = useNavigate()

  const go = (params: { category?: string; region?: string }) => {
    const search = new URLSearchParams()
    if (params.category) search.set('category', params.category)
    if (params.region) search.set('region', params.region)
    const query = search.toString()
    void navigate(`/magazine/archive${query ? `?${query}` : ''}`)
  }

  return (
    <div className="border-border-default bg-surface sticky top-0 z-20 -mx-6 mb-2 border-b px-6 py-3">
      <div className="flex flex-wrap items-center gap-x-5 gap-y-2">
        <MagazineRegionFilter onChange={(region) => go({ region })} />
        <nav aria-label="매거진 카테고리" className="flex flex-wrap items-center gap-x-4 gap-y-1">
          {[{ code: 'ALL', label: '전체' }, ...MAGAZINE_CATEGORIES].map((item) => (
            <button
              key={item.code}
              type="button"
              onClick={() => go({ category: item.code === 'ALL' ? '' : item.code })}
              aria-current={current === item.code || undefined}
              className={cn(
                'py-1 text-[12px] transition-colors',
                current === item.code
                  ? 'text-text-primary font-medium underline underline-offset-[6px]'
                  : 'text-text-secondary hover:text-text-primary',
              )}
            >
              {item.label}
            </button>
          ))}
        </nav>
      </div>
    </div>
  )
}
