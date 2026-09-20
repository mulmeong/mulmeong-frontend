import { useLayoutEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'

import {
  PamphletEnd,
  PamphletIntro,
  PamphletPlace,
} from '@/features/mypage/components/PamphletContent'
import PamphletCover from '@/features/mypage/components/PamphletCover'
import type { PamphletView } from '@/features/mypage/data/pamphletView'

type PamphletReaderProps = {
  pamphlet: PamphletView
  /** 눌러서 연 카드. 공유 링크처럼 출발점이 없으면 생략한다. */
  source?: HTMLButtonElement
  fromCard: boolean
  onClose: () => void
}

type Phase = 'opening' | 'open' | 'closing'
const EASING = 'cubic-bezier(0.22, 0.68, 0, 1)'

export default function PamphletReader({
  pamphlet,
  source,
  fromCard,
  onClose,
}: PamphletReaderProps) {
  const [phase, setPhase] = useState<Phase>('opening')
  const [spread, setSpread] = useState(0)
  const dialogRef = useRef<HTMLDialogElement>(null)
  const dimRef = useRef<HTMLDivElement>(null)
  const windowRef = useRef<HTMLDivElement>(null)
  const paperRef = useRef<HTMLDivElement>(null)
  const closeButtonRef = useRef<HTMLButtonElement>(null)
  const closeRef = useRef<() => void>(() => {})
  const onCloseRef = useRef(onClose)
  const pageCount = Math.max(1, Math.ceil(pamphlet.places.length / 2))
  const firstPlace = pamphlet.places[spread * 2]
  const secondPlace = pamphlet.places[spread * 2 + 1]

  useLayoutEffect(() => {
    onCloseRef.current = onClose
  })

  useLayoutEffect(() => {
    const dialog = dialogRef.current
    const dim = dimRef.current
    const viewport = windowRef.current
    const paper = paperRef.current
    if (!dialog || !dim || !viewport || !paper) return

    const previousOverflow = document.body.style.overflow
    const previousPadding = document.body.style.paddingRight
    const scrollbarWidth = window.innerWidth - document.documentElement.clientWidth
    if (scrollbarWidth > 0) {
      document.body.style.paddingRight = `${parseFloat(getComputedStyle(document.body).paddingRight) + scrollbarWidth}px`
    }
    document.body.style.overflow = 'hidden'
    dialog.showModal()
    closeButtonRef.current?.focus({ preventScroll: true })

    const motion = window.matchMedia('(prefers-reduced-motion: reduce)')
    let currentPhase: Phase = 'opening'
    let animations: Animation[] = []
    let timer: number | undefined
    let closed = false

    const cancelAnimations = () => {
      window.clearTimeout(timer)
      animations.forEach((animation) => {
        animation.onfinish = null
        animation.cancel()
      })
      animations = []
    }

    const finishOpen = () => {
      if (currentPhase !== 'opening') return
      cancelAnimations()
      currentPhase = 'open'
      setPhase('open')
    }

    const finishClose = () => {
      if (closed) return
      closed = true
      cancelAnimations()
      onCloseRef.current()
    }

    // 같은 종이의 열린 상태를 기준으로 측정하므로 장소 장을 넘긴 뒤에도 닫을 수 있다.
    const makeAnimations = (duration: number) => {
      const desktop = window.matchMedia('(min-width: 900px)').matches
      const frame = desktop ? paper : viewport
      const bounds = frame.getBoundingClientRect()
      const centerX = bounds.left + bounds.width / 2
      const centerY = bounds.top + bounds.height / 2
      const panelWidth = bounds.width / (desktop ? 3 : 1)
      const card =
        fromCard && source?.isConnected
          ? source.getBoundingClientRect()
          : {
              left: centerX - panelWidth * 0.42,
              top: centerY - bounds.height * 0.42,
              width: panelWidth * 0.84,
              height: bounds.height * 0.84,
            }
      const dx = card.left + card.width / 2 - centerX
      const dy = card.top + card.height / 2 - centerY
      const start = `translate3d(${dx}px, ${dy}px, 0) scale(${card.width / panelWidth}, ${card.height / bounds.height})`
      const liftedWidth = Math.min(window.innerWidth - 32, Math.max(panelWidth, card.width * 1.08))
      const liftedHeight = Math.min(
        window.innerHeight - 120,
        Math.max(bounds.height * 0.9, card.height),
      )
      const lifted = desktop
        ? `translate3d(0, 0, 0) scale(${liftedWidth / panelWidth}, ${liftedHeight / bounds.height})`
        : 'translate3d(0, 0, 0) scale(0.97)'
      const options: KeyframeAnimationOptions = { duration, fill: 'both', easing: 'linear' }

      viewport.querySelectorAll<HTMLElement>('.pamphlet-reader-snapshot').forEach((snapshot) => {
        const parent = snapshot.parentElement
        if (!parent) return
        snapshot.style.width = `${card.width}px`
        snapshot.style.height = `${card.height}px`
        snapshot.style.transform = `scale(${parent.clientWidth / card.width}, ${parent.clientHeight / card.height})`
      })

      const result = [
        frame.animate(
          [
            { transform: start, offset: 0, easing: EASING },
            { transform: lifted, offset: 0.3, easing: EASING },
            { transform: 'translate3d(0, 0, 0) scale(1)', offset: 0.85 },
            { transform: 'translate3d(0, 0, 0) scale(1)', offset: 1 },
          ],
          options,
        ),
        dim.animate(
          [
            { opacity: 0, offset: 0 },
            { opacity: 1, offset: 0.32 },
            { opacity: 1, offset: 1 },
          ],
          options,
        ),
      ]
      paper.querySelectorAll<HTMLElement>('.pamphlet-editorial').forEach((content) => {
        result.push(
          content.animate(
            [
              { opacity: 0, offset: 0 },
              { opacity: 0, offset: 0.46 },
              { opacity: 1, offset: 0.86 },
              { opacity: 1, offset: 1 },
            ],
            options,
          ),
        )
      })

      if (desktop) {
        const left = paper.querySelector<HTMLElement>('.pamphlet-reader-left')
        const right = paper.querySelector<HTMLElement>('.pamphlet-reader-right')
        if (left && right) {
          result.push(
            left.animate(
              [
                { transform: 'rotateY(180deg)', opacity: 0, offset: 0 },
                { transform: 'rotateY(180deg)', opacity: 0, offset: 0.32 },
                { transform: 'rotateY(170deg)', opacity: 1, offset: 0.4, easing: EASING },
                { transform: 'rotateY(0deg)', opacity: 1, offset: 0.86 },
                { transform: 'rotateY(0deg)', opacity: 1, offset: 1 },
              ],
              options,
            ),
            right.animate(
              [
                { transform: 'rotateY(-180deg)', offset: 0 },
                { transform: 'rotateY(-180deg)', offset: 0.26, easing: EASING },
                { transform: 'rotateY(-65deg)', offset: 0.56, easing: EASING },
                { transform: 'rotateY(0deg)', offset: 0.8 },
                { transform: 'rotateY(0deg)', offset: 1 },
              ],
              options,
            ),
          )
        }
      } else {
        const cover = viewport.querySelector<HTMLElement>('.pamphlet-reader-mobile-cover')
        if (cover) {
          result.push(
            cover.animate(
              [
                { opacity: 1, offset: 0 },
                { opacity: 1, offset: 0.35 },
                { opacity: 0, offset: 0.66 },
                { opacity: 0, offset: 1 },
              ],
              options,
            ),
          )
        }
      }
      return result
    }

    closeRef.current = () => {
      if (currentPhase === 'closing') return
      const wasOpening = currentPhase === 'opening'
      currentPhase = 'closing'
      setPhase('closing')
      if (motion.matches || typeof paper.animate !== 'function') {
        finishClose()
        return
      }
      window.clearTimeout(timer)
      // 펼치는 중 닫으면 그 지점에서 역재생한다.
      if (wasOpening && animations.length > 0) {
        animations.forEach((animation) => {
          animation.onfinish = null
          animation.reverse()
        })
      } else {
        cancelAnimations()
        viewport.scrollTop = 0
        animations = makeAnimations(560)
        animations.forEach((animation) => {
          animation.pause()
          animation.currentTime = 560
          animation.reverse()
        })
      }
      animations[0].onfinish = finishClose
      timer = window.setTimeout(finishClose, 1000)
    }

    if (motion.matches || typeof paper.animate !== 'function') {
      finishOpen()
    } else {
      animations = makeAnimations(880)
      animations[0].onfinish = finishOpen
      timer = window.setTimeout(finishOpen, 1000)
    }

    const settle = () => {
      if (currentPhase === 'closing') finishClose()
      else finishOpen()
    }
    window.addEventListener('resize', settle)
    motion.addEventListener('change', settle)

    return () => {
      cancelAnimations()
      window.removeEventListener('resize', settle)
      motion.removeEventListener('change', settle)
      if (dialog.open) dialog.close()
      document.body.style.overflow = previousOverflow
      document.body.style.paddingRight = previousPadding
      window.requestAnimationFrame(() => {
        if (source?.isConnected) source.focus({ preventScroll: true })
      })
    }
  }, [source, fromCard])

  const turnSpread = (next: number) => {
    if (phase !== 'open') return
    setSpread(Math.max(0, Math.min(pageCount - 1, next)))
    if (windowRef.current) windowRef.current.scrollTop = 0
  }

  return createPortal(
    <dialog
      ref={dialogRef}
      className="pamphlet-reader"
      data-phase={phase}
      aria-label={`${pamphlet.title} 디지털 팜플렛`}
      onCancel={(event) => {
        event.preventDefault()
        closeRef.current()
      }}
      onClick={(event) => {
        if (event.target === event.currentTarget) closeRef.current()
      }}
    >
      <div ref={dimRef} className="pamphlet-reader-dim" aria-hidden="true" />
      <div className="pamphlet-reader-stage">
        <div className="pamphlet-reader-toolbar">
          <span>DIGITAL PAMPHLET</span>
          <button
            ref={closeButtonRef}
            type="button"
            onClick={() => closeRef.current()}
            aria-label="팜플렛 닫기"
          >
            <span>닫기</span>
            <svg width="18" height="18" viewBox="0 0 20 20" fill="none" aria-hidden="true">
              <path d="m5 5 10 10M15 5 5 15" stroke="currentColor" strokeWidth="1.5" />
            </svg>
          </button>
        </div>
        <div
          ref={windowRef}
          className="pamphlet-reader-window"
          tabIndex={0}
          role="region"
          aria-label="여행 팜플렛 내용"
          aria-busy={phase === 'opening'}
        >
          <div ref={paperRef} className="pamphlet-reader-paper" inert={phase !== 'open'}>
            <div className="pamphlet-reader-panel pamphlet-reader-left">
              <div className="pamphlet-reader-face">
                <PamphletIntro pamphlet={pamphlet} />
              </div>
              <div className="pamphlet-reader-back" aria-hidden="true" />
            </div>
            <div className="pamphlet-reader-panel pamphlet-reader-middle">
              <div className="pamphlet-reader-face">
                {firstPlace ? (
                  <PamphletPlace key={firstPlace.id} place={firstPlace} index={spread * 2} />
                ) : (
                  <PamphletEnd count={0} />
                )}
              </div>
            </div>
            <div className="pamphlet-reader-panel pamphlet-reader-right">
              <div className="pamphlet-reader-face">
                {secondPlace ? (
                  <PamphletPlace key={secondPlace.id} place={secondPlace} index={spread * 2 + 1} />
                ) : (
                  <PamphletEnd count={pamphlet.places.length} />
                )}
              </div>
              <div className="pamphlet-reader-back" aria-hidden="true">
                <div className="pamphlet-reader-snapshot">
                  <PamphletCover
                    number={pamphlet.number}
                    title={pamphlet.title}
                    placeCount={pamphlet.places.length}
                    createdAt={pamphlet.createdAt}
                  />
                </div>
              </div>
            </div>
          </div>
          <div className="pamphlet-reader-mobile-cover" aria-hidden="true">
            <div className="pamphlet-reader-snapshot">
              <PamphletCover
                number={pamphlet.number}
                title={pamphlet.title}
                placeCount={pamphlet.places.length}
                createdAt={pamphlet.createdAt}
              />
            </div>
          </div>
        </div>
        <div className="pamphlet-reader-footer">
          <span>MULMEONG · {pamphlet.createdAt}</span>
          {pageCount > 1 && (
            <nav aria-label="팜플렛 장소 탐색">
              <button
                type="button"
                disabled={spread === 0 || phase !== 'open'}
                onClick={() => turnSpread(spread - 1)}
                aria-label="이전 장소 보기"
              >
                ← 이전
              </button>
              <span role="status" aria-live="polite">
                {spread * 2 + 1}–{Math.min(spread * 2 + 2, pamphlet.places.length)} /{' '}
                {pamphlet.places.length}곳
              </span>
              <button
                type="button"
                disabled={spread === pageCount - 1 || phase !== 'open'}
                onClick={() => turnSpread(spread + 1)}
                aria-label="다음 장소 보기"
              >
                다음 →
              </button>
            </nav>
          )}
        </div>
      </div>
    </dialog>,
    document.body,
  )
}
