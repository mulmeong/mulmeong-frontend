import { useEffect, useRef } from 'react'

type SaveCompleteModalProps = {
  open: boolean
  onsenName: string
  onClose: () => void
  onGoToSaved: () => void
}

/**
 * 찜 완료 안내.
 *
 * div로 직접 만들지 않고 <dialog>를 쓴다 — 포커스 가두기, Escape로 닫기,
 * 다른 요소 위에 겹치기, 뒤쪽 콘텐츠를 스크린 리더에서 가리기까지
 * 브라우저가 처리해준다. 직접 구현하면 대부분 빠뜨린다.
 */
export default function SaveCompleteModal({
  open,
  onsenName,
  onClose,
  onGoToSaved,
}: SaveCompleteModalProps) {
  const ref = useRef<HTMLDialogElement>(null)

  useEffect(() => {
    const dialog = ref.current
    if (!dialog) return

    // showModal()이어야 포커스가 갇히고 ::backdrop이 생긴다. show()는 아니다.
    if (open && !dialog.open) dialog.showModal()
    if (!open && dialog.open) dialog.close()
  }, [open])

  return (
    <dialog
      ref={ref}
      // Escape로 닫혔을 때도 부모 상태를 맞춘다.
      onClose={onClose}
      // 배경을 누르면 닫는다. 내용 안을 누른 경우는 target이 dialog가 아니다.
      onClick={(event) => {
        if (event.target === ref.current) onClose()
      }}
      aria-labelledby="save-complete-title"
      // Tailwind 프리플라이트가 margin을 0으로 만들어 기본 가운데 정렬이 풀린다.
      className="m-auto w-[434px] max-w-[calc(100vw-2rem)] bg-white text-[#0E1513] backdrop:bg-black/40"
    >
      <div className="px-[30px] pt-7 pb-6">
        <span className="text-[11.5px] font-bold tracking-[0.14em] text-[#8A9491]">찜 완료</span>

        {/*
          '을(를)'은 시안 문구 그대로다. 받침에 따라 조사를 고르면 더 자연스럽지만
          (덕구온천'을') 시안이 두 형태를 같이 쓰는 표기를 택했다.
        */}
        <h2
          id="save-complete-title"
          className="mt-3 text-[24px] leading-[1.35] font-bold tracking-[-0.04em]"
        >
          <span className="block">{onsenName}을(를)</span>
          <span className="block">찜한 장소에 담았습니다</span>
        </h2>

        <p className="mt-4 text-[12.5px] leading-[1.7] text-[#8A9491]">
          마이페이지에서 확인하고, 여러 곳을 골라 팜플렛으로 만들어보세요.
        </p>
      </div>

      <div className="flex gap-2 border-t border-[#E2E5E4] px-[30px] pt-4 pb-[22px]">
        <button
          type="button"
          onClick={onGoToSaved}
          className="flex-1 bg-[#0E1513] px-4 py-3.5 text-[13.5px] font-bold text-white"
        >
          찜한 장소 보러가기
        </button>
        <button
          type="button"
          onClick={onClose}
          className="shrink-0 border border-[#D8DCDB] px-6 py-3.5 text-[13.5px] font-normal text-[#0E1513]"
        >
          닫기
        </button>
      </div>
    </dialog>
  )
}
