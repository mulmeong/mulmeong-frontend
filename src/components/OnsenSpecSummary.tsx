import { normalizeWaterCode, waterCodeLabel, waterPhLabel } from '@/lib/onsenWaterLabels'

import type { Onsen } from '@/types/onsen'
import type { OnsenDetail } from '@/types/onsenDetail'

/** 이용 안내는 값이 여러 줄이어도 같은 시작선에 맞춘다. */
function DataRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="grid grid-cols-[64px_minmax(0,1fr)] items-start gap-3">
      <dt className="text-text-secondary text-[12px] leading-6">{label}</dt>
      <dd className="text-text-primary text-[13px] leading-6 whitespace-pre-line [overflow-wrap:anywhere]">
        {value}
      </dd>
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
  const phDescription =
    ph !== undefined && ph !== null
      ? waterPhLabel(
          ph,
          detail?.water.ph != null && detail.water.ph !== onsen.ph ? undefined : phLabel,
        )
      : undefined
  const sameComposition = Boolean(
    waterQuality &&
    mainComponent &&
    normalizeWaterCode(waterQuality) === normalizeWaterCode(mainComponent),
  )
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
    [sameComposition ? '수질 · 주요 성분' : '수질', waterQuality],
    ['주요 성분', sameComposition ? undefined : mainComponent],
    ['pH', ph !== undefined && ph !== null ? `${ph}` : undefined],
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
    <div className="space-y-8">
      {specRows.length > 0 && (
        <dl aria-label="온천 핵심 정보" className="grid grid-cols-2 gap-x-5 gap-y-6">
          {specRows
            .filter(([label]) => label !== '효능')
            .map(([label, value]) => (
              <div key={label} className="flex min-w-0 flex-col gap-1.5">
                <dt className="text-text-secondary text-[11px] leading-5">{label}</dt>
                <dd className="text-text-primary text-[18px] leading-6 font-medium [overflow-wrap:anywhere]">
                  {value === '정보 준비 중' ? (
                    <span className="text-text-secondary text-[13px] font-normal tracking-normal">
                      {value}
                    </span>
                  ) : (
                    value
                  )}
                  {((label === '수온' && value !== '정보 준비 중') ||
                    label === 'pH' ||
                    waterCodeLabel(value)) && (
                    <span className="text-text-secondary mt-1.5 block text-[12px] leading-5 font-normal break-keep">
                      {label === '수온'
                        ? '온천수의 온도'
                        : label === 'pH'
                          ? phDescription
                          : `${waterCodeLabel(value)}${label === '수질' ? ' 계열' : ''}`}
                    </span>
                  )}
                </dd>
              </div>
            ))}
        </dl>
      )}

      {description && (
        <p className="text-text-primary text-[14px] leading-[1.9] break-keep whitespace-pre-line [overflow-wrap:anywhere]">
          {description}
        </p>
      )}

      {features && features.length > 0 && (
        <section>
          <h3 className="text-text-primary text-[15px] leading-6 font-semibold">온천 특징</h3>
          <ul className="mt-3 flex flex-wrap gap-2">
            {features.map((feature, index) => (
              <li key={`${feature}-${index}`}>
                <Badge
                  type="category"
                  className="border-border-default/60 rounded-[4px] px-2 py-1 text-[11px] leading-4"
                >
                  {feature}
                </Badge>
              </li>
            ))}
          </ul>
        </section>
      )}

      {benefits && (
        <section>
          <h3 className="text-text-primary text-[15px] leading-6 font-semibold">효능</h3>
          <p className="text-text-primary mt-2 text-[13px] leading-[1.85] whitespace-pre-line [overflow-wrap:anywhere]">
            {benefits}
          </p>
        </section>
      )}

      {visitRows.length > 0 && (
        <section>
          <h3 className="text-text-primary text-[15px] leading-6 font-semibold">이용 안내</h3>
          <dl className="mt-4 space-y-3">
            {visitRows.map(([label, value]) => (
              <DataRow key={label} label={label} value={value} />
            ))}
          </dl>
        </section>
      )}
    </div>
  )
}
import { Badge } from '@/components/ui'
