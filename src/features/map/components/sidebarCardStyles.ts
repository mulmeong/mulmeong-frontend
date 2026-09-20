// 한 화면에 두 카드를 표시하고 화살표·마우스 드래그·터치 스와이프로 탐색한다.
export const SIDEBAR_CARD_TRACK =
  'mt-3 grid w-full min-w-0 auto-cols-[calc((100%-12px)/2)] grid-flow-col gap-3 overflow-x-auto overscroll-x-contain snap-x snap-mandatory py-1 outline-none [scrollbar-width:none] focus-visible:ring-2 focus-visible:ring-border-strong focus-visible:ring-inset [&::-webkit-scrollbar]:hidden cursor-grab select-none [&_a]:cursor-inherit [&_button]:cursor-inherit data-[dragging=true]:cursor-grabbing [&[data-dragging=true]_*]:cursor-grabbing'

export const SIDEBAR_CARD_IMAGE =
  'bg-surface-dim relative flex aspect-[16/9] w-full items-center justify-center overflow-hidden rounded-[2px]'
