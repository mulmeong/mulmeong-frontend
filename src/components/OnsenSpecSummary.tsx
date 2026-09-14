import type { Onsen } from '@/types/onsen'

/**
 * PAM-01 스펙 뱃지(수온·수질·접근성) + 효능 한 줄.
 * MAP-02 상세패널 '한눈에' 탭과 DART-04 다트 결과가 같이 쓴다.
 */
export default function OnsenSpecSummary({ onsen }: { onsen: Onsen }) {
  const { waterTempC, waterQuality, benefits, admissionFee, transitAccessible, tags } = onsen

  const badges = [
    waterTempC !== undefined ? `${waterTempC}℃` : undefined,
    waterQuality,
    transitAccessible === undefined ? undefined : transitAccessible ? '뚜벅이 가능' : '자차 권장',
    admissionFee !== undefined ? `${admissionFee.toLocaleString('ko-KR')}원` : undefined,
  ].filter((badge): badge is string => Boolean(badge))

  if (badges.length === 0 && !benefits && tags.length === 0) {
    return <p className="text-text-secondary text-[13px] leading-[1.6]">등록된 정보가 없습니다.</p>
  }

  return (
    <div>
      {badges.length > 0 && (
        <ul className="flex flex-wrap gap-1.5">
          {badges.map((badge) => (
            <li
              key={badge}
              className="border-border-default text-text-primary rounded-full border px-2.5 py-1 text-[12px]"
            >
              {badge}
            </li>
          ))}
        </ul>
      )}

      {benefits && <p className="text-text-primary mt-3 text-[13px] leading-[1.6]">{benefits}</p>}

      {tags.length > 0 && (
        <p className="text-text-secondary mt-3 text-[12px]">{tags.map((t) => `#${t}`).join(' ')}</p>
      )}
    </div>
  )
}
