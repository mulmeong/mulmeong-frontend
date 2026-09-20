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
    // RootLayout의 main이 max-w-5xl로 가운데 폭을 제한한다. position:relative인
    // 요소의 left/right는 '뷰포트 기준 좌표'가 아니라 '원래 자리에서의 오프셋'이라
    // left-1/2·translate 조합은 main 안에서의 상대 위치가 섞여 계산이 어긋난다.
    // margin-left/right: calc(50% - 50vw)는 그 요소의 박스 폭(%) 기준이라
    // 부모 위치와 무관하게 항상 뷰포트 양끝까지 정확히 나간다(표준 full-bleed 트릭).
    <section className="bg-inverse text-text-inverse -mx-[calc(50vw-50%)] px-6 py-16 sm:py-20">
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
