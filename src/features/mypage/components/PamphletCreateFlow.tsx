import { useEffect, useId, useRef, useState } from 'react'

import PamphletCover from '@/features/mypage/components/PamphletCover'
import PamphletPreview from '@/features/mypage/components/PamphletPreview'
import { shareLinkOf, type CreatedPamphlet, type PamphletDetail } from '@/types/pamphlet'

type PamphletCreateFlowProps = {
  /** 엮는 중 문구에 쓸 선택 장소 수. 만들어지기 전에도 보여줘야 해서 따로 받는다. */
  placeCount: number
  created?: CreatedPamphlet
  detail?: PamphletDetail
  error?: string
  onClose: () => void
  onManage: (pamphletId: number) => void
  onRetry?: () => void
}

/** 쌓이는 종이. 고른 장소 수만큼 보여주되 5장을 넘기지 않는다. */
function WeavingStack({ count }: { count: number }) {
  const sheets = Math.min(Math.max(count, 2), 5)
  return (
    <div className="pamphlet-weaving-stack" aria-hidden="true">
      {Array.from({ length: sheets }, (_, index) => (
        <span
          key={index}
          className="pamphlet-weaving-sheet"
          style={{
            animationDelay: `${index * 180}ms`,
            // 장마다 조금씩 기울여 쌓인 느낌을 준다.
            ['--sheet-tilt' as string]: `${(index - (sheets - 1) / 2) * 2.4}deg`,
          }}
        />
      ))}
    </div>
  )
}

/**
 * 팜플렛 만들기 흐름 — 엮는 중 → 표지 → 펼침 → 미리보기.
 *
 * 만들어진 뒤에도 페이지를 옮기지 않는다. 방금 만든 결과를 먼저 보게 하고,
 * 이동은 사용자가 고른다.
 *
 * Modal(ui)을 쓰지 않는 이유는 폭이 434px로 고정이고 title·description 구조라
 * 미리보기가 들어갈 자리가 없어서다. <dialog>를 쓰는 방식은 그대로 따른다.
 */
export default function PamphletCreateFlow({
  placeCount,
  created,
  detail,
  error,
  onClose,
  onManage,
  onRetry,
}: PamphletCreateFlowProps) {
  const ref = useRef<HTMLDialogElement>(null)
  const titleId = useId()
  const [copied, setCopied] = useState(false)
  /** 표지가 먼저 뜨고 그다음 펼쳐진다. 결과가 갑자기 튀어나오지 않게. */
  const [unfolded, setUnfolded] = useState(false)

  useEffect(() => {
    const dialog = ref.current
    if (dialog && !dialog.open) dialog.showModal()
  }, [])

  // 상세가 도착하면 표지를 잠깐 보여준 뒤 펼친다.
  useEffect(() => {
    if (!detail || unfolded) return
    const timer = setTimeout(() => setUnfolded(true), 420)
    return () => clearTimeout(timer)
  }, [detail, unfolded])

  const shareUrl = created ? shareLinkOf(created.shareToken) : ''

  const share = async () => {
    if (!shareUrl) return
    const title = created?.title ?? '물멍 팜플렛'

    if (navigator.share) {
      try {
        await navigator.share({ title, text: `${title} · 물멍 팜플렛`, url: shareUrl })
        return
      } catch (cause) {
        // 사용자가 공유 시트를 닫은 것뿐이면 복사로 넘어가지 않는다.
        if (cause instanceof DOMException && cause.name === 'AbortError') return
      }
    }

    try {
      await navigator.clipboard.writeText(shareUrl)
      setCopied(true)
    } catch {
      // 클립보드는 https나 사용자 동작이 아니면 막힌다. 링크는 화면에 그대로 있다.
      setCopied(false)
    }
  }

  const ready = created && detail && unfolded

  return (
    <dialog
      ref={ref}
      onClose={onClose}
      onClick={(event) => {
        if (event.target === ref.current) onClose()
      }}
      aria-labelledby={titleId}
      aria-busy={!created || !detail}
      className="m-auto w-[520px] max-w-[calc(100vw-2rem)] bg-white text-[#0E1513] backdrop:bg-black/40"
    >
      <div className="relative">
        <button
          type="button"
          aria-label="닫기"
          title="닫기"
          onClick={onClose}
          className="text-text-secondary hover:text-text-primary absolute top-2 right-2 z-10 flex size-11 items-center justify-center text-[18px] leading-none"
        >
          ✕
        </button>

        {error ? (
          <div className="px-[30px] py-14 text-center">
            <h2 id={titleId} className="text-[18px] font-bold tracking-[-0.03em]">
              팜플렛을 만들지 못했어요
            </h2>
            <p role="alert" className="text-text-secondary mt-3 text-[13px] leading-[1.7]">
              {error}
            </p>
            {onRetry && (
              <button
                type="button"
                onClick={onRetry}
                className="mt-6 bg-[#0E1513] px-6 py-3 text-[13.5px] font-bold text-white"
              >
                다시 시도
              </button>
            )}
          </div>
        ) : !created || !detail ? (
          <div className="pamphlet-weaving">
            <WeavingStack count={placeCount} />
            <div>
              <h2 id={titleId} className="pamphlet-weaving-copy">
                팜플렛을 엮고 있어요
              </h2>
              <p className="pamphlet-weaving-sub">
                선택한 {placeCount}곳을 하나의 여행책자로 만들고 있어요.
              </p>
            </div>
          </div>
        ) : !unfolded ? (
          // 표지만 먼저. 바로 아래에서 같은 자리를 미리보기가 이어받는다.
          <div className="pamphlet-reveal">
            <div className="pamphlet-reveal-cover">
              <h2 id={titleId} className="sr-only">
                {created.title} 팜플렛이 완성되었습니다
              </h2>
              <PamphletCover
                number={String(created.placeCount).padStart(2, '0')}
                title={created.title}
                placeCount={created.placeCount}
                createdAt={created.createdAt}
              />
            </div>
          </div>
        ) : (
          <div className="pamphlet-unfold max-h-[min(70vh,640px)]">
            <h2 id={titleId} className="sr-only">
              {created.title} 팜플렛이 완성되었습니다
            </h2>
            <PamphletPreview detail={detail} />
          </div>
        )}
      </div>

      {ready && (
        <div className="flex flex-col gap-2 border-t border-[#E2E5E4] px-[30px] pt-4 pb-[22px]">
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => void share()}
              className="flex-1 bg-[#0E1513] px-4 py-3.5 text-[13.5px] font-bold text-white"
            >
              링크로 공유
            </button>
            <button
              type="button"
              onClick={() => onManage(created.pamphletId)}
              className="shrink-0 border border-[#D8DCDB] px-6 py-3.5 text-[13.5px] font-normal text-[#0E1513]"
            >
              팜플렛 관리
            </button>
          </div>
          {/* 복사된 링크는 화면에도 남긴다 — 클립보드가 막힌 환경에서 직접 집을 수 있게. */}
          {copied && (
            <p role="status" className="text-text-secondary text-[12px] leading-[1.6]">
              공유 링크를 복사했어요. <span className="break-all">{shareUrl}</span>
            </p>
          )}
        </div>
      )}
    </dialog>
  )
}
