import { Link, useParams } from 'react-router-dom'

import MagazineAside from '@/features/magazine/components/MagazineAside'
import MagazineJumpBar from '@/features/magazine/components/MagazineJumpBar'
import MagazineLikeButton from '@/features/magazine/components/MagazineLikeButton'
import MagazineShareButton from '@/features/magazine/components/MagazineShareButton'
import { useMagazine } from '@/features/magazine/hooks/useMagazine'
import { useReadingProgress } from '@/features/magazine/hooks/useReadingProgress'
import { cn } from '@/lib/cn'
import { DEFAULT_MAGAZINE_IMAGE } from '@/constants/images'

function formatDate(iso: string) {
  // 서버는 ISO 전체(2025-09-19T15:00:00Z)를 주므로 날짜 부분만 쓴다.
  return iso.slice(0, 10).replaceAll('-', '.')
}

/**
 * MAG-03 상세 뷰어. 레이아웃은 매거진 데모를 따른다 —
 * 왼쪽 레일(세로 카테고리·진행 트랙·좋아요·공유) + 본문 컬럼.
 * 오른쪽 레일(이 글의 온천·다음 글)은 MagazineAside가 맡는다.
 */
export default function MagazineDetailPage() {
  const { id } = useParams()
  const { magazine, loading, error } = useMagazine(Number(id))
  const progress = useReadingProgress()

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

  const { title, subtitle, categoryLabel, readMinutes, publishedAt, author, photographer } =
    magazine
  const { body, likeCount, isLiked, heroImageUrl, magazineId } = magazine
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
    <>
      <MagazineJumpBar current={magazine.category} />
      <div className="flex gap-12">
        {/* 왼쪽 레일 — 데모의 tools */}
        <aside className="hidden w-16 shrink-0 lg:block">
          <div className="sticky top-24 flex flex-col items-center gap-7 pt-14">
            <span
              className="text-text-secondary text-[12px] font-semibold tracking-[0.5em]"
              style={{ writingMode: 'vertical-rl' }}
            >
              {categoryLabel.replaceAll(' ', '')}
            </span>

            <div className="bg-surface-dim relative h-40 w-[2px] rounded-full">
              <div
                className="bg-inverse absolute top-0 left-0 w-full rounded-full transition-[height]"
                style={{ height: `${progress * 100}%` }}
              />
            </div>

            <MagazineLikeButton magazineId={magazineId} isLiked={isLiked} likeCount={likeCount} />
            <MagazineShareButton />
          </div>
        </aside>

        <article className="min-w-0 flex-1 pt-14 pb-28 xl:max-w-[680px]">
          <p className="text-text-secondary text-[12px] font-semibold tracking-[0.4em]">
            {categoryLabel.split('').join(' ')}
          </p>

          <h1 className="text-text-primary mt-[18px] text-[40px] leading-[1.2] font-black sm:text-[52px]">
            {title}
          </h1>

          {subtitle && <p className="text-text-primary mt-[18px] text-[19px]">{subtitle}</p>}

          <div className="border-border-default text-text-secondary mt-9 flex items-center justify-between gap-4 border-b pb-7 text-[13px]">
            <span className="min-w-0">{byline}</span>
            <span className="flex shrink-0 items-center gap-3">
              <span>{readMinutes}분</span>
              {/* 왼쪽 레일은 lg 이상에서만 보여서, 좁은 화면에는 여기에 둔다. */}
              <span className="flex items-center gap-2 lg:hidden">
                <MagazineLikeButton
                  magazineId={magazineId}
                  isLiked={isLiked}
                  likeCount={likeCount}
                />
                <MagazineShareButton />
              </span>
            </span>
          </div>

          {/* 사진은 본문 단을 뚫고 좌우로 나간다 — 데모의 풀블리드. 좁은 화면은 그대로. */}
          <figure className="mt-9 xl:-mx-[60px] xl:w-[calc(100%+120px)]">
            {/* 사진이 없거나 깨지면 기본 표지로 대체한다 — 빈 회색 칸을 두지 않는다. */}
            <img
              src={heroImageUrl || DEFAULT_MAGAZINE_IMAGE}
              alt=""
              onError={(event) => {
                const image = event.currentTarget
                image.onerror = null
                // 기본 표지까지 없으면 깨진 아이콘 대신 빈 자리로 둔다.
                if (image.src.endsWith(DEFAULT_MAGAZINE_IMAGE)) image.style.visibility = 'hidden'
                else image.src = DEFAULT_MAGAZINE_IMAGE
              }}
              className="h-[420px] w-full rounded-sm object-cover"
            />
            <figcaption className="text-text-secondary mt-3 text-[11px]">
              ⓒ 물멍{photographer ? ` · 사진 ${photographer}` : ''}
            </figcaption>
          </figure>

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

        <MagazineAside magazine={magazine} />
      </div>
    </>
  )
}
