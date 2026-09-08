import { Outlet } from 'react-router-dom'

import Header from '@/components/ui/Header'

export default function RootLayout() {
  return (
    <div className="bg-surface text-text-primary min-h-screen">
      <Header />
      <main className="mx-auto max-w-5xl px-6 py-10">
        <Outlet />
      </main>
    </div>
  )
}
