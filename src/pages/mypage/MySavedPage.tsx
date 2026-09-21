import { useState } from 'react'
import { useNavigate, useOutletContext } from 'react-router-dom'

import { ApiError } from '@/api'
import Button from '@/components/ui/Button'
import Chip from '@/components/ui/Chip'
import Input from '@/components/ui/Input'
import Modal from '@/components/ui/Modal'
import { useFavorites } from '@/features/favorites/FavoritesProvider'
import { createPamphlet, fetchPamphletDetail } from '@/features/mypage/api/pamphlets'
import type { MyPageOutletContext } from '@/features/mypage/components/MyPageLayout'
import PamphletCreateFlow from '@/features/mypage/components/PamphletCreateFlow'
import SavedPlaceItem from '@/features/mypage/components/SavedPlaceItem'
import { useInfiniteScroll } from '@/features/mypage/hooks/useInfiniteScroll'
import { useSavedPlaces } from '@/features/mypage/hooks/useSavedPlaces'

import {
  PAMPHLET_PARTY_MAX,
  PAMPHLET_PARTY_MIN,
  PAMPHLET_PLACE_MAX,
  PAMPHLET_TITLE_MAX,
  type CreatedPamphlet,
  type PamphletDetail,
} from '@/types/pamphlet'
import type { PoiFilterId } from '@/types/poi'
import {
  SAVED_CATEGORIES,
  SAVED_PAGE_SIZE,
  SAVED_SORTS,
  type SavedCategory,
  type SavedPlace,
  type SavedSort,
} from '@/types/saved'

/**
 * 찜 카테고리 -> 지도의 POI 갈래.
 *
 * 관광지는 지도 쪽에서 문화·레저·쇼핑·축제를 '볼거리·즐길거리' 하나로 묶어 둬서
 * 거기에 붙인다. 기타(etc)는 맞는 갈래가 없어 좌표만 넘긴다.
 */
const POI_FILTER_BY_CATEGORY: Partial<Record<SavedCategory, PoiFilterId>> = {
  restaurant: 'RESTAURANT',
  cafe: 'CAFE',
  attraction: 'SIGHTS',
}

/** 찜한 장소 · 담당: 예린 */
export default function MySavedPage() {
  const navigate = useNavigate()
  const favorites = useFavorites()
  // 팜플렛을 만들면 헤더의 팜플렛 수가 늘어난다. 헤더는 탭 바깥이라 직접 불러줘야 한다.
  const { reloadProfile } = useOutletContext<MyPageOutletContext>()

  const [sort, setSort] = useState<SavedSort>('RECENT')
  const [category, setCategory] = useState<SavedCategory | 'all'>('all')
  /** 지금까지 펼쳐 보여줄 개수. 바닥에 닿을 때마다 늘어난다. */
  const [limit, setLimit] = useState(SAVED_PAGE_SIZE)
  const { data, loading, error, reload } = useSavedPlaces(sort, category, limit)

  const sentinelRef = useInfiniteScroll(
    () => setLimit((current) => current + SAVED_PAGE_SIZE),
    Boolean(data?.hasMore) && !loading,
  )

  /**
   * 팜플렛으로 묶을 장소. 조건을 바꿔도 유지한다 —
   * 고른 곳이 지금 보이는 목록 밖으로 밀려나도 선택은 살아 있어야 한다.
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
  /**
   * 만들기 흐름. 띄워두는 동안 엮는 중 → 표지 → 펼침 → 미리보기로 이어진다.
   * placeCount는 만들어지기 전 '엮는 중' 문구에 쓰므로 시작할 때 박아둔다.
   */
  const [flow, setFlow] = useState<{
    placeCount: number
    created?: CreatedPamphlet
    detail?: PamphletDetail
    error?: string
  } | null>(null)

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
    // flow가 있으면 이미 만드는 중이다 — 두 번 눌러도 한 번만 나간다.
    if (!canSubmit || flow) return

    const placeIds = [...selected]
    setFormOpen(false)
    setActionError(undefined)
    setFlow({ placeCount: placeIds.length })

    try {
      const created = await createPamphlet({
        title: title.trim(),
        // 안 채운 항목은 빈 값 대신 아예 뺀다 — 서버가 400으로 막는다.
        partySize: partySize ? Number(partySize) : undefined,
        travelDate: travelDate || undefined,
        // Set은 넣은 순서를 지킨다. 고른 순서가 그대로 팜플렛 순서가 된다.
        placeIds,
      })

      // 만들고 나면 선택을 푼다 — 같은 묶음을 실수로 두 번 만들지 않게.
      setSelected(new Set())
      // 헤더의 팜플렛 수를 맞춘다.
      reloadProfile()

      // 만들기 응답에는 장소가 없다. 미리보기에 보여줄 내용은 상세에만 있다.
      const detail = await fetchPamphletDetail(created.pamphletId)
      setFlow((current) => (current ? { ...current, created, detail } : current))
    } catch (cause) {
      const message = cause instanceof ApiError ? cause.message : '팜플렛을 만들지 못했습니다.'
      setFlow((current) => (current ? { ...current, error: message } : current))
    }
  }

  const handleSort = (next: SavedSort) => {
    setSort(next)
    // 순서가 바뀌면 지금 펼쳐둔 만큼이 다른 목록이 된다. 처음부터 다시 쌓는다.
    setLimit(SAVED_PAGE_SIZE)
  }

  const handleCategory = (next: SavedCategory | 'all') => {
    setCategory(next)
    setLimit(SAVED_PAGE_SIZE)
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
    // 온천은 전용 통로가 있다 — 지도가 상세까지 열어준다.
    if (place.placeType === 'ONSEN' || !place.placeType) {
      void navigate(`/map?onsen=${place.onsenId}`)
      return
    }

    if (place.lat === undefined || place.lng === undefined) return

    /*
      온천 아닌 장소는 지도에 띄울 전용 통로가 없다. 좌표로 옮기고, 그 종류의
      POI 갈래를 켜서 마커가 보이게 한다 — 그러면 넘어가자마자 찾던 가게가
      화면 가운데에 찍혀 있다.

      그 한 곳만 콕 집어 열어주지는 못한다. 찜 응답에 externalId가 없어서
      지도의 POI와 짝지을 값이 없다.
    */
    const params = new URLSearchParams({ lat: String(place.lat), lng: String(place.lng) })
    const poi = POI_FILTER_BY_CATEGORY[place.category]
    if (poi) params.set('poi', poi)

    void navigate(`/map?${params.toString()}`)
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
              variant="plain"
              selected={option.id === sort}
              onClick={() => handleSort(option.id)}
            >
              {option.label}
            </Chip>
          ))}
        </div>

        {/*
          좁은 화면에서는 이 두 개가 통째로 아랫줄로 내려간다(w-full). 정렬 칩과
          한 줄에 욱여넣으면 버튼이 눌려서 글자가 잘린다.
        */}
        <div className="flex w-full items-center justify-end gap-3 sm:ml-auto sm:w-auto">
          <button
            type="button"
            onClick={() => setSelected(new Set())}
            disabled={selected.size === 0}
            className="text-text-secondary hover:text-text-primary shrink-0 text-[13px] disabled:cursor-not-allowed disabled:opacity-40"
          >
            선택 해제
          </button>

          {/* 같은 줄의 칩(py-2 / 13px)과 높이를 맞춘다 — Button 기본값은 한 단계 커서 혼자 튄다. */}
          <Button
            onClick={openForm}
            disabled={selected.size === 0 || tooMany || flow !== null}
            className="px-4 py-2 text-[13px]"
          >
            선택 {selected.size}곳으로 팜플렛 만들기
          </Button>
        </div>

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
          <Chip variant="plain" selected={category === 'all'} onClick={() => handleCategory('all')}>
            전체 {data?.counts.all ?? 0}
          </Chip>
          {shownCategories.map((option) => (
            <Chip
              key={option.id}
              variant="plain"
              selected={option.id === category}
              onClick={() => handleCategory(option.id)}
            >
              {option.label} {data?.counts[option.id] ?? 0}
            </Chip>
          ))}
        </div>
      )}

      {/* 목록 자리를 미리 잡아둔다 — 불러오는 동안 아래 문구가 뛰지 않게. */}
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

      {/*
        바닥 표식. 여기가 화면에 들어오면 다음 묶음을 펼친다.
        목록 안이 아니라 밖에 둬서 divide 선이 하나 더 그어지지 않게 한다.
      */}
      {data?.hasMore && <div ref={sentinelRef} aria-hidden="true" className="h-px" />}

      <div className="mt-6 flex flex-col items-center gap-3">
        {data?.hasMore && (
          <p role="status" className="text-text-secondary text-[12px]">
            불러오는 중…
          </p>
        )}
        <p className="text-text-secondary text-[12px]">
          찜한 장소를 골라 팜플렛으로 만들어 보세요.
        </p>
      </div>

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
          label: '만들기',
          onClick: () => void submitPamphlet(),
          disabled: !canSubmit,
        }}
        secondaryAction={{ label: '취소', onClick: () => setFormOpen(false) }}
      />

      {/* 만든 뒤에도 페이지를 옮기지 않는다 — 결과를 먼저 보고 이동은 사용자가 고른다. */}
      {flow && (
        <PamphletCreateFlow
          placeCount={flow.placeCount}
          created={flow.created}
          detail={flow.detail}
          error={flow.error}
          onClose={() => setFlow(null)}
          onManage={(pamphletId) => {
            setFlow(null)
            // new는 목록으로 돌아갔을 때 방금 만든 카드를 짚어주는 데 쓴다.
            void navigate(`/my/pamphlets?pamphlet=${pamphletId}&new=${pamphletId}`)
          }}
          onRetry={() => {
            setFlow(null)
            setFormOpen(true)
          }}
        />
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
