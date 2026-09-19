import { useState } from 'react'
import { useNavigate } from 'react-router-dom'

import { ApiError } from '@/api'
import Button from '@/components/ui/Button'
import Chip from '@/components/ui/Chip'
import Input from '@/components/ui/Input'
import Modal from '@/components/ui/Modal'
import { useFavorites } from '@/features/favorites/FavoritesProvider'
import { createPamphlet } from '@/features/mypage/api/pamphlets'
import Pagination from '@/features/mypage/components/Pagination'
import SavedPlaceItem from '@/features/mypage/components/SavedPlaceItem'
import { useSavedPlaces } from '@/features/mypage/hooks/useSavedPlaces'

import {
  PAMPHLET_PARTY_MAX,
  PAMPHLET_PARTY_MIN,
  PAMPHLET_PLACE_MAX,
  PAMPHLET_TITLE_MAX,
  type Pamphlet,
} from '@/types/pamphlet'
import {
  SAVED_CATEGORIES,
  SAVED_SORTS,
  type SavedCategory,
  type SavedPlace,
  type SavedSort,
} from '@/types/saved'

/** 찜한 장소 · 담당: 예린 */
export default function MySavedPage() {
  const navigate = useNavigate()
  const favorites = useFavorites()

  const [sort, setSort] = useState<SavedSort>('RECENT')
  const [category, setCategory] = useState<SavedCategory | 'all'>('all')
  const [page, setPage] = useState(1)
  const { data, loading, error, reload } = useSavedPlaces(sort, category, page)

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

  /** 팜플렛 만들기 폼. 제목만 필수다. */
  const [formOpen, setFormOpen] = useState(false)
  const [title, setTitle] = useState('')
  const [partySize, setPartySize] = useState('')
  const [travelDate, setTravelDate] = useState('')
  const [creating, setCreating] = useState(false)
  /** 만들어진 팜플렛. 공유 링크를 보여줄 때만 값이 있다. */
  const [created, setCreated] = useState<Pamphlet | null>(null)
  const [copied, setCopied] = useState(false)

  const tooMany = selected.size > PAMPHLET_PLACE_MAX
  const canSubmit = title.trim().length > 0 && selected.size > 0 && !tooMany

  const openForm = () => {
    setTitle('')
    setPartySize('')
    setTravelDate('')
    setActionError(undefined)
    setFormOpen(true)
  }

  const submitPamphlet = async () => {
    if (!canSubmit) return

    setCreating(true)
    setActionError(undefined)
    try {
      const pamphlet = await createPamphlet({
        title: title.trim(),
        // 안 채운 항목은 빈 값 대신 아예 뺀다 — 서버가 400으로 막는다.
        partySize: partySize ? Number(partySize) : undefined,
        travelDate: travelDate || undefined,
        // Set은 넣은 순서를 지킨다. 고른 순서가 그대로 팜플렛 순서가 된다.
        placeIds: [...selected],
      })
      setFormOpen(false)
      setCreated(pamphlet)
      setCopied(false)
      // 만들고 나면 선택을 푼다 — 같은 묶음을 실수로 두 번 만들지 않게.
      setSelected(new Set())
    } catch (cause) {
      setFormOpen(false)
      setActionError(cause instanceof ApiError ? cause.message : '팜플렛을 만들지 못했습니다.')
    } finally {
      setCreating(false)
    }
  }

  const copyShareUrl = async () => {
    if (!created) return
    try {
      await navigator.clipboard.writeText(created.shareUrl)
      setCopied(true)
    } catch {
      // 클립보드는 https나 사용자 동작이 아니면 막힌다. 링크는 화면에 그대로 있다.
      setCopied(false)
    }
  }

  const handleSort = (next: SavedSort) => {
    setSort(next)
    // 순서가 바뀌면 3페이지에 있던 항목이 1페이지로 올 수 있어 처음으로 돌린다.
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
    } else if (place.kakaoPlaceUrl && /^https?:\/\//i.test(place.kakaoPlaceUrl)) {
      window.open(place.kakaoPlaceUrl, '_blank', 'noopener,noreferrer')
    } else if (place.lat !== undefined && place.lng !== undefined) {
      void navigate(`/map?lat=${place.lat}&lng=${place.lng}`)
    }
  }

  /**
   * 띄울 카테고리 칩. 찜한 장소가 있는 종류만 남긴다.
   * 고른 종류는 개수가 0이 돼도 남긴다 — 눌린 칩이 사라지면 화면이 뒤집힌다.
   */
  const shownCategories = SAVED_CATEGORIES.filter(
    (option) => (data?.counts[option.id] ?? 0) > 0 || option.id === category,
  )

  const message = error ?? actionError

  return (
    <div className="flex flex-col">
      {/* 내 리뷰 탭과 같은 줄 구성 — 개수 · 정렬 칩 · 오른쪽 끝 동작 버튼. */}
      <div className="flex flex-wrap items-center gap-3">
        <span className="text-[14px] font-semibold">전체 {data?.totalCount ?? 0}</span>

        <div className="flex gap-2">
          {SAVED_SORTS.map((option) => (
            <Chip
              key={option.id}
              selected={option.id === sort}
              onClick={() => handleSort(option.id)}
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

        {/* 같은 줄의 칩(py-2 / 13px)과 높이를 맞춘다 — Button 기본값은 한 단계 커서 혼자 튄다. */}
        <Button
          onClick={openForm}
          disabled={selected.size === 0 || tooMany}
          className="px-4 py-2 text-[13px]"
        >
          선택 {selected.size}곳으로 팜플렛 만들기
        </Button>

        {/* 서버가 20곳까지만 받는다. 누르고 나서 400을 보는 것보다 미리 알리는 게 낫다. */}
        {tooMany && (
          <p role="alert" className="text-danger w-full text-[12px]">
            팜플렛에는 {PAMPHLET_PLACE_MAX}곳까지 담을 수 있습니다.{' '}
            {selected.size - PAMPHLET_PLACE_MAX}
            곳을 빼주세요.
          </p>
        )}
      </div>

      {/*
        카테고리 칩은 찜한 장소가 있는 종류만 나온다. 눌러도 0건인 칩은 띄우지 않는다.
        칩 옆 숫자는 조건을 걸기 전 기준이라(MY-06 counts) 칩을 눌러도 흔들리지 않는다.

        한 종류도 없으면 줄 자체를 감춘다 — '전체' 하나만 떠 있어봐야 할 일이 없다.
        단 카테고리를 골라둔 상태라면 비어 있어도 남긴다. 고른 종류를 모두 지우면
        목록이 비면서 칩도 같이 사라져, 전체로 돌아갈 길이 없어진다.
      */}
      {(shownCategories.length > 0 || category !== 'all') && (
        <div className="border-border-default mt-3 flex flex-wrap gap-2 border-t pt-3">
          <Chip selected={category === 'all'} onClick={() => handleCategory('all')}>
            전체 {data?.counts.all ?? 0}
          </Chip>
          {shownCategories.map((option) => (
            <Chip
              key={option.id}
              selected={option.id === category}
              onClick={() => handleCategory(option.id)}
            >
              {option.label} {data?.counts[option.id] ?? 0}
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

      {/*
        Modal은 children을 받지 않아 입력 칸을 description으로 넘긴다.
        TODO: 명세에 '팜플렛 화면이 수정될 수 있음'이라 적혀 있다. 전용 화면이
        확정되면 이 모달 대신 그쪽으로 옮긴다.
      */}
      <Modal
        open={formOpen}
        onClose={() => setFormOpen(false)}
        kicker="팜플렛 만들기"
        title={`선택한 ${selected.size}곳으로`}
        description={
          <span className="mt-2 flex flex-col gap-4 text-left">
            <Input
              label="제목"
              value={title}
              onChange={(event) => setTitle(event.target.value)}
              maxLength={PAMPHLET_TITLE_MAX}
              placeholder="경북 온천 여행"
              hint={`${title.length} / ${PAMPHLET_TITLE_MAX}자`}
            />
            <Input
              label="인원 (선택)"
              type="number"
              inputMode="numeric"
              min={PAMPHLET_PARTY_MIN}
              max={PAMPHLET_PARTY_MAX}
              value={partySize}
              onChange={(event) => setPartySize(event.target.value)}
              placeholder="2"
            />
            <Input
              label="여행일 (선택)"
              type="date"
              value={travelDate}
              onChange={(event) => setTravelDate(event.target.value)}
            />
          </span>
        }
        primaryAction={{
          label: creating ? '만드는 중…' : '만들기',
          onClick: () => void submitPamphlet(),
          disabled: !canSubmit || creating,
        }}
        secondaryAction={{ label: '취소', onClick: () => setFormOpen(false) }}
      />

      <Modal
        open={created !== null}
        onClose={() => setCreated(null)}
        kicker="팜플렛 완성"
        title={created?.title ?? ''}
        description={
          <span className="mt-2 flex flex-col gap-3 text-left">
            <span className="text-text-secondary text-[13px]">
              장소 {created?.placeCount ?? 0}곳이 담겼습니다. 링크로 공유해 보세요.
            </span>
            {/* 링크를 화면에도 그대로 둔다 — 클립보드가 막힌 환경에서도 직접 복사할 수 있게. */}
            <span className="bg-surface-dim text-text-primary rounded-sm px-3 py-2 text-[12px] break-all">
              {created?.shareUrl}
            </span>
          </span>
        }
        primaryAction={{
          label: copied ? '복사했습니다' : '링크 복사',
          onClick: () => void copyShareUrl(),
        }}
        secondaryAction={{ label: '닫기', onClick: () => setCreated(null) }}
      />

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
