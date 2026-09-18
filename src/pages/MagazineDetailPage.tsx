import { useState } from 'react'
import { Link, useParams } from 'react-router-dom'

import { useMagazine } from '@/features/magazine/hooks/useMagazine'
import { useReadingProgress } from '@/features/magazine/hooks/useReadingProgress'
import { cn } from '@/lib/cn'

function formatDate(iso: string) {
  return iso.replaceAll('-', '.')
}

/**
 * MAG-03 상세 뷰어. 레이아웃은 매거진 데모를 따른다 —
 * 왼쪽 레일(세로 카테고리·진행 트랙·좋아요·공유) + 본문 컬럼.
 * 데모의 '이 글의 온천' 카드는 OnsenCard가 feat/map에만 있어 머지 후에 붙인다.
 */
export default function MagazineDetailPage() {
  const { id } = useParams()
  const { magazine, loading, error } = useMagazine(Number(id))
  const progress = useReadingProgress()

  const [liked, setLiked] = useState(false)

  if (loading) return <p className="text-text-secondary py-20 text-[14px]">불러오는 중…</p>

  if (error || !magazine) {
    return (
      <div className="py-20">
        <p role="alert" className="text-text-secondary text-[14px]">
          {error ?? '글을 찾을 수 없습니다.'}
        </p>
        <Link
          to="/magazine"
          className="text-text-primary mt-4 inline-block text-[13px] underline underline-offset-4"
        >
          ← 목록으로
        </Link>
      </div>
    )
  }

  const { title, subtitle, category, readMinutes, publishedAt, author, photographer } = magazine
  const { body, likeCount, heroImageUrl } = magazine
  // body는 MULMUNG_TEXT 문자열 한 덩어리로 온다 — 빈 줄 기준으로 문단을 나눈다.
  const paragraphs = body
    .split(/\n{2,}/)
    .map((text) => text.trim())
    .filter(Boolean)

  const byline = [
    author && `글 ${author}`,
    photographer && `사진 ${photographer}`,
    formatDate(publishedAt),
  ]
    .filter(Boolean)
    .join(' · ')

  return (
    <div className="flex gap-12">
      {/* 왼쪽 레일 — 데모의 tools */}
      <aside className="hidden w-16 shrink-0 lg:block">
        <div className="sticky top-24 flex flex-col items-center gap-7 pt-14">
          <span
            className="text-text-secondary text-[12px] font-semibold tracking-[0.5em]"
            style={{ writingMode: 'vertical-rl' }}
          >
            {category.replaceAll(' ', '')}
          </span>

          <div className="bg-surface-dim relative h-40 w-[2px] rounded-full">
            <div
              className="bg-inverse absolute top-0 left-0 w-full rounded-full transition-[height]"
              style={{ height: `${progress * 100}%` }}
            />
          </div>

          <button
            type="button"
            onClick={() => setLiked((prev) => !prev)}
            aria-pressed={liked}
            aria-label="좋아요"
            className={cn(
              'flex size-10 items-center justify-center rounded-full border text-[15px] transition-colors outline-none',
              liked
                ? 'bg-inverse text-text-inverse border-border-strong'
                : 'border-border-default text-text-primary hover:border-border-strong',
            )}
          >
            {liked ? '♥' : '♡'}
            <span className="ml-[2px] text-[9px]">{likeCount + (liked ? 1 : 0)}</span>
          </button>
        </div>
      </aside>

      <article className="min-w-0 flex-1 pt-14 pb-28">
        <p className="text-text-secondary text-[12px] font-semibold tracking-[0.4em]">
          {category.split('').join(' ')}
        </p>

        <h1 className="text-text-primary mt-[18px] text-[44px] leading-[1.2] font-bold">{title}</h1>

        {subtitle && <p className="text-text-primary mt-[18px] text-[19px]">{subtitle}</p>}

        <div className="border-border-default text-text-secondary mt-9 flex justify-between border-b pb-7 text-[13px]">
          <span>{byline}</span>
          <span>{readMinutes}분</span>
        </div>

        {heroImageUrl ? (
          <img
            src={heroImageUrl}
            alt=""
            className="mt-9 h-[420px] w-full rounded-sm object-cover"
          />
        ) : (
          <div className="bg-surface-dim mt-9 h-[420px] w-full rounded-sm" />
        )}

        {paragraphs.map((paragraph, index) => (
          <p
            key={paragraph}
            className={cn(
              'text-text-primary mt-6 text-[16px] leading-[1.9]',
              // 데모처럼 첫 문단의 첫 글자를 크게 시작한다.
              index === 0 &&
                'first-letter:mr-2 first-letter:float-left first-letter:text-[34px] first-letter:leading-[1.1] first-letter:font-bold',
            )}
          >
            {paragraph}
          </p>
        ))}

        <Link
          to="/magazine"
          className="text-text-secondary hover:text-text-primary mt-12 inline-block text-[13px] underline underline-offset-4"
        >
          ← 목록으로
        </Link>
      </article>
    </div>
  )
}
