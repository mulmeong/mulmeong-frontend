import { Link } from 'react-router-dom'
import MagazineCollection from '@/features/magazine/components/MagazineCollection'
export default function MagazineArchivePage() {
  return (
    <div className="pb-16">
      <Link to="/magazine" className="text-text-secondary text-[12px]">
        ← 매거진 홈
      </Link>
      <header className="mt-6">
        <p className="text-text-secondary text-[10px] tracking-[0.24em]">MULMEONG JOURNAL</p>
        <h1 className="mt-2 text-[40px] font-medium tracking-tight sm:text-[56px]">Archive</h1>
        <p className="text-text-secondary mt-3 text-[13px]">
          물과 마을, 그리고 여행의 기록을 모았습니다.
        </p>
      </header>
      <MagazineCollection archive />
    </div>
  )
}
