import { useEffect, useRef, useState } from 'react'

const LOADING_DELAY_MS = 400
const MIN_VISIBLE_MS = 300

export function usePoiLoadingIndicator(loading: boolean, requestKey: string, enabled: boolean) {
  const [visibleKey, setVisibleKey] = useState<string>()
  const shownAt = useRef(0)

  useEffect(() => {
    if (!enabled) {
      setVisibleKey(undefined)
      return
    }
    let timer: ReturnType<typeof setTimeout> | undefined
    if (loading) {
      if (visibleKey !== requestKey) {
        setVisibleKey(undefined)
        timer = setTimeout(() => {
          shownAt.current = Date.now()
          setVisibleKey(requestKey)
        }, LOADING_DELAY_MS)
      }
    } else if (visibleKey === requestKey) {
      timer = setTimeout(
        () => setVisibleKey(undefined),
        Math.max(0, MIN_VISIBLE_MS - (Date.now() - shownAt.current)),
      )
    } else {
      setVisibleKey(undefined)
    }
    return () => clearTimeout(timer)
  }, [loading, requestKey, enabled, visibleKey])

  return enabled && visibleKey === requestKey
}
