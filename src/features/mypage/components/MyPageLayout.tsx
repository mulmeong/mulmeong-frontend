import { NavLink, Outlet } from 'react-router-dom'

import Badge from '@/components/ui/Badge'
import type { MyProfile } from '@/types/user'

import { useAuth } from '@/features/auth/hooks/authContext'
import { useMyProfile } from '@/features/mypage/hooks/useMyProfile'
import { LEVEL_COUNT, visitsToNextLevel } from '@/features/mypage/levels'
import { cn } from '@/lib/cn'

const TABS = [
  { to: '/my', label: '내 지도', end: true },
  { to: '/my/saved', label: '찜한 장소' },
  { to: '/my/pamphlets', label: '팜플렛' },
  { to: '/my/reviews', label: '내 리뷰' },
  { to: '/my/account', label: '내정보' },
]

/**
 * 탭 화면이 헤더를 다시 받아오게 하는 통로.
 * 리뷰를 지우면 방문 온천 수·리뷰 수·레벨이 다시 계산되는데(REV-05),
 * 헤더는 탭 바깥이라 저절로 바뀌지 않는다.
 */
export type MyPageOutletContext = {
  reloadProfile: () => void
  /** 내정보 탭이 이메일·닉네임 변경 가능 여부까지 쓴다 — 헤더가 이미 받아둔 걸 넘긴다. */
  profile?: MyProfile
  profileError?: string
}

export default function MyPageLayout() {
  // RequireAuth를 통과했으므로 user는 반드시 있다. 통계는 프로필 API가 채운다.
  const { user } = useAuth()
  const { profile, error: profileError, reload: reloadProfile } = useMyProfile()

  // 프로필이 도착하기 전에도 헤더가 비지 않게 로그인 응답의 값을 먼저 쓴다.
  const nickname = profile?.nickname ?? user?.nickname ?? ''
  const level = profile?.level ?? user?.level
  const title = profile?.title ?? user?.title

  /**
   * 다음 레벨까지 남은 온천 수. 서버가 남은 수를 안 줘서 방문 수로 센다.
   * 프로필이 오기 전에는 세지 않는다 — 0개로 보였다가 바뀌면 눈에 거슬린다.
   */
  const toNextLevel =
    profile === undefined ? undefined : visitsToNextLevel(profile.visitedOnsenCount)

  // 방문 온천 수와 리뷰 수는 다르다 — 재방문은 리뷰만 올라간다 (MY-01 비고).
  const stats = [
    { label: '방문한 온천', value: profile?.visitedOnsenCount },
    { label: '리뷰', value: profile?.reviewCount },
    { label: '찜한 장소', value: profile?.favoriteCount },
    { label: '팜플렛', value: profile?.pamphletCount },
  ]

  return (
    <div className="flex flex-col">
      <div className="flex flex-wrap items-center justify-between gap-y-4 py-6">
        <div className="flex min-w-0 items-center gap-4">
          <div
            aria-hidden="true"
            className="bg-inverse text-text-inverse flex size-14 shrink-0 items-center justify-center rounded-full text-[22px] font-bold"
          >
            {nickname.slice(0, 1)}
          </div>
          <div className="flex min-w-0 flex-col gap-1">
            <div className="flex flex-wrap items-center gap-2">
              <span className="max-w-full truncate text-[20px] font-bold">{nickname}</span>
              {level !== undefined && <Badge type="level">{`LV.${level}`}</Badge>}
              {title && <span className="text-text-secondary text-[14px]">{title}</span>}
            </div>

            {/*
              레벨 눈금. 한 칸이 레벨 하나다 — Lv.3이면 5칸 중 3칸이 찬다.
              레벨은 배지와 같은 값(서버)을 쓰고, 남은 수만 방문 수로 센다.
            */}
            {level !== undefined && (
              <div className="mt-1 flex w-full flex-col gap-1.5">
                <div
                  role="img"
                  aria-label={`레벨 ${LEVEL_COUNT}단계 중 ${level}단계`}
                  className="flex gap-1.5"
                >
                  {Array.from({ length: LEVEL_COUNT }, (_, index) => (
                    <span
                      key={index}
                      className={cn(
                        'h-1.5 flex-1 rounded-full',
                        index < level ? 'bg-inverse' : 'bg-border-default/60',
                      )}
                    />
                  ))}
                </div>
                {/* 마지막 레벨이면 더 갈 곳이 없어 줄째로 사라진다. */}
                {toNextLevel !== undefined && (
                  <span className="text-text-secondary text-[12px]">
                    다음 레벨까지 리뷰 {toNextLevel}개
                  </span>
                )}
              </div>
            )}
          </div>
        </div>

        <div className="flex gap-8">
          {stats.map((stat) => (
            <div key={stat.label} className="flex flex-col items-center">
              {/* 로딩 중엔 자리만 잡아둔다 — 0을 보여주면 실제 0과 구분되지 않는다. */}
              <span className="text-[18px] font-bold tabular-nums">{stat.value ?? '—'}</span>
              <span className="text-text-secondary text-[12px]">{stat.label}</span>
            </div>
          ))}
        </div>
      </div>

      {/*
        온천 상세 패널(OnsenDetailPanel)의 탭과 같은 모양이다 — 얇은 밑줄 위에
        고른 탭만 굵은 밑줄이 붙는다. 칸을 채우지 않고 글자 폭만 차지한다.

        role="tab"은 붙이지 않는다. 화면 안에서 내용만 바꾸는 탭이 아니라 주소를
        바꾸는 링크다 — role="tab"은 aria-selected를 요구하는데 NavLink는
        aria-current를 붙인다.
      */}
      <div className="grid gap-8 py-8 md:grid-cols-[120px_minmax(0,1fr)] md:gap-10">
        <nav
          aria-label="마이페이지"
          className="flex flex-wrap gap-x-5 gap-y-2 self-start border-b border-border-default/60 pb-3 md:sticky md:top-24 md:flex-col md:gap-2 md:border-b-0 md:pb-0"
        >
          {TABS.map((tab) => (
            <NavLink
              key={tab.to}
              to={tab.to}
              end={tab.end}
              className={({ isActive }) =>
                cn(
                  'group relative inline-flex min-h-8 items-center leading-5 whitespace-nowrap transition-colors duration-150',
                  'outline-none focus-visible:underline focus-visible:decoration-dotted focus-visible:underline-offset-4',
                  'md:pl-5',
                  isActive
                    ? 'text-text-primary text-[13px] font-semibold'
                    : 'text-text-secondary/72 text-[12.5px] font-normal hover:text-text-primary/82',
                )
              }
            >
              {({ isActive }) => (
                <>
                  <span className="block">{tab.label}</span>
                  <span
                    aria-hidden="true"
                    className={cn(
                      'bg-text-primary pointer-events-none absolute bottom-0 left-0 h-[1px] w-full transition-opacity md:top-1/2 md:bottom-auto md:h-[2px] md:w-3 md:-translate-y-1/2',
                      isActive
                        ? 'opacity-100'
                        : 'opacity-0 group-hover:opacity-35 md:group-hover:opacity-40',
                    )}
                  />
                </>
              )}
            </NavLink>
          ))}
        </nav>

        <div className="min-w-0">
          <Outlet
            context={{ reloadProfile, profile, profileError } satisfies MyPageOutletContext}
          />
        </div>
      </div>
    </div>
  )
}
