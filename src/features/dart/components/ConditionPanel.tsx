import ChipGroup from '@/features/dart/components/ChipGroup'
import OriginField from '@/features/dart/components/OriginField'
import {
  DURATION_OPTIONS,
  STAY_OPTIONS,
  TRANSPORT_OPTIONS,
  type DartConditions,
} from '@/features/dart/constants'

import type { DartOrigin } from '@/types/dart'

type ConditionPanelProps = {
  conditions: DartConditions
  onChange: (next: DartConditions) => void
  /** 추천 출발지(DART-404). 아직 안 왔으면 빈 배열이다. */
  origins: DartOrigin[]
  origin: DartOrigin | null
  onOriginChange: (origin: DartOrigin) => void
  originsError?: string
  /** 던지는 중. 버튼을 잠근다. */
  throwing?: boolean
  /** 던지기가 실패한 사유. */
  throwError?: string
  onThrow: () => void
}

/**
 * STATE 1 — 던지기 전 조건 입력.
 *
 * 헤딩과 CTA는 고정이고 가운데 조건 목록만 스크롤된다.
 * 조건이 늘어나도 '다트 던지기' 버튼이 화면 밖으로 밀려나지 않게 하려는 배치다.
 */
export default function ConditionPanel({
  conditions,
  onChange,
  origins,
  origin,
  onOriginChange,
  originsError,
  throwing,
  throwError,
  onThrow,
}: ConditionPanelProps) {
  const update = <K extends keyof DartConditions>(key: K, value: DartConditions[K]) =>
    onChange({ ...conditions, [key]: value })

  return (
    <div className="flex h-full flex-col">
      <div className="flex-none border-b border-[#E2E5E4] px-[30px] pt-7 pb-[22px]">
        <h1 className="text-[34px] leading-[1.06] font-bold tracking-[-0.05em] text-[#0E1513]">
          <span className="block">어디로</span>
          <span className="block">갈지 모를 때</span>
        </h1>
        <p className="mt-[10px] text-[12.5px] leading-[1.7] text-[#8A9491]">
          조건을 정하고 다트를 던지면 조건에 맞는 온천 하나를 뽑습니다
        </p>
      </div>

      <div className="scrollbar-thin flex min-h-0 flex-1 flex-col gap-[22px] overflow-y-auto overscroll-contain px-[30px] py-[22px]">
        <OriginField
          recommended={origins}
          recommendedError={originsError}
          value={origin}
          onChange={onOriginChange}
        />

        <ChipGroup
          label="이동 수단"
          options={TRANSPORT_OPTIONS}
          value={conditions.transport}
          onChange={(id) => update('transport', id)}
        />
        <ChipGroup
          label="이동 시간"
          options={DURATION_OPTIONS}
          value={conditions.duration}
          onChange={(id) => update('duration', id)}
        />
        <ChipGroup
          label="일정"
          options={STAY_OPTIONS}
          value={conditions.stayType}
          onChange={(id) => update('stayType', id)}
        />
      </div>

      <div className="flex flex-none flex-col gap-[11px] border-t border-[#E2E5E4] px-[30px] pt-4 pb-[22px]">
        {/*
          던지기 전에는 후보 수를 알 수 없다 — candidateCount는 추첨을 돌려봐야
          나오는 값이라 결과 카드에서 보여준다.
        */}
        {throwError ? (
          <p role="alert" className="text-[12px] leading-[1.6] text-[#B4443A]">
            {throwError}
          </p>
        ) : (
          <p className="text-[12px] text-[#8A9491]">
            {origin ? `${origin.label}에서 출발` : '출발지를 골라주세요'}
          </p>
        )}
        <button
          type="button"
          onClick={onThrow}
          // 출발지가 없으면 보낼 좌표가 없다 — 목록이 오기 전이거나 못 받아온 상태다.
          disabled={origin === null || throwing}
          className="w-full bg-[#0E1513] px-5 py-[17px] text-[16px] font-bold tracking-[-0.02em] text-white disabled:opacity-40"
        >
          {throwing ? '던지는 중…' : '다트 던지기'}
        </button>
      </div>
    </div>
  )
}
