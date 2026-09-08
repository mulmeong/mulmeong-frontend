import { createBrowserRouter } from 'react-router-dom'

import RootLayout from '@/components/RootLayout'
import MyPageLayout from '@/features/mypage/components/MyPageLayout'
import HomePage from '@/pages/HomePage'
import NotFoundPage from '@/pages/NotFoundPage'
import MyAccountPage from '@/pages/mypage/MyAccountPage'
import MyMapPage from '@/pages/mypage/MyMapPage'
import MyPamphletsPage from '@/pages/mypage/MyPamphletsPage'
import MyReviewsPage from '@/pages/mypage/MyReviewsPage'
import MySavedPage from '@/pages/mypage/MySavedPage'

export const router = createBrowserRouter([
  {
    path: '/',
    element: <RootLayout />,
    children: [
      { index: true, element: <HomePage /> },
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
