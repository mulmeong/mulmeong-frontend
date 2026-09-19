import { useState } from 'react'
import { useNavigate } from 'react-router-dom'

import { ApiError } from '@/api'
import Button from '@/components/ui/Button'
import Chip from '@/components/ui/Chip'
import Modal from '@/components/ui/Modal'
import { useFavorites } from '@/features/favorites/FavoritesProvider'
import Pagination from '@/features/mypage/components/Pagination'
import SavedPlaceItem from '@/features/mypage/components/SavedPlaceItem'
import { useSavedPlaces } from '@/features/mypage/hooks/useSavedPlaces'

import { REGION_GROUPS, type RegionGroupId } from '@/types/region'
import {
  SAVED_CATEGORIES,
  SAVED_FILTERS,
  type SavedCategory,
  type SavedFilter,
  type SavedPlace,
} from '@/types/saved'

/** 찜한 장소 · 담당: 예린 */
export default function MySavedPage() {
  const navigate = useNavigate()
  const favorites = useFavorites()

  const [filter, setFilter] = useState<SavedFilter>('all')
  const [region, setRegion] = useState<RegionGroupId>('all')
  const [category, setCategory] = useState<SavedCategory | 'all'>('all')
  const [page, setPage] = useState(1)
  const { data, loading, error, reload } = useSavedPlaces(filter, region, category, page)

  /**
   * 팜플렛으로 묶을 장소. 페이지를 넘겨도 유지한다 —
   * 18곳이 4페이지에 흩어져 있어 한 페이지에서만 고를 수 있으면 쓸모가 없다.
   */
  const [selected, setSelected] = useState<Set<number>>(new Set())

  const [actionError, setActionError] = useState<string>()

  /** 삭제 확인 모달의 대상. null이면 닫힌 상태. */
  const [pendingDelete, setPendingDelete] = useState<SavedPlace | null>(null)
  const [deleteDone, setDeleteDone] = useState(false)
  const [deleting, setDeleting] = useState(false)

  const handleFilter = (next: SavedFilter) => {
    setFilter(next)
    // 조건이 바뀌면 3페이지에 있던 항목이 1페이지로 올 수 있어 처음으로 돌린다.
    setPage(1)
    // 2단계 칩이 사라지면 골라둔 값을 되돌릴 방법이 없어진다 — 같이 푼다.
    if (next !== 'region') setRegion('all')
    if (next !== 'category') setCategory('all')
  }

  const handleRegion = (next: RegionGroupId) => {
    setRegion(next)
    setPage(1)
  }

  const handleCategory = (next: SavedCategory | 'all') => {
    setCategory(next)
    setPage(1)
  }

  const toggleSelected = (place: SavedPlace) => {
    setSelected((current) => {
      // Set을 그대로 고치면 참조가 같아 리렌더가 일어나지 않는다.
      const next = new Set(current)
      if (!next.delete(place.id)) next.add(place.id)
      return next
    })
  }

  const confirmDelete = async () => {
    if (!pendingDelete) return

    setDeleting(true)
    setActionError(undefined)
    try {
      await favorites.remove(pendingDelete.id)
      // 사라진 항목이 선택에 남아 있으면 팜플렛 개수가 실제와 어긋난다.
      setSelected((current) => {
        const next = new Set(current)
        next.delete(pendingDelete.id)
        return next
      })
      setPendingDelete(null)
      setDeleteDone(true)
    } catch (cause) {
      // 실패하면 확인 모달을 닫고 목록 위에 사유를 보여준다.
      setPendingDelete(null)
      setActionError(cause instanceof ApiError ? cause.message : '찜을 해제하지 못했습니다.')
    } finally {
      setDeleting(false)
    }
  }

  const handleShowOnMap = (place: SavedPlace) => {
    if (place.placeType === 'ONSEN' || !place.placeType) {
      void navigate(`/map?onsen=${place.onsenId}`)
    } else if (place.lat !== undefined && place.lng !== undefined) {
      void navigate(`/map?lat=${place.lat}&lng=${place.lng}`)
    }
  }

  const message = error ?? actionError

  return (
    <div className="flex flex-col">
      {/* 내 리뷰 탭과 같은 줄 구성 — 개수 · 1단계 칩 · 오른쪽 끝 동작 버튼. */}
      <div className="flex flex-wrap items-center gap-3">
        <span className="text-[14px] font-semibold">전체 {data?.totalCount ?? 0}</span>

        <div className="flex gap-2">
          {SAVED_FILTERS.map((option) => (
            <Chip
              key={option.id}
              selected={option.id === filter}
              onClick={() => handleFilter(option.id)}
            >
              {option.label}
            </Chip>
          ))}
        </div>

        <button
          type="button"
          onClick={() => setSelected(new Set())}
          disabled={selected.size === 0}
          className="text-text-secondary hover:text-text-primary ml-auto text-[13px] disabled:cursor-not-allowed disabled:opacity-40"
        >
          선택 해제
        </button>

        {/*
          같은 줄의 칩(py-2 / 13px)과 높이를 맞춘다 — Button 기본값은 한 단계 커서 혼자 튄다.
          TODO: 팜플렛 만들기 화면(PAM-01)이 아직 없다.
        */}
        <Button disabled={selected.size === 0} className="px-4 py-2 text-[13px]">
          선택 {selected.size}곳으로 팜플렛 만들기
        </Button>
      </div>

      {/* 2단계 칩. 1단계에서 고른 쪽만 나온다. */}
      {filter === 'region' && (
        <div className="border-border-default mt-3 flex flex-wrap gap-2 border-t pt-3">
          {REGION_GROUPS.map((option) => (
            <Chip
              key={option.id}
              selected={option.id === region}
              onClick={() => handleRegion(option.id)}
            >
              {option.label}
            </Chip>
          ))}
        </div>
      )}

      {filter === 'category' && (
        <div className="border-border-default mt-3 flex flex-wrap gap-2 border-t pt-3">
          <Chip selected={category === 'all'} onClick={() => handleCategory('all')}>
            전체
          </Chip>
          {SAVED_CATEGORIES.map((option) => (
            <Chip
              key={option.id}
              selected={option.id === category}
              onClick={() => handleCategory(option.id)}
            >
              {option.label}
            </Chip>
          ))}
        </div>
      )}

      {/* 목록 자리를 미리 잡아둔다 — 불러오는 동안 아래 페이지네이션이 뛰지 않게. */}
      <div className="min-h-[360px]">
        {message ? (
          <p role="alert" className="text-danger py-10 text-center text-[13px]">
            {message}
            {error && (
              <button type="button" onClick={() => void reload()} className="ml-2 underline">
                다시 시도
              </button>
            )}
          </p>
        ) : loading ? (
          <p className="text-text-secondary py-10 text-center text-[13px]">불러오는 중…</p>
        ) : data && data.items.length > 0 ? (
          <div className="divide-border-default mt-2 flex flex-col divide-y">
            {data.items.map((place) => (
              <SavedPlaceItem
                key={place.id}
                place={place}
                checked={selected.has(place.id)}
                onToggle={toggleSelected}
                onShowOnMap={handleShowOnMap}
                onDelete={setPendingDelete}
              />
            ))}
          </div>
        ) : (
          <p className="text-text-secondary py-10 text-center text-[13px]">찜한 장소가 없습니다.</p>
        )}
      </div>

      {data && (
        <div className="mt-6 flex flex-col items-center gap-3">
          <Pagination page={data.page} totalPages={data.totalPages} onChange={setPage} />
          <p className="text-text-secondary text-[12px]">
            찜한 장소를 골라 팜플렛으로 만들어 보세요.
          </p>
        </div>
      )}

      <Modal
        open={pendingDelete !== null}
        onClose={() => setPendingDelete(null)}
        kicker="찜 해제"
        title={
          <>
            <span className="block">{pendingDelete?.name}을(를)</span>
            <span className="block">찜 목록에서 뺄까요?</span>
          </>
        }
        description="다시 찜하면 언제든 목록에 담을 수 있습니다."
        primaryAction={{
          label: deleting ? '빼는 중…' : '빼기',
          onClick: confirmDelete,
          disabled: deleting,
        }}
        secondaryAction={{ label: '취소', onClick: () => setPendingDelete(null) }}
      />

      <Modal
        open={deleteDone}
        onClose={() => setDeleteDone(false)}
        kicker="해제 완료"
        title={
          <>
            <span className="block">찜 목록에서</span>
            <span className="block">뺐습니다</span>
          </>
        }
        description="목록에서 해당 장소가 사라졌습니다."
        primaryAction={{ label: '확인', onClick: () => setDeleteDone(false) }}
      />
    </div>
  )
}
