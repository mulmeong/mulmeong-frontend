import { Outlet } from 'react-router-dom'

import AuthHeader from '@/features/auth/components/AuthHeader'

export default function RootLayout() {
  return (
    <div className="bg-surface text-text-primary min-h-screen">
      <AuthHeader />
      <main className="mx-auto max-w-5xl px-6 py-10">
        <Outlet />
      </main>
    </div>
  )
}
