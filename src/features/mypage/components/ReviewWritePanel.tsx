import { useEffect, useRef, useState } from 'react'

import ReviewForm from '@/features/map/components/ReviewForm'
import { useSuggestions } from '@/features/map/hooks/useSuggestions'
import { cn } from '@/lib/cn'

type PickedOnsen = { id: number; name: string; address: string }

type ReviewWritePanelProps = {
  open: boolean
  onClose: () => void
  /** 리뷰가 등록된 뒤 — 목록과 헤더 통계를 다시 불러오라는 뜻. */
  onCreated: () => void
}

/**
 * 마이페이지에서 리뷰 쓰기.
 *
 * 지도 화면에서는 이미 온천 카드를 열어둔 채로 쓰기 때문에 어느 온천인지
 * 정하는 단계가 없다. 여기는 그 단계부터 시작해야 해서, 온천을 먼저 고르고
 * 폼을 띄우는 두 단계로 나눴다.
 *
 * 폼 자체와 검색은 지도 쪽 것을 그대로 쓴다 — 작성 계약(REV-01)과 보상 처리가
 * 거기 들어 있어서 베끼면 고칠 곳이 두 군데가 된다.
 */
export default function ReviewWritePanel({ open, onClose, onCreated }: ReviewWritePanelProps) {
  const ref = useRef<HTMLDialogElement>(null)

  const [keyword, setKeyword] = useState('')
  const [picked, setPicked] = useState<PickedOnsen>()

  const { suggestions } = useSuggestions(keyword, open && !picked)

  useEffect(() => {
    const dialog = ref.current
    if (!dialog) return
    // showModal()이어야 포커스가 갇히고 ::backdrop이 생긴다. show()는 아니다.
    if (open && !dialog.open) dialog.showModal()
    if (!open && dialog.open) dialog.close()
  }, [open])

  /** 닫을 때 고른 온천과 검색어를 비운다 — 다시 열면 처음부터 시작해야 한다. */
  const close = () => {
    setKeyword('')
    setPicked(undefined)
    onClose()
  }

  return (
    <dialog
      ref={ref}
      onClose={close}
      onClick={(event) => {
        if (event.target === ref.current) close()
      }}
      aria-label="리뷰 작성"
      className={cn(
        // 프리플라이트가 margin을 0으로 만들어 기본 정렬이 풀린다. 오른쪽에 붙인다.
        'my-0 mr-0 ml-auto h-dvh max-h-dvh w-[400px] max-w-full',
        'overflow-hidden p-0',
        'bg-surface text-text-primary backdrop:bg-black/40',
      )}
    >
      <div className="flex h-full flex-col">
        <header className="border-border-default flex items-center justify-between border-b px-6 py-4">
          <h2 className="text-[15px] font-bold">리뷰 작성</h2>
          <button
            type="button"
            onClick={close}
            aria-label="닫기"
            className="text-text-secondary hover:text-text-primary text-[18px] leading-none"
          >
            ✕
          </button>
        </header>

        {/* min-h-0이 없으면 flex 항목이 내용 높이만큼 부모를 밀어낸다. */}
        <div className="min-h-0 flex-1 overflow-y-auto px-6 py-5">
          {picked ? (
            <>
              <h3 className="text-[18px] font-bold">{picked.name}</h3>
              <p className="text-text-secondary mt-1 text-[12px]">온천 · {picked.address}</p>
              <button
                type="button"
                onClick={() => setPicked(undefined)}
                className="text-text-secondary mt-1.5 mb-5 text-[12px] underline underline-offset-[3px]"
              >
                다른 온천 고르기
              </button>

              <ReviewForm onsenId={picked.id} onCancel={close} onCreated={onCreated} />
            </>
          ) : (
            <>
              <label htmlFor="reviewOnsenSearch" className="text-text-primary text-[13px]">
                어느 온천에 다녀오셨나요?
              </label>
              <input
                id="reviewOnsenSearch"
                type="search"
                value={keyword}
                onChange={(event) => setKeyword(event.target.value)}
                placeholder="온천 이름으로 검색"
                autoComplete="off"
                className="border-border-default text-text-primary mt-1.5 h-10 w-full rounded-sm border px-3 text-[13px] outline-none"
              />

              {suggestions.length > 0 ? (
                <ul className="divide-border-default/60 mt-3 flex flex-col divide-y">
                  {suggestions.map((item) =>
                    // 검색은 지역명도 같이 내려준다. 리뷰는 온천에만 쓰므로 그것만 고른다.
                    item.type === 'onsen' ? (
                      <li key={item.id}>
                        <button
                          type="button"
                          onClick={() =>
                            setPicked({ id: item.id, name: item.name, address: item.address })
                          }
                          className="hover:bg-surface-dim -mx-2 flex w-[calc(100%+1rem)] flex-col gap-0.5 px-2 py-3 text-left"
                        >
                          <span className="text-text-primary text-[14px] font-semibold">
                            {item.name}
                          </span>
                          <span className="text-text-secondary text-[12px]">{item.address}</span>
                        </button>
                      </li>
                    ) : null,
                  )}
                </ul>
              ) : (
                <p className="text-text-secondary mt-3 text-[12px] leading-[1.7]">
                  {keyword.trim()
                    ? '찾는 온천이 없어요. 이름을 다르게 써보세요.'
                    : '이름 일부만 넣어도 찾아줘요. 예: 수안보'}
                </p>
              )}
            </>
          )}
        </div>
      </div>
    </dialog>
  )
}
