/**
 * 공유 링크를 클립보드에 복사한다.
 *
 * navigator.share(OS 공유창)는 쓰지 않는다 — 링크를 건네는 것뿐인데 데스크톱에서
 * 시스템 공유 UI가 뜨면 흐름이 끊긴다. 복사만 하고 화면에서 짧게 알린다.
 *
 * 클립보드는 HTTPS가 아니거나 권한이 없으면 막힌다. 그때는 prompt로 띄워
 * 사용자가 직접 고를 수 있게 한다 (다트 결과 카드가 쓰던 방식).
 */
export async function copyLink(url: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(url)
    return true
  } catch {
    window.prompt('링크를 복사하세요', url)
    return false
  }
}
