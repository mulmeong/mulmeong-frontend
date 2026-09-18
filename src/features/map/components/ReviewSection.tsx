import { useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'

import { Button } from '@/components/ui'
import { useAuth } from '@/features/auth/hooks/authContext'
import MockReviewList from '@/features/map/components/MockReviewList'
import ReviewForm from '@/features/map/components/ReviewForm'
import { env } from '@/lib/env'

import type { OnsenListItem } from '@/features/map/api/map'
import type { CreateReviewResult } from '@/types/review'

/** 작성 직후 보상 안내 (REV-06 포도알·레벨). */
function RewardNotice({ result }: { result: CreateReviewResult }) {
  const { reward } = result
  return (
    <div className="border-border-default bg-surface-dim rounded-sm border p-4">
      <p className="text-text-primary text-[14px] font-semibold">리뷰를 남겼어요</p>
      <p className="text-text-secondary mt-1.5 text-[13px] leading-[1.6]">
        {reward.isFirstVisit && reward.regionName
          ? `${reward.regionName} 포도알이 처음 채워졌어요.`
          : '포도알 농도가 진해졌어요.'}
        {reward.levelUp && ` 레벨 ${reward.levelAfter} · ${reward.titleAfter ?? ''}`}
      </p>
      <p className="text-text-secondary mt-1 text-[12px]">
        방문한 온천 {reward.visitedOnsenCount}곳 · 포도알 {reward.grapeCountAfter}개
      </p>
    </div>
  )
}

/** MAP-06 리뷰 작성 진입. 비로그인은 로그인으로 보내되 돌아올 자리를 넘긴다. */
export default function ReviewSection({ onsen }: { onsen: OnsenListItem }) {
  const navigate = useNavigate()
  const location = useLocation()

  const [writing, setWriting] = useState(false)
  const [created, setCreated] = useState<CreateReviewResult>()

  // 토큰 존재 여부가 아니라 세션이 살아 있는지로 판단한다 (만료 토큰 배제).
  const { user } = useAuth()
  const loggedIn = Boolean(user)

  function handleWriteClick() {
    if (!loggedIn) {
      // 돌아올 경로를 넘겨 로그인 후 이 화면으로 되돌린다.
      navigate('/login', { state: { from: `${location.pathname}${location.search}` } })
      return
    }
    setWriting(true)
  }

  if (created) {
    return (
      <div className="flex flex-col gap-5">
        <RewardNotice result={created} />
        {env.useMock && <MockReviewList onsen={onsen} />}
      </div>
    )
  }

  if (writing) {
    return (
      <ReviewForm
        onsenId={onsen.id}
        onCancel={() => setWriting(false)}
        onCreated={(result) => {
          setCreated(result)
          setWriting(false)
        }}
      />
    )
  }

  return (
    <div className="flex flex-col gap-7">
      <div>
        <Button
          hierarchy="secondary"
          onClick={handleWriteClick}
          className="border-border-default hover:bg-surface-dim min-h-11 w-full py-2.5 text-[13px] outline-none focus-visible:ring-1 focus-visible:ring-inverse focus-visible:ring-offset-2"
        >
          리뷰 작성하기
        </Button>

        {!loggedIn && (
          <p className="text-text-secondary mt-2.5 text-center text-[11px] leading-[1.7]">
            리뷰 작성은 로그인이 필요해요.
          </p>
        )}
      </div>

      {env.useMock ? (
        <MockReviewList onsen={onsen} />
      ) : (
        <p className="text-text-secondary text-[13px] leading-[1.6]">아직 리뷰가 없어요.</p>
      )}
    </div>
  )
}
