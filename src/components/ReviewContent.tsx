import { useEffect, useId, useRef, useState } from 'react'

import { Modal } from '@/components/ui'
import { cn } from '@/lib/cn'

type ReviewContentProps = {
  body: string
  images: string[]
}

export default function ReviewContent({ body, images }: ReviewContentProps) {
  const textId = useId()
  const textRef = useRef<HTMLParagraphElement>(null)
  const [expanded, setExpanded] = useState(false)
  const [overflowing, setOverflowing] = useState(false)
  const [selected, setSelected] = useState<number | null>(null)
  const viewerOpen = selected !== null && images.length > 0
  const index = Math.min(selected ?? 0, images.length - 1)

  useEffect(() => {
    const paragraph = textRef.current
    if (!paragraph) return
    // 글자 수 대신 실제 줄 수를 측정해 좁은 패널과 줄바꿈에도 대응한다.
    const measure = () => {
      const lineHeight = Number.parseFloat(getComputedStyle(paragraph).lineHeight)
      setOverflowing(paragraph.scrollHeight > lineHeight * 4 + 1)
    }
    const observer = new ResizeObserver(measure)
    observer.observe(paragraph)
    measure()
    return () => observer.disconnect()
  }, [body])

  useEffect(() => {
    if (!viewerOpen) return
    const previous = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.body.style.overflow = previous
    }
  }, [viewerOpen])

  function moveImage(direction: number) {
    setSelected((current) => ((current ?? 0) + direction + images.length) % images.length)
  }

  if (!body && images.length === 0) return null

  return (
    <div className="mt-3 min-w-0 space-y-3">
      {body && (
        <div>
          <p
            ref={textRef}
            id={textId}
            className={cn(
              'text-text-primary text-[13px] leading-[1.85] break-keep whitespace-pre-line [overflow-wrap:anywhere]',
              !expanded && 'line-clamp-4',
            )}
          >
            {body}
          </p>
          {overflowing && (
            <button
              type="button"
              aria-expanded={expanded}
              aria-controls={textId}
              onClick={() => setExpanded((value) => !value)}
              className="text-text-secondary hover:text-text-primary min-h-8 text-[12px] underline underline-offset-4 focus-visible:outline-2"
            >
              {expanded ? '접기' : '더보기'}
            </button>
          )}
        </div>
      )}

      {images.length > 0 && (
        <ul className={cn('grid gap-2', images.length > 1 ? 'grid-cols-2' : 'grid-cols-1')}>
          {images.slice(0, 2).map((url, imageIndex) => {
            const remaining = imageIndex === 1 ? images.length - 2 : 0
            return (
              <li key={`${url}-${imageIndex}`} className="min-w-0">
                <button
                  type="button"
                  onClick={() => setSelected(imageIndex)}
                  aria-label={`리뷰 사진 ${imageIndex + 1} / ${images.length} 확대${remaining > 0 ? `, 사진 ${remaining}장 더 있음` : ''}`}
                  aria-haspopup="dialog"
                  className={cn(
                    'bg-surface-dim relative block w-full cursor-zoom-in overflow-hidden rounded-sm focus-visible:outline-2 focus-visible:outline-offset-2',
                    images.length === 1 ? 'aspect-video max-h-52' : 'aspect-[4/3]',
                  )}
                >
                  <img
                    src={url}
                    alt={`방문 리뷰 사진 ${imageIndex + 1}`}
                    loading="lazy"
                    className="absolute inset-0 h-full w-full object-cover transition-opacity hover:opacity-90"
                  />
                  {remaining > 0 && (
                    <span
                      aria-hidden="true"
                      className="absolute inset-0 flex items-center justify-center bg-black/45 text-[22px] font-medium text-white"
                    >
                      +{remaining}
                    </span>
                  )}
                </button>
              </li>
            )
          })}
        </ul>
      )}

      <Modal
        open={viewerOpen}
        onClose={() => setSelected(null)}
        title="리뷰 사진"
        className="w-[960px] max-h-[calc(100dvh-2rem)] overflow-hidden bg-transparent text-white backdrop:bg-black/85 [&>div]:p-0 [&>div>div]:mt-0 [&>div>h2]:sr-only"
      >
        {viewerOpen && (
          <div
            onKeyDown={(event) => {
              if (images.length < 2) return
              if (event.key === 'ArrowLeft' || event.key === 'ArrowRight') {
                event.preventDefault()
                moveImage(event.key === 'ArrowLeft' ? -1 : 1)
              }
            }}
          >
            <div className="flex h-11 justify-end">
              <button
                type="button"
                onClick={() => setSelected(null)}
                aria-label="사진 닫기"
                title="닫기"
                className="flex size-11 items-center justify-center rounded-sm text-[22px] text-white hover:bg-white/10 focus-visible:outline-2"
              >
                ✕
              </button>
            </div>
            <div
              className="flex h-[calc(100dvh-10rem)] max-h-[720px] items-center justify-center"
              onClick={(event) => {
                if (event.target === event.currentTarget) setSelected(null)
              }}
            >
              <img
                key={images[index]}
                src={images[index]}
                alt={`방문 리뷰 사진 ${index + 1}`}
                className="max-h-full max-w-full object-contain"
              />
            </div>
            <div className="flex h-12 items-center justify-center gap-4">
              {images.length > 1 && (
                <button
                  type="button"
                  onClick={() => moveImage(-1)}
                  aria-label="이전 사진"
                  title="이전 사진"
                  className="flex size-11 items-center justify-center rounded-sm text-[22px] hover:bg-white/10 focus-visible:outline-2"
                >
                  ←
                </button>
              )}
              <p
                aria-live="polite"
                aria-atomic="true"
                className="min-w-12 text-center text-[12px] text-white/80 tabular-nums"
              >
                {index + 1} / {images.length}
              </p>
              {images.length > 1 && (
                <button
                  type="button"
                  onClick={() => moveImage(1)}
                  aria-label="다음 사진"
                  title="다음 사진"
                  className="flex size-11 items-center justify-center rounded-sm text-[22px] hover:bg-white/10 focus-visible:outline-2"
                >
                  →
                </button>
              )}
            </div>
          </div>
        )}
      </Modal>
    </div>
  )
}
