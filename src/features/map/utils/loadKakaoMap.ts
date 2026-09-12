import { env } from '@/lib/env'

const SDK_ID = 'kakao-map-sdk'

/** 한 번 로드하면 재사용한다 — 페이지를 오갈 때마다 스크립트를 다시 받지 않는다. */
let loading: Promise<typeof kakao.maps> | null = null

export function loadKakaoMap(): Promise<typeof kakao.maps> {
  if (loading) return loading

  loading = new Promise((resolve, reject) => {
    if (!env.kakaoMapKey) {
      reject(new Error('VITE_KAKAO_MAP_KEY 가 비어 있습니다. .env 에 카카오맵 JavaScript 키를 넣어주세요.'))
      return
    }

    const existing = document.getElementById(SDK_ID)
    if (existing) {
      window.kakao.maps.load(() => resolve(window.kakao.maps))
      return
    }

    const script = document.createElement('script')
    script.id = SDK_ID
    // autoload=false 로 받아서 maps.load() 시점을 우리가 정한다.
    script.src = `https://dapi.kakao.com/v2/maps/sdk.js?appkey=${env.kakaoMapKey}&autoload=false&libraries=clusterer`
    script.async = true
    script.onload = () => window.kakao.maps.load(() => resolve(window.kakao.maps))
    script.onerror = () => {
      loading = null
      reject(new Error('카카오맵을 불러오지 못했습니다. 키와 도메인 등록을 확인해주세요.'))
    }
    document.head.appendChild(script)
  })

  return loading
}
