import { useState } from 'react'

import OnsenSpecSummary from '@/components/OnsenSpecSummary'
import NearbyList from '@/features/map/components/NearbyList'
import ReviewSection from '@/features/map/components/ReviewSection'
import { useOnsenDetail } from '@/features/map/hooks/useOnsenDetail'
import { cn } from '@/lib/cn'

import type { OnsenListItem } from '@/features/map/api/map'
import type { OnsenDetail } from '@/types/onsenDetail'

/** 시안 기준 탭 순서. 일반장소는 '한눈에'가 없지만 ①은 온천만 다룬다. */
const TABS = ['한눈에', '리뷰', '주변', '정보'] as const

type DetailTab = (typeof TABS)[number]

type OnsenDetailPanelProps = {
  onsen: OnsenListItem
  onClose: () => void
  onDirections: () => void
}

/**
 * MAP-02 상세패널. 한눈에·정보 탭은 명세에 있는 온천 스펙(수온·수질·효능·시설·요금·뚜벅이)으로
 * 채운다. 리뷰(REV-*)는 목 모드에서 화면 검토용 목록을 보여준다.
 */
export default function OnsenDetailPanel({ onsen, onClose, onDirections }: OnsenDetailPanelProps) {
  const [tab, setTab] = useState<DetailTab>('한눈에')

  // 목록 데이터로 먼저 그리고 상세가 도착하면 덮는다 — 로딩 중에도 화면이 비지 않는다.
  const { detail } = useOnsenDetail(onsen.id)

  const { name, imageUrl } = onsen
  const address = detail?.address ?? onsen.address
  const rating = detail?.reviewSummary?.avgRating ?? onsen.rating
  const reviewCount = detail?.reviewSummary?.count ?? onsen.reviewCount

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
        <img
          src={imageUrl}
          alt=""
          className="mt-1 h-[206px] w-full shrink-0 rounded-sm object-cover"
        />
      ) : (
        <div className="bg-surface-dim mt-1 h-[206px] w-full shrink-0 rounded-sm" />
      )}

      {/* 저장·공유는 후속 범위. 길찾기는 이 온천을 도착지로 채운다. */}
      <div className="mt-[10px] flex items-center gap-4">
        {['저장', '공유'].map((action) => (
          <span key={action} className="text-text-secondary text-[12px]">
            {action}
          </span>
        ))}
        <button
          type="button"
          onClick={onDirections}
          className="text-text-primary text-[12px] underline underline-offset-4"
        >
          길찾기
        </button>
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
        {tab === '한눈에' && <OnsenSpecSummary onsen={onsen} detail={detail} />}
        {tab === '정보' && <Details onsen={onsen} detail={detail} />}
        {tab === '주변' && <NearbyList onsenId={onsen.id} active />}
        {tab === '리뷰' && <ReviewSection onsen={onsen} />}
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

/** 상세 응답은 값이 없을 때 null로 오므로 undefined와 함께 걸러낸다. */
function rowsOf(entries: [string, string | undefined | null][]) {
  return entries.filter((entry): entry is [string, string] => Boolean(entry[1]))
}

/**
 * 시안 '상세패널 - 정보'(1:915) — 기본 정보 / 이용 안내 / 가는 법 / 참고사항.
 * 상세 응답(PAM-03)이 오면 그 값을 쓰고, 오기 전에는 목록 데이터로 먼저 그린다.
 */
function Details({ onsen, detail }: { onsen: OnsenListItem; detail?: OnsenDetail }) {
  const { feeNote, facilities } = onsen

  const address = detail?.address ?? onsen.address
  const openingHours = detail?.hours ?? onsen.openingHours
  const phone = detail?.phone ?? onsen.phone
  const homepage = detail?.homepageUrl ?? onsen.homepage
  const closedDays = detail?.holiday ?? onsen.closedDays
  const parking = detail?.parkingInfo ?? onsen.parking
  const priceMin = detail?.priceMin ?? onsen.admissionFee
  const notice = detail?.notes ?? onsen.notice

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
        (priceMin !== undefined && priceMin !== null
          ? `성인 ${priceMin.toLocaleString('ko-KR')}원`
          : undefined),
    ],
    ['휴무일', closedDays],
    ['주차', parking],
    ['편의시설', facilities?.length ? facilities.join(' · ') : undefined],
  ])

  // 거점역 유무와 접근성 등급은 별개다 — 거점역이 없어도 '자차 필수'는 알려줄 값이다.
  const station = detail?.access?.nearestStation
  const access = rowsOf([
    ['접근성', detail?.access?.accessLevelLabel],
    ['거점역', station?.name],
    ['가는 법', station?.stationToPlaceDesc],
  ])

  if (basic.length === 0 && usage.length === 0 && access.length === 0 && !notice) {
    return <p className="text-text-secondary text-[13px] leading-[1.6]">등록된 정보가 없습니다.</p>
  }

  return (
    <div className="flex flex-col gap-6">
      <Section title="기본 정보" rows={basic} />
      <Section title="이용 안내" rows={usage} />
      {/* 거점역까지는 카카오, 거점역→온천은 팀 수기 (PAM-02). 거점역이 없으면 접근성만 남는다. */}
      <Section title="교통" rows={access} />
      {notice && (
        <section>
          <h3 className="text-text-secondary text-[12px]">참고사항</h3>
          <p className="text-text-primary mt-2 text-[14px] leading-[1.6]">{notice}</p>
        </section>
      )}
    </div>
  )
}
