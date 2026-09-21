import { Link, useNavigate, useParams } from 'react-router-dom'

import AuthHeader from '@/features/auth/components/AuthHeader'
import ResultCard from '@/features/dart/components/ResultCard'
import { useSharedDart, type SharedDartProblem } from '@/features/dart/hooks/useSharedDart'
import KoreaMap from '@/features/dart/koreaMap/KoreaMap'
import { toResultOnsen } from '@/features/dart/utils/resultOnsen'
import { useOnsenDetail } from '@/features/map/hooks/useOnsenDetail'

import type { SharedDart } from '@/types/dart'

const TRANSPORT_LABELS = { TRANSIT: '대중교통', CAR: '자동차' }
const TRIP_LABELS = { DAY: '당일치기', OVERNIGHT: '1박 이상' }

const PROBLEM_TEXT: Record<SharedDartProblem, { title: string; body: string }> = {
  expired: {
    title: '만료된 다트예요',
    body: '다트 결과는 30일 동안만 볼 수 있어요. 직접 던져서 새 결과를 받아보세요.',
  },
  notFound: {
    title: '없는 링크예요',
    body: '주소가 잘못됐거나 지워진 다트입니다.',
  },
  error: {
    title: '다트를 불러오지 못했어요',
    body: '잠시 후 다시 열어보세요.',
  },
}

/** 조건을 한 줄로 — '서울역에서 · 대중교통 · 3시간 이내 · 당일치기' */
function conditionText(conditions: SharedDart['conditions']): string {
  return [
    `${conditions.originLabel}에서`,
    TRANSPORT_LABELS[conditions.transport],
    conditions.maxDurationMin ? `${conditions.maxDurationMin}분 이내` : '시간 무관',
    TRIP_LABELS[conditions.tripType],
  ].join(' · ')
}

function Problem({ problem }: { problem: SharedDartProblem }) {
  const { title, body } = PROBLEM_TEXT[problem]

  return (
    <div className="flex min-h-0 flex-1 flex-col items-center justify-center gap-3 px-6 text-center">
      <p className="text-[24px] font-bold tracking-[-0.03em] text-[#0E1513]">{title}</p>
      <p className="text-[13.5px] leading-[1.8] text-[#5D6764]">{body}</p>
      <Link to="/dart" className="mt-2 bg-[#0E1513] px-5 py-3.5 text-[14px] font-bold text-white">
        다트 던지러 가기
      </Link>
    </div>
  )
}

/** DART-06 공유된 다트 결과. 로그인 없이 볼 수 있다. */
export default function SharedDartPage() {
  const { dartId = '' } = useParams()
  const navigate = useNavigate()

  const { dart, problem, loading } = useSharedDart(dartId)

  // 공유 응답에는 온천 요약만 있다. 카드를 채우려면 상세를 따로 받아야 한다.
  const { detail } = useOnsenDetail(dart?.result.onsenId)

  const onsen = dart
    ? toResultOnsen(
        {
          placeId: dart.result.onsenId,
          name: dart.result.name,
          sido: dart.result.sido,
          lat: dart.result.lat,
          lng: dart.result.lng,
          thumbnail: dart.result.thumbnail,
        },
        detail,
      )
    : null

  return (
    // 다트 화면과 같은 배치 — 왼쪽 지도 + 오른쪽 400px 패널.
    <div className="flex h-dvh flex-col overflow-hidden tracking-[-0.022em]">
      <AuthHeader />

      <div className="flex min-h-0 flex-1 flex-col lg:flex-row">
        {/* 좁은 화면에서는 위쪽 32dvh만 쓴다 — 다트 화면과 같은 배치다. */}
        <div className="min-h-0 min-w-0 shrink-0 basis-[32dvh] bg-[#F2F4F3] lg:basis-0 lg:shrink lg:grow">
          <KoreaMap marker={dart?.result} markerLabel={dart?.result.name} />
        </div>

        <aside className="flex min-h-0 w-full grow flex-col border-t border-[#E2E5E4] bg-white lg:w-[400px] lg:grow-0 lg:border-t-0 lg:border-l">
          {loading ? (
            <p role="status" className="px-[30px] py-8 text-[13px] text-[#8A9491]">
              불러오는 중…
            </p>
          ) : problem || !dart || !onsen ? (
            <Problem problem={problem ?? 'error'} />
          ) : (
            <>
              <div className="flex flex-none flex-col gap-1 border-b border-[#E2E5E4] px-[30px] pt-6 pb-4">
                <span className="text-[11.5px] font-bold tracking-[0.14em] text-[#8A9491]">
                  {dart.thrownBy}님이 뽑은 온천
                </span>
                <span className="text-[12.5px] leading-[1.7] text-[#5D6764]">
                  {conditionText(dart.conditions)}
                </span>
                {/* 몇 번 만에 나온 결과인지. 한 번에 나왔으면 굳이 적지 않는다. */}
                {dart.throwCount > 1 && (
                  <span className="text-[11.5px] text-[#8A9491]">
                    {dart.throwCount}번째 던진 결과예요
                  </span>
                )}
              </div>

              {/* 카드가 남는 높이를 쓰도록 감싼다 — 위아래 줄과 형제라 h-full만으로는 넘친다. */}
              <div className="min-h-0 flex-1">
                <ResultCard
                  onsen={onsen}
                  dart={{ estimatedMinutes: dart.result.estimatedMinutes }}
                  shareUrl={window.location.href}
                  onShowOnMap={() => void navigate(`/map?onsen=${dart.result.onsenId}`)}
                  /*
                    다시 던지기는 넘기지 않는다. 공유받은 사람은 던질 수 없고,
                    본인이라 해도 이 응답에는 출발지 좌표가 없어서 (originLabel만
                    온다) 같은 조건으로 재추첨을 보낼 수 없다. 대신 아래에 다트
                    화면으로 가는 자리를 둔다.
                  */
                />
              </div>

              {dart.isMine && (
                <Link
                  to="/dart"
                  className="flex-none border-t border-[#E2E5E4] px-[30px] py-3.5 text-center text-[13px] text-[#0E1513]"
                >
                  조건을 정해 다시 던지기 →
                </Link>
              )}
            </>
          )}
        </aside>
      </div>
    </div>
  )
}
