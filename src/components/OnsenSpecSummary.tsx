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
    <div className="space-y-7">
      {specRows.length > 0 && (
        <dl aria-label="온천 핵심 정보" className="grid grid-cols-2 gap-x-5 gap-y-6">
          {specRows
            .filter(([label]) => label !== '효능')
            .map(([label, value]) => (
              <div key={label} className="flex min-w-0 flex-col gap-1.5">
                <dt className="text-text-secondary order-2 text-[12px] leading-5">
                  {label === '수질 유형' ? '수질' : label}
                </dt>
                <dd className="text-text-primary order-1 text-[21px] leading-snug font-semibold tracking-tight [overflow-wrap:anywhere]">
                  {value === '정보 준비 중' ? (
                    <span className="text-text-secondary text-[13px] font-normal tracking-normal">
                      {value}
                    </span>
                  ) : label === 'pH' ? (
                    <>
                      {ph}
                      {phLabel && (
                        <span className="text-text-secondary mt-1 block text-[11px] font-normal tracking-normal">
                          {phLabel}
                        </span>
                      )}
                    </>
                  ) : (
                    value
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
          <h3 className="text-text-primary text-[13px] font-semibold">온천 특징</h3>
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
          <h3 className="text-text-primary text-[13px] font-semibold">효능</h3>
          <p className="text-text-primary mt-2 text-[13px] leading-[1.85] whitespace-pre-line [overflow-wrap:anywhere]">
            {benefits}
          </p>
        </section>
      )}

      {visitRows.length > 0 && (
        <section className="border-border-default/60 border-t pt-6">
          <h3 className="text-text-primary text-[13px] font-semibold">이용 안내</h3>
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
