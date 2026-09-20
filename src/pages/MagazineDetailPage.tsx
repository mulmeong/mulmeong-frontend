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
      {/*
        RootLayout의 main은 max-w-5xl(px-6)라 좌우 보조 영역 둘을 넉넉히 못
        수용한다. 히어로 사진이 article 밖으로 넘치는(풀블리드) 채로 gap만
        키우면 넘친 만큼 간격이 상쇄돼 버려서(실측: 좌우 각 4px) 폭 확장 없이는
        32~48px 여백을 못 만든다.

        이 페이지에서만 음수 마진(xl:-mx-16)으로 main의 padding 안쪽 콘텐츠
        슬롯을 좌우로 64px씩 넓힌다. 반대쪽에 같은 크기의 padding을 다시 주면
        완전히 상쇄되어 원래 폭(976px)으로 되돌아가므로 padding은 주지 않는다
        — 넓힌 공간은 안쪽 flex가 그대로 다 쓴다. main 자체는 건드리지 않아
        다른 페이지 폭에는 영향이 없다.

        xl 이상에서만 거는 이유: 두 레일 다 xl 미만에서는 hidden이라(lg:block·
        xl:block) 그 아래 폭에서 넓힐 이유가 없고, 좁은 화면에 그대로 걸면
        wrapper가 뷰포트를 넘어가 가로 스크롤이 생긴다(실측 확인).
      */}
      <div className="xl:-mx-16">
        <div className="flex gap-20">
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

            {/*
              사진은 본문 단을 뚫고 좌우로 나간다 — 데모의 풀블리드. 오버행을
              60px에서 40px로 줄였다 — 이전 값은 gap(80px)을 거의 다 상쇄해서
              사진 오른쪽 끝이 온천 카드에 거의 붙어 보였다(실측 4px).
              좁은 화면은 그대로 본문 폭에 맞춘다.
            */}
            <figure className="mt-9 xl:-mx-10 xl:w-[calc(100%+80px)]">
              {/* 사진이 없거나 깨지면 기본 표지로 대체한다 — 빈 회색 칸을 두지 않는다. */}
              <img
                src={heroImageUrl || DEFAULT_MAGAZINE_IMAGE}
                alt=""
                onError={(event) => {
                  const image = event.currentTarget
                  image.onerror = null
                  // 기본 표지까지 없으면 깨진 아이콘 대신 빈 자리로 둔다.
                  if (image.src.endsWith(DEFAULT_MAGAZINE_IMAGE)) {
                    image.style.visibility = 'hidden'
                  } else {
                    image.src = DEFAULT_MAGAZINE_IMAGE
                  }
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
      </div>
    </>
  )
}
