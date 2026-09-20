/**
 * 지도 데이터 출처.
 *
 * 경계 도형 두 벌 모두 원 출처가 통계지리정보서비스(SGIS)이고 공공누리
 * 제1유형이라 출처 표시가 **의무**다. vuski/admdongkor는 CC BY 4.0이라
 * 저장소 이름까지 밝히는 편이 낫다.
 *
 * 코드 주석만으로는 안 된다 — 이용자가 볼 수 있는 자리에 있어야 한다.
 * 공용 푸터가 생기면 거기로 옮기는 게 맞다. 지금은 지도를 실제로 쓰는
 * 화면에 붙여 둔다.
 *
 * 눈에 띄지 않게 두되 지우지는 말 것. 찾으면 보이는 정도가 목표다.
 */
export default function MapDataCredit() {
  return (
    <p className="text-text-secondary/60 text-[11px] leading-[1.6]">
      지도 데이터:{' '}
      <a
        href="https://sgis.kostat.go.kr"
        target="_blank"
        rel="noreferrer"
        className="underline underline-offset-2"
      >
        통계청 SGIS
      </a>{' '}
      (공공누리 제1유형) ·{' '}
      <a
        href="https://github.com/vuski/admdongkor"
        target="_blank"
        rel="noreferrer"
        className="underline underline-offset-2"
      >
        vuski/admdongkor
      </a>{' '}
      (CC BY 4.0)
    </p>
  )
}
