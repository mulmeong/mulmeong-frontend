import { createBrowserRouter } from 'react-router-dom'

import RootLayout from '@/components/RootLayout'
import MyPageLayout from '@/features/mypage/components/MyPageLayout'
import DartPage from '@/pages/DartPage'
import HomePage from '@/pages/HomePage'
import MapPage from '@/pages/MapPage'
import NotFoundPage from '@/pages/NotFoundPage'
import LoginPage from '@/pages/auth/LoginPage'
import SignupDonePage from '@/pages/auth/SignupDonePage'
import SignupPage from '@/pages/auth/SignupPage'
import MyAccountPage from '@/pages/mypage/MyAccountPage'
import MyMapPage from '@/pages/mypage/MyMapPage'
import MyPamphletsPage from '@/pages/mypage/MyPamphletsPage'
import MyReviewsPage from '@/pages/mypage/MyReviewsPage'
import MySavedPage from '@/pages/mypage/MySavedPage'

export const router = createBrowserRouter([
  // 홈과 인증 화면은 RootLayout의 헤더·여백을 쓰지 않는 전체화면이라 밖에 둔다.
  // 홈은 히어로 위에 헤더를 띄워야 해서 Header를 직접 렌더링한다.
  { path: '/', element: <HomePage /> },
  { path: '/login', element: <LoginPage /> },
  { path: '/signup', element: <SignupPage /> },
  { path: '/signup/done', element: <SignupDonePage /> },
  // 지도는 화면을 꽉 채우는 레이아웃이라 RootLayout 밖에 둔다 (헤더는 페이지가 직접 렌더).
  { path: '/map', element: <MapPage /> },
  // 다트도 같은 이유 — 왼쪽 지도 + 오른쪽 400px 패널로 화면을 채운다.
  { path: '/dart', element: <DartPage /> },
  {
    path: '/',
    element: <RootLayout />,
    children: [
      {
        path: 'my',
        element: <MyPageLayout />,
        children: [
          { index: true, element: <MyMapPage /> },
          { path: 'reviews', element: <MyReviewsPage /> },
          { path: 'saved', element: <MySavedPage /> },
          { path: 'pamphlets', element: <MyPamphletsPage /> },
          { path: 'account', element: <MyAccountPage /> },
        ],
      },
      { path: '*', element: <NotFoundPage /> },
    ],
  },
])
