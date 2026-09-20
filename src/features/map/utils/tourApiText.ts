/**
 * TourAPI 원문은 소개글에 `<br>`·태그가, 홈페이지 칸에는 `<a href="...">`가 그대로 들어 있다.
 * BE가 실시간 중계라 그 형태로 올 수 있어 화면에 닿기 전에 정리한다.
 */
export function plainText(value?: string | null) {
  if (!value) return value ?? null
  const text = value
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<[^>]*>/g, '')
    .replace(/&nbsp;/gi, ' ')
    .replace(/&amp;/gi, '&')
    .replace(/&lt;/gi, '<')
    .replace(/&gt;/gi, '>')
    .replace(/&quot;/gi, '"')
    .trim()
  return text || null
}

/**
 * TourAPI 이미지는 `http://tong.visitkorea.or.kr/...`로 온다. 배포는 https라 그대로 쓰면
 * 브라우저가 mixed content로 막아 사진이 전부 폴백으로 떨어진다. 같은 호스트가 https도
 * 받아주므로 올려서 쓴다.
 */
export function secureImageUrl(value?: string | null) {
  if (!value) return value ?? null
  return value.replace(/^http:\/\//i, 'https://')
}

/** 앵커 태그로 오면 href만, 맨 URL로 오면 그대로 쓴다. http(s)가 아니면 링크로 걸지 않는다. */
export function homepageUrlOf(value?: string | null) {
  if (!value) return value ?? null
  const href = value.match(/href\s*=\s*["']([^"']+)["']/i)?.[1] ?? plainText(value)
  if (!href) return null
  const url = href.trim().split(/\s+/)[0]
  return /^https?:\/\//i.test(url) ? url : null
}
