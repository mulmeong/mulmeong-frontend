import { Outlet } from 'react-router-dom'

import Footer from '@/components/Footer'
import AuthHeader from '@/features/auth/components/AuthHeader'

export default function RootLayout() {
  return (
    // overflow-x-hidden을 여기 두지 않는다 — React 트리 안의 요소에 overflow를
    // 걸면(축 하나만 줘도 스펙상 다른 축이 auto로 강제된다) 그 요소가 sticky의
    // 기준 스크롤 컨테이너가 되어, 안쪽 sticky 카드가 문서 스크롤을 못 따라간다.
    // 매거진 배너가 필요로 하는 전체폭(margin: calc(50vw - 50%))은
    // index.css의 scrollbar-gutter: stable로 스크롤바 폭 오차 자체를 없애서 해결한다.
    <div className="bg-surface text-text-primary flex min-h-screen flex-col">
      <AuthHeader />
      <main className="mx-auto w-full max-w-5xl flex-1 px-6 py-10">
        <Outlet />
      </main>
      <Footer />
    </div>
  )
}
