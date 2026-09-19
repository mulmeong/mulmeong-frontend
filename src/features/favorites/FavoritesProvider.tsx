import { createContext, useCallback, useContext, useEffect, useRef, useState, type ReactNode } from 'react'

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
  return <FavoritesSession userId={user?.userId}>{children}</FavoritesSession>
}

function FavoritesSession({ children, userId }: { children: ReactNode; userId?: number }) {
  const authenticated = userId !== undefined
  const session = useRef(userId)
  session.current = userId
  const [items, setItems] = useState<Favorite[]>([])
  const [owner, setOwner] = useState(userId)
  const [loading, setLoading] = useState(authenticated)
  const [error, setError] = useState<string>()
  const [overrides, setOverrides] = useState<Record<string, FavoriteState>>({})
  const [pendingKeys, setPendingKeys] = useState<Set<string>>(new Set())
  const locks = useRef(new Set<string>())
  const request = useRef(0)
  const [notice, setNotice] = useState<{ text: string; id: number }>()

  const reload = useCallback(async (silent = false) => {
    if (!authenticated) return
    const id = ++request.current
    if (!silent) setLoading(true)
    setError(undefined)
    try {
      const result = await getAllFavorites()
      if (request.current === id && session.current === userId) setItems(result)
    } catch (cause) {
      if (request.current === id && session.current === userId) setError(cause instanceof Error ? cause.message : '찜 목록을 불러오지 못했어요.')
    } finally {
      if (request.current === id && session.current === userId) setLoading(false)
    }
  }, [authenticated, userId])

  useEffect(() => {
    setOwner(userId)
    setItems([])
    setOverrides({})
    setPendingKeys(new Set())
    locks.current.clear()
    setError(undefined)
    setLoading(authenticated)
    setNotice(undefined)
    void reload()
    return () => { request.current++ }
  }, [userId, authenticated, reload])

  useEffect(() => {
    if (!notice) return
    const timer = window.setTimeout(() => setNotice(undefined), 3000)
    return () => window.clearTimeout(timer)
  }, [notice])

  function state(target: FavoriteRequest) {
    const key = keyOf(target)
    if (!authenticated || owner !== userId) return undefined
    if (overrides[key]) return overrides[`place:${overrides[key].placeId}`] ?? overrides[key]
    if ('placeId' in target) {
      return { placeId: target.placeId, saved: items.some((item) => item.placeId === target.placeId) }
    }
    // 외부 ID는 GET 목록에 없으므로 주변 API의 placeId 또는 POST 응답으로 연결한다.
    return undefined
  }

  async function change(target: FavoriteRequest, save: boolean) {
    if (!authenticated) throw new Error('로그인이 필요해요.')
    const current = state(target)
    const key = keyOf(target)
    const lockKey = current ? `place:${current.placeId}` : key
    if (locks.current.has(lockKey)) return current?.saved ?? false
    locks.current.add(lockKey)
    setPendingKeys(new Set(locks.current))
    const previous = overrides[key]
    const canonicalKey = current ? `place:${current.placeId}` : key
    const previousCanonical = overrides[canonicalKey]
    let resolvedLock: string | undefined
    if (!save && current) {
      const next = { ...current, saved: false }
      setOverrides((values) => ({ ...values, [key]: next, [canonicalKey]: next }))
    }
    try {
      if (save) {
        const result = await addFavorite(target)
        if (session.current !== userId) return false
        resolvedLock = `place:${result.placeId}`
        locks.current.add(resolvedLock)
        setPendingKeys(new Set(locks.current))
        const next = { placeId: result.placeId, saved: true }
        setOverrides((values) => ({ ...values, [key]: next, [`place:${result.placeId}`]: next }))
        setNotice({ text: '찜한 장소에 담았어요.', id: Date.now() })
      } else if (current) {
        await removeFavorite(current.placeId)
        if (session.current !== userId) return false
        setItems((values) => values.filter((item) => item.placeId !== current.placeId))
        setOverrides((values) => Object.fromEntries(Object.entries(values).map(([entryKey, value]) =>
          [entryKey, value.placeId === current.placeId ? { ...value, saved: false } : value],
        )))
        setNotice({ text: '찜을 해제했어요.', id: Date.now() })
      }
      await reload(true)
      return save
    } catch (cause) {
      if (session.current !== userId) throw cause
      setOverrides((values) => {
        const next = { ...values }
        if (previous) next[key] = previous
        else delete next[key]
        if (previousCanonical) next[canonicalKey] = previousCanonical
        else delete next[canonicalKey]
        return next
      })
      throw cause
    } finally {
      if (session.current === userId) {
        locks.current.delete(lockKey)
        if (resolvedLock) locks.current.delete(resolvedLock)
        setPendingKeys(new Set(locks.current))
      }
    }
  }

  const value: FavoritesContextValue = {
    items: authenticated && owner === userId ? items.filter((item) => overrides[`place:${item.placeId}`]?.saved !== false) : [],
    loading: authenticated && (loading || owner !== userId), error, reload, state,
    pending: (target) => pendingKeys.has(keyOf(target)) || pendingKeys.has(`place:${state(target)?.placeId}`),
    toggle: (target) => change(target, !state(target)?.saved),
    remove: async (placeId) => { await change({ placeId }, false) },
  }
  return <FavoritesContext value={value}>
    {children}
    <div role="status" aria-live="polite" aria-atomic="true" className="pointer-events-none fixed inset-x-4 bottom-6 z-[300] flex justify-center">
      {notice && <p key={notice.id} className="bg-inverse text-white rounded-md px-4 py-3 text-[13px] shadow-sm">{notice.text}</p>}
    </div>
  </FavoritesContext>
}

export function useFavorites() {
  const context = useContext(FavoritesContext)
  if (!context) throw new Error('FavoritesProvider is required')
  return context
}
