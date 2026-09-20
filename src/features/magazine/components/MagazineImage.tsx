import { useState } from 'react'
import { defaultMagazineImageOf } from '@/constants/images'
import { cn } from '@/lib/cn'

/**
 * 사진이 없는 기사는 '빈 이미지'가 아니라 그래픽 커버로 다룬다.
 *
 * 색은 팔레트(#f7f7f5 ivory, #8a8880 gray)에서 거의 벗어나지 않는 범위로만 틀었다.
 * 한눈에는 단색으로 보이고 가까이서만 번짐이 읽히도록 채도를 극히 낮게 잡는다 —
 * 값을 더 벌리면 흑백 중심의 지면에서 이 칸만 튄다.
 */
const COVER_VARIANTS = [
  // warm ivory → very pale blue
  {
    base: '#f6f5f2',
    blooms: [
      'radial-gradient(120% 95% at 18% 12%, #fbfaf7 0%, rgba(251,250,247,0) 62%)',
      'radial-gradient(130% 105% at 82% 88%, #eceef1 0%, rgba(236,238,241,0) 68%)',
    ],
  },
  // mist gray → pale aqua
  {
    base: '#f2f3f2',
    blooms: [
      'radial-gradient(115% 90% at 78% 18%, #f8f8f6 0%, rgba(248,248,246,0) 60%)',
      'radial-gradient(125% 100% at 22% 85%, #e9eeed 0%, rgba(233,238,237,0) 66%)',
    ],
  },
  // pale blue → muted sky
  {
    base: '#f1f3f5',
    blooms: [
      'radial-gradient(125% 100% at 30% 82%, #fafaf8 0%, rgba(250,250,248,0) 64%)',
      'radial-gradient(115% 95% at 72% 22%, #e8ecf0 0%, rgba(232,236,240,0) 62%)',
    ],
  },
  // sunlit ivory
  {
    base: '#f5f4f0',
    blooms: [
      'radial-gradient(130% 105% at 50% 8%, #fbfaf7 0%, rgba(251,250,247,0) 58%)',
      'radial-gradient(120% 95% at 12% 92%, #edeeed 0%, rgba(237,238,237,0) 66%)',
    ],
  },
] as const

/** 기사마다 고정된 variant를 준다 — 목록을 다시 그려도 커버가 바뀌지 않는다. */
function variantOf(seed: number | string | undefined) {
  if (seed === undefined) return COVER_VARIANTS[0]
  const value =
    typeof seed === 'number'
      ? Math.abs(Math.trunc(seed))
      : Array.from(String(seed)).reduce((sum, char) => sum + char.charCodeAt(0), 0)
  return COVER_VARIANTS[value % COVER_VARIANTS.length]
}

export default function MagazineImage({
  src,
  seed,
  className,
  eager = false,
}: {
  src?: string | null
  /** 보통 magazineId. 같은 기사에 늘 같은 커버가 나오게 하는 값이다. */
  seed?: number | string
  className?: string
  eager?: boolean
}) {
  const [failed, setFailed] = useState(false)
  /** 기본 표지 파일이 없을 때. 깨진 아이콘 대신 그래픽 커버로 남긴다. */
  const [coverFailed, setCoverFailed] = useState(false)
  const showFallback = !src || failed
  const variant = variantOf(seed)

  return (
    <div
      className={cn('bg-surface-dim relative @container overflow-hidden', className)}
      style={
        showFallback
          ? { backgroundColor: variant.base, backgroundImage: variant.blooms.join(', ') }
          : undefined
      }
    >
      {/*
        사진이 없으면 기본 표지를 깔고, 그 위에 워드마크만 남긴다.
        기본 표지 파일까지 없으면 깨진 아이콘이 보이므로 그때는 그래픽 커버만 둔다.
      */}
      {showFallback && !coverFailed && (
        <img
          src={defaultMagazineImageOf(seed)}
          alt=""
          aria-hidden
          loading={eager ? 'eager' : 'lazy'}
          onError={() => setCoverFailed(true)}
          className="absolute inset-0 size-full object-cover"
        />
      )}
      {/* 사이드바의 96px 썸네일에서는 워드마크가 갑갑해 감춘다. */}
      {showFallback && (
        <span
          aria-hidden
          className="text-text-secondary/45 absolute right-3 bottom-2.5 hidden text-[8px] tracking-[0.3em] @[180px]:block"
        >
          MULMEONG
        </span>
      )}
      {src && !failed && (
        <img
          key={src}
          src={src}
          alt=""
          loading={eager ? 'eager' : 'lazy'}
          onError={() => setFailed(true)}
          className="absolute inset-0 size-full object-cover transition-transform duration-700 group-hover:scale-[1.025]"
        />
      )}
    </div>
  )
}
