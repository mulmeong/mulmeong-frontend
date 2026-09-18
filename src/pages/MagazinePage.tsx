import MagazineHero from '@/features/magazine/components/MagazineHero'
import MagazineCollection from '@/features/magazine/components/MagazineCollection'
import MagazineCard from '@/features/magazine/components/MagazineCard'
import MagazineFeedback from '@/features/magazine/components/MagazineFeedback'
import { useMagazines } from '@/features/magazine/hooks/useMagazines'

export default function MagazinePage() {
  const popular = useMagazines({ sort: 'POPULAR', size: 3 })
  return (
    <div className="pb-16">
      <header className="mb-8 flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-text-secondary text-[10px] tracking-[0.24em]">MULMEONG JOURNAL</p>
          <h1 className="mt-2 text-[36px] font-medium tracking-tight sm:text-[48px]">
            물 곁의 이야기
          </h1>
        </div>
        <p className="text-text-secondary text-[12px] leading-6">
          머무는 여행, 깊어지는 취향.
          <br />
          다음 쉼을 위한 작은 읽을거리.
        </p>
      </header>
      <MagazineHero />
      <MagazineCollection />
      <section aria-label="인기 매거진" className="border-border-default mt-16 border-t pt-8">
        <p className="text-text-secondary text-[10px] tracking-[0.2em]">MOST LOVED</p>
        <h2 className="mt-2 text-[23px] font-medium">함께 읽는 이야기</h2>
        <MagazineFeedback
          loading={popular.loading}
          error={popular.error}
          empty={!popular.magazines.length}
          retry={popular.retry}
        />
        <ul className="mt-6 grid gap-8 sm:grid-cols-3">
          {popular.magazines.map((magazine, index) => (
            <li key={magazine.magazineId}>
              <MagazineCard magazine={magazine} index={index} />
            </li>
          ))}
        </ul>
      </section>
    </div>
  )
}
