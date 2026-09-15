import type { Onsen } from '@/types/onsen'

/** 시안 데이터행 — 라벨 64px + 값, 행 높이 33px. */
function DataRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-baseline py-[9px]">
      <span className="text-text-secondary w-16 shrink-0 text-[12px]">{label}</span>
      <span className="text-text-primary min-w-0 flex-1 text-[14px]">{value}</span>
    </div>
  )
}

function rowsOf(entries: [string, string | undefined][]) {
  return entries.filter((entry): entry is [string, string] => Boolean(entry[1]))
}

/**
 * 시안 '상세패널 - 한눈에'(1:581) 탭 내용.
 * MAP-02 상세패널과 DART-04 다트 결과가 같이 쓴다.
 */
export default function OnsenSpecSummary({ onsen }: { onsen: Onsen }) {
  const {
    waterTempC,
    waterQuality,
    mainComponent,
    ph,
    phLabel,
    description,
    features,
    openingHours,
    feeNote,
    admissionFee,
    closedDays,
    parking,
  } = onsen

  // 온천 핵심 정보
  const specRows = rowsOf([
    ['수온', waterTempC !== undefined ? `${waterTempC}℃` : undefined],
    ['수질 유형', waterQuality],
    ['주요 성분', mainComponent],
    ['pH', ph !== undefined ? (phLabel ? `${ph} (${phLabel})` : `${ph}`) : undefined],
  ])

  // 방문 핵심 정보
  const visitRows = rowsOf([
    ['운영시간', openingHours],
    [
      '이용요금',
      feeNote ??
        (admissionFee !== undefined ? `성인 ${admissionFee.toLocaleString('ko-KR')}원` : undefined),
    ],
    ['휴무', closedDays],
    ['주차', parking],
  ])

  const isEmpty =
    specRows.length === 0 && visitRows.length === 0 && !description && !features?.length

  if (isEmpty) {
    return <p className="text-text-secondary text-[13px] leading-[1.6]">등록된 정보가 없습니다.</p>
  }

  return (
    <div>
      {specRows.length > 0 && (
        <div className="divide-border-default divide-y">
          {specRows.map(([label, value]) => (
            <DataRow key={label} label={label} value={value} />
          ))}
        </div>
      )}

      {description && (
        <p className="text-text-primary mt-[22px] text-[14px] leading-[1.6]">{description}</p>
      )}

      {features && features.length > 0 && (
        <div className="mt-[22px]">
          <h3 className="text-text-secondary text-[12px]">온천 특징</h3>
          <p className="text-text-primary mt-[6px] text-[14px] leading-[1.5]">
            {features.join(' · ')}
          </p>
        </div>
      )}

      {visitRows.length > 0 && (
        <div className="divide-border-default mt-[22px] divide-y border-t-0">
          {visitRows.map(([label, value]) => (
            <DataRow key={label} label={label} value={value} />
          ))}
        </div>
      )}
    </div>
  )
}
