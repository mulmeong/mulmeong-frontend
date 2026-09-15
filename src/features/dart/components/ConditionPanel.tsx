import ChipGroup, { GROUP_LABEL } from '@/features/dart/components/ChipGroup'
import {
  DURATION_OPTIONS,
  SCHEDULE_OPTIONS,
  TRANSPORT_OPTIONS,
  type DartConditions,
} from '@/features/dart/constants'

type ConditionPanelProps = {
  conditions: DartConditions
  onChange: (next: DartConditions) => void
  /** 조건에 맞는 온천 수 */
  candidateCount: number
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
  candidateCount,
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
        {/* TODO: 출발지 선택 기능은 미정. 지금은 시안대로 고정 텍스트. */}
        <div className="flex flex-col gap-[9px]">
          <span className={GROUP_LABEL}>출발지</span>
          <p className="border-b border-[#0E1513] py-[7px] text-[16px] font-semibold text-[#0E1513]">
            {conditions.origin}
          </p>
        </div>

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
          options={SCHEDULE_OPTIONS}
          value={conditions.schedule}
          onChange={(id) => update('schedule', id)}
        />
      </div>

      <div className="flex flex-none flex-col gap-[11px] border-t border-[#E2E5E4] px-[30px] pt-4 pb-[22px]">
        <p className="text-[12px] text-[#8A9491]">조건에 맞는 온천 {candidateCount}곳</p>
        <button
          type="button"
          onClick={onThrow}
          disabled={candidateCount === 0}
          className="w-full bg-[#0E1513] px-5 py-[17px] text-[16px] font-bold tracking-[-0.02em] text-white disabled:cursor-not-allowed disabled:opacity-40"
        >
          다트 던지기
        </button>
      </div>
    </div>
  )
}
