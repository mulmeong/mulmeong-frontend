import { TOUR_API_CREDIT } from '@/constants/credits'

/**
 * 서비스 공통 푸터. 출처 표기(공공누리)를 담는 자리다.
 *
 * 주변 여행지·카테고리 장소가 한국관광공사 TourAPI에서 온다. 사용자가 확인할 수
 * 있으면 되므로 본문보다 눈에 띄지 않게 둔다.
 */
export default function Footer() {
  return (
    <footer className="border-border-default mt-16 border-t">
      <div className="text-text-secondary mx-auto flex max-w-5xl flex-wrap gap-x-4 gap-y-1 px-6 py-6 text-[11px] leading-[1.8]">
        <span>물멍</span>
        <span>장소 정보 · {TOUR_API_CREDIT}</span>
      </div>
    </footer>
  )
}
