import { useState } from 'react'

import OnsenSpecSummary from '@/components/OnsenSpecSummary'
import NearbyList from '@/features/map/components/NearbyList'
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
 * MAP-02 상세패널. 한눈에·정보 탭은 명세에 있는 온천 스펙(수온·수질·효능·시설·요금·뚜벅이)으로
 * 채우고, 리뷰(REV-*)·주변(PAM-04)은 해당 기능이 붙어야 한다.
 */
export default function OnsenDetailPanel({ onsen, onClose }: OnsenDetailPanelProps) {
  const [tab, setTab] = useState<DetailTab>('한눈에')

  const { name, address, imageUrl, rating, reviewCount } = onsen

  return (
    <div className="bg-surface scrollbar-thin flex h-full min-w-0 flex-col overflow-y-auto px-[13px] pb-8">
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
        <svg
          aria-hidden
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="text-border-default mt-1 size-[18px] shrink-0"
        >
          <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78Z" />
        </svg>
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

      <div className="pt-5">
        {tab === '한눈에' && <OnsenSpecSummary onsen={onsen} />}
        {tab === '정보' && <Details onsen={onsen} />}
        {tab === '주변' && <NearbyList onsenId={onsen.id} active />}
        {/* 리뷰는 REV-*가 붙어야 채울 수 있다. */}
        {tab === '리뷰' && (
          <p className="text-text-secondary text-[13px] leading-[1.6]">
            리뷰 정보는 준비 중입니다.
          </p>
        )}
      </div>
    </div>
  )
}

/** 시안 정보 탭의 행 — 라벨 64px + 값, 행 높이 32px. */
function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-baseline py-2">
      <span className="text-text-secondary w-16 shrink-0 text-[12px]">{label}</span>
      <span className="text-text-primary min-w-0 flex-1 text-[14px]">{value}</span>
    </div>
  )
}

function Section({ title, rows }: { title: string; rows: [string, string][] }) {
  if (rows.length === 0) return null
  return (
    <section>
      <h3 className="text-text-secondary text-[12px]">{title}</h3>
      <div className="mt-2">
        {rows.map(([label, value]) => (
          <Row key={label} label={label} value={value} />
        ))}
      </div>
    </section>
  )
}

function rowsOf(entries: [string, string | undefined][]) {
  return entries.filter((entry): entry is [string, string] => Boolean(entry[1]))
}

/** 시안 '상세패널 - 정보'(1:915) — 기본 정보 / 이용 안내 / 참고사항. */
function Details({ onsen }: { onsen: OnsenListItem }) {
  const {
    address,
    openingHours,
    phone,
    homepage,
    feeNote,
    admissionFee,
    closedDays,
    parking,
    facilities,
    notice,
  } = onsen

  const basic = rowsOf([
    ['주소', address],
    ['운영시간', openingHours],
    ['전화번호', phone],
    ['홈페이지', homepage],
  ])

  const usage = rowsOf([
    [
      '이용요금',
      feeNote ??
        (admissionFee !== undefined ? `성인 ${admissionFee.toLocaleString('ko-KR')}원` : undefined),
    ],
    ['휴무일', closedDays],
    ['주차', parking],
    ['편의시설', facilities?.length ? facilities.join(' · ') : undefined],
  ])

  if (basic.length === 0 && usage.length === 0 && !notice) {
    return <p className="text-text-secondary text-[13px] leading-[1.6]">등록된 정보가 없습니다.</p>
  }

  return (
    <div className="flex flex-col gap-6">
      <Section title="기본 정보" rows={basic} />
      <Section title="이용 안내" rows={usage} />
      {notice && (
        <section>
          <h3 className="text-text-secondary text-[12px]">참고사항</h3>
          <p className="text-text-primary mt-2 text-[14px] leading-[1.6]">{notice}</p>
        </section>
      )}
    </div>
  )
}
