import { Link } from 'react-router-dom'

import { useMagazines } from '@/features/magazine/hooks/useMagazines'

/**
 * 매거진 홈 맨 위, 이번 호를 알리는 전체폭 배너.
 *
 * featured로 받은 첫 편을 그대로 쓴다 — 별도의 '이슈' 개념이 서버에 없어서,
 * 지금 가장 추천하는 한 편을 이번 호처럼 보여준다.
 */
export default function MagazineIssueBanner() {
  const { magazines, loading } = useMagazines({ featured: true, size: 1 })
  const magazine = magazines[0]

  if (loading || !magazine) return null

  const meta = [magazine.categoryLabel, `${magazine.readMinutes}분`, magazine.regionName]
    .filter(Boolean)
    .join(' · ')

  return (
    // RootLayout의 main이 max-w-5xl로 가운데 폭을 제한해서, 화면 전체폭까지
    // 벗어나려면 뷰포트 기준으로 다시 계산해야 한다(relative left-1/2 트릭).
    <section className="bg-inverse text-text-inverse relative left-1/2 w-screen -translate-x-1/2 px-6 py-16 sm:py-20">
      <div className="mx-auto max-w-5xl">
        <p className="text-[11px] font-semibold tracking-[0.2em] text-white/60">
          ISSUE · {magazine.categoryLabel}
        </p>
        <h1 className="mt-6 text-[40px] leading-[1.15] font-bold tracking-tight break-keep sm:text-[56px]">
          {magazine.title}
        </h1>
        <div className="mt-7 flex flex-wrap items-center gap-4">
          <Link
            to={`/magazine/${magazine.magazineId}`}
            className="bg-surface text-text-primary inline-flex min-h-11 items-center px-5 text-[13px] font-semibold"
          >
            읽어보기
          </Link>
          <span className="text-[12px] text-white/60">{meta}</span>
        </div>
      </div>
    </section>
  )
}
