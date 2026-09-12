import { useState } from 'react'

import { cn } from '@/lib/cn'

import type { OnsenListItem } from '@/features/map/api/map'

/** 시안 기준 탭 순서. 일반장소는 '한눈에'가 없지만 ①은 온천만 다룬다. */
const TABS = ['한눈에', '리뷰', '주변', '정보'] as const

type DetailTab = (typeof TABS)[number]

type OnsenDetailPanelProps = {
  onsen: OnsenListItem
  onClose: () => void
}

/**
 * MAP-02 상세패널 껍데기. 탭 내용은 각각 별도 기능(REV-*, PAM-04)과 상세 응답 스키마가
 * 정해진 뒤에 채운다 — 지금은 Onsen에 있는 필드만 쓴다.
 */
export default function OnsenDetailPanel({ onsen, onClose }: OnsenDetailPanelProps) {
  const [tab, setTab] = useState<DetailTab>('한눈에')

  const { name, address, imageUrl, rating, reviewCount } = onsen

  return (
    <div className="bg-surface flex h-full min-w-0 flex-col overflow-y-auto px-[13px] pb-8">
      <div className="flex justify-end pt-[30px]">
        <button
          type="button"
          onClick={onClose}
          aria-label="상세 닫기"
          className="text-text-primary size-[34px] text-[18px] leading-none outline-none focus-visible:underline"
        >
          ✕
        </button>
      </div>

      <div className="flex items-start justify-between gap-3 pt-[17px]">
        <div className="min-w-0">
          <h2 className="text-text-primary truncate text-[20px] font-bold">{name}</h2>
          <p className="text-text-secondary mt-[5px] text-[13px]">{address}</p>
        </div>
        {/* 찜은 PAM-07·로그인 필요 범위라 A-1에서는 자리만 잡는다. */}
        <div
          aria-hidden
          className="border-border-default mt-1 size-[18px] shrink-0 rounded-full border"
        />
      </div>

      {imageUrl ? (
        <img src={imageUrl} alt="" className="mt-1 h-[206px] w-full rounded-sm object-cover" />
      ) : (
        <div className="bg-surface-dim mt-1 h-[206px] w-full rounded-sm" />
      )}

      {/* 시안 Place Action Row. 저장(PAM-07)·공유·길찾기는 아직 범위 밖이라 동작은 비운다. */}
      <div className="mt-[10px] flex items-center gap-4">
        {['저장', '공유', '길찾기'].map((action) => (
          <span key={action} className="text-text-secondary text-[12px]">
            {action}
          </span>
        ))}
      </div>

      {rating !== undefined && (
        <p className="text-text-primary mt-[10px] text-[15px]">
          ★ {rating.toFixed(1)} · 리뷰 {reviewCount}개
        </p>
      )}

      <div role="tablist" className="border-border-default mt-[21px] flex border-b">
        {TABS.map((item) => (
          <button
            key={item}
            type="button"
            role="tab"
            aria-selected={tab === item}
            onClick={() => setTab(item)}
            className={cn(
              'relative flex-1 pb-[7px] text-[13px] outline-none',
              tab === item
                ? 'text-text-primary font-semibold after:bg-inverse after:absolute after:inset-x-0 after:-bottom-px after:h-[2px] after:content-[""]'
                : 'text-text-secondary',
            )}
          >
            {item}
          </button>
        ))}
      </div>

      <p className="text-text-secondary pt-5 text-[13px] leading-[1.6]">
        {tab} 정보는 준비 중입니다.
      </p>
    </div>
  )
}
