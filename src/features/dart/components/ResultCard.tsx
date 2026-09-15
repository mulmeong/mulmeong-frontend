import { useState } from 'react'

import SpecRow from '@/features/dart/components/SpecRow'
import TagChip from '@/features/dart/components/TagChip'
import { GROUP_LABEL } from '@/features/dart/components/ChipGroup'
import { cn } from '@/lib/cn'

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
  /** 출발지에서 걸리는 시간. 조건에 따라 달라져 온천 데이터와 별개로 받는다. */
  travelTime?: string
  onClose: () => void
  onRethrow: () => void
  onShowOnMap: () => void
  onSave: () => void
}

/** STATE 2 — 던진 뒤 결과 온천 카드. */
export default function ResultCard({
  onsen,
  travelTime,
  onClose,
  onRethrow,
  onShowOnMap,
  onSave,
}: ResultCardProps) {
  const [tab, setTab] = useState<ResultTab>('한눈에')

  const { name, address, imageUrl, rating, reviewCount, description, features } = onsen

  const meta = [address, travelTime, ...onsen.tags].filter(Boolean).join(' · ')

  return (
    <div className="flex h-full flex-col">
      <div className="relative h-[250px] flex-none border-b border-[#E2E5E4] bg-[#F0F2F1]">
        {imageUrl ? (
          <img src={imageUrl} alt="" className="size-full object-cover" />
        ) : (
          <div className="grid size-full place-items-center text-[12px] text-[#A9B1AF]">
            결과 온천 사진
          </div>
        )}

        {/* 흰 글씨 가독성 확보용. 시안: 180deg, 45%부터 어두워진다. */}
        <div className="pointer-events-none absolute inset-0 flex flex-col justify-end gap-1.5 bg-[linear-gradient(180deg,rgba(14,21,19,0)_45%,rgba(14,21,19,0.78))] p-6">
          <span className="text-[11px] font-bold tracking-[0.2em] text-white/80">온천 카드</span>
          <span className="text-[34px] font-bold tracking-[-0.05em] text-white">{name}</span>
        </div>

        <button
          type="button"
          onClick={onClose}
          aria-label="결과 닫기"
          className="absolute top-3.5 right-3.5 grid size-7 place-items-center bg-white text-[13px] text-[#0E1513] outline-none focus-visible:underline"
        >
          ✕
        </button>
      </div>

      <div className="flex flex-none flex-col gap-1.5 px-[30px] pt-[22px]">
        <span className="text-[12px] text-[#8A9491]">{meta}</span>
        {description && (
          <p className="text-[13.5px] leading-[1.8] text-[#2C3331]">{description}</p>
        )}
      </div>

      <div role="tablist" className="mt-[18px] flex flex-none border-y border-[#E2E5E4]">
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

      <div className="scrollbar-thin min-h-0 flex-1 overflow-y-auto overscroll-contain">
        {tab === '한눈에' ? (
          <Summary onsen={onsen} rating={rating} reviewCount={reviewCount} features={features} />
        ) : (
          // 리뷰는 REV-*, 주변은 PAM-04, 정보는 상세 스펙 — 각 기능이 붙어야 채울 수 있다.
          <p className="px-[30px] py-5 text-[13px] leading-[1.6] text-[#8A9491]">
            {tab} 정보는 준비 중입니다.
          </p>
        )}
      </div>

      <div className="flex flex-none gap-2 border-t border-[#E2E5E4] px-[30px] pt-4 pb-[22px]">
        {/* TODO: 찜 API(PAM-07)는 아직 없다. 지금은 완료 모달만 띄운다. */}
        <button
          type="button"
          onClick={onSave}
          className="flex-1 bg-[#0E1513] px-4 py-3.5 text-[13.5px] font-bold text-white"
        >
          찜하기
        </button>
        <button
          type="button"
          onClick={onRethrow}
          className="shrink-0 border border-[#D8DCDB] px-4 py-3.5 text-[13.5px] font-normal text-[#0E1513]"
        >
          다시 던지기
        </button>
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

/** '한눈에' 탭 — 수질 표 / 온천 특징 / 운영 표. */
function Summary({
  onsen,
  rating,
  reviewCount,
  features,
}: {
  onsen: Onsen
  rating?: number
  reviewCount: number
  features?: string[]
}) {
  const { waterTempC, waterQuality, ph, phLabel, openingHours, feeNote, admissionFee, parking } =
    onsen

  const fee =
    feeNote ??
    (admissionFee !== undefined ? `성인 ${admissionFee.toLocaleString('ko-KR')}원` : undefined)

  return (
    <div className="flex flex-col gap-5 px-[30px] pt-5 pb-6">
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

      <div className="flex flex-col border-t border-[#E2E5E4]">
        {openingHours && <SpecRow label="운영시간" value={openingHours} size="sm" />}
        {fee && <SpecRow label="이용요금" value={fee} size="sm" />}
        {parking && <SpecRow label="주차" value={parking} size="sm" divider={false} />}
      </div>
    </div>
  )
}
