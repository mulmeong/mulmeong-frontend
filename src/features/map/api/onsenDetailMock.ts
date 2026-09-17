import { MOCK_ONSENS } from '@/features/map/api/mapMock'

import type { AccessLevel, OnsenDetail } from '@/types/onsenDetail'

const MOCK_DELAY_MS = 250

/** 목록 목과 같은 표본에서 파생시킨다 — 두 화면이 서로 다른 온천을 보여주면 안 된다. */
const ACCESS_PRESETS: { level: AccessLevel; label: string }[] = [
  { level: 'WALKABLE', label: '뚜벅이 가능' },
  { level: 'CAR_RECOMMENDED', label: '자차 권장' },
  { level: 'CAR_REQUIRED', label: '자차 필수' },
]

const STATION_NAMES = ['충주역', '온양온천역', '동해역', '수안보터미널', '부전역']

/** 수온·수질이 없는 온천(명세상 미매칭 7곳)을 재현해 '정보 준비 중' 표시를 확인한다. */
const UNMATCHED_WATER_IDS = [4, 11]

/**
 * 거점역 유무는 접근성 등급과 별개다 — 등급은 판정 결과, 거점역은 팀이 조사했는지 여부다.
 * 자차 필수여도 거점역이 있을 수 있고, 뚜벅이 가능이어도 아직 조사 전일 수 있다.
 */
const NO_STATION_IDS = [2, 7, 11]

export function mockOnsenDetail(onsenId: number): Promise<OnsenDetail> {
  const onsen = MOCK_ONSENS.find((item) => item.id === onsenId)

  if (!onsen) {
    return Promise.reject(new Error('온천을 찾을 수 없습니다.'))
  }

  const [sido, sigungu] = onsen.address.split(' ')
  const preset = ACCESS_PRESETS[onsenId % ACCESS_PRESETS.length]
  const unmatched = UNMATCHED_WATER_IDS.includes(onsenId)

  const detail: OnsenDetail = {
    onsenId: onsen.id,
    name: onsen.name,
    isRegistered: !unmatched,
    sido,
    sigungu: sigungu ?? null,
    address: onsen.address,
    lat: onsen.lat,
    lng: onsen.lng,
    phone: onsen.phone ?? null,
    homepageUrl: onsen.homepage ?? null,
    hours: onsen.openingHours ?? null,
    holiday: onsen.closedDays ?? null,
    parkingInfo: onsen.parking ?? null,
    priceMin: onsen.admissionFee ?? null,
    water: unmatched
      ? { temp: null, type: null, component: null, ph: null, benefit: null }
      : {
          temp: onsen.waterTempC ?? null,
          type: onsen.waterQuality ?? null,
          component: onsen.mainComponent ?? null,
          ph: onsen.ph ?? null,
          benefit: onsen.benefits ?? null,
        },
    facilities: {
      hasOutdoor: onsen.tags.some((tag) => tag.includes('노천')),
      hasLodging: onsen.tags.some((tag) => tag.includes('숙박')),
      facilityType: onsen.tags[0] ?? null,
    },
    access: {
      accessLevel: preset.level,
      accessLevelLabel: preset.label,
      nearestStation: NO_STATION_IDS.includes(onsenId)
        ? null
        : {
            name: STATION_NAMES[onsenId % STATION_NAMES.length],
            lat: onsen.lat + 0.12,
            lng: onsen.lng - 0.09,
            stationToPlaceDesc: `${STATION_NAMES[onsenId % STATION_NAMES.length]} 앞 → 마을버스 20분 → 도보 4분`,
          },
    },
    annualVisitors: unmatched ? null : 40000 + onsenId * 8500,
    images: onsen.imageUrl ? [onsen.imageUrl] : null,
    regionComment: onsen.description ?? null,
    notes: onsen.notice ?? null,
    isFavorite: false,
    reviewSummary: { count: onsen.reviewCount, avgRating: onsen.rating ?? null },
  }

  return new Promise((resolve) => setTimeout(() => resolve(detail), MOCK_DELAY_MS))
}
