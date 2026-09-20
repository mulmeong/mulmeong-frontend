import { useState } from 'react'

import { DEFAULT_ONSEN_IMAGE } from '@/constants/images'
import FavoriteButton from '@/features/favorites/FavoriteButton'
import { cn } from '@/lib/cn'
import { SIDEBAR_CARD_IMAGE as IMAGE_FRAME } from './sidebarCardStyles'

import type { OnsenListItem } from '@/features/map/api/map'

type RegionPlaceCardProps = {
  onsen: OnsenListItem
  region?: string
  selected: boolean
  onClick: () => void
}

/** 실제 카드와 사진·텍스트 행 높이를 공유해 로딩 전후 위치를 유지한다. */
export function RegionPlaceCardSkeleton() {
  return (
    <div aria-hidden="true" className="motion-safe:animate-pulse">
      <div className={IMAGE_FRAME} />
      <div className="mt-2 flex h-4 items-center">
        <div className="bg-border-default/35 h-2 w-14 rounded-full" />
      </div>
      <div className="mt-1 flex h-5 items-center">
        <div className="bg-border-default/40 h-3 w-3/4 rounded-full" />
      </div>
      <div className="mt-1 flex h-4 items-center">
        <div className="bg-border-default/30 h-2 w-1/2 rounded-full" />
      </div>
    </div>
  )
}

export default function RegionPlaceCard({
  onsen,
  region,
  selected,
  onClick,
}: RegionPlaceCardProps) {
  const [failedImage, setFailedImage] = useState<string>()
  const { name, address, imageUrl, waterQuality, waterTempC, tags } = onsen
  const location =
    region && address.startsWith(`${region} `) ? address.slice(region.length).trim() : address
  const description =
    [waterQuality, waterTempC !== undefined ? `${waterTempC}℃` : undefined]
      .filter(Boolean)
      .join(' · ') || tags.slice(0, 2).join(' · ')

  return (
    <div className="relative">
      <button
        type="button"
        onClick={onClick}
        aria-current={selected || undefined}
        className="group block w-full rounded-sm text-left outline-none focus-visible:ring-2 focus-visible:ring-border-strong focus-visible:ring-offset-2"
      >
        <span className={IMAGE_FRAME}>
          {imageUrl && failedImage !== imageUrl ? (
            <img
              src={imageUrl}
              alt=""
              loading="lazy"
              onError={() => setFailedImage(imageUrl)}
              className="size-full object-cover transition-opacity duration-200 group-hover:opacity-90"
            />
          ) : (
            <img
              src={DEFAULT_ONSEN_IMAGE}
              alt=""
              loading="lazy"
              className="size-full object-cover transition-opacity duration-200 group-hover:opacity-90"
            />
          )}
          {selected && (
            <span className="text-text-primary absolute right-3 bottom-3 inline-flex items-center gap-1.5 rounded-[4px] bg-white/85 px-2 py-1 text-[11px] leading-4 font-semibold backdrop-blur-[2px]">
              <span aria-hidden="true" className="bg-text-primary size-1.5 rounded-full" />
              현재 보는 곳
            </span>
          )}
        </span>
        <span className="text-text-secondary mt-2 block min-h-4 truncate text-[11px] leading-4">
          {location}
        </span>
        <span
          className={cn(
            'text-text-primary mt-1 block truncate text-[14px] leading-5 group-hover:underline group-hover:underline-offset-4',
            selected ? 'font-semibold' : 'font-medium',
          )}
        >
          {name}
        </span>
        <span className="text-text-secondary mt-1 block min-h-4 truncate text-[12px] leading-4">
          {description}
        </span>
      </button>
      {/* 사진 위 오버레이라 기본 크기(32px)는 카드에 비해 커 보인다. */}
      <div className="absolute top-2 right-2 rounded-sm bg-white/85">
        <FavoriteButton
          target={{ placeId: onsen.id }}
          name={name}
          className="size-7 [&>svg]:size-4"
        />
      </div>
    </div>
  )
}
