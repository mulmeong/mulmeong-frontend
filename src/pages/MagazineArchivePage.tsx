import { Link } from 'react-router-dom'
import MagazineCollection from '@/features/magazine/components/MagazineCollection'
export default function MagazineArchivePage() {
  return (
    <div className="pb-16">
      <Link to="/magazine" className="text-text-secondary text-[12px]">
        ← 매거진 홈
      </Link>
      {/* 데모의 타이틀 밴드 — 히어로 대신 얇게, 오른쪽에 편수를 둔다. */}
      <header className="border-border-default mt-6 flex items-end justify-between gap-4 border-b pb-6">
        <div>
          <p className="text-text-secondary text-[12px] tracking-[0.2em]">MAGAZINE</p>
          <h1 className="mt-2.5 text-[40px] leading-none font-black tracking-[0.04em] sm:text-[44px]">
            ARCHIVE
          </h1>
        </div>
        <p className="text-text-secondary shrink-0 text-[13px]">물과 마을, 그리고 여행의 기록.</p>
      </header>
      <MagazineCollection archive />
    </div>
  )
}
