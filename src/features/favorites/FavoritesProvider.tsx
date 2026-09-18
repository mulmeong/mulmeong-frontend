import { createContext, useContext, useEffect, useRef, useState, type ReactNode } from 'react'

import { useAuth } from '@/features/auth/hooks/authContext'
import { addFavorite, getAllFavorites, removeFavorite, type Favorite, type FavoriteRequest } from './api'

type FavoriteState = { placeId: number; saved: boolean }
type FavoritesContextValue = {
  items: Favorite[]
  loading: boolean
  error?: string
  reload: () => Promise<void>
  state: (target: FavoriteRequest) => FavoriteState | undefined
  pending: (target: FavoriteRequest) => boolean
  toggle: (target: FavoriteRequest) => Promise<boolean>
  remove: (placeId: number) => Promise<void>
}

const FavoritesContext = createContext<FavoritesContextValue | null>(null)
const keyOf = (target: FavoriteRequest) => 'placeId' in target
  ? `place:${target.placeId}` : `${target.source}:${target.externalId}`

export default function FavoritesProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth()
  return <FavoritesSession key={user?.userId ?? 'guest'} authenticated={!!user}>{children}</FavoritesSession>
}

function FavoritesSession({ children, authenticated }: { children: ReactNode; authenticated: boolean }) {
  const [items, setItems] = useState<Favorite[]>([])
  const [loading, setLoading] = useState(authenticated)
  const [error, setError] = useState<string>()
  const [overrides, setOverrides] = useState<Record<string, FavoriteState>>({})
  const [pendingKeys, setPendingKeys] = useState<Set<string>>(new Set())
  const locks = useRef(new Set<string>())
  const request = useRef(0)

  async function reload() {
    if (!authenticated) return
    const id = ++request.current
    setLoading(true)
    setError(undefined)
    try {
      const result = await getAllFavorites()
      if (request.current === id) setItems(result)
    } catch (cause) {
      if (request.current === id) setError(cause instanceof Error ? cause.message : '찜 목록을 불러오지 못했어요.')
    } finally {
      if (request.current === id) setLoading(false)
    }
  }

  useEffect(() => {
    void reload()
    return () => { request.current++ }
  }, [])

  function state(target: FavoriteRequest) {
    const key = keyOf(target)
    if (overrides[key]) return overrides[key]
    if ('placeId' in target) {
      return { placeId: target.placeId, saved: items.some((item) => item.placeId === target.placeId) }
    }
    // 외부 ID는 GET 목록에 없으므로 주변 API의 placeId 또는 POST 응답으로 연결한다.
    return undefined
  }

  async function change(target: FavoriteRequest, save: boolean) {
    const current = state(target)
    const key = keyOf(target)
    const lockKey = current ? `place:${current.placeId}` : key
    if (locks.current.has(lockKey)) return current?.saved ?? false
    locks.current.add(lockKey)
    setPendingKeys(new Set(locks.current))
    const previous = overrides[key]
    if (!save && current) {
      setOverrides((values) => ({ ...values, [key]: { ...current, saved: false } }))
    }
    try {
      if (save) {
        const result = await addFavorite(target)
        const next = { placeId: result.placeId, saved: true }
        setOverrides((values) => ({ ...values, [key]: next, [`place:${result.placeId}`]: next }))
      } else if (current) {
        await removeFavorite(current.placeId)
        setItems((values) => values.filter((item) => item.placeId !== current.placeId))
        setOverrides((values) => Object.fromEntries(Object.entries(values).map(([entryKey, value]) =>
          [entryKey, value.placeId === current.placeId ? { ...value, saved: false } : value],
        )))
      }
      await reload()
      return save
    } catch (cause) {
      setOverrides((values) => {
        const next = { ...values }
        if (previous) next[key] = previous
        else delete next[key]
        return next
      })
      throw cause
    } finally {
      locks.current.delete(lockKey)
      setPendingKeys(new Set(locks.current))
    }
  }

  const value: FavoritesContextValue = {
    items: items.filter((item) => overrides[`place:${item.placeId}`]?.saved !== false),
    loading, error, reload, state,
    pending: (target) => pendingKeys.has(state(target) ? `place:${state(target)!.placeId}` : keyOf(target)),
    toggle: (target) => change(target, !state(target)?.saved),
    remove: async (placeId) => { await change({ placeId }, false) },
  }
  return <FavoritesContext value={value}>{children}</FavoritesContext>
}

export function useFavorites() {
  const context = useContext(FavoritesContext)
  if (!context) throw new Error('FavoritesProvider is required')
  return context
}
