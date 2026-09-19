import type { CSSProperties, ReactNode } from 'react'
import { Link } from 'react-router-dom'

import { cn } from '@/lib/cn'

type AuthLayoutProps = {
  /** public/images 아래 파일명 */
  image: string
  /** 원본 가로/세로. 이미지가 잘리지 않게 이 비율로 칸 너비를 잡는다. */
  imageRatio: number
  /** 줄바꿈은 배열로 */
  headline: string[]
  caption?: string[]
  formPage?: boolean
  panelClassName?: string
  contentClassName?: string
  children: ReactNode
}

export default function AuthLayout({
  image,
  imageRatio,
  headline,
  caption,
  formPage = false,
  panelClassName,
  contentClassName,
  children,
}: AuthLayoutProps) {
  return (
    <div className="bg-surface flex min-h-dvh flex-col lg:h-dvh lg:min-h-0 lg:flex-row lg:overflow-hidden">
      <div
        className={cn(
          'relative shrink-0 overflow-hidden lg:h-full lg:w-[var(--image-width)] lg:max-w-[55%] lg:min-w-[280px]',
          formPage ? 'h-[200px] sm:h-[260px]' : 'h-[240px] sm:h-[320px]',
        )}
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

        <div className="absolute right-6 bottom-7 left-6 lg:right-8 lg:bottom-12 lg:left-8">
          <h2 className="text-[26px] leading-[1.3] font-bold text-white sm:text-[32px] lg:text-[34px]">
            {headline.map((line) => (
              <span key={line} className="block">
                {line}
              </span>
            ))}
          </h2>
          {caption && (
            <p
              className={cn(
                'mt-3 text-[13px] leading-[1.6] text-white/75 sm:text-[14px]',
                formPage && 'hidden sm:block',
              )}
            >
              {caption.map((line) => (
                <span key={line} className="block">
                  {line}
                </span>
              ))}
            </p>
          )}
        </div>
      </div>

      <div
        className={cn(
          'flex flex-1 justify-center px-6 py-12 sm:px-10 lg:min-h-0 lg:overflow-y-auto lg:px-14',
          formPage ? 'min-w-0 flex-col justify-start py-10 sm:py-12 lg:px-12' : 'items-center',
          panelClassName,
        )}
      >
        <div
          className={cn(
            'w-full',
            formPage ? 'mx-auto my-auto max-w-[480px] shrink-0' : 'max-w-[420px]',
            contentClassName,
          )}
        >
          {children}
        </div>
      </div>
    </div>
  )
}
