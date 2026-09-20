import { useState } from 'react'

import { errorCodeOf } from '@/api/ApiError'
import { coord2address } from '@/features/dart/api/places'

import type { DartOrigin } from '@/types/dart'

/** 오래 붙잡고 있어도 답이 없으면 추천 목록으로 물러나게 한다. */
const TIMEOUT_MS = 8000

/**
 * 브라우저가 거절한 것인지 가린다.
 *
 * `instanceof GeolocationPositionError`로 보면 안 된다 — 그 이름이 전역에 없는
 * 브라우저가 있고(구형 사파리는 PositionError였다), 없으면 이 catch 안에서
 * ReferenceError가 나면서 진짜 사유가 통째로 사라진다. 버튼만 깜빡이고
 * 아무 안내도 안 뜨는 상태가 된다.
 */
function isGeolocationError(cause: unknown): cause is GeolocationPositionError {
  return (
    typeof cause === 'object' && cause !== null && 'code' in cause && 'PERMISSION_DENIED' in cause
  )
}

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

/**
 * 실패를 사용자에게 알릴 문구로 바꾼다.
 *
 * 서버 문구를 그대로 내보내지 않는다 — 902가 안 떠 있으면 '요청한 리소스를 찾을
 * 수 없습니다'가 그대로 뜨는데, 읽는 사람이 할 수 있는 일이 없는 말이다.
 * DART-01은 GPS가 막히면 추천 목록으로 물러나게 돼 있으니 그리로 안내한다.
 */
function failureMessage(cause: unknown): string {
  if (isGeolocationError(cause)) return geolocationMessage(cause)

  // 국내 밖은 다르다 — 왜 안 되는지 말해줄 수 있는 유일한 서버 사유다.
  if (errorCodeOf(cause) === 'OUT_OF_SERVICE_AREA') {
    return '국내 위치만 지원해요. 아래 추천 출발지를 골라주세요.'
  }
  return '현재 위치를 주소로 바꾸지 못했어요. 아래 추천 출발지를 골라주세요.'
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
      setError(failureMessage(cause))
      // 서버 쪽 사유는 화면 문구에서 지워지므로 개발 중에는 원본을 남긴다.
      if (import.meta.env.DEV) console.warn('[useGpsOrigin] 현재 위치 실패 —', cause)
    } finally {
      setLoading(false)
    }
  }

  return { locate, loading, error }
}
