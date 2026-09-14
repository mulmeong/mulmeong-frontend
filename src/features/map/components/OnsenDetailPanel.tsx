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

      <div className="pt-5">
        {tab === '한눈에' && <AtAGlance onsen={onsen} />}
        {tab === '정보' && <Details onsen={onsen} />}
        {/* 리뷰는 REV-*, 주변은 PAM-04 — 각 기능이 붙어야 채울 수 있다. */}
        {(tab === '리뷰' || tab === '주변') && (
          <p className="text-text-secondary text-[13px] leading-[1.6]">
            {tab} 정보는 준비 중입니다.
          </p>
        )}
      </div>
    </div>
  )
}

function EmptyNote() {
  return <p className="text-text-secondary text-[13px] leading-[1.6]">등록된 정보가 없습니다.</p>
}

/** 시안의 데이터행 — 라벨 64px + 값. */
function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-baseline py-[9px]">
      <span className="text-text-secondary w-16 shrink-0 text-[12px]">{label}</span>
      <span className="text-text-primary min-w-0 flex-1 text-[13px]">{value}</span>
    </div>
  )
}

function formatFee(won: number) {
  return `${won.toLocaleString('ko-KR')}원`
}

/** PAM-01 스펙 뱃지(수온·수질·접근성) + 효능 한 줄. MAP-02도 같은 항목을 쓴다. */
function AtAGlance({ onsen }: { onsen: OnsenListItem }) {
  const { waterTempC, waterQuality, benefits, admissionFee, transitAccessible, tags } = onsen

  const badges = [
    waterTempC !== undefined ? `${waterTempC}℃` : undefined,
    waterQuality,
    transitAccessible === undefined ? undefined : transitAccessible ? '뚜벅이 가능' : '자차 권장',
    admissionFee !== undefined ? formatFee(admissionFee) : undefined,
  ].filter((badge): badge is string => Boolean(badge))

  if (badges.length === 0 && !benefits && tags.length === 0) return <EmptyNote />

  return (
    <div>
      {badges.length > 0 && (
        <ul className="flex flex-wrap gap-1.5">
          {badges.map((badge) => (
            <li
              key={badge}
              className="border-border-default text-text-primary rounded-full border px-2.5 py-1 text-[12px]"
            >
              {badge}
            </li>
          ))}
        </ul>
      )}

      {benefits && <p className="text-text-primary mt-3 text-[13px] leading-[1.6]">{benefits}</p>}

      {tags.length > 0 && (
        <p className="text-text-secondary mt-3 text-[12px]">{tags.map((t) => `#${t}`).join(' ')}</p>
      )}
    </div>
  )
}

/** 전화·홈페이지·휴무일은 시안에 있지만 명세에 근거가 없어 넣지 않는다. */
function Details({ onsen }: { onsen: OnsenListItem }) {
  const { address, waterTempC, waterQuality, admissionFee, facilities, transitAccessible } = onsen

  const rows = [
    { label: '주소', value: address },
    { label: '수온', value: waterTempC !== undefined ? `${waterTempC}℃` : undefined },
    { label: '수질', value: waterQuality },
    { label: '이용요금', value: admissionFee !== undefined ? formatFee(admissionFee) : undefined },
    { label: '편의시설', value: facilities?.length ? facilities.join(' · ') : undefined },
    {
      label: '대중교통',
      value:
        transitAccessible === undefined
          ? undefined
          : transitAccessible
            ? '대중교통으로 갈 수 있어요'
            : '자차 이용을 권합니다',
    },
  ].filter((row): row is { label: string; value: string } => Boolean(row.value))

  if (rows.length === 0) return <EmptyNote />

  return (
    <div className="divide-border-default divide-y">
      {rows.map((row) => (
        <Row key={row.label} label={row.label} value={row.value} />
      ))}
    </div>
  )
}
