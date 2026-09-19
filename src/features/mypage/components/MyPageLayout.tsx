import { NavLink, Outlet, useMatch } from 'react-router-dom'

import Badge from '@/components/ui/Badge'
import type { MyProfile } from '@/types/user'

import { useAuth } from '@/features/auth/hooks/authContext'
import { useMyProfile } from '@/features/mypage/hooks/useMyProfile'
import { cn } from '@/lib/cn'

const TABS = [
  { to: '/my', label: '내 지도', end: true },
  { to: '/my/reviews', label: '내 리뷰' },
  { to: '/my/saved', label: '찜한 장소' },
  { to: '/my/pamphlets', label: '팜플렛' },
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
  const isAccountPage = useMatch('/my/account') !== null
  // RequireAuth를 통과했으므로 user는 반드시 있다. 통계는 프로필 API가 채운다.
  const { user } = useAuth()
  const { profile, error: profileError, reload: reloadProfile } = useMyProfile()

  // 프로필이 도착하기 전에도 헤더가 비지 않게 로그인 응답의 값을 먼저 쓴다.
  const nickname = profile?.nickname ?? user?.nickname ?? ''
  const level = profile?.level ?? user?.level
  const title = profile?.title ?? user?.title

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
            {isAccountPage ? (
              <svg
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
                className="size-7"
              >
                <circle cx="12" cy="8" r="3.5" />
                <path d="M5 20v-2a7 7 0 0 1 14 0v2" />
              </svg>
            ) : (
              nickname.slice(0, 1)
            )}
          </div>
          <div className="flex min-w-0 flex-col gap-1">
            <div
              className={cn(
                'flex',
                isAccountPage ? 'flex-col items-start gap-1.5' : 'flex-wrap items-center gap-2',
              )}
            >
              <span
                className={cn(
                  'max-w-full truncate font-semibold',
                  isAccountPage ? 'text-[24px] leading-8' : 'text-[20px] font-bold',
                )}
              >
                {nickname}
              </span>
              <div className={isAccountPage ? 'flex flex-wrap items-center gap-2' : 'contents'}>
                {level !== undefined && <Badge type="level">{`LV.${level}`}</Badge>}
                {title && (
                  <span
                    className={cn(
                      'text-[14px]',
                      isAccountPage ? 'text-text-primary/65' : 'text-text-secondary',
                    )}
                  >
                    {title}
                  </span>
                )}
              </div>
            </div>
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

      <nav role="tablist" className="border-border-default flex overflow-x-auto border-y">
        {TABS.map((tab) => (
          <NavLink
            key={tab.to}
            to={tab.to}
            end={tab.end}
            role="tab"
            className={({ isActive }) =>
              cn(
                'border-border-default flex min-w-0 flex-1 items-center justify-center border-r px-1 py-[14px] text-[12px] whitespace-nowrap sm:flex-none sm:px-5 sm:text-[14px]',
                isActive
                  ? 'bg-inverse text-text-inverse font-semibold'
                  : 'bg-surface text-text-primary font-normal',
              )
            }
          >
            {tab.label}
          </NavLink>
        ))}
      </nav>

      <div className="py-6">
        <Outlet context={{ reloadProfile, profile, profileError } satisfies MyPageOutletContext} />
      </div>
    </div>
  )
}
