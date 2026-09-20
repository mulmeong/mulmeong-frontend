import { Link } from 'react-router-dom'

import MagazineHero from '@/features/magazine/components/MagazineHero'
import MagazineCollection from '@/features/magazine/components/MagazineCollection'
import MagazineFeedback from '@/features/magazine/components/MagazineFeedback'
import { useMagazines } from '@/features/magazine/hooks/useMagazines'

export default function MagazinePage() {
  // 순위 목록이라 카드 3장보다 조금 길게 보여준다.
  const popular = useMagazines({ sort: 'POPULAR', size: 5 })
  return (
    <div className="pb-16">
      <header className="mb-5 flex flex-wrap items-end justify-between gap-x-6 gap-y-2">
        <div>
          <p className="text-text-secondary text-[10px] tracking-[0.24em]">MULMEONG JOURNAL</p>
          <h1 className="mt-1.5 text-[34px] font-medium tracking-tight sm:text-[44px]">
            물 곁의 이야기
          </h1>
        </div>
        <p className="text-text-secondary pb-1 text-[12px] leading-6">
          머무는 여행, 깊어지는 취향.
          <br />
          다음 쉼을 위한 작은 읽을거리.
        </p>
      </header>
      <MagazineHero />
      <MagazineCollection />
      {/* 위 그리드와 성격을 나눈다 — 훑어보는 순위표라 이미지 없이 제목 중심으로 읽힌다. */}
      <section aria-label="인기 매거진" className="border-border-default mt-16 border-t pt-8">
        <div className="flex items-baseline justify-between gap-3">
          <div>
            <p className="text-text-secondary text-[10px] tracking-[0.2em]">MOST LOVED</p>
            <h2 className="mt-2 text-[23px] font-medium">함께 읽는 이야기</h2>
          </div>
          <span className="text-text-secondary text-[11px]">많이 읽은 순</span>
        </div>
        <MagazineFeedback
          loading={popular.loading}
          error={popular.error}
          empty={!popular.magazines.length}
          retry={popular.retry}
        />
        <ol className="border-border-default mt-6 border-t">
          {popular.magazines.map((magazine, index) => (
            <li key={magazine.magazineId} className="border-border-default border-b">
              <Link
                to={`/magazine/${magazine.magazineId}`}
                className="group flex items-baseline gap-4 py-5 sm:gap-6"
              >
                <span className="text-text-secondary w-6 shrink-0 text-[12px] tabular-nums">
                  {String(index + 1).padStart(2, '0')}
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block text-[17px] leading-snug font-medium tracking-tight break-keep group-hover:underline group-hover:underline-offset-4 sm:text-[19px]">
                    {magazine.title}
                  </span>
                  <span className="text-text-secondary mt-1.5 block text-[11px] sm:hidden">
                    {magazine.categoryLabel} · {magazine.readMinutes}분
                  </span>
                </span>
                <span className="text-text-secondary hidden shrink-0 text-[11px] sm:block">
                  {magazine.categoryLabel}
                  <span aria-hidden> · </span>
                  {magazine.readMinutes}분
                </span>
              </Link>
            </li>
          ))}
        </ol>
      </section>
    </div>
  )
}
