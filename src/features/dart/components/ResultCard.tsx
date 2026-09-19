import { useState } from 'react'
import FavoriteButton from '@/features/favorites/FavoriteButton'

import SpecRow from '@/features/dart/components/SpecRow'
import TagChip from '@/features/dart/components/TagChip'
import { GROUP_LABEL } from '@/features/dart/components/ChipGroup'
import OnsenReviews from '@/features/dart/components/OnsenReviews'
import { formatMinutes } from '@/features/dart/utils/resultOnsen'
import NearbyList from '@/features/map/components/NearbyList'
import { DEFAULT_ONSEN_IMAGE } from '@/constants/images'
import { cn } from '@/lib/cn'

import type { DartTravel } from '@/types/dart'
import type { Onsen } from '@/types/onsen'

/**
 * 탭 구성과 role/aria 처리는 features/map/components/OnsenDetailPanel.tsx에서 가져왔다.
 * 공통 컴포넌트로 빼지 않고 복사한 이유는 그쪽이 다른 담당자 코드라
 * 지금 건드리면 충돌이 나기 때문이다. 스타일만 dart-5a 시안 값으로 바꿨다.
 * (나중에 협의해서 합칠 것)
 */
const TABS = ['한눈에', '리뷰', '주변', '정보'] as const

type ResultTab = (typeof TABS)[number]

type ResultCardProps = {
  onsen: Onsen
  /**
   * 출발지에서 여기까지. 조건에 따라 달라지는 값이라 온천 데이터가 아니라
   * 다트 응답에서 온다. 공유받은 화면에는 예상 시간만 있다.
   */
  dart: DartTravel
  /** 후보가 모자라 서버가 시간 조건을 늘렸을 때의 안내. */
  relaxMessage?: string | null
  /** 실제 추첨에 쓰인 후보 수. 공유 응답에는 없다. */
  candidateCount?: number
  /** 공유 링크. 없으면 공유 버튼을 감춘다. */
  shareUrl?: string | null
  /** 다시 던지는 중. 버튼을 잠근다. */
  throwing?: boolean
  /** 다시 던지기가 실패한 사유. 결과는 앞서 나온 것이 그대로 남아 있다. */
  throwError?: string
  /** 없으면 닫기 버튼을 감춘다 — 공유 화면은 닫을 자리가 없다. */
  onClose?: () => void
  /** 없으면 다시 던지기를 감춘다 — 공유받은 사람은 다시 던질 수 없다. */
  onRethrow?: () => void
  onShowOnMap: () => void
  onSave?: () => void
}

/** STATE 2 — 던진 뒤 결과 온천 카드. */
export default function ResultCard({
  onsen,
  dart,
  relaxMessage,
  candidateCount,
  shareUrl,
  throwing,
  throwError,
  onClose,
  onRethrow,
  onShowOnMap,
  onSave,
}: ResultCardProps) {
  const [tab, setTab] = useState<ResultTab>('한눈에')
  const [copied, setCopied] = useState(false)

  const copyShare = async () => {
    if (!shareUrl) return
    try {
      await navigator.clipboard.writeText(shareUrl)
      setCopied(true)
      // 되돌리는 건 렌더 밖에서 일어난다 — 눌렀다는 표시만 잠깐 남긴다.
      // 길이는 index.css의 --animate-toast와 같아야 한다. 한쪽만 바꾸면
      // 중간에 잘리거나 사라진 뒤에도 자리를 차지한다.
      setTimeout(() => setCopied(false), 3000)
    } catch {
      // 클립보드가 막힌 브라우저(비 HTTPS·권한 거부)에서는 직접 고를 수 있게 띄운다.
      window.prompt('링크를 복사하세요', shareUrl)
    }
  }

  const { name, address, imageUrl, rating, reviewCount, description, features } = onsen

  const meta = [address, `예상 ${formatMinutes(dart.estimatedMinutes)}`, ...onsen.tags]
    .filter(Boolean)
    .join(' · ')

  return (
    <div className="flex h-full flex-col">
      {/*
        사진부터 탭 내용까지 한 덩어리로 스크롤한다. 탭 안쪽만 스크롤하면
        보이는 칸이 250px짜리 사진에 눌려 너무 좁아진다.
      */}
      <div className="scrollbar-thin min-h-0 flex-1 overflow-y-auto overscroll-contain">
        <div className="relative h-[250px] border-b border-[#E2E5E4] bg-[#F0F2F1]">
          <img
            src={imageUrl || DEFAULT_ONSEN_IMAGE}
            alt=""
            onError={(event) => {
              event.currentTarget.onerror = null
              event.currentTarget.src = DEFAULT_ONSEN_IMAGE
            }}
            className="size-full object-cover"
          />

          {/* 흰 글씨 가독성 확보용. 시안: 180deg, 45%부터 어두워진다. */}
          <div className="pointer-events-none absolute inset-0 flex flex-col justify-end gap-1.5 bg-[linear-gradient(180deg,rgba(14,21,19,0)_45%,rgba(14,21,19,0.78))] p-6">
            <span className="text-[11px] font-bold tracking-[0.2em] text-white/80">온천 카드</span>
            <span className="text-[34px] font-bold tracking-[-0.05em] text-white">{name}</span>
          </div>

          {/*
            공유는 온천이 아니라 이 추첨 결과를 넘기는 거라 푸터가 아니라 히어로에
            둔다. 밝은 사진 위에서는 흰 글자만으로 안 보여 그림자로 받쳐준다.
          */}
          <div className="absolute top-3.5 right-3.5 flex items-center gap-1">
            {/* 길이는 띄워두는 시간과 맞물려 있다 — 위 copyShare의 setTimeout 참고. */}
            {copied && (
              <span
                role="status"
                className="animate-toast rounded-lg bg-[#0E1513]/90 px-2.5 py-1.5 text-[11.5px] font-normal whitespace-nowrap text-white motion-reduce:animate-none"
              >
                링크 복사됨
              </span>
            )}
            {shareUrl && (
              <button
                type="button"
                onClick={() => void copyShare()}
                aria-label="이 결과 링크 복사"
                className="grid size-7 place-items-center text-white outline-none [filter:drop-shadow(0_1px_4px_rgba(14,21,19,0.6))] focus-visible:underline"
              >
                <svg
                  aria-hidden="true"
                  viewBox="0 0 24 24"
                  className="size-[18px]"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M10 13a5 5 0 0 0 7 0l3-3a5 5 0 0 0-7-7l-1 1" />
                  <path d="M14 11a5 5 0 0 0-7 0l-3 3a5 5 0 0 0 7 7l1-1" />
                </svg>
              </button>
            )}
            {onClose && (
              <button
                type="button"
                onClick={onClose}
                aria-label="결과 닫기"
                className="grid size-7 place-items-center text-[15px] font-bold text-white outline-none [text-shadow:0_1px_4px_rgba(14,21,19,0.6)] focus-visible:underline"
              >
                ✕
              </button>
            )}
          </div>
        </div>

        <div className="flex flex-col gap-1.5 px-[30px] pt-[22px]">
          <span className="text-[12px] text-[#8A9491]">{meta}</span>
          {description && (
            <p className="text-[13.5px] leading-[1.8] text-[#2C3331]">{description}</p>
          )}

          {/* 조건을 늘려 뽑았으면 그 사실을 알린다 — 조건대로 나온 결과로 오해하면 안 된다. */}
          {relaxMessage && (
            <p className="mt-1 bg-[#F2F4F3] px-3 py-2 text-[12px] leading-[1.6] text-[#2C3331]">
              {relaxMessage}
            </p>
          )}
        </div>

        {/*
          같이 스크롤되면 탭이 위로 사라져 다른 탭으로 못 넘어간다. 스크롤 칸의
          맨 위에 붙여 둔다 — 안쪽에 따로 스크롤이 생기는 건 아니다.
        */}
        <div
          role="tablist"
          className="sticky top-0 z-10 mt-[18px] flex border-y border-[#E2E5E4] bg-white"
        >
          {TABS.map((item) => (
            <button
              key={item}
              type="button"
              role="tab"
              aria-selected={tab === item}
              onClick={() => setTab(item)}
              className={cn(
                'relative flex-1 py-[13px] text-[13px] outline-none',
                tab === item
                  ? 'font-bold text-[#0E1513] after:absolute after:inset-x-0 after:-bottom-px after:h-[2px] after:bg-[#0E1513] after:content-[""]'
                  : 'font-normal text-[#8A9491]',
              )}
            >
              {item}
            </button>
          ))}
        </div>

        {tab === '한눈에' ? (
          <Summary
            onsen={onsen}
            dart={dart}
            candidateCount={candidateCount}
            rating={rating}
            reviewCount={reviewCount}
            features={features}
          />
        ) : tab === '리뷰' ? (
          <OnsenReviews onsenId={onsen.id} />
        ) : tab === '정보' ? (
          <Info onsen={onsen} />
        ) : (
          /*
            '주변' — 지도 화면(OnsenDetailPanel)의 주변 여행지와 같은 목록을 쓴다.
            찜하기가 외부 장소(externalId·source)를 그대로 501에 넘기는 규칙까지
            들어 있어서, 베껴 두면 고칠 곳이 두 군데가 된다.

            색이 프로젝트 토큰이라 이 카드의 시안 색과 미묘하게 다르다
            (#1C1B18 대 #0E1513). 눈으로는 구분되지 않아 그대로 뒀다.
          */
          <div className="px-[30px] py-5">
            <NearbyList onsenId={onsen.id} active />
          </div>
        )}
      </div>

      {throwError && (
        <p
          role="alert"
          className="flex-none border-t border-[#E2E5E4] px-[30px] pt-4 text-[12px] leading-[1.6] text-[#B4443A]"
        >
          {throwError}
        </p>
      )}

      <div
        className={cn(
          'flex flex-none gap-2 px-[30px] pt-4 pb-[22px]',
          // 사유를 띄운 경우에는 그 문단이 이미 구분선을 갖고 있다.
          !throwError && 'border-t border-[#E2E5E4]',
        )}
      >
        <FavoriteButton
          target={{ placeId: onsen.id }}
          name={name}
          label="찜하기"
          onSaved={onSave}
          // 옆 두 버튼과 모서리를 맞춘다 — 기본값 rounded-sm를 눌러야 한다.
          className="h-auto w-auto flex-1 rounded-none bg-[#0E1513] px-4 py-3.5 text-[13.5px] font-bold text-white hover:bg-[#2C3331]"
        />
        {/* 공유받은 사람은 다시 던질 수 없다 (DART-06). */}
        {onRethrow && (
          <button
            type="button"
            onClick={onRethrow}
            disabled={throwing}
            className="shrink-0 border border-[#D8DCDB] px-4 py-3.5 text-[13.5px] font-normal text-[#0E1513] disabled:opacity-40"
          >
            {throwing ? '던지는 중…' : '다시 던지기'}
          </button>
        )}
        <button
          type="button"
          onClick={onShowOnMap}
          className="shrink-0 border border-[#D8DCDB] px-4 py-3.5 text-[13.5px] font-normal text-[#0E1513]"
        >
          지도에서 보기
        </button>
      </div>
    </div>
  )
}

/** 성인 12,000원 — 상세 문구가 있으면 그걸 쓴다. */
function feeText(onsen: Onsen): string | undefined {
  if (onsen.feeNote) return onsen.feeNote
  if (onsen.admissionFee === undefined) return undefined
  return `성인 ${onsen.admissionFee.toLocaleString('ko-KR')}원`
}

/** https://spa.example.com/info -> spa.example.com (주소를 통째로 쓰면 줄이 넘친다) */
function hostOf(url: string): string {
  try {
    return new URL(url).host
  } catch {
    return url
  }
}

/**
 * '정보' 탭 — 온천 상세(PAM-03)의 이용 안내.
 *
 * 값이 없는 항목은 줄째로 숨긴다(명세 비고). 수온·수질은 '한눈에'가 맡고
 * 여기는 찾아가서 이용하는 데 필요한 것만 둔다.
 */
function Info({ onsen }: { onsen: Onsen }) {
  const fee = feeText(onsen)

  const rows = [
    { label: '주소', value: onsen.address },
    {
      label: '전화',
      value: onsen.phone && (
        <a href={`tel:${onsen.phone}`} className="underline underline-offset-[3px]">
          {onsen.phone}
        </a>
      ),
    },
    { label: '이용요금', value: fee },
    { label: '운영시간', value: onsen.openingHours },
    { label: '휴무일', value: onsen.closedDays },
    { label: '주차', value: onsen.parking },
    {
      label: '홈페이지',
      value: onsen.homepage && (
        <a
          href={onsen.homepage}
          target="_blank"
          rel="noreferrer"
          className="underline underline-offset-[3px]"
        >
          {hostOf(onsen.homepage)}
        </a>
      ),
    },
  ].filter((row) => Boolean(row.value))

  if (rows.length === 0) {
    return (
      <p className="px-[30px] py-5 text-[13px] leading-[1.6] text-[#8A9491]">
        이용 정보가 준비되지 않았어요.
      </p>
    )
  }

  return (
    <div className="flex flex-col px-[30px] pt-5 pb-6">
      {rows.map((row, index) => (
        <SpecRow
          key={row.label}
          label={row.label}
          value={row.value}
          size="sm"
          divider={index < rows.length - 1}
        />
      ))}
    </div>
  )
}

/** '한눈에' 탭 — 가는 길 / 수질 표 / 온천 특징. */
function Summary({
  onsen,
  dart,
  candidateCount,
  rating,
  reviewCount,
  features,
}: {
  onsen: Onsen
  dart: DartTravel
  candidateCount?: number
  rating?: number
  reviewCount: number
  features?: string[]
}) {
  const { waterTempC, waterQuality, ph, phLabel } = onsen

  return (
    <div className="flex flex-col gap-5 px-[30px] pt-5 pb-6">
      {/* 출발지에서 여기까지. 조건에 따라 달라지는 값이라 온천 스펙과 나눠 놓는다. */}
      <div className="flex flex-col gap-[9px]">
        <span className={GROUP_LABEL}>가는 길</span>
        {/*
          공유받은 화면에는 예상 시간만 온다 — 나머지 줄은 값이 있을 때만 그린다.
          마지막으로 그려진 줄에만 아래 선을 빼려고 divider를 뒤에서부터 따진다.
        */}
        <div className="flex flex-col">
          {dart.distanceKm !== undefined && (
            <SpecRow label="거리" value={`${dart.distanceKm.toFixed(1)}km`} size="sm" />
          )}
          <SpecRow
            label="예상 소요"
            value={formatMinutes(dart.estimatedMinutes)}
            size="sm"
            divider={Boolean(dart.accessLabel ?? dart.stationName)}
          />
          {dart.accessLabel && (
            <SpecRow
              label="접근성"
              value={dart.accessLabel}
              size="sm"
              divider={Boolean(dart.stationName)}
            />
          )}
          {dart.stationName && (
            <SpecRow
              label="거점역"
              size="sm"
              divider={false}
              value={
                <>
                  {dart.stationName}
                  {dart.stationToPlace && (
                    <span className="font-normal text-[#5D6764]"> · {dart.stationToPlace}</span>
                  )}
                </>
              }
            />
          )}
        </div>
        {candidateCount !== undefined && (
          <p className="text-[11.5px] text-[#8A9491]">
            조건에 맞는 {candidateCount}곳 중에서 뽑았어요
          </p>
        )}
      </div>

      <div className="flex flex-col">
        {waterTempC !== undefined && <SpecRow label="수온" value={`${waterTempC}℃`} />}
        {waterQuality && <SpecRow label="수질 유형" value={waterQuality} />}
        {rating !== undefined && (
          <SpecRow label="평점" value={`★ ${rating.toFixed(1)} (${reviewCount})`} />
        )}
        {ph !== undefined && (
          <SpecRow
            label="pH"
            divider={false}
            value={
              <>
                {ph}
                {phLabel && <span className="font-normal text-[#5D6764]"> ({phLabel})</span>}
              </>
            }
          />
        )}
      </div>

      {/*
        운영시간·이용요금·주차는 '정보' 탭으로 옮겼다 — 거기서 주소·전화·휴무일과
        함께 봐야 찾아갈 때 쓸모가 있고, 양쪽에 두면 같은 값을 두 번 읽게 된다.
      */}
      {features && features.length > 0 && (
        <div className="flex flex-col gap-[9px]">
          <span className={GROUP_LABEL}>온천 특징</span>
          <div className="flex flex-wrap gap-1.5">
            {features.map((feature) => (
              <TagChip key={feature} label={feature} />
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
