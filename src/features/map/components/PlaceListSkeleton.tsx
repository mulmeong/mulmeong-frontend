/** 검색·지역 전체 목록과 같은 행 높이. 스켈레톤에는 포커스 가능한 요소를 두지 않는다. */
export default function PlaceListSkeleton({ count = 6 }: { count?: number }) {
  return (
    <div role="status">
      <span className="sr-only">장소를 불러오는 중…</span>
      <ul aria-hidden="true" className="mt-2 motion-safe:animate-pulse">
        {Array.from({ length: count }, (_, index) => (
          <li key={index} className="flex h-20 items-center gap-3">
            <div className="bg-surface-dim size-11 shrink-0 rounded-sm" />
            <div className="flex-1 space-y-2">
              <div className="bg-border-default/40 h-3 w-2/3 rounded-full" />
              <div className="bg-border-default/30 h-2.5 w-1/2 rounded-full" />
              <div className="bg-border-default/30 h-2 w-1/3 rounded-full" />
            </div>
          </li>
        ))}
      </ul>
    </div>
  )
}
