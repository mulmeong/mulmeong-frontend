import { useRef, useState } from 'react'

import { dartErrorMessage, EXCLUDE_MAX, rerollDart, throwDart } from '@/features/dart/api/dart'
import { toMaxMinutes, type DartConditions } from '@/features/dart/constants'

import type { DartOrigin, DartThrowBody, DartThrowResponse } from '@/types/dart'

/**
 * 다트 던지기와 다시 던지기 (DART-02·03·04).
 *
 * 다시 던질 때 앞서 나온 온천을 excludeIds로 빼서 같은 곳이 연달아 나오지 않게
 * 한다. 제외 목록은 조건을 바꿔 새로 던지면 비운다 — 조건이 달라지면 후보군
 * 자체가 달라져서, 전에 뽑힌 곳도 다시 나올 자격이 있다.
 */
export function useDartThrow() {
  const [thrown, setThrown] = useState<DartThrowResponse>()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string>()

  /** 지금까지 뽑힌 후보. 서버 상한을 넘지 않게 최근 것만 남긴다. */
  const excluded = useRef<number[]>([])
  /** 다시 던지기가 같은 조건을 쓰도록 마지막 요청을 들고 있는다. */
  const lastBody = useRef<DartThrowBody>()

  const run = async (body: DartThrowBody, reroll = false) => {
    setLoading(true)
    setError(undefined)

    try {
      const data = await (reroll ? rerollDart(body) : throwDart(body))
      lastBody.current = body
      excluded.current = [...excluded.current, data.result.candidateId].slice(-EXCLUDE_MAX)
      setThrown(data)
    } catch (cause) {
      setError(dartErrorMessage(cause))
    } finally {
      setLoading(false)
    }
  }

  /** 조건을 정하고 처음 던진다. 제외 목록을 비우고 시작한다. */
  const start = (origin: DartOrigin, conditions: DartConditions) => {
    excluded.current = []
    return run({
      origin: { lat: origin.lat, lng: origin.lng, label: origin.label },
      transport: conditions.transport,
      maxMinutes: toMaxMinutes(conditions.duration),
      stayType: conditions.stayType,
    })
  }

  /** 같은 조건으로 다시 던진다(DART-05). 지금까지 나온 곳은 빼고 뽑는다. */
  const again = () => {
    const body = lastBody.current
    if (!body) return
    return run({ ...body, excludeIds: excluded.current }, true)
  }

  /** 결과를 닫고 조건 화면으로 돌아간다. */
  const clear = () => {
    setThrown(undefined)
    setError(undefined)
  }

  return { thrown, loading, error, start, again, clear }
}
