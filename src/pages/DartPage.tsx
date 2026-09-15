import { useState } from 'react'
import { useNavigate } from 'react-router-dom'

import Header from '@/components/ui/Header'
import ConditionPanel from '@/features/dart/components/ConditionPanel'
import ResultCard from '@/features/dart/components/ResultCard'
import SaveCompleteModal from '@/features/dart/components/SaveCompleteModal'
import {
  DEFAULT_CONDITIONS,
  SAMPLE_RESULT,
  type DartConditions,
} from '@/features/dart/constants'
import KoreaMap from '@/features/dart/koreaMap/KoreaMap'

import type { Onsen } from '@/types/onsen'

/** TODO: 조건으로 온천을 걸러 세야 한다. 데이터가 붙기 전까지 시안 값. */
const SAMPLE_CANDIDATE_COUNT = 12

/** TODO: 조건에서 계산해야 한다. 시안 값. */
const SAMPLE_TRAVEL_TIME = '서울에서 3시간 40분'

export default function DartPage() {
  const navigate = useNavigate()

  const [conditions, setConditions] = useState<DartConditions>(DEFAULT_CONDITIONS)
  // null이면 STATE 1(조건 입력), 값이 있으면 STATE 2(결과 카드).
  const [result, setResult] = useState<Onsen | null>(null)
  const [savedOpen, setSavedOpen] = useState(false)

  // TODO: 조건에 맞는 온천 중 하나를 뽑아야 한다. 지금은 고정 값.
  const throwDart = () => setResult(SAMPLE_RESULT)

  return (
    // 지도가 화면을 채워야 해서 RootLayout(max-w-5xl 본문) 밖에 두고 헤더만 직접 쓴다.
    // 시안 기본 자간 -2.2%를 페이지 전체에 건다.
    <div className="flex h-dvh flex-col overflow-hidden tracking-[-0.022em]">
      <Header onAuthClick={() => navigate('/login')} />

      <div className="flex min-h-0 flex-1 flex-col lg:flex-row">
        {/*
          왼쪽: 다트판이 되는 지도. 남는 공간을 전부 쓴다. 시안 map-bg #F2F4F3

          크기를 따로 잡지 않는다 — SVG의 preserveAspectRatio 기본값이
          비율을 지키면서 들어갈 수 있는 최대 크기로 맞추고 가운데 정렬까지 한다.
          그래서 화면이 넓든 낮든 잘리거나 찌그러지지 않는다.
        */}
        <div className="min-h-0 min-w-0 flex-1 bg-[#F2F4F3]">
          {/* 마커는 결과에서 나온다 — 좌표를 따로 들지 않아 둘이 어긋날 일이 없다. */}
          <KoreaMap marker={result} markerLabel={result?.name} />
        </div>

        <aside className="flex w-full shrink-0 flex-col border-t border-[#E2E5E4] bg-white lg:w-[400px] lg:border-t-0 lg:border-l">
          {result ? (
            <ResultCard
              onsen={result}
              travelTime={SAMPLE_TRAVEL_TIME}
              onClose={() => setResult(null)}
              onRethrow={throwDart}
              onShowOnMap={() => navigate('/map')}
              onSave={() => setSavedOpen(true)}
            />
          ) : (
            <ConditionPanel
              conditions={conditions}
              onChange={setConditions}
              candidateCount={SAMPLE_CANDIDATE_COUNT}
              onThrow={throwDart}
            />
          )}
        </aside>
      </div>

      <SaveCompleteModal
        open={savedOpen}
        onsenName={result?.name ?? ''}
        onClose={() => setSavedOpen(false)}
        onGoToSaved={() => navigate('/my/saved')}
      />
    </div>
  )
}
