import { Link } from 'react-router-dom'

import { useMagazine } from '@/features/magazine/hooks/useMagazine'

/**
 * 매거진 홈 맨 위, 이번 호를 알리는 전체폭 배너.
 *
 * 서버에 별도 '이슈' 개념이 없어 featured=true(=목록 1등)를 그대로 쓰던 것을,
 * 특정 글을 계속 지정해 걸 수 있게 고정 ID 조회로 바꿨다. 이번 호를 바꾸려면
 * 아래 ISSUE_MAGAZINE_ID만 바꾸면 된다 — 목록 정렬이 바뀌어도 흔들리지 않는다.
 */
export const ISSUE_MAGAZINE_ID = 233

export default function MagazineIssueBanner() {
  const { magazine, loading } = useMagazine(ISSUE_MAGAZINE_ID)

  if (loading) return <MagazineIssueBannerSkeleton />
  if (!magazine) return null

  const meta = [magazine.categoryLabel, `${magazine.readMinutes}분`, magazine.regionName]
    .filter(Boolean)
    .join(' · ')
  const cover = magazine.heroImageUrl ?? magazine.thumbnailUrl

  return (
    // RootLayout의 main이 max-w-5xl로 가운데 폭을 제한한다. position:relative인
    // 요소의 left/right는 '뷰포트 기준 좌표'가 아니라 '원래 자리에서의 오프셋'이라
    // left-1/2·translate 조합은 main 안에서의 상대 위치가 섞여 계산이 어긋난다.
    // margin-left/right: calc(50% - 50vw)는 그 요소의 박스 폭(%) 기준이라
    // 부모 위치와 무관하게 항상 뷰포트 양끝까지 정확히 나간다(표준 full-bleed 트릭).
    <section className="bg-inverse text-text-inverse relative -mx-[calc(50vw-50%)] overflow-hidden px-6 py-20 sm:py-28">
      {/*
        대표 사진이 있으면 배경으로 깐다. 사진 자체를 어둡게(opacity) 두고 그
        위에 왼쪽→오른쪽 그라디언트를 덮어, 글자가 놓이는 왼쪽은 확실히 어둡고
        오른쪽은 사진이 살아 있게 한다. 사진이 없으면 지금처럼 단색 배경이다.
      */}
      {cover && (
        <>
          <img src={cover} alt="" aria-hidden className="absolute inset-0 size-full object-cover" />
          <div
            aria-hidden
            className="absolute inset-0 bg-gradient-to-r from-black/85 via-black/55 to-black/10"
          />
        </>
      )}
      <div className="relative mx-auto max-w-5xl">
        <p className="text-[12px] font-semibold tracking-[0.2em] text-white/60">
          ISSUE · {magazine.categoryLabel}
        </p>
        {/* 시안처럼 2줄에서 떨어지도록 폭을 제한한다 — 제목 전체를 다 못 쓰는 대신 리듬을 지킨다. */}
        <h1 className="mt-8 max-w-2xl text-[44px] leading-[1.15] font-bold tracking-tight break-keep sm:text-[64px]">
          {magazine.title}
        </h1>
        <div className="mt-9 flex flex-wrap items-center gap-4">
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

function MagazineIssueBannerSkeleton() {
  return (
    <section
      role="status"
      aria-label="이슈 매거진을 불러오는 중"
      className="bg-inverse -mx-[calc(50vw-50%)] px-6 py-20 sm:py-28"
    >
      <div className="mx-auto max-w-5xl motion-safe:animate-pulse">
        <div aria-hidden="true" className="h-3 w-28 rounded-[2px] bg-white/15" />
        <div aria-hidden="true" className="mt-8 max-w-2xl space-y-4">
          <div className="h-12 w-full rounded-[2px] bg-white/20 sm:h-16" />
          <div className="h-12 w-3/4 rounded-[2px] bg-white/15 sm:h-16" />
        </div>
        <div aria-hidden="true" className="mt-9 flex flex-wrap items-center gap-4">
          <div className="h-11 w-24 bg-white/20" />
          <div className="h-3 w-40 rounded-[2px] bg-white/15" />
        </div>
      </div>
    </section>
  )
}
