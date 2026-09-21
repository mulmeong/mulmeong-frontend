import { useState } from 'react'
import { useNavigate } from 'react-router-dom'

import AuthHeader from '@/features/auth/components/AuthHeader'
import ConditionPanel from '@/features/dart/components/ConditionPanel'
import ResultCard from '@/features/dart/components/ResultCard'
import SaveCompleteModal from '@/features/dart/components/SaveCompleteModal'
import { DEFAULT_CONDITIONS, type DartConditions } from '@/features/dart/constants'
import { useDartOrigins } from '@/features/dart/hooks/useDartOrigins'
import { useDartThrow } from '@/features/dart/hooks/useDartThrow'
import KoreaMap from '@/features/dart/koreaMap/KoreaMap'
import { toResultOnsen } from '@/features/dart/utils/resultOnsen'
import { useOnsenDetail } from '@/features/map/hooks/useOnsenDetail'

export default function DartPage() {
  const navigate = useNavigate()

  const [conditions, setConditions] = useState<DartConditions>(DEFAULT_CONDITIONS)
  // 출발지만 서버 목록에서 고른다. 나머지 조건은 화면 안에서만 정하는 값이다.
  const origins = useDartOrigins()

  const dart = useDartThrow()
  const [savedOpen, setSavedOpen] = useState(false)

  // 추첨 응답에는 사진·수질·요금이 없다. 뽑힌 온천의 상세를 따로 받아 카드를 채운다.
  const place = dart.thrown?.result
  const { detail } = useOnsenDetail(place?.placeId)

  // 상세가 아직이거나 실패해도 카드는 뜬다 — 빈칸만 남는다.
  const onsen = place ? toResultOnsen(place, detail) : null

  const handleThrow = () => {
    if (!origins.selected) return
    void dart.start(origins.selected, conditions)
  }

  return (
    // 지도가 화면을 채워야 해서 RootLayout(max-w-5xl 본문) 밖에 두고 헤더만 직접 쓴다.
    // 시안 기본 자간 -2.2%를 페이지 전체에 건다.
    <div className="flex h-dvh flex-col overflow-hidden tracking-[-0.022em]">
      <AuthHeader />

      <div className="flex min-h-0 flex-1 flex-col lg:flex-row">
        {/*
          다트판이 되는 지도. 시안 map-bg #F2F4F3

          넓은 화면에서는 남는 가로를 전부 쓰고, 좁은 화면에서는 위쪽 32dvh만
          차지한다 — 아래 패널이 조건을 다 보여주고 버튼까지 닿아야 한다.

          안쪽 크기는 따로 잡지 않는다. SVG의 preserveAspectRatio 기본값이
          비율을 지키면서 들어갈 수 있는 최대 크기로 맞추고 가운데 정렬까지 한다.
        */}
        <div className="min-h-0 min-w-0 shrink-0 basis-[32dvh] bg-[#F2F4F3] lg:basis-0 lg:shrink lg:grow">
          {/* 마커는 결과에서 나온다 — 좌표를 따로 들지 않아 둘이 어긋날 일이 없다. */}
          <KoreaMap marker={place} markerLabel={place?.name} />
        </div>

        {/*
          좁은 화면에서는 남는 높이를 전부 받아 안에서 스크롤한다. grow와
          min-h-0이 같이 있어야 한다 — min-h-0이 없으면 내용 높이만큼 부풀어
          화면 밖으로 밀려나고, 부모가 overflow-hidden이라 스크롤도 못 한다.
        */}
        <aside className="flex min-h-0 w-full grow flex-col border-t border-[#E2E5E4] bg-white lg:w-[400px] lg:grow-0 lg:border-t-0 lg:border-l">
          {onsen && place && dart.thrown ? (
            <ResultCard
              onsen={onsen}
              dart={place}
              relaxMessage={dart.thrown.relaxMessage}
              candidateCount={dart.thrown.candidateCount}
              /*
                서버가 준 shareUrl을 그대로 쓰지 않고 dartId로 다시 만든다.
                서버 쪽 주소가 배포 주소와 어긋나 있고(mulmeong.app), 로컬·프리뷰에서
                복사하면 운영 주소가 나와 확인이 안 된다. 지금 열려 있는 주소를
                기준으로 만들면 어디서 복사해도 그 환경으로 열린다.
              */
              shareUrl={`${window.location.origin}/dart/${dart.thrown.dartId}`}
              throwing={dart.loading}
              throwError={dart.error}
              onClose={dart.clear}
              onRethrow={() => void dart.again()}
              // 지도가 이 온천을 고른 상태로 열린다 — MapPage가 ?onsen을 읽어
              // 상세를 받아오고 그 자리로 이동한다.
              onShowOnMap={() => void navigate(`/map?onsen=${place.placeId}`)}
              onSave={() => setSavedOpen(true)}
            />
          ) : (
            <ConditionPanel
              conditions={conditions}
              onChange={setConditions}
              origins={origins.origins}
              origin={origins.selected}
              onOriginChange={origins.select}
              originsError={origins.error}
              throwing={dart.loading}
              throwError={dart.error}
              onThrow={handleThrow}
            />
          )}
        </aside>
      </div>

      <SaveCompleteModal
        open={savedOpen}
        onsenName={place?.name ?? ''}
        onClose={() => setSavedOpen(false)}
        onGoToSaved={() => navigate('/my/saved')}
      />
    </div>
  )
}
