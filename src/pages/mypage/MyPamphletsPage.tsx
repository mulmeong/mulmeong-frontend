import { useLayoutEffect, useRef, useState, type MouseEvent } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'

import { Button } from '@/components/ui'
import Pagination from '@/features/mypage/components/Pagination'
import PamphletCover from '@/features/mypage/components/PamphletCover'
import PamphletReader from '@/features/mypage/components/PamphletReader'
import SavedPlaceItem from '@/features/mypage/components/SavedPlaceItem'
import { PAMPHLET_PREVIEWS, type PamphletPreview } from '@/features/mypage/data/pamphletPreview'
import '@/features/mypage/components/pamphlet.css'

const PAGE_SIZE = 7

/** 팜플렛 · 목록/상세의 시각 구현. 생성·저장 기능과는 연결하지 않는다. */
export default function MyPamphletsPage() {
  const navigate = useNavigate()
  const [searchParams, setSearchParams] = useSearchParams()
  const selectedId = searchParams.get('pamphlet')
  const selected = PAMPHLET_PREVIEWS.find((pamphlet) => pamphlet.id === selectedId)
  const totalPages = Math.max(1, Math.ceil(PAMPHLET_PREVIEWS.length / PAGE_SIZE))
  const requestedPage = Number(searchParams.get('page') ?? 1)
  const page = Number.isInteger(requestedPage)
    ? Math.max(1, Math.min(totalPages, requestedPage))
    : 1
  const items = PAMPHLET_PREVIEWS.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE)

  const [reader, setReader] = useState<{
    pamphlet: PamphletPreview
    source: HTMLButtonElement
    fromCard: boolean
  } | null>(null)
  const areaRef = useRef<HTMLDivElement>(null)
  const headingRef = useRef<HTMLHeadingElement>(null)
  const cardRefs = useRef(new Map<string, HTMLButtonElement>())
  const returnTo = useRef<{ id: string; scrollY: number } | null>(null)

  const listParams = new URLSearchParams(searchParams)
  listParams.delete('pamphlet')
  const listHref = { pathname: '/my/pamphlets', search: listParams.toString() }

  useLayoutEffect(() => {
    if (selected) {
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
  }, [selected, selectedId])

  const openPamphlet = (
    event: MouseEvent<HTMLButtonElement>,
    pamphlet: PamphletPreview,
    fromCard: boolean,
  ) => {
    setReader({ pamphlet, source: event.currentTarget, fromCard })
  }

  return (
    <>
      <div ref={areaRef} className="pamphlet-view min-w-0">
        {selected ? (
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
                  onClick={(event) => openPamphlet(event, selected, false)}
                  aria-haspopup="dialog"
                >
                  팜플렛 보기
                </Button>
                <Button hierarchy="secondary" disabled title="링크 공유는 준비 중입니다.">
                  링크 공유
                </Button>
                <Button hierarchy="secondary" disabled title="장소 추가는 준비 중입니다.">
                  + 장소 추가
                </Button>
              </div>
            </div>

            <header className="border-border-default mt-6 border-b pb-5">
              <h2
                ref={headingRef}
                id="pamphlet-title"
                tabIndex={-1}
                className="text-[24px] leading-snug font-bold tracking-tight outline-none"
              >
                {selected.title}
              </h2>
              <p className="text-text-secondary mt-2 text-[13px]">생성일 {selected.createdAt}</p>
            </header>

            <h3 className="mt-5 mb-2 text-[14px] font-semibold">
              포함된 장소 {selected.places.length}곳
            </h3>
            <div className="divide-border-default/50 divide-y">
              {selected.places.map((place) => (
                <SavedPlaceItem
                  key={place.id}
                  place={place}
                  onShowOnMap={(item) => {
                    void navigate(`/map?onsen=${item.onsenId}`)
                  }}
                />
              ))}
            </div>
          </section>
        ) : selectedId ? (
          <div className="py-16 text-center">
            <p className="text-[15px]">팜플렛을 찾을 수 없습니다.</p>
            <Link
              to={listHref}
              className="pamphlet-text-link text-text-secondary mt-4 inline-flex min-h-11 items-center text-[13px]"
            >
              ← 팜플렛 목록
            </Link>
          </div>
        ) : (
          <section aria-labelledby="pamphlet-list-title">
            <div className="mb-6 flex flex-wrap items-center justify-between gap-2">
              <h2 id="pamphlet-list-title" className="text-[14px] font-semibold">
                엮어둔 곳으로 만든 여행 팜플렛 {PAMPHLET_PREVIEWS.length}권
              </h2>
              <span className="text-text-secondary text-[12px]">예시 팜플렛</span>
            </div>

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
              {items.map((pamphlet) => {
                const params = new URLSearchParams(searchParams)
                params.set('pamphlet', pamphlet.id)
                return (
                  <div key={pamphlet.id} className="min-w-0">
                    <button
                      type="button"
                      ref={(element) => {
                        if (element) cardRefs.current.set(pamphlet.id, element)
                        else cardRefs.current.delete(pamphlet.id)
                      }}
                      onClick={(event) => openPamphlet(event, pamphlet, true)}
                      className="pamphlet-card"
                      data-reading={
                        (reader?.fromCard && reader.pamphlet.id === pamphlet.id) || undefined
                      }
                      aria-haspopup="dialog"
                      aria-label={`${pamphlet.title}, ${pamphlet.places.length}곳, 팜플렛 펼치기`}
                    >
                      <PamphletCover
                        pamphlet={{ ...pamphlet, placeCount: pamphlet.places.length }}
                      />
                    </button>
                    <Link
                      to={{ pathname: '/my/pamphlets', search: params.toString() }}
                      onClick={() => {
                        returnTo.current = { id: pamphlet.id, scrollY: window.scrollY }
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

            <div className="mt-10 flex flex-col items-center gap-4">
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
              <p className="text-text-secondary text-center text-[12px]">
                표지를 눌러 엮어둔 여행을 펼쳐보세요.
              </p>
            </div>
          </section>
        )}
      </div>

      {reader && (
        <PamphletReader
          pamphlet={reader.pamphlet}
          source={reader.source}
          fromCard={reader.fromCard}
          onClose={() => setReader(null)}
        />
      )}
    </>
  )
}
