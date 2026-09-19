import { NavLink, Outlet } from 'react-router-dom'

import Badge from '@/components/ui/Badge'
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
}

export default function MyPageLayout() {
  // RequireAuth를 통과했으므로 user는 반드시 있다. 통계는 프로필 API가 채운다.
  const { user } = useAuth()
  const { profile, reload: reloadProfile } = useMyProfile()

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
          <div className="bg-inverse text-text-inverse flex size-14 shrink-0 items-center justify-center rounded-full text-[22px] font-bold">
            {nickname.slice(0, 1)}
          </div>
          <div className="flex min-w-0 flex-col gap-1">
            <div className="flex flex-wrap items-center gap-2">
              <span className="truncate text-[20px] font-bold">{nickname}</span>
              {level !== undefined && <Badge type="level">{`LV.${level}`}</Badge>}
              {title && <span className="text-text-secondary text-[14px]">{title}</span>}
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

      {/*
        온천 상세 패널(OnsenDetailPanel)의 탭과 같은 모양이다 — 얇은 밑줄 위에
        고른 탭만 굵은 밑줄이 붙는다. 칸을 채우지 않고 글자 폭만 차지한다.
      */}
      <nav
        aria-label="마이페이지"
        className="after:bg-border-default/70 relative flex h-10 shrink-0 gap-6 after:pointer-events-none after:absolute after:inset-x-0 after:bottom-0 after:h-px after:content-['']"
      >
        {TABS.map((tab) => (
          <NavLink
            key={tab.to}
            to={tab.to}
            end={tab.end}
            className={({ isActive }) =>
              cn(
                'relative flex h-10 items-center justify-center text-[13px] leading-5 font-medium whitespace-nowrap',
                'outline-none focus-visible:underline focus-visible:decoration-dotted focus-visible:underline-offset-4',
                isActive ? 'text-text-primary' : 'text-text-primary/65',
              )
            }
          >
            {({ isActive }) => (
              <>
                <span className="block leading-5">{tab.label}</span>
                <span
                  aria-hidden="true"
                  className={cn(
                    'bg-text-primary pointer-events-none absolute inset-x-0 bottom-0 z-10 h-[2px]',
                    isActive ? 'opacity-100' : 'opacity-0',
                  )}
                />
              </>
            )}
          </NavLink>
        ))}
      </nav>

      <div className="py-6">
        <Outlet context={{ reloadProfile } satisfies MyPageOutletContext} />
      </div>
    </div>
  )
}
