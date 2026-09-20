import { useEffect, useRef, useState } from 'react'

// 지도 사이드바 캐러셀에서 시작한 훅이다. 매거진 필름스트립도 같은 마우스 드래그
// 스크롤이 필요해져(두 번째 사용) 도메인 폴더 밖 공용으로 옮겼다.
const DRAG_THRESHOLD = 6
const DRAG_SENSITIVITY = 1.4
const SNAP_DURATION = 120

function scrollBehavior(): ScrollBehavior {
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'instant' : 'smooth'
}

export function useDragCarousel(itemCount: number, disabled = false) {
  const trackRef = useRef<HTMLUListElement>(null)
  const interruptSnapRef = useRef<(() => void) | null>(null)
  const [scroll, setScroll] = useState({ previous: false, next: false })

  useEffect(() => {
    const track = trackRef.current
    if (!track) return

    let gesture: {
      pointerId: number
      x: number
      y: number
      left: number
      lastX: number
      direction: number
      dragging: boolean
    } | null = null
    let suppressClick = false
    let snapFrame = 0
    const originalSnap = track.style.scrollSnapType
    const originalBehavior = track.style.scrollBehavior

    const cancelSnap = () => {
      cancelAnimationFrame(snapFrame)
      snapFrame = 0
    }
    const restoreScrolling = () => {
      track.style.scrollSnapType = originalSnap
      track.style.scrollBehavior = originalBehavior
    }
    const interruptSnap = () => {
      cancelSnap()
      restoreScrolling()
    }
    interruptSnapRef.current = interruptSnap

    const snapTo = (left: number) => {
      const start = track.scrollLeft
      if (Math.abs(left - start) < 1 || scrollBehavior() === 'instant') {
        track.scrollTo({ left, behavior: 'instant' })
        restoreScrolling()
        return
      }
      const startedAt = performance.now()
      const animate = (now: number) => {
        const progress = Math.min(1, (now - startedAt) / SNAP_DURATION)
        const eased = 1 - (1 - progress) ** 3
        track.scrollTo({ left: start + (left - start) * eased, behavior: 'instant' })
        if (progress < 1) {
          snapFrame = requestAnimationFrame(animate)
        } else {
          snapFrame = 0
          restoreScrolling()
        }
      }
      snapFrame = requestAnimationFrame(animate)
    }

    const update = () => {
      const previous = track.scrollLeft > 1
      const next = track.scrollWidth - track.clientWidth - track.scrollLeft > 1
      setScroll((current) =>
        current.previous === previous && current.next === next ? current : { previous, next },
      )
    }

    const finish = () => {
      const current = gesture
      gesture = null
      if (!current) return
      if (track.hasPointerCapture(current.pointerId)) {
        track.releasePointerCapture(current.pointerId)
      }
      delete track.dataset.dragging
      if (!current.dragging) {
        restoreScrolling()
        return
      }

      // CSS 스냅은 정렬 애니메이션이 끝난 뒤 복원해야 즉시 카드로 튀지 않는다.
      const left = track.scrollLeft
      const origin = track.getBoundingClientRect().left
      const max = track.scrollWidth - track.clientWidth
      const positions = Array.from(track.children, (card) =>
        Math.max(0, Math.min(max, card.getBoundingClientRect().left - origin + left)),
      )
      const nearest = positions.reduce((best, position) => {
        const difference = Math.abs(position - left) - Math.abs(best - left)
        if (Math.abs(difference) < 0.5) {
          return (position - best) * current.direction > 0 ? position : best
        }
        return difference < 0 ? position : best
      }, 0)
      snapTo(nearest)
    }

    const down = (event: PointerEvent) => {
      suppressClick = false
      if (
        disabled ||
        event.pointerType !== 'mouse' ||
        event.button !== 0 ||
        !event.isPrimary ||
        event.ctrlKey ||
        event.metaKey ||
        event.altKey ||
        event.shiftKey ||
        track.scrollWidth <= track.clientWidth + 1 ||
        (event.target instanceof Element &&
          event.target.closest('dialog, input, textarea, select, [contenteditable="true"]'))
      )
        return
      cancelSnap()
      const left = track.scrollLeft
      // 진행 중인 화살표/스냅 이동도 여기서 멈춰 포인터를 즉시 따라가게 한다.
      track.style.scrollSnapType = 'none'
      track.style.scrollBehavior = 'auto'
      track.scrollTo({ left, behavior: 'instant' })
      gesture = {
        pointerId: event.pointerId,
        x: event.clientX,
        y: event.clientY,
        left,
        lastX: event.clientX,
        direction: 0,
        dragging: false,
      }
    }

    const movePointer = (event: PointerEvent) => {
      if (!gesture || event.pointerId !== gesture.pointerId) return
      if (!(event.buttons & 1)) {
        finish()
        return
      }
      const distance = event.clientX - gesture.x
      if (!gesture.dragging) {
        if (
          Math.abs(distance) < DRAG_THRESHOLD ||
          Math.abs(distance) <= Math.abs(event.clientY - gesture.y)
        )
          return
        gesture.dragging = true
        suppressClick = true
        track.setPointerCapture(event.pointerId)
        track.dataset.dragging = 'true'
      }
      event.preventDefault()
      gesture.direction = Math.sign(gesture.lastX - event.clientX) || gesture.direction
      gesture.lastX = event.clientX
      track.scrollTo({ left: gesture.left - distance * DRAG_SENSITIVITY, behavior: 'instant' })
    }

    const up = (event: PointerEvent) => {
      if (gesture?.pointerId === event.pointerId) finish()
    }
    const click = (event: MouseEvent) => {
      if (!suppressClick || event.detail === 0) return
      suppressClick = false
      event.preventDefault()
      event.stopPropagation()
    }
    const nativeDrag = (event: DragEvent) => {
      if (gesture) event.preventDefault()
    }

    update()
    const observer = new ResizeObserver(update)
    observer.observe(track)
    track.addEventListener('scroll', update, { passive: true })
    track.addEventListener('pointerdown', down)
    track.addEventListener('click', click, true)
    track.addEventListener('dragstart', nativeDrag)
    track.addEventListener('lostpointercapture', up)
    window.addEventListener('pointermove', movePointer, { passive: false })
    window.addEventListener('pointerup', up)
    window.addEventListener('pointercancel', up)
    window.addEventListener('blur', finish)
    return () => {
      const current = gesture
      gesture = null
      if (current && track.hasPointerCapture(current.pointerId)) {
        track.releasePointerCapture(current.pointerId)
      }
      delete track.dataset.dragging
      interruptSnap()
      interruptSnapRef.current = null
      observer.disconnect()
      track.removeEventListener('scroll', update)
      track.removeEventListener('pointerdown', down)
      track.removeEventListener('click', click, true)
      track.removeEventListener('dragstart', nativeDrag)
      track.removeEventListener('lostpointercapture', up)
      window.removeEventListener('pointermove', movePointer)
      window.removeEventListener('pointerup', up)
      window.removeEventListener('pointercancel', up)
      window.removeEventListener('blur', finish)
    }
  }, [itemCount, disabled])

  function move(direction: number) {
    const track = trackRef.current
    const card = track?.firstElementChild
    if (!track || !card) return
    interruptSnapRef.current?.()
    const gap = Number.parseFloat(getComputedStyle(track).columnGap) || 0
    track.scrollBy({
      left: direction * (card.getBoundingClientRect().width + gap),
      behavior: scrollBehavior(),
    })
  }

  return { trackRef, scroll, move }
}
