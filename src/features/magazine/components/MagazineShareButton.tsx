import { useState } from 'react'

import { copyLink } from '@/lib/copyLink'
import { cn } from '@/lib/cn'

/**
 * 글 주소를 클립보드에 복사한다. OS 공유창(navigator.share)은 쓰지 않는다 —
 * 링크를 건네는 것뿐인데 데스크톱에서 시스템 UI가 뜨면 흐름이 끊긴다.
 */
export default function MagazineShareButton({ className }: { className?: string }) {
  const [copied, setCopied] = useState(false)

  const share = async () => {
    if (await copyLink(window.location.href)) {
      setCopied(true)
      window.setTimeout(() => setCopied(false), 2000)
    }
  }

  return (
    <button
      type="button"
      onClick={() => void share()}
      aria-label={copied ? '링크를 복사했습니다' : '링크 복사'}
      title="링크 복사"
      className={cn(
        'border-border-default hover:border-border-strong flex size-10 items-center justify-center rounded-full border text-[13px] transition-colors outline-none',
        copied && 'border-border-strong text-text-primary',
        className,
      )}
    >
      <span aria-hidden="true">{copied ? '✓' : '🔗'}</span>
    </button>
  )
}
