import { Link } from 'react-router-dom'

export default function NotFoundPage() {
  return (
    <section className="space-y-3">
      <h1 className="text-3xl font-bold tracking-tight">404</h1>
      <p className="text-slate-600 dark:text-slate-400">페이지를 찾을 수 없습니다.</p>
      <Link to="/" className="inline-block text-blue-600 underline dark:text-blue-400">
        홈으로 돌아가기
      </Link>
    </section>
  )
}
