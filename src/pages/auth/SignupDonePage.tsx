import { Link, Navigate, useLocation, useNavigate } from 'react-router-dom'

import Badge from '@/components/ui/Badge'
import Button from '@/components/ui/Button'
import AuthLayout from '@/features/auth/components/AuthLayout'
import { AUTH_IMAGES } from '@/features/auth/constants'

type LocationState = { nickname?: string } | null

/** 레벨 구간·칭호는 MY-03 미확정. 확정되면 서버에서 받는다. */
const INITIAL_LEVEL = 1
const INITIAL_TITLE = '첫 탕'

const NEXT_STEPS = [
  {
    step: '01',
    title: '겨울 매거진 읽기',
    description: '눈 맞으며 몸 담그기 좋은 곳 — 여기서 가고 싶은 곳을 찜해두세요',
    action: '읽어보기',
    to: '/magazine',
    primary: true,
  },
  {
    step: '02',
    title: '지도에서 주변 온천 찾기',
    description: '서울역 기준 2시간 내 12곳',
    action: '지도',
    to: '/map',
    primary: false,
  },
  {
    step: '03',
    title: '못 정했으면 다트 던지기',
    description: '선택한 조건으로 랜덤 추천',
    action: '다트',
    to: '/dart',
    primary: false,
  },
] as const

export default function SignupDonePage() {
  const navigate = useNavigate()
  const { state } = useLocation() as { state: LocationState }
  const nickname = state?.nickname

  // 가입 흐름을 거치지 않고 URL로 직접 들어온 경우.
  if (!nickname) return <Navigate to="/signup" replace />

  return (
    <AuthLayout
      image={AUTH_IMAGES.signup.src}
      imageRatio={AUTH_IMAGES.signup.ratio}
      headline={['첫 칸을', '채워볼까요']}
    >
      <h1 className="text-[32px] leading-[1.3] font-bold sm:text-[38px]">
        <span className="block">{nickname}님,</span>
        <span className="block">가입이 완료되었습니다</span>
      </h1>

      <div className="border-border-default mt-7 flex items-center gap-3 rounded-md border px-5 py-4">
        <span className="bg-inverse text-text-inverse flex size-11 shrink-0 items-center justify-center rounded-full text-[15px] font-bold">
          {nickname.slice(0, 1)}
        </span>
        <span className="min-w-0 truncate text-[15px] font-bold">{nickname}</span>
        <Badge>LV.{INITIAL_LEVEL}</Badge>
        <span className="text-text-secondary text-[13px]">{INITIAL_TITLE}</span>
      </div>

      <p className="text-text-secondary mt-8 text-[12px] tracking-[1px]">이렇게 시작해보세요</p>

      <ul className="mt-4 flex flex-col">
        {NEXT_STEPS.map(({ step, title, description, action, to, primary }) => (
          <li
            key={step}
            className="border-border-default flex items-center gap-4 border-t py-4 last:border-b"
          >
            <span className="text-text-secondary shrink-0 text-[18px]">{step}</span>
            <div className="min-w-0 flex-1">
              <p className="text-[15px] font-bold">{title}</p>
              <p className="text-text-secondary mt-1 text-[12px] leading-[1.5]">{description}</p>
            </div>
            <Button
              hierarchy={primary ? 'primary' : 'secondary'}
              onClick={() => navigate(to)}
              className="shrink-0"
            >
              {action}
            </Button>
          </li>
        ))}
      </ul>

      <Link to="/" className="mt-7 block">
        <Button size="large" className="w-full">
          홈으로
        </Button>
      </Link>
    </AuthLayout>
  )
}
