import type { CSSProperties, ReactNode } from 'react'
import { Link } from 'react-router-dom'

type AuthLayoutProps = {
  /** public/images 아래 파일명 */
  image: string
  /** 원본 가로/세로. 이미지가 잘리지 않게 이 비율로 칸 너비를 잡는다. */
  imageRatio: number
  /** 줄바꿈은 배열로 */
  headline: string[]
  caption?: string[]
  children: ReactNode
}

export default function AuthLayout({
  image,
  imageRatio,
  headline,
  caption,
  children,
}: AuthLayoutProps) {
  return (
    <div className="bg-surface flex min-h-dvh flex-col lg:h-dvh lg:min-h-0 lg:flex-row lg:overflow-hidden">
      <div
        className={
          // 모바일에선 폼이 주인공이라 비주얼을 얇은 브랜드 띠로 줄이고,
          // 태블릿부터 비중을 키운다.
          'relative h-[136px] shrink-0 overflow-hidden sm:h-[240px] md:h-[300px] ' +
          'lg:h-full lg:w-[var(--image-width)] lg:max-w-[48%] lg:min-w-[280px] xl:max-w-[52%]'
        }
        style={{ '--image-width': `calc(100dvh * ${imageRatio})` } as CSSProperties}
      >
        <img src={`/images/${image}`} alt="" className="size-full object-cover" />
        <div className="absolute inset-0 bg-gradient-to-t from-black/55 via-black/10 to-black/25" />

        <Link
          to="/"
          className="absolute top-5 left-6 text-[13px] font-medium tracking-[1.5px] text-white/90"
        >
          MULMEONG
        </Link>

        {/* 모바일 띠에서는 헤드라인이 자리를 뺏으므로 숨기고, 폼에 집중시킨다. */}
        <div className="absolute right-6 bottom-7 left-6 hidden sm:block lg:right-10 lg:bottom-12 lg:left-10">
          <h2 className="text-[28px] leading-[1.25] font-bold tracking-[-0.02em] text-white lg:text-[34px]">
            {headline.map((line) => (
              <span key={line} className="block">
                {line}
              </span>
            ))}
          </h2>
          {caption && (
            <p className="mt-3 text-[13px] leading-[1.6] text-white/75 sm:text-[14px]">
              {caption.map((line) => (
                <span key={line} className="block">
                  {line}
                </span>
              ))}
            </p>
          )}
        </div>
      </div>

      <div className="flex flex-1 justify-center px-6 py-12 sm:px-10 sm:py-16 lg:min-h-0 lg:items-center lg:overflow-y-auto lg:px-16 lg:py-12">
        <div className="w-full max-w-[440px]">{children}</div>
      </div>
    </div>
  )
}
