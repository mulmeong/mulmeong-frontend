/**
 * 로그인·재발급 응답에 실리는 최소 프로필 (AUTH-01).
 * 헤더·리뷰 버튼처럼 "누가 로그인했는가"만 필요한 곳은 이걸로 충분하다.
 * 이메일은 내려오지 않는다 — `/users/me`에만 있다.
 */
export type AuthUser = {
  userId: number
  nickname: string
  level: number
  /** 레벨 칭호 (MY-03). 서버가 구간을 계산해 내려준다. */
  title: string
}

/**
 * 마이페이지 프로필 헤더 (MY-01). 로그인 응답보다 넓다.
 * 마이페이지에 들어갈 때 따로 받는다.
 */
export type MyProfile = AuthUser & {
  /** 이 API만 예외적으로 내려준다 (내 정보 탭). */
  email: string
  /** 방문한 온천 수. reviewCount와 다르다 — 재방문은 리뷰만 올라간다 (MY-01 비고). */
  visitedOnsenCount: number
  reviewCount: number
  /** 포도알을 채운 시·도 수 (17개 중). */
  grapeRegionCount: number
  favoriteCount: number
  pamphletCount: number
  /** 닉네임 변경 가능 여부는 서버가 계산한다 — 프론트가 날짜를 재지 않는다. */
  nicknameEditable: boolean
  nicknameChangedAt: string | null
  nicknameEditableAt: string | null
  profileShareToken: string
  profileShareUrl: string
  createdAt: string
}
