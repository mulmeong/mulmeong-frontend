import { useLayoutEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'

import { copyLink } from '@/lib/copyLink'
import {
  PamphletEnd,
  PamphletIntro,
  PamphletPlace,
} from '@/features/mypage/components/PamphletContent'
import PamphletCover from '@/features/mypage/components/PamphletCover'
import type { PamphletView, PamphletViewPlace } from '@/features/mypage/data/pamphletView'
import { shareLinkOf } from '@/types/pamphlet'

type PamphletReaderProps = {
  pamphlet: PamphletView
  /** 눌러서 연 카드. 공유 링크처럼 출발점이 없으면 생략한다. */
  source?: HTMLButtonElement
  fromCard: boolean
  onClose: () => void
}

type Phase = 'opening' | 'open' | 'closing'
const EASING = 'cubic-bezier(0.22, 0.68, 0, 1)'

type PamphletFace =
  { type: 'intro' } | { type: 'place'; place: PamphletViewPlace; index: number } | { type: 'end' }

function isOnsenPlace(place: PamphletViewPlace) {
  return place.category === 'onsen'
}

function arrangePlacesForFirstFold(places: PamphletViewPlace[]) {
  const onsenIndex = places.findIndex(isOnsenPlace)
  if (onsenIndex < 0 || places.slice(0, 2).some(isOnsenPlace)) return places

  const next = [...places]
  const [onsen] = next.splice(onsenIndex, 1)
  next.unshift(onsen)
  return next
}

/**
 * 장소마다 사진·시설·리뷰·주소 길이가 달라 실제 렌더 높이가 제각각이다.
 * 개수로 3칸씩 나누면(예전 chunkPlaces 방식) 짧은 장소끼리 몰린 페이지는
 * 여백이 뜨고, 긴 장소가 낀 페이지는 칸 안에서 잘렸다. 그래서 각 장소를
 * 오프스크린에 한 번 실측(measuredHeights)하고, 한 칸의 실제 가용 높이
 * (faceHeight)를 넘지 않는 선에서 그리디하게 채운다 — 장소 하나는 항상
 * 한 칸에 통째로 들어가거나 다음 페이지로 넘어갈 뿐, 칸 중간에서 잘리지 않는다.
 */
function buildReaderPages(
  places: PamphletViewPlace[],
  measuredHeights: Map<number, number> | null,
  faceHeight: number,
): PamphletFace[][] {
  const faces: PamphletFace[] = places.map((place, index) => ({ type: 'place', place, index }))

  // 실측이 아직 없으면(최초 렌더) 기존 고정 3분할로 우선 보여준다 — 측정이
  // 끝나면 아래 그리디 배치로 교체된다.
  if (!measuredHeights || faceHeight <= 0) {
    const [first, second, ...rest] = faces
    const pages: PamphletFace[][] = [
      [{ type: 'intro' }, first ?? { type: 'end' }, second ?? { type: 'end' }],
    ]
    for (let index = 0; index < rest.length; index += 3) {
      const chunk = rest.slice(index, index + 3)
      pages.push([0, 1, 2].map((offset) => chunk[offset] ?? { type: 'end' }))
    }
    return pages
  }

  // 칸 높이는 페이지 전체 높이라 고정이다 — 장소를 옆 칸으로 옮겨도 그
  // 칸이 넘치는 걸 막을 수는 없다. 그래서 "이 장소가 칸 안에 들어가는가"
  // 로만 페이지를 끊는다: 안 들어가는 장소는 남은 칸을 비우고 그 페이지를
  // 마감해, 다음 페이지에서 온전한 칸 하나를 그 장소에 내준다(그래도 넘치면
  // 콘텐츠 길이 자체의 한계이므로 그 한 칸만 최후 방어선으로 그대로 둔다).
  const heightOf = (face: PamphletFace) =>
    face.type === 'place' ? (measuredHeights.get(face.place.id) ?? 0) : 0

  const pages: PamphletFace[][] = []
  let cursor = 0
  let firstPage = true
  while (cursor < faces.length || firstPage) {
    const slots = firstPage ? 2 : 3
    const page: PamphletFace[] = firstPage ? [{ type: 'intro' }] : []
    for (let slot = 0; slot < slots; slot += 1) {
      const face = faces[cursor]
      if (!face) {
        page.push({ type: 'end' })
        continue
      }
      const overflows = heightOf(face) > faceHeight
      if (overflows && page.length > (firstPage ? 1 : 0)) {
        // 이미 이 페이지에 다른 칸을 채웠다면, 넘치는 장소는 새 페이지로
        // 넘겨 온전한 칸을 준다. 페이지가 아직 비어 있다면(칸을 못 채운
        // 상태) 어쩔 수 없이 그대로 담아 최후 방어선으로 삼는다.
        for (let rest = slot; rest < slots; rest += 1) page.push({ type: 'end' })
        break
      }
      page.push(face)
      cursor += 1
    }
    pages.push(page)
    firstPage = false
    if (cursor >= faces.length) break
  }

  return pages
}

export default function PamphletReader({
  pamphlet,
  source,
  fromCard,
  onClose,
}: PamphletReaderProps) {
  const [phase, setPhase] = useState<Phase>('opening')
  const [copied, setCopied] = useState(false)
  const [currentPage, setCurrentPage] = useState(0)
  const dialogRef = useRef<HTMLDialogElement>(null)
  const dimRef = useRef<HTMLDivElement>(null)
  const windowRef = useRef<HTMLDivElement>(null)
  const paperRef = useRef<HTMLDivElement>(null)
  const measureRef = useRef<HTMLDivElement>(null)
  const closeButtonRef = useRef<HTMLButtonElement>(null)
  const closeRef = useRef<() => void>(() => {})
  const onCloseRef = useRef(onClose)
  const arrangedPlaces = arrangePlacesForFirstFold(pamphlet.places)
  const isOnsenTrip = pamphlet.onsenCount > 0
  /**
   * null=아직 측정 전(고정 3분할로 보여줌). 측정 후에는 장소별 실제 높이로
   * 채워, 창 크기가 바뀌면(글꼴 줄바꿈이 달라져) 다시 재는 게 안전하다.
   */
  const [layout, setLayout] = useState<{ heights: Map<number, number>; faceHeight: number } | null>(
    null,
  )
  /**
   * 표지(intro)는 항상 첫 페이지 왼쪽 칸에 고정되므로 다음 페이지로 넘길
   * 수 없다 — 넘치면 대신 밀도를 단계적으로 낮춰(compact → minimal) 온천
   * 강조·장소 목록을 줄여서 같은 칸 안에 들어가게 한다.
   */
  const [introDensity, setIntroDensity] = useState<'full' | 'compact' | 'minimal'>('full')

  // 페이지 폭이 바뀌면(반응형 리사이즈) 줄바꿈이 달라져 실제 높이도 달라진다.
  // 열릴 때 한 번, 그리고 리사이즈마다 오프스크린 측정 영역에서 다시 잰다.
  useLayoutEffect(() => {
    const measure = measureRef.current
    const face = paperRef.current?.querySelector<HTMLElement>('.pamphlet-reader-face')
    if (!measure || !face) return

    const remeasure = () => {
      // 측정 칸의 폭을 실제 칸(face) 폭과 똑같이 맞춰야 줄바꿈이 같게 나온다.
      measure.style.width = `${face.clientWidth}px`
      const faceHeight = face.clientHeight
      const heights = new Map<number, number>()
      measure.querySelectorAll<HTMLElement>('[data-measure-place]').forEach((node) => {
        const id = Number(node.dataset.measurePlace)
        if (Number.isFinite(id)) heights.set(id, node.scrollHeight)
      })
      const introFull = measure.querySelector<HTMLElement>('[data-measure-intro="full"]')
      const introCompact = measure.querySelector<HTMLElement>('[data-measure-intro="compact"]')
      if (introFull && introCompact) {
        setIntroDensity(
          introFull.scrollHeight <= faceHeight
            ? 'full'
            : introCompact.scrollHeight <= faceHeight
              ? 'compact'
              : 'minimal',
        )
      }
      setLayout({ heights, faceHeight })
    }

    remeasure()
    const observer = new ResizeObserver(remeasure)
    observer.observe(face)
    return () => observer.disconnect()
    // arrangedPlaces가 바뀌면(다른 팜플렛을 열면) 장소 구성도 바뀌므로 다시 잰다.
  }, [pamphlet.id, arrangedPlaces.length])

  const pages = buildReaderPages(arrangedPlaces, layout?.heights ?? null, layout?.faceHeight ?? 0)
  const activePageIndex = Math.min(currentPage, pages.length - 1)
  const activeFaces = pages[activePageIndex] ?? pages[0]
  const hasMultiplePages = pages.length > 1

  async function sharePamphlet() {
    if (!pamphlet.shareToken) return
    if (await copyLink(shareLinkOf(pamphlet.shareToken))) {
      setCopied(true)
      window.setTimeout(() => setCopied(false), 2000)
    }
  }

  useLayoutEffect(() => {
    onCloseRef.current = onClose
  })

  useLayoutEffect(() => {
    setCurrentPage(0)
  }, [pamphlet.id])

  useLayoutEffect(() => {
    windowRef.current?.scrollTo({ top: 0, left: 0 })
  }, [activePageIndex])

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

  function renderFace(face: PamphletFace) {
    if (face.type === 'intro') {
      return <PamphletIntro pamphlet={pamphlet} density={introDensity} />
    }
    if (face.type === 'place') {
      return <PamphletPlace place={face.place} index={face.index} isOnsenTrip={isOnsenTrip} />
    }
    return <PamphletEnd count={pamphlet.places.length} isOnsenTrip={isOnsenTrip} />
  }

  function movePage(direction: -1 | 1) {
    setCurrentPage((page) => Math.min(Math.max(page + direction, 0), pages.length - 1))
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
          <span>디지털 팜플렛</span>
          <div className="pamphlet-reader-actions">
            <button type="button" onClick={sharePamphlet} disabled={!pamphlet.shareToken}>
              {copied ? '복사됨' : '공유'}
            </button>
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
        </div>
        <div
          ref={windowRef}
          className="pamphlet-reader-window"
          tabIndex={0}
          role="region"
          aria-label="여행 팜플렛 내용"
          aria-busy={phase === 'opening'}
        >
          {/*
            페이지를 실제로 그리기 전, 같은 폭(칸 하나)으로 모든 장소를 한 번
            그려 실제 렌더 높이를 잰다. 사용자에게는 보이지 않지만(visibility:
            hidden) 레이아웃에는 참여해야 폭이 정확히 같아진다 — display:none은
            높이가 0이 되어 잴 수 없다. 결과(layout)가 나오면 아래 실제 페이지가
            그 배치로 다시 그려지므로, 최종적으로 사용자 눈에는 잘리지 않는
            페이지만 보인다.
          */}
          <div ref={measureRef} aria-hidden="true" className="pamphlet-reader-measure">
            <div data-measure-intro="full" className="pamphlet-editorial">
              <PamphletIntro pamphlet={pamphlet} density="full" />
            </div>
            <div data-measure-intro="compact" className="pamphlet-editorial">
              <PamphletIntro pamphlet={pamphlet} density="compact" />
            </div>
            {arrangedPlaces.map((place, index) => (
              <div key={place.id} data-measure-place={place.id} className="pamphlet-editorial">
                <PamphletPlace place={place} index={index} isOnsenTrip={isOnsenTrip} />
              </div>
            ))}
          </div>
          <div
            ref={paperRef}
            className="pamphlet-reader-paper"
            data-page={activePageIndex}
            inert={phase !== 'open'}
          >
            <div className="pamphlet-reader-panel pamphlet-reader-left">
              <div
                key={`${activePageIndex}-left`}
                className="pamphlet-reader-face pamphlet-reader-face-page"
              >
                {renderFace(activeFaces[0])}
              </div>
              <div className="pamphlet-reader-back" aria-hidden="true" />
            </div>
            <div className="pamphlet-reader-panel pamphlet-reader-middle">
              <div
                key={`${activePageIndex}-middle`}
                className="pamphlet-reader-face pamphlet-reader-face-page"
              >
                {renderFace(activeFaces[1])}
              </div>
            </div>
            <div className="pamphlet-reader-panel pamphlet-reader-right">
              <div
                key={`${activePageIndex}-right`}
                className="pamphlet-reader-face pamphlet-reader-face-page"
              >
                {renderFace(activeFaces[2])}
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
        {hasMultiplePages && (
          <div className="pamphlet-page-nav" aria-label="팜플렛 면 이동">
            {activePageIndex > 0 && (
              <button
                type="button"
                className="pamphlet-page-control pamphlet-page-control-prev"
                onClick={() => movePage(-1)}
                aria-label="이전 면 보기"
              >
                <svg width="18" height="18" viewBox="0 0 18 18" fill="none" aria-hidden="true">
                  <path d="M11 4.5 6.5 9l4.5 4.5" stroke="currentColor" strokeWidth="1.5" />
                </svg>
              </button>
            )}
            {activePageIndex < pages.length - 1 && (
              <button
                type="button"
                className="pamphlet-page-control pamphlet-page-control-next"
                onClick={() => movePage(1)}
                aria-label="다음 면 보기"
              >
                <svg width="18" height="18" viewBox="0 0 18 18" fill="none" aria-hidden="true">
                  <path d="m7 4.5 4.5 4.5L7 13.5" stroke="currentColor" strokeWidth="1.5" />
                </svg>
              </button>
            )}
          </div>
        )}
        <div className="pamphlet-reader-footer">
          <span>물멍 · {pamphlet.createdAt}</span>
          {hasMultiplePages && (
            <span>
              {activePageIndex + 1} / {pages.length}
            </span>
          )}
          <span>장소 {pamphlet.places.length}곳</span>
        </div>
      </div>
    </dialog>,
    document.body,
  )
}
