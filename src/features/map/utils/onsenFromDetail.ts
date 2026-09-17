import type { Onsen } from '@/types/onsen'
import type { OnsenDetail } from '@/types/onsenDetail'

/** 미리보기에 없는 지도 마커도 기존 상세·리뷰 컴포넌트에 같은 모델로 전달한다. */
export function onsenFromDetail(detail: OnsenDetail): Onsen {
  const tags = [
    detail.facilities?.facilityType,
    detail.facilities?.hasOutdoor ? '노천탕' : undefined,
  ].filter((tag): tag is string => Boolean(tag))

  return {
    id: detail.onsenId,
    name: detail.name,
    lat: detail.lat,
    lng: detail.lng,
    address: detail.address ?? [detail.sido, detail.sigungu].filter(Boolean).join(' '),
    imageUrl: detail.images?.[0],
    rating: detail.reviewSummary?.avgRating ?? undefined,
    reviewCount: detail.reviewSummary?.count ?? 0,
    tags,
    waterTempC: detail.water.temp ?? undefined,
    waterQuality: detail.water.type ?? undefined,
    mainComponent: detail.water.component ?? undefined,
    ph: detail.water.ph ?? undefined,
    benefits: detail.water.benefit ?? undefined,
    description: detail.regionComment ?? undefined,
    openingHours: detail.hours ?? undefined,
    closedDays: detail.holiday ?? undefined,
    parking: detail.parkingInfo ?? undefined,
    admissionFee: detail.priceMin ?? undefined,
    phone: detail.phone ?? undefined,
    homepage: detail.homepageUrl ?? undefined,
    notice: detail.notes ?? undefined,
  }
}
