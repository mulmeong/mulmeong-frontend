import { ApiError, errorCodeOf } from '@/api/ApiError'
import { api } from '@/api/client'

import type { DartThrowBody, DartThrowResponse, SharedDart } from '@/types/dart'

/** 서버가 받는 excludeIds 상한. 넘기면 VALIDATION_FAILED다. */
export const EXCLUDE_MAX = 100

/**
 * 다트 던지기 (DART-02·03·04).
 *
 * 비로그인도 던질 수 있다. 로그인 상태면 서버가 기록에 user_id를 남기므로
 * 토큰은 있으면 보내고 없으면 그냥 보낸다 — skipAuth를 쓰지 않는 이유다.
 *
 * **결과 없음은 없다.** 조건에 맞는 후보가 모자라면 서버가 시간 조건을 늘리고
 * relaxed·relaxMessage로 알려준다. 빈 결과를 처리할 분기는 필요 없다.
 */
export function throwDart(body: DartThrowBody) {
  return api.post<DartThrowResponse>('/dart/throw', body)
}

/**
 * 다시 던지기 (DART-05).
 *
 * 요청·응답 스키마가 던지기와 같지만 엔드포인트가 다르다 — 서버가 재추첨마다
 * 새 기록과 새 dartId를 남긴다. 그래서 공유 주소도 결과마다 새로 받는다.
 */
export function rerollDart(body: DartThrowBody) {
  return api.post<DartThrowResponse>('/dart/reroll', body)
}

/**
 * 공유된 다트 (DART-06).
 *
 * 로그인 없이 열려야 하지만 토큰이 있으면 보낸다 — 서버가 isMine을 채워준다.
 */
export function getSharedDart(dartId: string) {
  return api.get<SharedDart>(`/darts/${dartId}`)
}

/** 만료(410)는 '없는 링크'와 다르게 안내해야 해서 따로 가려낸다. */
export function isDartExpired(cause: unknown): boolean {
  return cause instanceof ApiError && cause.status === 410
}

export function isDartNotFound(cause: unknown): boolean {
  return cause instanceof ApiError && cause.status === 404
}

export function dartErrorMessage(cause: unknown): string {
  switch (errorCodeOf(cause)) {
    case 'INVALID_ORIGIN':
      // 국내 밖 좌표는 검색·GPS로도 들어올 수 있다. 출발지를 다시 고르게 안내한다.
      return '출발지를 다시 골라주세요. 국내 위치만 지원해요.'
    case 'DART_CANDIDATE_UNAVAILABLE':
      return '지금은 뽑을 온천이 준비되지 않았어요. 잠시 후 다시 시도해주세요.'
    default:
      return cause instanceof ApiError ? cause.message : '다트를 던지지 못했습니다.'
  }
}
