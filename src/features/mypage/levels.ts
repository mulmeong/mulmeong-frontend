/**
 * 레벨 구간 (MY-03).
 *
 * **서버와 겹치는 표다.** 레벨과 칭호는 서버가 계산해 프로필로 내려주므로 화면에
 * 그릴 때는 그 값을 쓴다. 여기 있는 경계값은 '다음 레벨까지 몇 곳'을 세기 위한
 * 것뿐이다 — 서버 응답에 남은 수가 없어서 프론트가 계산한다.
 *
 * 서버가 구간을 조정하면 여기도 같이 고쳐야 한다. 조용히 어긋나므로, 프로필
 * 응답에 남은 수가 생기면 이 파일을 지우는 게 맞다.
 *
 * 세는 값은 방문한 온천 수(visitedOnsenCount)다 — 온천별 **첫 리뷰**에만 오른다.
 * 같은 온천에 다시 쓰면 리뷰 수만 늘고 레벨은 그대로다.
 */

/** 각 레벨이 시작되는 방문 수. 칭호는 참고용이며 화면에는 서버 값을 쓴다. */
export const LEVEL_STEPS = [
  { level: 1, from: 0, title: '첫 탕' },
  { level: 2, from: 3, title: '물 좀 아는' },
  { level: 3, from: 6, title: '탕 순례자' },
  { level: 4, from: 11, title: '온천 애호가' },
  { level: 5, from: 21, title: '물멍 마스터' },
] as const

/** 눈금 개수. 레벨 하나가 한 칸이다. */
export const LEVEL_COUNT = LEVEL_STEPS.length

/**
 * 다음 레벨까지 남은 온천 수. 마지막 레벨이면 undefined — 더 갈 곳이 없다.
 *
 * 레벨을 서버 값이 아니라 방문 수로 다시 찾는다 — 둘이 어긋났을 때(구간표가
 * 낡았을 때) 서버 레벨을 믿고 엉뚱한 경계와 빼면 음수가 나온다.
 */
export function visitsToNextLevel(visitedOnsenCount: number): number | undefined {
  const next = LEVEL_STEPS.find((step) => step.from > visitedOnsenCount)
  return next && next.from - visitedOnsenCount
}
