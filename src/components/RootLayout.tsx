import { Outlet } from 'react-router-dom'

import Footer from '@/components/Footer'
import AuthHeader from '@/features/auth/components/AuthHeader'

export default function RootLayout() {
  return (
    <div className="bg-surface text-text-primary flex min-h-screen flex-col">
      <AuthHeader />
      <main className="mx-auto w-full max-w-5xl flex-1 px-6 py-10">
        <Outlet />
      </main>
      <Footer />
    </div>
  )
}
