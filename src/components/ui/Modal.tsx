import { useEffect, useId, useRef, type ReactNode } from 'react'

import { cn } from '@/lib/cn'

type ModalAction = {
  label: ReactNode
  onClick: () => void
  disabled?: boolean
}

type ModalProps = {
  open: boolean
  onClose: () => void
  /** 제목 위 작은 라벨. 예: '찜 완료' */
  kicker?: string
  title: ReactNode
  description?: ReactNode
  children?: ReactNode
  showCloseButton?: boolean
  /** 왼쪽 채움 버튼 */
  primaryAction?: ModalAction
  /** 오른쪽 테두리 버튼 */
  secondaryAction?: ModalAction
  className?: string
}

/**
 * 안내·확인 모달.
 *
 * div로 직접 만들지 않고 <dialog>를 쓴다 — 포커스 가두기, Escape로 닫기,
 * 다른 요소 위에 겹치기, 뒤쪽 콘텐츠를 스크린 리더에서 가리기까지
 * 브라우저가 처리해준다. 직접 구현하면 대부분 빠뜨린다.
 *
 * 크기·여백·색은 다트 찜 완료 모달(dart-5a 시안)과 같은 값이다.
 * 시안 팔레트가 프로젝트 토큰과 미묘하게 달라(#0E1513 vs --color-inverse #1c1b18)
 * 여기서는 시안 값을 그대로 쓴다. 어느 쪽으로 통일할지는 팀 합의가 필요하다.
 */
export default function Modal({
  open,
  onClose,
  kicker,
  title,
  description,
  children,
  showCloseButton = false,
  primaryAction,
  secondaryAction,
  className,
}: ModalProps) {
  const ref = useRef<HTMLDialogElement>(null)
  const titleId = useId()

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
      onClose={() => {
        if (open && !ref.current?.open) onClose()
      }}
      // 배경을 누르면 닫는다. 내용 안을 누른 경우는 target이 dialog가 아니다.
      onClick={(event) => {
        if (event.target === ref.current) onClose()
      }}
      aria-labelledby={titleId}
      className={cn(
        // Tailwind 프리플라이트가 margin을 0으로 만들어 기본 가운데 정렬이 풀린다.
        'm-auto w-[434px] max-w-[calc(100vw-2rem)] bg-white text-[#0E1513]',
        'backdrop:bg-black/40',
        className,
      )}
    >
      <div className="relative px-[30px] pt-7 pb-6">
        {showCloseButton && (
          <button
            type="button"
            aria-label="닫기"
            title="닫기"
            onClick={onClose}
            className="text-text-secondary hover:text-text-primary absolute top-3 right-3 flex size-11 items-center justify-center text-[18px] leading-none"
          >
            ✕
          </button>
        )}
        {kicker && (
          <span className="text-[11.5px] font-bold tracking-[0.14em] text-[#8A9491]">{kicker}</span>
        )}

        <h2
          id={titleId}
          className={cn(
            'text-[24px] leading-[1.35] font-bold tracking-[-0.04em]',
            kicker && 'mt-3',
            showCloseButton && 'pr-8 tracking-normal',
          )}
        >
          {title}
        </h2>

        {/*
          div로 감싼다. description은 ReactNode라 글만 오는 게 아니라 입력칸도
          들어오는데(팜플렛 만들기), <p> 안에 <p>를 넣으면 브라우저가 앞의 <p>를
          닫아버려서 DOM이 의도와 다르게 잡힌다.
        */}
        {description && (
          <div className="mt-4 text-[12.5px] leading-[1.7] text-[#8A9491]">{description}</div>
        )}
        {children && <div className="mt-6">{children}</div>}
      </div>

      {(primaryAction || secondaryAction) && (
        <div className="flex gap-2 border-t border-[#E2E5E4] px-[30px] pt-4 pb-[22px]">
          {primaryAction && (
            <button
              type="button"
              onClick={primaryAction.onClick}
              disabled={primaryAction.disabled}
              className="flex-1 bg-[#0E1513] px-4 py-3.5 text-[13.5px] font-bold text-white disabled:opacity-40"
            >
              {primaryAction.label}
            </button>
          )}
          {secondaryAction && (
            <button
              type="button"
              onClick={secondaryAction.onClick}
              disabled={secondaryAction.disabled}
              className="shrink-0 border border-[#D8DCDB] px-6 py-3.5 text-[13.5px] font-normal text-[#0E1513] disabled:opacity-40"
            >
              {secondaryAction.label}
            </button>
          )}
        </div>
      )}
    </dialog>
  )
}
