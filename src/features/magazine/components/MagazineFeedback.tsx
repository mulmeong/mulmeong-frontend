export default function MagazineFeedback({
  loading,
  error,
  empty,
  retry,
}: {
  loading: boolean
  error?: string
  empty?: boolean
  retry: () => void
}) {
  if (loading)
    return (
      <div
        role="status"
        className="text-text-secondary animate-pulse py-16 text-center text-[13px]"
      >
        이야기를 불러오고 있어요…
      </div>
    )
  if (error)
    return (
      <div role="alert" className="py-12 text-center text-[13px]">
        <p>{error}</p>
        <button type="button" onClick={retry} className="mt-4 underline underline-offset-4">
          다시 시도
        </button>
      </div>
    )
  if (empty)
    return (
      <p className="text-text-secondary py-16 text-center text-[13px]">
        이 조건의 글이 아직 없어요. 다른 지역이나 주제를 둘러보세요.
      </p>
    )
  return null
}
