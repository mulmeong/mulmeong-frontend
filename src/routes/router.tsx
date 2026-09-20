import { createBrowserRouter } from 'react-router-dom'

import RootLayout from '@/components/RootLayout'
import AuthProvider from '@/features/auth/components/AuthProvider'
import RequireAuth from '@/features/auth/components/RequireAuth'
import MyPageLayout from '@/features/mypage/components/MyPageLayout'
import DartPage from '@/pages/DartPage'
import HomePage from '@/pages/HomePage'
import MagazineArchivePage from '@/pages/MagazineArchivePage'
import MagazineDetailPage from '@/pages/MagazineDetailPage'
import MagazinePage from '@/pages/MagazinePage'
import MapPage from '@/pages/MapPage'
import NotFoundPage from '@/pages/NotFoundPage'
import SharedDartPage from '@/pages/SharedDartPage'
import SharedPamphletPage from '@/pages/SharedPamphletPage'
import LoginPage from '@/pages/auth/LoginPage'
import PasswordResetPage from '@/pages/auth/PasswordResetPage'
import ResetPasswordPage from '@/pages/auth/ResetPasswordPage'
import SignupDonePage from '@/pages/auth/SignupDonePage'
import SignupPage from '@/pages/auth/SignupPage'
import MyAccountPage from '@/pages/mypage/MyAccountPage'
import MyMapPage from '@/pages/mypage/MyMapPage'
import MyPamphletsPage from '@/pages/mypage/MyPamphletsPage'
import MyReviewsPage from '@/pages/mypage/MyReviewsPage'
import MySavedPage from '@/pages/mypage/MySavedPage'

export const router = createBrowserRouter([
  {
    // 로그인 상태는 화면 전체가 공유한다 — 헤더·마이페이지가 같은 값을 봐야 한다.
    element: <AuthProvider />,
    children: [
      // 홈과 인증 화면은 RootLayout의 헤더·여백을 쓰지 않는 전체화면이라 밖에 둔다.
      // 홈은 히어로 위에 헤더를 띄워야 해서 Header를 직접 렌더링한다.
      { path: '/', element: <HomePage /> },
      { path: '/login', element: <LoginPage /> },
      { path: '/password-reset', element: <PasswordResetPage /> },
      { path: '/reset-password', element: <ResetPasswordPage /> },
      { path: '/signup', element: <SignupPage /> },
      { path: '/signup/done', element: <SignupDonePage /> },
      // 지도는 화면을 꽉 채우는 레이아웃이라 RootLayout 밖에 둔다 (헤더는 페이지가 직접 렌더).
      { path: '/map', element: <MapPage /> },
      // 다트도 같은 이유 — 왼쪽 지도 + 오른쪽 400px 패널로 화면을 채운다.
      { path: '/dart', element: <DartPage /> },
      // 공유 링크 (DART-06). 로그인 없이 열려야 해서 RequireAuth 밖이다.
      { path: '/dart/:dartId', element: <SharedDartPage /> },
      {
        path: '/',
        element: <RootLayout />,
        children: [
          // 공유 링크는 비로그인도 열린다 (AUTH-02). 서버 SHARE_BASE와 같은 경로다.
          { path: 'pamphlet/:token', element: <SharedPamphletPage /> },
          { path: 'magazine', element: <MagazinePage /> },
          { path: 'magazine/archive', element: <MagazineArchivePage /> },
          { path: 'magazine/:id', element: <MagazineDetailPage /> },
          {
            // 마이페이지 전체는 로그인 필요 (AUTH-02).
            element: <RequireAuth />,
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
            ],
          },
          { path: '*', element: <NotFoundPage /> },
        ],
      },
    ],
  },
])
