import type { Region } from '@/types/onsen'

/**
 * 매거진 카테고리 — 시안·상세 데모 기준.
 * 기능명세서 MAG-02에는 다른 이름(온천마을 이야기·뚜벅이 가이드 등)이 적혀 있으나
 * 시안이 더 최신이라 이쪽을 따른다.
 */
export const MAGAZINE_CATEGORIES = [
  '온천 기행',
  '주변 관광',
  '사우나 문화',
  '수질·효능',
  '인터뷰',
] as const

export type MagazineCategory = (typeof MAGAZINE_CATEGORIES)[number]

export type Magazine = {
  id: number
  title: string
  /** 목록 카드의 부제. 상세에서는 제목 아래 한 줄. */
  subtitle?: string
  category: MagazineCategory
  /** 읽는 데 걸리는 분. 시안 표기는 "인터뷰 · 8분". */
  readMinutes: number
  coverImageUrl?: string
  /** 지역 필터 — 포도알 지도(MY-02)와 같은 시·도 단위를 쓴다. 전국 공통이면 비운다. */
  region?: Region
  /** MAG-04 좋아요 개수. 인기 피드 선별 기준. */
  likeCount: number
  publishedAt: string

  /* 아래는 상세(MAG-03)에서만 쓴다. */
  author?: string
  photographer?: string
  /** 히어로 사진 설명. */
  caption?: string
  /** 본문 문단. 첫 문단은 상세에서 크게 시작한다. */
  body?: string[]
  /** 본문 중간 인용구. */
  quote?: string
}

/** 홈 히어로에 쓰는 이슈 배너 (시안 '히어로 커버'). */
export type MagazineIssue = {
  label: string
  title: string
  headline: string
  /** "사진 8장 · 12분 · 강원·경북" */
  meta: string
}
