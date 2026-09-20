import { useEffect, useId, useState, type ReactNode } from 'react'

import OnsenSpecSummary from '@/components/OnsenSpecSummary'
import { DEFAULT_ONSEN_IMAGE } from '@/constants/images'
import FavoriteButton from '@/features/favorites/FavoriteButton'
import NearbyList from '@/features/map/components/NearbyList'
import ReviewSection from '@/features/map/components/ReviewSection'
import { useOnsenDetail } from '@/features/map/hooks/useOnsenDetail'
import { onsenFromDetail } from '@/features/map/utils/onsenFromDetail'
import { cn } from '@/lib/cn'
import { copyLink } from '@/lib/copyLink'

import type { OnsenListItem } from '@/features/map/api/map'
import type { OnsenMapPoint } from '@/features/map/types/mapPoint'
import type { OnsenDetail } from '@/types/onsenDetail'

/** 시안 기준 탭 순서. 일반장소는 '한눈에'가 없지만 ①은 온천만 다룬다. */
const TABS = ['한눈에', '리뷰', '주변', '정보'] as const

type DetailTab = (typeof TABS)[number]

const ACTIONS = [
  { label: '저장', icon: 'save' },
  { label: '공유', icon: 'share' },
  { label: '길찾기', icon: 'directions' },
] as const

/**
 * 온천 공유 링크. 서버가 토큰을 주는 팜플렛과 달리 온천은 공유 API가 없고,
 * MapPage가 `?onsen={id}`를 읽어 해당 온천을 열어 준다.
 */
function shareLinkOf(onsenId: number): string {
  return `${window.location.origin}/map?onsen=${onsenId}`
}

function ActionIcon({
  kind,
  className = 'size-4',
}: {
  kind: (typeof ACTIONS)[number]['icon']
  className?: string
}) {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
    >
      {kind === 'save' && (
        <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78Z" />
      )}
      {kind === 'share' && <path d="M12 15V3m-4 4 4-4 4 4M5 12v8h14v-8" />}
      {kind === 'directions' && <path d="m12 3 9 9-9 9-9-9 9-9ZM8 15v-4h8m-3-3 3 3-3 3" />}
    </svg>
  )
}

type OnsenDetailPanelProps = {
  onsen: OnsenListItem | OnsenMapPoint
  onDirections: () => void
  /** 주변 탭이 열렸는지 — 지도에 주변 마커를 띄울지 판단한다. */
  onNearbyOpenChange?: (open: boolean) => void
  selectedNearbyKey?: string
  onSelectNearby?: (key: string) => void
}

/**
 * MAP-02 상세패널. 한눈에·정보 탭은 명세에 있는 온천 스펙(수온·수질·효능·시설·요금·뚜벅이)으로
 * 채운다. 리뷰(REV-*)는 목 모드에서 화면 검토용 목록을 보여준다.
 */
export default function OnsenDetailPanel({
  onsen,
  onDirections,
  onNearbyOpenChange,
  selectedNearbyKey,
  onSelectNearby,
}: OnsenDetailPanelProps) {
  const { detail, loading, error, retry } = useOnsenDetail(onsen.id)
  const summary = 'tags' in onsen ? onsen : detail ? onsenFromDetail(detail) : undefined

  if (!summary) {
    return (
      <div className="bg-surface scrollbar-thin h-full overflow-y-auto px-4 pb-8">
        <div className="flex h-12 items-center pt-3">
          <span className="text-text-secondary text-[11px]">장소 상세</span>
        </div>
        <h2 className="text-text-primary pt-1 text-[20px] leading-[1.4] font-semibold tracking-tight">
          {onsen.name}
        </h2>
        {loading && (
          <p role="status" className="text-text-secondary mt-5 text-[13px]">
            장소 정보를 불러오는 중…
          </p>
        )}
        {error && (
          <div className="mt-5">
            <p role="alert" className="text-text-secondary text-[13px]">
              장소 정보를 불러오지 못했어요.
            </p>
            <button
              type="button"
              onClick={retry}
              className="text-text-primary mt-2 min-h-9 text-[12px] underline underline-offset-4"
            >
              다시 시도
            </button>
          </div>
        )}
      </div>
    )
  }

  return (
    <OnsenDetailContent
      key={onsen.id}
      onsen={summary}
      detail={detail}
      onDirections={onDirections}
      onNearbyOpenChange={onNearbyOpenChange}
      selectedNearbyKey={selectedNearbyKey}
      onSelectNearby={onSelectNearby}
    />
  )
}

function OnsenDetailContent({
  onsen,
  detail,
  onDirections,
  onNearbyOpenChange,
  selectedNearbyKey,
  onSelectNearby,
}: {
  onsen: OnsenListItem
  detail?: OnsenDetail
  onDirections: () => void
  onNearbyOpenChange?: (open: boolean) => void
  selectedNearbyKey?: string
  onSelectNearby?: (key: string) => void
}) {
  const [tab, setTab] = useState<DetailTab>('한눈에')
  const tabsId = useId()
  const [copied, setCopied] = useState(false)

  // 주변 탭이 열린 동안만 지도에 주변 마커를 띄운다. 패널이 닫히거나 다른 온천으로
  // 바뀌면(key로 새로 마운트된다) 해제된다.
  const nearbyOpen = tab === '주변'
  useEffect(() => {
    onNearbyOpenChange?.(nearbyOpen)
    return () => onNearbyOpenChange?.(false)
  }, [nearbyOpen, onNearbyOpenChange])

  // 목록 데이터로 먼저 그리고 상세가 도착하면 덮는다 — 로딩 중에도 화면이 비지 않는다.
  const name = detail?.name ?? onsen.name
  const imageUrl = detail?.images?.[0] ?? onsen.imageUrl
  const address = detail?.address ?? onsen.address
  const rating = detail?.reviewSummary?.avgRating ?? onsen.rating
  const reviewCount = detail?.reviewSummary?.count ?? onsen.reviewCount

  const share = async () => {
    if (await copyLink(shareLinkOf(onsen.id))) {
      setCopied(true)
      window.setTimeout(() => setCopied(false), 2000)
    }
  }

  return (
    <div className="bg-surface scrollbar-thin h-full min-w-0 overflow-y-auto px-4 pb-8">
      <div className="flex h-12 items-center pt-3">
        <span className="text-text-secondary text-[11px]">장소 상세</span>
      </div>

      <div className="flex items-start gap-3 pt-1">
        <div className="min-w-0 flex-1">
          <h2 className="text-text-primary text-[20px] leading-[1.4] font-semibold tracking-tight break-keep [overflow-wrap:anywhere]">
            {name}
          </h2>
          {detail?.isRegistered && (
            <span className="border-border-default/70 text-text-secondary mt-2 inline-flex h-5 max-w-full items-center rounded-full border px-2 text-[11px] leading-none font-normal">
              행안부 등록 온천
            </span>
          )}
          <p className="text-text-secondary mt-1.5 text-[12px] leading-[1.7] [overflow-wrap:anywhere]">
            {address}
          </p>
        </div>
      </div>

      <img
        src={imageUrl || DEFAULT_ONSEN_IMAGE}
        alt=""
        onError={(event) => {
          event.currentTarget.onerror = null
          event.currentTarget.src = DEFAULT_ONSEN_IMAGE
        }}
        className="mt-6 h-[180px] w-full rounded-[2px] object-cover"
      />

      {/* 길찾기는 이 온천을 도착지로 채운다. */}
      <div role="group" aria-label="장소 액션" className="mt-2 grid grid-cols-3 gap-1 pb-1">
        {ACTIONS.map((action) =>
          action.icon === 'save' ? (
            <FavoriteButton
              key={action.icon}
              target={{ placeId: onsen.id }}
              name={name}
              label="저장"
              /* 옆의 공유·길찾기 아이콘(size-4)과 크기를 맞춘다. */
              className="h-9 w-full text-[12px] font-medium [&>svg]:size-4"
            />
          ) : (
            <button
              key={action.icon}
              type="button"
              onClick={action.icon === 'directions' ? onDirections : () => void share()}
              className="text-text-primary hover:not-disabled:bg-surface-dim flex min-h-9 items-center justify-center gap-2 text-[12px] font-medium outline-none focus-visible:ring-1 focus-visible:ring-inverse disabled:cursor-not-allowed disabled:opacity-50"
            >
              <ActionIcon kind={action.icon} />
              {action.icon === 'share' && copied ? '복사됨 ✓' : action.label}
            </button>
          ),
        )}
      </div>

      {/* 스크린 리더에도 알린다 — 아이콘 라벨 변화만으로는 전달되지 않는다. */}
      <p role="status" aria-live="polite" className="sr-only">
        {copied ? '공유 링크를 복사했습니다.' : ''}
      </p>

      {rating !== undefined && (
        <p
          className="text-text-primary flex items-baseline gap-2 py-5 text-[13px]"
          aria-label={`평점 ${rating.toFixed(1)}점, 리뷰 ${reviewCount}개`}
        >
          <span aria-hidden="true">★</span>
          <strong className="text-[16px] font-semibold tabular-nums">{rating.toFixed(1)}</strong>
          <span aria-hidden="true" className="text-border-default">
            ·
          </span>
          <span className="text-text-secondary text-[12px]">리뷰 {reviewCount}개</span>
        </p>
      )}

      <div
        role="tablist"
        aria-label="장소 상세 정보"
        className="bg-surface sticky top-0 z-10 mt-4 grid h-10 shrink-0 grid-cols-4 after:pointer-events-none after:absolute after:inset-x-0 after:bottom-0 after:h-px after:bg-border-default/70 after:content-['']"
        onKeyDown={(event) => {
          const index = TABS.indexOf(tab)
          const next =
            event.key === 'ArrowRight'
              ? (index + 1) % TABS.length
              : event.key === 'ArrowLeft'
                ? (index + TABS.length - 1) % TABS.length
                : event.key === 'Home'
                  ? 0
                  : event.key === 'End'
                    ? TABS.length - 1
                    : undefined
          if (next === undefined) return
          event.preventDefault()
          setTab(TABS[next])
          event.currentTarget.querySelectorAll<HTMLButtonElement>('[role="tab"]')[next]?.focus()
        }}
      >
        {TABS.map((item, index) => (
          <button
            key={item}
            type="button"
            role="tab"
            id={`${tabsId}-tab-${index}`}
            aria-controls={`${tabsId}-panel`}
            aria-selected={tab === item}
            tabIndex={tab === item ? 0 : -1}
            onClick={() => setTab(item)}
            className={cn(
              'relative flex h-10 min-w-0 items-center justify-center border-0 p-0 text-[13px] leading-5 font-medium whitespace-nowrap outline-none focus-visible:underline focus-visible:decoration-dotted focus-visible:underline-offset-4',
              tab === item ? 'text-text-primary' : 'text-text-primary/65',
            )}
          >
            <span className="block leading-5">{item}</span>
            <span
              aria-hidden="true"
              className={cn(
                'bg-text-primary pointer-events-none absolute inset-x-0 bottom-0 z-10 h-[2px]',
                tab === item ? 'opacity-100' : 'opacity-0',
              )}
            />
          </button>
        ))}
      </div>

      <div
        id={`${tabsId}-panel`}
        role="tabpanel"
        aria-labelledby={`${tabsId}-tab-${TABS.indexOf(tab)}`}
        tabIndex={0}
        className="pt-6 outline-none focus-visible:ring-1 focus-visible:ring-inverse focus-visible:ring-inset"
      >
        {tab === '한눈에' && <OnsenSpecSummary onsen={onsen} detail={detail} />}
        {tab === '정보' && <Details onsen={onsen} detail={detail} />}
        {tab === '주변' && (
          <NearbyList
            onsenId={onsen.id}
            active
            selectedKey={selectedNearbyKey}
            onSelectPlace={onSelectNearby}
          />
        )}
        {tab === '리뷰' && <ReviewSection onsen={onsen} />}
      </div>
    </div>
  )
}

/** 여러 줄 값도 라벨과 상단을 맞춘다. */
function Row({ label, value }: { label: string; value: ReactNode }) {
  const stacked = ['주소', '편의시설', '가는 법', '주차'].includes(label)
  return (
    <div
      className={stacked ? 'space-y-1.5' : 'grid grid-cols-[64px_minmax(0,1fr)] items-start gap-3'}
    >
      <dt className="text-text-secondary text-[11px] leading-6">{label}</dt>
      <dd className="text-text-primary text-[13px] leading-6 font-medium break-keep whitespace-pre-line [overflow-wrap:anywhere]">
        {value}
      </dd>
    </div>
  )
}

function Section({ title, rows }: { title: string; rows: [string, ReactNode][] }) {
  if (rows.length === 0) return null
  return (
    <section>
      <h3 className="text-text-primary text-[15px] leading-6 font-semibold">{title}</h3>
      <dl className="mt-4 space-y-4">
        {rows.map(([label, value]) => (
          <Row key={label} label={label} value={value} />
        ))}
      </dl>
    </section>
  )
}

function AccessValue({ label, stationName }: { label: string; stationName?: string | null }) {
  return (
    <span className="inline-flex max-w-full flex-wrap items-center gap-x-2 gap-y-1 align-top">
      <span>{label}</span>
      {stationName && (
        <span className="border-border-default/70 text-text-secondary inline-flex h-5 max-w-full items-center rounded-full border px-2 text-[11px] leading-none font-normal">
          {stationName} 기준
        </span>
      )}
    </span>
  )
}

function joinUnique(values: (string | undefined | null | false)[]) {
  const seen = new Set<string>()
  return values
    .filter((value): value is string => Boolean(value))
    .filter((value) => {
      if (seen.has(value)) return false
      seen.add(value)
      return true
    })
    .join(' · ')
}

/** 상세 응답은 값이 없을 때 null로 오므로 undefined와 함께 걸러낸다. */
function rowsOf(entries: [string, string | undefined | null][]) {
  return entries.filter((entry): entry is [string, string] => Boolean(entry[1]))
}

function homepageHref(homepage: string | undefined | null) {
  if (!homepage) return undefined
  const value = homepage.trim()
  if (/^[a-z][a-z0-9+.-]*:/i.test(value) && !/^https?:\/\//i.test(value)) return undefined
  try {
    return new URL(/^https?:\/\//i.test(value) ? value : `https://${value}`).href
  } catch {
    return undefined
  }
}

/**
 * 상세 정보는 기본 정보 / 이용 안내 / 시설 / 교통 / 참고사항으로 묶는다.
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
  const access = detail?.access
  const station = access?.nearestStation
  const detailFacilities = detail?.facilities
  const facilitySummary = detailFacilities
    ? joinUnique([
        detailFacilities.facilityType,
        detailFacilities.hasOutdoor && '노천탕',
        detailFacilities.hasLodging && '숙박 가능',
      ])
    : facilities?.length
      ? facilities.join(' · ')
      : undefined
  const annualVisitors =
    detail?.annualVisitors !== undefined && detail.annualVisitors !== null
      ? `연 ${detail.annualVisitors.toLocaleString('ko-KR')}명`
      : undefined
  const registeredLabel =
    detail?.isRegistered === true
      ? '행안부 등록 온천'
      : detail?.isRegistered === false
        ? '행안부 미등록'
        : undefined

  const website = homepageHref(homepage)
  const basic: [string, ReactNode][] = rowsOf([
    ['주소', address],
    ['등록', registeredLabel],
    ['방문객', annualVisitors],
    ['운영시간', openingHours],
    ['전화번호', phone],
    ['홈페이지', homepage],
  ]).map(([label, value]) => [
    label,
    label === '홈페이지' && website ? (
      <a
        href={website}
        target="_blank"
        rel="noopener noreferrer"
        className="underline decoration-border-default underline-offset-4 hover:decoration-text-primary focus-visible:outline focus-visible:outline-1"
        aria-label="홈페이지 보기 (새 탭)"
      >
        홈페이지 보기 <span aria-hidden="true">↗</span>
      </a>
    ) : (
      value
    ),
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
  ])

  const facilityRows: [string, ReactNode][] = rowsOf([['편의시설', facilitySummary]])
  if (access?.accessLevelLabel) {
    facilityRows.push([
      '접근성',
      <AccessValue key="access" label={access.accessLevelLabel} stationName={station?.name} />,
    ])
  }

  // 거점역 유무와 접근성 등급은 별개다 — 거점역이 없어도 '자차 필수'는 알려줄 값이다.
  const accessRows = rowsOf([
    ['거점역', station?.name],
    ['가는 법', station?.stationToPlaceDesc],
  ])

  if (
    basic.length === 0 &&
    usage.length === 0 &&
    facilityRows.length === 0 &&
    accessRows.length === 0 &&
    !notice
  ) {
    return <p className="text-text-secondary text-[13px] leading-[1.6]">등록된 정보가 없습니다.</p>
  }

  return (
    <div className="space-y-9">
      <Section title="기본 정보" rows={basic} />
      <Section title="이용 안내" rows={usage} />
      <Section title="시설" rows={facilityRows} />
      {/* 접근성은 시설 그룹에, 거점역→온천 경로는 교통 그룹에 표시한다. */}
      <Section title="교통" rows={accessRows} />
      {notice && (
        <section>
          <h3 className="text-text-primary text-[15px] leading-6 font-semibold">참고사항</h3>
          <p className="text-text-secondary mt-4 max-w-prose text-[13px] leading-7 break-keep whitespace-pre-line [overflow-wrap:anywhere]">
            {notice}
          </p>
        </section>
      )}
    </div>
  )
}
