import { useState } from 'react'

import { cn } from '@/lib/cn'

import type { OnsenListItem } from '@/features/map/api/map'

type RegionPlaceCardProps = {
  onsen: OnsenListItem
  region?: string
  selected: boolean
  onClick: () => void
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
    <button
      type="button"
      onClick={onClick}
      aria-current={selected || undefined}
      className="group block w-full rounded-sm text-left outline-none focus-visible:ring-2 focus-visible:ring-border-strong focus-visible:ring-offset-2"
    >
      <span className="bg-surface-dim relative flex aspect-[8/5] items-center justify-center overflow-hidden rounded-sm">
        {imageUrl && failedImage !== imageUrl ? (
          <img
            src={imageUrl}
            alt=""
            loading="lazy"
            onError={() => setFailedImage(imageUrl)}
            className="size-full object-cover transition-transform duration-300 motion-safe:group-hover:scale-105"
          />
        ) : (
          <svg
            aria-hidden="true"
            viewBox="0 0 48 48"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.3"
            strokeLinecap="round"
            className="text-text-secondary/50 size-12"
          >
            <path d="M13 29c-4 1.5-6 3.5-6 6 0 4 7.6 7 17 7s17-3 17-7c0-2.5-2-4.5-6-6M13 35c3 1.5 6.7 2 11 2s8-.5 11-2" />
            <path d="M16 26c-5-6 5-9 0-15M24 27c-6-7 6-12 0-20M32 26c-5-6 5-9 0-15" />
          </svg>
        )}
        {selected && (
          <span className="bg-inverse text-text-inverse absolute right-2 bottom-2 rounded-sm px-2 py-1 text-[10px]">
            보고 있는 곳
          </span>
        )}
      </span>
      <span className="text-text-secondary mt-3 block truncate text-[11px]">{location}</span>
      <span
        className={cn(
          'text-text-primary mt-1 block truncate text-[14px] group-hover:underline group-hover:underline-offset-4',
          selected ? 'font-semibold' : 'font-medium',
        )}
      >
        {name}
      </span>
      {description && (
        <span className="text-text-secondary mt-1 block truncate text-[12px]">{description}</span>
      )}
    </button>
  )
}
