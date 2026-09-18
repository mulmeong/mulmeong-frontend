import type { Onsen } from '@/types/onsen'
import type { OnsenDetail } from '@/types/onsenDetail'

/** 시안 데이터행 — 라벨 64px + 값, 행 높이 33px. */
function DataRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-baseline py-[9px]">
      <span className="text-text-secondary w-16 shrink-0 text-[12px]">{label}</span>
      <span className="text-text-primary min-w-0 flex-1 text-[14px]">{value}</span>
    </div>
  )
}

/** 상세 응답은 값이 없을 때 null로 오므로 undefined와 함께 걸러낸다. */
function rowsOf(entries: [string, string | undefined | null][]) {
  return entries.filter((entry): entry is [string, string] => Boolean(entry[1]))
}

/**
 * 시안 '상세패널 - 한눈에'(1:581) 탭 내용.
 * MAP-02 상세패널과 DART-04 다트 결과가 같이 쓴다.
 */
export default function OnsenSpecSummary({
  onsen,
  detail,
}: {
  onsen: Onsen
  /** PAM-03 상세. 다트(DART-04)는 목록 데이터만 있어 넘기지 않는다. */
  detail?: OnsenDetail
}) {
  const { phLabel, features, feeNote } = onsen

  // 상세가 오면 그 값이 우선이다 — 효능·수온은 상세에만 있는 경우가 있다.
  const waterTempC = detail?.water.temp ?? onsen.waterTempC
  const waterQuality = detail?.water.type ?? onsen.waterQuality
  const mainComponent = detail?.water.component ?? onsen.mainComponent
  const ph = detail?.water.ph ?? onsen.ph
  const benefits = detail?.water.benefit ?? onsen.benefits
  const description = detail?.regionComment ?? onsen.description
  const openingHours = detail?.hours ?? onsen.openingHours
  const closedDays = detail?.holiday ?? onsen.closedDays
  const parking = detail?.parkingInfo ?? onsen.parking
  const admissionFee = detail?.priceMin ?? onsen.admissionFee

  /** 수온이 없는 온천은 명세상 미매칭 7곳 — 레이아웃이 깨지지 않게 문구로 채운다. */
  const waterTempLabel =
    waterTempC !== undefined && waterTempC !== null ? `${waterTempC}℃` : '정보 준비 중'

  // 온천 핵심 정보
  const specRows = rowsOf([
    ['수온', waterTempLabel],
    ['수질 유형', waterQuality],
    ['주요 성분', mainComponent],
    [
      'pH',
      ph !== undefined && ph !== null ? (phLabel ? `${ph} (${phLabel})` : `${ph}`) : undefined,
    ],
    ['효능', benefits],
  ])

  // 방문 핵심 정보
  const visitRows = rowsOf([
    ['운영시간', openingHours],
    [
      '이용요금',
      feeNote ??
        (admissionFee !== undefined && admissionFee !== null
          ? `성인 ${admissionFee.toLocaleString('ko-KR')}원`
          : undefined),
    ],
    ['휴무', closedDays],
    ['주차', parking],
  ])

  // 수온 줄은 값이 없어도 '정보 준비 중'으로 항상 들어가므로 판정에서 뺀다.
  const hasSpec = specRows.some(([label]) => label !== '수온') || waterTempLabel !== '정보 준비 중'
  const isEmpty = !hasSpec && visitRows.length === 0 && !description && !features?.length

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
