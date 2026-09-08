import { NavLink, Outlet } from 'react-router-dom'

import Badge from '@/components/ui/Badge'
import { cn } from '@/lib/cn'

/** 실제 값은 API 연동 후 교체할 것. */
const MOCK_PROFILE = {
  nickname: '온탕러버',
  level: 'LV.1',
  title: '첫 탕',
  stats: [
    { label: '리뷰', value: 24 },
    { label: '찜한 장소', value: 18 },
    { label: '팜플렛', value: 6 },
  ],
}

const TABS = [
  { to: '/my', label: '내 지도', end: true },
  { to: '/my/reviews', label: '내 리뷰' },
  { to: '/my/saved', label: '찜한 장소' },
  { to: '/my/pamphlets', label: '팜플렛' },
  { to: '/my/account', label: '내정보' },
]

export default function MyPageLayout() {
  const { nickname, level, title, stats } = MOCK_PROFILE

  return (
    <div className="flex flex-col">
      <div className="flex items-center justify-between py-6">
        <div className="flex items-center gap-4">
          <div className="bg-inverse text-text-inverse flex size-14 shrink-0 items-center justify-center rounded-full text-[22px] font-bold">
            {nickname.slice(0, 1)}
          </div>
          <div className="flex flex-col gap-1">
            <div className="flex items-center gap-2">
              <span className="text-[20px] font-bold">{nickname}</span>
              <Badge type="level">{level}</Badge>
              <span className="text-text-secondary text-[14px]">{title}</span>
            </div>
          </div>
        </div>

        <div className="flex gap-8">
          {stats.map((stat) => (
            <div key={stat.label} className="flex flex-col items-center">
              <span className="text-[18px] font-bold">{stat.value}</span>
              <span className="text-text-secondary text-[12px]">{stat.label}</span>
            </div>
          ))}
        </div>
      </div>

      <nav role="tablist" className="border-border-default flex border-y">
        {TABS.map((tab) => (
          <NavLink
            key={tab.to}
            to={tab.to}
            end={tab.end}
            role="tab"
            className={({ isActive }) =>
              cn(
                'border-border-default flex items-center justify-center border-r px-5 py-[14px] text-[14px] whitespace-nowrap',
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
        <Outlet />
      </div>
    </div>
  )
}
