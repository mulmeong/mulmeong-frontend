import { useState } from 'react'

import { coord2address, placeErrorMessage } from '@/features/dart/api/places'

import type { DartOrigin } from '@/types/dart'

/** 오래 붙잡고 있어도 답이 없으면 추천 목록으로 물러나게 한다. */
const TIMEOUT_MS = 8000

/** 브라우저가 주는 실패 사유. 사용자가 할 수 있는 일이 다르므로 나눠서 알린다. */
function geolocationMessage(error: GeolocationPositionError): string {
  switch (error.code) {
    case error.PERMISSION_DENIED:
      return '위치 권한이 막혀 있어요. 아래 추천 출발지를 골라주세요.'
    case error.POSITION_UNAVAILABLE:
      return '현재 위치를 확인할 수 없어요. 아래 추천 출발지를 골라주세요.'
    default:
      return '위치를 가져오는 데 오래 걸려요. 아래 추천 출발지를 골라주세요.'
  }
}

function getPosition(): Promise<GeolocationPosition> {
  return new Promise((resolve, reject) => {
    navigator.geolocation.getCurrentPosition(resolve, reject, { timeout: TIMEOUT_MS })
  })
}

/**
 * 현재 위치를 출발지로 쓴다 (DART-01 폴백 2단계).
 *
 * 좌표만으로는 "여기서 출발"이라고 확인시켜 줄 수 없어서, 받은 좌표를 902로
 * 보내 읽을 수 있는 주소를 함께 받는다.
 *
 * Geolocation은 HTTPS에서만 동작한다 — localhost는 예외라 개발 중에는 되지만
 * 배포 후 http로 접근하면 브라우저가 아예 막는다.
 */
export function useGpsOrigin() {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string>()

  const locate = async (onFound: (origin: DartOrigin) => void) => {
    if (!('geolocation' in navigator)) {
      setError('이 브라우저는 현재 위치를 지원하지 않아요.')
      return
    }

    setLoading(true)
    setError(undefined)

    try {
      const { coords } = await getPosition()
      const address = await coord2address(coords.latitude, coords.longitude)
      onFound({
        label: address.label,
        lat: address.lat,
        lng: address.lng,
        detail: `${address.sido} ${address.sigungu}`,
      })
    } catch (cause) {
      // 브라우저가 거절한 것과 서버가 실패한 것은 안내가 다르다.
      setError(
        cause instanceof GeolocationPositionError
          ? geolocationMessage(cause)
          : placeErrorMessage(cause),
      )
    } finally {
      setLoading(false)
    }
  }

  return { locate, loading, error }
}
