import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { useMagazines } from '@/features/magazine/hooks/useMagazines'
import MagazineFeedback from './MagazineFeedback'
import MagazineImage from './MagazineImage'
export default function MagazineHero() {
  const { magazines, loading, error, retry } = useMagazines({ featured: true, size: 5 })
  const [index, setIndex] = useState(0)
  const [paused, setPaused] = useState(false)
  const [hovered, setHovered] = useState(false)
  const [focused, setFocused] = useState(false)
  const currentIndex = index % Math.max(1, magazines.length)
  useEffect(() => {
    if (
      paused ||
      hovered ||
      focused ||
      magazines.length < 2 ||
      matchMedia('(prefers-reduced-motion: reduce)').matches
    )
      return
    const timer = setInterval(() => {
      if (!document.hidden) setIndex((value) => value + 1)
    }, 5000)
    return () => clearInterval(timer)
  }, [paused, hovered, focused, magazines.length])
  const magazine = magazines[currentIndex]
  if (!magazine) return <MagazineFeedback loading={loading} error={error} retry={retry} />
  return (
    <section
      aria-label="추천 커버"
      aria-roledescription="캐러셀"
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      onFocusCapture={() => setFocused(true)}
      onBlurCapture={(event) => {
        if (!event.currentTarget.contains(event.relatedTarget)) setFocused(false)
      }}
      className="border-border-default grid overflow-hidden border-y md:grid-cols-[minmax(0,5fr)_minmax(0,7fr)]"
    >
      <div className="flex flex-col items-start py-7 md:py-9 md:pr-10">
        <p className="text-text-secondary text-[11px] tracking-[0.18em]">
          EDITOR’S PICK · {magazine.categoryLabel}
        </p>
        <h2 className="mt-4 text-[29px] leading-[1.25] font-medium tracking-tight md:text-[36px]">
          {magazine.title}
        </h2>
        <p className="text-text-secondary mt-3 line-clamp-3 text-[13px] leading-6">
          {magazine.subtitle}
        </p>
        <Link
          to={`/magazine/${magazine.magazineId}`}
          className="border-text-primary mt-5 border-b pb-1 text-[13px]"
        >
          이야기 읽기 ↗<span className="sr-only">: {magazine.title}</span>
        </Link>
        <div className="mt-7 flex w-full items-center gap-4 text-[12px] md:mt-auto md:pt-6">
          <span className="mr-auto tabular-nums">
            {String(currentIndex + 1).padStart(2, '0')}{' '}
            <span className="text-text-secondary">
              / {String(magazines.length).padStart(2, '0')}
            </span>
          </span>
          <button
            type="button"
            aria-label="이전 커버"
            onClick={() => setIndex((currentIndex + magazines.length - 1) % magazines.length)}
            className="size-9"
          >
            ←
          </button>
          <button
            type="button"
            aria-label={paused ? '자동 전환 재생' : '자동 전환 일시정지'}
            aria-pressed={paused}
            onClick={() => setPaused((value) => !value)}
            className="h-9 px-1"
          >
            {paused ? '재생' : '정지'}
          </button>
          <button
            type="button"
            aria-label="다음 커버"
            onClick={() => setIndex(currentIndex + 1)}
            className="size-9"
          >
            →
          </button>
        </div>
      </div>
      <Link
        to={`/magazine/${magazine.magazineId}`}
        aria-label={magazine.title}
        className="group block"
      >
        <MagazineImage
          src={magazine.heroImageUrl}
          seed={magazine.magazineId}
          eager
          className="aspect-[4/3] md:h-full md:min-h-[400px]"
        />
      </Link>
    </section>
  )
}
