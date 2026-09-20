import Button from '@/components/ui/Button'
import RoutePlaceInput from '@/features/map/components/RoutePlaceInput'
import {
  formatRouteDistance,
  formatRouteDuration,
  TRAVEL_MODES,
} from '@/features/map/types/directions'
import { cn } from '@/lib/cn'
import { env } from '@/lib/env'
import { kakaoDirectionsUrl } from '@/features/map/utils/kakaoDirectionsUrl'

import type { useDirections } from '@/features/map/hooks/useDirections'

export default function DirectionsPanel({
  directions,
}: {
  directions: ReturnType<typeof useDirections>
}) {
  const { origin, destination, mode, loading, error, locating, result, selectedRoute } = directions

  return (
    <div className="bg-surface scrollbar-thin h-full min-h-0 overflow-y-auto overscroll-contain px-5 pb-6">
      <form
        onSubmit={(event) => {
          event.preventDefault()
          directions.search()
        }}
      >
        <div className="mb-5 flex items-center justify-between gap-3">
          <h2 className="text-text-primary text-[15px] font-semibold">온천까지 가는 길</h2>
          <button
            type="button"
            onClick={directions.reset}
            className="text-text-secondary text-[11px] underline-offset-4 hover:underline"
          >
            입력 초기화
          </button>
        </div>
        {!env.useMock && (
          <p className="text-text-secondary mb-3 text-[11px] leading-5">
            온천 이름으로 검색하거나 현재 위치에서 출발해 보세요.
          </p>
        )}
        <RoutePlaceInput
          label="출발지"
          value={origin}
          onChange={(value) => directions.updateField('origin', value)}
        />
        <div className="flex items-center justify-between py-1.5">
          <button
            type="button"
            disabled={locating}
            onClick={directions.useCurrentLocation}
            className="text-text-secondary py-1 text-[11px] hover:text-text-primary disabled:opacity-50"
          >
            {locating ? '현재 위치 확인 중…' : '현재 위치에서 출발'}
          </button>
          <button
            type="button"
            onClick={directions.swap}
            aria-label="출발지와 도착지 바꾸기"
            className="border-border-default hover:bg-surface-dim flex size-8 items-center justify-center rounded-full border"
          >
            <svg
              aria-hidden
              viewBox="0 0 24 24"
              className="size-4"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M8 19V5m-4 4 4-4 4 4m4-4v14m-4-4 4 4 4-4" />
            </svg>
          </button>
        </div>
        <RoutePlaceInput
          label="도착지"
          value={destination}
          onChange={(value) => directions.updateField('destination', value)}
        />

        <div
          role="group"
          aria-label="이동 수단"
          className="bg-surface-dim mt-5 flex rounded-sm p-1"
        >
          {TRAVEL_MODES.map((item) => (
            <button
              key={item.value}
              type="button"
              aria-pressed={mode === item.value}
              onClick={() => directions.changeMode(item.value)}
              className={cn(
                'flex-1 rounded-sm py-2 text-[12px] transition-colors',
                mode === item.value
                  ? 'bg-inverse text-text-inverse font-medium'
                  : 'text-text-secondary hover:text-text-primary',
              )}
            >
              {item.label}
            </button>
          ))}
        </div>
        <Button type="submit" disabled={loading || locating} className="mt-3 w-full">
          {loading ? '경로 찾는 중…' : '경로 찾기'}
        </Button>
        {error && (
          <p role="alert" className="text-danger mt-3 text-[12px] leading-relaxed">
            {error}
          </p>
        )}
      </form>

      <section aria-label="경로 결과" aria-live="polite" aria-busy={loading} className="mt-6">
        {!result && !loading && !error && (
          <p className="text-text-secondary text-[12px] leading-6">
            출발지와 도착지를 선택해 주세요.
            <br />
            지도에서 온천을 눌러 도착지로 정할 수도 있어요.
          </p>
        )}
        {result?.preview && (
          <p className="border-border-default text-text-secondary mb-4 border-y py-3 text-[11px] leading-5">
            미리보기 경로 · 실제 길안내가 아닙니다.
            <br />
            경로와 소요 시간은 화면 확인용 예시입니다.
          </p>
        )}
        {result && !result.routes.length && (
          <div className="text-text-secondary text-[13px] leading-6">
            <p>
              이 이동 수단으로 표시할 경로가 없어요.
              <br />
              다른 이동 수단이나 장소를 선택해 주세요.
            </p>
            {result.routeNotFound && (
              <a
                href={kakaoDirectionsUrl(result)}
                target="_blank"
                rel="noopener noreferrer"
                className="text-text-primary mt-3 inline-block underline underline-offset-4"
              >
                카카오맵에서 경로 확인 ↗
              </a>
            )}
          </div>
        )}
        {result && result.routes.length > 0 && (
          <>
            <div className="mb-3 flex items-baseline justify-between">
              <h3 className="text-[13px] font-medium">
                {TRAVEL_MODES.find((item) => item.value === mode)?.label} 경로
              </h3>
              <span className="text-text-secondary text-[11px]">{result.routes.length}개</span>
            </div>
            <ul className="space-y-2">
              {result.routes.map((route) => (
                <li key={route.id}>
                  <button
                    type="button"
                    aria-pressed={route.id === selectedRoute?.id}
                    onClick={() => directions.selectRoute(route.id)}
                    className={cn(
                      'w-full rounded-sm border p-4 text-left transition-colors',
                      route.id === selectedRoute?.id
                        ? 'border-text-primary bg-surface-dim'
                        : 'border-border-default hover:bg-surface-dim',
                    )}
                  >
                    <span className="text-text-secondary block text-[11px]">{route.label}</span>
                    <span className="mt-1 flex items-baseline gap-2">
                      <strong className="text-[21px] font-semibold tabular-nums">
                        {formatRouteDuration(route.durationSeconds)}
                      </strong>
                      <span className="text-text-secondary text-[12px]">
                        {formatRouteDistance(route.distanceMeters)}
                      </span>
                    </span>
                    {route.walkTimeExcluded && (
                      <span className="text-text-secondary mt-2 block text-[12px]">
                        도보 시간 제외
                      </span>
                    )}
                    {route.transitDurationSeconds !== undefined &&
                      route.walkDurationSeconds !== undefined && (
                        <span className="text-text-secondary mt-2 block text-[11px]">
                          대중교통 {formatRouteDuration(route.transitDurationSeconds)} · 도보{' '}
                          {formatRouteDuration(route.walkDurationSeconds)}
                        </span>
                      )}
                    {route.fare !== undefined && (
                      <span className="text-text-secondary mt-1 block text-[12px]">
                        요금 {route.fare.toLocaleString('ko-KR')}원
                      </span>
                    )}
                  </button>
                </li>
              ))}
            </ul>
            {selectedRoute && selectedRoute.path.length < 2 && (
              <p className="text-text-secondary mt-3 text-[12px]">
                지도에는 출발지와 도착지만 표시됩니다.
                <a
                  href={kakaoDirectionsUrl(result)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-text-primary mt-2 block underline underline-offset-4"
                >
                  카카오맵에서 실제 경로 확인
                </a>
              </p>
            )}
            {selectedRoute && (
              <ol
                aria-label="이동 순서"
                className="border-border-default mt-5 space-y-4 border-l pl-4 text-[12px]"
              >
                <li>
                  <span className="text-text-secondary mr-2 text-[11px]">출발</span>
                  {result.origin.name}
                </li>
                {selectedRoute.legs.map((leg, index) => (
                  <li key={index} className="text-text-secondary flex justify-between gap-3">
                    <span>{leg.label}</span>
                    <span className="shrink-0 tabular-nums">
                      {formatRouteDuration(leg.durationSeconds)}
                    </span>
                  </li>
                ))}
                <li>
                  <span className="text-text-secondary mr-2 text-[11px]">도착</span>
                  {result.destination.name}
                </li>
              </ol>
            )}
          </>
        )}
      </section>
    </div>
  )
}
