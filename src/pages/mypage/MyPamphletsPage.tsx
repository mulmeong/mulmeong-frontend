import { useEffect, useLayoutEffect, useRef, useState, type MouseEvent } from 'react'
import { Link, useNavigate, useOutletContext, useSearchParams } from 'react-router-dom'

import { ApiError } from '@/api'
import { Button } from '@/components/ui'
import Modal from '@/components/ui/Modal'
import type { MyPageOutletContext } from '@/features/mypage/components/MyPageLayout'
import Pagination from '@/features/mypage/components/Pagination'
import PamphletCover from '@/features/mypage/components/PamphletCover'
import PamphletPreview from '@/features/mypage/components/PamphletPreview'
import PamphletReader from '@/features/mypage/components/PamphletReader'
import { coverNumber, toPamphletView, type PamphletView } from '@/features/mypage/data/pamphletView'
import {
  PAMPHLET_PAGE_SIZE,
  useMyPamphlets,
  usePamphletDetail,
} from '@/features/mypage/hooks/useMyPamphlets'
import { shareLinkOf } from '@/types/pamphlet'
import '@/features/mypage/components/pamphlet.css'

/** 팜플렛 · 목록/상세(MY-12). 장소는 상세에만 있어 펼칠 때 따로 받아온다. */
export default function MyPamphletsPage() {
  const navigate = useNavigate()
  const { reloadProfile } = useOutletContext<MyPageOutletContext>()
  const [searchParams, setSearchParams] = useSearchParams()

  const requestedPage = Number(searchParams.get('page') ?? 1)
  const page = Number.isInteger(requestedPage) ? Math.max(1, requestedPage) : 1
  const { data, loading, error, reload } = useMyPamphlets(page)

  const selectedId = searchParams.get('pamphlet')
  const selectedNumericId = selectedId && /^\d+$/.test(selectedId) ? Number(selectedId) : undefined
  /** 방금 만들어 목록으로 돌아온 팜플렛. 카드에 표시만 하고 동작은 바꾸지 않는다. */
  const freshId = Number(searchParams.get('new')) || undefined
  const items = data?.content ?? []
  const selectedItem = items.find((item) => item.pamphletId === selectedNumericId)

  /** 표지를 펼치거나 관리 화면을 열면 그 팜플렛의 상세를 받는다. */
  const [openId, setOpenId] = useState<number>()
  const detailId = openId ?? selectedNumericId
  const { detail, loading: detailLoading, error: detailError, remove } = usePamphletDetail(detailId)

  const [reader, setReader] = useState<{ source: HTMLButtonElement; fromCard: boolean } | null>(
    null,
  )
  const [copied, setCopied] = useState(false)
  const [pendingDelete, setPendingDelete] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [actionError, setActionError] = useState<string>()

  const areaRef = useRef<HTMLDivElement>(null)
  const headingRef = useRef<HTMLHeadingElement>(null)
  const cardRefs = useRef(new Map<number, HTMLButtonElement>())
  const returnTo = useRef<{ id: number; scrollY: number } | null>(null)

  const listParams = new URLSearchParams(searchParams)
  listParams.delete('pamphlet')
  const listHref = { pathname: '/my/pamphlets', search: listParams.toString() }

  const totalPages = data?.totalPages ?? 1

  // 상세가 도착해야 리더를 열 수 있다 — 장소 없이 펼치면 빈 책이 된다.
  const readerView: PamphletView | undefined =
    reader && detail && detail.pamphletId === detailId
      ? toPamphletView(detail, coverNumber(0, 1, PAMPHLET_PAGE_SIZE))
      : undefined

  useLayoutEffect(() => {
    if (selectedItem) {
      const area = areaRef.current?.getBoundingClientRect()
      if (area && (area.top < 88 || area.top > window.innerHeight - 160)) {
        window.scrollTo({ top: Math.max(0, window.scrollY + area.top - 88), behavior: 'instant' })
      }
      headingRef.current?.focus({ preventScroll: true })
    } else if (!selectedId && returnTo.current) {
      const previous = returnTo.current
      window.scrollTo({ top: previous.scrollY, behavior: 'instant' })
      cardRefs.current.get(previous.id)?.focus({ preventScroll: true })
      returnTo.current = null
    }
  }, [selectedItem, selectedId])

  // 다른 팜플렛으로 옮기면 앞선 복사·실패 표시가 남지 않게 지운다.
  useEffect(() => {
    setCopied(false)
    setActionError(undefined)
  }, [selectedNumericId])

  const share = async (shareToken: string, title: string) => {
    const url = shareLinkOf(shareToken)
    if (navigator.share) {
      try {
        await navigator.share({ title, text: `${title} · 물멍 팜플렛`, url })
        return
      } catch (cause) {
        if (cause instanceof DOMException && cause.name === 'AbortError') return
      }
    }
    try {
      await navigator.clipboard.writeText(url)
      setCopied(true)
    } catch {
      setCopied(false)
    }
  }

  const confirmDelete = async () => {
    if (!selectedNumericId) return
    setDeleting(true)
    setActionError(undefined)
    try {
      await remove(selectedNumericId)
      reloadProfile()
      setPendingDelete(false)
      reload()
      void navigate(listHref)
    } catch (cause) {
      setPendingDelete(false)
      setActionError(cause instanceof ApiError ? cause.message : '팜플렛을 삭제하지 못했습니다.')
    } finally {
      setDeleting(false)
    }
  }

  const openReader = (event: MouseEvent<HTMLButtonElement>, id: number, fromCard: boolean) => {
    setOpenId(id)
    setReader({ source: event.currentTarget, fromCard })
  }

  return (
    <>
      <div ref={areaRef} className="pamphlet-view min-w-0">
        {selectedNumericId !== undefined ? (
          <section aria-labelledby="pamphlet-title" className="min-h-[360px]">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <Link
                to={listHref}
                className="pamphlet-text-link text-text-secondary inline-flex min-h-11 items-center gap-2 text-[13px]"
              >
                <span aria-hidden="true">←</span> 팜플렛 목록
              </Link>
              <div className="flex flex-wrap items-center gap-2">
                <Button
                  onClick={(event) => openReader(event, selectedNumericId, false)}
                  disabled={!detail}
                  aria-haspopup="dialog"
                >
                  팜플렛 보기
                </Button>
                <Button
                  hierarchy="secondary"
                  disabled={!detail}
                  onClick={() => {
                    if (detail) void share(detail.shareToken, detail.title)
                  }}
                >
                  {copied ? '복사했습니다' : '링크로 공유'}
                </Button>
                {/* 좌표가 있는 장소만 지도에 찍힌다 — 없으면 보낼 이유가 없다. */}
                <Button
                  hierarchy="secondary"
                  disabled={!detail?.places.some((place) => place.lat != null && place.lng != null)}
                  onClick={() => void navigate(`/map?pamphlet=${selectedNumericId}`)}
                >
                  지도에서 보기
                </Button>
                <Button
                  hierarchy="secondary"
                  disabled={!detail}
                  onClick={() => setPendingDelete(true)}
                >
                  삭제
                </Button>
              </div>
            </div>

            {actionError && (
              <p role="alert" className="text-danger mt-4 text-[13px]">
                {actionError}
              </p>
            )}

            {detailError ? (
              <p role="alert" className="text-danger py-16 text-center text-[13px]">
                {detailError}
              </p>
            ) : detailLoading || !detail ? (
              <p className="text-text-secondary py-16 text-center text-[13px]">불러오는 중…</p>
            ) : (
              <>
                <h2 ref={headingRef} id="pamphlet-title" tabIndex={-1} className="sr-only">
                  {detail.title}
                </h2>
                <div className="border-border-default mt-6 border-t pt-6">
                  <PamphletPreview detail={detail} />
                </div>
              </>
            )}
          </section>
        ) : (
          <section aria-labelledby="pamphlet-list-title">
            <div className="mb-6 flex flex-wrap items-center justify-between gap-2">
              <h2 id="pamphlet-list-title" className="text-[14px] font-semibold">
                엮어둔 곳으로 만든 여행 팜플렛 {data?.totalElements ?? 0}권
              </h2>
            </div>

            {error ? (
              <p role="alert" className="text-danger py-16 text-center text-[13px]">
                {error}
                <button type="button" onClick={reload} className="ml-2 underline">
                  다시 시도
                </button>
              </p>
            ) : (
              <>
                <div className="grid grid-cols-1 gap-x-5 gap-y-6 min-[480px]:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
                  <Link
                    to="/my/saved"
                    className="pamphlet-create border-border-default bg-surface-dim/40 text-text-secondary flex min-h-44 flex-col items-center justify-center gap-3 rounded-sm border border-dashed text-[13px]"
                  >
                    <span aria-hidden="true" className="text-[28px] font-light">
                      +
                    </span>
                    새 팜플렛 만들기
                    <span className="text-[11px]">엮어둔 곳에서 시작하세요</span>
                  </Link>

                  {loading && items.length === 0
                    ? Array.from({ length: 3 }, (_, index) => (
                        <div
                          key={index}
                          aria-hidden="true"
                          className="bg-surface-dim/60 min-h-44 animate-pulse rounded-sm"
                        />
                      ))
                    : items.map((pamphlet, index) => {
                        const params = new URLSearchParams(searchParams)
                        params.set('pamphlet', String(pamphlet.pamphletId))
                        const view: PamphletView = {
                          id: String(pamphlet.pamphletId),
                          number: coverNumber(index, page, PAMPHLET_PAGE_SIZE),
                          title: pamphlet.title,
                          createdAt: pamphlet.createdAt.slice(0, 10),
                          // 목록에는 장소가 없다. 표지에 쓰는 건 개수뿐이라 빈 배열로 채운다.
                          places: [],
                        }
                        return (
                          <div key={pamphlet.pamphletId} className="min-w-0">
                            <button
                              type="button"
                              ref={(element) => {
                                if (element) cardRefs.current.set(pamphlet.pamphletId, element)
                                else cardRefs.current.delete(pamphlet.pamphletId)
                              }}
                              onClick={(event) => openReader(event, pamphlet.pamphletId, true)}
                              className="pamphlet-card"
                              data-reading={
                                (reader?.fromCard && openId === pamphlet.pamphletId) || undefined
                              }
                              // 방금 만든 팜플렛은 목록으로 돌아왔을 때 알아볼 수 있게 짚어준다.
                              data-fresh={freshId === pamphlet.pamphletId || undefined}
                              aria-haspopup="dialog"
                              aria-label={`${pamphlet.title}, ${pamphlet.placeCount}곳, 팜플렛 펼치기`}
                            >
                              <PamphletCover
                                number={view.number}
                                title={view.title}
                                placeCount={pamphlet.placeCount}
                                createdAt={view.createdAt}
                              />
                            </button>
                            <Link
                              to={{ pathname: '/my/pamphlets', search: params.toString() }}
                              onClick={() => {
                                returnTo.current = {
                                  id: pamphlet.pamphletId,
                                  scrollY: window.scrollY,
                                }
                              }}
                              className="pamphlet-text-link text-text-secondary mt-1 inline-flex min-h-11 items-center text-[12px]"
                              aria-label={`${pamphlet.title} 관리`}
                            >
                              팜플렛 관리{' '}
                              <span aria-hidden="true" className="ml-2">
                                ↗
                              </span>
                            </Link>
                          </div>
                        )
                      })}
                </div>

                {items.length === 0 && !loading && (
                  <p className="text-text-secondary py-12 text-center text-[13px]">
                    아직 만든 팜플렛이 없어요. 찜한 장소를 골라 첫 팜플렛을 만들어 보세요.
                  </p>
                )}

                <div className="mt-10 flex flex-col items-center gap-4">
                  {totalPages > 1 && (
                    <Pagination
                      page={page}
                      totalPages={totalPages}
                      onChange={(nextPage) => {
                        setSearchParams((current) => {
                          const next = new URLSearchParams(current)
                          next.set('page', String(nextPage))
                          return next
                        })
                      }}
                    />
                  )}
                  <p className="text-text-secondary text-center text-[12px]">
                    표지를 눌러 엮어둔 여행을 펼쳐보세요.
                  </p>
                </div>
              </>
            )}
          </section>
        )}
      </div>

      {reader && readerView && (
        <PamphletReader
          pamphlet={readerView}
          source={reader.source}
          fromCard={reader.fromCard}
          onClose={() => {
            setReader(null)
            if (selectedNumericId === undefined) setOpenId(undefined)
          }}
        />
      )}

      <Modal
        open={pendingDelete}
        onClose={() => setPendingDelete(false)}
        kicker="팜플렛 삭제"
        title={
          <>
            <span className="block">{detail?.title}을(를)</span>
            <span className="block">삭제할까요?</span>
          </>
        }
        description="공유한 링크도 함께 열리지 않게 됩니다. 찜한 장소는 그대로 남습니다."
        primaryAction={{
          label: deleting ? '삭제하는 중…' : '삭제',
          onClick: () => void confirmDelete(),
          disabled: deleting,
        }}
        secondaryAction={{ label: '취소', onClick: () => setPendingDelete(false) }}
      />
    </>
  )
}
