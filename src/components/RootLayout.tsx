import { Outlet } from 'react-router-dom'

import Footer from '@/components/Footer'
import AuthHeader from '@/features/auth/components/AuthHeader'

export default function RootLayout() {
  return (
    // overflow-x-hidden을 여기 둔다 — 매거진 홈의 전체폭 배너(margin: calc(50vw - 50%))
    // 바로 위 조상에 overflow가 걸리면 그 부모의 제한된 폭이 계산에 섞여 배너가
    // 한쪽으로 밀려 잘린다. 뷰포트에 가장 가까운 이 최상위에서만 가로 스크롤을 막는다.
    <div className="bg-surface text-text-primary flex min-h-screen flex-col overflow-x-hidden">
      <AuthHeader />
      <main className="mx-auto w-full max-w-5xl flex-1 px-6 py-10">
        <Outlet />
      </main>
      <Footer />
    </div>
  )
}
